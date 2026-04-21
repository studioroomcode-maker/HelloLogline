/**
 * GET /api/cron/subscribe
 * 매일 00:00 UTC 실행 — 갱신일이 된 구독에 자동 결제
 *
 * Vercel Cron은 Authorization: Bearer ${CRON_SECRET} 헤더를 자동 추가하지 않으므로
 * vercel.json의 crons.path에서 호출 시 CRON_SECRET 환경변수로 검증.
 */
import { listDueSubscriptions, upsertSubscription, addCreditsDb } from "../_redis.js";
import { sendEmail, subscriptionRenewedHtml, subscriptionFailedHtml } from "../_email.js";
import { captureServerException } from "../_sentry.js";

import crypto from "node:crypto";

const TOSS_SECRET_KEY = (process.env.TOSS_SECRET_KEY || "").trim();
const CRON_SECRET = (process.env.CRON_SECRET || "").trim();
const IS_PROD = (process.env.VERCEL_ENV || process.env.NODE_ENV) === "production";

const PLANS = {
  sub_basic: { credits: 100, amount: 9900,  label: "Basic" },
  sub_pro:   { credits: 250, amount: 19900, label: "Pro"   },
};

function timingSafeEqual(a, b) {
  const ab = Buffer.from(a || "");
  const bb = Buffer.from(b || "");
  if (ab.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ab, bb); } catch { return false; }
}

export default async function handler(req, res) {
  // ── 보안 검증: 프로덕션에서는 CRON_SECRET 필수 ──
  if (IS_PROD && !CRON_SECRET) {
    console.error("[cron:subscribe] CRON_SECRET 미설정 — 프로덕션 실행 차단");
    return res.status(500).json({ error: "CRON_SECRET not configured" });
  }

  if (CRON_SECRET) {
    const authHeader = req.headers.authorization || "";
    const expected = `Bearer ${CRON_SECRET}`;
    if (!timingSafeEqual(authHeader, expected)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  if (!TOSS_SECRET_KEY) {
    return res.status(500).json({ error: "TOSS_SECRET_KEY 미설정" });
  }

  const tossAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
  const now = Date.now();

  // ── 갱신 대상 구독 조회 ──
  const due = await listDueSubscriptions(now);
  if (!due || due.length === 0) {
    return res.status(200).json({ ok: true, processed: 0 });
  }

  const results = [];

  for (const sub of due) {
    const pkg = PLANS[sub.plan];
    if (!pkg) {
      results.push({ email: sub.email, ok: false, reason: "unknown_plan" });
      continue;
    }

    const orderId = `hll-renew-${sub.plan}-${sub.email.replace(/[^a-z0-9]/gi, "")}-${now}`;

    try {
      // ── TossPayments 자동 결제 ──
      const r = await fetch(`https://api.tosspayments.com/v1/billing/${sub.billing_key}`, {
        method: "POST",
        headers: { Authorization: `Basic ${tossAuth}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          customerKey: sub.customer_key || sub.email,
          amount: pkg.amount,
          orderId,
          orderName: `Hello Loglines ${pkg.label} 구독 갱신 ${pkg.credits}cr`,
        }),
      });
      const d = await r.json();

      if (!r.ok) {
        // ── 결제 실패: status → failed ──
        await upsertSubscription(sub.email, { ...sub, status: "failed" });
        await sendEmail({
          to: sub.email,
          subject: "[Hello Loglines] 구독 자동 결제 실패",
          html: subscriptionFailedHtml({ plan: sub.plan, amount: pkg.amount }),
        });
        results.push({ email: sub.email, ok: false, reason: d.message });
        continue;
      }

      // ── 결제 성공: 크레딧 적립 + 갱신일 업데이트 ──
      await addCreditsDb(sub.email, pkg.credits);
      const nextBillingAt = sub.next_billing_at + 30 * 24 * 60 * 60 * 1000;
      await upsertSubscription(sub.email, { ...sub, status: "active", next_billing_at: nextBillingAt });

      await sendEmail({
        to: sub.email,
        subject: `[Hello Loglines] ${pkg.label} 구독이 갱신되었습니다`,
        html: subscriptionRenewedHtml({
          plan: sub.plan,
          credits: pkg.credits,
          amount: pkg.amount,
          nextBillingAt,
        }),
      });

      results.push({ email: sub.email, ok: true, credits: pkg.credits });
    } catch (e) {
      captureServerException(e, { where: "cron:subscribe", email: sub.email, plan: sub.plan });
      results.push({ email: sub.email, ok: false, reason: e.message });
    }
  }

  const succeeded = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`[cron:subscribe] processed=${results.length} ok=${succeeded} failed=${failed}`);

  return res.status(200).json({ ok: true, processed: results.length, succeeded, failed });
}
