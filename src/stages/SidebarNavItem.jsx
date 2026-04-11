import { useLoglineCtx } from "../context/LoglineContext.jsx";

export default function SidebarNavItem({ id, title, sub, accentColor }) {
  const { currentStage, setCurrentStage, getStageStatus, getStageDoneCount, STAGE_TOTALS, stageResultSummary } = useLoglineCtx();

  const status = getStageStatus(id);
  const doneCount = getStageDoneCount(id);
  const total = STAGE_TOTALS[id];
  const isActive = currentStage === id;

  return (
    <div
      onClick={() => setCurrentStage(id)}
      style={{
        padding: "11px 16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderLeft: isActive ? `3px solid ${accentColor}` : "3px solid transparent",
        background: isActive ? `${accentColor}12` : "transparent",
        transition: "all 0.15s",
        borderRadius: "0 8px 8px 0",
        marginBottom: 2,
      }}
    >
      {/* 상태 원 */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${status === "done" ? "#4ECCA3" : isActive ? accentColor : "var(--c-bd-3)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: status === "done" ? "rgba(78,204,163,0.1)" : "transparent",
      }}>
        {status === "done"
          ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
          : <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: isActive ? accentColor : "var(--c-tx-30)" }}>
              {String(id).padStart(2, "0")}
            </span>
        }
      </div>

      {/* 제목/부제 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: isActive ? "var(--text-main)" : status === "done" ? "var(--c-tx-65)" : "var(--c-tx-40)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{title}</div>
        <div style={{ fontSize: 10, color: "var(--c-tx-28)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
      </div>

      {/* 완료 배지 + 결과 요약 */}
      {!isActive && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          {doneCount > 0 && (
            <span style={{
              fontSize: 9, color: "#4ECCA3", fontWeight: 700,
              padding: "2px 6px", borderRadius: 10,
              border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {doneCount}/{total}
            </span>
          )}
          {status === "done" && stageResultSummary?.[id] && (
            <span style={{
              fontSize: 9,
              color: id === "7"
                ? (stageResultSummary[id] === "RECOMMEND" ? "#4ECCA3" : stageResultSummary[id] === "PASS" ? "#E85D75" : "#FFD166")
                : "#C8A84B",
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: "nowrap",
            }}>
              {stageResultSummary[id]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
