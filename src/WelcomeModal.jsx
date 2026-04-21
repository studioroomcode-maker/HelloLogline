import { useState, useEffect } from "react";
import { useLoglineCtx } from "./context/LoglineContext.jsx";

const STORAGE_KEY = "hll_welcomed_v2";

const EXAMPLE_LOGLINES = [
  { genre: "스릴러", text: "두 형사가 연쇄 살인마를 추적하는 과정에서 서로의 어두운 과거와 마주한다." },
  { genre: "드라마", text: "어머니의 치매가 심해지며 기억을 잃어가는 사이, 딸은 버려진 줄 알았던 가족의 비밀을 발견한다." },
  { genre: "SF", text: "2045년 기억 이식 기술이 상용화된 세계에서, 죽은 아내의 기억을 이식받은 남자가 자신이 살인자임을 깨닫는다." },
];

function IconWrite() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconPipeline() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

function IconStart() {
  return (
    <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}

/* 분석 결과 미리보기 미니 목업 */
function AnalysisPreview() {
  const bars = [
    { label: "주인공 욕망", score: 4, color: "#C8A84B" },
    { label: "갈등 구조",   score: 3, color: "#A78BFA" },
    { label: "독창성",      score: 5, color: "#4ECCA3" },
    { label: "상업성",      score: 3, color: "#60A5FA" },
  ];
  return (
    <div style={{
      margin: "0 0 20px",
      padding: "12px 14px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
        분석 결과 미리보기
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {bars.map(({ label, score, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "var(--c-tx-40)", width: 60, flexShrink: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ width: `${score / 5 * 100}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", width: 20, textAlign: "right" }}>{score}/5</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 9, color: "var(--c-tx-25)", textAlign: "right", fontFamily: "'Noto Sans KR', sans-serif" }}>
        + 개선안 · 전문가 패널 · 8단계 파이프라인
      </div>
    </div>
  );
}

const STEPS = [
  {
    Icon: IconWrite,
    title: "로그라인이란?",
    desc: "시나리오의 핵심을 한 문장으로 압축한 것입니다.\n'누가, 무엇을 원해서, 어떤 장애물과 싸우는가' — 이 한 줄이 모든 개발의 출발점입니다.",
    color: "#C8A84B",
  },
  {
    Icon: IconPipeline,
    title: "AI 분석 결과 미리보기",
    desc: "로그라인을 입력하면 18개 기준으로 즉시 점수화하고,\n8단계 파이프라인으로 시나리오 초고까지 개발합니다.",
    color: "#A78BFA",
    extra: <AnalysisPreview />,
  },
  {
    Icon: IconStart,
    title: "무료로 시작하기",
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

  // ESC로 닫기
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible]);

  function finish() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    advanceToStage?.("1");
  }

  function selectExample(example, autorun = false) {
    ctxSetLogline?.(example.text);
    ctxSetGenre?.(example.genre === "스릴러" ? "thriller" : example.genre === "드라마" ? "drama" : example.genre === "SF" ? "sf" : "auto");
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    advanceToStage?.("1");
    if (autorun) {
      // Stage1Content가 mount된 뒤 analyze()를 자동 실행
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent("hll:autorun-analyze")); } catch { /* noop */ }
      }, 400);
    }
  }

  function runInstantDemo() {
    selectExample(EXAMPLE_LOGLINES[0], true);
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
      role="presentation"
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Hello Loglines 환영 안내"
        style={{
          maxWidth: 400, width: "100%",
          padding: 2, borderRadius: 22,
          background: "var(--glass-nano)",
          border: "1px solid var(--glass-bd-nano)",
          boxShadow: "0 32px 96px rgba(0,0,0,0.55)",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
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
            <div style={{ color: s.color, marginBottom: 16, display: "flex", justifyContent: "center", opacity: 0.9 }}>
              <s.Icon />
            </div>

            {/* 제목 */}
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", marginBottom: 12, lineHeight: 1.3 }}>
              {s.title}
            </div>

            {/* 설명 */}
            <div style={{ fontSize: 13, color: "var(--c-tx-50)", lineHeight: 1.7, marginBottom: 16, whiteSpace: "pre-line" }}>
              {s.desc}
            </div>

            {/* 스텝별 추가 콘텐츠 */}
            {s.extra}

            {/* 마지막 스텝: 즉시 체험 CTA + 예시 로그라인 선택 */}
            {isLast && (
              <>
                <button
                  onClick={runInstantDemo}
                  aria-label="샘플 로그라인으로 지금 바로 분석 체험하기"
                  style={{
                    width: "100%", marginBottom: 14, padding: "14px 16px",
                    borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #4ECCA3, #60A5FA)",
                    color: "#0c0c1c", fontSize: 14, fontWeight: 800,
                    cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
                    boxShadow: "0 6px 28px rgba(78,204,163,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  샘플로 30초 안에 체험하기
                </button>
                <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginBottom: 10, textAlign: "center" }}>
                  또는 아래에서 직접 선택 ↓
                </div>
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
              </>
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
