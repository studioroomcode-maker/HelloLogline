import { createHmac } from "crypto";

// ── JWT_SECRET must be set — no fallback allowed ──────────────────────────
if (!process.env.JWT_SECRET) {
  throw new Error("[FATAL] JWT_SECRET 환경변수가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.");
}
const SECRET = process.env.JWT_SECRET.trim();
const EXP_SEC = 30 * 24 * 3600; // 30일
const COOKIE_NAME = "hll_auth";

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map(c => {
      const idx = c.indexOf("=");
      return idx < 0 ? [c.trim(), ""] : [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    })
  );
}

export function issueToken(payload) {
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const body = b64url({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + EXP_SEC,
  });
  const sig = createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }
  return payload;
}

/** 요청에서 토큰 추출: httpOnly 쿠키 → x-auth-token 헤더 → Authorization: Bearer */
export function getTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];
  if (req.headers["x-auth-token"]) return req.headers["x-auth-token"];
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

/** 로그인 성공: httpOnly 쿠키 설정 (토큰을 URL에 노출하지 않음) */
export function setAuthCookie(res, token, proto) {
  const secure = (proto || "https") === "https" ? "; Secure" : "";
  res.setHeader("Set-Cookie", [
    res.getHeader("Set-Cookie"),
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Max-Age=${EXP_SEC}; Path=/${secure}`,
  ].filter(Boolean).flat());
}

/** 로그아웃: 쿠키 삭제 */
export function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", [
    res.getHeader("Set-Cookie"),
    `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`,
  ].filter(Boolean).flat());
}

/** 콜백 URI: 요청 헤더에서 호스트 자동 감지 */
export function callbackUri(req, provider) {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return `${proto}://${host}/auth/${provider}/callback`;
}

/** 로그인 성공 후 프론트엔드 리다이렉트 URL (토큰 없음) */
export function frontendBase(req) {
  return (process.env.FRONTEND_URL || `${(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim()}://${(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim()}`).trim();
}
