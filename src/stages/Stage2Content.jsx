import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, SvgIcon, ICON } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import { ExpertPanelSection, MythMapPanel, BarthesCodePanel, KoreanMythPanel, ThemeAnalysisPanel } from "../panels/ConceptPanels.jsx";
import { AcademicPanel } from "../panels.jsx";
import StagePdfButton from "../components/StagePdfButton.jsx";

// 서사 이론 분석 완료 개수 계산
function countNarrativeResults(academicResult, mythMapResult, barthesCodeResult, koreanMythResult, themeResult) {
  return [academicResult, mythMapResult, barthesCodeResult, koreanMythResult, themeResult].filter(Boolean).length;
}

function SectionHeader({ title, badge, color = "#45B7D1" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 4,
    }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{title}</span>
        {badge && (
          <span style={{
            marginLeft: 8, fontSize: 9, fontWeight: 700,
            padding: "2px 7px", borderRadius: 10,
            background: `${color}14`, border: `1px solid ${color}28`,
            color, fontFamily: "'JetBrains Mono', monospace",
          }}>{badge}</span>
        )}
      </div>
    </div>
  );
}

export default function Stage2Content({
  expertPanelResult, setExpertPanelResult,
  expertPanelLoading, expertPanelError, expertPanelProgress,
  runExpertPanel,
  // 서사 이론
  narrativeTheoryDone, narrativeTheoryLoading,
  analyzeNarrativeTheory,
  academicResult, mythMapResult, barthesCodeResult, koreanMythResult, themeResult,
}) {
  const { logline, isMobile, cc, getStageStatus, advanceToStage, isDemoMode } = useLoglineCtx();

  const narrativeCount = countNarrativeResults(academicResult, mythMapResult, barthesCodeResult, koreanMythResult, themeResult);
  const disabled = !logline.trim();
  const [r1Opened, setR1Opened] = useState(false);

  return (
    <ErrorBoundary><div>
    <style>{`
      @keyframes hll-pulse-violet {
        0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); }
        50% { box-shadow: 0 0 0 4px rgba(167,139,250,0.45); }
      }
      @keyframes hll-pulse-gold {
        0%, 100% { box-shadow: 0 0 0 0 rgba(200,168,75,0); }
        50% { box-shadow: 0 0 0 5px rgba(200,168,75,0.4); }
      }
    `}</style>

      <StagePdfButton stageId="2" />

      {/* ── 단계 안내 ── */}
      <div style={{ marginBottom: 22, padding: "12px 14px", borderRadius: 10, background: "rgba(69,183,209,0.05)", borderLeft: "2px solid rgba(69,183,209,0.4)" }}>
        <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
          <strong style={{ color: "rgba(69,183,209,0.85)" }}>선택 개념 분석 단계입니다.</strong> 학술 이론·신화구조·전문가 패널로 이야기의 테마와 방향을 설계하세요.
          건너뛰어도 되고, 언제든 돌아올 수 있습니다.
        </div>
      </div>

      {disabled && (
        <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(200,168,75,0.06)", borderLeft: "2px solid rgba(200,168,75,0.4)", fontSize: 11, color: "var(--c-tx-40)" }}>
          Stage 1에서 로그라인을 먼저 입력하세요.
        </div>
      )}

      {/* ─────────── GROUP 1: 서사 이론 종합 ─────────── */}
      <div style={{
        padding: "16px 16px 14px", borderRadius: 12, marginBottom: 14,
        background: "var(--glass-micro)", border: "1px solid var(--glass-bd-nano)",
        boxShadow: "inset 0 1px 0 var(--glass-bd-nano)",
      }}>
        <SectionHeader title="서사 이론 종합" badge={narrativeCount > 0 ? `${narrativeCount}/5 완료` : "추천"} color="#45B7D1" />

        <ToolButton
          icon={<SvgIcon d={ICON.doc} size={16} />}
          label="서사 이론 종합 분석"
          sub="Campbell · Barthes · 학술 이론 · 한국 미학 · 테마 (5가지 동시 실행)"
          done={narrativeTheoryDone}
          loading={narrativeTheoryLoading}
          color="#45B7D1"
          onClick={analyzeNarrativeTheory}
          disabled={disabled}
          tooltip={"5가지 서사 이론을 동시에 분석합니다:\n• 학술 서사 이론 (Aristotle, Freytag, Syd Field)\n• 신화 지도 (Campbell 영웅 여정)\n• 바르트 코드 (Roland Barthes S/Z)\n• 한국 신화·미학 공명\n• 핵심 테마 분석\n\n한 번 클릭으로 5가지 관점의 이론적 기반을 동시에 완성합니다."}
          creditCost={cc(2)}
        />

        {/* 개별 결과 요약 배지 */}
        {narrativeCount > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {[
              { label: "학술 이론", done: !!academicResult },
              { label: "신화 지도", done: !!mythMapResult },
              { label: "바르트 코드", done: !!barthesCodeResult },
              { label: "한국 미학", done: !!koreanMythResult },
              { label: "핵심 테마", done: !!themeResult },
            ].map(({ label, done }) => (
              <span key={label} style={{
                fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                padding: "3px 8px", borderRadius: 6,
                background: done ? "rgba(78,204,163,0.10)" : "var(--glass-nano)",
                border: `1px solid ${done ? "rgba(78,204,163,0.28)" : "var(--glass-bd-nano)"}`,
                color: done ? "#4ECCA3" : "var(--c-tx-30)",
              }}>
                {done ? "✓ " : ""}{label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─────────── 서사 이론 결과 패널들 ─────────── */}
      {academicResult && (
        <ResultCard title="학술 서사 이론" color="rgba(69,183,209,0.15)">
          <ErrorBoundary><AcademicPanel academic={academicResult} /></ErrorBoundary>
        </ResultCard>
      )}
      {mythMapResult && (
        <ResultCard title="신화 지도 (Campbell 영웅 여정)" color="rgba(167,139,250,0.15)">
          <ErrorBoundary><MythMapPanel data={mythMapResult} isMobile={isMobile} /></ErrorBoundary>
        </ResultCard>
      )}
      {barthesCodeResult && (
        <ResultCard title="바르트 코드 (S/Z)" color="rgba(78,204,163,0.15)">
          <ErrorBoundary><BarthesCodePanel data={barthesCodeResult} isMobile={isMobile} /></ErrorBoundary>
        </ResultCard>
      )}
      {koreanMythResult && (
        <ResultCard title="한국 신화·미학 공명" color="rgba(247,160,114,0.15)">
          <ErrorBoundary><KoreanMythPanel data={koreanMythResult} isMobile={isMobile} /></ErrorBoundary>
        </ResultCard>
      )}
      {themeResult && (
        <ResultCard title="핵심 테마 분석" color="rgba(200,168,75,0.15)">
          <ErrorBoundary><ThemeAnalysisPanel data={themeResult} isMobile={isMobile} /></ErrorBoundary>
        </ResultCard>
      )}

      {/* ─────────── GROUP 2: 전문가 패널 ─────────── */}
      <div style={{
        padding: "16px 16px 14px", borderRadius: 12, marginBottom: 8,
        background: "var(--glass-micro)", border: "1px solid var(--glass-bd-nano)",
        boxShadow: "inset 0 1px 0 var(--glass-bd-nano)",
      }}>
        <SectionHeader title="전문가 패널" badge={expertPanelResult ? "완료" : "심화"} color="#FFD166" />

        <ToolButton
          icon={<SvgIcon d={ICON.users} size={16} />}
          label="전문가 패널 토론"
          sub="현업 전문가 10인의 독립적 시각 — 방송사·제작사 실제 심사 환경 재현"
          done={!!expertPanelResult}
          loading={expertPanelLoading}
          color="#FFD166"
          onClick={runExpertPanel}
          disabled={disabled}
          tooltip={"시나리오 작가, 제작사 PD, 문학평론가, 마케터 등 현업 전문가 10인이 이 로그라인을 독립적으로 평가합니다.\n\n라운드 1 — 각자 개별 의견 제시\n라운드 2 — 의견 교환 후 토론\n종합 — 합의점·핵심 강점 도출\n\n실제 방송사·제작사 심사 환경과 유사한 피드백을 얻을 수 있습니다."}
          creditCost={cc(1)}
        />
        {expertPanelLoading && expertPanelProgress > 0 && (
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6, marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>
            생성 중... ({expertPanelProgress.toLocaleString()}자)
          </div>
        )}
        <ErrorMsg msg={expertPanelError} />
        {expertPanelResult && (
          <ResultCard title="전문가 패널 토론" onClose={() => setExpertPanelResult(null)} color="rgba(255,209,102,0.15)">
            <ErrorBoundary><ExpertPanelSection data={expertPanelResult} isMobile={isMobile} onR1Open={() => setR1Opened(true)} /></ErrorBoundary>
          </ResultCard>
        )}
      </div>

    </div></ErrorBoundary>
  );
}
