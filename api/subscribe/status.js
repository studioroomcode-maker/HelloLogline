/**
 * GET /api/subscribe/status
 * 현재 사용자의 구독 상태 조회
 */
import { verifyToken, getTokenFromRequest } from "../auth/_jwt.js";
import { getSubscription, redisConfigured } from "../_redis.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "로그인이 필요합니다." });
  let email;
  try { email = verifyToken(token).email; } catch { return res.status(401).json({ error: "인증 토큰이 유효하지 않습니다." }); }

  if (!redisConfigured()) return res.status(200).json({ subscription: null });

  const sub = await getSubscription(email);
  if (!sub) return res.status(200).json({ subscription: null });

  return res.status(200).json({
    subscription: {
      plan: sub.plan,
      status: sub.status,
      next_billing_at: sub.next_billing_at,
      created_at: sub.created_at,
    },
  });
}
