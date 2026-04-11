import { Suspense } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { Spinner } from "../ui.jsx";

/**
 * StageAccordion — 8개 스테이지 공통 아코디언 래퍼
 *
 * Props:
 * - id: "1" ~ "8"
 * - accentColor: 스테이지 강조 색 (rgba 문자열)
 * - title: 스테이지 제목
 * - sub: 부제목
 * - spinnerColor: 로딩 스피너 색
 * - gated: true이면 canUseAllStages 확인 (기본 false)
 * - children: 스테이지 콘텐츠 컴포넌트
 */
export default function StageAccordion({ id, accentColor, title, sub, spinnerColor = "#C8A84B", gated = false, children }) {
  const {
    currentStage, setCurrentStage,
    canUseAllStages, showToast,
    getStageStatus, getStageDoneCount, STAGE_TOTALS, statusDotColor,
    stageRefs,
    isMobile,
  } = useLoglineCtx();

  const status = getStageStatus(id);
  const doneCount = getStageDoneCount(id);
  const total = STAGE_TOTALS[id];
  const isActive = currentStage === id;

  function handleClick() {
    if (gated && !canUseAllStages) {
      showToast("warn", "자신의 API 키를 입력하거나 프리미엄 등급으로 업그레이드하면 전체 기능을 사용할 수 있습니다. (우측 상단 API 버튼)");
      return;
    }
    setCurrentStage(id);
  }

  return (
    <div
      ref={(el) => { stageRefs.current[id] = el; }}
      style={{
        borderRadius: 14, marginBottom: 10, overflow: "visible",
        border: `1px solid ${isActive ? accentColor : "var(--c-bd-1)"}`,
        transition: "border-color 0.25s",
      }}
    >
      {/* 헤더 */}
      <div
        onClick={handleClick}
        style={{
          padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
          cursor: "pointer",
          background: isActive ? `${accentColor.replace("0.25", "0.05")}` : "rgba(var(--tw),0.01)",
          transition: "background 0.2s",
        }}
      >
        {/* 상태 원 */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${statusDotColor[status]}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: status === "done" ? "rgba(78,204,163,0.1)" : "transparent",
          transition: "all 0.25s",
        }}>
          {status === "done"
            ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
            : <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: statusDotColor[status] }}>
                {String(id).padStart(2, "0")}
              </span>
          }
        </div>

        {/* 제목 */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: isActive ? "var(--text-main)" : status === "done" ? "var(--c-tx-75)" : "var(--c-tx-45)",
          }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2 }}>{sub}</div>
        </div>

        {/* 완료 카운트 배지 */}
        {!isActive && doneCount > 0 && (
          <span style={{
            fontSize: 10, color: "#4ECCA3", fontWeight: 700,
            padding: "3px 8px", borderRadius: 20,
            border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {doneCount}/{total}
          </span>
        )}

        {status === "active" && <Spinner size={12} color={spinnerColor} />}

        {/* 화살표 */}
        <svg
          width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-25)"
          strokeWidth={2} strokeLinecap="round" style={{ transform: isActive ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* 콘텐츠 */}
      {isActive && (
        <div style={{ borderTop: "1px solid var(--c-card-3)", padding: isMobile ? "20px 16px" : "24px 24px" }}>
          <Suspense fallback={<div style={{ padding: 20, color: "var(--c-tx-30)", fontSize: 12 }}>로딩 중...</div>}>
            {children}
          </Suspense>
        </div>
      )}
    </div>
  );
}
