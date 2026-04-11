import { useState } from "react";
import { callClaude, calcSectionTotal } from "../utils.js";
import {
  SYSTEM_PROMPT, EXPERT_PANEL_SYSTEM_PROMPT,
  PIPELINE_REFINE_SYSTEM_PROMPT, GENRES,
} from "../constants.js";
import {
  LoglineAnalysisSchema, ExpertPanelSchema, EarlyCoverageSchema,
} from "../schemas.js";

const EARLY_COVERAGE_PROMPT = `당신은 드라마·영화 개발 전문가입니다. 주어진 로그라인의 상업적 잠재력을 빠르고 솔직하게 평가합니다. 희망적인 말보다 실질적인 진단을 제공하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "marketability_score": 1~10 정수,
  "one_line_verdict": "한 줄 판정",
  "best_platform": "가장 적합한 플랫폼",
  "target_audience": "핵심 타겟 설명",
  "comparable_hit": "최근 3년 내 유사 히트작 1편 (제목 + 한 줄 이유)",
  "key_strengths": ["강점 1", "강점 2"],
  "key_risks": ["위험 1", "위험 2"],
  "development_priority": "지금 당장 가장 먼저 보완해야 할 것 — 구체적으로"
}`;

/**
 * Stage 1: 로그라인 분석 (기본 분석 / 상업성 체크 / 전문가 패널 / 파이프라인)
 *
 * @param {object} params
 * @param {string}   params.logline           - 현재 로그라인 (setter 포함)
 * @param {function} params.setLogline        - 로그라인 setter
 * @param {string}   params.genre             - 장르 id
 * @param {string}   params.apiKey            - Anthropic API 키
 * @param {boolean}  params.isDemoMode        - 데모 모드 여부
 * @param {function} params.setIsDemoMode     - 데모 모드 setter
 * @param {string}   params.insightResult     - 종합 인사이트 결과 (함께 초기화)
 * @param {function} params.setInsightResult  - 인사이트 결과 setter
 * @param {function} params.setInsightError   - 인사이트 에러 setter
 * @param {function} params.getDurText        - 포맷 텍스트 반환 함수
 * @param {function} params.getCustomContext  - 커스텀 컨텍스트 반환 함수
 * @param {function} params.makeController    - AbortController 생성 헬퍼
 * @param {function} params.clearController   - AbortController 해제 헬퍼
 * @param {function} params.autoSave          - 프로젝트 자동 저장 헬퍼
 * @param {function} params.pushHistory       - 히스토리 push 헬퍼
 * @param {function} params.saveToHistory     - 로컬 history 저장 함수
 * @param {function} params.showToast         - 토스트 알림 함수
 * @param {function} params.onTreatmentStale  - 파이프라인 갱신 후 downstream stale 알림
 */
export function useStage1({
  logline,
  setLogline,
  genre,
  apiKey,
  isDemoMode,
  setIsDemoMode,
  setInsightResult,
  setInsightError,
  getDurText,
  getCustomContext,
  makeController,
  clearController,
  autoSave,
  pushHistory,
  saveToHistory,
  showToast,
  onTreatmentStale,
}) {
  // ── 로그라인 분석 결과 ──
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── 비교 모드 ──
  const [compareMode, setCompareMode] = useState(false);
  const [logline2, setLogline2] = useState("");
  const [result2, setResult2] = useState(null);
  const [loading2, setLoading2] = useState(false);

  // ── 빠른 상업성 체크 ──
  const [earlyCoverageResult, setEarlyCoverageResult] = useState(null);
  const [earlyCoverageLoading, setEarlyCoverageLoading] = useState(false);
  const [earlyCoverageError, setEarlyCoverageError] = useState("");

  // ── 전문가 패널 ──
  const [expertPanelResult, setExpertPanelResult] = useState(null);
  const [expertPanelLoading, setExpertPanelLoading] = useState(false);
  const [expertPanelError, setExpertPanelError] = useState("");

  // ── 파이프라인 ──
  const [pipelineResult, setPipelineResult] = useState(null);
  const [pipelineFeedback, setPipelineFeedback] = useState("");
  const [pipelineRefineLoading, setPipelineRefineLoading] = useState(false);
  const [pipelineEditMode, setPipelineEditMode] = useState(false);
  const [pipelineEditData, setPipelineEditData] = useState(null);
  const [pipelineHistory, setPipelineHistory] = useState([]);

  // ── AI 개선 제안 ──
  const [storyFixes, setStoryFixes] = useState([]);
  const [storyPivots, setStoryPivots] = useState([]);
  const [aiImprovement, setAiImprovement] = useState(null);

  const genreLabel = () =>
    genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

  const buildUserMsg = (text, genreId) => {
    const genreText = genreId === "auto"
      ? "장르를 자동으로 감지해주세요."
      : `선택된 장르: ${GENRES.find((g) => g.id === genreId)?.label}`;
    return `다음 로그라인을 분석해주세요.\n\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreText}\n글자수: ${text.length}자\n\n로그라인:\n"${text.trim()}"`;
  };

  const analyze = async (overrideLogline) => {
    const target = overrideLogline ?? logline;
    if (!target.trim() || !apiKey) return;
    if (overrideLogline) setLogline(overrideLogline);
    if (isDemoMode && setIsDemoMode) setIsDemoMode(false);
    const ctrl = makeController("analyze");
    setLoading(true); setError(""); setResult(null); setResult2(null);
    setStoryFixes([]); setStoryPivots([]); setAiImprovement(null);
    if (setInsightResult) setInsightResult(null);
    if (setInsightError) setInsightError("");
    try {
      const parsed = await callClaude(apiKey, SYSTEM_PROMPT, buildUserMsg(target, genre), 4500, "claude-sonnet-4-6", ctrl.signal, LoglineAnalysisSchema, "logline");
      const sT = calcSectionTotal(parsed, "structure");
      const eT = calcSectionTotal(parsed, "expression");
      const tT = calcSectionTotal(parsed, "technical");
      const iT = calcSectionTotal(parsed, "interest");
      const qScore = sT + eT + tT;
      setResult(parsed);
      if (saveToHistory) saveToHistory(target, genre, parsed, qScore, iT);
      if (showToast) showToast("success", `로그라인 분석 완료 — 품질 ${qScore}점 / 흥미 ${iT}점`);
      if (compareMode && logline2.trim()) {
        setLoading2(true);
        try {
          const parsed2 = await callClaude(apiKey, SYSTEM_PROMPT, buildUserMsg(logline2, genre), 4500, "claude-sonnet-4-6", ctrl.signal, LoglineAnalysisSchema, "logline");
          const s2 = calcSectionTotal(parsed2, "structure");
          const e2 = calcSectionTotal(parsed2, "expression");
          const t2 = calcSectionTotal(parsed2, "technical");
          const i2 = calcSectionTotal(parsed2, "interest");
          setResult2(parsed2);
          if (saveToHistory) saveToHistory(logline2, genre, parsed2, s2 + e2 + t2, i2);
        } catch (err2) { if (err2.name !== "AbortError") console.error("Compare error:", err2); }
        finally { setLoading2(false); }
      }
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "분석 중 오류가 발생했습니다.");
        if (showToast) showToast("error", err.message || "분석 중 오류가 발생했습니다.");
      }
    } finally { setLoading(false); clearController("analyze"); }
  };

  const analyzeEarlyCoverage = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("earlyCoverage");
    setEarlyCoverageLoading(true); setEarlyCoverageError("");
    const label = genreLabel();
    const msg = `로그라인: "${logline.trim()}"\n장르: ${label}\n포맷: ${getDurText()}${getCustomContext()}\n\n이 로그라인의 상업적 잠재력을 간략히 평가하세요. 현재 한국 OTT·극장·방송 시장 기준으로 솔직하게 평가하고, 가장 시급한 개발 과제 1가지를 명확히 짚어주세요.`;
    try {
      const data = await callClaude(apiKey, EARLY_COVERAGE_PROMPT, msg, 2000, "claude-haiku-4-5-20251001", ctrl.signal, EarlyCoverageSchema, "coverage");
      setEarlyCoverageResult(data);
    } catch (err) {
      if (err.name !== "AbortError") setEarlyCoverageError(err.message || "상업성 분석 중 오류가 발생했습니다.");
    } finally { setEarlyCoverageLoading(false); clearController("earlyCoverage"); }
  };

  const runExpertPanel = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("expertPanel");
    setExpertPanelLoading(true); setExpertPanelError(""); setExpertPanelResult(null);
    const label = genreLabel();
    const msg = `분석할 로그라인: "${logline.trim()}"\n장르: ${label}\n글자수: ${logline.trim().length}자\n\n위 로그라인을 7명의 전문가 패널이 학술 이론을 바탕으로 토론하세요.`;
    try {
      const data = await callClaude(apiKey, EXPERT_PANEL_SYSTEM_PROMPT, msg, 7000, "claude-sonnet-4-6", ctrl.signal, ExpertPanelSchema, "expertpanel");
      setExpertPanelResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setExpertPanelError(err.message || "전문가 패널 분석 중 오류가 발생했습니다.");
    } finally { setExpertPanelLoading(false); clearController("expertPanel"); }
  };

  const refinePipelineSynopsis = async (treatmentResult, beatSheetResult, scenarioDraftResult, setTreatmentStale, setBeatSheetStale, setScenarioDraftStale) => {
    if (!pipelineResult || !pipelineFeedback.trim() || !apiKey) return;
    const ctrl = makeController("pipelineRefine");
    setPipelineRefineLoading(true);
    const msg = `원본 로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n\n── 현재 시놉시스 ──\n제목: ${pipelineResult.direction_title}\n장르/톤: ${pipelineResult.genre_tone}\n훅: ${pipelineResult.hook}\n시놉시스:\n${pipelineResult.synopsis}\n핵심 장면: ${(pipelineResult.key_scenes || []).join(" / ")}\n주제: ${pipelineResult.theme}\n결말: ${pipelineResult.ending_type}\n\n── 사용자 피드백 ──\n${pipelineFeedback.trim()}\n\n위 피드백을 반영하여 시놉시스를 수정하세요.`;
    try {
      const data = await callClaude(apiKey, PIPELINE_REFINE_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, null, "pipeline");
      pushHistory(setPipelineHistory, pipelineResult, "synopsis");
      setPipelineResult(data);
      if (treatmentResult && setTreatmentStale) setTreatmentStale(true);
      if (beatSheetResult && setBeatSheetStale) setBeatSheetStale(true);
      if (scenarioDraftResult && setScenarioDraftStale) setScenarioDraftStale(true);
      setPipelineFeedback("");
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요."));
    } finally { setPipelineRefineLoading(false); clearController("pipelineRefine"); }
  };

  /** 프로젝트 저장 직렬화용 */
  const getSerializable = () => ({
    result, result2,
    expertPanelResult,
    pipelineResult,
    pipelineHistory,
  });

  /** 프로젝트 로드 시 상태 복원 */
  const loadFrom = (proj) => {
    setResult(proj.result || null);
    setResult2(proj.result2 || null);
    setExpertPanelResult(proj.expertPanelResult || null);
    setPipelineResult(proj.pipelineResult || null);
    setPipelineHistory(proj.pipelineHistory || []);
  };

  return {
    // 로그라인 분석
    result, setResult,
    loading, error,
    // 비교 모드
    compareMode, setCompareMode,
    logline2, setLogline2,
    result2, setResult2,
    loading2,
    // 상업성 체크
    earlyCoverageResult, setEarlyCoverageResult,
    earlyCoverageLoading, earlyCoverageError,
    // 전문가 패널
    expertPanelResult, setExpertPanelResult,
    expertPanelLoading, expertPanelError,
    // 파이프라인
    pipelineResult, setPipelineResult,
    pipelineFeedback, setPipelineFeedback,
    pipelineRefineLoading,
    pipelineEditMode, setPipelineEditMode,
    pipelineEditData, setPipelineEditData,
    pipelineHistory, setPipelineHistory,
    // AI 개선 제안
    storyFixes, setStoryFixes,
    storyPivots, setStoryPivots,
    aiImprovement, setAiImprovement,
    // 핸들러
    analyze,
    analyzeEarlyCoverage,
    runExpertPanel,
    refinePipelineSynopsis,
    // 직렬화
    getSerializable,
    loadFrom,
  };
}
