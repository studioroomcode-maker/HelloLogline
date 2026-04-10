import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "hll-jwt-fallback-secret";

export function issueToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/** OAuth 콜백 후 프론트엔드로 리다이렉트할 URL 결정 */
export function frontendRedirect(token) {
  // 로컬 dev: FRONTEND_URL=http://localhost:5173
  // Vercel: FRONTEND_URL 미설정 → 상대 경로 → 같은 도메인
  const base = process.env.FRONTEND_URL || "";
  return `${base}/?auth_token=${token}`;
}

/** OAuth authorize 요청의 redirect_uri 결정 */
export function callbackUri(req, provider) {
  // SERVER_URL로 명시적으로 설정 가능, 없으면 요청에서 추론
  if (process.env.SERVER_URL) {
    return `${process.env.SERVER_URL}/auth/${provider}/callback`;
  }
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}/auth/${provider}/callback`;
}
