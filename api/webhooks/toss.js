/**
 * POST /api/webhooks/toss
 * TossPayments 웹훅 수신.
 *
 * 보안 모델:
 *  - Toss는 서명 HMAC을 공식 제공하지 않음. 신뢰 가능한 근거는
 *    "paymentKey로 Toss API를 재조회해 상태를 검증"하는 방식.
 *  - 따라서 웹훅 본문을 그대로 믿지 않고 /v1/payments/{paymentKey}로
 *    권위적 상태를 가져온 뒤 DB에 반영한다.
 *  - 멱등성은 paymentKey를 PK로 하는 hll_payment_events 테이블이 담당.
 */
import {
  getPaymentEvent,
  savePaymentEvent,
  addCreditsDb,
  getSubscription,
  upsertSubscription,
  writeAuditLog,
} from "../_redis.js";
import { captureServerException } from "../_sentry.js";

const TOSS_SECRET_KEY = (process.env.TOSS_SECRET_KEY || "").trim();

const PACKAGES = {
  c30:       { credits: 30,  amount: 3000,  kind: "one_time" },
  c70:       { credits: 70,  amount: 7000,  kind: "one_time" },
  c230:      { credits: 230, amount: 20000, kind: "one_time" },
  c400:      { credits: 400, amount: 35000, kind: "one_time" },
  sub_basic: { credits: 100, amount: 9900,  kind: "subscription", label: "Basic" },
  sub_pro:   { credits: 250, amount: 19900, kind: "subscription", label: "Pro" },
};

function packageKeyFromOrderId(orderId) {
  if (!orderId || typeof orderId !== "string") return null;
  const parts = orderId.split("-");
  if (parts[0] !== "hll") return null;
  if (parts[1] === "renew" && parts[2]) return parts[2];
  return parts[1] || null;
}

async function fetchPayment(paymentKey) {
  if (!TOSS_SECRET_KEY) return { ok: false, status: 500, data: { message: "TOSS_SECRET_KEY 미설정" } };
  const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
  const r = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const eventType = body.eventType || body.event || "UNKNOWN";
  const paymentKey = body.data?.paymentKey || body.paymentKey;
  const bodyOrderId = body.data?.orderId || body.orderId;

  if (!paymentKey) {
    return res.status(400).json({ error: "paymentKey 누락" });
  }

  try {
    const existing = await getPaymentEvent(paymentKey);

    const verify = await fetchPayment(paymentKey);
    if (!verify.ok) {
      await savePaymentEvent(paymentKey, {
        order_id: bodyOrderId || null,
        email: existing?.email || null,
        amount: null,
        status: "VERIFY_FAILED",
        event: eventType,
        raw: body,
      });
      return res.status(200).json({ ok: true, verified: false, status: verify.status });
    }

    const p = verify.data;
    const status = p.status;
    const orderId = p.orderId || bodyOrderId;
    const totalAmount = p.totalAmount || p.balanceAmount || 0;
    const email = existing?.email || p.customerEmail || null;

    const pkgKey = packageKeyFromOrderId(orderId);
    const pkg = pkgKey ? PACKAGES[pkgKey] : null;

    let creditsAdded = existing?.credits_added || 0;
    let finalStatus = status;

    if (status === "DONE" && !existing?.credits_added && pkg && email) {
      if (pkg.amount === totalAmount) {
        const added = await addCreditsDb(email, pkg.credits);
        creditsAdded = pkg.credits;
        await writeAuditLog("webhook:toss", "credits.add", email, {
          paymentKey, orderId, amount: totalAmount, credits: pkg.credits, newBalance: added,
        });

        if (pkg.kind === "subscription") {
          const existingSub = await getSubscription(email);
          if (existingSub) {
            const nextBillingAt = (existingSub.next_billing_at || Date.now()) + 30 * 24 * 60 * 60 * 1000;
            await upsertSubscription(email, { ...existingSub, status: "active", next_billing_at: nextBillingAt });
          }
        }
      } else {
        finalStatus = "AMOUNT_MISMATCH";
        await writeAuditLog("webhook:toss", "payment.amount_mismatch", email || "unknown", {
          paymentKey, orderId, expected: pkg.amount, actual: totalAmount,
        });
      }
    }

    if (status === "CANCELED" || status === "PARTIAL_CANCELED" || status === "ABORTED") {
      await writeAuditLog("webhook:toss", `payment.${status.toLowerCase()}`, email || "unknown", {
        paymentKey, orderId, amount: totalAmount,
      });
      if (pkg?.kind === "subscription" && email) {
        const existingSub = await getSubscription(email);
        if (existingSub) {
          await upsertSubscription(email, { ...existingSub, status: "cancelled" });
        }
      }
    }

    await savePaymentEvent(paymentKey, {
      order_id: orderId,
      email,
      amount: totalAmount,
      status: finalStatus,
      event: eventType,
      credits_added: creditsAdded,
      raw: p,
    });

    return res.status(200).json({ ok: true, status: finalStatus, credits_added: creditsAdded });
  } catch (err) {
    captureServerException(err, { where: "webhook:toss", paymentKey, eventType });
    try {
      await savePaymentEvent(paymentKey, {
        order_id: bodyOrderId || null,
        status: "ERROR",
        event: eventType,
        raw: { error: String(err?.message || err), body },
      });
    } catch { /* noop */ }
    return res.status(200).json({ ok: false, error: "internal" });
  }
}
