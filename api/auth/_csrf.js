import { createHmac, randomBytes, timingSafeEqual } from "crypto";

if (!process.env.JWT_SECRET) throw new Error("[FATAL] JWT_SECRET not set");
const SECRET = process.env.JWT_SECRET.trim();
if (SECRET.length < 32) throw new Error("[FATAL] JWT_SECRET 길이 부족(<32자) — 강한 랜덤 시크릿(64자 hex 권장)을 설정하세요.");
const COOKIE_NAME = "hll_oauth_state";
const MAX_AGE_MS = 600_000; // 10분

/**
 * state = base36(timestamp) + "." + nonce + "." + HMAC(ts.nonce)
 *
 * nonce 가 없으면 state 가 시각만으로 결정되어 재사용·충돌이 가능하다.
 */
export function generateState() {
  const ts = Date.now().toString(36);
  const nonce = randomBytes(12).toString("base64url"); // 16자
  const sig = createHmac("sha256", SECRET).update(`${ts}.${nonce}`).digest("base64url").slice(0, 22);
  return `${ts}.${nonce}.${sig}`;
}

/** state 쿠키를 설정하는 Set-Cookie 헤더 값 반환 */
export function stateCookieHeader(state, proto) {
  const secure = proto === "https" ? "; Secure" : "";
  return `${COOKIE_NAME}=${state}; HttpOnly; SameSite=Lax; Max-Age=600; Path=/${secure}`;
}

function eq(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  try { return timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return false; }
}

/**
 * state 검증: HMAC 서명 + 만료 + 쿠키 매칭.
 *
 * 쿠키 매칭은 필수다. 이게 없으면 공격자가 자기 계정으로 OAuth 를 시작해
 * 얻은 유효한 state 를 피해자에게 열게 해서, 피해자를 공격자 계정으로
 * 로그인시킬 수 있다(로그인 CSRF).
 *
 * SameSite=Lax 쿠키는 OAuth 콜백 같은 top-level GET 리다이렉트에서 정상 전송된다.
 * 인앱 브라우저 대응은 api/auth.js 의 isWebView() 가 담당한다.
 */
export function verifyState(queryState, cookieHeader) {
  if (!queryState) return false;

  // 1) 형식: ts.nonce.sig
  const parts = queryState.split(".");
  if (parts.length !== 3) return false;
  const [ts, nonce, sig] = parts;
  if (!ts || !nonce || !sig) return false;

  // 2) HMAC 서명 검증
  const expected = createHmac("sha256", SECRET).update(`${ts}.${nonce}`).digest("base64url").slice(0, 22);
  if (!eq(sig, expected)) return false;

  // 3) 만료 확인 (10분)
  const issuedAt = parseInt(ts, 36);
  if (!Number.isFinite(issuedAt)) return false;
  const age = Date.now() - issuedAt;
  if (age < 0 || age >= MAX_AGE_MS) return false;

  // 4) 쿠키 매칭 — 필수
  if (!cookieHeader) return false;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const idx = c.indexOf("=");
      return idx < 0 ? [c.trim(), ""] : [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
    })
  );
  return eq(cookies[COOKIE_NAME], queryState);
}

/** 쿠키 삭제용 Set-Cookie 헤더 값 */
export function clearStateCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}
