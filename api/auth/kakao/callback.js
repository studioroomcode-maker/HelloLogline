import { createHmac } from "crypto";
import { rcall } from "../../_redis.js";
import { verifyState, clearStateCookieHeader } from "../_csrf.js";

const SECRET = (process.env.JWT_SECRET || "hll-jwt-fallback-secret").trim();

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function issueToken(payload) {
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const body = b64url({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
  });
  const sig = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export default async function handler(req, res) {
  const { code, state } = req.query;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const frontendBase = (process.env.FRONTEND_URL || `${proto}://${host}`).trim();
  const errUrl = `${frontendBase}/?auth_error=kakao`;

  res.setHeader("Set-Cookie", clearStateCookieHeader());

  if (!code) return res.redirect(errUrl);
  if (!verifyState(state, req.headers.cookie || "")) return res.redirect(`${frontendBase}/?auth_error=csrf`);

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
    }
    res.redirect(`${frontendBase}/?auth_token=${token}`);
  } catch (err) {
    console.error("[Kakao callback error]", err.message, "| proto:", proto, "| host:", host);
    res.redirect(errUrl);
  }
}
