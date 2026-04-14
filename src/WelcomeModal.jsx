import { useState, useEffect } from "react";
import { useLoglineCtx } from "./context/LoglineContext.jsx";

const STORAGE_KEY = "hll_welcomed_v2";

const EXAMPLE_LOGLINES = [
  { genre: "스릴러", text: "두 형사가 연쇄 살인마를 추적하는 과정에서 서로의 어두운 과거와 마주한다." },
  { genre: "드라마", text: "어머니의 치매가 심해지며 기억을 잃어가는 사이, 딸은 버려진 줄 알았던 가족의 비밀을 발견한다." },
  { genre: "SF", text: "2045년 기억 이식 기술이 상용화된 세계에서, 죽은 아내의 기억을 이식받은 남자가 자신이 살인자임을 깨닫는다." },
];

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
    title: "지금 바로 시작하기",
    desc: "크레딧 10개가 지급됐습니다. 아래 예시를 선택하거나 직접 입력해보세요.",
    color: "#4ECCA3",
  },
];

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { advanceToStage, setLogline: ctxSetLogline, setGenre: ctxSetGenre } = useLoglineCtx?.() ?? {};

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    advanceToStage?.("1");
  }

  function selectExample(example) {
    ctxSetLogline?.(example.text);
    ctxSetGenre?.(example.genre === "스릴러" ? "thriller" : example.genre === "드라마" ? "drama" : example.genre === "SF" ? "sf" : "auto");
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
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "var(--blur-base)",
        WebkitBackdropFilter: "var(--blur-base)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={dismiss}
    >
      {/* Double-bezel outer shell */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 400, width: "100%",
          padding: 2, borderRadius: 22,
          background: "var(--glass-nano)",
          border: "1px solid var(--glass-bd-nano)",
          boxShadow: "0 32px 96px rgba(0,0,0,0.55)",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
      {/* Inner core */}
      <div style={{
        background: "var(--glass-modal)",
        border: "1px solid var(--glass-bd-base)",
        borderRadius: 20, overflow: "hidden",
        boxShadow: "inset 0 1px 0 var(--glass-bd-top)",
      }}>
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
          <div style={{ fontSize: 13, color: "var(--c-tx-50)", lineHeight: 1.7, marginBottom: isLast ? 16 : 28, whiteSpace: "pre-line" }}>
            {s.desc}
          </div>

          {/* 마지막 스텝: 예시 로그라인 선택 */}
          {isLast && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {EXAMPLE_LOGLINES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => selectExample(ex)}
                  style={{
                    textAlign: "left", padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(78,204,163,0.25)",
                    background: "rgba(78,204,163,0.06)",
                    color: "var(--text-main)", cursor: "pointer",
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(78,204,163,0.13)"; e.currentTarget.style.borderColor = "rgba(78,204,163,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(78,204,163,0.06)"; e.currentTarget.style.borderColor = "rgba(78,204,163,0.25)"; }}
                >
                  <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, marginBottom: 3, display: "block" }}>{ex.genre}</span>
                  <span style={{ fontSize: 12, lineHeight: 1.6 }}>{ex.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  padding: "11px 20px", borderRadius: 10,
                  border: "1px solid var(--glass-bd-base)", background: "var(--glass-nano)",
                  color: "var(--c-tx-55)", fontSize: 13, cursor: "pointer",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "all 0.18s var(--ease-spring)",
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
                boxShadow: `0 4px 20px ${s.color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                transition: "transform 0.18s var(--ease-spring), box-shadow 0.18s var(--ease-spring)",
              }}
            >
              {isLast ? "직접 입력하기 →" : "다음"}
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
    </div>
  );
}
