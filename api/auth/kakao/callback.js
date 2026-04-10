import { callbackUri, issueToken, frontendRedirect } from "../_jwt.js";

export default async function handler(req, res) {
  const { code } = req.query;
  const errUrl = `${process.env.FRONTEND_URL || ""}/?auth_error=kakao`;
  if (!code) return res.redirect(errUrl);

  try {
    const redirectUri = callbackUri(req, "kakao");
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
    if (td.error) throw new Error(td.error_description);

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
    res.redirect(frontendRedirect(issueToken(user)));
  } catch (err) {
    console.error("[Kakao callback]", err.message);
    res.redirect(errUrl);
  }
}
