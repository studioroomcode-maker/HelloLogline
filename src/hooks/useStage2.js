import { useState } from "react";
import { callClaude } from "../utils.js";
import {
  ACADEMIC_ANALYSIS_SYSTEM_PROMPT,
  MYTH_MAP_SYSTEM_PROMPT, BARTHES_CODE_SYSTEM_PROMPT,
  KOREAN_MYTH_SYSTEM_PROMPT, THEME_ANALYSIS_SYSTEM_PROMPT,
  GENRES,
} from "../constants.js";
import {
  AcademicAnalysisSchema, MythMapSchema, BarthesCodeSchema,
  KoreanMythSchema, ThemeAnalysisSchema,
} from "../schemas.js";

/**
 * Stage 2: 서사 이론 종합
 * (학술 분석 / 신화 매핑 / 바르트 코드 / 한국 미학 / 테마 분석)
 *
 * @param {object} params
 * @param {string}   params.logline          - 현재 로그라인
 * @param {string}   params.genre            - 장르 id
 * @param {string}   params.apiKey           - Anthropic API 키
 * @param {object}   params.charDevResult    - Stage 3 캐릭터 분석 결과 (테마/구조 컨텍스트용)
 * @param {function} params.getDurText       - 포맷 텍스트 반환 함수
 * @param {function} params.getCustomContext - 커스텀 컨텍스트 반환 함수
 * @param {function} params.getStoryBible    - 스토리 바이블 반환 함수
 * @param {function} params.makeController   - AbortController 생성 헬퍼
 * @param {function} params.clearController  - AbortController 해제 헬퍼
 * @param {function} params.autoSave         - 프로젝트 자동 저장 헬퍼
 */
export function useStage2({
  logline,
  genre,
  apiKey,
  charDevResult,
  getDurText,
  getCustomContext,
  getStoryBible,
  makeController,
  clearController,
  autoSave,
}) {
  const [academicResult, setAcademicResult] = useState(null);
  const [academicLoading, setAcademicLoading] = useState(false);
  const [academicError, setAcademicError] = useState("");

  const [mythMapResult, setMythMapResult] = useState(null);
  const [mythMapLoading, setMythMapLoading] = useState(false);
  const [mythMapError, setMythMapError] = useState("");

  const [barthesCodeResult, setBarthesCodeResult] = useState(null);
  const [barthesCodeLoading, setBarthesCodeLoading] = useState(false);
  const [barthesCodeError, setBarthesCodeError] = useState("");

  const [koreanMythResult, setKoreanMythResult] = useState(null);
  const [koreanMythLoading, setKoreanMythLoading] = useState(false);
  const [koreanMythError, setKoreanMythError] = useState("");

  const [themeResult, setThemeResult] = useState(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeError, setThemeError] = useState("");

  const genreLabel = () =>
    genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

  const analyzeAcademic = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("academic");
    setAcademicLoading(true); setAcademicError(""); setAcademicResult(null);
    const msg = `다음 로그라인을 제시된 학술 이론 체계 전체에 걸쳐 엄밀하게 분석하세요.\n\n로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n글자 수: ${logline.length}자\n\n아리스토텔레스 시학, 프롭 민담 형태론, 캠벨 영웅 여정, 토도로프 서사 이론, 바르트 서사 코드, 프라이탁 피라미드, 질만 흥분 전이 이론, 머레이 스미스 관객 참여 이론, 한국 서사 미학을 각각 적용하여 분석하세요.`;
    try {
      const data = await callClaude(apiKey, ACADEMIC_ANALYSIS_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, AcademicAnalysisSchema, "academic");
      setAcademicResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setAcademicError(err.message || "학술 분석 중 오류가 발생했습니다.");
    } finally { setAcademicLoading(false); clearController("academic"); }
  };

  const analyzeMythMap = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("mythMap");
    setMythMapLoading(true); setMythMapError(""); setMythMapResult(null);
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인을 캠벨 영웅 여정-프롭 민담 형태론-프레이저 신화 이론으로 신화적 위치를 매핑하세요.`;
    try {
      const data = await callClaude(apiKey, MYTH_MAP_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, MythMapSchema, "mythmap");
      setMythMapResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setMythMapError(err.message || "신화 매핑 중 오류가 발생했습니다.");
    } finally { setMythMapLoading(false); clearController("mythMap"); }
  };

  const analyzeBarthesCode = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("barthesCode");
    setBarthesCodeLoading(true); setBarthesCodeError(""); setBarthesCodeResult(null);
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인을 롤랑 바르트의 S/Z(1970) 5개 서사 코드로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, BARTHES_CODE_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, BarthesCodeSchema, "barthes");
      setBarthesCodeResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setBarthesCodeError(err.message || "바르트 코드 분석 중 오류가 발생했습니다.");
    } finally { setBarthesCodeLoading(false); clearController("barthesCode"); }
  };

  const analyzeKoreanMyth = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("koreanMyth");
    setKoreanMythLoading(true); setKoreanMythError(""); setKoreanMythResult(null);
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel()}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인의 한국 신화-미학 공명을 한(恨)-정(情)-신명(神明)-무속-유교 미학으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, KOREAN_MYTH_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, KoreanMythSchema, "koreantmyth");
      setKoreanMythResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setKoreanMythError(err.message || "한국 신화 분석 중 오류가 발생했습니다.");
    } finally { setKoreanMythLoading(false); clearController("koreanMyth"); }
  };

  const analyzeTheme = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("theme");
    setThemeLoading(true); setThemeError(""); setThemeResult(null);
    const charBlock = charDevResult?.protagonist
      ? `주인공 Want: ${charDevResult.protagonist.want || ""} / Need: ${charDevResult.protagonist.need || ""} / Ghost: ${charDevResult.protagonist.ghost || ""}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel()}${charBlock ? `\n\n캐릭터 정보:\n${charBlock}` : ""}${getStoryBible()}\n\n위 로그라인의 핵심 테마, 도덕적 전제, 감정선을 분석하세요. 시놉시스가 있다면 그 방향의 이야기를 기반으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, THEME_ANALYSIS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ThemeAnalysisSchema, "theme");
      setThemeResult(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setThemeError(err.message || "테마 분석 중 오류가 발생했습니다.");
    } finally { setThemeLoading(false); clearController("theme"); }
  };

  /** 5개 분석 병렬 실행 */
  const analyzeNarrativeTheory = async () => {
    if (!logline.trim() || !apiKey) return;
    await Promise.all([
      analyzeAcademic(),
      analyzeMythMap(),
      analyzeBarthesCode(),
      analyzeKoreanMyth(),
      analyzeTheme(),
    ]);
  };

  const narrativeTheoryDone = !!(academicResult || mythMapResult || barthesCodeResult || koreanMythResult || themeResult);
  const narrativeTheoryLoading = academicLoading || mythMapLoading || barthesCodeLoading || koreanMythLoading || themeLoading;

  /** 프로젝트 저장 직렬화용 */
  const getSerializable = () => ({
    academicResult,
    mythMapResult,
    barthesCodeResult,
    koreanMythResult,
    themeResult,
  });

  /** 프로젝트 로드 시 상태 복원 */
  const loadFrom = (proj) => {
    setAcademicResult(proj.academicResult || null);
    setMythMapResult(proj.mythMapResult || null);
    setBarthesCodeResult(proj.barthesCodeResult || null);
    setKoreanMythResult(proj.koreanMythResult || null);
    setThemeResult(proj.themeResult || null);
  };

  return {
    academicResult, setAcademicResult,
    academicLoading, academicError,
    mythMapResult, setMythMapResult,
    mythMapLoading, mythMapError,
    barthesCodeResult, setBarthesCodeResult,
    barthesCodeLoading, barthesCodeError,
    koreanMythResult, setKoreanMythResult,
    koreanMythLoading, koreanMythError,
    themeResult, setThemeResult,
    themeLoading, themeError,
    narrativeTheoryDone, narrativeTheoryLoading,
    analyzeAcademic,
    analyzeMythMap,
    analyzeBarthesCode,
    analyzeKoreanMyth,
    analyzeTheme,
    analyzeNarrativeTheory,
    getSerializable,
    loadFrom,
  };
}
