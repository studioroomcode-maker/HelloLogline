import { useState, useEffect, lazy, Suspense } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { loadProjects } from "../db.js";
import { WORK_MODES } from "../workModes.js";
import { maybeWarnPrereq, STAGE_PREREQUISITES } from "../stagePrereqWarn.js";

const ReverseImportModal = lazy(() => import("./ReverseImportModal.jsx"));

const STAGE_META = [
  { id: "1", name: "로그라인",      sub: "점수·분석",         color: "#C8A84B" },
  { id: "2", name: "핵심 설계",     sub: "Want·Need·적대자",  color: "#A78BFA" },
  { id: "3", name: "캐릭터",        sub: "심리·아크",         color: "#FB923C" },
  { id: "4", name: "스토리 설계",   sub: "구조·시놉시스",     color: "#4ECCA3" },
  { id: "5", name: "트리트먼트",    sub: "씬·비트시트",       color: "#C8A84B" },
  { id: "6", name: "시나리오 초고", sub: "자동 생성",         color: "#A78BFA" },
  { id: "7", name: "Script Coverage", sub: "심사·시장가치",   color: "#60A5FA" },
  { id: "8", name: "고쳐쓰기",     sub: "진단·수정·개고",    color: "#FB923C" },
  { id: "9", name: "Deep Analysis", sub: "신화·학술·전문가",  color: "#45B7D1" },
];

// ── 크레딧 사용 내역 로드 ──────────────────────────
function loadCreditHistory() {
  try {
    return JSON.parse(localStorage.getItem("hll_credit_history") || "[]");
  } catch {
    return [];
  }
}

// STAGE_PREREQUISITES는 src/stagePrereqWarn.js에서 공통 정의 (SidebarNavItem·DashboardView 모두 사용).
// WORK_MODES는 src/workModes.js에서 공통 정의.

export default function DashboardView() {
  const {
    logline, genre,
    getStageStatus, getStageDoneCount, STAGE_TOTALS,
    stageResultSummary, advanceToStage, showToast,
    user, credits,
    isMobile,
    openPitchDeck, openStoryBibleDoc,
    generateMasterReport, masterReportResult, masterReportLoading, masterReportError,
    onReverseImport,
    reverseEntryStage,
    isDemoMode, demoTourStep,
    developmentNotes, setShowNotesPanel,
    sceneCards, setShowScenePanel,
  } = useLoglineCtx();

  const [showReverseModal, setShowReverseModal] = useState(false);

  function handleStageClick(id) {
    // 역방향 진입 시 진입 스테이지 이하는 전제조건 경고도 우회
    if (reverseEntryStage && parseInt(id) <= parseInt(reverseEntryStage)) {
      advanceToStage(id);
      return;
    }
    maybeWarnPrereq(id, getStageStatus, showToast);
    advanceToStage(id);
  }

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [creditHistory, setCreditHistory] = useState([]);
  const [projectDisplayCount, setProjectDisplayCount] = useState(20);

  useEffect(() => {
    loadProjects()
      .then(list => setProjects(list))
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
    setCreditHistory(loadCreditHistory().slice(0, 10));
  }, []);

  // 메인 진행률은 1~8단계 기준 (Stage 9 Deep Analysis는 선택형이라 제외).
  const doneStages = STAGE_META.filter(s => s.id !== "9" && getStageStatus(s.id) === "done").length;
  const progressPct = Math.round((doneStages / 8) * 100);

  // 프로젝트 검색 필터
  const genreOptions = [...new Set(projects.map(p => p.genre).filter(Boolean).filter(g => g !== "auto"))];
  const filteredProjects = projects.filter(p => {
    const text = (p.title || p.logline || "").toLowerCase();
    const matchQ = !searchQuery || text.includes(searchQuery.toLowerCase());
    const matchG = !filterGenre || p.genre === filterGenre;
    return matchQ && matchG;
  });
  const visibleProjects = filteredProjects.slice(0, projectDisplayCount);
  const hasMoreProjects = filteredProjects.length > projectDisplayCount;

  const score1 = stageResultSummary?.["1"];
  const coverage7 = stageResultSummary?.["7"];
  const coverageColor = coverage7 === "RECOMMEND" ? "#4ECCA3" : coverage7 === "PASS" ? "#E85D75" : "#FFD166";

  // 이어서 작업할 첫 미완 스테이지 (1~8)
  const activeStageId = ["1","2","3","4","5","6","7","8"].find(id => getStageStatus(id) !== "done") || "8";

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--s6)" }}>

      {/* ── 역방향 임포트 모달 ── */}
      {showReverseModal && (
        <Suspense fallback={null}>
          <ReverseImportModal onClose={() => setShowReverseModal(false)} />
        </Suspense>
      )}

      {/* ── 이어서 작업하기 / 신규 히어로 ── */}
      <ResumeHero
        logline={logline}
        genre={genre}
        isMobile={isMobile}
        activeStageId={activeStageId}
        advanceToStage={advanceToStage}
        onImport={() => setShowReverseModal(true)}
        openPitchDeck={openPitchDeck}
        openStoryBibleDoc={openStoryBibleDoc}
        credits={credits}
      />

      {/* ── 현황 지표 스트립 ── */}
      <div>
        <SectionLabel hint="이번 프로젝트 기준">현황</SectionLabel>
        <MetricStrip
          score1={score1}
          coverage7={coverage7}
          coverageColor={coverageColor}
          credits={credits}
          doneStages={doneStages}
          progressPct={progressPct}
        />
      </div>

      {/* ── 파이프라인 ── */}
      <div>
        <SectionLabel hint={logline ? `${doneStages}/8 완료 · ${STAGE_META.find(s=>s.id===activeStageId)?.name} 진행` : "로그라인부터 순서대로"}>파이프라인</SectionLabel>
        {/* ── 데모 투어 Step 0 안내 ── */}
        {isDemoMode && demoTourStep === 0 && (
          <div style={{
            marginBottom: 14, padding: "16px 18px",
            borderRadius: 14, animation: "fadeSlideUp 0.35s var(--ease-spring)",
            background: "linear-gradient(135deg, rgba(200,168,75,0.13) 0%, rgba(200,168,75,0.06) 100%)",
            border: "1px solid rgba(200,168,75,0.45)",
            boxShadow: "0 4px 20px rgba(200,168,75,0.12)",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ flexShrink: 0, animation: "demoBounceArrow 1.4s ease-in-out infinite" }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#C8A84B", marginBottom: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>
                여기서 시작해보세요! (1/3)
              </div>
              <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>
                샘플 시나리오의 분석 결과가 준비됐어요.
                아래 <strong style={{ color: "#C8A84B" }}>로그라인</strong> 카드를 눌러보세요.
              </div>
            </div>
            <button
              onClick={() => advanceToStage("1")}
              style={{
                flexShrink: 0, padding: "10px 18px", borderRadius: 10,
                border: "none", background: "#C8A84B", color: "#0c0c1c",
                fontSize: 12, fontWeight: 800, cursor: "pointer",
                fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "nowrap",
                boxShadow: "0 4px 14px rgba(200,168,75,0.45)",
              }}
            >
              로그라인 보기 →
            </button>
          </div>
        )}
        <PipelineBoard
          isMobile={isMobile}
          activeStageId={activeStageId}
          getStageStatus={getStageStatus}
          getStageDoneCount={getStageDoneCount}
          STAGE_TOTALS={STAGE_TOTALS}
          stageResultSummary={stageResultSummary}
          onStageClick={handleStageClick}
          isDemoMode={isDemoMode}
          demoTourStep={demoTourStep}
        />
      </div>

      {/* ── 통합 마스터 리포트 ── */}
      {logline && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, color: "var(--c-tx-30)", fontWeight: 700, letterSpacing: 0.5 }}>통합 마스터 리포트</div>
            <button
              onClick={generateMasterReport}
              disabled={masterReportLoading}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 8,
                border: "1px solid rgba(167,139,250,0.3)",
                background: masterReportLoading ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.08)",
                color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: masterReportLoading ? "wait" : "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              {masterReportLoading ? (
                <span style={{ display: "inline-block", width: 10, height: 10, border: "1.5px solid rgba(167,139,250,0.3)", borderTop: "1.5px solid #A78BFA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
              {masterReportLoading ? "분석 중..." : "AI 종합 분석"}
            </button>
          </div>
          {masterReportError && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(232,93,117,0.07)", border: "1px solid rgba(232,93,117,0.2)", fontSize: 11, color: "#E85D75", marginBottom: 10 }}>
              {masterReportError}
            </div>
          )}
          {masterReportResult && <MasterReportPanel result={masterReportResult} />}
        </div>
      )}

      {/* ── AI 코칭 메시지 ── */}
      <CoachingTips
        getStageStatus={getStageStatus}
        logline={logline}
        stageResultSummary={stageResultSummary}
        doneStages={doneStages}
      />

      {/* ── 다음 추천 단계 ── */}
      <NextStepSuggestion
        getStageStatus={getStageStatus}
        advanceToStage={advanceToStage}
        logline={logline}
        stageResultSummary={stageResultSummary}
      />

      {/* ── 씬 카드 보드 카드 (sceneCards) ── */}
      {logline && (sceneCards?.length > 0 || true) && (() => {
        const total = (sceneCards || []).length;
        const drafted = (sceneCards || []).filter(c => c.status === "drafted").length;
        const revised = (sceneCards || []).filter(c => c.status === "revised").length;
        const outline = total - drafted - revised;
        return (
          <button
            onClick={() => setShowScenePanel(true)}
            style={{
              width: "100%", marginTop: 14, padding: "14px 18px",
              borderRadius: 14,
              background: total > 0
                ? "linear-gradient(135deg, rgba(78,204,163,0.10), var(--glass-micro))"
                : "var(--glass-micro)",
              border: total > 0 ? "1px solid rgba(78,204,163,0.30)" : "1px solid var(--glass-bd-nano)",
              boxShadow: total > 0 ? "inset 0 1px 0 rgba(78,204,163,0.18)" : "inset 0 1px 0 var(--glass-bd-nano)",
              cursor: "pointer", textAlign: "left",
              fontFamily: "'Noto Sans KR', sans-serif",
              display: "flex", alignItems: "center", gap: 14,
              transition: "transform 0.18s var(--ease-spring)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: total > 0 ? "rgba(78,204,163,0.16)" : "var(--glass-nano)",
              border: total > 0 ? "1px solid rgba(78,204,163,0.4)" : "1px solid var(--c-bd-3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={total > 0 ? "#4ECCA3" : "var(--c-tx-40)"} strokeWidth={2} strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-30)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                씬 카드 보드
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)" }}>
                {total === 0 ? "씬 카드 없음" : `씬 ${total}개 — 초안 ${drafted} · 수정 ${revised}`}
              </div>
              <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2, lineHeight: 1.5 }}>
                {total === 0
                  ? "비트시트에서 자동 생성하거나 직접 추가해 씬 단위로 작업하세요."
                  : `아웃라인 ${outline} · 비트시트에서 자동 시드 가능`}
              </div>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-35)" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        );
      })()}

      {/* ── 수정 과제 보드 카드 (developmentNotes) ── */}
      {logline && (() => {
        const openCount = (developmentNotes || []).filter(n => n.status === "open").length;
        const appliedCount = (developmentNotes || []).filter(n => n.status === "applied").length;
        const total = (developmentNotes || []).length;
        return (
          <button
            onClick={() => setShowNotesPanel(true)}
            style={{
              width: "100%", marginTop: 22, padding: "14px 18px",
              borderRadius: 14,
              background: openCount > 0
                ? "linear-gradient(135deg, rgba(251,146,60,0.10), var(--glass-micro))"
                : "var(--glass-micro)",
              border: openCount > 0
                ? "1px solid rgba(251,146,60,0.32)"
                : "1px solid var(--glass-bd-nano)",
              boxShadow: openCount > 0 ? "inset 0 1px 0 rgba(251,146,60,0.18)" : "inset 0 1px 0 var(--glass-bd-nano)",
              cursor: "pointer", textAlign: "left",
              fontFamily: "'Noto Sans KR', sans-serif",
              display: "flex", alignItems: "center", gap: 14,
              transition: "transform 0.18s var(--ease-spring), box-shadow 0.18s var(--ease-spring)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: openCount > 0 ? "rgba(251,146,60,0.16)" : "var(--glass-nano)",
              border: openCount > 0 ? "1px solid rgba(251,146,60,0.4)" : "1px solid var(--c-bd-3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={openCount > 0 ? "#FB923C" : "var(--c-tx-40)"} strokeWidth={2} strokeLinecap="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-30)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                수정 과제 보드
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)" }}>
                {total === 0
                  ? "아직 노트가 없습니다"
                  : openCount > 0
                    ? `지금 고칠 것 ${openCount}개`
                    : `모든 과제 처리 완료 (적용 ${appliedCount})`}
              </div>
              <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2, lineHeight: 1.5 }}>
                {total === 0
                  ? "Coverage·로그라인 분석·Risk Check가 자동으로 노트를 채웁니다."
                  : `전체 ${total}개 · 적용 ${appliedCount} · 열림 ${openCount}`}
              </div>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-35)" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        );
      })()}

      {/* ── 스테이지 연결 맵 ── */}
      <StageFlowMap getStageStatus={getStageStatus} advanceToStage={advanceToStage} isMobile={isMobile} />

      {/* ── 크레딧 사용 내역 ── */}
      {creditHistory.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-30)", fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>
            크레딧 사용 내역
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {creditHistory.map((h, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 12px", borderRadius: 8,
                border: "1px solid var(--c-bd-1)", background: "rgba(255,255,255,0.01)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif" }}>{h.feature}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace" }}>
                    -{h.amount}cr
                  </span>
                  <span style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(h.date).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 최근 프로젝트 (검색/필터 포함) ── */}
      {!projectsLoading && projects.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "var(--c-tx-30)", fontWeight: 700, letterSpacing: 0.5 }}>
              최근 프로젝트
            </div>
            <span style={{ fontSize: 10, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>
              {filteredProjects.length}/{projects.length}
            </span>
          </div>
          {/* 검색 + 장르 필터 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--c-tx-30)" }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setProjectDisplayCount(20); }}
                placeholder="제목·로그라인 검색..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "7px 10px 7px 28px", borderRadius: 8,
                  border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.03)",
                  color: "var(--text-main)", fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
                }}
              />
            </div>
            {genreOptions.length > 0 && (
              <select
                value={filterGenre}
                onChange={e => { setFilterGenre(e.target.value); setProjectDisplayCount(20); }}
                style={{
                  padding: "7px 10px", borderRadius: 8,
                  border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.03)",
                  color: filterGenre ? "var(--text-main)" : "var(--c-tx-35)",
                  fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif",
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value="">전체 장르</option>
                {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredProjects.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", fontSize: 11, color: "var(--c-tx-30)", borderRadius: 8, border: "1px dashed var(--c-bd-2)" }}>
                검색 결과가 없습니다
              </div>
            ) : visibleProjects.map(p => (
              <div
                key={p.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 9,
                  border: "1px solid var(--c-bd-1)", background: "rgba(255,255,255,0.01)",
                  cursor: "default",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--c-tx-60)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.title || p.logline?.slice(0, 50) || "제목 없음"}
                  </div>
                  {p.genre && p.genre !== "auto" && (
                    <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: 2 }}>{p.genre}</div>
                  )}
                </div>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, marginLeft: 10 }}>
                  {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("ko-KR") : ""}
                </div>
              </div>
            ))}
            {hasMoreProjects && (
              <button
                onClick={() => setProjectDisplayCount(c => c + 20)}
                style={{
                  marginTop: 4, padding: "8px 0", borderRadius: 8,
                  border: "1px dashed var(--c-bd-2)", background: "transparent",
                  color: "var(--c-tx-35)", fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif", cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--c-tx-60)"; e.currentTarget.style.borderColor = "var(--c-bd-3)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--c-tx-35)"; e.currentTarget.style.borderColor = "var(--c-bd-2)"; }}
              >
                더 보기 ({filteredProjects.length - projectDisplayCount}개 더)
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ── 통합 마스터 리포트 패널 ───────────────────────────
const READINESS_META = {
  READY:       { label: "제작 준비 완료",    color: "#4ECCA3", bg: "rgba(78,204,163,0.08)"  },
  NEAR_READY:  { label: "거의 준비됨",       color: "#45B7D1", bg: "rgba(69,183,209,0.08)"  },
  DEVELOPING:  { label: "개발 진행 중",      color: "#FFD166", bg: "rgba(255,209,102,0.08)" },
  EARLY_STAGE: { label: "초기 단계",         color: "#E85D75", bg: "rgba(232,93,117,0.08)"  },
};

function MasterReportPanel({ result }) {
  const meta = READINESS_META[result.production_readiness] || READINESS_META.DEVELOPING;
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${meta.color}30`, background: meta.bg, padding: "18px 20px" }}>
      {/* 헤더: 점수 + 판정 */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center", padding: "10px 18px", borderRadius: 10, border: `1px solid ${meta.color}30`, background: "rgba(var(--tw),0.03)" }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: meta.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{result.overall_score}</div>
          <div style={{ fontSize: 8, color: "var(--c-tx-30)", marginTop: 4 }}>/ 100</div>
        </div>
        <div>
          <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, fontSize: 10, fontWeight: 700, color: meta.color, marginBottom: 6 }}>
            {meta.label}
          </div>
          {result.verdict && (
            <div style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.7, maxWidth: 440, fontFamily: "'Noto Sans KR', sans-serif" }}>
              {result.verdict}
            </div>
          )}
        </div>
      </div>

      {/* 강점 / 약점 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {result.strengths?.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.05)" }}>
            <div style={{ fontSize: 9, color: "#4ECCA3", fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>핵심 강점</div>
            {result.strengths.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <span style={{ color: "#4ECCA3", flexShrink: 0, fontSize: 10 }}>+</span>
                <span style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        )}
        {result.weaknesses?.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(232,93,117,0.2)", background: "rgba(232,93,117,0.05)" }}>
            <div style={{ fontSize: 9, color: "#E85D75", fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>개선 필요</div>
            {result.weaknesses.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <span style={{ color: "#E85D75", flexShrink: 0, fontSize: 10 }}>△</span>
                <span style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.5 }}>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 필수 수정 */}
      {result.critical_fixes?.length > 0 && (
        <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(247,160,114,0.25)", background: "rgba(247,160,114,0.05)" }}>
          <div style={{ fontSize: 9, color: "#F7A072", fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>제작 전 필수 수정</div>
          {result.critical_fixes.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
              <span style={{ color: "#F7A072", flexShrink: 0, fontSize: 10 }}>!</span>
              <span style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.55 }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* 단계별 평가 (stage_assessments) */}
      {result.stage_assessments && Object.keys(result.stage_assessments).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: "var(--c-tx-30)", fontWeight: 700, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>단계별 진단</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { key: "logline",   label: "로그라인",    icon: "01" },
              { key: "character", label: "캐릭터",      icon: "03" },
              { key: "story",     label: "스토리 구조", icon: "04" },
              { key: "treatment", label: "트리트먼트",  icon: "05" },
              { key: "coverage",  label: "Coverage",    icon: "07" },
            ].filter(s => result.stage_assessments[s.key]).map(({ key, label, icon }) => (
              <div key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.01)" }}>
                <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: `${meta.color}12`, border: `1px solid ${meta.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: meta.color, fontFamily: "'JetBrains Mono', monospace" }}>{icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--c-tx-30)", fontWeight: 700, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{result.stage_assessments[key]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다음 우선순위 */}
      {result.next_priority && (
        <div style={{ fontSize: 11, color: meta.color, fontWeight: 700, padding: "8px 12px", borderRadius: 8, background: `${meta.color}08`, border: `1px solid ${meta.color}20` }}>
          ▶ 지금 당장: {result.next_priority}
        </div>
      )}
    </div>
  );
}

// ── AI 코칭 메시지 ─────────────────────────────────
function CoachingTips({ getStageStatus, logline, stageResultSummary, doneStages }) {
  const tips = [];

  const score1Raw = stageResultSummary?.["1"];
  const score1Num = score1Raw ? parseInt(score1Raw, 10) : null;

  if (!logline) {
    tips.push({ color: "#C8A84B", text: "로그라인은 주인공 + 목표 + 갈등의 세 요소를 한 문장에 담아야 합니다." });
  } else if (score1Num !== null && score1Num < 60) {
    tips.push({ color: "#E85D75", text: `로그라인 점수가 ${score1Num}점으로 낮습니다. 갈등과 스테이크를 더 구체적으로 명시하세요.` });
  } else if (score1Num !== null && score1Num >= 80) {
    tips.push({ color: "#4ECCA3", text: `로그라인 점수 ${score1Num}점 — 탄탄한 기초입니다. 다음 단계로 진행하세요.` });
  }

  if (getStageStatus("1") === "done" && getStageStatus("3") !== "done") {
    tips.push({ color: "#FB923C", text: "캐릭터 설계(Stage 3)를 먼저 하면 스토리 구조가 훨씬 명확해집니다." });
  }

  if (getStageStatus("4") === "done" && getStageStatus("5") !== "done") {
    tips.push({ color: "#4ECCA3", text: "시놉시스가 완성됐습니다. 트리트먼트(Stage 5)에서 씬 단위로 쪼개세요." });
  }

  if (getStageStatus("6") === "done" && getStageStatus("7") !== "done") {
    tips.push({ color: "#60A5FA", text: "초고 완성 후 Script Coverage(Stage 7)로 방송사 시각의 피드백을 받아보세요." });
  }

  const coverage7 = stageResultSummary?.["7"];
  if (coverage7 === "PASS") {
    tips.push({ color: "#FB923C", text: "Coverage 결과 'PASS' — 고쳐쓰기(Stage 8)에서 지적된 항목을 집중 수정하세요." });
  }

  if (doneStages >= 5 && doneStages < 8) {
    tips.push({ color: "#A78BFA", text: `${doneStages}/8 스테이지 완료. 나머지 ${8 - doneStages}개를 마치면 완성 프로젝트가 됩니다.` });
  }

  if (tips.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: "var(--c-tx-25)", fontWeight: 700, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
        Next Steps
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {tips.map((tip, i) => (
          <div key={i} style={{
            padding: "9px 12px 9px 14px",
            borderRadius: 8,
            borderLeft: `2px solid ${tip.color}`,
            background: `${tip.color}05`,
          }}>
            <span style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>
              {tip.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 스테이지 연결 맵 ───────────────────────────────
// 메인 워크플로우 맵: Stage 9 (Deep Analysis)는 선택형이라 워크플로우 맵에서는 제외.
const FLOW_STAGES = [
  { id: "1", label: "로그라인", color: "#C8A84B" },
  { id: "2", label: "핵심설계", color: "#A78BFA" },
  { id: "3", label: "캐릭터",   color: "#FB923C" },
  { id: "4", label: "스토리",   color: "#4ECCA3" },
  { id: "5", label: "트리트",   color: "#C8A84B" },
  { id: "6", label: "초고",     color: "#A78BFA" },
  { id: "7", label: "Coverage", color: "#60A5FA" },
  { id: "8", label: "고쳐쓰기", color: "#FB923C" },
];

function StageFlowMap({ getStageStatus, advanceToStage, isMobile }) {
  return (
    <div style={{ marginTop: 28, marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: "var(--c-tx-30)", fontWeight: 700, letterSpacing: 0.5 }}>
          워크플로우 맵
        </div>
        <div style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3 }}>
          진척도 ≠ 작품 완성도
        </div>
      </div>
      <div style={{
        // 모바일: 그리드 4열, 셀 자동 wrap. 데스크탑: 가로 한 줄 + 가로 스크롤.
        display: isMobile ? "grid" : "flex",
        gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : undefined,
        gap: isMobile ? 6 : 0,
        alignItems: "center",
        overflowX: isMobile ? "visible" : "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        padding: "4px 0 8px",
      }}>
        {FLOW_STAGES.map((s, i) => {
          const status = getStageStatus(s.id);
          const isDone = status === "done";
          const isActive = status === "active";
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0, minWidth: 0 }}>
              {/* 스테이지 노드 */}
              <button
                onClick={() => advanceToStage(s.id)}
                title={`Stage ${s.id}: ${s.label}`}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 4, padding: isMobile ? "6px 4px" : "8px 10px", borderRadius: 10,
                  border: `1px solid ${isDone ? s.color + "50" : isActive ? s.color + "30" : "var(--c-bd-2)"}`,
                  background: isDone ? `${s.color}12` : isActive ? `${s.color}06` : "transparent",
                  cursor: "pointer",
                  width: isMobile ? "100%" : undefined,
                  minWidth: isMobile ? 0 : 64,
                  transition: "all 0.18s",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: isDone ? s.color : isActive ? `${s.color}30` : "var(--c-bd-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 800, color: isDone ? "#000" : "var(--c-tx-40)",
                  fontFamily: "'JetBrains Mono', monospace",
                  flexShrink: 0,
                }}>
                  {isDone ? "✓" : s.id}
                </div>
                <span style={{
                  fontSize: 8, color: isDone ? s.color : isActive ? s.color : "var(--c-tx-30)",
                  fontWeight: isDone ? 700 : 400, fontFamily: "'Noto Sans KR', sans-serif",
                  textAlign: "center", whiteSpace: "nowrap",
                  maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {s.label}
                </span>
              </button>
              {/* 연결 화살표 — 데스크탑에서만. 모바일은 그리드 wrap이라 화살표 부적합. */}
              {!isMobile && i < FLOW_STAGES.length - 1 && (
                <div style={{
                  width: 20, height: 1,
                  background: isDone ? `linear-gradient(90deg, ${s.color}60, ${FLOW_STAGES[i+1].color}30)` : "var(--c-bd-2)",
                  position: "relative", flexShrink: 0,
                }}>
                  <div style={{
                    position: "absolute", right: -3, top: -3,
                    width: 0, height: 0,
                    borderTop: "4px solid transparent",
                    borderBottom: "4px solid transparent",
                    borderLeft: `5px solid ${isDone ? FLOW_STAGES[i+1].color + "50" : "var(--c-bd-2)"}`,
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NextStepSuggestion({ getStageStatus, advanceToStage, logline, stageResultSummary }) {
  // 첫 번째 미완 스테이지 찾기
  const stages = ["1","2","3","4","5","6","7","8"];
  const firstIncomplete = stages.find(id => getStageStatus(id) !== "done");

  if (!firstIncomplete) {
    // 모두 완료
    return (
      <div style={{
        padding: "16px 20px", borderRadius: 12,
        border: "1px solid rgba(78,204,163,0.25)",
        background: "rgba(78,204,163,0.06)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4ECCA3" }}>모든 스테이지 완료!</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-45)", marginTop: 3 }}>
            고쳐쓰기를 반복하거나 새 프로젝트를 시작하세요.
          </div>
        </div>
      </div>
    );
  }

  if (!logline && firstIncomplete === "1") {
    return (
      <div style={{
        padding: "16px 20px", borderRadius: 12,
        border: "1px solid rgba(200,168,75,0.25)",
        background: "rgba(200,168,75,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#C8A84B" }}>시작하기</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-45)", marginTop: 3 }}>
            Stage 1에서 로그라인을 입력해 분석을 시작하세요.
          </div>
        </div>
        <button
          onClick={() => advanceToStage("1")}
          style={{
            padding: "9px 16px", borderRadius: 9,
            border: "1px solid rgba(200,168,75,0.4)",
            background: "rgba(200,168,75,0.1)", color: "#C8A84B",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            whiteSpace: "nowrap", fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          Stage 1 →
        </button>
      </div>
    );
  }

  const nextMeta = {
    "1": { label: "로그라인 분석", desc: "로그라인을 입력하고 18개 항목 점수를 확인하세요." },
    "2": { label: "개념 분석", desc: "전문가 패널 토론과 신화 구조로 방향을 설계하세요." },
    "3": { label: "캐릭터 설계", desc: "주인공의 심리·욕구·그림자를 분석하세요." },
    "4": { label: "스토리 설계", desc: "구조 분석 후 여러 방향 시놉시스를 생성하세요." },
    "5": { label: "트리트먼트", desc: "씬 별 트리트먼트와 비트시트를 만드세요." },
    "6": { label: "시나리오 초고", desc: "Field·McKee·Snyder 방식의 초고를 자동 생성하세요." },
    "7": { label: "Script Coverage", desc: "실제 방송사 심사 방식으로 작품을 평가하세요." },
    "8": { label: "고쳐쓰기", desc: "Coverage 피드백으로 초고를 개선하세요." },
  }[firstIncomplete];

  return (
    <div style={{
      padding: "16px 20px", borderRadius: 12,
      border: "1px solid rgba(96,165,250,0.2)",
      background: "rgba(96,165,250,0.04)",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 10, color: "rgba(96,165,250,0.6)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>
          다음 추천 단계
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA" }}>{nextMeta?.label}</div>
        <div style={{ fontSize: 11, color: "var(--c-tx-45)", marginTop: 3 }}>{nextMeta?.desc}</div>
      </div>
      <button
        onClick={() => advanceToStage(firstIncomplete)}
        style={{
          padding: "9px 16px", borderRadius: 9,
          border: "1px solid rgba(96,165,250,0.35)",
          background: "rgba(96,165,250,0.1)", color: "#60A5FA",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          whiteSpace: "nowrap", fontFamily: "'Noto Sans KR', sans-serif",
          display: "flex", alignItems: "center", gap: 5,
        }}
      >
        이동
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  대시보드 재설계 컴포넌트 (2026-07 — 파이프라인 중심 IA)
// ═══════════════════════════════════════════════════════════════

// 섹션 라벨 — mono 대문자 + 구분선 (일관된 헤더)
function SectionLabel({ children, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap",
      }}>{children}</div>
      <div style={{ flex: 1, height: 1, background: "var(--c-bd-1)" }} />
      {hint && <div style={{ fontSize: 11, color: "var(--c-tx-25)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hint}</div>}
    </div>
  );
}

// 골드 기본 CTA 스타일
function goldCTA(isMobile) {
  return {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "13px 22px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, var(--accent-gold), #e6c766)",
    color: "#181203", fontSize: 14, fontWeight: 800, cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "nowrap",
    boxShadow: "0 10px 30px -8px var(--glow-gold), inset 0 1px 0 rgba(255,255,255,0.4)",
    transition: "transform 0.18s var(--ease-spring), box-shadow 0.18s var(--ease-spring)",
  };
}
function ghostBtn() {
  return {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "13px 20px", borderRadius: 12, cursor: "pointer",
    border: "1px solid var(--glass-bd-base)", background: "var(--glass-micro)",
    color: "var(--text-main)", fontSize: 13, fontWeight: 700,
    fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "nowrap",
    transition: "background 0.18s var(--ease-spring)",
  };
}
function actionPill(color) {
  return {
    display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px",
    borderRadius: 8, border: `1px solid ${color}44`, background: `${color}12`,
    color, fontSize: 11, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Noto Sans KR', sans-serif",
  };
}
const liftIn = e => { e.currentTarget.style.transform = "translateY(-2px)"; };
const liftOut = e => { e.currentTarget.style.transform = ""; };

// 이어서 작업하기 바 (진행 중) / 신규 히어로
function ResumeHero({ logline, genre, isMobile, activeStageId, advanceToStage, onImport, openPitchDeck, openStoryBibleDoc }) {
  // 신규: 로그라인 없음
  if (!logline) {
    return (
      <div style={{
        padding: isMobile ? "26px 20px" : "34px 32px", borderRadius: 22, position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, rgba(200,168,75,0.12) 0%, var(--glass-micro) 60%)",
        border: "1px solid rgba(200,168,75,0.22)", boxShadow: "inset 0 1px 0 rgba(200,168,75,0.15)",
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C8A84B", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>시작하기</div>
        <div style={{ fontSize: isMobile ? 21 : 27, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: 8 }}>
          새 시나리오를 시작해보세요
        </div>
        <div style={{ fontSize: 13, color: "var(--c-tx-45)", lineHeight: 1.65, maxWidth: 520, marginBottom: 22 }}>
          로그라인 한 줄을 입력하면 AI가 8단계 시나리오 개발 파이프라인을 가동합니다. 점수·분석부터 초고·개고까지.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => advanceToStage("1")} style={goldCTA(isMobile)} onMouseEnter={liftIn} onMouseLeave={liftOut}>
            Stage 1 — 로그라인 입력하기 →
          </button>
          <button onClick={onImport} style={ghostBtn()}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--glass-base)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--glass-micro)"; }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            기존 글 가져오기
          </button>
        </div>
      </div>
    );
  }
  // 진행 중: 이어서 작업하기 바
  const meta = STAGE_META.find(s => s.id === activeStageId) || STAGE_META[0];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: isMobile ? 18 : 28, alignItems: "center",
      padding: isMobile ? "20px" : "24px 32px", borderRadius: 22, position: "relative", overflow: "hidden",
      background: "linear-gradient(120deg, rgba(200,168,75,0.10), rgba(200,168,75,0.02) 55%), var(--glass-nano)",
      border: "1px solid rgba(200,168,75,0.22)",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C8A84B", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
          이어서 작업하기
        </div>
        <div style={{ fontSize: isMobile ? 18 : 23, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: 7 }}>
          {String(meta.id).padStart(2, "0")} — {meta.name}
        </div>
        <div style={{ fontSize: 13, color: "var(--c-tx-50)", lineHeight: 1.55, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {logline}
        </div>
        {genre && genre !== "auto" && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--c-tx-35)" }}>장르: {genre}</div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={openPitchDeck} style={actionPill("#C8A84B")}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
            피치 덱
          </button>
          <button onClick={openStoryBibleDoc} style={actionPill("#4ECCA3")}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            스토리 바이블
          </button>
          <button onClick={onImport} style={actionPill("#60A5FA")}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            기존 글 가져오기
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 10, flexShrink: 0 }}>
        <button onClick={() => advanceToStage(activeStageId)} style={{ ...goldCTA(isMobile), flex: isMobile ? 1 : undefined }} onMouseEnter={liftIn} onMouseLeave={liftOut}>
          이어서 작업하기 →
        </button>
      </div>
    </div>
  );
}

// 현황 지표 스트립
function MetricStrip({ score1, coverage7, coverageColor, credits, doneStages, progressPct }) {
  const tiles = [
    { k: "진행률", v: String(progressPct), unit: "%", sub: `${doneStages}/8 스테이지`, color: "#C8A84B" },
    { k: "로그라인 점수", v: score1 ? String(score1) : "—", unit: score1 ? "/100" : "", sub: "Stage 1 분석", color: score1 ? "#C8A84B" : "var(--c-tx-40)" },
    { k: "커버리지", v: coverage7 || "—", unit: "", sub: "Stage 7 판정", color: coverage7 ? coverageColor : "var(--c-tx-40)", small: !!coverage7 },
    { k: "크레딧", v: credits != null ? String(credits) : "—", unit: credits != null ? "cr" : "", sub: credits != null ? `≈ ₩${(credits * 15).toLocaleString()} 상당` : "잔액 정보 없음", color: credits != null ? "#60A5FA" : "var(--c-tx-40)" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
      {tiles.map(t => (
        <div key={t.k} style={{ padding: "16px 18px", borderRadius: 16, background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--c-tx-30)" }}>{t.k}</div>
          <div style={{ fontSize: t.small ? 16 : 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em", color: t.color, lineHeight: 1.1, display: "flex", alignItems: "baseline", gap: 5 }}>
            {t.v}{t.unit && <span style={{ fontSize: 12, color: "var(--c-tx-30)", fontWeight: 600 }}>{t.unit}</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--c-tx-30)" }}>{t.sub}</div>
        </div>
      ))}
    </div>
  );
}

// 파이프라인 보드 — 4개 페이즈(발견/설계/쓰기/고치기) 컬럼 + Deep Analysis
function PipelineBoard({ isMobile, activeStageId, getStageStatus, getStageDoneCount, STAGE_TOTALS, stageResultSummary, onStageClick, isDemoMode, demoTourStep }) {
  const mainModes = WORK_MODES.filter(m => !m.optional);
  const insight = WORK_MODES.find(m => m.optional);
  return (
    <div style={{ borderRadius: 22, background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)", padding: isMobile ? "18px 14px 14px" : "28px 24px 22px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${mainModes.length}, 1fr)`, gap: isMobile ? 20 : 16, alignItems: "start" }}>
        {mainModes.map(mode => {
          const stages = mode.stageIds.map(id => STAGE_META.find(s => s.id === id)).filter(Boolean);
          if (stages.length === 0) return null;
          const done = stages.filter(s => getStageStatus(s.id) === "done").length;
          return (
            <div key={mode.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 2 }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: mode.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: mode.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{mode.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 10.5, color: done === stages.length && done > 0 ? "#4ECCA3" : "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>{done}/{stages.length}</span>
              </div>
              {stages.map(s => (
                <PipelineNode
                  key={s.id}
                  stage={s}
                  status={getStageStatus(s.id)}
                  isActive={s.id === activeStageId}
                  doneCount={getStageDoneCount(s.id)}
                  total={STAGE_TOTALS?.[s.id]}
                  summary={stageResultSummary?.[s.id]}
                  onClick={() => onStageClick(s.id)}
                  isTourTarget={isDemoMode && demoTourStep === 0 && s.id === "1"}
                />
              ))}
            </div>
          );
        })}
      </div>
      {insight && (() => {
        const s = STAGE_META.find(st => st.id === insight.stageIds[0]);
        if (!s) return null;
        const isDone = getStageStatus(s.id) === "done";
        return (
          <button onClick={() => onStageClick(s.id)} style={{
            width: "100%", marginTop: 16, display: "flex", alignItems: "center", gap: 14,
            padding: "14px 20px", borderRadius: 12, textAlign: "left", cursor: "pointer",
            background: "linear-gradient(120deg, rgba(167,139,250,0.10), transparent 60%)",
            border: "1px dashed rgba(167,139,250,0.35)", fontFamily: "'Noto Sans KR', sans-serif",
          }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(167,139,250,0.16)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>09</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--c-tx-35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sub} — 언제든 실행 가능한 심화 분석</div>
            </div>
            <span style={{ fontSize: 10, color: "#A78BFA", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, border: "1px solid rgba(167,139,250,0.4)", padding: "4px 10px", borderRadius: 999, flexShrink: 0, whiteSpace: "nowrap" }}>{isDone ? "완료" : "선택·심화"}</span>
          </button>
        );
      })()}
    </div>
  );
}

// 파이프라인 단계 노드
function PipelineNode({ stage, status, isActive, doneCount, total, summary, onClick, isTourTarget }) {
  const [hover, setHover] = useState(false);
  const isDone = status === "done";
  const active = isActive && !isDone;
  const color = stage.color;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 8, padding: 14, borderRadius: 12,
        textAlign: "left", cursor: "pointer", width: "100%", position: "relative", overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "transform 0.16s var(--ease-spring), border-color 0.16s, background 0.16s",
        transform: hover ? "translateY(-1px)" : "none",
        border: active ? "1px solid rgba(200,168,75,0.5)"
          : isDone ? `1px solid ${color}35`
          : hover ? "1px solid var(--glass-bd-base)" : "1px solid var(--glass-bd-nano)",
        background: active ? "linear-gradient(160deg, rgba(200,168,75,0.12), transparent 70%)"
          : isDone ? `linear-gradient(135deg, ${color}0d, var(--glass-nano) 70%)`
          : hover ? "var(--glass-micro)" : "var(--glass-nano)",
        boxShadow: active ? "0 0 0 1px rgba(200,168,75,0.4), 0 0 24px -6px rgba(200,168,75,0.35)" : "none",
        ...(isTourTarget ? { animation: "demoPulseRing 1.8s ease-out infinite" } : {}),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
        <span style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 11,
          background: active ? "#C8A84B" : isDone ? `${color}1f` : "var(--glass-raised)",
          color: active ? "#181203" : isDone ? color : "var(--c-tx-40)",
        }}>{isDone ? "✓" : String(stage.id).padStart(2, "0")}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isDone || active ? "var(--text-main)" : "var(--c-tx-55)", lineHeight: 1.25 }}>{stage.name}</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-30)" }}>{stage.sub}</div>
        </div>
        {(isDone || active) && (
          <span style={{
            marginLeft: "auto", flexShrink: 0, fontSize: 9.5, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
            padding: "3px 7px", borderRadius: 999, letterSpacing: "0.04em", whiteSpace: "nowrap",
            background: active ? "#C8A84B" : `${color}1f`, color: active ? "#181203" : color,
          }}>{active ? "진행" : "완료"}</span>
        )}
      </div>
      {summary && (
        <div style={{
          fontSize: 9.5, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          color: stage.id === "7" ? (summary === "RECOMMEND" ? "#4ECCA3" : summary === "PASS" ? "#E85D75" : "#FFD166") : color,
          padding: "2px 7px", borderRadius: 5, background: `${color}12`, border: `1px solid ${color}22`,
          maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{summary}</div>
      )}
      {active && total > 0 && (
        <div style={{ height: 4, borderRadius: 999, background: "var(--c-bd-2)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round((doneCount / total) * 100)}%`, background: "#C8A84B" }} />
        </div>
      )}
    </button>
  );
}
