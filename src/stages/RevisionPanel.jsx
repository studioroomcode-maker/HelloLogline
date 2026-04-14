/**
 * RevisionPanel.jsx
 * Final Draft 스타일 개정본 컬러 시스템 + 스냅샷 diff 뷰어
 *
 * - 개정 라운드 관리 (흰색→파란색→분홍색→노란색→초록색...)
 * - 수정된 씬에 자동 컬러 마킹 + * 표시
 * - 스냅샷 기반 씬 단위 diff 비교
 */

import { useState } from "react";
import { extractSceneBodies, REVISION_COLORS } from "../editor/FountainParser.js";

// ── 씬 단위 diff 계산 ─────────────────────────────────────────────
function computeSceneDiff(oldSnapshot, newText) {
  const oldBodies = extractSceneBodies(oldSnapshot || "");
  const newBodies = extractSceneBodies(newText || "");

  const results = [];

  // 현재 텍스트 씬 순서 기준
  Object.keys(newBodies).forEach(key => {
    if (!(key in oldBodies)) {
      results.push({ key, type: "added", oldText: null, newText: newBodies[key] });
    } else if (oldBodies[key] !== newBodies[key]) {
      results.push({ key, type: "changed", oldText: oldBodies[key], newText: newBodies[key] });
    } else {
      results.push({ key, type: "same", oldText: oldBodies[key], newText: newBodies[key] });
    }
  });

  // 삭제된 씬
  Object.keys(oldBodies).forEach(key => {
    if (!(key in newBodies)) {
      results.push({ key, type: "removed", oldText: oldBodies[key], newText: null });
    }
  });

  return results;
}

// ── 상대 시간 ──────────────────────────────────────────────────────
function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "방금";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return new Date(ts).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

// ── 씬 diff 모달 ──────────────────────────────────────────────────
function DiffModal({ revision, currentText, onClose }) {
  const diffResult = computeSceneDiff(revision.snapshot, currentText);
  const changed = diffResult.filter(d => d.type !== "same");
  const sameCount = diffResult.filter(d => d.type === "same").length;

  const TYPE_LABELS = {
    added:   { label: "추가",   bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.3)",  color: "#34D399" },
    removed: { label: "삭제",   bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", color: "#F87171" },
    changed: { label: "수정",   bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  color: "#FBBF24" },
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-surface, #1a1a2e)",
        border: "1px solid var(--c-bd-4, rgba(255,255,255,0.1))",
        borderRadius: 16, width: "min(820px, 100%)", maxHeight: "85vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{
          padding: "14px 18px", borderBottom: "1px solid var(--c-bd-2)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-block", width: 12, height: 12, borderRadius: "50%",
              background: revision.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>
              {revision.name} → 현재 비교
            </span>
            <span style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>
              {timeAgo(revision.createdAt)} 스냅샷
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace" }}>
              {changed.length}개 변경 / {sameCount}개 동일
            </span>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--c-tx-40)", fontSize: 16, padding: "2px 6px",
            }}>✕</button>
          </div>
        </div>

        {/* diff 목록 */}
        <div style={{ overflowY: "auto", flex: 1, padding: "12px 18px" }}>
          {changed.length === 0 ? (
            <div style={{
              padding: "32px 16px", textAlign: "center",
              fontSize: 13, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              변경된 씬이 없습니다.
            </div>
          ) : (
            <>
              {sameCount > 0 && (
                <div style={{
                  padding: "6px 12px", marginBottom: 8, borderRadius: 6,
                  background: "var(--glass-nano)", fontSize: 10,
                  color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace",
                }}>
                  ↕ {sameCount}개 씬 변경 없음 (생략됨)
                </div>
              )}
              {changed.map((d, idx) => {
                const meta = TYPE_LABELS[d.type];
                return (
                  <div key={idx} style={{
                    marginBottom: 14, borderRadius: 10,
                    border: `1px solid ${meta.border}`,
                    background: meta.bg, overflow: "hidden",
                  }}>
                    {/* 씬 헤더 */}
                    <div style={{
                      padding: "7px 12px", display: "flex", alignItems: "center", gap: 8,
                      borderBottom: `1px solid ${meta.border}`,
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 5,
                        background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>{meta.label}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: "var(--text-main)",
                        fontFamily: "'Courier New', monospace", letterSpacing: "0.06em",
                      }}>{d.key}</span>
                    </div>

                    {/* 내용 비교 */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: d.type === "changed" ? "1fr 1fr" : "1fr",
                      gap: 0,
                    }}>
                      {d.type === "changed" && (
                        <div style={{
                          padding: "10px 12px", borderRight: "1px solid var(--c-bd-1)",
                          background: "rgba(248,113,113,0.04)",
                        }}>
                          <div style={{
                            fontSize: 9, color: "#F87171", fontFamily: "'JetBrains Mono', monospace",
                            marginBottom: 4, fontWeight: 700,
                          }}>BEFORE</div>
                          <pre style={{
                            margin: 0, fontSize: 11, color: "var(--c-tx-55)",
                            fontFamily: "'Courier New', monospace",
                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                            lineHeight: 1.6, maxHeight: 160, overflowY: "auto",
                          }}>{d.oldText || "(비어있음)"}</pre>
                        </div>
                      )}
                      {d.type === "removed" && (
                        <div style={{ padding: "10px 12px", background: "rgba(248,113,113,0.04)" }}>
                          <div style={{
                            fontSize: 9, color: "#F87171", fontFamily: "'JetBrains Mono', monospace",
                            marginBottom: 4, fontWeight: 700,
                          }}>삭제됨</div>
                          <pre style={{
                            margin: 0, fontSize: 11, color: "var(--c-tx-55)",
                            fontFamily: "'Courier New', monospace",
                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                            lineHeight: 1.6, maxHeight: 160, overflowY: "auto",
                          }}>{d.oldText || "(비어있음)"}</pre>
                        </div>
                      )}
                      {(d.type === "changed" || d.type === "added") && (
                        <div style={{
                          padding: "10px 12px",
                          background: d.type === "added" ? "rgba(52,211,153,0.04)" : "rgba(52,211,153,0.02)",
                        }}>
                          <div style={{
                            fontSize: 9, color: "#34D399", fontFamily: "'JetBrains Mono', monospace",
                            marginBottom: 4, fontWeight: 700,
                          }}>{d.type === "added" ? "추가됨" : "AFTER"}</div>
                          <pre style={{
                            margin: 0, fontSize: 11, color: "var(--c-tx-55)",
                            fontFamily: "'Courier New', monospace",
                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                            lineHeight: 1.6, maxHeight: 160, overflowY: "auto",
                          }}>{d.newText || "(비어있음)"}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function RevisionPanel({
  revisions,
  currentRevisionId,
  sceneRevisionMap,
  scenarioDraftResult,
  onStartRevision,
  onDeleteRevision,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [diffTarget, setDiffTarget] = useState(null); // revision to diff

  const nextRevIdx = revisions.length; // 0-based → REVISION_COLORS[nextRevIdx]
  const nextColor = REVISION_COLORS[Math.min(nextRevIdx, REVISION_COLORS.length - 1)];

  // 현재 활성 개정 라운드 정보
  const activeRevision = currentRevisionId != null
    ? revisions.find(r => r.id === currentRevisionId)
    : null;

  // 씬 개정 통계
  const markedSceneCount = Object.keys(sceneRevisionMap).length;

  const handleStartClick = () => {
    if (!scenarioDraftResult) return;
    if (showNameInput) {
      const finalName = nameInput.trim() || nextColor.name;
      onStartRevision(finalName);
      setNameInput("");
      setShowNameInput(false);
    } else {
      setShowNameInput(true);
      setNameInput(nextColor.name);
    }
  };

  return (
    <>
      {diffTarget && (
        <DiffModal
          revision={diffTarget}
          currentText={scenarioDraftResult}
          onClose={() => setDiffTarget(null)}
        />
      )}

      <div style={{
        marginBottom: 12, borderRadius: 10,
        border: "1px solid var(--c-bd-2)",
        background: "var(--glass-nano)",
        overflow: "hidden",
      }}>
        {/* ── 헤더 ── */}
        <div
          onClick={() => setExpanded(p => !p)}
          style={{
            padding: "9px 14px", display: "flex", alignItems: "center", gap: 10,
            cursor: "pointer", userSelect: "none",
          }}
        >
          {/* 컬러 도트들 */}
          <div style={{ display: "flex", gap: 3 }}>
            {REVISION_COLORS.slice(0, 5).map(rc => (
              <span key={rc.id} style={{
                width: 7, height: 7, borderRadius: "50%",
                background: revisions.find(r => r.id === rc.id) ? rc.color : "var(--glass-bd-nano)",
                border: currentRevisionId === rc.id ? `1px solid ${rc.color}` : "1px solid transparent",
                transition: "background 0.2s",
              }} />
            ))}
          </div>

          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-main)", fontFamily: "'JetBrains Mono', monospace" }}>
            개정 관리
          </span>

          {/* 현재 개정 배지 */}
          {activeRevision ? (
            <span style={{
              fontSize: 9, padding: "2px 8px", borderRadius: 10,
              background: `${activeRevision.color}20`, color: activeRevision.color,
              border: `1px solid ${activeRevision.color}40`,
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            }}>
              ● {activeRevision.name} 진행 중
            </span>
          ) : (
            <span style={{
              fontSize: 9, padding: "2px 8px", borderRadius: 10,
              background: "var(--glass-micro)", color: "var(--c-tx-30)",
              border: "1px solid var(--glass-bd-nano)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              원고 (흰색)
            </span>
          )}

          {markedSceneCount > 0 && (
            <span style={{
              fontSize: 9, color: "var(--c-tx-30)",
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: "auto",
            }}>
              {markedSceneCount}개 씬 마킹됨
            </span>
          )}

          <span style={{
            fontSize: 8, color: "var(--c-tx-25)",
            fontFamily: "'JetBrains Mono', monospace",
            marginLeft: markedSceneCount > 0 ? 0 : "auto",
          }}>{expanded ? "▲" : "▼"}</span>
        </div>

        {/* ── 확장 패널 ── */}
        {expanded && (
          <div style={{ borderTop: "1px solid var(--c-bd-1)", padding: "12px 14px" }}>

            {/* 새 개정본 시작 */}
            {nextRevIdx < REVISION_COLORS.length && (
              <div style={{ marginBottom: 14 }}>
                {showNameInput ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: nextColor.color, flexShrink: 0,
                    }} />
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleStartClick();
                        if (e.key === "Escape") { setShowNameInput(false); setNameInput(""); }
                      }}
                      placeholder={nextColor.name}
                      autoFocus
                      style={{
                        flex: 1, padding: "5px 10px", borderRadius: 7,
                        border: `1px solid ${nextColor.color}50`,
                        background: `${nextColor.color}10`,
                        color: "var(--text-main)", fontSize: 11,
                        fontFamily: "'Noto Sans KR', sans-serif",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={handleStartClick}
                      style={{
                        padding: "5px 12px", borderRadius: 7,
                        border: `1px solid ${nextColor.color}60`,
                        background: `${nextColor.color}20`,
                        color: nextColor.color, fontSize: 10, fontWeight: 700,
                        cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >시작</button>
                    <button
                      onClick={() => { setShowNameInput(false); setNameInput(""); }}
                      style={{
                        padding: "5px 8px", borderRadius: 7,
                        border: "1px solid var(--c-bd-3)", background: "none",
                        color: "var(--c-tx-35)", fontSize: 10, cursor: "pointer",
                      }}
                    >취소</button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartClick}
                    disabled={!scenarioDraftResult}
                    style={{
                      width: "100%", padding: "8px 14px", borderRadius: 8,
                      border: `1px solid ${nextColor.color}50`,
                      background: `${nextColor.color}10`,
                      color: nextColor.color, fontSize: 11, fontWeight: 700,
                      cursor: scenarioDraftResult ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", gap: 8,
                      fontFamily: "'Noto Sans KR', sans-serif",
                      opacity: scenarioDraftResult ? 1 : 0.5,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: nextColor.color, flexShrink: 0,
                    }} />
                    새 개정본 시작 — {nextColor.name}
                    <span style={{
                      marginLeft: "auto", fontSize: 9, opacity: 0.7,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>현재 원고를 스냅샷으로 저장</span>
                  </button>
                )}
              </div>
            )}

            {/* 개정 이력 */}
            {revisions.length === 0 ? (
              <div style={{
                padding: "14px 0 4px", textAlign: "center",
                fontSize: 11, color: "var(--c-tx-25)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>
                아직 개정본이 없습니다.<br />
                <span style={{ fontSize: 9, color: "var(--c-tx-20)" }}>
                  개정본을 시작하면 씬별 변경 이력이 추적됩니다.
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {/* 원고 행 */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 10px", borderRadius: 7,
                  background: "var(--glass-micro)",
                  border: "1px solid var(--glass-bd-nano)",
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "rgba(255,255,255,0.25)", flexShrink: 0,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                    원고
                  </span>
                  <span style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", marginLeft: "auto" }}>
                    최초 작성
                  </span>
                </div>

                {/* 개정본 행들 */}
                {revisions.map(rev => {
                  const isActive = rev.id === currentRevisionId;
                  const sceneCount = Object.values(sceneRevisionMap)
                    .filter(v => v.id === rev.id).length;
                  return (
                    <div
                      key={rev.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 10px", borderRadius: 7,
                        background: isActive ? `${rev.color}10` : "var(--glass-micro)",
                        border: isActive ? `1px solid ${rev.color}40` : "1px solid var(--glass-bd-nano)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: rev.color, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: isActive ? rev.color : "var(--text-main)",
                            fontFamily: "'Noto Sans KR', sans-serif",
                          }}>
                            {rev.name}
                          </span>
                          {isActive && (
                            <span style={{
                              fontSize: 8, padding: "1px 5px", borderRadius: 5,
                              background: `${rev.color}20`, color: rev.color,
                              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                            }}>ACTIVE</span>
                          )}
                        </div>
                        <div style={{
                          fontSize: 9, color: "var(--c-tx-30)",
                          fontFamily: "'JetBrains Mono', monospace",
                          marginTop: 1,
                        }}>
                          {timeAgo(rev.createdAt)}{sceneCount > 0 ? ` · ${sceneCount}개 씬 수정됨` : ""}
                        </div>
                      </div>

                      {/* 비교 버튼 */}
                      <button
                        onClick={() => setDiffTarget(rev)}
                        title="현재 원고와 비교"
                        style={{
                          padding: "3px 9px", borderRadius: 6,
                          border: `1px solid ${rev.color}30`,
                          background: `${rev.color}10`,
                          color: rev.color, fontSize: 9, fontWeight: 700,
                          cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                          flexShrink: 0,
                        }}
                      >비교</button>

                      {/* 삭제 버튼 */}
                      {!isActive && onDeleteRevision && (
                        <button
                          onClick={() => onDeleteRevision(rev.id)}
                          title="이 개정본 삭제"
                          style={{
                            padding: "3px 6px", borderRadius: 6,
                            border: "1px solid var(--c-bd-2)",
                            background: "none", color: "var(--c-tx-25)",
                            fontSize: 9, cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 컬러 범례 */}
            <div style={{
              marginTop: 12, paddingTop: 10,
              borderTop: "1px solid var(--c-bd-1)",
              display: "flex", flexWrap: "wrap", gap: 5,
            }}>
              {REVISION_COLORS.map(rc => (
                <span key={rc.id} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 8, padding: "2px 7px", borderRadius: 8,
                  background: `${rc.color}10`,
                  border: `1px solid ${rc.color}25`,
                  color: rc.color,
                  fontFamily: "'JetBrains Mono', monospace",
                  opacity: revisions.find(r => r.id === rc.id) ? 1 : 0.35,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: rc.color }} />
                  {rc.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
