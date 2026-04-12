import { useState } from "react";
import { callClaude, callClaudeText } from "../utils.js";
import {
  TREATMENT_SYSTEM_PROMPT, BEAT_SHEET_SYSTEM_PROMPT,
  SCENE_GEN_SYSTEM_PROMPT, SCENE_LIST_SYSTEM_PROMPT,
  DIALOGUE_DEV_SYSTEM_PROMPT, GENRES,
} from "../constants.js";
import { BeatSheetSchema, DialogueDevSchema } from "../schemas.js";

/* Genre-specific beat structure hints (same as in main component) */
const GENRE_BEAT_HINTS = {
  thriller: `[스릴러/액션 구조 강조]\n- 오프닝: 즉각적 위기 또는 미스터리로 시작\n- 2막 전반: 위협 고조 + 주인공이 직접 나서는 계기\n- 미드포인트: 거짓 해결 또는 충격적 반전\n- 2막 후반: 추적/쫓김 교차, 동료 배신/탈락\n- 3막: 최후 대결 → 반전 결말`,
  romance: `[로맨스/멜로 구조 강조]\n- 오프닝: 주인공의 결핍(사랑 없는 상태) 시각화\n- 첫 만남(Meet Cute) 비트 필수 포함\n- 미드포인트: 설레는 '가장 가까운 순간'\n- 모든 것을 잃다: 오해·이별·포기\n- 3막: 깨달음 → 용기 → 재결합`,
  drama: `[드라마 구조 강조]\n- 각 비트마다 내면 변화와 외부 사건을 함께 서술\n- 촉발 사건: 주인공의 세계관이 무너지는 계기\n- 모든 것을 잃다: 도덕적·감정적 붕괴\n- 피날레: 외적 해결보다 내적 변화·수용이 중심`,
  comedy: `[코미디 구조 강조]\n- 코미디 전제(premise) 비트 명확히\n- 재미와 게임: 에스컬레이션 필수\n- 미드포인트: 코미디가 반전되는 순간\n- 피날레: 모든 개그 페이오프 + 따뜻한 결말`,
  horror: `[호러 구조 강조]\n- 오프닝: 일상 위협의 전조 + 불안감 씨앗\n- 2막: 공포 강도 점진적 에스컬레이션\n- 미드포인트: 첫 번째 진짜 공포 폭로\n- 3막: 최후 생존 시도`,
  sf: `[SF/판타지 구조 강조]\n- 설정 비트: 세계관 법칙 확립\n- 재미와 게임: SF 아이디어 탐구 구간\n- 미드포인트: 세계관 법칙의 결정적 역설\n- 피날레: SF 아이디어의 인간적 해답`,
  crime: `[범죄/느와르 구조 강조]\n- 오프닝: 범죄 현장 또는 부패한 세계 소개\n- 2막: 단서 배치 + 허위 단서(red herring) 포함\n- 미드포인트: 진실의 일부 폭로 + 더 큰 음모\n- 피날레: 진실 전체 폭로 + 도덕적 대가`,
  animation: `[애니메이션 구조 강조]\n- 시각적 유머·상상력 비트 별도 명시\n- 설정: 타겟 연령대에 맞는 세계관 소개 속도 조정\n- 재미와 게임: 시각적 과장·변형 활용 구간`,
  auto: "",
};

/**
 * Stage 5: 트리트먼트 + 비트 시트 + 씬 리스트 + 대사 디벨롭
 *
 * @param {object} params
 * @param {string}   params.logline             - 현재 로그라인
 * @param {string}   params.genre               - 장르 id
 * @param {string}   params.apiKey              - Anthropic API 키
 * @param {object}   params.charDevResult       - Stage 3 캐릭터 분석 결과
 * @param {object}   params.structureResult     - Stage 4 구조 분석 결과
 * @param {object}   params.pipelineResult      - Stage 1 파이프라인 결과
 * @param {object}   params.synopsisResults     - Stage 4 시놉시스 결과
 * @param {function} params.getDurText          - 포맷 텍스트 반환 함수
 * @param {function} params.getCustomContext    - 커스텀 컨텍스트 반환 함수
 * @param {function} params.getEffective        - writer override 우선 반환 함수
 * @param {function} params.getStoryBible       - 확정 시놉시스 컨텍스트 반환 함수
 * @param {function} params.makeController      - AbortController 생성 헬퍼
 * @param {function} params.clearController     - AbortController 해제 헬퍼
 * @param {function} params.autoSave            - 프로젝트 자동 저장 헬퍼
 * @param {function} params.pushHistory         - 히스토리 push 헬퍼
 * @param {function} params.onBeatSheetGenerated - beat sheet 생성 후 콜백 (scenarioDraft stale 등)
 * @param {function} params.onTreatmentGenerated - treatment 생성 후 콜백
 */
export function useStage5({
  logline,
  genre,
  apiKey,
  charDevResult,
  structureResult,
  pipelineResult,
  synopsisResults,
  getDurText,
  getCustomContext,
  getEffective,
  getStoryBible,
  makeController,
  clearController,
  autoSave,
  pushHistory,
  onBeatSheetGenerated,
  onTreatmentGenerated,
}) {
  // ── 트리트먼트 ──
  const [treatmentChars, setTreatmentChars] = useState({
    protagonist: { name: "", role: "", want: "", need: "", flaw: "", mbti: "", description: "" },
    supporting: [{ name: "", role: "", relation: "", mbti: "", description: "" }],
  });
  const [showManualCharInput, setShowManualCharInput] = useState(false);
  const [treatmentStructure, setTreatmentStructure] = useState("3act");
  const [showTreatmentPanel, setShowTreatmentPanel] = useState(false);
  const [treatmentResult, setTreatmentResult] = useState("");
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [treatmentError, setTreatmentError] = useState("");
  const [treatmentFeedback, setTreatmentFeedback] = useState("");
  const [treatmentRefineLoading, setTreatmentRefineLoading] = useState(false);
  const [treatmentBefore, setTreatmentBefore] = useState(null);
  const [showTreatmentBefore, setShowTreatmentBefore] = useState(false);
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [treatmentStale, setTreatmentStale] = useState(false);
  const [treatmentCtx, setTreatmentCtx] = useState(null);
  const [editingTreatment, setEditingTreatment] = useState(false);
  const [treatmentEditDraft, setTreatmentEditDraft] = useState("");

  // ── 비트 시트 ──
  const [beatSheetResult, setBeatSheetResult] = useState(null);
  const [beatSheetLoading, setBeatSheetLoading] = useState(false);
  const [beatSheetError, setBeatSheetError] = useState("");
  const [beatScenes, setBeatScenes] = useState({});
  const [generatingBeat, setGeneratingBeat] = useState(null);
  const [expandedBeats, setExpandedBeats] = useState({});
  const [allScenesLoading, setAllScenesLoading] = useState(false);
  const [allScenesProgress, setAllScenesProgress] = useState({ current: 0, total: 0, failed: [] });
  const [beatSheetStale, setBeatSheetStale] = useState(false);
  const [beatSheetHistory, setBeatSheetHistory] = useState([]);
  const [beatSheetCtx, setBeatSheetCtx] = useState(null);
  const [editingBeats, setEditingBeats] = useState({});
  const [beatEditDrafts, setBeatEditDrafts] = useState({});

  // ── 씬 리스트 ──
  const [sceneListResult, setSceneListResult] = useState("");
  const [sceneListLoading, setSceneListLoading] = useState(false);
  const [sceneListError, setSceneListError] = useState("");

  // ── 대사 디벨롭 ──
  const [dialogueDevResult, setDialogueDevResult] = useState(null);
  const [dialogueDevLoading, setDialogueDevLoading] = useState(false);
  const [dialogueDevError, setDialogueDevError] = useState("");

  const genreLabel = () =>
    genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

  const generateTreatment = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("treatment");
    setTreatmentLoading(true); setTreatmentError("");
    pushHistory(setTreatmentHistory, treatmentResult, "treatment");
    setTreatmentResult("");
    const label = genreLabel();
    const structureLabel = {
      "3act": "3막 구조 (Field)",
      hero: "영웅의 여정 12단계 (Campbell)",
      "4act": "4막 구조",
      miniseries: "미니시리즈 화별 구조",
      tvdrama: "TV 드라마 감정곡선 구조 — 한국식",
      webdrama: "웹드라마 훅 구조",
    }[treatmentStructure] || "3막 구조 (Field)";

    let charBlock;
    if (charDevResult?.protagonist) {
      const prot = charDevResult.protagonist;
      const lines = [
        `주인공: ${prot.name_suggestion || "주인공"} (${prot.egri_dimensions?.sociological || prot.egri_dimensions?.physiological || ""})`,
        prot.want ? `  - 외적 목표(Want): ${prot.want}` : "",
        prot.need ? `  - 내적 욕구(Need): ${prot.need}` : "",
        prot.ghost ? `  - 과거 상처(Ghost): ${prot.ghost}` : "",
        prot.lie_they_believe ? `  - 믿는 거짓: ${prot.lie_they_believe}` : "",
        ...(charDevResult.supporting_characters || [])
          .filter((s) => s.suggested_name || s.role_name)
          .map((s) => `주요 인물: ${s.suggested_name || ""} (${s.role_name || s.vogler_archetype || ""}) — ${s.relationship_dynamic || s.protagonist_mirror || ""}`)
      ];
      charBlock = lines.filter(Boolean).join("\n");
    } else {
      const proto = treatmentChars.protagonist;
      charBlock = [
        `주인공: ${proto.name || "미정"} (${proto.role || "역할 미정"})`,
        proto.want ? `  - 외적 목표(Want): ${proto.want}` : "",
        proto.need ? `  - 내적 욕구(Need): ${proto.need}` : "",
        proto.flaw ? `  - 핵심 결함: ${proto.flaw}` : "",
        ...treatmentChars.supporting.filter((s) => s.name?.trim()).map((s) =>
          `조력/적대 인물: ${s.name} (${s.role}) — ${s.relation}${s.mbti ? ` [MBTI: ${s.mbti}]` : ""}`)
      ].filter(Boolean).join("\n");
    }

    const structurePlotPoints = structureResult?.plot_points?.length
      ? `\n\n확정된 플롯 포인트:\n${structureResult.plot_points.map(p => `  ${p.name}: ${p.description || ""}`).join("\n")}`
      : "";
    const genreHint = GENRE_BEAT_HINTS[genre] || "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${label}\n서사 구조: ${structureLabel}\n\n등장인물 정보:\n${charBlock}${getStoryBible()}${structurePlotPoints}${genreHint ? `\n\n${genreHint}` : ""}\n\n위 정보를 바탕으로 완성도 높은 트리트먼트를 한국어로 작성해주세요. 시놉시스와 플롯 포인트가 있다면 반드시 그 방향을 따르세요.`;
    try {
      const text = await callClaudeText(apiKey, TREATMENT_SYSTEM_PROMPT, msg, 10000, "claude-sonnet-4-6", ctrl.signal, "treatment");
      setTreatmentResult(text);
      setTreatmentStale(false);
      setTreatmentCtx({
        char: !!charDevResult?.protagonist,
        synopsis: !!(pipelineResult || synopsisResults),
        plotPoints: !!structureResult?.plot_points?.length,
        genre: genre !== "auto" ? label : null,
        structure: structureLabel,
      });
      if (typeof onTreatmentGenerated === "function") onTreatmentGenerated();
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setTreatmentError(err.message || "트리트먼트 생성 중 오류가 발생했습니다.");
    } finally { setTreatmentLoading(false); clearController("treatment"); }
  };

  const refineTreatment = async () => {
    if (!treatmentResult || !treatmentFeedback.trim() || !apiKey) return;
    const ctrl = makeController("treatmentRefine");
    setTreatmentRefineLoading(true);
    const beforeText = getEffective ? getEffective("treatment", treatmentResult) : treatmentResult;
    setTreatmentBefore(beforeText);
    setShowTreatmentBefore(false);
    const effective = getEffective ? getEffective("treatment", treatmentResult) : treatmentResult;
    const msg = `원본 로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}${getStoryBible()}\n\n── 현재 트리트먼트 ──\n${effective.slice(0, 4000)}\n\n── 작가 피드백 ──\n${treatmentFeedback.trim()}\n\n위 피드백을 반영하여 트리트먼트를 수정하세요.`;
    try {
      const text = await callClaudeText(apiKey, TREATMENT_SYSTEM_PROMPT, msg, 10000, "claude-sonnet-4-6", ctrl.signal, "treatment");
      pushHistory(setTreatmentHistory, treatmentResult, "treatment");
      setTreatmentResult(text);
      setTreatmentStale(false);
      setTreatmentFeedback("");
      if (typeof onTreatmentGenerated === "function") onTreatmentGenerated();
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요."));
    } finally { setTreatmentRefineLoading(false); clearController("treatmentRefine"); }
  };

  const generateBeatSheet = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("beatSheet");
    setBeatSheetLoading(true); setBeatSheetError("");
    pushHistory(setBeatSheetHistory, beatSheetResult, "beats");
    setBeatSheetResult(null); setBeatScenes({}); setExpandedBeats({});
    const label = genreLabel();
    const contextBlock = treatmentResult ? `\n\n트리트먼트:\n${treatmentResult.slice(0, 3000)}` : "";
    let charBlock = "";
    if (charDevResult?.protagonist) {
      const p = charDevResult.protagonist;
      const lines = [
        `주인공: ${p.name_suggestion || ""} — Want: ${p.want || ""} / Need: ${p.need || ""} / Ghost: ${p.ghost || ""}`,
        p.flaw ? `  - 핵심 결함: ${p.flaw}` : "",
        ...(charDevResult.supporting_characters || [])
          .filter((s) => s.suggested_name || s.role_name)
          .map((s) => `인물: ${s.suggested_name || ""} (${s.role_name || ""}) — ${s.relationship_dynamic || ""}`)
      ];
      charBlock = lines.filter(Boolean).join("\n");
    }
    const structureBlock = structureResult?.plot_points?.length
      ? `\n\n플롯 포인트:\n${structureResult.plot_points.map((p) => `  ${p.name} (p.${p.page}): ${p.description}`).join("\n")}`
      : "";
    const genreHint = GENRE_BEAT_HINTS[genre] || "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${label}${charBlock ? `\n\n캐릭터 정보:\n${charBlock}` : ""}${getStoryBible()}${structureBlock}${contextBlock}${genreHint ? `\n\n${genreHint}` : ""}\n\n위 정보를 바탕으로 포맷에 맞는 비트 시트를 생성하세요.`;
    try {
      const data = await callClaude(apiKey, BEAT_SHEET_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, BeatSheetSchema, "beatsheet");
      setBeatSheetResult(data);
      setBeatSheetStale(false);
      setBeatSheetCtx({
        char: !!charDevResult?.protagonist,
        treatment: !!treatmentResult,
        synopsis: !!(pipelineResult || synopsisResults),
        plotPoints: !!structureResult?.plot_points?.length,
        genre: genre !== "auto" ? label : null,
      });
      if (typeof onBeatSheetGenerated === "function") onBeatSheetGenerated();
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setBeatSheetError(err.message || "비트 시트 생성 중 오류가 발생했습니다.");
    } finally { setBeatSheetLoading(false); clearController("beatSheet"); }
  };

  const generateScene = async (beat) => {
    if (!apiKey) return;
    setGeneratingBeat(beat.id);
    const ctrl = makeController(`scene_${beat.id}`);
    const charSummary = charDevResult?.protagonist
      ? `주인공: ${charDevResult.protagonist.name_suggestion || "주인공"} (Want: ${charDevResult.protagonist.want || ""}, 말투: ${charDevResult.protagonist.voice_hint || ""})`
      : "";
    const prevScenes = Object.entries(beatScenes)
      .filter(([id]) => Number(id) < beat.id).slice(-3)
      .map(([id, text]) => { const b = beatSheetResult?.beats?.find((b) => b.id === Number(id)); return `[${b?.name_kr || `비트 ${id}`}] ${text.slice(0, 200)}...`; })
      .join("\n\n");
    const msg = `로그라인: "${logline.trim()}"\n${charSummary}\n\n[생성할 비트]\n비트 번호: ${beat.id} / ${beat.name_kr} (${beat.name_en})\n막: ${beat.act} — ${beat.act_phase}\n페이지 범위: p.${beat.page_start}~p.${beat.page_end} (약 ${beat.page_end - beat.page_start + 1}페이지)\n장소: ${beat.location_hint || "미정"}\n등장 인물: ${(beat.characters_present || []).join(", ")}\n이 씬의 기능: ${beat.dramatic_function}\n이 씬에서 일어나는 일: ${beat.summary}\n가치 변화: ${beat.value_start} → ${beat.value_end}\n톤: ${beat.tone}\n반드시 포함: ${(beat.key_elements || []).join(", ")}${prevScenes ? `\n\n이전 씬 요약:\n${prevScenes}` : ""}\n\n위 정보로 시나리오 씬을 한국어로 작성하세요.`;
    try {
      const sceneText = await callClaudeText(apiKey, SCENE_GEN_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", ctrl.signal, "scenario");
      setBeatScenes((prev) => ({ ...prev, [beat.id]: sceneText }));
      setExpandedBeats((prev) => ({ ...prev, [beat.id]: true }));
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setBeatSheetError(`씬 ${beat.id} 생성 오류: ${err.message}`);
    } finally { setGeneratingBeat(null); clearController(`scene_${beat.id}`); }
  };

  const generateAllScenes = async () => {
    if (!apiKey || !beatSheetResult?.beats?.length) return;
    const beats = beatSheetResult.beats;
    setAllScenesLoading(true);
    setAllScenesProgress({ current: 0, total: beats.length, failed: [] });
    setBeatSheetError("");
    const ctrl = makeController("allScenes");
    const localScenes = { ...beatScenes };
    const failedBeats = [];
    try {
      for (let i = 0; i < beats.length; i++) {
        if (ctrl.signal.aborted) break;
        const beat = beats[i];
        setGeneratingBeat(beat.id);
        setAllScenesProgress((prev) => ({ ...prev, current: i + 1, failed: [...failedBeats] }));
        const charSummary = charDevResult?.protagonist
          ? `주인공: ${charDevResult.protagonist.name_suggestion || "주인공"} (Want: ${charDevResult.protagonist.want || ""})`
          : "";
        const prevScenes = Object.entries(localScenes)
          .filter(([id]) => Number(id) < beat.id).slice(-3)
          .map(([id, text]) => { const b = beats.find((b) => b.id === Number(id)); return `[${b?.name_kr || `비트 ${id}`}] ${text.slice(0, 250)}...`; })
          .join("\n\n");
        const msg = `로그라인: "${logline.trim()}"\n${charSummary}\n\n[생성할 비트]\n비트 번호: ${beat.id} / ${beat.name_kr}\n막: ${beat.act}\n페이지: p.${beat.page_start}~p.${beat.page_end}\n이 씬에서 일어나는 일: ${beat.summary}\n가치 변화: ${beat.value_start} → ${beat.value_end}\n톤: ${beat.tone}${prevScenes ? `\n\n이전 씬 흐름:\n${prevScenes}` : ""}\n\n위 정보로 시나리오 씬을 한국어로 작성하세요.`;
        try {
          const sceneText = await callClaudeText(apiKey, SCENE_GEN_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", ctrl.signal, "scenario");
          localScenes[beat.id] = sceneText;
          setBeatScenes((prev) => ({ ...prev, [beat.id]: sceneText }));
          setExpandedBeats((prev) => ({ ...prev, [beat.id]: true }));
        } catch (err) {
          if (err.name === "AbortError") break;
          failedBeats.push({ id: beat.id, name: beat.name_kr });
        }
      }
      await autoSave();
    } finally {
      setAllScenesLoading(false); setGeneratingBeat(null);
      setAllScenesProgress({ current: 0, total: 0, failed: failedBeats });
      clearController("allScenes");
    }
  };

  const generateSceneList = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("sceneList");
    setSceneListLoading(true); setSceneListError(""); setSceneListResult("");
    const label = genreLabel();
    const treatmentBlock = treatmentResult ? `트리트먼트:\n${treatmentResult.slice(0, 3000)}` : "";
    const structureBlock = structureResult
      ? `플롯 포인트:\n${(structureResult.plot_points || []).map(pp => `- ${pp.name} (p.${pp.page}): ${pp.description}`).join("\n")}`
      : "";
    const charBlock = charDevResult?.protagonist
      ? `주인공: ${charDevResult.protagonist.name_suggestion || "주인공"} — ${charDevResult.protagonist.want || ""}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${label}${charBlock ? `\n${charBlock}` : ""}${getStoryBible()}${structureBlock ? `\n\n${structureBlock}` : ""}${treatmentBlock ? `\n\n${treatmentBlock}` : ""}\n\n위 정보를 바탕으로 포맷에 맞는 씬 리스트(스텝 아웃라인)를 작성하세요.`;
    try {
      const text = await callClaudeText(apiKey, SCENE_LIST_SYSTEM_PROMPT, msg, 7000, "claude-sonnet-4-6", ctrl.signal, "scenelist");
      setSceneListResult(text);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setSceneListError(err.message || "씬 리스트 생성 중 오류가 발생했습니다.");
    } finally { setSceneListLoading(false); clearController("sceneList"); }
  };

  const analyzeDialogueDev = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("dialogueDev");
    setDialogueDevLoading(true); setDialogueDevError(""); setDialogueDevResult(null);
    const label = genreLabel();
    let charContext = "";
    if (charDevResult?.protagonist) {
      const p = charDevResult.protagonist;
      const lines = [
        `주인공: ${p.name_suggestion || "주인공"}`,
        p.want ? `  - 목표: ${p.want}` : "",
        p.ghost ? `  - 상처: ${p.ghost}` : "",
        p.flaw ? `  - 결함: ${p.flaw}` : "",
        ...(charDevResult.supporting_characters || [])
          .filter((s) => s.suggested_name || s.role_name)
          .map((s) => `인물: ${s.suggested_name || ""} (${s.role_name || ""})`)
      ];
      charContext = `\n\n등장인물:\n${lines.filter(Boolean).join("\n")}`;
    }
    const msg = `로그라인: "${logline.trim()}"\n장르: ${label}\n포맷: ${getDurText()}${getCustomContext()}${charContext}${getStoryBible()}\n\n위 인물들의 대사 고유 목소리와 하위텍스트 기법을 설계하세요.`;
    try {
      const data = await callClaude(apiKey, DIALOGUE_DEV_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, DialogueDevSchema, "dialoguedev");
      setDialogueDevResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setDialogueDevError(err.message || "대사 디벨롭 중 오류가 발생했습니다.");
    } finally { setDialogueDevLoading(false); clearController("dialogueDev"); }
  };

  /** 프로젝트 저장 직렬화용 */
  const getSerializable = () => ({
    treatmentResult,
    beatSheetResult,
    beatScenes,
    dialogueDevResult,
    sceneListResult,
    treatmentHistory,
    beatSheetHistory,
  });

  /** 프로젝트 로드 시 상태 복원 */
  const loadFrom = (proj) => {
    setTreatmentResult(proj.treatmentResult || "");
    setBeatSheetResult(proj.beatSheetResult || null);
    setBeatScenes(proj.beatScenes || {});
    setDialogueDevResult(proj.dialogueDevResult || null);
    setSceneListResult(proj.sceneListResult || "");
    setTreatmentHistory(proj.treatmentHistory || []);
    setBeatSheetHistory(proj.beatSheetHistory || []);
  };

  return {
    // 트리트먼트
    treatmentChars, setTreatmentChars,
    showManualCharInput, setShowManualCharInput,
    treatmentStructure, setTreatmentStructure,
    showTreatmentPanel, setShowTreatmentPanel,
    treatmentResult, setTreatmentResult,
    treatmentLoading, treatmentError,
    treatmentFeedback, setTreatmentFeedback,
    treatmentRefineLoading,
    treatmentBefore, setTreatmentBefore,
    showTreatmentBefore, setShowTreatmentBefore,
    treatmentHistory, setTreatmentHistory,
    treatmentStale, setTreatmentStale,
    treatmentCtx, setTreatmentCtx,
    editingTreatment, setEditingTreatment,
    treatmentEditDraft, setTreatmentEditDraft,
    // 비트 시트
    beatSheetResult, setBeatSheetResult,
    beatSheetLoading, beatSheetError, setBeatSheetError,
    beatScenes, setBeatScenes,
    generatingBeat,
    expandedBeats, setExpandedBeats,
    allScenesLoading, allScenesProgress,
    beatSheetStale, setBeatSheetStale,
    beatSheetHistory, setBeatSheetHistory,
    beatSheetCtx,
    editingBeats, setEditingBeats,
    beatEditDrafts, setBeatEditDrafts,
    // 씬 리스트
    sceneListResult, setSceneListResult,
    sceneListLoading, sceneListError,
    // 대사
    dialogueDevResult, setDialogueDevResult,
    dialogueDevLoading, dialogueDevError,
    // 핸들러
    generateTreatment,
    refineTreatment,
    generateBeatSheet,
    generateScene,
    generateAllScenes,
    generateSceneList,
    analyzeDialogueDev,
    // 직렬화
    getSerializable,
    loadFrom,
  };
}
