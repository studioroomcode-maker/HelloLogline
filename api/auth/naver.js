export default function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const redirectUri = `${proto}://${host}/auth/naver/callback`;
  const state = Math.random().toString(36).slice(2, 10);
  const params = new URLSearchParams({
    client_id: process.env.NAVER_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });
  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params}`);
}
