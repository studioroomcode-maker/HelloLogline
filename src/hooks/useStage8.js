import { useState } from "react";
import { callClaude, callClaudeText } from "../utils.js";
import { REWRITE_DIAG_SYSTEM_PROMPT, PARTIAL_REWRITE_SYSTEM_PROMPT, FULL_REWRITE_SYSTEM_PROMPT } from "../constants.js";
import { GENRES } from "../constants.js";

/**
 * Stage 8: 시나리오 고쳐쓰기 (초고 진단 / 부분 재작성 / 전체 개고)
 *
 * @param {object} params
 * @param {string}   params.logline            - 현재 로그라인
 * @param {string}   params.genre              - 장르 id
 * @param {string}   params.apiKey             - Anthropic API 키
 * @param {string}   params.scenarioDraftResult- 시나리오 초고 텍스트
 * @param {function} params.makeController     - AbortController 생성 헬퍼
 * @param {function} params.clearController    - AbortController 해제 헬퍼
 * @param {function} params.autoSave           - 프로젝트 자동 저장 헬퍼
 */
export function useStage8({
  logline,
  genre,
  apiKey,
  scenarioDraftResult,
  makeController,
  clearController,
  autoSave,
}) {
  // ── 초고 진단 ──
  const [rewriteDiagResult, setRewriteDiagResult] = useState(null);
  const [rewriteDiagLoading, setRewriteDiagLoading] = useState(false);
  const [rewriteDiagError, setRewriteDiagError] = useState("");

  // ── 부분 재작성 ──
  const [partialRewriteInstruction, setPartialRewriteInstruction] = useState("");
  const [partialRewriteResult, setPartialRewriteResult] = useState("");
  const [partialRewriteLoading, setPartialRewriteLoading] = useState(false);
  const [partialRewriteError, setPartialRewriteError] = useState("");

  // ── 전체 개고 ──
  const [fullRewriteNotes, setFullRewriteNotes] = useState("");
  const [fullRewriteResult, setFullRewriteResult] = useState("");
  const [fullRewriteLoading, setFullRewriteLoading] = useState(false);
  const [fullRewriteError, setFullRewriteError] = useState("");

  const genreLabel = () =>
    genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

  const generateRewriteDiag = async () => {
    if (!scenarioDraftResult || !apiKey) return;
    const ctrl = makeController("rewriteDiag");
    setRewriteDiagLoading(true);
    setRewriteDiagError("");
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n\n── 시나리오 초고 ──\n${scenarioDraftResult.slice(0, 8000)}\n\n위 초고를 분석하고 고쳐쓰기 우선순위를 제시하세요.`;
    try {
      const data = await callClaude(apiKey, REWRITE_DIAG_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, null, "rewrite_diag");
      setRewriteDiagResult(data);
      await autoSave();
    } catch (e) {
      if (e.name !== "AbortError") setRewriteDiagError(e.message || "분석 중 오류가 발생했습니다.");
    } finally { setRewriteDiagLoading(false); clearController("rewriteDiag"); }
  };

  const generatePartialRewrite = async () => {
    if (!scenarioDraftResult || !partialRewriteInstruction.trim() || !apiKey) return;
    const ctrl = makeController("partialRewrite");
    setPartialRewriteLoading(true);
    setPartialRewriteError("");
    const msg = `로그라인: "${logline.trim()}"\n\n── 시나리오 초고 ──\n${scenarioDraftResult.slice(0, 8000)}\n\n── 재작성 지시 ──\n${partialRewriteInstruction.trim()}\n\n위 지시에 따라 해당 부분을 재작성하세요.`;
    try {
      const text = await callClaudeText(apiKey, PARTIAL_REWRITE_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, "partial_rewrite");
      setPartialRewriteResult(text);
      await autoSave();
    } catch (e) {
      if (e.name !== "AbortError") setPartialRewriteError(e.message || "재작성 중 오류가 발생했습니다.");
    } finally { setPartialRewriteLoading(false); clearController("partialRewrite"); }
  };

  const generateFullRewrite = async () => {
    if (!scenarioDraftResult || !apiKey) return;
    const ctrl = makeController("fullRewrite");
    setFullRewriteLoading(true);
    setFullRewriteError("");
    const diagSummary = rewriteDiagResult
      ? `\n\n── 진단 결과 (반영 필수) ──\n${(rewriteDiagResult.priority_fixes || []).slice(0, 3).map((f) => `• ${f.category}: ${f.issue} → ${f.fix_direction}`).join("\n")}`
      : "";
    const notes = fullRewriteNotes.trim() ? `\n\n── 작가 메모 ──\n${fullRewriteNotes.trim()}` : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}${diagSummary}${notes}\n\n── 개고할 초고 ──\n${scenarioDraftResult.slice(0, 8000)}\n\n위 초고를 전체적으로 개고하세요.`;
    try {
      const text = await callClaudeText(apiKey, FULL_REWRITE_SYSTEM_PROMPT, msg, 10000, "claude-sonnet-4-6", ctrl.signal, "full_rewrite");
      setFullRewriteResult(text);
      await autoSave();
    } catch (e) {
      if (e.name !== "AbortError") setFullRewriteError(e.message || "개고 중 오류가 발생했습니다.");
    } finally { setFullRewriteLoading(false); clearController("fullRewrite"); }
  };

  /** 프로젝트 저장 직렬화용 (autoSave에서 호출) */
  const getSerializable = () => ({
    rewriteDiagResult,
    partialRewriteResult,
    fullRewriteResult,
  });

  /** 프로젝트 로드 시 상태 복원 */
  const loadFrom = (proj) => {
    setRewriteDiagResult(proj.rewriteDiagResult || null);
    setPartialRewriteResult(proj.partialRewriteResult || "");
    setFullRewriteResult(proj.fullRewriteResult || "");
  };

  return {
    // state
    rewriteDiagResult, setRewriteDiagResult,
    rewriteDiagLoading, rewriteDiagError,
    partialRewriteInstruction, setPartialRewriteInstruction,
    partialRewriteResult, setPartialRewriteResult,
    partialRewriteLoading, partialRewriteError,
    fullRewriteNotes, setFullRewriteNotes,
    fullRewriteResult, setFullRewriteResult,
    fullRewriteLoading, fullRewriteError,
    // handlers
    generateRewriteDiag,
    generatePartialRewrite,
    generateFullRewrite,
    // serialization
    getSerializable,
    loadFrom,
  };
}
