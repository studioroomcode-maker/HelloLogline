/**
 * 스토리 닥터 — AI 자유 자문 패널
 * 3개 모드: 💬 자유 상담 / 🔍 전체 진단 / 🎬 씬 클리닉
 */
import { useState, useRef, useEffect } from "react";
import { callClaudeText } from "../utils.js";

// ── 퀵 칩 목록 ────────────────────────────────────
const QUICK_CHIPS = [
  { emoji: "👤", label: "캐릭터 동기가 약한 것 같아요" },
  { emoji: "⚡", label: "갈등이 너무 약해요" },
  { emoji: "🎬", label: "특정 씬이 어색해요" },
  { emoji: "🔚", label: "엔딩이 막혔어요" },
  { emoji: "🎯", label: "주제가 불분명해요" },
  { emoji: "💬", label: "대사가 어색해요" },
  { emoji: "⏱️", label: "페이스가 이상해요" },
  { emoji: "📐", label: "구조가 무너진 것 같아요" },
];

// ── 시스템 프롬프트 ──────────────────────────────
const buildChatSystem = (context) => `당신은 경험 많은 시나리오 닥터(Story Doctor)입니다. 작가가 막히거나 어색하다고 느끼는 부분에 날카로운 통찰과 실용적인 조언을 제공합니다.

핵심 원칙:
- 시나리오를 직접 고쳐쓰지 않고, 문제의 원인과 해결 방향을 제시합니다
- 작가가 스스로 선택할 수 있도록 2~3가지 구체적 방향을 제시합니다
- 솔직하게 — 좋은 것은 좋다, 약한 것은 약하다고 명확히 말합니다
- 가능하면 참고할 수 있는 영화/드라마 사례를 언급합니다
- 핵심부터 말하고, 필요한 경우에만 상세 설명을 추가합니다
- 한국어로 답변합니다

현재 작업 중인 작품:
${context}`;

const DIAGNOSTIC_SYSTEM = `당신은 시나리오 분석 전문가입니다. 제공된 작업물 전체를 검토하고 구조적·감정적 문제점과 개선점을 찾아내세요.

반드시 다음 형식으로만 답변하세요:

🔴 치명 문제 (지금 당장 고쳐야 할 것)
• 문제 설명 → 해결 방향

🟡 개선 권장 (더 좋아질 수 있는 것)
• 개선 포인트 → 구체적 방법

🟢 잘 된 부분 (유지해야 할 강점)
• 강점 설명

💡 지금 당장 집중할 것
한 문장으로 가장 중요한 다음 액션을 알려주세요.`;

const buildClinicSystem = (context) => `당신은 시나리오 닥터입니다. 작가가 붙여넣은 씬이나 문제 상황을 정밀 분석하고 구체적인 조언을 드립니다.

분석 항목:
1. 핵심 문제 (한 문장으로)
2. 왜 어색한지 — 구조적·감정적·대사적 원인
3. 해결 선택지 3가지 (각각 다른 방향)
4. 참고할 수 있는 유사 영화/드라마 사례

현재 작품 맥락:
${context}`;

// ─────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────
export default function StoryDoctorPanel({ apiKey, storyContext, onClose, isMobile, hasStory }) {
  const [tab, setTab] = useState("chat"); // "chat" | "diag" | "clinic"

  // ── 탭별 state ──
  const [chatMessages, setChatMessages] = useState([]); // { role, content }[]
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [diagResult, setDiagResult] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState("");

  const [clinicInput, setClinicInput] = useState("");
  const [clinicResult, setClinicResult] = useState(null);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [clinicError, setClinicError] = useState("");

  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (tab === "chat") chatInputRef.current?.focus();
  }, [tab]);

  // ── 자유 상담 ──────────────────────────────────
  const sendChat = async (text) => {
    const userText = (text || chatInput).trim();
    if (!userText || chatLoading || !apiKey) return;
    setChatInput("");
    const next = [...chatMessages, { role: "user", content: userText }];
    setChatMessages(next);
    setChatLoading(true);
    try {
      // 최근 6개 교환만 컨텍스트로 사용
      const history = next.slice(-12);
      const userMsg = history.map(m => `${m.role === "user" ? "작가" : "닥터"}: ${m.content}`).join("\n\n");
      const reply = await callClaudeText(
        apiKey,
        buildChatSystem(storyContext),
        userMsg,
        1500,
        "claude-sonnet-4-6"
      );
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "⚠ 오류가 발생했습니다. 다시 시도해주세요." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── 전체 진단 ──────────────────────────────────
  const runDiagnostic = async () => {
    if (diagLoading || !apiKey) return;
    setDiagLoading(true);
    setDiagError("");
    setDiagResult(null);
    try {
      const result = await callClaudeText(
        apiKey,
        DIAGNOSTIC_SYSTEM,
        `다음 작품을 전체 진단해주세요:\n\n${storyContext}`,
        1200,
        "claude-sonnet-4-6"
      );
      setDiagResult(result);
    } catch {
      setDiagError("진단 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setDiagLoading(false);
    }
  };

  // ── 씬 클리닉 ──────────────────────────────────
  const runClinic = async () => {
    if (!clinicInput.trim() || clinicLoading || !apiKey) return;
    setClinicLoading(true);
    setClinicError("");
    setClinicResult(null);
    try {
      const result = await callClaudeText(
        apiKey,
        buildClinicSystem(storyContext),
        `다음 씬/상황을 분석해주세요:\n\n${clinicInput.trim()}`,
        1500,
        "claude-sonnet-4-6"
      );
      setClinicResult(result);
    } catch {
      setClinicError("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setClinicLoading(false);
    }
  };

  const PANEL_W = isMobile ? "100vw" : 440;

  return (
    <>
      {/* 백드롭 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 599,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />

      {/* 패널 */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: PANEL_W, zIndex: 600,
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--c-bd-3)",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.35)",
        animation: "slideInRight 0.22s cubic-bezier(0.22,1,0.36,1)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>

        {/* ── 헤더 ── */}
        <div style={{
          padding: "14px 18px 12px",
          borderBottom: "1px solid var(--c-bd-2)",
          background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(78,204,163,0.06))",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "linear-gradient(135deg, #A78BFA, #4ECCA3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>🩺</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", letterSpacing: -0.3 }}>스토리 닥터</div>
                <div style={{ fontSize: 10, color: "var(--c-tx-35)" }}>막힌 곳, 어색한 곳 — 바로 물어보세요</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
            >×</button>
          </div>

          {/* 컨텍스트 인디케이터 */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {hasStory.logline && <CtxBadge label="로그라인" color="#C8A84B" />}
            {hasStory.char && <CtxBadge label="캐릭터" color="#FB923C" />}
            {hasStory.synopsis && <CtxBadge label="시놉시스" color="#4ECCA3" />}
            {hasStory.treatment && <CtxBadge label="트리트먼트" color="#60A5FA" />}
            {hasStory.beats && <CtxBadge label="비트시트" color="#FFD166" />}
            {hasStory.draft && <CtxBadge label="초고" color="#A78BFA" />}
            {hasStory.rewrite && <CtxBadge label="개고" color="#F472B6" />}
            {!hasStory.logline && <span style={{ fontSize: 10, color: "var(--c-tx-30)" }}>아직 작업된 내용이 없습니다</span>}
          </div>
        </div>

        {/* ── 탭 바 ── */}
        <div style={{
          display: "flex", borderBottom: "1px solid var(--c-bd-2)",
          background: "var(--bg-page)", flexShrink: 0,
        }}>
          {[
            { id: "chat", icon: "💬", label: "자유 상담" },
            { id: "diag", icon: "🔍", label: "전체 진단" },
            { id: "clinic", icon: "🎬", label: "씬 클리닉" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                background: "none",
                borderBottom: tab === t.id ? "2px solid #A78BFA" : "2px solid transparent",
                color: tab === t.id ? "#A78BFA" : "var(--c-tx-40)",
                fontSize: 11, fontWeight: tab === t.id ? 700 : 400,
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── 컨텐츠 영역 ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* ===== 자유 상담 ===== */}
          {tab === "chat" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* 메시지 영역 */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {chatMessages.length === 0 && (
                  <EmptyChat />
                )}
                {chatMessages.map((msg, i) => (
                  <ChatBubble key={i} role={msg.role} content={msg.content} />
                ))}
                {chatLoading && <TypingIndicator />}
                <div ref={chatEndRef} />
              </div>

              {/* 퀵 칩 */}
              {chatMessages.length === 0 && (
                <div style={{ padding: "0 14px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {QUICK_CHIPS.map(chip => (
                    <button
                      key={chip.label}
                      onClick={() => sendChat(chip.label)}
                      disabled={chatLoading}
                      style={{
                        padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                        border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)",
                        color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)"; e.currentTarget.style.color = "#A78BFA"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-bd-3)"; e.currentTarget.style.color = "var(--c-tx-50)"; }}
                    >
                      {chip.emoji} {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* 입력창 */}
              <div style={{
                padding: "10px 14px 14px", borderTop: "1px solid var(--c-bd-2)",
                flexShrink: 0, background: "var(--bg-surface)",
              }}>
                {!apiKey && (
                  <div style={{ fontSize: 11, color: "rgba(232,93,117,0.8)", marginBottom: 6, textAlign: "center" }}>
                    API 키가 필요합니다
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
                    }}
                    placeholder="막힌 부분이나 어색한 점을 자유롭게 물어보세요..."
                    rows={2}
                    disabled={chatLoading || !apiKey}
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 10, resize: "none",
                      border: "1px solid var(--c-bd-3)", background: "var(--c-card-2)",
                      color: "var(--text-main)", fontSize: 12, lineHeight: 1.6,
                      fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
                    }}
                  />
                  <button
                    onClick={() => sendChat()}
                    disabled={chatLoading || !chatInput.trim() || !apiKey}
                    style={{
                      width: 40, height: 40, borderRadius: 10, border: "none",
                      background: chatLoading || !chatInput.trim() || !apiKey
                        ? "rgba(167,139,250,0.2)"
                        : "linear-gradient(135deg, #A78BFA, #7C3AED)",
                      color: "#fff", cursor: chatLoading || !chatInput.trim() || !apiKey ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all 0.15s",
                    }}
                  >
                    {chatLoading ? (
                      <Spinner color="#A78BFA" />
                    ) : (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: "var(--c-tx-25)", marginTop: 5, textAlign: "right" }}>
                  Enter로 전송 · Shift+Enter 줄바꿈
                  {chatMessages.length > 0 && (
                    <button
                      onClick={() => setChatMessages([])}
                      style={{ marginLeft: 10, fontSize: 10, color: "var(--c-tx-30)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      대화 초기화
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== 전체 진단 ===== */}
          {tab === "diag" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {!diagResult && !diagLoading && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 }}>
                    전체 작업물 진단
                  </div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-45)", lineHeight: 1.7, marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
                    지금까지 완성된 로그라인·캐릭터·시놉시스·트리트먼트·비트시트·초고·개고를 한꺼번에 검토해서 치명 문제, 개선 포인트, 강점을 찾아냅니다.
                  </div>
                  {!hasStory.logline && (
                    <div style={{ fontSize: 11, color: "#F7A072", marginBottom: 16 }}>
                      ⚠ 로그라인부터 입력해야 진단할 수 있습니다
                    </div>
                  )}
                  <button
                    onClick={runDiagnostic}
                    disabled={!apiKey || !hasStory.logline}
                    style={{
                      padding: "12px 28px", borderRadius: 10, border: "none",
                      background: !apiKey || !hasStory.logline
                        ? "rgba(167,139,250,0.15)"
                        : "linear-gradient(135deg, #A78BFA, #4ECCA3)",
                      color: !apiKey || !hasStory.logline ? "var(--c-tx-35)" : "#0d0d1a",
                      fontSize: 13, fontWeight: 800,
                      cursor: !apiKey || !hasStory.logline ? "not-allowed" : "pointer",
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    지금 진단하기
                  </button>
                </div>
              )}

              {diagLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
                  <div style={{ width: 36, height: 36, border: "3px solid rgba(167,139,250,0.2)", borderTop: "3px solid #A78BFA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <div style={{ fontSize: 12, color: "var(--c-tx-45)" }}>전체 작업물을 분석하는 중...</div>
                </div>
              )}

              {diagError && (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.25)", color: "#E85D75", fontSize: 12 }}>
                  {diagError}
                </div>
              )}

              {diagResult && (
                <div>
                  <DiagnosticResult text={diagResult} />
                  <button
                    onClick={() => { setDiagResult(null); setDiagError(""); }}
                    style={{ marginTop: 14, fontSize: 11, padding: "6px 14px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-40)", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}
                  >
                    다시 진단
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== 씬 클리닉 ===== */}
          {tab === "clinic" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, color: "var(--c-tx-45)", lineHeight: 1.65 }}>
                어색하거나 막히는 씬을 붙여넣으세요. 현재 작품 맥락을 알고 있어서 더 정확한 조언을 드릴 수 있습니다.
              </div>
              <textarea
                value={clinicInput}
                onChange={e => setClinicInput(e.target.value)}
                placeholder={`씬 텍스트를 붙여넣거나, 문제 상황을 설명하세요.\n\n예: "3막 오프닝 씬인데, 주인공이 갑자기 마음을 바꾸는 게 너무 억지스러워요. 씬은 이렇게 써있어요: ——"`}
                rows={8}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 14px", borderRadius: 10, resize: "vertical",
                  border: "1px solid var(--c-bd-3)", background: "var(--c-card-2)",
                  color: "var(--text-main)", fontSize: 12, lineHeight: 1.7,
                  fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
                }}
              />
              <button
                onClick={runClinic}
                disabled={clinicLoading || !clinicInput.trim() || !apiKey}
                style={{
                  padding: "10px 0", borderRadius: 10, border: "none",
                  background: clinicLoading || !clinicInput.trim() || !apiKey
                    ? "rgba(78,204,163,0.12)"
                    : "linear-gradient(135deg, #4ECCA3, #45B7D1)",
                  color: clinicLoading || !clinicInput.trim() || !apiKey ? "var(--c-tx-35)" : "#0d0d1a",
                  fontSize: 12, fontWeight: 800,
                  cursor: clinicLoading || !clinicInput.trim() || !apiKey ? "not-allowed" : "pointer",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {clinicLoading ? <><Spinner color="#4ECCA3" /> 분석 중...</> : "이 씬 분석하기"}
              </button>

              {clinicError && (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.25)", color: "#E85D75", fontSize: 12 }}>
                  {clinicError}
                </div>
              )}

              {clinicResult && (
                <div style={{
                  padding: "14px 16px", borderRadius: 12,
                  background: "rgba(78,204,163,0.05)",
                  border: "1px solid rgba(78,204,163,0.2)",
                  fontSize: 13, color: "var(--c-tx-75)", lineHeight: 1.8,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4ECCA3", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    클리닉 결과
                  </div>
                  {clinicResult}
                </div>
              )}

              {clinicResult && (
                <button
                  onClick={() => { setClinicResult(null); setClinicInput(""); setClinicError(""); }}
                  style={{ fontSize: 11, padding: "6px 14px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-40)", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", alignSelf: "flex-start" }}
                >
                  다른 씬 분석
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes typing {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1;   }
        }
      `}</style>
    </>
  );
}

// ── 서브 컴포넌트 ────────────────────────────────

function CtxBadge({ label, color }) {
  return (
    <span style={{
      fontSize: 9, padding: "1px 7px", borderRadius: 10,
      background: `${color}18`, border: `1px solid ${color}40`,
      color, fontWeight: 700, letterSpacing: 0.3,
    }}>
      {label}
    </span>
  );
}

function EmptyChat() {
  return (
    <div style={{ textAlign: "center", padding: "24px 16px" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 6 }}>
        무엇이든 물어보세요
      </div>
      <div style={{ fontSize: 12, color: "var(--c-tx-40)", lineHeight: 1.7 }}>
        막힌 씬, 어색한 대사, 캐릭터 동기,<br />
        구조적 문제 — 시나리오 닥터가<br />
        수정 없이 방향을 잡아드립니다.
      </div>
    </div>
  );
}

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      gap: 8,
      alignItems: "flex-start",
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
          background: "linear-gradient(135deg, #A78BFA, #4ECCA3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}>🩺</div>
      )}
      <div style={{
        maxWidth: "82%",
        padding: "10px 14px",
        borderRadius: isUser ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
        background: isUser
          ? "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(124,58,237,0.15))"
          : "var(--c-card-2)",
        border: isUser
          ? "1px solid rgba(167,139,250,0.25)"
          : "1px solid var(--c-bd-2)",
        fontSize: 13,
        color: "var(--c-tx-75)",
        lineHeight: 1.75,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #A78BFA, #4ECCA3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🩺</div>
      <div style={{ padding: "10px 16px", borderRadius: "4px 14px 14px 14px", background: "var(--c-card-2)", border: "1px solid var(--c-bd-2)", display: "flex", gap: 4, alignItems: "center" }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#A78BFA", animation: `typing 1.2s ${delay}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );
}

function DiagnosticResult({ text }) {
  // 섹션별로 파싱해서 색상 표시
  const sections = [
    { emoji: "🔴", label: "치명 문제", color: "#E85D75", bg: "rgba(232,93,117,0.06)", border: "rgba(232,93,117,0.25)" },
    { emoji: "🟡", label: "개선 권장", color: "#F7A072", bg: "rgba(247,160,114,0.06)", border: "rgba(247,160,114,0.25)" },
    { emoji: "🟢", label: "잘 된 부분", color: "#4ECCA3", bg: "rgba(78,204,163,0.06)", border: "rgba(78,204,163,0.25)" },
    { emoji: "💡", label: "지금 당장 집중할 것", color: "#A78BFA", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.25)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sections.map(sec => {
        const idx = text.indexOf(sec.emoji);
        if (idx === -1) return null;
        const nextIdx = sections
          .map(s => text.indexOf(s.emoji, idx + 1))
          .filter(i => i > idx)
          .sort((a, b) => a - b)[0] ?? text.length;
        const content = text.slice(idx, nextIdx).replace(sec.emoji, "").trim();
        return (
          <div key={sec.emoji} style={{
            padding: "12px 14px", borderRadius: 10,
            background: sec.bg, border: `1px solid ${sec.border}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: sec.color, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              {sec.emoji} {sec.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {content.replace(new RegExp(`^${sec.label}`, ""), "").trim()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Spinner({ color = "#A78BFA" }) {
  return (
    <span style={{
      display: "inline-block", width: 13, height: 13,
      border: `2px solid ${color}44`, borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "spin 0.8s linear infinite",
    }} />
  );
}
