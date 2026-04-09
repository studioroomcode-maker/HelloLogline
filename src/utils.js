export function getGrade(score) {
  if (score >= 90) return { grade: "S", color: "#FFD700", label: "프로 수준" };
  if (score >= 80) return { grade: "A", color: "#4ECCA3", label: "우수" };
  if (score >= 70) return { grade: "B", color: "#45B7D1", label: "양호" };
  if (score >= 60) return { grade: "C", color: "#F7A072", label: "보통" };
  if (score >= 50) return { grade: "D", color: "#E85D75", label: "미흡" };
  return { grade: "F", color: "#C62828", label: "재작성 필요" };
}

export function getInterestLevel(score) {
  if (score >= 85) return { label: "매우 흥미로움", emoji: "🔥", color: "#FFD700" };
  if (score >= 70) return { label: "흥미로움", emoji: "✨", color: "#4ECCA3" };
  if (score >= 55) return { label: "보통", emoji: "💡", color: "#F7A072" };
  if (score >= 40) return { label: "다소 부족", emoji: "😐", color: "#E85D75" };
  return { label: "흥미 유발 약함", emoji: "💤", color: "#C62828" };
}

export function formatDate(iso) {
  const d = new Date(iso);
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${M}/${D} ${h}:${m}`;
}

export function calcSectionTotal(result, section) {
  if (!result || !result[section]) return 0;
  return Object.values(result[section]).reduce((s, v) => s + (v.score || 0), 0);
}

/**
 * Parse and repair raw text from Claude into a JSON object.
 * Exported so it can be reused in the retry path.
 */
export function parseClaudeJson(text) {
  // 마크다운 코드블록 제거 후 JSON 시작/끝 추출
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);

  // ── 1단계: 스트링 내부 제어문자 이스케이프 + 잘못된 따옴표 처리 ──
  let fixed = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escaped) {
      if      (ch === "\n") { fixed += "n"; }
      else if (ch === "\r") { fixed += "r"; }
      else if (ch === "\t") { fixed += "t"; }
      else                  { fixed += ch; }
      escaped = false;
      continue;
    }

    if (ch === "\\" && inString) { fixed += ch; escaped = true; continue; }

    if (ch === '"') {
      if (inString) {
        let j = i + 1;
        while (j < cleaned.length && (cleaned[j] === " " || cleaned[j] === "\n" || cleaned[j] === "\r" || cleaned[j] === "\t")) j++;
        const nxt = cleaned[j];
        const isClose = nxt === ":" || nxt === "," || nxt === "}" || nxt === "]" || j >= cleaned.length;
        if (isClose) { inString = false; fixed += ch; }
        else          { fixed += '\\"'; }
      } else {
        inString = true;
        fixed += ch;
      }
      continue;
    }

    if (inString) {
      if (ch === "\n") { fixed += "\\n"; continue; }
      if (ch === "\r") { fixed += "\\r"; continue; }
      if (ch === "\t") { fixed += "\\t"; continue; }
      if (ch === "\f") { fixed += "\\f"; continue; }
      if (ch === "\b") { fixed += "\\b"; continue; }
      const code = ch.charCodeAt(0);
      if (code < 0x20) { fixed += `\\u${code.toString(16).padStart(4, "0")}`; continue; }
    }

    fixed += ch;
  }

  // ── 2단계: 누락된 쉼표 보완 ──
  // 줄바꿈 사이 쉼표 누락
  fixed = fixed
    .replace(/(")\s*\n(\s*")/g, '$1,\n$2')    // "..."\n  "..." → 누락 쉼표
    .replace(/(")\s*\n(\s*\{)/g, '$1,\n$2')    // "..."\n  { → 누락 쉼표
    .replace(/(\})\s*\n(\s*\{)/g, '$1,\n$2')   // }\n  { → 누락 쉼표
    .replace(/(\})\s*\n(\s*")/g, '$1,\n$2')    // }\n  "key" → 누락 쉼표
    .replace(/(\])\s*\n(\s*")/g, '$1,\n$2')    // ]\n  "key" → 누락 쉼표
    .replace(/(\])\s*\n(\s*\{)/g, '$1,\n$2')   // ]\n  { → 누락 쉼표
  // 같은 줄 공백만 있는 경우 (} {, } "key" 패턴 — 줄바꿈 없이 공백만 있을 때)
    .replace(/(\})[ \t]+(\{)/g, '$1,$2')        // } { → },{
    .replace(/(\})[ \t]+(")/g, '$1,$2')         // } "key" → },"key"
    .replace(/(\])[ \t]+(\{)/g, '$1,$2')        // ] { → ],[
    .replace(/(\])[ \t]+(")/g, '$1,$2')         // ] "key" → ],"key"
    .replace(/,\s*([}\]])/g, '$1');             // trailing comma 정리

  // ── 3단계: 파싱 시도 ──
  try {
    return JSON.parse(fixed);
  } catch (e1) {
    // 4단계: 마지막 유효한 닫기 괄호까지만 잘라서 재시도
    const lastBrace = fixed.lastIndexOf("}");
    if (lastBrace > 0) {
      try { return JSON.parse(fixed.slice(0, lastBrace + 1)); } catch { /* fall through */ }
    }
    // 5단계: 각 배열에서 잘린 마지막 요소 제거 후 재시도
    try {
      // 불완전한 배열 요소 제거: ,{ ... (닫히지 않은 마지막 요소)
      const trimmed = fixed
        .replace(/,\s*\{[^{}]*$/s, "")   // 마지막 불완전 객체 제거
        .replace(/,\s*"[^"]*$/s, "");    // 마지막 불완전 문자열 제거
      const lastB2 = trimmed.lastIndexOf("}");
      if (lastB2 > 0) {
        return JSON.parse(trimmed.slice(0, lastB2 + 1));
      }
    } catch { /* fall through */ }
    return JSON.parse(fixed); // 원본 오류 그대로 throw
  }
}

/** Anthropic API 오류 코드 → 한국어 메시지 매핑 */
function koreanizeError(errData, httpStatus) {
  const type = errData?.error?.type || "";
  const msg  = errData?.error?.message || "";
  if (type === "overloaded_error" || msg.includes("overloaded"))
    return "Claude 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.";
  if (type === "rate_limit_error" || msg.includes("rate_limit"))
    return "API 요청 한도(Rate Limit)에 도달했습니다. 잠시 기다린 후 다시 시도해주세요.";
  if (type === "authentication_error" || httpStatus === 401)
    return "API 키가 올바르지 않습니다. 설정에서 키를 다시 확인해주세요.";
  if (type === "invalid_request_error")
    return "요청 형식 오류가 발생했습니다. 입력 내용을 줄이거나 다시 시도해주세요.";
  if (type === "permission_error" || msg.includes("permission"))
    return "이 API 키에 해당 기능 사용 권한이 없습니다.";
  if (msg.includes("credit") || msg.includes("billing") || msg.includes("balance"))
    return "Anthropic 계정 크레딧이 부족합니다. anthropic.com에서 크레딧을 충전해주세요.";
  if (httpStatus === 529)
    return "Claude API가 현재 혼잡합니다. 잠시 후 재시도해주세요.";
  if (httpStatus === 500)
    return "Anthropic 서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  return null; // 매핑 실패 시 원본 메시지 사용
}

/**
 * Fetch one Claude response (raw text returned from API).
 */
async function fetchClaude(apiKey, systemPrompt, userMessage, maxTokens, model, signal) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["x-client-api-key"] = apiKey;

  const response = await fetch("/api/claude", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      // system as array enables prompt caching (90% discount on repeated system prompts)
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
    }),
    signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const fallback = response.status === 404
      ? "API 오류 (404) — 프록시 서버가 실행 중이지 않습니다. 터미널에서 'npm run dev'로 실행하세요."
      : response.status === 401
      ? "API 키가 올바르지 않거나 설정되지 않았습니다."
      : `API 오류 (${response.status})`;
    const korean = koreanizeError(errData, response.status);
    throw new Error(korean || errData?.error?.message || fallback);
  }

  const data = await response.json();
  // Anthropic may return 200 with type:"error" (e.g., credit exhaustion edge cases)
  if (data.type === "error" || (!data.content && data.error)) {
    const korean = koreanizeError(data, 200);
    throw new Error(korean || data.error?.message || "Anthropic API 오류가 발생했습니다.");
  }
  return data.content?.map((b) => b.text || "").join("") || "";
}

/**
 * Call Claude via the local proxy server.
 *
 * @param {string} apiKey        - User-entered Anthropic key (sent as header to proxy)
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {number} maxTokens
 * @param {string} model
 * @param {AbortSignal|null} signal - Optional AbortController signal for cancellation
 * @param {import("zod").ZodTypeAny|null} schema - Optional Zod schema to validate response.
 *   On failure: retry once, then throw a descriptive SchemaError instead of silently
 *   passing malformed data through.
 * @returns {Promise<object>}    - Parsed (and optionally validated) JSON result from Claude
 */
export async function callClaude(
  apiKey,
  systemPrompt,
  userMessage,
  maxTokens = 5000,
  model = "claude-haiku-4-5-20251001",
  signal = null,
  schema = null
) {
  const text = await fetchClaude(apiKey, systemPrompt, userMessage, maxTokens, model, signal);
  const parsed = parseClaudeJson(text);

  if (!schema) return parsed;

  // ── Schema validation with one retry ──────────────────────────────────────
  const first = schema.safeParse(parsed);
  if (first.success) return first.data;

  console.warn("[schema] 1차 검증 실패, 재시도합니다.", first.error.issues.slice(0, 3));

  // Retry (same prompt — Claude responses are non-deterministic, retry often fixes it)
  const retryText = await fetchClaude(apiKey, systemPrompt, userMessage, maxTokens, model, signal);
  const retryParsed = parseClaudeJson(retryText);
  const second = schema.safeParse(retryParsed);

  if (second.success) return second.data;

  // Both attempts failed — surface the error instead of passing garbage through
  const issues = second.error.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join(", ");
  const err = new Error(`응답 형식 검증 실패 (2회 시도): ${issues}`);
  err.name = "SchemaValidationError";
  err.issues = second.error.issues;
  throw err;
}

/**
 * Call Claude for streaming text (treatment, scene generation).
 * Returns the full text string (not JSON).
 */
export async function callClaudeText(
  apiKey,
  systemPrompt,
  userMessage,
  maxTokens = 8000,
  model = "claude-sonnet-4-6",
  signal = null
) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["x-client-api-key"] = apiKey;

  const response = await fetch("/api/claude", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
    }),
    signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const fallback = response.status === 404
      ? "API 오류 (404) — 프록시 서버가 실행 중이지 않습니다. 터미널에서 'npm run dev'로 실행하세요."
      : response.status === 401
      ? "API 키가 올바르지 않거나 설정되지 않았습니다."
      : `API 오류 (${response.status})`;
    const korean = koreanizeError(errData, response.status);
    throw new Error(korean || errData?.error?.message || fallback);
  }

  const data = await response.json();
  return data.content?.map((b) => b.text || "").join("") || "";
}
