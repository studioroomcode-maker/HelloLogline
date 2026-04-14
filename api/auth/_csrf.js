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

/** state 검증: query param state와 쿠키 state 비교 + HMAC + 만료 확인 */
export function verifyState(queryState, cookieHeader) {
  if (!queryState || !cookieHeader) return false;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const idx = c.indexOf("=");
      return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    })
  );
  const stored = cookies[COOKIE_NAME];
  if (!stored) return false;

  // 쿠키와 쿼리 파라미터가 일치해야 함
  try {
    if (!timingSafeEqual(Buffer.from(stored), Buffer.from(queryState))) return false;
  } catch {
    return false;
  }

  // HMAC 검증
  const dot = queryState.indexOf(".");
  if (dot < 1) return false;
  const ts = queryState.slice(0, dot);
  const sig = queryState.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(ts).digest("base64url").slice(0, 16);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }

  // 만료 확인 (10분)
  const age = Date.now() - parseInt(ts, 36);
  return age >= 0 && age < MAX_AGE_MS;
}

/** 쿠키 삭제용 Set-Cookie 헤더 값 */
export function clearStateCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}
