/**
 * Consolidated auth endpoint. Dispatched by ?action=xxx:
 *   /api/auth?action=google            — GET  — Google OAuth init (redirect)
 *   /api/auth?action=google-callback   — GET  — Google OAuth callback
 *   /api/auth?action=kakao             — GET  — Kakao OAuth init
 *   /api/auth?action=kakao-callback    — GET  — Kakao OAuth callback
 *   /api/auth?action=naver             — GET  — Naver OAuth init
 *   /api/auth?action=naver-callback    — GET  — Naver OAuth callback
 *   /api/auth?action=me                — GET  — 현재 로그인 사용자 정보
 *   /api/auth?action=logout            — POST — 세션 종료
 */
import { rcall, grantInitialCredits } from "./_redis.js";
import { generateState, stateCookieHeader, verifyState, clearStateCookieHeader } from "./auth/_csrf.js";
import { issueToken, setAuthCookie, clearAuthCookie, frontendBase, verifyToken, getTokenFromRequest } from "./auth/_jwt.js";

function isWebView(ua = "") {
  return (
    /FBAN|FBAV|Instagram|Twitter|Line\/|KakaoTalk|NaverApp|Electron/i.test(ua) ||
    /\bwv\b/.test(ua) ||
    (/Android/.test(ua) && !/Chrome\//.test(ua)) ||
    (/iPhone|iPad/.test(ua) && !/Safari\//.test(ua))
  );
}

async function getUserTier(email, userId) {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const blockedEmails = (process.env.BLOCKED_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const e  = (email  || "").toLowerCase();
  const id = (userId || "").toLowerCase();
  if (adminEmails.includes(e)  || adminEmails.includes(id))  return "admin";
  if (blockedEmails.includes(e) || blockedEmails.includes(id)) return "blocked";
  const redisTier = await rcall("get", `hll:tier:${e}`);
  if (redisTier) return redisTier;
  let userTiers = {};
  try { userTiers = JSON.parse(process.env.USER_TIERS || "{}"); } catch {}
  return userTiers[e] || userTiers[id] || userTiers[email] || userTiers[userId] || "basic";
}

async function persistUser(user) {
  if (!user.email) return;
  const info = JSON.stringify({ name: user.name, provider: user.provider, avatar: user.avatar, lastSeen: Date.now() });
  await Promise.all([
    rcall("sadd", "hll:users", user.email.toLowerCase()),
    rcall("set", `hll:user:${user.email.toLowerCase()}`, info),
  ]);
  await grantInitialCredits(user.email.toLowerCase());
}

// ── Google OAuth init (with webview detection) ───────────────────────────
function handleGoogleInit(req, res) {
  const ua = req.headers["user-agent"] || "";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();

  if (isWebView(ua)) {
    const currentUrl = `${proto}://${host}/auth/google`;
    const isAndroid = /Android/i.test(ua);
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
    window.location.href = TARGET;
    setTimeout(function() { copyUrl(); }, 800);
  }
  function copyUrl() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(TARGET).then(showCopied).catch(fallbackCopy);
    } else { fallbackCopy(); }
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

// ── Kakao OAuth init ─────────────────────────────────────────────────────
function handleKakaoInit(req, res) {
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
    scope: "profile_nickname,profile_image,account_email",
  });
  res.setHeader("Set-Cookie", stateCookieHeader(state, proto));
  res.redirect(`https://kauth.kakao.com/oauth/authorize?${params}`);
}

// ── Naver OAuth init ─────────────────────────────────────────────────────
function handleNaverInit(req, res) {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const clientId = (process.env.NAVER_CLIENT_ID || "").trim();
  const redirectUri = `${proto}://${host}/auth/naver/callback`;
  const state = generateState();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });
  res.setHeader("Set-Cookie", stateCookieHeader(state, proto));
  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params}`);
}

// ── Google OAuth callback ────────────────────────────────────────────────
async function handleGoogleCallback(req, res) {
  const { code, state } = req.query;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const base = frontendBase(req);
  const errUrl = `${base}/?auth_error=google`;

  res.setHeader("Set-Cookie", clearStateCookieHeader());

  if (!code) return res.redirect(errUrl);
  if (!verifyState(state, req.headers.cookie || "")) return res.redirect(`${base}/?auth_error=csrf`);

  try {
    const redirectUri = `${proto}://${host}/auth/google/callback`;
    const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description || td.error);

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

    const token = issueToken(user);
    await persistUser(user);
    setAuthCookie(res, token, proto);
    res.redirect(`${base}/?login=success`);
  } catch (err) {
    console.error("[Google callback]", err.message);
    res.redirect(errUrl);
  }
}

// ── Kakao OAuth callback ─────────────────────────────────────────────────
async function handleKakaoCallback(req, res) {
  const { code, state } = req.query;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const base = frontendBase(req);
  const errUrl = `${base}/?auth_error=kakao`;

  res.setHeader("Set-Cookie", clearStateCookieHeader());

  if (!code) return res.redirect(errUrl);
  if (!verifyState(state, req.headers.cookie || "")) return res.redirect(`${base}/?auth_error=csrf`);

  try {
    const redirectUri = `${proto}://${host}/auth/kakao/callback`;
    const clientId = (process.env.KAKAO_REST_API_KEY || "").trim();

    const tokenParams = {
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    };
    const clientSecret = (process.env.KAKAO_CLIENT_SECRET || "").trim();
    if (clientSecret) tokenParams.client_secret = clientSecret;

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenParams),
    });
    const td = await tokenRes.json();
    if (td.error) {
      console.error("[Kakao token error]", JSON.stringify(td), "| redirectUri:", redirectUri, "| clientId:", clientId ? clientId.slice(0, 6) + "…" : "(empty)");
      throw new Error(td.error_description || td.error);
    }

    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${td.access_token}` },
    });
    const ud = await userRes.json();

    const email = ud.kakao_account?.email || "";
    const nickname = ud.kakao_account?.profile?.nickname || "";
    const user = {
      id: `kakao_${ud.id}`,
      provider: "kakao",
      name: nickname || email || "카카오 사용자",
      email,
      avatar: ud.kakao_account?.profile?.profile_image_url || "",
    };

    const token = issueToken(user);
    await persistUser(user);
    setAuthCookie(res, token, proto);
    res.redirect(`${base}/?login=success`);
  } catch (err) {
    console.error("[Kakao callback error]", err.message, "| proto:", proto, "| host:", host);
    res.redirect(errUrl);
  }
}

// ── Naver OAuth callback ─────────────────────────────────────────────────
async function handleNaverCallback(req, res) {
  const { code, state } = req.query;
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const base = frontendBase(req);
  const errUrl = `${base}/?auth_error=naver`;

  res.setHeader("Set-Cookie", clearStateCookieHeader());

  if (!code) return res.redirect(errUrl);
  if (!verifyState(state, req.headers.cookie || "")) return res.redirect(`${base}/?auth_error=csrf`);

  try {
    const redirectUri = `${proto}://${host}/auth/naver/callback`;
    const clientId = (process.env.NAVER_CLIENT_ID || "").trim();
    const clientSecret = (process.env.NAVER_CLIENT_SECRET || "").trim();

    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
      }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description || td.error);

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

    const token = issueToken(user);
    await persistUser(user);
    setAuthCookie(res, token, proto);
    res.redirect(`${base}/?login=success`);
  } catch (err) {
    console.error("[Naver callback]", err.message);
    res.redirect(errUrl);
  }
}

// ── /me ──────────────────────────────────────────────────────────────────
async function handleMe(req, res) {
  const rawToken = getTokenFromRequest(req);
  if (!rawToken) return res.status(401).json({ error: "No token" });
  try {
    const payload = verifyToken(rawToken);
    const tier = await getUserTier(payload.email, payload.id);
    res.json({
      user: {
        id: payload.id,
        provider: payload.provider,
        name: payload.name,
        email: payload.email,
        avatar: payload.avatar,
        tier,
      }
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ── /logout ──────────────────────────────────────────────────────────────
function handleLogout(req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

// ── Main dispatcher ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  const action = req.query?.action || "";
  switch (action) {
    case "google":          return handleGoogleInit(req, res);
    case "google-callback": return handleGoogleCallback(req, res);
    case "kakao":           return handleKakaoInit(req, res);
    case "kakao-callback":  return handleKakaoCallback(req, res);
    case "naver":           return handleNaverInit(req, res);
    case "naver-callback":  return handleNaverCallback(req, res);
    case "me":              return handleMe(req, res);
    case "logout":          return handleLogout(req, res);
    default:                return res.status(400).json({ error: "Invalid action" });
  }
}
