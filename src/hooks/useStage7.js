import { useState } from "react";
import { callClaude, calcSectionTotal } from "../utils.js";
import {
  SCRIPT_COVERAGE_SYSTEM_PROMPT, VALUATION_SYSTEM_PROMPT, GENRES,
} from "../constants.js";
import { ScriptCoverageSchema, ValuationSchema } from "../schemas.js";

const CHAR_HINT_PROMPT = `당신은 시나리오 개발 컨설턴트입니다.
로그라인 분석 결과를 바탕으로 캐릭터 개발 단계에서 집중해야 할 핵심 3가지를 제시합니다.
낮은 점수 항목을 직접 보완하는 캐릭터 전략으로 연결하세요. 구체적이고 실행 가능하게.

반드시 아래 JSON 형식으로만 응답하세요.
{
  "weakness": "로그라인의 핵심 약점 한 줄 요약 (구체적으로)",
  "points": [
    {"focus": "집중 항목명 (짧게)", "action": "캐릭터 개발 시 구체적으로 할 것 (1문장)"},
    {"focus": "집중 항목명 (짧게)", "action": "캐릭터 개발 시 구체적으로 할 것 (1문장)"},
    {"focus": "집중 항목명 (짧게)", "action": "캐릭터 개발 시 구체적으로 할 것 (1문장)"}
  ]
}`;

const REWRITE_HINT_PROMPT = `당신은 스크립트 에디터입니다.
Script Coverage 결과를 바탕으로 고쳐쓰기 우선순위 3가지를 제시합니다.
가장 낮은 등급 영역을 중심으로 구체적이고 실행 가능한 수정 방향을 제시하세요.

반드시 아래 JSON 형식으로만 응답하세요.
{
  "verdict": "고쳐쓰기 핵심 방향 한 줄",
  "priorities": [
    {"rank": 1, "area": "영역명", "issue": "문제점 (1문장)", "action": "수정 방향 (1문장)"},
    {"rank": 2, "area": "영역명", "issue": "문제점 (1문장)", "action": "수정 방향 (1문장)"},
    {"rank": 3, "area": "영역명", "issue": "문제점 (1문장)", "action": "수정 방향 (1문장)"}
  ]
}`;

/**
 * Stage 7: 최종 평가 (Script Coverage / 시장 가치 / AI 전환 가이드)
 *
 * @param {object} params
 * @param {string}   params.logline              - 현재 로그라인
 * @param {string}   params.genre                - 장르 id
 * @param {string}   params.apiKey               - Anthropic API 키
 * @param {object}   params.result               - Stage 1 로그라인 분석 결과
 * @param {object}   params.scriptCoverageResult - Script Coverage 결과 (자기 참조용)
 * @param {object}   params.comparableResult     - Stage 4 유사 작품 결과
 * @param {object}   params.pipelineResult       - Stage 1 파이프라인 결과
 * @param {object}   params.synopsisResults      - Stage 4 시놉시스 결과
 * @param {function} params.getDurText           - 포맷 텍스트 반환 함수
 * @param {function} params.getCustomContext     - 커스텀 컨텍스트 반환 함수
 * @param {function} params.makeController       - AbortController 생성 헬퍼
 * @param {function} params.clearController      - AbortController 해제 헬퍼
 * @param {function} params.autoSave             - 프로젝트 자동 저장 헬퍼
 */
export function useStage7({
  logline,
  genre,
  apiKey,
  result,
  scriptCoverageResult: externalScriptCoverageResult,
  comparableResult,
  pipelineResult,
  synopsisResults,
  getDurText,
  getCustomContext,
  makeController,
  clearController,
  autoSave,
}) {
  const [scriptCoverageResult, setScriptCoverageResult] = useState(null);
  const [scriptCoverageLoading, setScriptCoverageLoading] = useState(false);
  const [scriptCoverageError, setScriptCoverageError] = useState("");

  const [valuationResult, setValuationResult] = useState(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationError, setValuationError] = useState("");

  const [charGuide, setCharGuide] = useState(null);
  const [charGuideLoading, setCharGuideLoading] = useState(false);
  const [charGuideError, setCharGuideError] = useState("");

  const [rewriteGuide, setRewriteGuide] = useState(null);
  const [rewriteGuideLoading, setRewriteGuideLoading] = useState(false);
  const [rewriteGuideError, setRewriteGuideError] = useState("");

  const genreLabel = () =>
    genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

  const analyzeScriptCoverage = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("scriptCoverage");
    setScriptCoverageLoading(true); setScriptCoverageError(""); setScriptCoverageResult(null);
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인에 대한 할리우드 + 한국 방송사 스타일 Script Coverage를 작성하세요.`;
    try {
      const data = await callClaude(apiKey, SCRIPT_COVERAGE_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, ScriptCoverageSchema, "coverage");
      setScriptCoverageResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setScriptCoverageError(err.message || "Script Coverage 생성 중 오류가 발생했습니다.");
    } finally { setScriptCoverageLoading(false); clearController("scriptCoverage"); }
  };

  const analyzeValuation = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("valuation");
    setValuationLoading(true); setValuationError(""); setValuationResult(null);
    const label = genreLabel();
    const structureTotal = calcSectionTotal(result, "structure");
    const expressionTotal = calcSectionTotal(result, "expression");
    const technicalTotal = calcSectionTotal(result, "technical");
    const interestTotal = calcSectionTotal(result, "interest");
    const scoreContext = result
      ? `\n\n로그라인 분석 점수:\n- 구조적 완성도: ${structureTotal}/50\n- 표현적 매력도: ${expressionTotal}/30\n- 기술적 완성도: ${technicalTotal}/20\n- 흥미 유발 지수: ${interestTotal}/100\n- 감지 장르: ${result.detected_genre || label}`
      : "";
    const activeCoverage = externalScriptCoverageResult || scriptCoverageResult;
    const coverageContext = activeCoverage
      ? `\n\nScript Coverage 결과:\n- 전체 점수: ${activeCoverage.overall_score}/10\n- 추천 등급: ${activeCoverage.recommendation}\n- 강점: ${(activeCoverage.strengths || []).join(", ")}\n- 약점: ${(activeCoverage.weaknesses || []).join(", ")}`
      : "";
    const synopsisContext = pipelineResult?.synopsis
      ? `\n\n시놉시스 (요약):\n${pipelineResult.synopsis.slice(0, 1500)}`
      : "";
    const comparableContext = comparableResult
      ? `\n\n유사 작품: ${(comparableResult.comparable_works || []).slice(0, 3).map((w) => `${w.title}(${w.year || ""})`).join(", ")}\n시장 포지셔닝: ${comparableResult.market_positioning?.slice(0, 200) || ""}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${label}\n포맷: ${getDurText()}${getCustomContext()}${scoreContext}${coverageContext}${synopsisContext}${comparableContext}\n\n위 정보를 바탕으로 이 이야기의 완성도와 시장 판매 가격을 평가하세요.`;
    try {
      const data = await callClaude(apiKey, VALUATION_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ValuationSchema, "valuation");
      setValuationResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setValuationError(err.message || "시장 가치 평가 중 오류가 발생했습니다.");
    } finally { setValuationLoading(false); clearController("valuation"); }
  };

  /** AI 전환 가이드: 로그라인 분석 → 캐릭터 개발 */
  const generateCharGuide = async () => {
    if (!result) return;
    setCharGuideLoading(true); setCharGuideError(""); setCharGuide(null);
    const items = [
      ...Object.entries(result.structure || {}),
      ...Object.entries(result.expression || {}),
    ].map(([k, v]) => `${k}: ${v.score ?? "?"}점 — ${v.feedback || ""}`).join("\n");
    const msg = `로그라인: "${logline}"\n\n항목별 분석:\n${items}\n\n종합 피드백: ${result.overall_feedback || ""}`;
    try {
      const data = await callClaude(apiKey, CHAR_HINT_PROMPT, msg, 800, "claude-haiku-4-5-20251001", null, null, "char_guide");
      setCharGuide(data);
    } catch (err) {
      setCharGuideError(err.message || "가이드 생성 중 오류가 발생했습니다.");
    } finally { setCharGuideLoading(false); }
  };

  /** AI 전환 가이드: Script Coverage → 고쳐쓰기 */
  const generateRewriteGuide = async () => {
    const activeCoverage = externalScriptCoverageResult || scriptCoverageResult;
    if (!activeCoverage) return;
    setRewriteGuideLoading(true); setRewriteGuideError(""); setRewriteGuide(null);
    const scoresText = Object.entries(activeCoverage.scores || {})
      .map(([k, v]) => `${k}: ${v.score}/10 (${v.grade}) — ${v.comment}`)
      .join("\n");
    const msg = `Script Coverage 결과:\n${scoresText}\n\n종합 판정: ${activeCoverage.recommendation || ""}\n약점: ${(activeCoverage.weaknesses || []).join(", ")}\n총평: ${activeCoverage.reader_comment || ""}`;
    try {
      const data = await callClaude(apiKey, REWRITE_HINT_PROMPT, msg, 800, "claude-haiku-4-5-20251001", null, null, "rewrite_guide");
      setRewriteGuide(data);
    } catch (err) {
      setRewriteGuideError(err.message || "우선순위 생성 중 오류가 발생했습니다.");
    } finally { setRewriteGuideLoading(false); }
  };

  /** 프로젝트 저장 직렬화용 */
  const getSerializable = () => ({
    scriptCoverageResult,
    valuationResult,
  });

  /** 프로젝트 로드 시 상태 복원 */
  const loadFrom = (proj) => {
    setScriptCoverageResult(proj.scriptCoverageResult || null);
    setValuationResult(proj.valuationResult || null);
  };

  return {
    scriptCoverageResult, setScriptCoverageResult,
    scriptCoverageLoading, scriptCoverageError,
    valuationResult, setValuationResult,
    valuationLoading, valuationError,
    charGuide, setCharGuide,
    charGuideLoading, charGuideError,
    rewriteGuide, setRewriteGuide,
    rewriteGuideLoading, rewriteGuideError,
    analyzeScriptCoverage,
    analyzeValuation,
    generateCharGuide,
    generateRewriteGuide,
    getSerializable,
    loadFrom,
  };
}
