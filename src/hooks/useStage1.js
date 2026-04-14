import { useState } from "react";

/**
 * useStage1 — Stage 1 로그라인 분석 상태 훅
 *
 * logline-analyzer.jsx에서 Stage 1 관련 useState를 분리해 관리한다.
 * 로직 함수(analyze, runExpertPanel, etc.)는 현재 logline-analyzer.jsx에 있으며,
 * 해당 함수들이 이 훅으로 이전되면 params를 통해 연결된다.
 *
 * 포함하는 상태:
 *  - 로그라인 분석 결과 (result, loading, error)
 *  - 비교 모드 (compareMode, logline2, result2, loading2)
 *  - 상업성 체크 (earlyCoverageResult/Loading/Error)
 *  - AI 개선 제안 (storyFixes, storyPivots, aiImprovement)
 *  - 종합 인사이트 (insightResult/Loading/Error)
 *
 * NOTE: expertPanel / pipeline 상태는 logline-analyzer.jsx가 직접 관리한다.
 */
export function useStage1() {
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

  // ── AI 개선 제안 ──
  const [storyFixes, setStoryFixes] = useState([]);
  const [storyPivots, setStoryPivots] = useState([]);
  const [aiImprovement, setAiImprovement] = useState(null);

  // ── 종합 인사이트 ──
  const [insightResult, setInsightResult] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  return {
    // 로그라인 분석
    result, setResult,
    loading, setLoading,
    error, setError,
    // 비교 모드
    compareMode, setCompareMode,
    logline2, setLogline2,
    result2, setResult2,
    loading2, setLoading2,
    // 상업성 체크
    earlyCoverageResult, setEarlyCoverageResult,
    earlyCoverageLoading, setEarlyCoverageLoading,
    earlyCoverageError, setEarlyCoverageError,
    // AI 개선 제안
    storyFixes, setStoryFixes,
    storyPivots, setStoryPivots,
    aiImprovement, setAiImprovement,
    // 종합 인사이트
    insightResult, setInsightResult,
    insightLoading, setInsightLoading,
    insightError, setInsightError,
  };
}
