// 학생용 로그라인 진단기 전용 프록시 — 로그인/크레딧 없이 공용 암호(STUDENT_TOOL_PASSCODE)로만 접근한다.
// api/claude.js(로그인 필수, 크레딧 차감)와 별개의 저비용·저권한 엔드포인트.
import { checkRateLimit } from "./_redis.js";
import { ensureEnv } from "./_env.js";
import { captureServerException } from "./_sentry.js";

const ALLOWED_MODELS = new Set(["claude-sonnet-5", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"]);
const MAX_OUTPUT_TOKENS = 6000;

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

export default async function handler(req, res) {
  if (!ensureEnv(res, ["ANTHROPIC_API_KEY", "STUDENT_TOOL_PASSCODE"])) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  // ── 공용 암호 확인 (선생님이 학생들에게 공유하는 값) ──
  // 403을 쓰는 이유: 클라이언트의 공용 401 처리기가 "API 키가 올바르지 않습니다"로
  // 뭉개버려서, 여기서 보낸 실제 메시지("암호가 올바르지 않습니다")가 학생에게 보이지 않는다.
  const passcode = req.headers["x-student-passcode"];
  if (!passcode || passcode !== process.env.STUDENT_TOOL_PASSCODE) {
    return res.status(403).json({ error: { message: "암호가 올바르지 않습니다." } });
  }

  // ── IP 기준 레이트리미팅 — 공개 엔드포인트이므로 남용 방지가 최우선 ──
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const perMinute = await checkRateLimit(`rl:student:min:${ip}`, 6, 60);
  const perDay = await checkRateLimit(`rl:student:day:${ip}`, 60, 86400);
  if (!perMinute.ok || !perDay.ok) {
    return res.status(429).json({ error: { message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." } });
  }

  let body;
  try {
    body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) || {};
  } catch {
    return res.status(400).json({ error: { message: "잘못된 요청 본문입니다." } });
  }

  if (!ALLOWED_MODELS.has(body.model)) {
    return res.status(400).json({ error: { message: "지원하지 않는 모델입니다." } });
  }
  const maxTokens = Number(body.max_tokens);
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > MAX_OUTPUT_TOKENS) {
    return res.status(400).json({ error: { message: `max_tokens는 1~${MAX_OUTPUT_TOKENS} 사이여야 합니다.` } });
  }

  // 밑줄로 시작하는 필드는 내부 라우팅용이므로 Anthropic에 전달하지 않는다.
  const anthropicBody = Object.fromEntries(
    Object.entries(body).filter(([k]) => !k.startsWith("_"))
  );

  let upstream, data;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(anthropicBody),
    });
    data = await upstream.json();
  } catch (err) {
    captureServerException(err, { where: "api/student-claude.proxy" });
    return res.status(500).json({ error: { message: "AI 응답을 받지 못했어요. 네트워크를 확인하고 다시 시도해 주세요." } });
  }

  res.status(upstream.status).json(data);
}
