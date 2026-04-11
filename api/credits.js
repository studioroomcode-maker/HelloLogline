/**
 * GET  /api/credits — 크레딧 잔액 조회
 * POST /api/credits — 토스페이먼츠 결제 확인 후 크레딧 적립
 */
import { createHmac } from "crypto";
import { getCredits, addCreditsDb } from "./_redis.js";

const JWT_SECRET = (process.env.JWT_SECRET || "").trim();
if (!JWT_SECRET) {
  console.error("[FATAL] JWT_SECRET 환경변수가 설정되지 않았습니다.");
}
const TOSS_SECRET_KEY = (process.env.TOSS_SECRET_KEY || "").trim();

const PACKAGES = {
  c30:  { credits: 30,  amount: 3000 },
  c70:  { credits: 70,  amount: 7000 },
  c230: { credits: 230, amount: 20000 },
  c400: { credits: 400, amount: 35000 },
};

function verifyToken(token) {
  if (!JWT_SECRET) throw new Error("서버 설정 오류: JWT_SECRET 미설정");
  const parts = (token || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired");
  return payload;
}

export default async function handler(req, res) {
  const authHeader = req.headers["x-auth-token"] || req.headers.authorization?.replace("Bearer ", "");
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
