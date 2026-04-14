import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

// 스테이지 진입 전제 조건: key 스테이지는 value 스테이지가 완료되어야 진입 가능
const STAGE_PREREQUISITES = {
  "2": "1", "3": "1", "4": "2",
  "5": "4", "6": "5", "7": "6", "8": "7",
};

export default function SidebarNavItem({ id, title, sub, accentColor, commentCount = 0 }) {
  const { currentStage, setCurrentStage, getStageStatus, getStageDoneCount, STAGE_TOTALS, stageResultSummary, showToast, reverseEntryStage } = useLoglineCtx();
  const [hovered, setHovered] = useState(false);

  const status = getStageStatus(id);
  const doneCount = getStageDoneCount(id);
  const total = STAGE_TOTALS[id];
  const isActive = currentStage === id;

  function handleClick() {
    // 역방향 진입 시 진입 스테이지 이하는 전제조건 우회
    if (reverseEntryStage && parseInt(id) <= parseInt(reverseEntryStage)) {
      setCurrentStage(id);
      return;
    }
    const prereqId = STAGE_PREREQUISITES[id];
    if (prereqId && getStageStatus(prereqId) !== "done") {
      showToast("info", `Stage ${prereqId}을 먼저 완료해야 진입할 수 있습니다.`);
      setCurrentStage(prereqId);
      return;
    }
    setCurrentStage(id);
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "11px 16px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderLeft: isActive ? `3px solid ${accentColor}` : "3px solid transparent",
        background: isActive
          ? `linear-gradient(90deg, ${accentColor}14, ${accentColor}06)`
          : hovered
          ? "var(--glass-nano)"
          : "transparent",
        boxShadow: isActive ? `inset 0 1px 0 ${accentColor}10` : "none",
        transition: "background 0.2s var(--ease-spring), box-shadow 0.2s var(--ease-spring)",
        borderRadius: "0 8px 8px 0",
        marginBottom: 2,
      }}
    >
      {/* 상태 원 */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${status === "done" ? "#4ECCA3" : isActive ? accentColor : "var(--glass-bd-raised)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: status === "done" ? "rgba(78,204,163,0.1)" : isActive ? `${accentColor}10` : "transparent",
        transition: "border-color 0.18s, background 0.18s",
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
              border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.08)",
              boxShadow: "inset 0 1px 0 rgba(78,204,163,0.12)",
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
          {commentCount > 0 && (
            <span style={{
              fontSize: 8, color: "#A78BFA", fontWeight: 700,
              padding: "1px 5px", borderRadius: 10,
              border: "1px solid rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.08)",
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex", alignItems: "center", gap: 2,
            }}>
              <svg width={6} height={6} viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth={2.5} strokeLinecap="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {commentCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
