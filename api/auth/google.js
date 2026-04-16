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
    const isAndroid = /Android/i.test(ua);
    // Android: intent URI opens in default browser; iOS: clipboard copy + guide
    const intentUrl = `intent://${host}/auth/google#Intent;scheme=${proto};action=android.intent.action.VIEW;end`;
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
  p { font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px; }
  .btn { display: block; background: #4285f4; color: #fff; text-decoration: none; border-radius: 8px; padding: 14px 20px; font-size: 15px; font-weight: 600; border: none; cursor: pointer; width: 100%; }
  .btn-copy { background: #333; margin-top: 10px; }
  .hint { font-size: 12px; color: #999; margin-top: 16px; line-height: 1.6; }
  #copied { display: none; font-size: 13px; color: #4caf50; margin-top: 10px; font-weight: 600; }
</style>
</head>
<body>
<div class="card">
  <h2>외부 브라우저에서 열어주세요</h2>
  <p>Google 로그인은 카카오톡·인스타그램 등<br>인앱 브라우저에서 지원되지 않습니다.</p>
  ${isAndroid
    ? `<a class="btn" href="${intentUrl}">Chrome으로 열기</a>`
    : `<button class="btn" onclick="openExternal()">Safari로 열기</button>`
  }
  <button class="btn btn-copy" onclick="copyUrl()">링크 복사하기</button>
  <div id="copied">링크가 복사되었습니다!<br>Safari / Chrome 주소창에 붙여넣기 해주세요.</div>
  <p class="hint">또는 링크를 길게 눌러<br>'외부 브라우저로 열기'를 선택하세요.</p>
</div>
<script>
  var TARGET = "${currentUrl}";
  function openExternal() {
    // iOS: location.href change can trigger Safari prompt in some versions
    window.location.href = TARGET;
    // Fallback: copy URL after short delay
    setTimeout(function() {
      copyUrl();
    }, 800);
  }
  function copyUrl() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(TARGET).then(showCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }
  function fallbackCopy() {
    var ta = document.createElement('textarea');
    ta.value = TARGET;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select(); ta.setSelectionRange(0, 9999);
    try { document.execCommand('copy'); showCopied(); } catch(e) {}
    document.body.removeChild(ta);
  }
  function showCopied() {
    document.getElementById('copied').style.display = 'block';
  }
</script>
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
