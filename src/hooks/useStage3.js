import { useState } from "react";
import { callClaude } from "../utils.js";
import {
  SHADOW_ANALYSIS_SYSTEM_PROMPT,
  AUTHENTICITY_SYSTEM_PROMPT,
  CHARACTER_DEV_SYSTEM_PROMPT,
} from "../constants.js";
import { ShadowAnalysisSchema, AuthenticitySchema, CharacterDevSchema } from "../schemas.js";
import { GENRES } from "../constants.js";

/**
 * Stage 3: 캐릭터 심층 분석 (Jung 그림자 / 실존 진정성 / 캐릭터 디벨롭)
 *
 * @param {object} params
 * @param {string}   params.logline        - 현재 로그라인
 * @param {string}   params.genre          - 장르 id
 * @param {string}   params.apiKey         - Anthropic API 키
 * @param {object}   params.treatmentChars - 인물 직접 설정 (protagonist, supporting)
 * @param {function} params.getDurText     - 포맷 텍스트 반환 함수
 * @param {function} params.getCustomContext - 커스텀 컨텍스트 반환 함수
 * @param {function} params.getStoryBible  - 스토리 바이블 반환 함수
 * @param {function} params.makeController - AbortController 생성 헬퍼
 * @param {function} params.clearController- AbortController 해제 헬퍼
 * @param {function} params.autoSave       - 프로젝트 자동 저장 헬퍼
 * @param {function} params.pushHistory    - 히스토리 push 헬퍼
 */
export function useStage3({
  logline,
  genre,
  apiKey,
  treatmentChars,
  getDurText,
  getCustomContext,
  getStoryBible,
  makeController,
  clearController,
  autoSave,
  pushHistory,
}) {
  const [shadowResult, setShadowResult] = useState(null);
  const [shadowLoading, setShadowLoading] = useState(false);
  const [shadowError, setShadowError] = useState("");

  const [authenticityResult, setAuthenticityResult] = useState(null);
  const [authenticityLoading, setAuthenticityLoading] = useState(false);
  const [authenticityError, setAuthenticityError] = useState("");

  const [charDevResult, setCharDevResult] = useState(null);
  const [charDevLoading, setCharDevLoading] = useState(false);
  const [charDevError, setCharDevError] = useState("");
  const [charDevHistory, setCharDevHistory] = useState([]);

  const genreLabel = () =>
    genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

  /** 공통 charHint 빌더 */
  const buildCharHint = (priority = false) => {
    const p = treatmentChars?.protagonist;
    if (!p?.name) return "";
    const heading = priority
      ? "[작가 설정 — 이 정보를 우선하여 캐릭터를 분석하세요]"
      : "[작가 설정]";
    return (
      `\n\n${heading}\n주인공: ${p.name}` +
      (p.role ? ` (${p.role})` : "") +
      (p.want ? `\n외적 목표: ${p.want}` : "") +
      (p.need ? `\n내적 욕구: ${p.need}` : "") +
      (p.flaw ? `\n핵심 결함: ${p.flaw}` : "") +
      (treatmentChars.supporting || [])
        .filter((s) => s.name)
        .map((s) => `\n조연: ${s.name}${s.role ? ` (${s.role})` : ""}${s.relation ? ` — ${s.relation}` : ""}`)
        .join("")
    );
  };

  const analyzeShadow = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("shadow");
    setShadowLoading(true); setShadowError(""); setShadowResult(null);
    const charHint = buildCharHint();
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}${charHint}\n\n위 로그라인의 캐릭터 원형을 Jung의 분석심리학으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, SHADOW_ANALYSIS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ShadowAnalysisSchema, "character");
      setShadowResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setShadowError(err.message || "그림자 분석 중 오류가 발생했습니다.");
    } finally { setShadowLoading(false); clearController("shadow"); }
  };

  const analyzeAuthenticity = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("authenticity");
    setAuthenticityLoading(true); setAuthenticityError(""); setAuthenticityResult(null);
    const charHint = buildCharHint();
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}${charHint}\n\n위 로그라인의 진정성 지수를 실존주의 철학으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, AUTHENTICITY_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, AuthenticitySchema, "character");
      setAuthenticityResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setAuthenticityError(err.message || "진정성 분석 중 오류가 발생했습니다.");
    } finally { setAuthenticityLoading(false); clearController("authenticity"); }
  };

  const analyzeCharacterDev = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("charDev");
    setCharDevLoading(true); setCharDevError("");
    pushHistory(setCharDevHistory, charDevResult, "character");
    setCharDevResult(null);
    const charHint = buildCharHint(true);
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n포맷: ${getDurText()}${getCustomContext()}${getStoryBible()}${charHint}\n\n위 로그라인의 인물들을 Egri-Hauge-Truby-Vogler-Jung-Maslow-Stanislavski 이론으로 깊이 발굴하고 구조화하세요. 시놉시스가 있다면 그 방향의 인물 이름·설정을 따르세요.`;
    try {
      const data = await callClaude(apiKey, CHARACTER_DEV_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, CharacterDevSchema, "character");
      setCharDevResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setCharDevError(err.message || "캐릭터 분석 중 오류가 발생했습니다.");
    } finally { setCharDevLoading(false); clearController("charDev"); }
  };

  const analyzeCharacterAll = async () => {
    if (!logline.trim() || !apiKey) return;
    await Promise.all([
      analyzeShadow(),
      analyzeAuthenticity(),
      analyzeCharacterDev(),
    ]);
  };

  const charAllDone = !!(shadowResult || authenticityResult || charDevResult);
  const charAllLoading = shadowLoading || authenticityLoading || charDevLoading;

  /** 프로젝트 저장 직렬화용 */
  const getSerializable = () => ({
    shadowResult,
    authenticityResult,
    charDevResult,
    charDevHistory,
  });

  /** 프로젝트 로드 시 상태 복원 */
  const loadFrom = (proj) => {
    setShadowResult(proj.shadowResult || null);
    setAuthenticityResult(proj.authenticityResult || null);
    setCharDevResult(proj.charDevResult || null);
    setCharDevHistory(proj.charDevHistory || []);
  };

  return {
    shadowResult, setShadowResult,
    shadowLoading, shadowError,
    authenticityResult, setAuthenticityResult,
    authenticityLoading, authenticityError,
    charDevResult, setCharDevResult,
    charDevLoading, charDevError,
    charDevHistory, setCharDevHistory,
    charAllDone, charAllLoading,
    analyzeShadow,
    analyzeAuthenticity,
    analyzeCharacterDev,
    analyzeCharacterAll,
    getSerializable,
    loadFrom,
  };
}
