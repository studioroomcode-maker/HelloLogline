import { useState } from "react";
import { callClaudeText } from "../utils.js";
import { SCENARIO_DRAFT_SYSTEM_PROMPT, GENRES } from "../constants.js";

/**
 * Stage 6: 시나리오 초고 생성 및 다듬기
 *
 * @param {object} params
 * @param {string}   params.logline             - 현재 로그라인
 * @param {string}   params.genre               - 장르 id
 * @param {string}   params.apiKey              - Anthropic API 키
 * @param {object}   params.charDevResult       - Stage 3 캐릭터 분석 결과
 * @param {object}   params.dialogueDevResult   - Stage 5 대사 디벨롭 결과
 * @param {object}   params.structureResult     - Stage 4 구조 분석 결과
 * @param {object}   params.beatSheetResult     - Stage 5 비트 시트 결과
 * @param {object}   params.beatScenes          - Stage 5 집필된 씬 맵
 * @param {object}   params.pipelineResult      - Stage 1 파이프라인 시놉시스
 * @param {object}   params.synopsisResults     - Stage 4 시놉시스 결과
 * @param {object}   params.writerEdits         - 작가 수정본 맵
 * @param {string}   params.treatmentResult     - Stage 5 트리트먼트 텍스트
 * @param {function} params.getDurText          - 포맷 텍스트 반환 함수
 * @param {function} params.getCustomContext    - 커스텀 컨텍스트 반환 함수
 * @param {function} params.getEffective        - writer override 우선 반환 함수
 * @param {function} params.makeController      - AbortController 생성 헬퍼
 * @param {function} params.clearController     - AbortController 해제 헬퍼
 * @param {function} params.autoSave            - 프로젝트 자동 저장 헬퍼
 * @param {function} params.pushHistory         - 히스토리 push 헬퍼
 */
export function useStage6({
  logline,
  genre,
  apiKey,
  charDevResult,
  dialogueDevResult,
  structureResult,
  beatSheetResult,
  beatScenes,
  pipelineResult,
  synopsisResults,
  writerEdits,
  treatmentResult,
  getDurText,
  getCustomContext,
  getEffective,
  makeController,
  clearController,
  autoSave,
  pushHistory,
}) {
  const [scenarioDraftResult, setScenarioDraftResult] = useState("");
  const [scenarioDraftLoading, setScenarioDraftLoading] = useState(false);
  const [scenarioDraftError, setScenarioDraftError] = useState("");

  const [scenarioDraftFeedback, setScenarioDraftFeedback] = useState("");
  const [scenarioDraftRefineLoading, setScenarioDraftRefineLoading] = useState(false);
  const [scenarioDraftBefore, setScenarioDraftBefore] = useState(null);
  const [showScenarioDraftBefore, setShowScenarioDraftBefore] = useState(false);

  const [scenarioDraftCtx, setScenarioDraftCtx] = useState(null);
  const [scenarioDraftHistory, setScenarioDraftHistory] = useState([]);
  const [scenarioDraftStale, setScenarioDraftStale] = useState(false);

  const genreLabel = () =>
    genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

  const generateScenarioDraft = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("scenarioDraft");
    setScenarioDraftLoading(true); setScenarioDraftError("");
    pushHistory(setScenarioDraftHistory, scenarioDraftResult, null);
    setScenarioDraftResult("");
    const label = genreLabel();

    let charBlock = "";
    if (charDevResult?.protagonist || writerEdits?.character) {
      const charOverride = writerEdits?.character || {};
      const p = charDevResult?.protagonist || {};
      const lines = [
        `주인공: ${charOverride.name || p.name_suggestion || "주인공"}`,
        (charOverride.want || p.want) ? `  - 외적 목표(Want): ${charOverride.want || p.want}` : "",
        (charOverride.need || p.need) ? `  - 내적 욕구(Need): ${charOverride.need || p.need}` : "",
        (charOverride.ghost || p.ghost) ? `  - 심리적 상처(Ghost): ${charOverride.ghost || p.ghost}` : "",
        (charOverride.lie || p.lie_they_believe) ? `  - 믿는 거짓: ${charOverride.lie || p.lie_they_believe}` : "",
        (charOverride.flaw || p.flaw) ? `  - 핵심 결함: ${charOverride.flaw || p.flaw}` : "",
        (charOverride.arc || p.arc_type) ? `  - 변화 호(Arc): ${charOverride.arc || p.arc_type}` : "",
        ...(charDevResult?.supporting_characters || [])
          .filter((s) => s.suggested_name || s.role_name)
          .map((s) => `인물: ${s.suggested_name || ""} (${s.role_name || ""}) — ${s.relationship_dynamic || s.protagonist_mirror || ""}`)
      ];
      charBlock = `\n\n등장인물:\n${lines.filter(Boolean).join("\n")}`;
    }

    let dialogueBlock = "";
    if (dialogueDevResult?.character_voices?.length) {
      const voices = dialogueDevResult.character_voices
        .map((v) => `  ${v.character}: ${v.speech_pattern} / 절대 말하지 않는 것: ${v.what_they_never_say} / 말버릇: ${v.verbal_tic || "-"}`)
        .join("\n");
      dialogueBlock = `\n\n인물별 대사 목소리 (반드시 준수):\n${voices}`;
      if (dialogueDevResult.subtext_techniques?.length) {
        dialogueBlock += `\n하위텍스트 기법: ${dialogueDevResult.subtext_techniques.slice(0, 2).map((t) => t.technique).join(", ")}`;
      }
    }

    const structureBlock = structureResult?.plot_points?.length
      ? `\n\n핵심 플롯 포인트:\n${structureResult.plot_points.map((p) => `  ${p.name} (p.${p.page}): ${p.description}`).join("\n")}`
      : "";

    const effectiveTreatment = getEffective ? getEffective("treatment", treatmentResult) : treatmentResult;
    const treatmentBlock = effectiveTreatment ? `\n\n트리트먼트:\n${effectiveTreatment.slice(0, 2500)}` : "";

    let beatBlock = "";
    if (beatSheetResult?.beats?.length) {
      const beatLines = beatSheetResult.beats.map((b) => {
        const writtenSummary = writerEdits?.beats?.[b.id] || b.summary;
        const written = beatScenes?.[b.id] ? `\n     [집필 참고: ${beatScenes[b.id].slice(0, 150)}...]` : "";
        return `  #${b.id} ${b.name_kr} (p.${b.page_start}~${b.page_end}) | ${writtenSummary} | 가치: ${b.value_start}→${b.value_end} | 장소: ${b.location_hint || "미정"} | 톤: ${b.tone || ""}${written}`;
      });
      beatBlock = `\n\n비트 시트 (${beatSheetResult.beats.length}비트):\n${beatLines.join("\n")}`;
    }

    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${label}${charBlock}${structureBlock}${dialogueBlock}${treatmentBlock}${beatBlock}\n\n위 모든 정보를 반드시 반영해서 시나리오 초고를 작성하세요.\n- 등장인물 이름·성격·관계를 그대로 유지하세요\n- 비트 시트가 있다면 그 순서와 구조를 따르세요\n- 대사 목소리 프로필이 있다면 각 인물의 말투를 그에 맞게 쓰세요\n- 트리트먼트가 있다면 그 방향의 이야기를 따르세요`;
    try {
      const text = await callClaudeText(apiKey, SCENARIO_DRAFT_SYSTEM_PROMPT, msg, 8000, "claude-sonnet-4-6", ctrl.signal, "scenario");
      setScenarioDraftResult(text);
      setScenarioDraftStale(false);
      setScenarioDraftCtx({
        char: !!(charDevResult?.protagonist || writerEdits?.character),
        treatment: !!effectiveTreatment,
        beats: !!beatSheetResult?.beats?.length,
        dialogue: !!dialogueDevResult?.character_voices?.length,
        synopsis: !!(pipelineResult || synopsisResults),
        genre: genre !== "auto" ? label : null,
      });
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setScenarioDraftError(err.message || "시나리오 생성 중 오류가 발생했습니다.");
    } finally { setScenarioDraftLoading(false); clearController("scenarioDraft"); }
  };

  const refineScenarioDraft = async () => {
    if (!scenarioDraftResult || !scenarioDraftFeedback.trim() || !apiKey) return;
    const ctrl = makeController("scenarioRefine");
    setScenarioDraftRefineLoading(true);
    setScenarioDraftBefore(scenarioDraftResult);
    setShowScenarioDraftBefore(false);
    const msg = `원본 로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n\n── 현재 시나리오 초고 (일부) ──\n${scenarioDraftResult.slice(0, 5000)}\n\n── 작가 피드백 ──\n${scenarioDraftFeedback.trim()}\n\n위 피드백을 반영하여 시나리오를 수정하세요. 표준 시나리오 포맷(씬 헤더·액션라인·대사)을 유지하고, 피드백이 언급하지 않은 부분은 최대한 그대로 유지하세요.`;
    try {
      const text = await callClaudeText(apiKey, SCENARIO_DRAFT_SYSTEM_PROMPT, msg, 8000, "claude-sonnet-4-6", ctrl.signal, "scenario");
      pushHistory(setScenarioDraftHistory, scenarioDraftResult, null);
      setScenarioDraftResult(text);
      setScenarioDraftFeedback("");
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요."));
    } finally { setScenarioDraftRefineLoading(false); clearController("scenarioRefine"); }
  };

  /** 프로젝트 저장 직렬화용 */
  const getSerializable = () => ({
    scenarioDraftResult,
    scenarioDraftHistory,
  });

  /** 프로젝트 로드 시 상태 복원 */
  const loadFrom = (proj) => {
    setScenarioDraftResult(proj.scenarioDraftResult || "");
    setScenarioDraftHistory(proj.scenarioDraftHistory || []);
  };

  return {
    scenarioDraftResult, setScenarioDraftResult,
    scenarioDraftLoading, scenarioDraftError,
    scenarioDraftFeedback, setScenarioDraftFeedback,
    scenarioDraftRefineLoading,
    scenarioDraftBefore, setScenarioDraftBefore,
    showScenarioDraftBefore, setShowScenarioDraftBefore,
    scenarioDraftCtx, setScenarioDraftCtx,
    scenarioDraftHistory, setScenarioDraftHistory,
    scenarioDraftStale, setScenarioDraftStale,
    generateScenarioDraft,
    refineScenarioDraft,
    getSerializable,
    loadFrom,
  };
}
