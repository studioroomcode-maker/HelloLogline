/**
 * POST /api/subscribe/cancel
 * 구독 취소 — status를 'cancelled'로 변경 (즉시 환불 없음, 남은 기간 사용 가능)
 */
import { verifyToken, getTokenFromRequest } from "../auth/_jwt.js";
import { getSubscription, upsertSubscription, redisConfigured } from "../_redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "로그인이 필요합니다." });
  let email;
  try { email = verifyToken(token).email; } catch { return res.status(401).json({ error: "인증 토큰이 유효하지 않습니다." }); }

  if (!redisConfigured()) return res.status(503).json({ error: "DB가 설정되지 않았습니다." });

  const sub = await getSubscription(email);
  if (!sub || sub.status !== "active") {
    return res.status(400).json({ error: "활성 구독이 없습니다." });
  }

  await upsertSubscription(email, { ...sub, status: "cancelled" });

  const nextDate = new Date(sub.next_billing_at).toLocaleDateString("ko-KR");
  return res.status(200).json({
    ok: true,
    message: `구독이 취소되었습니다. ${nextDate}까지는 현재 플랜을 그대로 사용할 수 있습니다.`,
  });
}
