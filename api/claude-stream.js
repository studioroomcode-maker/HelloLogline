import { rcall, deductCredits, getCredits, redisConfigured, checkRateLimit } from "./_redis.js";
import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";
import { ensureEnv } from "./_env.js";
import { captureServerException } from "./_sentry.js";

const CREDIT_COSTS = {
  logline: 0, improve: 0,
  character: 0, shadow: 0, authenticity: 0, chardev: 0,
  synopsis: 1, structure: 1, valuecharge: 1, subtext: 1,
  academic: 1, mythmap: 1, barthes: 1, koreantmyth: 1,
  expertpanel: 1, theme: 1, dialoguedev: 1, scenelist: 1,
  comparable: 1, rewrite_diag: 1,
  pipeline: 2, treatment: 2, beatsheet: 2, coverage: 2, partial_rewrite: 2, valuation: 2,
  full_rewrite: 3,
  scenario: 5,
};

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

async function getUserTier(email, userId) {
  const adminEmails   = (process.env.ADMIN_EMAILS   || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const blockedEmails = (process.env.BLOCKED_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  let userTiers = {};
  try { userTiers = JSON.parse(process.env.USER_TIERS || "{}"); } catch {}

  const e  = (email  || "").toLowerCase();
  const id = (userId || "").toLowerCase();

  if (adminEmails.includes(e)   || adminEmails.includes(id))   return "admin";
  if (blockedEmails.includes(e) || blockedEmails.includes(id)) return "blocked";

  const redisTier = await rcall("get", `hll:tier:${e}`);
  if (redisTier) return redisTier;

  return userTiers[e] || userTiers[id] || userTiers[email] || userTiers[userId] || "basic";
}

export default async function handler(req, res) {
  if (!ensureEnv(res, ["JWT_SECRET", "ANTHROPIC_API_KEY"])) return;
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed" } });

  const rawToken = getTokenFromRequest(req);
  if (!rawToken) return res.status(401).json({ error: { message: "로그인이 필요합니다." } });

  let tier = "basic";
  try {
    const payload = verifyToken(rawToken);
    tier = await getUserTier(payload.email, payload.id);
  } catch {
    return res.status(401).json({ error: { message: "인증 토큰이 유효하지 않습니다. 다시 로그인해주세요." } });
  }

  if (tier === "blocked") return res.status(403).json({ error: { message: "접근이 차단된 계정입니다. 관리자에게 문의하세요." } });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const userEmail = (() => { try { return JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString()).email || ""; } catch { return ""; } })();

  const ipLimit   = await checkRateLimit(`rl:ip:${ip}`, 30, 60);
  const userLimit = userEmail ? await checkRateLimit(`rl:user:${userEmail}`, 20, 60) : { ok: true };
  if (!ipLimit.ok || !userLimit.ok) return res.status(429).json({ error: { message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." } });

  const rawClientKey = req.headers["x-client-api-key"];
  const clientApiKey = (rawClientKey && rawClientKey !== "__server__") ? rawClientKey : null;
  const serverApiKey = process.env.ANTHROPIC_API_KEY;
  const apiKey = clientApiKey || serverApiKey;
  if (!apiKey) return res.status(401).json({ error: { message: "API 키가 설정되지 않았습니다." } });

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const usingServerKey = !clientApiKey && !!serverApiKey;
  let creditEmail = null;
  let creditCost = 0;

  if (usingServerKey && tier === "basic" && !body._retry) {
    const feature = body._feature || "logline";
    creditCost = CREDIT_COSTS[feature] ?? 1;
    if (creditCost > 0) {
      creditEmail = userEmail || null;
      if (creditEmail) {
        if (!redisConfigured()) {
          return res.status(503).json({ error: { message: "결제 시스템에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해주세요." } });
        }
        const balance = await getCredits(creditEmail);
        if (balance < creditCost) {
          return res.status(402).json({ error: { message: "크레딧이 부족합니다. 크레딧을 충전해주세요." } });
        }
      }
    }
  }

  const { _feature: _f, _retry: _r, ...anthropicBody } = body;

  // SSE 헤더 — 먼저 플러시해서 CDN idle-timeout 방지
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify({ ...anthropicBody, stream: true }),
    });
  } catch (err) {
    captureServerException(err, { where: "api/claude-stream.proxy", email: userEmail });
    res.write(`event: error\ndata: ${JSON.stringify({ message: "AI 응답을 받지 못했어요. 네트워크를 확인하고 다시 시도해 주세요." })}\n\n`);
    res.end();
    return;
  }

  if (!upstream.ok) {
    const errData = await upstream.json().catch(() => ({}));
    res.write(`event: error\ndata: ${JSON.stringify({ status: upstream.status, ...errData })}\n\n`);
    res.end();
    return;
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let success = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        let evt;
        try { evt = JSON.parse(raw); } catch { continue; }

        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          fullText += evt.delta.text;
          res.write(`data: ${JSON.stringify({ t: evt.delta.text })}\n\n`);
        } else if (evt.type === "message_stop") {
          success = true;
        } else if (evt.type === "error") {
          res.write(`event: error\ndata: ${JSON.stringify({ message: evt.error?.message || "스트림 오류가 발생했습니다." })}\n\n`);
          res.end();
          return;
        }
      }
    }
  } catch (err) {
    captureServerException(err, { where: "api/claude-stream.read", email: userEmail });
    res.write(`event: error\ndata: ${JSON.stringify({ message: "스트림 읽기 중 오류가 발생했습니다." })}\n\n`);
    res.end();
    return;
  }

  if (success && creditEmail && creditCost > 0) {
    const newBalance = await deductCredits(creditEmail, creditCost);
    if (newBalance === null) console.error(`[Credits] 스트림 차감 실패: ${creditEmail}`);
    else if (newBalance === -1) console.warn(`[Credits] 스트림 경합 조건: ${creditEmail}, cost: ${creditCost}`);
  }

  res.write(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  res.end();
}
