import { createHmac } from "crypto";

const SECRET = process.env.JWT_SECRET || "hll-jwt-fallback-secret";

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
  const sig = createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export default async function handler(req, res) {
  const { code } = req.query;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const frontendBase = process.env.FRONTEND_URL || `${proto}://${host}`;
  const errUrl = `${frontendBase}/?auth_error=kakao`;

  if (!code) return res.redirect(errUrl);

  try {
    const redirectUri = `${proto}://${host}/auth/kakao/callback`;

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: redirectUri,
        code,
      }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description || td.error);

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
    res.redirect(`${frontendBase}/?auth_token=${token}`);
  } catch (err) {
    console.error("[Kakao callback]", err.message);
    res.redirect(errUrl);
  }
}
