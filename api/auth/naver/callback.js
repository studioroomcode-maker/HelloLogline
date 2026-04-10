import { callbackUri, issueToken, frontendRedirect } from "../_jwt.js";

export default async function handler(req, res) {
  const { code, state } = req.query;
  const errUrl = `${process.env.FRONTEND_URL || ""}/?auth_error=naver`;
  if (!code) return res.redirect(errUrl);

  try {
    const redirectUri = callbackUri(req, "naver");
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
    if (td.error) throw new Error(td.error_description);

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
    res.redirect(frontendRedirect(issueToken(user)));
  } catch (err) {
    console.error("[Naver callback]", err.message);
    res.redirect(errUrl);
  }
}
