import { rcall, grantInitialCredits } from "../../_redis.js";
import { verifyState, clearStateCookieHeader } from "../_csrf.js";
import { issueToken, setAuthCookie, frontendBase } from "../_jwt.js";

export default async function handler(req, res) {
  const { code, state } = req.query;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const base = frontendBase(req);
  const errUrl = `${base}/?auth_error=google`;

  res.setHeader("Set-Cookie", clearStateCookieHeader());

  if (!code) return res.redirect(errUrl);
  if (!verifyState(state, req.headers.cookie || "")) return res.redirect(`${base}/?auth_error=csrf`);

  try {
    const redirectUri = `${proto}://${host}/auth/google/callback`;
    const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description || td.error);

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${td.access_token}` },
    });
    const ud = await userRes.json();

    const user = {
      id: `google_${ud.sub}`,
      provider: "google",
      name: ud.name || "Google 사용자",
      email: ud.email || "",
      avatar: ud.picture || "",
    };

    const token = issueToken(user);
    if (user.email) {
      const info = JSON.stringify({ name: user.name, provider: user.provider, avatar: user.avatar, lastSeen: Date.now() });
      await Promise.all([
        rcall("sadd", "hll:users", user.email.toLowerCase()),
        rcall("set", `hll:user:${user.email.toLowerCase()}`, info),
      ]);
      await grantInitialCredits(user.email.toLowerCase());
    }
    setAuthCookie(res, token, proto);
    res.redirect(`${base}/?login=success`);
  } catch (err) {
    console.error("[Google callback]", err.message);
    res.redirect(errUrl);
  }
}
