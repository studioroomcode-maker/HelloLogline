import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, SvgIcon, ICON } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import { ExpertPanelSection } from "../panels/ConceptPanels.jsx";

export default function Stage2Content({
  expertPanelResult, setExpertPanelResult,
  expertPanelLoading, expertPanelError,
  runExpertPanel,
}) {
  const { logline, isMobile, cc, getStageStatus, advanceToStage } = useLoglineCtx();

  return (
    <ErrorBoundary><div>

      {/* ── 선택 단계 안내 ── */}
      <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 10, background: "rgba(69,183,209,0.05)", border: "1px solid rgba(69,183,209,0.15)", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
        <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
          <strong style={{ color: "rgba(69,183,209,0.85)" }}>선택 개념 분석 단계입니다.</strong> 로그라인이 확정된 지금, 학술 이론과 신화구조로 이야기의 방향과 테마를 설계하세요.<br />
          건너뛰어도 되고, 언제든 돌아올 수 있습니다.
        </div>
      </div>

      {!logline.trim() && (
        <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.15)", fontSize: 11, color: "var(--c-tx-40)", display: "flex", alignItems: "center", gap: 7 }}>
          <span>💡</span>
          <span>Stage 1에서 로그라인을 먼저 입력하세요. 더 정확한 분석 결과를 얻을 수 있습니다.</span>
        </div>
      )}

      {/* ── 전문가 패널 ── */}
      <div style={{ marginTop: 8 }}>
        <ToolButton
          icon={<SvgIcon d={ICON.users} size={16} />}
          label="전문가 패널"
          sub="현업 전문가 10인의 독립 시각"
          done={!!expertPanelResult}
          loading={expertPanelLoading}
          color="#FFD166"
          onClick={runExpertPanel}
          disabled={!logline.trim()}
          tooltip={"시나리오 작가, 제작사 PD, 문학평론가, 마케터 등 현업 전문가 10인이 이 로그라인을 독립적으로 평가합니다.\n\n라운드 1 — 각자 개별 의견 제시\n라운드 2 — 의견 교환 후 토론\n종합 — 합의점·핵심 강점 도출\n\n실제 방송사·제작사 심사 환경과 유사한 피드백을 얻을 수 있습니다."}
          creditCost={cc(1)}
        />
        <ErrorMsg msg={expertPanelError} />
        {expertPanelResult && (
          <ResultCard title="전문가 패널 토론" onClose={() => setExpertPanelResult(null)} color="rgba(255,209,102,0.15)">
            <ErrorBoundary><ExpertPanelSection data={expertPanelResult} isMobile={isMobile} /></ErrorBoundary>
          </ResultCard>
        )}
      </div>

      {getStageStatus("2") === "done" && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => advanceToStage("3")}
            style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
          >
            다음 단계: 캐릭터
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

    </div></ErrorBoundary>
  );
}
