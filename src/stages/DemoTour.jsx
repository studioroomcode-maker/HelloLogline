import { useLoglineCtx } from "../context/LoglineContext.jsx";

// 투어 단계 정의
// 0 = 대시보드 (DashboardView에서 인라인 렌더)
// 1 = Stage 1 진입 후 결과 탐색 유도
// 2 = 다른 스테이지 탐험 유도
const STEPS = {
  1: {
    icon: "📝",
    title: "로그라인 분석 결과예요",
    desc: "점수·흥미도·개선 제안을 살펴보세요. 스크롤해서 전체 결과를 확인한 뒤, 다음 스테이지로 넘어가보세요.",
    actionLabel: "개념 분석(Stage 2) 보러가기 →",
    color: "#C8A84B",
    onAction: (ctx) => {
      ctx.advanceToStage("2");
      ctx.setDemoTourStep(2);
    },
  },
  2: {
    icon: "🎉",
    title: "이제 자유롭게 탐험하세요!",
    desc: "캐릭터 설계 → 스토리 구조 → 트리트먼트 → 시나리오 초고까지, 8단계 전부 결과가 준비돼 있어요. 좌측 사이드바 숫자를 눌러보세요.",
    actionLabel: "알겠어요!",
    color: "#A78BFA",
    final: true,
    onAction: (ctx) => ctx.setDemoTourStep(null),
  },
};

export default function DemoTour() {
  const ctx = useLoglineCtx();
  const { isDemoMode, demoTourStep, setDemoTourStep } = ctx;

  if (!isDemoMode || demoTourStep === null || demoTourStep < 1 || demoTourStep > 2) return null;

  const step = STEPS[demoTourStep];
  if (!step) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 76,
        right: 20,
        zIndex: 290,
        width: 282,
        borderRadius: 16,
        overflow: "hidden",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        background: "var(--glass-modal)",
        border: `1px solid ${step.color}30`,
        boxShadow: `0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px ${step.color}12, inset 0 1px 0 rgba(255,255,255,0.06)`,
        animation: "demoSlideUp 0.36s cubic-bezier(0.32,0.72,0,1) both",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {/* 상단 컬러 띠 */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${step.color}, ${step.color}50)` }} />

      {/* 진행 점 + 닫기 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 0" }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 6, borderRadius: 3,
              width: i < demoTourStep ? 18 : i === demoTourStep ? 22 : 6,
              background: i < demoTourStep
                ? "var(--c-bd-4)"
                : i === demoTourStep
                ? step.color
                : "var(--c-bd-2)",
              transition: "all 0.3s",
            }} />
          ))}
          <span style={{ fontSize: 10, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", marginLeft: 4 }}>
            {demoTourStep}/2
          </span>
        </div>
        <button
          onClick={() => setDemoTourStep(null)}
          title="투어 종료"
          style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "var(--glass-raised)",
            border: "1px solid var(--c-bd-3)",
            color: "var(--c-tx-30)", fontSize: 13,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1, padding: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "10px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>{step.icon}</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: step.color }}>{step.title}</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.7, marginBottom: 14 }}>
          {step.desc}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: step.final ? "flex-end" : "space-between" }}>
          {!step.final && (
            <button
              onClick={() => setDemoTourStep(null)}
              style={{
                padding: "6px 10px", borderRadius: 7,
                border: "1px solid var(--c-bd-3)",
                background: "transparent",
                color: "var(--c-tx-30)", fontSize: 11,
                cursor: "pointer",
              }}
            >
              건너뛰기
            </button>
          )}
          <button
            onClick={() => step.onAction(ctx)}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${step.color}45`,
              background: `${step.color}15`,
              color: step.color, fontSize: 11, fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {step.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
