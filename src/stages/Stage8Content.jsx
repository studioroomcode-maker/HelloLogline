import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, SvgIcon, ICON, Spinner } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";

export default function Stage8Content({
  scriptCoverageResult,
  rewriteGuide, setRewriteGuide, rewriteGuideLoading, rewriteGuideError, generateRewriteGuide,
  rewriteDiagResult, setRewriteDiagResult, rewriteDiagLoading, rewriteDiagError, generateRewriteDiag,
  scenarioDraftResult,
  partialRewriteInstruction, setPartialRewriteInstruction, generatePartialRewrite, partialRewriteLoading, partialRewriteError, partialRewriteResult, setPartialRewriteResult,
  fullRewriteNotes, setFullRewriteNotes, generateFullRewrite, fullRewriteLoading, fullRewriteError, fullRewriteResult, setFullRewriteResult,
}) {
  const { logline, isMobile, cc, getStageStatus, advanceToStage, showToast } = useLoglineCtx();

  return (
    <ErrorBoundary><div>

              {/* 안내 배너 */}
              <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FB923C", marginBottom: 5 }}>고쳐쓰기(Rewriting)란?</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.7 }}>
                  초고를 쓴 뒤 냉정하게 다시 보는 단계입니다. 먼저 <strong style={{ color: "var(--c-tx-75)" }}>초고 진단</strong>으로 문제점을 파악하고,<br />
                  <strong style={{ color: "var(--c-tx-75)" }}>부분 재작성</strong>으로 특정 씬을 집중 수정하거나 <strong style={{ color: "var(--c-tx-75)" }}>전체 개고</strong>로 완성도를 높이세요.
                </div>
              </div>

              {/* ── AI 고쳐쓰기 우선순위 ── */}
              {scriptCoverageResult && (
                <div style={{ marginBottom: 20 }}>
                  {!rewriteGuide ? (
                    <button onClick={generateRewriteGuide} disabled={rewriteGuideLoading} style={{ width: "100%", padding: "11px 16px", borderRadius: 10, border: "1px solid rgba(96,165,250,0.25)", background: "rgba(96,165,250,0.04)", color: rewriteGuideLoading ? "var(--c-tx-35)" : "#60A5FA", fontSize: 12, fontWeight: 600, cursor: rewriteGuideLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.2s" }}>
                      {rewriteGuideLoading ? <><Spinner size={12} color="#60A5FA" /><span>분석 중...</span></> : <><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg><span>Coverage 기반 고쳐쓰기 우선순위 확인</span></>}
                    </button>
                  ) : (
                    <div style={{ borderRadius: 10, border: "1px solid rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.03)", overflow: "hidden" }}>
                      <div style={{ padding: "9px 14px", borderBottom: "1px solid rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth={2} strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA" }}>AI 고쳐쓰기 우선순위</span>
                          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(96,165,250,0.1)", color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3 }}>Coverage 기반</span>
                        </div>
                        <button onClick={() => setRewriteGuide(null)} style={{ background: "none", border: "none", color: "var(--c-tx-30)", cursor: "pointer", fontSize: 13, padding: "2px 4px", lineHeight: 1 }}>✕</button>
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 10, padding: "8px 10px", borderRadius: 7, background: "rgba(96,165,250,0.06)", borderLeft: "2px solid rgba(96,165,250,0.35)", lineHeight: 1.6 }}>
                          {rewriteGuide.verdict}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {(rewriteGuide.priorities || []).map((p, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace", minWidth: 18, marginTop: 1 }}>0{p.rank}</span>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-75)", marginBottom: 2 }}>{p.area}</div>
                                <div style={{ fontSize: 11, color: "var(--c-tx-45)", marginBottom: 3 }}>{p.issue}</div>
                                <div style={{ fontSize: 11, color: "#60A5FA", lineHeight: 1.55 }}>→ {p.action}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {rewriteGuideError && <div style={{ marginTop: 6, fontSize: 11, color: "#E85D75" }}>{rewriteGuideError}</div>}
                </div>
              )}

              {/* ── 1. 초고 진단 ── */}
              <div style={{ marginBottom: 20 }}>
                <ToolButton
                  icon={<SvgIcon d={ICON.clipboard} size={16} />}
                  label="초고 진단"
                  sub="고쳐쓰기 우선순위 분석"
                  done={!!rewriteDiagResult}
                  loading={rewriteDiagLoading}
                  color="#FB923C"
                  onClick={generateRewriteDiag}
                  disabled={!scenarioDraftResult || !logline.trim()}
                  tooltip={"시나리오 초고를 분석해 고쳐야 할 부분을 우선순위별로 제시합니다.\n\n• 구조 문제, 캐릭터 일관성, 씬 단위 약점\n• 대사 및 페이스 문제\n• 구체적인 수정 방향 제안\n\n6단계 시나리오 초고가 필요합니다."}
                  creditCost={cc(1)}
                />
                {!scenarioDraftResult && <div style={{ marginTop: 6, fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif" }}>6단계에서 시나리오 초고를 먼저 생성하세요.</div>}
                <ErrorMsg msg={rewriteDiagError} />
                {rewriteDiagResult && (
                  <ResultCard title="초고 진단 결과" onClose={() => setRewriteDiagResult(null)} color="rgba(251,146,60,0.12)">
                    <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 9, background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#FB923C", marginBottom: 5 }}>종합 평가</div>
                      <div style={{ fontSize: 13, color: "var(--c-tx-65)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{rewriteDiagResult.overall_assessment}</div>
                    </div>
                    {(rewriteDiagResult.priority_fixes || []).map((fix, i) => (
                      <div key={i} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 9, background: "var(--c-card-1)", border: "1px solid var(--c-bd-2)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#FB923C", padding: "2px 7px", borderRadius: 6, background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.2)" }}>우선순위 {fix.priority}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-65)" }}>{fix.category}</span>
                          <span style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif" }}>{fix.location}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--c-tx-60)", marginBottom: 6, lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{fix.issue}</div>
                        <div style={{ fontSize: 12, color: "#FB923C", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>→ {fix.fix_direction}</div>
                      </div>
                    ))}
                    {rewriteDiagResult.strengths?.length > 0 && (
                      <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 9, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.12)" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4ECCA3", marginBottom: 6 }}>강점</div>
                        {rewriteDiagResult.strengths.map((s, i) => <div key={i} style={{ fontSize: 12, color: "var(--c-tx-55)", marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>✓ {s}</div>)}
                      </div>
                    )}
                    {rewriteDiagResult.rewrite_strategy && (
                      <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", marginBottom: 5 }}>개고 전략</div>
                        <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{rewriteDiagResult.rewrite_strategy}</div>
                      </div>
                    )}
                  </ResultCard>
                )}
              </div>

              {/* ── 2. 부분 재작성 ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>✏️ 부분 재작성</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                  특정 씬·섹션을 어떻게 고칠지 지시하면 AI가 해당 부분만 재작성합니다.
                </div>
                <textarea
                  value={partialRewriteInstruction}
                  onChange={(e) => setPartialRewriteInstruction(e.target.value)}
                  placeholder={"예: 오프닝 씬을 더 강렬하게 시작하도록 수정해줘\n예: 2막 갈등 장면에서 주인공 대사가 너무 직접적이야. 하위텍스트를 넣어줘\n예: 결말 씬을 열린 결말로 바꿔줘"}
                  style={{ width: "100%", minHeight: 90, padding: "10px 12px", borderRadius: 9, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6, resize: "vertical", boxSizing: "border-box" }}
                />
                <button
                  onClick={generatePartialRewrite}
                  disabled={!scenarioDraftResult || !partialRewriteInstruction.trim() || partialRewriteLoading}
                  style={{ marginTop: 8, padding: "9px 20px", borderRadius: 9, border: "1px solid rgba(251,146,60,0.35)", background: partialRewriteLoading ? "rgba(251,146,60,0.05)" : "rgba(251,146,60,0.1)", color: "#FB923C", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", opacity: (!scenarioDraftResult || !partialRewriteInstruction.trim()) ? 0.4 : 1 }}
                >
                  {partialRewriteLoading ? "재작성 중…" : "부분 재작성"}
                </button>
                <ErrorMsg msg={partialRewriteError} />
                {partialRewriteResult && (
                  <ResultCard title="부분 재작성 결과" onClose={() => setPartialRewriteResult("")} color="rgba(251,146,60,0.12)">
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                      <button onClick={() => navigator.clipboard.writeText(partialRewriteResult).then(() => showToast("success", "복사되었습니다."))} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(251,146,60,0.3)", background: "rgba(251,146,60,0.08)", color: "#FB923C", fontSize: 11, cursor: "pointer" }}>복사</button>
                    </div>
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: isMobile ? 12 : 13, lineHeight: 1.8, color: "var(--c-tx-75)", margin: 0 }}>
                      {partialRewriteResult}
                    </pre>
                  </ResultCard>
                )}
              </div>

              {/* ── 3. 전체 개고 ── */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>📝 전체 개고</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                  초고 진단 결과를 자동 반영하여 전체를 다시 씁니다. 추가 메모가 있으면 아래에 입력하세요.
                </div>
                <textarea
                  value={fullRewriteNotes}
                  onChange={(e) => setFullRewriteNotes(e.target.value)}
                  placeholder={"(선택) 특별히 강조하거나 바꾸고 싶은 방향을 적어주세요\n예: 주인공을 더 능동적으로 만들어줘\n예: 결말을 비극으로 바꿔줘"}
                  style={{ width: "100%", minHeight: 70, padding: "10px 12px", borderRadius: 9, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6, resize: "vertical", boxSizing: "border-box" }}
                />
                <button
                  onClick={generateFullRewrite}
                  disabled={!scenarioDraftResult || fullRewriteLoading}
                  style={{ marginTop: 8, padding: "9px 20px", borderRadius: 9, border: "1px solid rgba(251,146,60,0.35)", background: fullRewriteLoading ? "rgba(251,146,60,0.05)" : "rgba(251,146,60,0.1)", color: "#FB923C", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", opacity: !scenarioDraftResult ? 0.4 : 1 }}
                >
                  {fullRewriteLoading ? "개고 중… (시간이 걸릴 수 있습니다)" : "전체 개고 시작"}
                </button>
                <ErrorMsg msg={fullRewriteError} />
                {fullRewriteResult && (
                  <ResultCard title="개고된 시나리오" onClose={() => setFullRewriteResult("")} color="rgba(251,146,60,0.12)">
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, gap: 6 }}>
                      <button onClick={() => navigator.clipboard.writeText(fullRewriteResult).then(() => showToast("success", "전체 개고본이 복사되었습니다."))} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(251,146,60,0.3)", background: "rgba(251,146,60,0.08)", color: "#FB923C", fontSize: 11, cursor: "pointer" }}>전체 복사</button>
                    </div>
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: isMobile ? 12 : 13, lineHeight: 1.8, color: "var(--c-tx-75)", margin: 0 }}>
                      {fullRewriteResult}
                    </pre>
                  </ResultCard>
                )}
              </div>

              {getStageStatus("8") === "done" && (
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)" }}>
                  <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginBottom: 10 }}>다음 작업 선택</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => advanceToStage("7")}
                      style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(96,165,250,0.4)", background: "rgba(96,165,250,0.08)", color: "#60A5FA", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      Coverage 재평가 →
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                    <button onClick={() => advanceToStage("3")}
                      style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.05)", color: "var(--c-tx-45)", fontSize: 12, cursor: "pointer" }}>
                      ← 캐릭터 수정 (3)
                    </button>
                    <button onClick={() => advanceToStage("5")}
                      style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.2)", background: "rgba(200,168,75,0.05)", color: "var(--c-tx-45)", fontSize: 12, cursor: "pointer" }}>
                      ← 트리트먼트 수정 (5)
                    </button>
                  </div>
                </div>
              )}

    </div></ErrorBoundary>
  );
}
