import { lazy, Suspense, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, FeedbackBox, SvgIcon, ICON, Spinner, DemoCTA } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import { TreatmentInputPanel, DialogueDevPanel } from "../panels/TreatmentPanels.jsx";
import { GENRES } from "../constants.js";

const BeatSheetPanel = lazy(() => import("../panels/BeatSheetPanel.jsx"));

export default function Stage5Content({
  showTreatmentPanel, setShowTreatmentPanel,
  treatmentChars, setTreatmentChars,
  treatmentStructure, setTreatmentStructure,
  selectedFramework, NARRATIVE_FRAMEWORKS,
  selectedDuration,
  pipelineResult,
  charDevResult,
  treatmentResult, setTreatmentResult,
  treatmentLoading, treatmentError,
  treatmentStale, setTreatmentStale,
  treatmentHistory, setTreatmentHistory,
  generateTreatment,
  treatmentFeedback, setTreatmentFeedback,
  refineTreatment, treatmentRefineLoading,
  treatmentBefore, showTreatmentBefore, setShowTreatmentBefore,
  editingTreatment, setEditingTreatment,
  treatmentEditDraft, setTreatmentEditDraft,
  writerEdits, setWriterEdit, setWriterEdits, clearWriterEdit,
  treatmentCtx,
  beatSheetResult, setBeatSheetResult,
  beatSheetLoading, beatSheetError,
  beatSheetStale, setBeatSheetStale,
  beatSheetHistory, setBeatSheetHistory,
  generateBeatSheet,
  beatSheetCtx,
  beatScenes,
  expandedBeats, setExpandedBeats,
  editingBeats, setEditingBeats,
  beatEditDrafts, setBeatEditDrafts,
  structureTwistLoading, structureTwistError, structureTwistResult,
  analyzeStructureTwist,
  GENRE_BEAT_HINTS,
  undoHistory,
  beatSheetFeedback, setBeatSheetFeedback,
  refineBeatSheet, beatSheetRefineLoading,
  beatSheetBefore, showBeatSheetBefore, setShowBeatSheetBefore,
  dialogueDevResult, setDialogueDevResult,
  dialogueDevLoading, dialogueDevError,
  analyzeDialogueDev,
  generatingBeat,
  generateScene,
}) {
  const { logline, genre, isMobile, cc, getStageStatus, advanceToStage, openApplicationDoc, teamMembers, setTeamMembers, sceneAssignments, setSceneAssignments, getEditPermission, isOwner, isReadOnly, addActivity, currentWorkingMember, isDemoMode } = useLoglineCtx();

  return (
    <ErrorBoundary><div>

              {isDemoMode && <DemoCTA label="시나리오 초고(Stage 6) 둘러보기" onClick={() => advanceToStage("6")} />}

              {/* ── 단계 안내 ── */}
              <div style={{ marginBottom: (pipelineResult || charDevResult) ? 10 : 18, padding: "12px 16px", borderRadius: 10, background: "rgba(255,209,102,0.05)", border: "1px solid rgba(255,209,102,0.15)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🎬</span>
                <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
                  <strong style={{ color: "rgba(255,209,102,0.9)" }}>시나리오 쓰기 직전, 장면을 설계하는 단계입니다.</strong>{" "}
                  트리트먼트는 각 씬의 흐름을 산문으로 정리합니다. 비트시트는 15개 이정표에 맞춰 페이지 단위로 구성을 배치합니다. 여기서 확정된 내용이 6단계 초고의 뼈대가 됩니다.
                </div>
              </div>

              {/* ── 스토리 컨텍스트 배너 ── */}
              {pipelineResult && (
                <div style={{
                  marginBottom: 14, padding: "10px 14px", borderRadius: 9,
                  background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.2)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, color: "#4ECCA3", fontWeight: 700 }}>시놉시스 반영됨</span>
                    <span style={{ fontSize: 11, color: "var(--c-tx-45)", marginLeft: 8 }}>
                      {pipelineResult.direction_title
                        ? `"${pipelineResult.direction_title}" 방향이 트리트먼트 기준으로 사용됩니다.`
                        : "Stage 4 시놉시스 구조가 트리트먼트에 자동 반영됩니다."}
                    </span>
                  </div>
                </div>
              )}

              {!logline.trim() && (
                <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(200,168,75,0.06)", borderLeft: "2px solid rgba(200,168,75,0.4)", fontSize: 11, color: "var(--c-tx-40)" }}>
                  Stage 1에서 로그라인을 먼저 입력하세요. 더 정확한 분석 결과를 얻을 수 있습니다.
                </div>
              )}

              {/* ── STEP 1: 트리트먼트 ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: treatmentResult ? "rgba(78,204,163,0.15)" : "rgba(200,168,75,0.12)", color: treatmentResult ? "#4ECCA3" : "#C8A84B", border: `1px solid ${treatmentResult ? "rgba(78,204,163,0.25)" : "rgba(200,168,75,0.25)"}`, fontFamily: "'JetBrains Mono', monospace" }}>{treatmentResult ? "✓ STEP 1" : "STEP 1"}</div>
                  <span style={{ fontSize: 12, color: "var(--c-tx-45)", fontWeight: 500 }}>트리트먼트 — 스토리 전체 흐름 서술</span>
                </div>
                <button onClick={() => {
                  if (!showTreatmentPanel) {
                    // 포맷에 따라 서사 구조 기본값 자동 설정
                    const autoStructure = { tvdrama: "tvdrama", webdrama: "webdrama", shortformseries: "webdrama", miniseries: "miniseries", ultrashort: "3act", shortform: "3act", shortfilm: "3act", feature: "3act" }[selectedDuration] || "3act";
                    if (!treatmentResult) setTreatmentStructure(autoStructure);
                  }
                  setShowTreatmentPanel(!showTreatmentPanel);
                }} style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: showTreatmentPanel ? "1px solid rgba(200,168,75,0.4)" : "1px solid var(--c-bd-3)",
                  background: showTreatmentPanel ? "rgba(200,168,75,0.07)" : "rgba(var(--tw),0.02)",
                  color: showTreatmentPanel ? "#C8A84B" : "var(--c-tx-45)",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
                }}>
                  <SvgIcon d={ICON.doc} size={16} />
                  트리트먼트로 발전시키기
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{showTreatmentPanel ? "^" : "v"}</span>
                </button>
                {showTreatmentPanel && (
                  <div style={{ marginTop: 8 }}>
                    <TreatmentInputPanel chars={treatmentChars} onCharsChange={setTreatmentChars} structure={treatmentStructure} onStructureChange={setTreatmentStructure} onGenerate={generateTreatment} loading={treatmentLoading} isMobile={isMobile} charDevResult={charDevResult} selectedFramework={selectedFramework} NARRATIVE_FRAMEWORKS={NARRATIVE_FRAMEWORKS} pipelineResult={pipelineResult} />
                    <ErrorMsg msg={treatmentError} onRetry={treatmentError ? generateTreatment : undefined} />
                  </div>
                )}
                {treatmentStale && treatmentResult && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10, marginTop: 8,
                    background: "rgba(247,160,114,0.07)",
                    border: "1px solid rgba(247,160,114,0.25)",
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                    <div style={{ flex: 1, fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.5 }}>
                      캐릭터 또는 시놉시스가 변경됐습니다. 트리트먼트를 재생성하면 최신 내용이 반영됩니다.
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setTreatmentStale(false)}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-35)", fontSize: 10, cursor: "pointer" }}>무시</button>
                      <button onClick={generateTreatment} disabled={isDemoMode}
                        style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(247,160,114,0.4)", background: "rgba(247,160,114,0.1)", color: "#F7A072", fontSize: 10, fontWeight: 700, cursor: isDemoMode ? "not-allowed" : "pointer", opacity: isDemoMode ? 0.45 : 1 }}>재생성</button>
                    </div>
                  </div>
                )}
                {treatmentResult && (
                  <ResultCard
                    title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      트리트먼트
                      {writerEdits.treatment && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(78,204,163,0.15)", color: "#4ECCA3", fontWeight: 600, border: "1px solid rgba(78,204,163,0.25)" }}>✏ 수정됨</span>}
                    </span>}
                    onClose={() => { setTreatmentResult(""); clearWriterEdit("treatment"); setEditingTreatment(false); setTreatmentHistory([]); setTreatmentStale(false); }}
                    onUndo={() => undoHistory(setTreatmentHistory, setTreatmentResult, treatmentHistory)}
                    historyCount={treatmentHistory.length}
                    color="rgba(200,168,75,0.15)"
                  >
                    {editingTreatment ? (
                      <div>
                        <textarea
                          value={treatmentEditDraft}
                          onChange={e => setTreatmentEditDraft(e.target.value)}
                          style={{
                            width: "100%", minHeight: 400, padding: "14px 16px",
                            background: "rgba(var(--tw),0.03)", border: "1px solid rgba(200,168,75,0.3)",
                            borderRadius: 10, color: "var(--text-main)", fontSize: 13, lineHeight: 1.8,
                            fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical", boxSizing: "border-box",
                            outline: "none",
                          }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                          {writerEdits.treatment && (
                            <button
                              onClick={() => { clearWriterEdit("treatment"); setEditingTreatment(false); }}
                              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(232,93,117,0.3)", background: "rgba(232,93,117,0.06)", color: "#E85D75", fontSize: 11, cursor: "pointer" }}
                            >AI 원본으로</button>
                          )}
                          <button
                            onClick={() => setEditingTreatment(false)}
                            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-45)", fontSize: 11, cursor: "pointer" }}
                          >취소</button>
                          <button
                            onClick={() => { setWriterEdit("treatment", treatmentEditDraft); setEditingTreatment(false); }}
                            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.4)", background: "rgba(78,204,163,0.1)", color: "#4ECCA3", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >저장 — 시나리오에 반영</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {treatmentCtx && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                            {treatmentCtx.genre && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(200,168,75,0.1)", color: "#C8A84B", border: "1px solid rgba(200,168,75,0.2)" }}>{treatmentCtx.genre}</span>}
                            {treatmentCtx.char && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(251,146,60,0.1)", color: "#FB923C", border: "1px solid rgba(251,146,60,0.2)" }}>캐릭터 분석 반영</span>}
                            {treatmentCtx.synopsis && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(78,204,163,0.1)", color: "#4ECCA3", border: "1px solid rgba(78,204,163,0.2)" }}>시놉시스 반영</span>}
                            {treatmentCtx.plotPoints && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.2)" }}>플롯 포인트 반영</span>}
                            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(var(--tw),0.05)", color: "var(--c-tx-40)", border: "1px solid var(--c-bd-2)" }}>{treatmentCtx.structure}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
                          <button
                            onClick={() => { setTreatmentEditDraft(writerEdits.treatment || treatmentResult); setEditingTreatment(true); }}
                            style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.06)", color: "#C8A84B", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}
                          >✏ 편집</button>
                          <button
                            onClick={() => {
                              const blob = new Blob([writerEdits.treatment || treatmentResult], { type: "text/markdown;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a"); a.href = url;
                              a.download = `treatment_${new Date().toISOString().slice(0,10)}.md`;
                              a.click(); URL.revokeObjectURL(url);
                            }}
                            style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.06)", color: "#C8A84B", cursor: "pointer", fontSize: 11 }}
                          >MD 내보내기</button>
                        </div>
                        <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: isMobile ? 13 : 14, lineHeight: 1.9, color: "rgba(var(--tw),0.82)" }}>
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#C8A84B", marginBottom: 8, marginTop: 0 }}>{children}</h1>,
                              h2: ({ children }) => <h2 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: "rgba(var(--tw),0.9)", marginTop: 28, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--c-bd-2)" }}>{children}</h2>,
                              h3: ({ children }) => <h3 style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "#C8A84B", marginTop: 18, marginBottom: 6 }}>{children}</h3>,
                              p: ({ children }) => <p style={{ marginBottom: 12, marginTop: 0 }}>{children}</p>,
                              strong: ({ children }) => <strong style={{ color: "rgba(var(--tw),0.95)", fontWeight: 700 }}>{children}</strong>,
                              em: ({ children }) => <em style={{ color: "rgba(200,168,75,0.8)", fontStyle: "italic" }}>{children}</em>,
                              ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
                              li: ({ children }) => <li style={{ marginBottom: 5 }}>{children}</li>,
                              hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--c-bd-1)", margin: "20px 0" }} />,
                              table: ({ children }) => <div style={{ overflowX: "auto", marginBottom: 16 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>{children}</table></div>,
                              th: ({ children }) => <th style={{ padding: "7px 10px", background: "rgba(200,168,75,0.08)", color: "var(--c-tx-70)", fontWeight: 600, textAlign: "left", borderBottom: "1px solid var(--c-bd-3)" }}>{children}</th>,
                              td: ({ children }) => <td style={{ padding: "7px 10px", color: "var(--c-tx-60)", borderBottom: "1px solid var(--c-card-2)" }}>{children}</td>,
                            }}
                          >{writerEdits.treatment || treatmentResult}</ReactMarkdown>
                        </div>
                        <FeedbackBox
                          value={treatmentFeedback}
                          onChange={setTreatmentFeedback}
                          onSubmit={refineTreatment}
                          loading={treatmentRefineLoading}
                          placeholder="수정 요청을 입력하세요"
                        />
                        {treatmentBefore && !editingTreatment && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--c-bd-2)" }}>
                            <button
                              onClick={() => setShowTreatmentBefore(!showTreatmentBefore)}
                              style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-35)", cursor: "pointer" }}
                            >
                              {showTreatmentBefore ? "▲ 이전 버전 숨기기" : "▼ 이전 버전 보기"}
                            </button>
                            {showTreatmentBefore && (
                              <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 9, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)", opacity: 0.65 }}>
                                <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>BEFORE — 피드백 반영 전</div>
                                <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 200, overflowY: "auto" }}>
                                  {treatmentBefore.slice(0, 800)}{treatmentBefore.length > 800 ? "..." : ""}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </ResultCard>
                )}
                {treatmentResult && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <DocButton label="상세 기획서 PDF" sub="트리트먼트 포함 제작 기획서" onClick={() => openApplicationDoc("treatment")} />
                  </div>
                )}
              </div>

              {/* ── STEP 2: 비트 시트 ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: beatSheetResult ? "rgba(78,204,163,0.15)" : "rgba(255,209,102,0.12)", color: beatSheetResult ? "#4ECCA3" : "#FFD166", border: `1px solid ${beatSheetResult ? "rgba(78,204,163,0.25)" : "rgba(255,209,102,0.25)"}`, fontFamily: "'JetBrains Mono', monospace" }}>{beatSheetResult ? "✓ STEP 2" : "STEP 2"}</div>
                  <span style={{ fontSize: 12, color: "var(--c-tx-45)", fontWeight: 500 }}>비트 시트 — Snyder 15비트 구조 설계</span>
                  {genre !== "auto" && GENRE_BEAT_HINTS[genre] && (
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "rgba(255,209,102,0.1)", color: "#FFD166", border: "1px solid rgba(255,209,102,0.2)", fontWeight: 600 }}>
                      {GENRES.find(g => g.id === genre)?.label} 맞춤 구조
                    </span>
                  )}
                  {!treatmentResult && <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,209,102,0.55)", fontStyle: "italic" }}>Step 1 완료 후 추천</span>}
                </div>
                <ToolButton icon={<SvgIcon d={ICON.film} size={16} />} label="비트 시트" sub="Snyder 15비트" done={!!beatSheetResult} loading={beatSheetLoading} color="#FFD166" onClick={generateBeatSheet} disabled={!logline.trim()}
                  tooltip={"Blake Snyder의 'Save the Cat' 15비트 구조를 적용합니다.\n\n할리우드 표준 이정표 15개를 정확한 페이지 위치에 배치합니다:\n오프닝 이미지 → 테마 제시 → 설정 → 촉발사건 → 고민 → 2막 진입 → B스토리 → 재미와 게임 → 중간점 → 적의 위협 → 전부 잃다 → 영혼의 밤 → 3막 진입 → 피날레 → 클로징 이미지\n\n각 비트마다 AI가 직접 씬을 집필할 수 있습니다."}
                  creditCost={cc(2)} />
                <ErrorMsg msg={beatSheetError} />
                {beatSheetStale && beatSheetResult && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10, marginTop: 8,
                    background: "rgba(247,160,114,0.07)",
                    border: "1px solid rgba(247,160,114,0.25)",
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                    <div style={{ flex: 1, fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.5 }}>
                      트리트먼트 또는 캐릭터가 변경됐습니다. 비트 시트를 재생성하면 최신 내용이 반영됩니다.
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setBeatSheetStale(false)}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-35)", fontSize: 10, cursor: "pointer" }}>무시</button>
                      <button onClick={generateBeatSheet} disabled={isDemoMode}
                        style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(247,160,114,0.4)", background: "rgba(247,160,114,0.1)", color: "#F7A072", fontSize: 10, fontWeight: 700, cursor: isDemoMode ? "not-allowed" : "pointer", opacity: isDemoMode ? 0.45 : 1 }}>재생성</button>
                    </div>
                  </div>
                )}
                {beatSheetResult && (
                  <ResultCard title="비트 시트" onClose={() => { setBeatSheetResult(null); setBeatSheetHistory([]); setBeatSheetStale(false); }} onUndo={() => undoHistory(setBeatSheetHistory, setBeatSheetResult, beatSheetHistory)} historyCount={beatSheetHistory.length} color="rgba(255,209,102,0.15)">
                    {beatSheetCtx && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                        {beatSheetCtx.genre && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(255,209,102,0.1)", color: "#FFD166", border: "1px solid rgba(255,209,102,0.2)" }}>{beatSheetCtx.genre} 맞춤</span>}
                        {beatSheetCtx.char && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(251,146,60,0.1)", color: "#FB923C", border: "1px solid rgba(251,146,60,0.2)" }}>캐릭터 반영</span>}
                        {beatSheetCtx.treatment && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(200,168,75,0.1)", color: "#C8A84B", border: "1px solid rgba(200,168,75,0.2)" }}>트리트먼트 반영</span>}
                        {beatSheetCtx.synopsis && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(78,204,163,0.1)", color: "#4ECCA3", border: "1px solid rgba(78,204,163,0.2)" }}>시놉시스 반영</span>}
                        {beatSheetCtx.plotPoints && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "rgba(96,165,250,0.1)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.2)" }}>플롯 포인트 반영</span>}
                      </div>
                    )}
                    <Suspense fallback={<div style={{ padding: 20, color: "var(--c-tx-30)", fontSize: 12 }}>비트 시트 로딩 중...</div>}>
                      <BeatSheetPanel
                        data={beatSheetResult}
                        beatScenes={beatScenes}
                        generatingBeat={generatingBeat}
                        expandedBeats={expandedBeats}
                        onToggle={(id) => setExpandedBeats((prev) => ({ ...prev, [id]: !prev[id] }))}
                        onGenerateScene={generateScene}
                        onExportAll={() => {
                          const lines = (beatSheetResult.beats || [])
                            .filter(b => beatScenes[b.id])
                            .map(b => `=== SCENE ${b.id}: ${b.name_kr || b.name_en} ===\n${beatScenes[b.id]}`)
                            .join("\n\n");
                          const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `beat_scenes_${new Date().toISOString().slice(0, 10)}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        isMobile={isMobile}
                        editingBeats={editingBeats}
                        beatEditDrafts={writerEdits.beats || {}}
                        onEditBeat={(id, val) => {
                          if (val === null) {
                            // 편집 시작
                            setEditingBeats(prev => ({ ...prev, [id]: true }));
                            setBeatEditDrafts(prev => ({ ...prev, [id]: (writerEdits.beats?.[id] || beatSheetResult.beats?.find(b => b.id === id)?.summary || "") }));
                          } else {
                            setBeatEditDrafts(prev => ({ ...prev, [id]: val }));
                          }
                        }}
                        onSaveBeat={(id) => {
                          setWriterEdits(prev => ({ ...prev, beats: { ...(prev.beats || {}), [id]: beatEditDrafts[id] } }));
                          setEditingBeats(prev => ({ ...prev, [id]: false }));
                        }}
                        onCancelBeat={(id) => {
                          setEditingBeats(prev => ({ ...prev, [id]: false }));
                        }}
                        teamMembers={teamMembers}
                        sceneAssignments={sceneAssignments}
                        onAssignScene={(beatId, memberId) => {
                          setSceneAssignments(prev =>
                            memberId
                              ? { ...prev, [beatId]: memberId }
                              : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== String(beatId)))
                          );
                          const assigneeName = memberId ? teamMembers.find(m => m.id === memberId)?.name : null;
                          const actorName = currentWorkingMember?.name || "나";
                          const actorColor = currentWorkingMember?.color || "#C8A84B";
                          if (assigneeName) addActivity?.("assign", actorName, actorColor, `씬 #${beatId} → ${assigneeName} 배정`, "5");
                          else addActivity?.("assign", actorName, actorColor, `씬 #${beatId} 배정 해제`, "5");
                        }}
                        onUpdateTeam={setTeamMembers}
                        getEditPermission={getEditPermission}
                        isOwner={isOwner}
                        isReadOnly={isReadOnly}
                      />
                    </Suspense>

                    {/* ── 구조 비틀기 제안 ── */}
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,209,102,0.12)" }}>
                      <button
                        onClick={analyzeStructureTwist}
                        disabled={structureTwistLoading}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, border: "1px dashed rgba(255,209,102,0.35)", background: structureTwistLoading ? "rgba(255,209,102,0.04)" : "rgba(255,209,102,0.06)", color: "#FFD166", fontSize: 11, fontWeight: 600, cursor: structureTwistLoading ? "not-allowed" : "pointer", transition: "all 0.18s", opacity: structureTwistLoading ? 0.7 : 1 }}
                      >
                        {structureTwistLoading ? <Spinner size={11} color="#FFD166" /> : <span style={{ fontSize: 13 }}>↩</span>}
                        구조 비틀기 제안
                        <span style={{ fontSize: 10, color: "rgba(255,209,102,0.5)", fontWeight: 400 }}>관습 역이용 포인트 찾기</span>
                      </button>
                      <ErrorMsg msg={structureTwistError} />
                      {structureTwistResult?.twists?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          {structureTwistResult.overall_note && (
                            <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(255,209,102,0.06)", border: "1px solid rgba(255,209,102,0.15)", fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.6, fontStyle: "italic" }}>
                              {structureTwistResult.overall_note}
                            </div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {structureTwistResult.twists.map((tw, i) => (
                              <div key={i} style={{ borderRadius: 10, border: "1px solid rgba(255,209,102,0.18)", overflow: "hidden" }}>
                                <div style={{ padding: "8px 12px", background: "rgba(255,209,102,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#FFD166", background: "rgba(255,209,102,0.12)", padding: "1px 6px", borderRadius: 4 }}>비트 {tw.beat_id}</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-tx-75)" }}>{tw.beat_name}</span>
                                </div>
                                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <span style={{ fontSize: 10, color: "rgba(160,160,160,0.6)", fontWeight: 600, flexShrink: 0, marginTop: 1 }}>관습</span>
                                    <span style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, textDecoration: "line-through", textDecorationColor: "rgba(160,160,160,0.3)" }}>{tw.convention}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <span style={{ fontSize: 10, color: "#FFD166", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>비틀기</span>
                                    <span style={{ fontSize: 12, color: "var(--c-tx-80)", lineHeight: 1.65, fontWeight: 500 }}>{tw.twist}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 600, flexShrink: 0, marginTop: 1 }}>효과</span>
                                    <span style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6 }}>{tw.effect}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <span style={{ fontSize: 10, color: "#F7A072", fontWeight: 600, flexShrink: 0, marginTop: 1 }}>위험</span>
                                    <span style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6 }}>{tw.risk}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ResultCard>
                )}
              </div>

              {/* ── STEP 3: 대사 디벨롭 ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: dialogueDevResult ? "rgba(78,204,163,0.15)" : "rgba(244,114,182,0.12)", color: dialogueDevResult ? "#4ECCA3" : "#F472B6", border: `1px solid ${dialogueDevResult ? "rgba(78,204,163,0.25)" : "rgba(244,114,182,0.25)"}`, fontFamily: "'JetBrains Mono', monospace" }}>{dialogueDevResult ? "✓ STEP 3" : "STEP 3"}</div>
                  <span style={{ fontSize: 12, color: "var(--c-tx-45)", fontWeight: 500 }}>대사 디벨롭 — 캐릭터별 목소리 설계</span>
                  {!beatSheetResult && <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(244,114,182,0.55)", fontStyle: "italic" }}>Step 2 완료 후 추천</span>}
                </div>
                <ToolButton icon={<SvgIcon d={ICON.doc} size={16} />} label="대사 디벨롭" sub="Mamet/Pinter" done={!!dialogueDevResult} loading={dialogueDevLoading} color="#F472B6" onClick={analyzeDialogueDev} disabled={!logline.trim()}
                  tooltip={"캐릭터마다 고유한 목소리와 말하는 방식을 설계합니다.\n\n• Mamet — 캐릭터는 원하는 것을 직접 말하지 않는다. 행동이 대사를 대신한다.\n• Pinter — 침묵, 공백, 반복이 대사보다 강한 의미를 만든다.\n\n결과물:\n• 주인공·조력자·대립자의 개별 말투 프로필\n• 핵심 장면의 하위텍스트 대사 예시\n• 대화 속 권력 역학과 감정 변화 지도"}
                  creditCost={cc(1)} />
                <ErrorMsg msg={dialogueDevError} />
                {dialogueDevResult && <ResultCard title="대사 디벨롭" onClose={() => setDialogueDevResult(null)} color="rgba(244,114,182,0.15)"><ErrorBoundary><DialogueDevPanel data={dialogueDevResult} isMobile={isMobile} /></ErrorBoundary></ResultCard>}
              </div>

              {getStageStatus("5") === "done" && (
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => advanceToStage("6")} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                    다음 단계: 시나리오 초고
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
    </div></ErrorBoundary>
  );
}

/* ─── DocButton (local helper) ─── */
function DocButton({ label, sub, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 16px", borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer",
        border: "1px solid rgba(96,165,250,0.35)",
        background: hovered && !disabled ? "rgba(96,165,250,0.12)" : "rgba(96,165,250,0.06)",
        color: disabled ? "rgba(96,165,250,0.35)" : "#60A5FA",
        opacity: disabled ? 0.5 : 1, transition: "all 0.2s",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>{sub}</div>}
      </div>
    </button>
  );
}
