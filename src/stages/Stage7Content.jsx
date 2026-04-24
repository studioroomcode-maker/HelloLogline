import { Suspense, lazy } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, DocButton, SvgIcon, ICON } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import StagePdfButton from "../components/StagePdfButton.jsx";

const ScriptCoveragePanel = lazy(() =>
  import("../panels/EvaluationPanels.jsx").then((m) => ({ default: m.ScriptCoveragePanel }))
);
const ValuationPanel = lazy(() =>
  import("../panels/EvaluationPanels.jsx").then((m) => ({ default: m.ValuationPanel }))
);

export default function Stage7Content({
  scriptCoverageResult, setScriptCoverageResult,
  valuationResult, setValuationResult,
  scriptCoverageLoading, valuationLoading,
  scriptCoverageError, valuationError,
  analyzeScriptCoverage, analyzeValuation,
  charGuide, charGuideLoading, charGuideError,
  rewriteGuide, rewriteGuideLoading, rewriteGuideError,
  generateCharGuide, generateRewriteGuide,
}) {
  const { logline, isMobile, cc, advanceToStage, openApplicationDoc, isDemoMode } = useLoglineCtx();

  return (
    <ErrorBoundary><div>

      <StagePdfButton stageId="7" />

      {/* ── 단계 안내 ── */}
      <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 10, background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>📋</span>
        <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
          <strong style={{ color: "rgba(96,165,250,0.9)" }}>실제 방송사·제작사 심사 방식으로 작품을 평가합니다.</strong>{" "}
          RECOMMEND / CONSIDER / PASS 판정과 함께 각 항목 등급을 받습니다. 시장 가치 추정과 함께 고쳐쓰기 전 어디를 먼저 수정해야 하는지 우선순위도 나옵니다.
        </div>
      </div>

      <ToolButton
        icon={<SvgIcon d={ICON.clipboard} size={16} />}
        label="최종 평가"
        sub="Script Coverage · 시장 가치"
        done={!!(scriptCoverageResult || valuationResult)}
        loading={scriptCoverageLoading || valuationLoading}
        color="#60A5FA"
        onClick={async () => { await analyzeScriptCoverage(); await analyzeValuation(); }}
        disabled={!logline.trim()}
        tooltip={"할리우드 스튜디오와 한국 방송사 스타일의 공식 심사 보고서를 생성하고 시장 가치를 추정합니다.\n\n• Script Coverage — RECOMMEND / CONSIDER / PASS 3단계 판정\n• 시장 가치 — 한국·미국 시장 추정 판매가 · 신인/경력 기준"}
        creditCost={cc(4)}
      />
      <ErrorMsg msg={scriptCoverageError || valuationError} />

      {scriptCoverageResult && (
        <>
          <ResultCard title="Script Coverage" onClose={() => setScriptCoverageResult(null)} color="rgba(96,165,250,0.15)">
            <Suspense fallback={<div style={{ padding: 16, color: "var(--c-tx-30)", fontSize: 12 }}>로딩 중...</div>}>
              <ErrorBoundary><ScriptCoveragePanel data={scriptCoverageResult} isMobile={isMobile} /></ErrorBoundary>
            </Suspense>
          </ResultCard>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <DocButton label="투자·지원 제안서 PDF" sub="커버리지 포함 완성 제안서" onClick={() => openApplicationDoc("final")} />
          </div>
        </>
      )}

      {valuationResult && (
        <ResultCard title="시장 가치 평가" onClose={() => setValuationResult(null)} color="rgba(255,209,102,0.15)">
          <Suspense fallback={<div style={{ padding: 16, color: "var(--c-tx-30)", fontSize: 12 }}>로딩 중...</div>}>
            <ErrorBoundary><ValuationPanel data={valuationResult} isMobile={isMobile} /></ErrorBoundary>
          </Suspense>
        </ResultCard>
      )}

      {(scriptCoverageResult || valuationResult) && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)" }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginBottom: 10 }}>다음 작업 선택</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => advanceToStage("8")}
              style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(251,146,60,0.4)", background: "rgba(251,146,60,0.1)", color: "#FB923C", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              고쳐쓰기 →
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
            <button onClick={() => advanceToStage("3")}
              style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.05)", color: "var(--c-tx-45)", fontSize: 12, cursor: "pointer" }}>
              ← 캐릭터 수정 (3)
            </button>
            <button onClick={() => advanceToStage("4")}
              style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.05)", color: "var(--c-tx-45)", fontSize: 12, cursor: "pointer" }}>
              ← 스토리 수정 (4)
            </button>
          </div>
        </div>
      )}

    </div></ErrorBoundary>
  );
}
