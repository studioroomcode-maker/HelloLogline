import { generateState, stateCookieHeader } from "./_csrf.js";

function isWebView(ua = "") {
  return (
    /FBAN|FBAV|Instagram|Twitter|Line\/|KakaoTalk|NaverApp|Electron/i.test(ua) ||
    /\bwv\b/.test(ua) ||
    (/Android/.test(ua) && !/Chrome\//.test(ua)) ||
    (/iPhone|iPad/.test(ua) && !/Safari\//.test(ua))
  );
}

export default function handler(req, res) {
  const ua = req.headers["user-agent"] || "";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();

  if (isWebView(ua)) {
    const currentUrl = `${proto}://${host}/auth/google`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>브라우저에서 열기</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f8f8; padding: 24px; box-sizing: border-box; }
  .card { background: #fff; border-radius: 16px; padding: 32px 24px; text-align: center; max-width: 360px; width: 100%; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
  h2 { font-size: 18px; margin: 0 0 12px; color: #111; }
  p { font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px; }
  a.btn { display: block; background: #4285f4; color: #fff; text-decoration: none; border-radius: 8px; padding: 14px 20px; font-size: 15px; font-weight: 600; }
  .hint { font-size: 12px; color: #999; margin-top: 16px; }
</style>
</head>
<body>
<div class="card">
  <h2>외부 브라우저에서 열어주세요</h2>
  <p>Google 로그인은 카카오톡·인스타그램 등<br>인앱 브라우저에서 지원되지 않습니다.</p>
  <a class="btn" href="${currentUrl}" target="_blank" rel="noopener">Safari / Chrome으로 열기</a>
  <p class="hint">링크를 길게 눌러 '외부 브라우저로 열기'를 선택하세요.</p>
</div>
</body>
</html>`);
  }

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
