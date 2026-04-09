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
    throw new Error(errData?.error?.message || `API 오류 (${response.status})`);
  }

  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";

  // 마크다운 코드블록 제거 후 JSON 시작/끝 추출
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);

  // ── JSON 강화 수정 ──
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

  return JSON.parse(fixed);
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
    throw new Error(errData?.error?.message || `API 오류 (${response.status})`);
  }

  const data = await response.json();
  return data.content?.map((b) => b.text || "").join("") || "";
}
