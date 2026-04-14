import { useState, useRef, useMemo, useCallback } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, FeedbackBox, SvgIcon, ICON, ScriptExportPanel } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import FountainEditor from "../editor/FountainEditor.jsx";
import SceneNavigator from "../editor/SceneNavigator.jsx";
import InlineAI from "../editor/InlineAI.jsx";
import { parseFountain, calcStats } from "../editor/FountainParser.js";

/** 통계 pill 컴포넌트 */
function StatPill({ label, value, color = "var(--c-tx-40)" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
      padding: "3px 8px", borderRadius: 10,
      background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)",
      color,
    }}>
      <span style={{ color: "var(--c-tx-30)" }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </span>
  );
}

export default function Stage6Content({
  scenarioDraftResult, setScenarioDraftResult,
  scenarioDraftLoading, scenarioDraftError,
  generateScenarioDraft,
  scenarioDraftStale, setScenarioDraftStale,
  scenarioDraftHistory, setScenarioDraftHistory,
  refineScenarioDraft, scenarioDraftRefineLoading,
  scenarioDraftFeedback, setScenarioDraftFeedback,
  scenarioDraftCtx,
  scenarioDraftBefore, showScenarioDraftBefore, setShowScenarioDraftBefore,
  undoHistory,
}) {
  const { logline, isMobile, cc, getStageStatus, advanceToStage, showToast, apiKey, sceneAssignments, teamMembers } = useLoglineCtx();
  const [editorMode, setEditorMode] = useState(true);   // true = 편집 모드 / false = 원본 텍스트
  const editorContainerRef = useRef(null);

  // ── 인라인 AI: 선택 구간 교체 ──────────────────────
  const handleInlineReplace = useCallback((original, replacement) => {
    if (!scenarioDraftResult) return;
    const updated = scenarioDraftResult.replace(original, replacement);
    setScenarioDraftResult(updated);
    showToast("success", "AI 수정이 적용됐습니다.");
  }, [scenarioDraftResult, setScenarioDraftResult, showToast]);

  // ── Fountain 파싱 및 통계 ──────────────────────────────
  const tokens = useMemo(
    () => parseFountain(scenarioDraftResult || ""),
    [scenarioDraftResult]
  );
  const stats = useMemo(() => calcStats(tokens), [tokens]);

  return (
    <ErrorBoundary><div>

      {/* ── 안내 배너 ── */}
      <div style={{ marginBottom: 18, padding: "14px 16px", borderRadius: 12, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA", marginBottom: 6 }}>이 단계에 대해 솔직하게</div>
        <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.7 }}>
          이 시나리오는 <strong style={{ color: "var(--c-tx-75)" }}>구조 스캐폴드</strong>입니다 — 완성본이 아닙니다.<br />
          AI가 Fountain 포맷으로 전체 초고를 작성하면 <strong style={{ color: "var(--c-tx-75)" }}>에디터에서 바로 편집·수정</strong>할 수 있습니다.
          <span style={{ color: "rgba(167,139,250,0.7)", fontSize: 11, marginTop: 4, display: "block" }}>Stage 5의 트리트먼트·비트 시트·대사 디벨롭을 모두 완료하면 훨씬 완성도 높은 초고가 나옵니다.</span>
        </div>
      </div>

      {!logline.trim() && (
        <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.15)", fontSize: 11, color: "var(--c-tx-40)", display: "flex", alignItems: "center", gap: 7 }}>
          <span>💡</span>
          <span>Stage 1에서 로그라인을 먼저 입력하세요.</span>
        </div>
      )}

      {/* ── 생성 버튼 ── */}
      <ToolButton
        icon={<SvgIcon d={ICON.film} size={16} />}
        label="시나리오 초고 생성"
        sub="Fountain 포맷 · Field · McKee · Snyder"
        done={!!scenarioDraftResult}
        loading={scenarioDraftLoading}
        color="#A78BFA"
        onClick={generateScenarioDraft}
        disabled={!logline.trim()}
        tooltip={"로그라인·캐릭터·트리트먼트·비트 시트를 바탕으로 Fountain 포맷 시나리오 초고를 작성합니다.\n\n생성 후 에디터에서 바로 편집할 수 있습니다.\n씬 목록 사이드바로 빠른 네비게이션도 가능합니다."}
        creditCost={cc(5)}
      />
      <ErrorMsg msg={scenarioDraftError} onRetry={scenarioDraftError ? generateScenarioDraft : undefined} />

      {/* ── Stale 경고 ── */}
      {scenarioDraftStale && scenarioDraftResult && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, marginTop: 8, background: "rgba(247,160,114,0.07)", border: "1px solid rgba(247,160,114,0.25)" }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
          <div style={{ flex: 1, fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.5 }}>
            트리트먼트 또는 비트 시트가 변경됐습니다. 재생성하면 최신 내용이 반영됩니다.
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => setScenarioDraftStale(false)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-35)", fontSize: 10, cursor: "pointer" }}>무시</button>
            <button onClick={generateScenarioDraft} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(247,160,114,0.4)", background: "rgba(247,160,114,0.1)", color: "#F7A072", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>재생성</button>
          </div>
        </div>
      )}

      {/* ── 시나리오 에디터 영역 ── */}
      {scenarioDraftResult && (
        <ResultCard
          title="시나리오 초고"
          onClose={() => { setScenarioDraftResult(""); setScenarioDraftHistory([]); setScenarioDraftStale(false); }}
          onUndo={() => undoHistory(setScenarioDraftHistory, setScenarioDraftResult, scenarioDraftHistory)}
          historyCount={scenarioDraftHistory.length}
          color="rgba(167,139,250,0.15)"
        >
          {/* 컨텍스트 배지 */}
          {scenarioDraftCtx && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {scenarioDraftCtx.genre && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.2)" }}>{scenarioDraftCtx.genre}</span>}
              {scenarioDraftCtx.char && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(251,146,60,0.1)", color: "#FB923C", border: "1px solid rgba(251,146,60,0.2)" }}>캐릭터 반영</span>}
              {scenarioDraftCtx.synopsis && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(78,204,163,0.1)", color: "#4ECCA3", border: "1px solid rgba(78,204,163,0.2)" }}>시놉시스 반영</span>}
              {scenarioDraftCtx.treatment && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(200,168,75,0.1)", color: "#C8A84B", border: "1px solid rgba(200,168,75,0.2)" }}>트리트먼트 반영</span>}
              {scenarioDraftCtx.beats && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(255,209,102,0.1)", color: "#FFD166", border: "1px solid rgba(255,209,102,0.2)" }}>비트 시트 반영</span>}
              {scenarioDraftCtx.dialogue && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(244,114,182,0.1)", color: "#F472B6", border: "1px solid rgba(244,114,182,0.2)" }}>대사 목소리 반영</span>}
            </div>
          )}

          {/* ── 통계 + 모드 토글 헤더 ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {/* 통계 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              <StatPill label="씬" value={stats.sceneCount} color="#A78BFA" />
              <StatPill label="페이지" value={`~${stats.pages}p`} color="#C8A84B" />
              <StatPill label="러닝타임" value={`~${stats.runningMinutes}분`} color="#4ECCA3" />
              <StatPill label="단어" value={stats.wordCount.toLocaleString()} />
            </div>
            {/* 에디터/원본 토글 */}
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setEditorMode(true)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
                  border: editorMode ? "1px solid rgba(167,139,250,0.4)" : "1px solid var(--glass-bd-nano)",
                  background: editorMode ? "rgba(167,139,250,0.12)" : "var(--glass-nano)",
                  color: editorMode ? "#A78BFA" : "var(--c-tx-35)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                ✏️ 에디터
              </button>
              <button
                onClick={() => setEditorMode(false)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
                  border: !editorMode ? "1px solid rgba(167,139,250,0.4)" : "1px solid var(--glass-bd-nano)",
                  background: !editorMode ? "rgba(167,139,250,0.12)" : "var(--glass-nano)",
                  color: !editorMode ? "#A78BFA" : "var(--c-tx-35)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                📄 원본
              </button>
            </div>
          </div>

          {/* ── 내보내기 ── */}
          <ScriptExportPanel
            scriptText={scenarioDraftResult}
            logline={logline}
            onCopy={() => navigator.clipboard.writeText(scenarioDraftResult).then(() => showToast("success", "시나리오 초고가 복사되었습니다."))}
          />

          {/* ── 에디터 모드: 씬 네비게이터 + Fountain 에디터 ── */}
          {editorMode ? (
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              border: "1px solid var(--glass-bd-nano)",
              borderRadius: 10,
              overflow: "hidden",
              background: "var(--glass-nano)",
              marginTop: 6,
              minHeight: 500,
            }}>
              {/* 씬 네비게이터 */}
              <SceneNavigator
                tokens={tokens}
                editorContainerRef={editorContainerRef}
                isMobile={isMobile}
                sceneAssignments={sceneAssignments}
                teamMembers={teamMembers}
              />

              {/* 에디터 패널 */}
              <div
                ref={editorContainerRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  maxHeight: isMobile ? 500 : 680,
                  padding: 0,
                  position: "relative",  // InlineAI 툴바 absolute 기준
                }}
              >
                <FountainEditor
                  value={scenarioDraftResult}
                  onChange={(newText) => setScenarioDraftResult(newText)}
                  minHeight={460}
                />
                {/* 인라인 AI 툴바 */}
                {apiKey && (
                  <InlineAI
                    editorContainerRef={editorContainerRef}
                    apiKey={apiKey}
                    onReplace={handleInlineReplace}
                  />
                )}
              </div>
            </div>
          ) : (
            /* ── 원본 텍스트 모드 ── */
            <pre style={{
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: isMobile ? 11 : 12, lineHeight: 1.75,
              color: "var(--c-tx-75)", margin: 0,
              background: "var(--glass-nano)", padding: "16px",
              borderRadius: 10, border: "1px solid var(--glass-bd-nano)",
              maxHeight: 680, overflowY: "auto",
            }}>
              {scenarioDraftResult}
            </pre>
          )}

          {/* ── AI 피드백 박스 ── */}
          <FeedbackBox
            value={scenarioDraftFeedback}
            onChange={setScenarioDraftFeedback}
            onSubmit={refineScenarioDraft}
            loading={scenarioDraftRefineLoading}
            placeholder="수정 요청을 입력하세요 (예: 2막 클라이맥스를 더 긴박하게)"
          />

          {/* ── 이전 버전 ── */}
          {scenarioDraftBefore && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--c-bd-2)" }}>
              <button
                onClick={() => setShowScenarioDraftBefore(!showScenarioDraftBefore)}
                style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-35)", cursor: "pointer" }}
              >
                {showScenarioDraftBefore ? "▲ 이전 버전 숨기기" : "▼ 이전 버전 보기"}
              </button>
              {showScenarioDraftBefore && (
                <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 9, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)", opacity: 0.65 }}>
                  <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>BEFORE — 피드백 반영 전</div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.7, fontFamily: "'Courier New', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 200, overflowY: "auto" }}>
                    {scenarioDraftBefore.slice(0, 800)}{scenarioDraftBefore.length > 800 ? "..." : ""}
                  </div>
                </div>
              )}
            </div>
          )}
        </ResultCard>
      )}

      {/* ── 다음 단계 ── */}
      {getStageStatus("6") === "done" && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => advanceToStage("7")} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s", fontFamily: "'Noto Sans KR', sans-serif" }}>
            다음 단계: Script Coverage
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

    </div></ErrorBoundary>
  );
}
