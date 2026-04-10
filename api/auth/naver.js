export default function handler(req, res) {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const clientId = (process.env.NAVER_CLIENT_ID || "").trim();
  const redirectUri = `${proto}://${host}/auth/naver/callback`;
  const state = Math.random().toString(36).slice(2, 10);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });
  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params}`);
}
