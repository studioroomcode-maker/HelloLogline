import { callbackUri } from "./_jwt.js";

export default function handler(req, res) {
  const redirectUri = callbackUri(req, "naver");
  const state = Math.random().toString(36).slice(2, 10);
  const params = new URLSearchParams({
    client_id: process.env.NAVER_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });
  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params}`);
}
