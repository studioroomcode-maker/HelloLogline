import { callbackUri, issueToken, frontendRedirect } from "../_jwt.js";

export default async function handler(req, res) {
  const { code } = req.query;
  const errUrl = `${process.env.FRONTEND_URL || ""}/?auth_error=google`;
  if (!code) return res.redirect(errUrl);

  try {
    const redirectUri = callbackUri(req, "google");
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description);

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
    res.redirect(frontendRedirect(issueToken(user)));
  } catch (err) {
    console.error("[Google callback]", err.message);
    res.redirect(errUrl);
  }
}
