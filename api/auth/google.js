import { generateState, stateCookieHeader } from "./_csrf.js";

export default function handler(req, res) {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const redirectUri = `${proto}://${host}/auth/google/callback`;
  const state = generateState();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
  });
  res.setHeader("Set-Cookie", stateCookieHeader(state, proto));
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
