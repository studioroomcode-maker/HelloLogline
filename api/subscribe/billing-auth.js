/**
 * POST /api/subscribe/billing-auth
 * TossPayments billingKey 발급 + 첫 달 즉시 결제 + 구독 등록
 *
 * Body: { authKey, customerKey, plan }
 *   authKey     — Toss requestBillingAuth 성공 후 redirect URL의 쿼리 파라미터
 *   customerKey — 고객 식별자 (= user email)
 *   plan        — "sub_basic" | "sub_pro"
 */
import { verifyToken, getTokenFromRequest } from "../auth/_jwt.js";
import { redisConfigured, addCreditsDb, getSubscription, upsertSubscription } from "../_redis.js";
import { sendEmail, subscriptionCreatedHtml } from "../_email.js";

const TOSS_SECRET_KEY = (process.env.TOSS_SECRET_KEY || "").trim();

const PLANS = {
  sub_basic: { credits: 100, amount: 9900,  label: "Basic" },
  sub_pro:   { credits: 250, amount: 19900, label: "Pro"   },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── 인증 ──
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "로그인이 필요합니다." });
  let email;
  try { email = verifyToken(token).email; } catch { return res.status(401).json({ error: "인증 토큰이 유효하지 않습니다." }); }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { authKey, customerKey, plan } = body || {};

  if (!authKey || !customerKey || !plan) return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
  const pkg = PLANS[plan];
  if (!pkg) return res.status(400).json({ error: "유효하지 않은 플랜입니다." });
  if (!TOSS_SECRET_KEY) return res.status(500).json({ error: "결제 서버가 설정되지 않았습니다." });
  if (!redisConfigured()) return res.status(503).json({ error: "DB가 설정되지 않았습니다." });

  const tossAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

  // ── 1. authKey → billingKey 교환 ──
  let billingKey;
  try {
    const r = await fetch(`https://api.tosspayments.com/v1/billing/authorizations/${authKey}`, {
      method: "POST",
      headers: { Authorization: `Basic ${tossAuth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ customerKey }),
    });
    const d = await r.json();
    if (!r.ok) {
      console.error("[billing-auth] billingKey 발급 실패", d);
      return res.status(402).json({ error: d.message || "카드 등록에 실패했습니다." });
    }
    billingKey = d.billingKey;
  } catch (e) {
    console.error("[billing-auth] billingKey 발급 오류", e.message);
    return res.status(500).json({ error: "카드 등록 중 오류가 발생했습니다." });
  }

  // ── 2. 즉시 첫 달 결제 ──
  const orderId = `hll-${plan}-${Date.now()}`;
  try {
    const r = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
      method: "POST",
      headers: { Authorization: `Basic ${tossAuth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        customerKey,
        amount: pkg.amount,
        orderId,
        orderName: `Hello Loglines ${pkg.label} 구독 ${pkg.credits}cr`,
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      console.error("[billing-auth] 첫 결제 실패", d);
      return res.status(402).json({ error: d.message || "첫 달 결제에 실패했습니다." });
    }
  } catch (e) {
    console.error("[billing-auth] 첫 결제 오류", e.message);
    return res.status(500).json({ error: "결제 처리 중 오류가 발생했습니다." });
  }

  // ── 3. 크레딧 적립 ──
  const newBalance = await addCreditsDb(email, pkg.credits);

  // ── 4. 구독 저장 ──
  const nextBillingAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  await upsertSubscription(email, {
    plan,
    billing_key: billingKey,
    customer_key: customerKey,
    status: "active",
    next_billing_at: nextBillingAt,
    created_at: Date.now(),
  });

  // ── 5. 환영 이메일 ──
  await sendEmail({
    to: email,
    subject: `[Hello Loglines] ${pkg.label} 구독이 시작되었습니다`,
    html: subscriptionCreatedHtml({ plan, credits: pkg.credits, amount: pkg.amount, nextBillingAt }),
  });

  return res.status(200).json({
    ok: true,
    credits_added: pkg.credits,
    new_balance: newBalance,
    next_billing_at: nextBillingAt,
    plan,
  });
}
