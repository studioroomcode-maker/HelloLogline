import { callbackUri } from "./_jwt.js";

export default function handler(req, res) {
  const redirectUri = callbackUri(req, "google");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
