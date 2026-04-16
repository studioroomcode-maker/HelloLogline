/**
 * POST /api/notify-subscribe
 * 구독 플랜 출시 알림 이메일 등록 (비로그인 포함)
 * Redis set: hll:sub-notify
 */
import { rcall, redisConfigured } from "./_redis.js";
import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  // 이메일: JWT에서 추출하거나 body에서 직접 받음
  let email = (body?.email || "").trim().toLowerCase();

  if (!email) {
    const token = getTokenFromRequest(req);
    if (token) {
      try {
        const payload = verifyToken(token);
        email = (payload.email || "").trim().toLowerCase();
      } catch {}
    }
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRe.test(email)) {
    return res.status(400).json({ error: "유효한 이메일 주소를 입력해주세요." });
  }

  if (!redisConfigured()) {
    // DB 미설정: 성공처럼 응답 (운영 전 단계)
    return res.status(200).json({ ok: true, fallback: true });
  }

  await rcall("sadd", "hll:sub-notify", email);
  return res.status(200).json({ ok: true });
}
