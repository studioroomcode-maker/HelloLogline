import { useState, useEffect } from "react";
import { useLoglineCtx } from "./context/LoglineContext.jsx";

const STORAGE_KEY = "hll_welcomed_v2";

const STEPS = [
  {
    icon: "📝",
    title: "로그라인 한 줄 입력",
    desc: "시나리오 아이디어를 한 문장으로 적으세요.\nAI가 12가지 기준으로 즉시 점수와 개선안을 제공합니다.",
    color: "#C8A84B",
  },
  {
    icon: "🎬",
    title: "8단계 AI 파이프라인",
    desc: "캐릭터 심리 → 스토리 구조 → 트리트먼트 → 시나리오 초고까지\n전문 작가의 개발 과정을 AI와 함께 완성합니다.",
    color: "#A78BFA",
  },
  {
    icon: "🎁",
    title: "10 크레딧 무료 지급",
    desc: "가입 축하로 크레딧 10개가 지급됐습니다.\n시놉시스·구조 분석·트리트먼트 등 유료 기능을 지금 바로 체험해보세요.",
    color: "#4ECCA3",
  },
];

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { advanceToStage } = useLoglineCtx?.() ?? {};

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    advanceToStage?.("1");
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={dismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 400, width: "100%",
          background: "var(--bg-surface)",
          border: "1px solid var(--c-bd-2)",
          borderRadius: 20, overflow: "hidden",
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ padding: "32px 28px 24px", textAlign: "center" }}>
          {/* 스텝 인디케이터 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 22 : 6, height: 6, borderRadius: 3,
                background: i === step ? s.color : "var(--c-bd-3)",
                transition: "all 0.25s",
              }} />
            ))}
          </div>

          {/* 아이콘 */}
          <div style={{ fontSize: 52, marginBottom: 18, lineHeight: 1 }}>{s.icon}</div>

          {/* 제목 */}
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", marginBottom: 12, lineHeight: 1.3 }}>
            {s.title}
          </div>

          {/* 설명 */}
          <div style={{ fontSize: 13, color: "var(--c-tx-50)", lineHeight: 1.7, marginBottom: 28, whiteSpace: "pre-line" }}>
            {s.desc}
          </div>

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  padding: "11px 20px", borderRadius: 10,
                  border: "1px solid var(--c-bd-2)", background: "transparent",
                  color: "var(--c-tx-50)", fontSize: 13, cursor: "pointer",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                이전
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep(step + 1)}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: 10,
                border: "none", background: s.color,
                color: "#0c0c1c", fontSize: 14, fontWeight: 800,
                cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
                boxShadow: `0 4px 20px ${s.color}40`,
              }}
            >
              {isLast ? "Stage 1 시작하기 →" : "다음"}
            </button>
          </div>

          {!isLast && (
            <button
              onClick={dismiss}
              style={{
                marginTop: 14, background: "none", border: "none",
                color: "var(--c-tx-30)", fontSize: 11, cursor: "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
