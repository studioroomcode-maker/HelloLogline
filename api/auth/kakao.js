import { generateState, stateCookieHeader } from "./_csrf.js";

export default function handler(req, res) {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const clientId = (process.env.KAKAO_REST_API_KEY || "").trim();
  const redirectUri = `${proto}://${host}/auth/kakao/callback`;
  const state = generateState();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });
  res.setHeader("Set-Cookie", stateCookieHeader(state, proto));
  res.redirect(`https://kauth.kakao.com/oauth/authorize?${params}`);
}
