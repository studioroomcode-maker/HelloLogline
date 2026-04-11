import { useState } from "react";
import { callClaude } from "../utils.js";
import {
  SYNOPSIS_SYSTEM_PROMPT, VALUE_CHARGE_SYSTEM_PROMPT,
  STRUCTURE_ANALYSIS_SYSTEM_PROMPT, COMPARABLE_WORKS_SYSTEM_PROMPT,
  SUBTEXT_SYSTEM_PROMPT, NARRATIVE_FRAMEWORKS, DURATION_OPTIONS, GENRES,
} from "../constants.js";
import {
  SynopsisSchema, ValueChargeSchema, StructureAnalysisSchema,
  ComparableWorksSchema, SubtextSchema,
} from "../schemas.js";

/**
 * Stage 4: 구조 & 감정 아크 + 시놉시스 + 유사 작품
 * (3막 구조 / 가치 전하 / 시놉시스 생성 / 하위텍스트 / 유사 작품 비교)
 *
 * @param {object} params
 * @param {string}   params.logline           - 현재 로그라인
 * @param {string}   params.genre             - 장르 id
 * @param {string}   params.apiKey            - Anthropic API 키
 * @param {object}   params.charDevResult     - Stage 3 캐릭터 분석 결과
 * @param {object}   params.shadowResult      - Stage 3 그림자 분석 결과 (시놉시스 컨텍스트)
 * @param {object}   params.authenticityResult - Stage 3 진정성 분석 결과 (시놉시스 컨텍스트)
 * @param {object}   params.academicResult    - Stage 2 학술 분석 결과 (시놉시스 컨텍스트)
 * @param {object}   params.mythMapResult     - Stage 2 신화 분석 결과 (시놉시스 컨텍스트)
 * @param {object}   params.expertPanelResult - Stage 1 전문가 패널 결과 (시놉시스 컨텍스트)
 * @param {object}   params.treatmentChars    - 인물 직접 설정 (시놉시스 컨텍스트)
 * @param {object}   params.pipelineResult    - 파이프라인 결과 (유사 작품 컨텍스트)
 * @param {string}   params.treatmentResult   - Stage 5 트리트먼트 (유사 작품 컨텍스트)
 * @param {function} params.getStoryBible     - 확정 시놉시스 컨텍스트 반환 함수
 * @param {function} params.makeController    - AbortController 생성 헬퍼
 * @param {function} params.clearController   - AbortController 해제 헬퍼
 * @param {function} params.autoSave          - 프로젝트 자동 저장 헬퍼
 */
export function useStage4({
  logline,
  genre,
  apiKey,
  charDevResult,
  shadowResult,
  authenticityResult,
  academicResult,
  mythMapResult,
  subtextResult: externalSubtextResult,
  expertPanelResult,
  treatmentChars,
  pipelineResult,
  treatmentResult,
  getStoryBible,
  makeController,
  clearController,
  autoSave,
}) {
  // ── 포맷 설정 (getDurText / getCustomContext의 근거) ──
  const [selectedDuration, setSelectedDuration] = useState("feature");
  const [customTheme, setCustomTheme] = useState("");
  const [customDurationText, setCustomDurationText] = useState("");
  const [customFormatLabel, setCustomFormatLabel] = useState("");
  const [synopsisMode, setSynopsisMode] = useState("auto");
  const [selectedFramework, setSelectedFramework] = useState("three_act");
  const [frameworkInfoId, setFrameworkInfoId] = useState(null);
  const [directionCount, setDirectionCount] = useState(3);
  const [selectedSynopsisIndex, setSelectedSynopsisIndex] = useState(null);

  // ── 시놉시스 ──
  const [synopsisResults, setSynopsisResults] = useState(null);
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [synopsisError, setSynopsisError] = useState("");

  // ── 구조 분석 ──
  const [structureResult, setStructureResult] = useState(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState("");

  // ── 가치 전하 ──
  const [valueChargeResult, setValueChargeResult] = useState(null);
  const [valueChargeLoading, setValueChargeLoading] = useState(false);
  const [valueChargeError, setValueChargeError] = useState("");

  // ── 하위텍스트 ──
  const [subtextResult, setSubtextResult] = useState(null);
  const [subtextLoading, setSubtextLoading] = useState(false);
  const [subtextError, setSubtextError] = useState("");

  // ── 유사 작품 ──
  const [comparableResult, setComparableResult] = useState(null);
  const [comparableLoading, setComparableLoading] = useState(false);
  const [comparableError, setComparableError] = useState("");

  const genreLabel = () =>
    genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

  const getDurText = () => {
    if (selectedDuration === "custom") {
      const label = customFormatLabel || "커스텀 포맷";
      const dur = customDurationText || "길이 미지정";
      return `${label} (${dur})`;
    }
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    return dur ? `${dur.label} (${dur.duration})` : "장편영화 (90~120분)";
  };

  const getCustomContext = () => {
    if (selectedDuration !== "custom" || !customTheme.trim()) return "";
    return `\n주제/컨셉: ${customTheme.trim()}`;
  };

  const analyzeStructure = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("structure");
    setStructureLoading(true); setStructureError(""); setStructureResult(null);
    const label = genreLabel();
    const charBlock = charDevResult?.protagonist
      ? `주인공: ${charDevResult.protagonist.name_suggestion || ""} — 결함: ${charDevResult.protagonist.flaw || ""} / 원하는 것: ${charDevResult.protagonist.want || ""}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${label}${charBlock ? `\n\n캐릭터 정보:\n${charBlock}` : ""}${getStoryBible()}\n\n위 로그라인의 3막 구조 핵심 플롯 포인트와 감정 아크를 설계하세요. 시놉시스가 있다면 반드시 그 방향의 등장인물과 이야기를 따르세요.`;
    try {
      const data = await callClaude(apiKey, STRUCTURE_ANALYSIS_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, StructureAnalysisSchema, "structure");
      setStructureResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setStructureError(err.message || "구조 분석 중 오류가 발생했습니다.");
    } finally { setStructureLoading(false); clearController("structure"); }
  };

  const analyzeValueCharge = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("valueCharge");
    setValueChargeLoading(true); setValueChargeError(""); setValueChargeResult(null);
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n\n위 로그라인의 가치 전하(Value Charge)를 McKee의 이론으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, VALUE_CHARGE_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ValueChargeSchema, "valuecharge");
      setValueChargeResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setValueChargeError(err.message || "가치 전하 분석 중 오류가 발생했습니다.");
    } finally { setValueChargeLoading(false); clearController("valueCharge"); }
  };

  const analyzeStructureAll = async () => {
    if (!logline.trim() || !apiKey) return;
    await Promise.all([analyzeStructure(), analyzeValueCharge()]);
  };

  const analyzeSubtext = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("subtext");
    setSubtextLoading(true); setSubtextError(""); setSubtextResult(null);
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인의 하위텍스트를 체호프-스타니슬랍스키-브레히트-핀터-마멧 이론으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, SUBTEXT_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, SubtextSchema, "subtext");
      setSubtextResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setSubtextError(err.message || "하위텍스트 분석 중 오류가 발생했습니다.");
    } finally { setSubtextLoading(false); clearController("subtext"); }
  };

  const analyzeComparableWorks = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("comparable");
    setComparableLoading(true); setComparableError(""); setComparableResult(null);
    const label = genreLabel();
    const synopsisContext = pipelineResult?.synopsis
      ? `\n\n시놉시스:\n${pipelineResult.synopsis.slice(0, 2000)}`
      : synopsisResults?.synopses?.[0]?.synopsis
      ? `\n\n시놉시스 (첫 번째 방향):\n${synopsisResults.synopses[0].synopsis.slice(0, 2000)}`
      : "";
    const treatmentContext = treatmentResult
      ? `\n\n트리트먼트 (앞부분):\n${treatmentResult.slice(0, 1500)}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${label}\n포맷: ${getDurText()}${getCustomContext()}${synopsisContext}${treatmentContext}\n\n위 이야기와 유사한 기존 영화·드라마 작품을 분석하고 시장 포지셔닝을 평가하세요.`;
    try {
      const data = await callClaude(apiKey, COMPARABLE_WORKS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ComparableWorksSchema, "comparable");
      setComparableResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setComparableError(err.message || "유사 작품 분석 중 오류가 발생했습니다.");
    } finally { setComparableLoading(false); clearController("comparable"); }
  };

  const generateSynopsis = async () => {
    if (!logline.trim() || !apiKey) return;
    setSynopsisLoading(true); setSynopsisError(""); setSynopsisResults(null);
    const duration = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const framework = NARRATIVE_FRAMEWORKS.find((f) => f.id === selectedFramework);
    const label = genre === "auto" ? "자동 감지 (로그라인에서 판단)" : GENRES.find((g) => g.id === genre)?.label || "";

    const contextParts = [];
    if (academicResult) {
      const highlights = [];
      if (academicResult.aristotle?.hamartia) highlights.push(`하마르티아: ${academicResult.aristotle.hamartia}`);
      if (academicResult.campbell?.stage) highlights.push(`캠벨 여정: ${academicResult.campbell.stage}`);
      if (academicResult.overall_insight) highlights.push(`학술 종합: ${academicResult.overall_insight}`);
      if (highlights.length > 0) contextParts.push(`[학술 분석]\n${highlights.join("\n")}`);
    }
    if (valueChargeResult) {
      const vc = [];
      if (valueChargeResult.opening_charge) vc.push(`시작 가치: ${valueChargeResult.opening_charge}`);
      if (valueChargeResult.climax_charge) vc.push(`클라이맥스: ${valueChargeResult.climax_charge}`);
      if (valueChargeResult.recommended_arc) vc.push(`권장 아크: ${valueChargeResult.recommended_arc}`);
      if (vc.length > 0) contextParts.push(`[McKee 가치 전하]\n${vc.join("\n")}`);
    }
    if (shadowResult) {
      const sh = [];
      if (shadowResult.protagonist_archetype) sh.push(`원형: ${shadowResult.protagonist_archetype}`);
      if (shadowResult.shadow_figure) sh.push(`그림자: ${shadowResult.shadow_figure}`);
      if (sh.length > 0) contextParts.push(`[Jung 그림자]\n${sh.join("\n")}`);
    }
    if (authenticityResult) {
      const au = [];
      if (authenticityResult.authenticity_verdict) au.push(`진정성: ${authenticityResult.authenticity_verdict}`);
      if (authenticityResult.recommendation) au.push(`제언: ${authenticityResult.recommendation}`);
      if (au.length > 0) contextParts.push(`[진정성 분석]\n${au.join("\n")}`);
    }
    if (expertPanelResult) {
      const ep = [];
      if (expertPanelResult.consensus) ep.push(`전문가 합의: ${expertPanelResult.consensus}`);
      if (expertPanelResult.development_direction) ep.push(`발전 방향: ${expertPanelResult.development_direction}`);
      if (ep.length > 0) contextParts.push(`[전문가 패널]\n${ep.join("\n")}`);
    }
    const activeSubtext = externalSubtextResult || subtextResult;
    if (activeSubtext) {
      const st = [];
      if (activeSubtext.deeper_story) st.push(`하위텍스트: ${activeSubtext.deeper_story}`);
      if (activeSubtext.core_desire) st.push(`숨겨진 욕망: ${activeSubtext.core_desire}`);
      if (st.length > 0) contextParts.push(`[하위텍스트]\n${st.join("\n")}`);
    }
    if (mythMapResult) {
      const mm = [];
      if (mythMapResult.journey_phase) mm.push(`신화 단계: ${mythMapResult.journey_phase}`);
      if (mm.length > 0) contextParts.push(`[신화 매핑]\n${mm.join("\n")}`);
    }
    if (charDevResult) {
      const cd = [];
      if (charDevResult.protagonist?.name_suggestion) cd.push(`주인공: ${charDevResult.protagonist.name_suggestion}`);
      if (charDevResult.protagonist?.want) cd.push(`Want: ${charDevResult.protagonist.want}`);
      if (charDevResult.protagonist?.need) cd.push(`Need: ${charDevResult.protagonist.need}`);
      if (charDevResult.protagonist?.ghost) cd.push(`Ghost: ${charDevResult.protagonist.ghost}`);
      if (cd.length > 0) contextParts.push(`[캐릭터 디벨롭]\n${cd.join("\n")}`);
    }
    if (treatmentChars) {
      const p = treatmentChars.protagonist;
      const manualLines = [];
      if (p.name) manualLines.push(`주인공: ${p.name}${p.role ? ` (${p.role})` : ""}`);
      if (p.want) manualLines.push(`Want: ${p.want}`);
      if (p.need) manualLines.push(`Need: ${p.need}`);
      if (p.flaw) manualLines.push(`결함: ${p.flaw}`);
      (treatmentChars.supporting || []).filter(s => s.name?.trim()).forEach(s => {
        manualLines.push(`조연: ${s.name}${s.role ? ` (${s.role})` : ""}${s.relation ? ` — ${s.relation}` : ""}`);
      });
      if (manualLines.length > 0) {
        contextParts.unshift(`[작가 직접 설정 — 반드시 이 인물 이름·설정을 사용할 것]\n${manualLines.join("\n")}`);
      }
    }

    const contextBlock = contextParts.length > 0
      ? `\n\n━━━ 이전 분석 결과 ━━━\n${contextParts.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      : "";

    const msg = `로그라인: "${logline.trim()}"

장르: ${label}
포맷: ${duration.label} (${duration.duration}) — ${duration.desc}
포맷 구조 가이드: ${duration.structure}

서사 구조 프레임워크: ${framework.label} (${framework.ref})
프레임워크 적용 지침: ${framework.instruction}

방향 수: ${directionCount}가지${contextBlock}

위 로그라인을 바탕으로 ${directionCount}가지 서로 다른 방향의 시놉시스를 작성하세요.`;

    const ctrl = makeController("synopsis");
    try {
      const data = await callClaude(apiKey, SYNOPSIS_SYSTEM_PROMPT, msg, 6000, "claude-sonnet-4-6", ctrl.signal, SynopsisSchema, "synopsis");
      setSynopsisResults(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setSynopsisError(err.message || "시놉시스 생성 중 오류가 발생했습니다.");
    } finally { setSynopsisLoading(false); clearController("synopsis"); }
  };

  const structureAllDone = !!(structureResult || valueChargeResult);
  const structureAllLoading = structureLoading || valueChargeLoading;

  /** 프로젝트 저장 직렬화용 */
  const getSerializable = () => ({
    selectedDuration, customTheme, customDurationText, customFormatLabel,
    synopsisResults, selectedSynopsisIndex,
    structureResult, valueChargeResult, subtextResult, comparableResult,
  });

  /** 프로젝트 로드 시 상태 복원 */
  const loadFrom = (proj) => {
    setSelectedDuration(proj.selectedDuration || "feature");
    setCustomTheme(proj.customTheme || "");
    setCustomDurationText(proj.customDurationText || "");
    setCustomFormatLabel(proj.customFormatLabel || "");
    setSynopsisResults(proj.synopsisResults || null);
    setSelectedSynopsisIndex(proj.selectedSynopsisIndex ?? null);
    setStructureResult(proj.structureResult || null);
    setValueChargeResult(proj.valueChargeResult || null);
    setSubtextResult(proj.subtextResult || null);
    setComparableResult(proj.comparableResult || null);
  };

  return {
    // 포맷 상태
    selectedDuration, setSelectedDuration,
    customTheme, setCustomTheme,
    customDurationText, setCustomDurationText,
    customFormatLabel, setCustomFormatLabel,
    synopsisMode, setSynopsisMode,
    selectedFramework, setSelectedFramework,
    frameworkInfoId, setFrameworkInfoId,
    directionCount, setDirectionCount,
    selectedSynopsisIndex, setSelectedSynopsisIndex,
    // 포맷 헬퍼
    getDurText, getCustomContext,
    // 시놉시스
    synopsisResults, setSynopsisResults,
    synopsisLoading, synopsisError,
    // 구조
    structureResult, setStructureResult,
    structureLoading, structureError,
    // 가치 전하
    valueChargeResult, setValueChargeResult,
    valueChargeLoading, valueChargeError,
    structureAllDone, structureAllLoading,
    // 하위텍스트
    subtextResult, setSubtextResult,
    subtextLoading, subtextError,
    // 유사 작품
    comparableResult, setComparableResult,
    comparableLoading, comparableError,
    // 핸들러
    generateSynopsis,
    analyzeStructure,
    analyzeValueCharge,
    analyzeStructureAll,
    analyzeSubtext,
    analyzeComparableWorks,
    // 직렬화
    getSerializable,
    loadFrom,
  };
}
