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
 * Call Claude via the local proxy server.
 *
 * @param {string} apiKey        - User-entered Anthropic key (sent as header to proxy)
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {number} maxTokens
 * @param {string} model
 * @param {AbortSignal|null} signal - Optional AbortController signal for cancellation
 * @returns {Promise<object>}    - Parsed JSON result from Claude
 */
export async function callClaude(
  apiKey,
  systemPrompt,
  userMessage,
  maxTokens = 5000,
  model = "claude-haiku-4-5-20251001",
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
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
    signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const hint = response.status === 404
      ? "API 오류 (404) — 프록시 서버가 실행 중이지 않습니다. 터미널에서 'npm run dev'로 실행하세요."
      : response.status === 401
      ? "API 키가 올바르지 않거나 설정되지 않았습니다."
      : `API 오류 (${response.status})`;
    throw new Error(errData?.error?.message || hint);
  }

  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";

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
  // 배열/객체 요소 사이 쉼표가 빠진 패턴 처리
  // "value"\n  "key" → "value",\n  "key"
  // }  {  →  },{   /  }  "  →  },"
  fixed = fixed
    .replace(/(")\s*\n(\s*")/g, '$1,\n$2')   // "..."\n  "..." → 누락 쉼표
    .replace(/(")\s*\n(\s*\{)/g, '$1,\n$2')   // "..."\n  { → 누락 쉼표
    .replace(/(\})\s*\n(\s*\{)/g, '$1,\n$2')  // }\n  { → 누락 쉼표
    .replace(/(\})\s*\n(\s*")/g, '$1,\n$2')   // }\n  "key" → 누락 쉼표
    .replace(/(\])\s*\n(\s*")/g, '$1,\n$2')   // ]\n  "key" → 누락 쉼표 (단, 마지막 ] 제외)
    .replace(/,\s*([}\]])/g, '$1');            // trailing comma 정리

  // ── 3단계: 파싱 시도 ──
  try {
    return JSON.parse(fixed);
  } catch {
    // 4단계: 마지막 유효한 닫기 괄호까지만 잘라서 재시도
    const lastBrace = fixed.lastIndexOf("}");
    if (lastBrace > 0) {
      try { return JSON.parse(fixed.slice(0, lastBrace + 1)); } catch { /* fall through */ }
    }
    return JSON.parse(fixed); // 원본 오류 그대로 throw
  }
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
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
    signal,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const hint = response.status === 404
      ? "API 오류 (404) — 프록시 서버가 실행 중이지 않습니다. 터미널에서 'npm run dev'로 실행하세요."
      : response.status === 401
      ? "API 키가 올바르지 않거나 설정되지 않았습니다."
      : `API 오류 (${response.status})`;
    throw new Error(errData?.error?.message || hint);
  }

  const data = await response.json();
  return data.content?.map((b) => b.text || "").join("") || "";
}
