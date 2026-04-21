/**
 * GET  /api/credits — 크레딧 잔액 조회
 * POST /api/credits — 토스페이먼츠 결제 확인 후 크레딧 적립
 */
import {
  getCredits,
  addCreditsDb,
  getPaymentEvent,
  savePaymentEvent,
  writeAuditLog,
} from "./_redis.js";
import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";
import { ensureEnv } from "./_env.js";
import { captureServerException } from "./_sentry.js";

const TOSS_SECRET_KEY = (process.env.TOSS_SECRET_KEY || "").trim();

const PACKAGES = {
  c30:       { credits: 30,  amount: 3000  },
  c70:       { credits: 70,  amount: 7000  },
  c230:      { credits: 230, amount: 20000 },
  c400:      { credits: 400, amount: 35000 },
  sub_basic: { credits: 100, amount: 9900  },
  sub_pro:   { credits: 250, amount: 19900 },
};

export default async function handler(req, res) {
  // ── Health check (인증 불필요) ──
  if (req.query?.health === "1") {
    return res.json({ status: "ok", hasKey: !!process.env.ANTHROPIC_API_KEY });
  }

  if (!ensureEnv(res, ["JWT_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"])) return;

  const authHeader = getTokenFromRequest(req);
  if (!authHeader) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  let email;
  try {
    const payload = verifyToken(authHeader);
    email = payload.email;
  } catch {
    return res.status(401).json({ error: "인증 토큰이 유효하지 않습니다." });
  }

  // ── GET: 잔액 조회 ──
  if (req.method === "GET") {
    const credits = await getCredits(email);
    return res.status(200).json({ credits: credits ?? 0 });
  }

  // ── POST: 토스페이먼츠 결제 확인 ──
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
    }

    // orderId 형식: hll-{packageKey}-{timestamp}
    const parts = orderId.split("-");
    const packageKey = parts[1]; // "c30", "c70", etc.
    const pkg = PACKAGES[packageKey];

    if (!pkg) {
      return res.status(400).json({ error: "유효하지 않은 주문입니다." });
    }
    if (parseInt(amount) !== pkg.amount) {
      return res.status(400).json({ error: "결제 금액이 일치하지 않습니다." });
    }
    if (!TOSS_SECRET_KEY) {
      return res.status(500).json({ error: "결제 서버가 설정되지 않았습니다." });
    }

    // ── 멱등성 체크: 같은 paymentKey로 이미 처리됐는지 ──
    const priorEvent = await getPaymentEvent(paymentKey);
    if (priorEvent?.credits_added > 0) {
      return res.status(200).json({
        success: true,
        credits_added: priorEvent.credits_added,
        new_balance: await getCredits(email),
        orderId,
        idempotent: true,
      });
    }

    const tossAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

    async function tossCancel(reason) {
      try {
        const r = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
          method: "POST",
          headers: { Authorization: `Basic ${tossAuth}`, "Content-Type": "application/json" },
          body: JSON.stringify({ cancelReason: reason }),
        });
        return r.ok;
      } catch { return false; }
    }

    try {
      const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          Authorization: `Basic ${tossAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) }),
      });

      const tossData = await tossRes.json();
      if (!tossRes.ok) {
        console.error("[toss confirm error]", tossData);
        await savePaymentEvent(paymentKey, {
          order_id: orderId, email, amount: parseInt(amount),
          status: "CONFIRM_FAILED", event: "api/credits", raw: tossData,
        });
        return res.status(402).json({ error: tossData.message || "결제 확인에 실패했습니다." });
      }

      // ── 결제 확정 기록을 먼저 남김 (크레딧 적립 실패 시 추적용) ──
      await savePaymentEvent(paymentKey, {
        order_id: orderId, email, amount: parseInt(amount),
        status: "CONFIRMED", event: "api/credits", credits_added: 0, raw: tossData,
      });

      // ── 크레딧 적립. 실패 시 보상 트랜잭션으로 자동 환불 시도 ──
      let newBalance = null;
      try {
        newBalance = await addCreditsDb(email, pkg.credits);
        if (newBalance === null) throw new Error("DB 미연결");
      } catch (addErr) {
        console.error("[credit add failed after payment]", addErr?.message);
        const cancelled = await tossCancel("크레딧 적립 실패 보상 환불");
        await savePaymentEvent(paymentKey, {
          order_id: orderId, email, amount: parseInt(amount),
          status: cancelled ? "COMPENSATED_REFUND" : "REFUND_FAILED",
          event: "api/credits",
          raw: { error: addErr?.message || String(addErr), cancelled },
        });
        await writeAuditLog("api:credits", cancelled ? "payment.auto_refund" : "payment.refund_failed", email, {
          paymentKey, orderId, amount: parseInt(amount), reason: "credit_add_failed",
        });
        return res.status(500).json({
          error: cancelled
            ? "크레딧 적립에 실패하여 자동 환불했습니다. 다시 시도해 주세요."
            : "크레딧 적립에 실패했습니다. 고객센터로 문의해 주세요 (contact@studioroomkr.com).",
        });
      }

      // ── 성공 — 이벤트 로그 업데이트 ──
      await savePaymentEvent(paymentKey, {
        order_id: orderId, email, amount: parseInt(amount),
        status: "DONE", event: "api/credits",
        credits_added: pkg.credits, raw: tossData,
      });
      await writeAuditLog("api:credits", "credits.add", email, {
        paymentKey, orderId, amount: parseInt(amount), credits: pkg.credits, newBalance,
      });

      return res.status(200).json({
        success: true,
        credits_added: pkg.credits,
        new_balance: newBalance,
        orderId,
      });
    } catch (err) {
      captureServerException(err, { where: "api/credits.confirm", paymentKey, orderId, email });
      return res.status(500).json({ error: "결제 처리 중 문제가 발생했어요. 같은 결제로 다시 시도하지 마시고 고객센터로 문의해 주세요." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
