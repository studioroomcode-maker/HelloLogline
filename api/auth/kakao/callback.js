import { rcall, grantInitialCredits } from "../../_redis.js";
import { verifyState, clearStateCookieHeader } from "../_csrf.js";
import { issueToken, setAuthCookie, frontendBase } from "../_jwt.js";

export default async function handler(req, res) {
  const { code, state } = req.query;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const base = frontendBase(req);
  const errUrl = `${base}/?auth_error=kakao`;

  res.setHeader("Set-Cookie", clearStateCookieHeader());

  if (!code) return res.redirect(errUrl);
  if (!verifyState(state, req.headers.cookie || "")) return res.redirect(`${base}/?auth_error=csrf`);

  try {
    const redirectUri = `${proto}://${host}/auth/kakao/callback`;
    const clientId = (process.env.KAKAO_REST_API_KEY || "").trim();

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      }),
    });
    const td = await tokenRes.json();
    if (td.error) {
      console.error("[Kakao token error]", JSON.stringify(td), "| redirectUri:", redirectUri, "| clientId:", clientId ? clientId.slice(0, 6) + "…" : "(empty)");
      throw new Error(td.error_description || td.error);
    }

    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${td.access_token}` },
    });
    const ud = await userRes.json();

    const user = {
      id: `kakao_${ud.id}`,
      provider: "kakao",
      name: ud.kakao_account?.profile?.nickname || "카카오 사용자",
      email: ud.kakao_account?.email || "",
      avatar: ud.kakao_account?.profile?.profile_image_url || "",
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
    console.error("[Kakao callback error]", err.message, "| proto:", proto, "| host:", host);
    res.redirect(errUrl);
  }
}
