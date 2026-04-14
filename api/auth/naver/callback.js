import { rcall, grantInitialCredits } from "../../_redis.js";
import { verifyState, clearStateCookieHeader } from "../_csrf.js";
import { issueToken, setAuthCookie, frontendBase } from "../_jwt.js";

export default async function handler(req, res) {
  const { code, state } = req.query;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const base = frontendBase(req);
  const errUrl = `${base}/?auth_error=naver`;

  res.setHeader("Set-Cookie", clearStateCookieHeader());

  if (!code) return res.redirect(errUrl);
  if (!verifyState(state, req.headers.cookie || "")) return res.redirect(`${base}/?auth_error=csrf`);

  try {
    const redirectUri = `${proto}://${host}/auth/naver/callback`;
    const clientId = (process.env.NAVER_CLIENT_ID || "").trim();
    const clientSecret = (process.env.NAVER_CLIENT_SECRET || "").trim();

    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
      }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description || td.error);

    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${td.access_token}` },
    });
    const ud = await userRes.json();
    const profile = ud.response || {};

    const user = {
      id: `naver_${profile.id}`,
      provider: "naver",
      name: profile.name || profile.nickname || "네이버 사용자",
      email: profile.email || "",
      avatar: profile.profile_image || "",
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
    console.error("[Naver callback]", err.message);
    res.redirect(errUrl);
  }
}
