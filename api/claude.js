import { createHmac } from "crypto";
import { rcall } from "./_redis.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const JWT_SECRET = (process.env.JWT_SECRET || "hll-jwt-fallback-secret").trim();

function verifyToken(token) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired");
  return payload;
}

async function getUserTier(email, userId) {
  const adminEmails   = (process.env.ADMIN_EMAILS   || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const blockedEmails = (process.env.BLOCKED_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  let userTiers = {};
  try { userTiers = JSON.parse(process.env.USER_TIERS || "{}"); } catch {}

  const e  = (email  || "").toLowerCase();
  const id = (userId || "").toLowerCase();

  if (adminEmails.includes(e)   || adminEmails.includes(id))   return "admin";
  if (blockedEmails.includes(e) || blockedEmails.includes(id)) return "blocked";

  // Redis tier override
  const redisTier = await rcall("get", `hll:tier:${e}`);
  if (redisTier) return redisTier;

  return userTiers[e] || userTiers[id] || userTiers[email] || userTiers[userId] || "basic";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  // ── 인증 확인 ──
  const authHeader = req.headers["x-auth-token"] || req.headers.authorization?.replace("Bearer ", "");
  if (!authHeader) {
    return res.status(401).json({ error: { message: "로그인이 필요합니다." } });
  }

  let tier = "basic";
  try {
    const payload = verifyToken(authHeader);
    tier = await getUserTier(payload.email, payload.id);
  } catch {
    return res.status(401).json({ error: { message: "인증 토큰이 유효하지 않습니다. 다시 로그인해주세요." } });
  }

  // ── 차단된 사용자 ──
  if (tier === "blocked") {
    return res.status(403).json({ error: { message: "접근이 차단된 계정입니다. 관리자에게 문의하세요." } });
  }

  // ── API 키 확인 ──
  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers["x-client-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: { message: "API 키가 설정되지 않았습니다." } });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[proxy error]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
}
