import { createContext, useContext } from "react";

/**
 * LoglineContext — 모든 스테이지에서 공유되는 값
 *
 * 포함:
 * - 입력: logline, setLogline, genre, setGenre
 * - 인증/API: apiKey, isDemoMode, hasOwnApiKey, canUseAllStages, user, credits, cc
 * - UI: isMobile, darkMode
 * - 교육 모드: eduMode, setEduMode
 * - 네비게이션: currentStage, setCurrentStage, advanceToStage, stageRefs
 * - 스테이지 상태: getStageStatus, getStageDoneCount, STAGE_TOTALS, statusDotColor
 * - 액션: showToast, openApplicationDoc
 * - 포맷: getDurText, getCustomContext
 * - 결과 요약: stageResultSummary (사이드바 배지용, 스테이지별 핵심 수치)
 */
const LoglineContext = createContext(null);

export function LoglineProvider({ value, children }) {
  return (
    <LoglineContext.Provider value={value}>
      {children}
    </LoglineContext.Provider>
  );
}

export function useLoglineCtx() {
  const ctx = useContext(LoglineContext);
  if (!ctx) throw new Error("useLoglineCtx must be used inside LoglineProvider");
  return ctx;
}
