/**
 * 작업 모드의 진행률 시각화.
 *
 * 두 가지 변종:
 * - <ModeProgressBar /> : 가로 막대 게이지. 사이드바 모드 헤더용 (얇음).
 * - <ModeProgressDots /> : stage 점들의 가로 배치. 모드 카드 안 미니 시각용.
 *
 * 진척도가 작품 완성도를 의미하지 않음 — Stage 6에 도달해도 작품은 미완성.
 * 그러므로 100%일 때만 색상 강조, 그 외에는 단조로운 진행 표시만.
 */

export function ModeProgressBar({ done, total, color, height = 3, width = 38 }) {
  if (!total || total === 0) return null;
  const pct = Math.min(100, Math.round((done / total) * 100));
  const allDone = done === total && done > 0;
  return (
    <div
      title={`${done}/${total} 완료`}
      style={{
        width, height, borderRadius: height,
        background: "var(--c-bd-2)", overflow: "hidden", flexShrink: 0,
      }}
    >
      <div style={{
        height: "100%", borderRadius: height,
        width: `${pct}%`,
        background: allDone
          ? `linear-gradient(90deg, ${color}, #4ECCA3)`
          : color,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

export function ModeProgressDots({ stages, getStageStatus, color }) {
  if (!stages || stages.length === 0) return null;
  if (stages.length === 1) return null; // stage 1개짜리 모드는 점 시각 무의미
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {stages.map((s) => {
        const status = getStageStatus(s.id);
        const isDone = status === "done";
        const isActive = status === "active";
        return (
          <div
            key={s.id}
            title={`Stage ${s.id} ${isDone ? "완료" : isActive ? "진행 중" : "대기"}`}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isDone ? color : isActive ? "#FFD166" : "var(--c-bd-3)",
              border: isDone ? "none" : "1px solid var(--c-bd-3)",
              boxShadow: isDone ? `0 0 0 1px ${color}33` : "none",
            }}
          />
        );
      })}
    </div>
  );
}
