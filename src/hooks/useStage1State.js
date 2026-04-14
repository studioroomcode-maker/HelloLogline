import { useState } from "react";

/**
 * useStage1State — Stage 1 (로그라인 분석) 전용 상태 모음
 *
 * logline-analyzer.jsx의 god-component에서 Stage 1 관련 useState를
 * 분리하여 관리합니다. 로직(analyze 함수 등)은 호출자에 유지됩니다.
 */
export function useStage1State() {
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

  // ── AI 개선 제안 (StoryDevPanel / ImprovementPanel) ──
  const [storyFixes, setStoryFixes] = useState([]);
  const [storyPivots, setStoryPivots] = useState([]);
  const [aiImprovement, setAiImprovement] = useState(null);

  // ── 종합 인사이트 ──
  const [insightResult, setInsightResult] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  return {
    result, setResult,
    loading, setLoading,
    error, setError,
    compareMode, setCompareMode,
    logline2, setLogline2,
    result2, setResult2,
    loading2, setLoading2,
    earlyCoverageResult, setEarlyCoverageResult,
    earlyCoverageLoading, setEarlyCoverageLoading,
    earlyCoverageError, setEarlyCoverageError,
    storyFixes, setStoryFixes,
    storyPivots, setStoryPivots,
    aiImprovement, setAiImprovement,
    insightResult, setInsightResult,
    insightLoading, setInsightLoading,
    insightError, setInsightError,
  };
}
