import { SvgIcon, ICON } from "../ui.jsx";
import { exportToMarkdown } from "../utils-pdf.js";

/**
 * HeaderNav — extracted sticky header from LoglineAnalyzer.
 * All state and handlers are passed in as props.
 */
export default function HeaderNav(props) {
  const {
    isMobile, darkMode, setDarkMode, isDemoMode,
    saveStatus, isAnyLoading, abortControllersRef,
    user, credits, tier, subscription,
    apiKey, serverHasKey,
    result, pdfLoading,
    showMobileMenu, setShowMobileMenu,
    showStoryDoctor, setShowStoryDoctor,
    showHistory, setShowHistory,
    showCreditModal, setShowCreditModal,
    showAdminPanel, setShowAdminPanel,
    showTeamPanel, setShowTeamPanel,
    showApiKeyModal, setShowApiKeyModal,
    showStoryBible, setShowStoryBible,
    showExportMenu, setShowExportMenu,
    showUserMenu, setShowUserMenu,
    handleExportPdf, handleShare, shareLinkLoading, creditPurchasing,
    openProjects, openApplicationDoc,
    savedProjects, history, logline, genre, charDevResult, synopsisResults,
    pipelineResult, treatmentResult, beatSheetResult, scenarioDraftResult,
    scriptCoverageResult, valuationResult, showToast,
    eduMode, setEduMode, isAdmin, handleLogout,
    startNewProject,
    TIER_COLOR, TIER_LABEL,
  } = props;

  return (
    <>
      {/* ─── Header ─── */}
      <div style={{
        position: "sticky", top: 0, zIndex: "var(--z-nav)",
        background: "var(--glass-modal)", backdropFilter: "var(--blur-micro)", WebkitBackdropFilter: "var(--blur-micro)",
        borderBottom: "1px solid var(--glass-bd-micro)",
        boxShadow: "0 1px 0 var(--glass-bd-nano), 0 4px 20px rgba(0,0,0,0.15)",
        height: 56,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 12px" : "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: "var(--text-main)", letterSpacing: -0.3 }}>Hello Loglines</div>
            {!isMobile && <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: -1 }}>시나리오 개발 워크스테이션</div>}
          </div>
          {isDemoMode && (
            <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#FFD166", background: "rgba(255,209,102,0.12)", border: "1px solid rgba(255,209,102,0.3)", borderRadius: 6, padding: "3px 8px", letterSpacing: 1 }}>DEMO</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Save status */}
          {saveStatus && (
            <span style={{
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
              color: saveStatus === "saved" ? "#4ECCA3" : "var(--c-tx-35)",
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 6,
              background: saveStatus === "saved" ? "rgba(78,204,163,0.08)" : "var(--glass-nano)",
              border: `1px solid ${saveStatus === "saved" ? "rgba(78,204,163,0.2)" : "var(--glass-bd-nano)"}`,
              transition: "all 0.2s var(--ease-spring)",
            }}>
              {saveStatus === "saving" ? (
                <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              ) : (
                <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
              {!isMobile && (saveStatus === "saving" ? "저장 중..." : "저장됨")}
            </span>
          )}
          {/* 취소 — 로딩 중일 때만 */}
          {isAnyLoading && (
            <button onClick={() => { Object.keys(abortControllersRef.current).forEach(k => abortControllersRef.current[k].abort()); abortControllersRef.current = {}; }}
              style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", border: "1px solid rgba(232,93,117,0.35)", background: "rgba(232,93,117,0.08)", color: "#E85D75", display: "flex", alignItems: "center", gap: 4 }}>
              취소
            </button>
          )}

          {/* ── 모바일: 핵심 2개 + 더보기 메뉴 ── */}
          {isMobile ? (
            <>
              {/* 크레딧 (긴급 표시 — 5cr 이하) */}
              {user && credits !== null && credits <= 5 && (
                <button onClick={() => setShowCreditModal(true)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid rgba(232,93,117,0.5)", background: "rgba(232,93,117,0.1)", color: "#E85D75", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {credits}cr
                </button>
              )}
              {/* API 키 */}
              <button onClick={() => setShowApiKeyModal(true)} title="API 키" style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: apiKey ? "rgba(200,168,75,0.08)" : "rgba(232,93,117,0.1)", color: apiKey ? "rgba(200,168,75,0.7)" : "#E85D75", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <SvgIcon d={ICON.key} size={14} />
              </button>
              {/* 다크모드 */}
              <button onClick={() => setDarkMode(!darkMode)} title="테마" style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid var(--glass-bd-base)", background: "var(--glass-nano)", color: darkMode ? "#C8A84B" : "var(--c-tx-50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 28 }}>
                {darkMode ? (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>
              {/* ⋯ 더보기 */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowMobileMenu(v => !v)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: showMobileMenu ? "var(--glass-raised)" : "var(--c-card-1)", color: "var(--c-tx-50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 28 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
                </button>
                {showMobileMenu && (
                  <>
                    <div onClick={() => setShowMobileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "var(--glass-modal)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--glass-bd-base)", borderRadius: 12, boxShadow: "0 12px 36px rgba(0,0,0,0.4), inset 0 1px 0 var(--glass-bd-top)", minWidth: 180, padding: "6px 0", overflow: "hidden", fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {/* 내보내기 */}
                      {result && (
                        <>
                          <button onClick={() => { setShowStoryBible(true); setShowMobileMenu(false); }} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#4ECCA3", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            스토리 바이블
                          </button>
                          <button onClick={() => { handleExportPdf(); setShowMobileMenu(false); }} disabled={pdfLoading} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: pdfLoading ? "var(--c-tx-25)" : "#60A5FA", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            {pdfLoading ? "PDF 생성 중..." : "PDF 내보내기"}
                          </button>
                          <div style={{ height: 1, background: "var(--c-bd-1)", margin: "4px 0" }} />
                        </>
                      )}
                      {/* 공유 */}
                      {logline.trim() && result && (
                        <button onClick={() => { handleShare(); setShowMobileMenu(false); }} disabled={shareLinkLoading} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#4ECCA3", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          공유 링크 복사
                        </button>
                      )}
                      {/* 새 프로젝트 */}
                      <button onClick={() => { startNewProject(); setShowMobileMenu(false); }} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#C8A84B", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                        새 프로젝트
                      </button>
                      {/* 프로젝트 */}
                      <button onClick={() => { openProjects(); setShowMobileMenu(false); }} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--c-tx-60)", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        프로젝트
                      </button>
                      {/* 기록 */}
                      <button onClick={() => { setShowHistory(true); setShowMobileMenu(false); }} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--c-tx-60)", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                        <SvgIcon d={ICON.history} size={13} />
                        기록{history.length > 0 ? ` (${history.length})` : ""}
                      </button>
                      {/* 크레딧 */}
                      {user && credits !== null && (
                        <>
                          <div style={{ height: 1, background: "var(--c-bd-1)", margin: "4px 0" }} />
                          <button onClick={() => { setShowCreditModal(true); setShowMobileMenu(false); }} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: credits <= 5 ? "#E85D75" : "#A78BFA", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            크레딧 {credits !== null ? `(${credits}cr)` : ""}
                          </button>
                        </>
                      )}
                      {/* 교육 모드 */}
                      <button onClick={() => { setEduMode(v => !v); setShowMobileMenu(false); }} style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: eduMode ? "#A78BFA" : "var(--c-tx-60)", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                          교육 모드
                        </span>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: eduMode ? "#A78BFA" : "var(--c-bd-5)", flexShrink: 0 }} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* ── 데스크톱: 기존 전체 버튼 ── */
            <>
              {/* 내보내기 드롭다운 — result 있을 때만 */}
              {result && (
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowExportMenu(v => !v)} style={{ padding: "5px 11px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--c-tx-55)", display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    내보내기 <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
                  </button>
                  {showExportMenu && (
                    <>
                      <div onClick={() => setShowExportMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100, background: "var(--glass-modal)", border: "1px solid var(--glass-bd-base)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 var(--glass-bd-top)", minWidth: 160, padding: "4px 0", overflow: "hidden" }}>
                        <button onClick={() => { setShowStoryBible(true); setShowExportMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#4ECCA3", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                          스토리 바이블
                        </button>
                        <button onClick={() => { handleExportPdf(); setShowExportMenu(false); }} disabled={pdfLoading} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: pdfLoading ? "default" : "pointer", fontSize: 12, color: pdfLoading ? "var(--c-tx-25)" : "#60A5FA", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          {pdfLoading ? "PDF 생성 중..." : "PDF"}
                        </button>
                        <button onClick={() => { const s = logline.slice(0,20).replace(/\s+/g,"-").replace(/[^\w가-힣-]/g,""); exportToMarkdown({ logline, genre, result, charDevResult, synopsisResults, pipelineResult, treatmentResult, beatSheetResult, scenarioDraftResult, scriptCoverageResult, valuationResult }, `hellologline-${s||"report"}`); showToast("success","Markdown 파일이 다운로드되었습니다."); setShowExportMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A78BFA", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          Markdown
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* 공유하기 */}
              {logline.trim() && result && (
                <button onClick={handleShare} disabled={shareLinkLoading} title="공유 링크 복사" style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.35)", background: "rgba(78,204,163,0.07)", color: "#4ECCA3", cursor: shareLinkLoading ? "wait" : "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {shareLinkLoading ? <span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(78,204,163,0.3)", borderTop: "1.5px solid #4ECCA3", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}
                  공유
                </button>
              )}
              {/* 새 프로젝트 */}
              <button onClick={startNewProject} title="새 프로젝트" style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid rgba(200,168,75,0.35)", background: "rgba(200,168,75,0.10)", color: "var(--accent-gold)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.18s var(--ease-spring)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,168,75,0.18)"; e.currentTarget.style.borderColor = "rgba(200,168,75,0.55)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(200,168,75,0.10)"; e.currentTarget.style.borderColor = "rgba(200,168,75,0.35)"; }}
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                새 프로젝트
              </button>
              {/* 프로젝트 */}
              <button onClick={openProjects} title="프로젝트" style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--c-tx-45)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                프로젝트
              </button>
              {/* 기록 */}
              <button onClick={() => setShowHistory(true)} title="기록" style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--c-tx-45)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <SvgIcon d={ICON.history} size={13} />
                {`기록${history.length > 0 ? ` (${history.length})` : ""}`}
              </button>
              {/* 크레딧 */}
              {user && credits !== null && (
                <button onClick={() => setShowCreditModal(true)} title="크레딧 충전" style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${credits <= 5 ? "rgba(232,93,117,0.5)" : "rgba(167,139,250,0.35)"}`, background: credits <= 5 ? "rgba(232,93,117,0.1)" : "rgba(167,139,250,0.08)", color: credits <= 5 ? "#E85D75" : "#A78BFA", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  {creditPurchasing ? "..." : `${credits}cr`}
                </button>
              )}
              {/* API 키 */}
              <button onClick={() => setShowApiKeyModal(true)} title="API 키 설정" style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: apiKey ? "rgba(200,168,75,0.08)" : "rgba(232,93,117,0.1)", color: apiKey ? "rgba(200,168,75,0.7)" : "#E85D75", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <SvgIcon d={ICON.key} size={14} />
              </button>
              {/* 교육 모드 */}
              <button onClick={() => setEduMode(v => !v)} title={eduMode ? "교육 모드 ON" : "교육 모드 OFF"} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: eduMode ? "1px solid rgba(167,139,250,0.5)" : "1px solid var(--c-bd-3)", background: eduMode ? "rgba(167,139,250,0.12)" : "var(--c-card-1)", color: eduMode ? "#A78BFA" : "var(--c-tx-40)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s" }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                교육 모드
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: eduMode ? "#A78BFA" : "var(--c-bd-5)", flexShrink: 0 }} />
              </button>
              {/* 다크모드 */}
              <button onClick={() => setDarkMode(!darkMode)} title={darkMode ? "라이트 모드" : "다크 모드"} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid var(--glass-bd-base)", background: "var(--glass-nano)", color: darkMode ? "#C8A84B" : "var(--c-tx-50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 28, transition: "all 0.2s var(--ease-spring)", boxShadow: "inset 0 1px 0 var(--glass-bd-nano)" }}>
                {darkMode ? (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>
            </>
          )}
          {/* 유저 아바타 → 드롭다운 */}
          {user && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowUserMenu(v => !v)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--c-bd-4)" }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,168,75,0.2)", border: "1px solid rgba(200,168,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#C8A84B" }}>
                    {user.name?.[0] || "?"}
                  </div>
                )}
              </button>
              {showUserMenu && (
                <>
                  <div onClick={() => setShowUserMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100, background: "var(--bg-nav)", border: "1px solid var(--c-bd-2)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 160, padding: "8px 0", overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid var(--c-bd-1)" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)", marginBottom: 2 }}>{user.name}</div>
                      {user.email && <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>{user.email}</div>}
                      <div style={{ fontSize: 10, fontWeight: 700, color: TIER_COLOR[tier], fontFamily: "'JetBrains Mono', monospace" }}>{TIER_LABEL[tier]}</div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => { setShowAdminPanel(true); setShowUserMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#C8A84B", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                        관리자 패널
                      </button>
                    )}
                    <button onClick={() => { setShowTeamPanel(true); setShowUserMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#60A5FA", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      팀 플랜
                    </button>
                    <button onClick={() => { handleLogout(); setShowUserMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--c-tx-45)", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
