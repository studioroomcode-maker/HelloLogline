export default function handler(req, res) {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const clientId = (process.env.KAKAO_REST_API_KEY || "").trim();
  const redirectUri = `${proto}://${host}/auth/kakao/callback`;
  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  res.redirect(url);
}
