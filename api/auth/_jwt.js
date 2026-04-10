import { createHmac } from "crypto";

const SECRET = process.env.JWT_SECRET || "hll-jwt-fallback-secret";
const EXP_SEC = 30 * 24 * 3600; // 30일

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
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
  const parts = token.split(".");
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

/** 콜백 URI: 요청 헤더에서 호스트 자동 감지 */
export function callbackUri(req, provider) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}/auth/${provider}/callback`;
}

/** 로그인 성공 후 프론트엔드 리다이렉트 URL */
export function frontendRedirect(token, req) {
  // FRONTEND_URL 명시적 설정 시 사용 (로컬 dev: http://localhost:5173)
  // 프로덕션: 같은 도메인이므로 상대 경로 사용
  const base = process.env.FRONTEND_URL || "";
  return `${base}/?auth_token=${token}`;
}
