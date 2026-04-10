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
  const { code, state } = req.query;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const frontendBase = process.env.FRONTEND_URL || `${proto}://${host}`;
  const errUrl = `${frontendBase}/?auth_error=naver`;

  if (!code) return res.redirect(errUrl);

  try {
    const redirectUri = `${proto}://${host}/auth/naver/callback`;

    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
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
    res.redirect(`${frontendBase}/?auth_token=${token}`);
  } catch (err) {
    console.error("[Naver callback]", err.message);
    res.redirect(errUrl);
  }
}
