import { createHmac } from "crypto";

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
  const { code } = req.query;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const frontendBase = (process.env.FRONTEND_URL || `${proto}://${host}`).trim();
  const errUrl = `${frontendBase}/?auth_error=google`;

  if (!code) return res.redirect(errUrl);

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
    res.redirect(`${frontendBase}/?auth_token=${token}`);
  } catch (err) {
    console.error("[Google callback]", err.message);
    res.redirect(errUrl);
  }
}
