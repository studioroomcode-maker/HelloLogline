import { rcall, deductCredits, getCredits, redisConfigured, checkRateLimit, recordApiUsage } from "./_redis.js";
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

  // Redis tier override
  const redisTier = await rcall("get", `hll:tier:${e}`);
  if (redisTier) return redisTier;

  return userTiers[e] || userTiers[id] || userTiers[email] || userTiers[userId] || "basic";
}

export default async function handler(req, res) {
  if (!ensureEnv(res, ["JWT_SECRET", "ANTHROPIC_API_KEY"])) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  // ── 인증 확인 ──
  const rawToken = getTokenFromRequest(req);
  if (!rawToken) {
    return res.status(401).json({ error: { message: "로그인이 필요합니다." } });
  }

  let tier = "basic";
  try {
    const payload = verifyToken(rawToken);
    tier = await getUserTier(payload.email, payload.id);
  } catch {
    return res.status(401).json({ error: { message: "인증 토큰이 유효하지 않습니다. 다시 로그인해주세요." } });
  }

  // ── 차단된 사용자 ──
  if (tier === "blocked") {
    return res.status(403).json({ error: { message: "접근이 차단된 계정입니다. 관리자에게 문의하세요." } });
  }

  // ── 레이트 리미팅 ──
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const userEmail = (() => { try { return JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString()).email || ""; } catch { return ""; } })();

  // IP 기준: 분당 30회
  const ipLimit = await checkRateLimit(`rl:ip:${ip}`, 30, 60);
  // 사용자 기준: 분당 20회
  const userLimit = userEmail ? await checkRateLimit(`rl:user:${userEmail}`, 20, 60) : { ok: true };

  if (!ipLimit.ok || !userLimit.ok) {
    return res.status(429).json({
      error: { message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }
    });
  }

  // ── API 키 확인 ──
  // "__server__"는 클라이언트 센티넬값 — 진짜 키가 아니므로 무시하고 서버 키 사용
  const rawClientKey = req.headers["x-client-api-key"];
  const clientApiKey = (rawClientKey && rawClientKey !== "__server__") ? rawClientKey : null;
  const serverApiKey = process.env.ANTHROPIC_API_KEY;
  const apiKey = clientApiKey || serverApiKey;
  if (!apiKey) {
    return res.status(401).json({ error: { message: "API 키가 설정되지 않았습니다." } });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  // ── 크레딧 사전 확인 (차감은 AI 성공 후에 실행) ──
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
          // DB 미설정 — 과금 사고 방지를 위해 요청 거부
          console.error(`[Credits] DB 미연결: ${creditEmail}, feature: ${feature}`);
          return res.status(503).json({ error: { message: "결제 시스템에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해주세요." } });
        }
        // 잔액 사전 확인 (AI 호출 전에 부족 여부만 체크, 실제 차감은 아님)
        const balance = await getCredits(creditEmail);
        if (balance < creditCost) {
          return res.status(402).json({ error: { message: "크레딧이 부족합니다. 크레딧을 충전해주세요." } });
        }
      }
    }
  }

  // _feature, _retry, _stream 필드는 내부 라우팅용이므로 Anthropic에 전달하지 않음
  const { _feature: _f, _retry: _r, _stream, ...anthropicBody } = body;

  // ── 스트리밍 모드 (expertpanel 등 긴 응답용) — SSE로 파이프 ──
  if (_stream) {
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
      captureServerException(err, { where: "api/claude.stream", email: userEmail });
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
    let success = false;
    let streamModel = body?.model || null;
    const streamUsage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };

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
            res.write(`data: ${JSON.stringify({ t: evt.delta.text })}\n\n`);
          } else if (evt.type === "message_start") {
            const u = evt.message?.usage;
            if (u) {
              streamUsage.input_tokens  += Number(u.input_tokens  || 0);
              streamUsage.cache_creation_input_tokens += Number(u.cache_creation_input_tokens || 0);
              streamUsage.cache_read_input_tokens     += Number(u.cache_read_input_tokens     || 0);
              if (u.output_tokens) streamUsage.output_tokens += Number(u.output_tokens);
            }
            if (evt.message?.model) streamModel = evt.message.model;
          } else if (evt.type === "message_delta") {
            const u = evt.usage;
            if (u && typeof u.output_tokens === "number") {
              streamUsage.output_tokens = u.output_tokens; // anthropic은 누적값을 보냄
            }
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
      captureServerException(err, { where: "api/claude.stream.read", email: userEmail });
      res.write(`event: error\ndata: ${JSON.stringify({ message: "스트림 읽기 중 오류가 발생했습니다." })}\n\n`);
      res.end();
      return;
    }

    if (success && creditEmail && creditCost > 0) {
      const newBalance = await deductCredits(creditEmail, creditCost);
      if (newBalance === null) console.error(`[Credits] 스트림 차감 실패: ${creditEmail}`);
      else if (newBalance === -1) console.warn(`[Credits] 스트림 경합 조건: ${creditEmail}, cost: ${creditCost}`);
    }

    if (success && userEmail) {
      recordApiUsage(userEmail, {
        feature: body?._feature || null,
        model: streamModel,
        ...streamUsage,
        credits: creditEmail ? creditCost : 0,
        status: "ok",
        stream: true,
      }).catch(() => {});
    }

    res.write(`event: done\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    res.end();
    return;
  }

  // ── 일반 모드 (JSON 응답) ──
  let upstream, data;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(anthropicBody),
    });
    data = await upstream.json();
  } catch (err) {
    captureServerException(err, { where: "api/claude.proxy", email: userEmail });
    return res.status(500).json({ error: { message: "AI 응답을 받지 못했어요. 네트워크를 확인하고 다시 시도해 주세요. (크레딧은 차감되지 않았습니다)" } });
  }

  // ── AI 성공 후에만 크레딧 차감 ──
  if (upstream.ok && creditEmail && creditCost > 0) {
    const newBalance = await deductCredits(creditEmail, creditCost);
    if (newBalance === null) {
      console.error(`[Credits] AI 성공 후 차감 실패 (DB 오류): ${creditEmail}`);
      // DB 오류 시 사용자에게 패널티 없음 — 결과 그대로 반환
    } else if (newBalance === -1) {
      // 사전 확인과 실제 차감 사이 경합 조건 (극히 드묾)
      console.warn(`[Credits] 경합 조건 감지: ${creditEmail}, cost: ${creditCost}`);
    }
  }

  // ── API 사용량 로그 (성공 시에만) ──
  if (upstream.ok && userEmail) {
    const u = data?.usage || {};
    recordApiUsage(userEmail, {
      feature: body?._feature || null,
      model: data?.model || body?.model || null,
      input_tokens: u.input_tokens,
      output_tokens: u.output_tokens,
      cache_creation_input_tokens: u.cache_creation_input_tokens,
      cache_read_input_tokens: u.cache_read_input_tokens,
      credits: creditEmail ? creditCost : 0,
      status: "ok",
      stream: false,
    }).catch(() => {});
  }

  res.status(upstream.status).json(data);
}
