/**
 * GET  /api/credits — 크레딧 잔액 조회
 * POST /api/credits — 토스페이먼츠 결제 확인 후 크레딧 적립
 */
import { getCredits, addCreditsDb } from "./_redis.js";
import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";

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

    const tossAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
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
        return res.status(402).json({ error: tossData.message || "결제 확인에 실패했습니다." });
      }

      const newBalance = await addCreditsDb(email, pkg.credits);
      return res.status(200).json({
        success: true,
        credits_added: pkg.credits,
        new_balance: newBalance,
        orderId,
      });
    } catch (err) {
      console.error("[toss confirm error]", err.message);
      return res.status(500).json({ error: "결제 처리 중 오류가 발생했습니다." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
