import { useState, useEffect, useCallback } from "react";
import { loadProject, forkProject, loadProjectVersions, fetchVersionSnapshot } from "../db.js";
import { Spinner } from "../ui.jsx";
import ComparisonView from "./ComparisonView.jsx";

function VersionHistory({ projectId, token, loadProjectState, onClose }) {
  const [versions, setVersions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await loadProjectVersions(projectId, token);
    setVersions(result);
    setLoading(false);
  }, [projectId, token]);

  useEffect(() => { load(); }, [load]);

  async function restore(versionId) {
    setRestoring(versionId);
    const snapshot = await fetchVersionSnapshot(versionId, token);
    if (snapshot) {
      loadProjectState(snapshot);
      onClose();
    } else {
      setRestoring(null);
    }
  }

  return (
    <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: 0.8 }}>버전 이력</span>
        {loading && <Spinner size={11} color="#A78BFA" />}
        {!loading && (
          <button onClick={load} style={{ fontSize: 9, color: "var(--c-tx-30)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>새로고침</button>
        )}
      </div>

      {!loading && (!versions || versions.length === 0) && (
        <div style={{ fontSize: 11, color: "var(--c-tx-30)", textAlign: "center", padding: "8px 0" }}>
          저장된 버전이 없습니다
          {!token && <div style={{ marginTop: 4, fontSize: 10 }}>로그인 후 이용 가능합니다</div>}
        </div>
      )}

      {versions && versions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {versions.map((v) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "rgba(var(--tw),0.02)" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#A78BFA", fontFamily: "'JetBrains Mono', monospace", minWidth: 24 }}>v{v.versionNum}</span>
              <span style={{ flex: 1, fontSize: 10, color: "var(--c-tx-45)", fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date(v.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
              {v.logline && (
                <span style={{ fontSize: 10, color: "var(--c-tx-35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                  {v.logline.slice(0, 30)}…
                </span>
              )}
              <button
                onClick={() => restore(v.id)}
                disabled={restoring === v.id}
                style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(167,139,250,0.35)", background: "rgba(167,139,250,0.1)", color: "#A78BFA", cursor: "pointer", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
              >
                {restoring === v.id ? <Spinner size={10} color="#A78BFA" /> : "복원"}
              </button>
            </div>
          ))}
          <div style={{ fontSize: 9, color: "var(--c-tx-25)", textAlign: "right", marginTop: 2 }}>최근 10개 버전 보관</div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPanel({
  savedProjects, setShowProjects,
  exportProjectJson, loadProjectById, loadProjectState, deleteProjectById,
  importProjectJson, importFileRef,
  token,
}) {
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [comparingProjects, setComparingProjects] = useState(null);
  const [forking, setForking] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  function toggleCompare(id) {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  async function openComparison() {
    if (compareIds.length < 2) return;
    setCompareLoading(true);
    const [a, b] = await Promise.all([loadProject(compareIds[0]), loadProject(compareIds[1])]);
    setComparingProjects([a, b]);
    setCompareLoading(false);
  }

  async function handleFork(proj) {
    setForking(proj.id);
    try {
      const forked = await forkProject(proj);
      loadProjectById(forked);
      setShowProjects(false);
    } finally {
      setForking(null);
    }
  }

  const compareMode = compareIds.length > 0;

  return (
    <>
      <div onClick={() => setShowProjects(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 299 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 300, width: "min(580px, 96vw)", maxHeight: "84vh",
        background: "var(--bg-surface)", border: "1px solid var(--c-bd-4)", borderRadius: 16,
        display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>저장된 프로젝트</div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 2 }}>분석이 완료될 때마다 자동 저장됩니다</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {compareMode && (
              <button
                onClick={openComparison}
                disabled={compareIds.length < 2 || compareLoading}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(200,168,75,0.4)", background: compareIds.length === 2 ? "rgba(200,168,75,0.12)" : "transparent", color: compareIds.length === 2 ? "#C8A84B" : "var(--c-tx-30)", cursor: compareIds.length === 2 ? "pointer" : "default", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}
              >
                {compareLoading ? <Spinner size={11} color="#C8A84B" /> : null}
                비교 보기 {compareIds.length < 2 ? `(${compareIds.length}/2)` : ""}
              </button>
            )}
            <button
              onClick={() => setCompareIds([])}
              style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${compareMode ? "rgba(200,168,75,0.4)" : "var(--c-bd-3)"}`, background: compareMode ? "rgba(200,168,75,0.08)" : "transparent", color: compareMode ? "#C8A84B" : "var(--c-tx-40)", cursor: "pointer", fontSize: 11 }}
            >
              {compareMode ? "비교 취소" : "비교 모드"}
            </button>
            <button onClick={() => setShowProjects(false)} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {compareMode && (
          <div style={{ padding: "8px 24px", background: "rgba(200,168,75,0.04)", borderBottom: "1px solid var(--c-bd-1)", fontSize: 11, color: "var(--c-tx-40)" }}>
            두 프로젝트를 선택하면 Stage 1 점수를 비교합니다. ({compareIds.length}/2 선택됨)
          </div>
        )}

        <div style={{ overflowY: "auto", flex: 1, padding: "8px 16px" }}>
          {savedProjects.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--c-tx-30)", fontSize: 13, padding: "40px 0" }}>저장된 프로젝트가 없습니다</div>
          ) : savedProjects.map((proj) => {
            const stagesDone = [
              { n: 1, label: "분석",     done: !!proj.result },
              { n: 2, label: "개념",     done: !!(proj.academicResult || proj.mythMapResult || proj.expertPanelResult || proj.barthesCodeResult || proj.themeResult || proj.koreanMythResult) },
              { n: 3, label: "캐릭터",  done: !!(proj.shadowResult || proj.authenticityResult || proj.charDevResult || proj.valueChargeResult) },
              { n: 4, label: "시놉시스", done: !!(proj.pipelineResult || proj.synopsisResults || proj.treatmentResult || proj.beatSheetResult) },
            ];
            const historyOpen = expandedHistory === proj.id;
            const isSelected = compareIds.includes(proj.id);

            return (
              <div key={proj.id} style={{ marginBottom: 8 }}>
                <div style={{
                  padding: "11px 13px", borderRadius: 10,
                  border: `1px solid ${isSelected ? "rgba(200,168,75,0.45)" : historyOpen ? "rgba(167,139,250,0.3)" : "var(--c-bd-1)"}`,
                  background: isSelected ? "rgba(200,168,75,0.05)" : historyOpen ? "rgba(167,139,250,0.03)" : "rgba(var(--tw),0.02)",
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                }}>
                  {compareMode && (
                    <button
                      onClick={() => toggleCompare(proj.id)}
                      style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? "#C8A84B" : "var(--c-bd-4)"}`, background: isSelected ? "#C8A84B" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {isSelected && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#0d0d1a" strokeWidth={3} strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>}
                    </button>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {proj.title || "제목 없음"}
                      {proj.parentId && <span style={{ marginLeft: 6, fontSize: 9, color: "#A78BFA", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>FORK</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                      {stagesDone.map(s => (
                        <span key={s.n} style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: s.done ? (s.n === 1 ? "rgba(200,168,75,0.15)" : s.n === 2 ? "rgba(167,139,250,0.15)" : s.n === 3 ? "rgba(96,165,250,0.15)" : "rgba(78,204,163,0.15)") : "rgba(var(--tw),0.04)",
                          color: s.done ? (s.n === 1 ? "#C8A84B" : s.n === 2 ? "#A78BFA" : s.n === 3 ? "#60A5FA" : "#4ECCA3") : "var(--c-tx-20)",
                          border: s.done ? "none" : "1px solid var(--c-bd-1)",
                        }}>
                          {s.n}. {s.label}
                        </span>
                      ))}
                      <span style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {new Date(proj.updatedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {!compareMode && (
                    <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
                      <button
                        onClick={() => handleFork(proj)}
                        disabled={forking === proj.id}
                        title="분기(Fork) — 현재 상태로 새 복사본 생성"
                        style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.06)", color: "#4ECCA3", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}
                      >
                        {forking === proj.id ? <Spinner size={10} color="#4ECCA3" /> : (
                          <>
                            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                            분기
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedHistory(v => v === proj.id ? null : proj.id)}
                        title="버전 이력"
                        style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${historyOpen ? "rgba(167,139,250,0.5)" : "rgba(167,139,250,0.22)"}`, background: historyOpen ? "rgba(167,139,250,0.12)" : "rgba(167,139,250,0.05)", color: "#A78BFA", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}
                      >
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        이력
                      </button>
                      <button onClick={() => loadProjectById(proj)} style={{ padding: "5px 11px", borderRadius: 6, border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.07)", color: "#4ECCA3", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>불러오기</button>
                      <button onClick={() => deleteProjectById(proj.id)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(232,93,117,0.2)", background: "rgba(232,93,117,0.05)", color: "#E85D75", cursor: "pointer", fontSize: 11 }}>삭제</button>
                    </div>
                  )}
                </div>

                {historyOpen && !compareMode && (
                  <VersionHistory
                    projectId={proj.id}
                    token={token}
                    loadProjectState={loadProjectState}
                    onClose={() => { setExpandedHistory(null); setShowProjects(false); }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--c-card-3)", display: "flex", gap: 8 }}>
          <button
            onClick={exportProjectJson}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.07)", color: "#C8A84B", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            ↓ 현재 작업 내보내기 (JSON)
          </button>
          <button
            onClick={() => importFileRef.current?.click()}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.07)", color: "#60A5FA", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            ↑ JSON 파일 불러오기
          </button>
          <input ref={importFileRef} type="file" accept=".json" style={{ display: "none" }} onChange={importProjectJson} />
        </div>
      </div>

      {comparingProjects && (
        <ComparisonView
          projectA={comparingProjects[0]}
          projectB={comparingProjects[1]}
          onClose={() => setComparingProjects(null)}
        />
      )}
    </>
  );
}
