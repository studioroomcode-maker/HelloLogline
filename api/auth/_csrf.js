import { createHmac, timingSafeEqual } from "crypto";

if (!process.env.JWT_SECRET) throw new Error("[FATAL] JWT_SECRET not set");
const SECRET = process.env.JWT_SECRET.trim();
const COOKIE_NAME = "hll_oauth_state";
const MAX_AGE_MS = 600_000; // 10분

/** state = base36(timestamp) + "." + HMAC(timestamp)[0..15] */
export function generateState() {
  const ts = Date.now().toString(36);
  const sig = createHmac("sha256", SECRET).update(ts).digest("base64url").slice(0, 16);
  return `${ts}.${sig}`;
}

/** state 쿠키를 설정하는 Set-Cookie 헤더 값 반환 */
export function stateCookieHeader(state, proto) {
  const secure = proto === "https" ? "; Secure" : "";
  return `${COOKIE_NAME}=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/${secure}`;
}

/**
 * state 검증: HMAC 서명 + 만료 확인 (주 검증)
 * 쿠키 매칭은 보조 검증 — 쿠키가 있으면 비교하되, 없어도 HMAC이 유효하면 통과.
 * (일부 브라우저/환경에서 OAuth 콜백 시 SameSite=Lax 쿠키가 전달되지 않는 케이스 대응)
 */
export function verifyState(queryState, cookieHeader) {
  if (!queryState) return false;

  // 1) HMAC 서명 검증
  const dot = queryState.indexOf(".");
  if (dot < 1) return false;
  const ts = queryState.slice(0, dot);
  const sig = queryState.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(ts).digest("base64url").slice(0, 16);
  try {
    if (sig.length !== expected.length) return false;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }

  // 2) 만료 확인 (10분)
  const age = Date.now() - parseInt(ts, 36);
  if (age < 0 || age >= MAX_AGE_MS) return false;

  // 3) 쿠키 매칭 (있는 경우에만 비교 — 없으면 HMAC 검증만으로 통과)
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const idx = c.indexOf("=");
        return idx < 0 ? [c.trim(), ""] : [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
      })
    );
    const stored = cookies[COOKIE_NAME];
    if (stored) {
      try {
        if (stored.length !== queryState.length) return false;
        if (!timingSafeEqual(Buffer.from(stored), Buffer.from(queryState))) return false;
      } catch {
        return false;
      }
    }
  }

  return true;
}

/** 쿠키 삭제용 Set-Cookie 헤더 값 */
export function clearStateCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}
