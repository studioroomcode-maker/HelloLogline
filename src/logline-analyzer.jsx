import { Suspense } from "react";
import ConfirmModal from "./ConfirmModal.jsx";
import LoginScreen from "./LoginScreen.jsx";
import { LoglineProvider } from "./context/LoglineContext.jsx";
import WelcomeModal from "./WelcomeModal.jsx";
import SidebarLayout from "./stages/SidebarLayout.jsx";
import StoryBibleModal from "./components/StoryBibleModal.jsx";
import StageRouter from "./components/StageRouter.jsx";
import HeaderNav from "./components/HeaderNav.jsx";
import WelcomePanel from "./components/WelcomePanel.jsx";
import ProjectsPanel from "./components/ProjectsPanel.jsx";
import { ApiKeyModal, HistoryPanel } from "./panels.jsx";
import { Spinner } from "./ui.jsx";
import ToastContainer from "./ToastContainer.jsx";
import CreditModal from "./CreditModal.jsx";
import AdminPanel from "./AdminPanel.jsx";
import TeamPanel from "./components/TeamPanel.jsx";
import { DEMO_LOGLINE } from "./demo-data.js";
import { useLoglineAnalyzer, STAGES, StoryDoctorPanel } from "./hooks/useLoglineAnalyzer.jsx";

/* ─── Main Component ─── */
export default function LoglineAnalyzer() {
  const ctx = useLoglineAnalyzer();

  // Auth guard — early returns
  if (ctx.authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={28} color="#C8A84B" />
      </div>
    );
  }
  if (!ctx.user && !ctx.isDemoMode) {
    return <LoginScreen onDemo={ctx.activateDemo} authError={ctx.authError} />;
  }
  if (ctx.isBlocked) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-main)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans KR', sans-serif", gap: 16 }}>
        <div style={{ fontSize: 40 }}>🚫</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>접근이 차단된 계정입니다</div>
        <div style={{ fontSize: 13, color: "var(--c-tx-40)" }}>관리자에게 문의하세요.</div>
        <button onClick={ctx.handleLogout} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 10, border: "1px solid var(--c-bd-4)", background: "transparent", color: "var(--c-tx-40)", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}>
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <LoglineProvider value={ctx.loglineCtxValue}>
      <WelcomeModal />
      {ctx.confirmModal && (
        <ConfirmModal
          title={ctx.confirmModal.title}
          message={ctx.confirmModal.message}
          onConfirm={ctx.confirmModal.onConfirm}
          onCancel={() => ctx.setConfirmModal(null)}
        />
      )}
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>
        <ToastContainer toasts={ctx.toasts} onDismiss={ctx.dismissToast} />

        {ctx.showApiKeyModal && (
          <ApiKeyModal initialKey={ctx.apiKey} onSave={ctx.saveApiKey} onCancel={ctx.apiKey ? () => ctx.setShowApiKeyModal(false) : undefined} />
        )}

        {ctx.showStoryBible && (
          <StoryBibleModal
            onClose={() => ctx.setShowStoryBible(false)}
            showToast={ctx.showToast}
            isMobile={ctx.isMobile}
            logline={ctx.logline}
            result={ctx.result}
            coreDesignResult={ctx.coreDesignResult}
            pipelineResult={ctx.pipelineResult}
            selectedSynopsisIndex={ctx.selectedSynopsisIndex}
            synopsisResults={ctx.synopsisResults}
            charDevResult={ctx.charDevResult}
            structureResult={ctx.structureResult}
            beatSheetResult={ctx.beatSheetResult}
            beatScenes={ctx.beatScenes}
            dialogueDevResult={ctx.dialogueDevResult}
          />
        )}

        {ctx.showProjects && (
          <ProjectsPanel
            savedProjects={ctx.savedProjects}
            setShowProjects={ctx.setShowProjects}
            exportProjectJson={ctx.exportProjectJson}
            loadProjectById={ctx.loadProjectById}
            loadProjectState={ctx.loadProjectState}
            deleteProjectById={ctx.deleteProjectById}
            importProjectJson={ctx.importProjectJson}
            importFileRef={ctx.importFileRef}
            token={localStorage.getItem("hll_auth_token")}
          />
        )}

        {ctx.showHistory && (
          <>
            <div onClick={() => ctx.setShowHistory(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 199 }} />
            <HistoryPanel
              history={ctx.history}
              onClose={() => ctx.setShowHistory(false)}
              onDelete={(id) => { const updated = ctx.history.filter((h) => h.id !== id); ctx.setHistory(updated); localStorage.setItem("logline_history", JSON.stringify(updated)); }}
              onClear={() => { localStorage.removeItem("logline_history"); ctx.setHistory([]); }}
              onSelect={(entry) => { ctx.setLogline(entry.logline); ctx.setGenre(entry.genre || "auto"); ctx.setResult(entry.result); ctx.setResult2(null); ctx.setShowHistory(false); ctx.setCurrentStage("1"); }}
            />
          </>
        )}

        <HeaderNav {...ctx} />

        {/* ─── Progress bar (모바일 전용) ─── */}
        <div style={{
          display: ctx.isMobile ? "flex" : "none", justifyContent: "center", alignItems: "center",
          padding: "14px 24px 20px",
          background: "var(--glass-modal)", backdropFilter: "var(--blur-micro)", WebkitBackdropFilter: "var(--blur-micro)",
          borderBottom: "1px solid var(--c-card-2)",
          position: "sticky", top: 56, zIndex: 20,
        }}>
          {STAGES.map((s, idx) => {
            const st = ctx.getStageStatus(s.id);
            const isActive = ctx.currentStage === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                {idx > 0 && (
                  <div style={{
                    width: ctx.isMobile ? 20 : 36, height: 2, flexShrink: 0,
                    background: st === "done" ? "#4ECCA3" : "var(--c-bd-3)",
                    transition: "background 0.4s",
                  }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <button onClick={() => { ctx.setCurrentStage(s.id); }} title={s.name} style={{
                    width: ctx.isMobile ? 28 : 34, height: ctx.isMobile ? 28 : 34, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${isActive ? "#C8A84B" : st === "done" ? "#4ECCA3" : "var(--c-bd-5)"}`,
                    background: isActive ? "rgba(200,168,75,0.18)" : st === "done" ? "rgba(78,204,163,0.12)" : "transparent",
                    color: isActive ? "#C8A84B" : st === "done" ? "#4ECCA3" : "var(--c-tx-28)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                    transition: "all 0.25s",
                  }}>
                    {st === "done" ? (
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                    ) : s.num}
                  </button>
                  {!ctx.isMobile && (
                    <div style={{ fontSize: 9, color: isActive ? "#C8A84B" : "var(--c-tx-25)", fontWeight: isActive ? 700 : 400, whiteSpace: "nowrap", transition: "color 0.2s" }}>
                      {s.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {ctx.showWelcome && (
          <WelcomePanel
            isMobile={ctx.isMobile}
            activateDemo={ctx.activateDemo}
            applyExampleLogline={ctx.applyExampleLogline}
            dismissFirstVisit={ctx.dismissFirstVisit}
          />
        )}

        {/* ─── Sidebar + Stage Layout ─── */}
        <div ref={ctx.mainContentRef} style={{ width: "100%", boxSizing: "border-box" }}>

          {/* ── 데모 모드 배너 ── */}
          {ctx.isDemoMode && (
            <div style={{ maxWidth: ctx.isMobile ? "100%" : 990, margin: "0 auto", padding: ctx.isMobile ? "12px 12px 0" : "16px 28px 0" }}>
              <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 12, background: "rgba(255,209,102,0.07)", border: "1px solid rgba(255,209,102,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🎬</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#FFD166", marginBottom: 2 }}>데모 모드 — 샘플 분석 결과 체험 중</div>
                    <div style={{ fontSize: 11, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}>로그라인: "{DEMO_LOGLINE.slice(0, 40)}…" — 8단계 결과를 자유롭게 둘러보세요.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => { ctx.deactivateDemo(); ctx.setShowApiKeyModal(true); }}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#FFD166", color: "#0d0d1a", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}
                  >
                    내 API 키로 시작
                  </button>
                  <button
                    onClick={ctx.deactivateDemo}
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,209,102,0.3)", background: "transparent", color: "#FFD166", fontSize: 11, cursor: "pointer" }}
                  >
                    데모 종료
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 새로고침 복구 배너 ── */}
          {ctx.showRecoveryBanner && !ctx.isDemoMode && (
            <div style={{ maxWidth: ctx.isMobile ? "100%" : 990, margin: "0 auto", padding: ctx.isMobile ? "12px 12px 0" : "16px 28px 0" }}>
              <div style={{
                marginBottom: 16, padding: "13px 16px 13px 18px",
                borderRadius: 12, background: "rgba(78,204,163,0.07)",
                border: "1px solid rgba(78,204,163,0.25)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#4ECCA3", marginBottom: 2 }}>이전 작업이 저장되어 있습니다</div>
                    <div style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                      새로고침 전 작업을 이어서 진행하려면 프로젝트를 불러오세요.
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                  <button
                    onClick={() => { ctx.setShowRecoveryBanner(false); ctx.openProjects(); }}
                    style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#4ECCA3", color: "#0d0d1a", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "nowrap" }}
                  >
                    프로젝트 불러오기
                  </button>
                  <button
                    onClick={() => ctx.setShowRecoveryBanner(false)}
                    style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.25)", background: "transparent", color: "var(--c-tx-40)", fontSize: 11, cursor: "pointer", lineHeight: 1 }}
                    title="닫기"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          <SidebarLayout
            isMobile={ctx.isMobile}
            stageProps={{
              renderStage: (stageId) => <StageRouter stageId={stageId} {...ctx} />,
            }}
          />

        </div>

        {ctx.showCreditModal && (
          <CreditModal
            credits={ctx.credits} isMobile={ctx.isMobile} user={ctx.user}
            creditPurchasing={ctx.creditPurchasing} setCreditPurchasing={ctx.setCreditPurchasing}
            subscription={ctx.subscription} subCancelling={ctx.subCancelling} setSubCancelling={ctx.setSubCancelling} setSubscription={ctx.setSubscription}
            showToast={ctx.showToast} onClose={() => ctx.setShowCreditModal(false)}
          />
        )}

        {ctx.showTeamPanel && (
          <TeamPanel
            token={localStorage.getItem("hll_auth_token")}
            onClose={() => ctx.setShowTeamPanel(false)}
          />
        )}

        {ctx.showAdminPanel && (
          <AdminPanel
            isMobile={ctx.isMobile} user={ctx.user}
            adminUsers={ctx.adminUsers} adminUsersLoading={ctx.adminUsersLoading} adminRedisOk={ctx.adminRedisOk}
            setAdminUsers={ctx.setAdminUsers} setAdminUsersLoading={ctx.setAdminUsersLoading} setAdminRedisOk={ctx.setAdminRedisOk}
            tierSaving={ctx.tierSaving} handleSetTier={ctx.handleSetTier}
            onClose={() => ctx.setShowAdminPanel(false)}
          />
        )}

        {ctx.showStoryDoctor && (
          <Suspense fallback={null}>
            <StoryDoctorPanel
              apiKey={ctx.apiKey}
              storyContext={ctx.buildStoryDoctorContext()}
              hasStory={{
                logline: !!ctx.logline,
                char: !!ctx.charDevResult,
                synopsis: !!(ctx.pipelineResult || ctx.synopsisResults),
                treatment: !!ctx.treatmentResult.trim(),
                beats: !!(ctx.beatSheetResult?.beats?.length),
                draft: !!ctx.scenarioDraftResult.trim(),
                rewrite: !!(ctx.fullRewriteResult?.trim() || ctx.partialRewriteResult?.trim()),
              }}
              onClose={() => ctx.setShowStoryDoctor(false)}
              isMobile={ctx.isMobile}
            />
          </Suspense>
        )}

        {/* ─── Footer ─── */}
        <div style={{ borderTop: "1px solid var(--c-card-2)", background: "var(--bg-page-alt)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: ctx.isMobile ? "14px 12px" : "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 10, color: "var(--c-tx-20)", fontFamily: "'JetBrains Mono', monospace" }}>
              &copy; {new Date().getFullYear()} Hello Loglines &nbsp;·&nbsp; Powered by Claude AI
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, color: "rgba(var(--tw),0.18)", fontFamily: "'JetBrains Mono', monospace" }}>made by</span>
              <img
                src="/studioroom-logo-light.png"
                alt="STUDIO ROOM"
                style={{ height: 16, opacity: 0.55, filter: "brightness(1)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </LoglineProvider>
  );
}
