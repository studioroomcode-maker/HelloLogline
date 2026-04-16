import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, SvgIcon, ICON, Spinner, FeedbackBox } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import { CharacterDevPanel, ShadowAnalysisPanel, AuthenticityPanel } from "../panels/CharacterPanels.jsx";

/* ─── MBTI 데이터 & 말풍선 입력 컴포넌트 ─── */
const MBTI_INFO = {
  INTJ: { emoji: "🏰", nickname: "전략가", desc: "독립적이고 냉철한 설계자. 장기 계획을 즐기며, 비효율을 혐오한다. 감정보다 논리로 움직인다." },
  INTP: { emoji: "🔬", nickname: "논리술사", desc: "조용한 분석가. 이론과 원리에 집착하며 끝없이 질문한다. 규칙보다 진실을 따른다." },
  ENTJ: { emoji: "👑", nickname: "통솔자", desc: "타고난 리더. 목표를 향해 거침없이 달리며 다른 사람을 이끈다. 도전을 즐긴다." },
  ENTP: { emoji: "⚡", nickname: "변론가", desc: "아이디어 발전기. 논쟁을 즐기고 고정관념을 깨기 좋아한다. 지루함을 못 참는다." },
  INFJ: { emoji: "🌙", nickname: "옹호자", desc: "깊은 통찰력을 지닌 이상주의자. 타인의 감정을 직감적으로 읽는다. 혼자만의 시간이 필요하다." },
  INFP: { emoji: "🌿", nickname: "중재자", desc: "내면 세계가 풍부한 몽상가. 자신의 가치관에 강한 신념을 품는다. 공감 능력이 뛰어나다." },
  ENFJ: { emoji: "🌟", nickname: "선도자", desc: "카리스마 넘치는 조력자. 다른 사람의 성장을 위해 헌신한다. 갈등 조율에 능하다." },
  ENFP: { emoji: "🎨", nickname: "활동가", desc: "에너지 넘치는 자유로운 영혼. 새로운 가능성에 열광하며 사람들을 북돋운다. 루틴을 싫어한다." },
  ISTJ: { emoji: "📋", nickname: "현실주의자", desc: "철두철미한 관리자. 규칙과 책임을 중시하며 약속을 반드시 지킨다. 변화를 불편해한다." },
  ISFJ: { emoji: "🛡", nickname: "수호자", desc: "헌신적인 보호자. 가까운 사람들을 위해 묵묵히 희생한다. 갈등을 피하려는 경향이 있다." },
  ESTJ: { emoji: "⚖️", nickname: "경영자", desc: "질서와 원칙의 수호자. 체계적으로 일을 처리하며 주도권을 쥐려 한다. 직설적이다." },
  ESFJ: { emoji: "🤝", nickname: "집정관", desc: "사교적인 돌봄 제공자. 주변 사람의 감정과 필요에 민감하게 반응한다. 인정받고 싶어한다." },
  ISTP: { emoji: "🔧", nickname: "장인", desc: "조용한 문제 해결사. 실용적이고 손으로 직접 해결하는 것을 선호한다. 감정 표현이 적다." },
  ISFP: { emoji: "🎶", nickname: "모험가", desc: "온화하고 감각적인 예술가. 아름다움과 조화를 추구하며 자유롭게 살고 싶어한다." },
  ESTP: { emoji: "🏄", nickname: "사업가", desc: "대담하고 현실 감각이 뛰어난 행동파. 순간에 집중하며 위험을 즐긴다. 지루함과 이론을 싫어한다." },
  ESFP: { emoji: "🎉", nickname: "연예인", desc: "삶을 축제로 만드는 엔터테이너. 사람과 어울리는 것을 좋아하며 즉흥적이다. 현재에 충실하다." },
};

function MbtiInput({ value, onChange }) {
  const info = MBTI_INFO[value];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase().slice(0, 4))}
        placeholder="예: INFJ"
        maxLength={4}
        style={{
          width: 90, padding: "9px 12px", borderRadius: 8, flexShrink: 0,
          border: `1px solid ${info ? "rgba(200,168,75,0.5)" : "var(--c-bd-3)"}`,
          background: info ? "rgba(200,168,75,0.06)" : "var(--bg-page)",
          color: "var(--text-main)", fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          outline: "none", boxSizing: "border-box", letterSpacing: 2,
          transition: "border-color 0.2s, background 0.2s",
        }}
      />
      {info && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{info.emoji}</span>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#C8A84B", fontFamily: "'Noto Sans KR', sans-serif" }}>{info.nickname}</span>
            <div style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.55, fontFamily: "'Noto Sans KR', sans-serif", wordBreak: "keep-all", marginTop: 1 }}>
              {info.desc}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Stage3Content({
  result,
  charGuide, setCharGuide, charGuideLoading, charGuideError, generateCharGuide,
  showManualCharInput, setShowManualCharInput,
  treatmentChars, setTreatmentChars,
  shadowResult, setShadowResult, shadowLoading, shadowError, analyzeShadow,
  authenticityResult, setAuthenticityResult, authenticityLoading, authenticityError, analyzeAuthenticity,
  charDevResult, setCharDevResult, charDevLoading, charDevError, charDevFeedback, setCharDevFeedback,
  charDevRefineLoading, charDevHistory, setCharDevHistory, analyzeCharacterDev,
  charAllDone,
  editingCharacter, setEditingCharacter,
  charEditDraft, setCharEditDraft,
  writerEdits, clearWriterEdit, setWriterEdit,
  refineCharDev,
  undoHistory,
}) {
  const { logline, isMobile, cc, getStageStatus, advanceToStage, showToast, isDemoMode } = useLoglineCtx();

  return (
    <ErrorBoundary><div>

              {/* ── 단계 안내 ── */}
              <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 10, background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.15)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(251,146,60,0.9)", marginBottom: 8 }}>
                  🎭 이 단계에서 할 일
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { step: "1", label: "AI 캐릭터 가이드", desc: "로그라인 분석 기반으로 어디를 보완할지 먼저 파악하세요.", color: "#FB923C" },
                    { step: "2", label: "그림자 분석 + 진정성 지수", desc: "심리 구조와 내면 모순을 설계합니다. 선택사항이지만 깊이가 달라집니다.", color: "#A78BFA" },
                    { step: "3", label: "캐릭터 종합 개발", desc: "위 분석을 통합해 완성된 캐릭터 설계서를 생성합니다.", color: "#4ECCA3" },
                  ].map(item => (
                    <div key={item.step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono', monospace", minWidth: 16, marginTop: 1 }}>0{item.step}</span>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-65)" }}>{item.label}</span>
                        <span style={{ fontSize: 11, color: "var(--c-tx-40)", marginLeft: 6 }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── AI 캐릭터 개발 가이드 ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#FB923C", fontFamily: "'JetBrains Mono', monospace", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(251,146,60,0.25)", background: "rgba(251,146,60,0.08)" }}>STEP 1</span>
                <span style={{ fontSize: 10, color: "var(--c-tx-35)" }}>로그라인 기반 캐릭터 약점 파악</span>
              </div>
              {result && (
                <div style={{ marginBottom: 20 }}>
                  {!charGuide ? (
                    <button onClick={generateCharGuide} disabled={charGuideLoading} style={{ width: "100%", padding: "11px 16px", borderRadius: 10, border: "1px solid rgba(251,146,60,0.25)", background: "rgba(251,146,60,0.04)", color: charGuideLoading ? "var(--c-tx-35)" : "#FB923C", fontSize: 12, fontWeight: 600, cursor: charGuideLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.2s" }}>
                      {charGuideLoading ? <><Spinner size={12} color="#FB923C" /><span>분석 중...</span></> : <><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg><span>로그라인 분석 기반 캐릭터 개발 가이드 받기</span></>}
                    </button>
                  ) : (
                    <div style={{ borderRadius: 10, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.03)", overflow: "hidden" }}>
                      <div style={{ padding: "9px 14px", borderBottom: "1px solid rgba(251,146,60,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth={2} strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#FB923C" }}>AI 캐릭터 개발 가이드</span>
                          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(251,146,60,0.1)", color: "#FB923C", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3 }}>로그라인 분석 기반</span>
                        </div>
                        <button onClick={() => setCharGuide(null)} style={{ background: "none", border: "none", color: "var(--c-tx-30)", cursor: "pointer", fontSize: 13, padding: "2px 4px", lineHeight: 1 }}>✕</button>
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 10, padding: "8px 10px", borderRadius: 7, background: "rgba(251,146,60,0.06)", borderLeft: "2px solid rgba(251,146,60,0.35)", lineHeight: 1.6 }}>
                          {charGuide.weakness}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {(charGuide.points || []).map((p, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#FB923C", fontFamily: "'JetBrains Mono', monospace", minWidth: 18, marginTop: 1 }}>0{i + 1}</span>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-75)", marginBottom: 2 }}>{p.focus}</div>
                                <div style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.55 }}>{p.action}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {charGuideError && <div style={{ marginTop: 6, fontSize: 11, color: "#E85D75" }}>{charGuideError}</div>}
                </div>
              )}

              {/* ── 인물 직접 설정 ── */}
              <div style={{ marginBottom: 16, borderRadius: 12, border: "1px solid rgba(251,146,60,0.15)", background: "rgba(251,146,60,0.03)" }}>
                <button
                  onClick={() => setShowManualCharInput(v => !v)}
                  style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth={2} strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FB923C" }}>인물 직접 설정</div>
                    <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>
                      주인공·조연 이름·성격을 직접 입력 — 캐릭터 종합 분석 및 트리트먼트·비트시트·시나리오에 자동 반영
                      {(treatmentChars.protagonist.name || treatmentChars.supporting.some(s => s.name)) && (
                        <span style={{ marginLeft: 8, fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(78,204,163,0.15)", color: "#4ECCA3", border: "1px solid rgba(78,204,163,0.25)", fontWeight: 600 }}>입력됨</span>
                      )}
                    </div>
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-30)" strokeWidth={2} strokeLinecap="round" style={{ transform: showManualCharInput ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {showManualCharInput && (
                  <div style={{ borderTop: "1px solid rgba(251,146,60,0.1)", padding: "16px 16px 20px" }}>
                    {/* 주인공 */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>주인공</div>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>이름</div>
                          <input
                            value={treatmentChars.protagonist.name}
                            onChange={e => setTreatmentChars(prev => ({ ...prev, protagonist: { ...prev.protagonist, name: e.target.value } }))}
                            placeholder="예: 이준호"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>역할 / 직업</div>
                          <input
                            value={treatmentChars.protagonist.role}
                            onChange={e => setTreatmentChars(prev => ({ ...prev, protagonist: { ...prev.protagonist, role: e.target.value } }))}
                            placeholder="예: 30대 형사"
                            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                        {[
                          { key: "want", label: "외적 목표 (Want)", placeholder: "무엇을 원하는가?" },
                          { key: "need", label: "내적 욕구 (Need)", placeholder: "진짜 필요한 것은?" },
                          { key: "flaw", label: "핵심 결함", placeholder: "가장 큰 약점은?" },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key}>
                            <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>{label}</div>
                            <input
                              value={treatmentChars.protagonist[key]}
                              onChange={e => setTreatmentChars(prev => ({ ...prev, protagonist: { ...prev.protagonist, [key]: e.target.value } }))}
                              placeholder={placeholder}
                              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", boxSizing: "border-box" }}
                            />
                          </div>
                        ))}
                      </div>
                      {/* MBTI */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>MBTI</div>
                        <MbtiInput
                          value={treatmentChars.protagonist.mbti}
                          onChange={val => setTreatmentChars(prev => ({ ...prev, protagonist: { ...prev.protagonist, mbti: val } }))}
                        />
                      </div>
                      {/* 추가 설명 */}
                      <div>
                        <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>추가 설명</div>
                        <textarea
                          value={treatmentChars.protagonist.description}
                          onChange={e => setTreatmentChars(prev => ({ ...prev, protagonist: { ...prev.protagonist, description: e.target.value } }))}
                          placeholder="외모, 말투, 성격, 배경 등 자유롭게 서술하세요"
                          rows={3}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }}
                        />
                      </div>
                    </div>
                    {/* 조연 */}
                    <div>
                      <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>조연 인물</div>
                      {treatmentChars.supporting.map((s, idx) => (
                        <div key={idx} style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--c-bd-2)", background: "var(--c-card-1)", position: "relative" }}>
                          {/* 삭제 버튼 */}
                          {treatmentChars.supporting.length > 1 && (
                            <button
                              onClick={() => setTreatmentChars(prev => ({ ...prev, supporting: prev.supporting.filter((_, i) => i !== idx) }))}
                              style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid rgba(232,93,117,0.25)", background: "rgba(232,93,117,0.06)", color: "#E85D75", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}
                            >✕</button>
                          )}
                          {/* 1행: 이름 / 역할 / 주인공과의 관계 */}
                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                            {[
                              { key: "name", label: "이름", placeholder: "예: 김민재" },
                              { key: "role", label: "역할", placeholder: "예: 조력자" },
                              { key: "relation", label: "주인공과의 관계", placeholder: "예: 파트너" },
                            ].map(({ key, label, placeholder }) => (
                              <div key={key}>
                                <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>{label}</div>
                                <input
                                  value={s[key]}
                                  onChange={e => {
                                    const updated = treatmentChars.supporting.map((sup, i) => i === idx ? { ...sup, [key]: e.target.value } : sup);
                                    setTreatmentChars(prev => ({ ...prev, supporting: updated }));
                                  }}
                                  placeholder={placeholder}
                                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", boxSizing: "border-box" }}
                                />
                              </div>
                            ))}
                          </div>
                          {/* 2행: MBTI */}
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>MBTI</div>
                            <MbtiInput
                              value={s.mbti}
                              onChange={val => {
                                const updated = treatmentChars.supporting.map((sup, i) => i === idx ? { ...sup, mbti: val } : sup);
                                setTreatmentChars(prev => ({ ...prev, supporting: updated }));
                              }}
                            />
                          </div>
                          {/* 3행: 추가 설명 */}
                          <div>
                            <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>추가 설명</div>
                            <textarea
                              value={s.description}
                              onChange={e => {
                                const updated = treatmentChars.supporting.map((sup, i) => i === idx ? { ...sup, description: e.target.value } : sup);
                                setTreatmentChars(prev => ({ ...prev, supporting: updated }));
                              }}
                              placeholder="외모, 말투, 성격, 배경 등 자유롭게 서술하세요"
                              rows={3}
                              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }}
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setTreatmentChars(prev => ({ ...prev, supporting: [...prev.supporting, { name: "", role: "", relation: "", mbti: "", description: "" }] }))}
                        style={{ marginTop: 4, padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(251,146,60,0.25)", background: "rgba(251,146,60,0.06)", color: "#FB923C", fontSize: 11, cursor: "pointer", fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}
                      >+ 인물 추가</button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── STEP 2: 심화 심리 분석 ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 16 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#A78BFA", fontFamily: "'JetBrains Mono', monospace", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(167,139,250,0.25)", background: "rgba(167,139,250,0.08)" }}>STEP 2</span>
                <span style={{ fontSize: 10, color: "var(--c-tx-35)" }}>선택 · 심화 심리 분석</span>
              </div>
              <ToolButton icon={<SvgIcon d={ICON.users} size={16} />} label="그림자 분석 + 진정성 지수" sub="Jung 그림자 원형 · Sartre 실존 진정성" done={!!(shadowResult || authenticityResult)} loading={shadowLoading || authenticityLoading} color="#A78BFA" onClick={async () => { await analyzeShadow(); await analyzeAuthenticity(); }} disabled={!logline.trim()}
                tooltip={"주인공의 심리 구조와 내면 모순을 분석합니다.\n\n• Jung — 영웅·그림자·아니마·페르소나 원형과 개성화 여정\n• Sartre — 실존적 진정성과 자기기만 구조"} />
              <ErrorMsg msg={shadowError || authenticityError} onRetry={shadowError ? analyzeShadow : authenticityError ? analyzeAuthenticity : undefined} />
              {(shadowLoading || authenticityLoading) && (
                <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "Jung 그림자", loading: shadowLoading, done: !!shadowResult },
                    { label: "실존 진정성", loading: authenticityLoading, done: !!authenticityResult },
                  ].map((item, i) => (
                    <span key={i} style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: item.done ? "#4ECCA3" : item.loading ? "#A78BFA" : "var(--c-tx-25)", display: "flex", alignItems: "center", gap: 4 }}>
                      {item.done ? "✓" : item.loading ? <Spinner size={9} color="#A78BFA" /> : "○"} {item.label}
                    </span>
                  ))}
                </div>
              )}

              {/* ── 심리 분석 결과: 심리 원형 & 그림자 / 실존적 진정성 ── */}
              {(shadowResult || authenticityResult) && (
                <ResultCard
                  title="심리 원형 & 그림자 / 실존적 진정성"
                  onClose={() => { setShadowResult(null); setAuthenticityResult(null); }}
                  color="rgba(167,139,250,0.15)"
                >
                  {shadowResult && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(167,139,250,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>심리 원형 &amp; 그림자 (Jung)</div>
                      <ErrorBoundary><ShadowAnalysisPanel data={shadowResult} isMobile={isMobile} /></ErrorBoundary>
                    </div>
                  )}
                  {shadowResult && authenticityResult && <div style={{ margin: "20px 0", height: 1, background: "var(--c-bd-1)" }} />}
                  {authenticityResult && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(167,139,250,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>실존적 진정성 (Sartre)</div>
                      <ErrorBoundary><AuthenticityPanel data={authenticityResult} isMobile={isMobile} /></ErrorBoundary>
                    </div>
                  )}
                </ResultCard>
              )}

              {/* ── STEP 3: 캐릭터 종합 개발 ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 16 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#4ECCA3", fontFamily: "'JetBrains Mono', monospace", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.08)" }}>STEP 3</span>
                <span style={{ fontSize: 10, color: "var(--c-tx-35)" }}>캐릭터 완성 · 종합 설계서 생성</span>
              </div>
              {(shadowResult || authenticityResult) && (
                <div style={{ marginBottom: 8, padding: "7px 12px", borderRadius: 8, background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.15)", fontSize: 11, color: "var(--c-tx-45)" }}>
                  ✓ 그림자 분석 / 진정성 결과가 자동으로 반영됩니다
                </div>
              )}
              <ToolButton icon={<SvgIcon d={ICON.users} size={16} />} label="캐릭터 종합 개발" sub="Egri·Truby — Want/Need/Ghost/Arc 3차원 설계" done={!!charDevResult} loading={charDevLoading} color="#4ECCA3" onClick={analyzeCharacterDev} disabled={!logline.trim()}
                tooltip={"위 분석을 통합해 완성된 캐릭터 설계서를 생성합니다.\n\n• Egri·Truby — 생리·사회·심리 3차원 인물 설계\n• Maslow — 욕구 위계(생존→안전→소속→존중→자아실현)\n• Vogler — 영웅의 여정 속 캐릭터 기능 역할"} />
              <ErrorMsg msg={charDevError} onRetry={charDevError ? analyzeCharacterDev : undefined} />
              {charDevLoading && (
                <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#4ECCA3", display: "flex", alignItems: "center", gap: 4 }}>
                    {charDevResult ? "✓" : <Spinner size={9} color="#4ECCA3" />} 캐릭터 디벨롭
                  </span>
                </div>
              )}

              {/* ── 3차원 인물 설계 결과 ── */}
              {charDevResult && (
                <ResultCard
                  title="3차원 인물 설계"
                  onClose={() => { setCharDevResult(null); setCharDevHistory([]); }}
                  onUndo={() => undoHistory(setCharDevHistory, setCharDevResult, charDevHistory)}
                  historyCount={charDevHistory.length}
                  color="rgba(78,204,163,0.15)"
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(78,204,163,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>3차원 인물 설계 (Egri · Truby · Hauge · Vogler · Maslow)</div>
                  <ErrorBoundary><CharacterDevPanel data={charDevResult} isMobile={isMobile} /></ErrorBoundary>

                  {/* ── 핵심 설정 편집 ── */}
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--c-bd-1)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingCharacter ? 14 : 0 }}>
                      <button
                        onClick={() => {
                          if (!editingCharacter) {
                            const p = charDevResult?.protagonist || {};
                            const ov = writerEdits.character || {};
                            setCharEditDraft({
                              name: ov.name ?? p.name_suggestion ?? "",
                              want: ov.want ?? p.want ?? "",
                              need: ov.need ?? p.need ?? "",
                              ghost: ov.ghost ?? p.ghost ?? "",
                              lie: ov.lie ?? p.lie_they_believe ?? "",
                              flaw: ov.flaw ?? p.flaw ?? "",
                              arc: ov.arc ?? p.arc_type ?? "",
                            });
                          }
                          setEditingCharacter(v => !v);
                        }}
                        style={{ fontSize: 12, color: editingCharacter ? "var(--c-tx-45)" : "#FB923C", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}
                      >
                        {editingCharacter ? "▲ 편집 닫기" : "✏ 핵심 설정 편집"}
                        {writerEdits.character && !editingCharacter && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(78,204,163,0.15)", color: "#4ECCA3", fontWeight: 600, border: "1px solid rgba(78,204,163,0.25)", marginLeft: 4 }}>수정됨</span>}
                      </button>
                      {writerEdits.character && !editingCharacter && (
                        <button onClick={() => clearWriterEdit("character")} style={{ fontSize: 10, color: "rgba(232,93,117,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>AI 원본으로</button>
                      )}
                    </div>
                    {editingCharacter && (
                      <div style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.15)", borderRadius: 10, padding: "14px 16px" }}>
                        {[
                          { key: "name", label: "이름/유형", placeholder: "예: 전직 형사 박민준" },
                          { key: "want", label: "외적 목표 (Want)", placeholder: "무엇을 얻으려 하는가?" },
                          { key: "need", label: "내적 욕구 (Need)", placeholder: "진짜로 필요한 것은?" },
                          { key: "ghost", label: "심리적 상처 (Ghost)", placeholder: "과거의 어떤 사건이 현재를 지배하는가?" },
                          { key: "lie", label: "믿는 거짓", placeholder: "스스로에 대해 어떤 거짓을 믿는가?" },
                          { key: "flaw", label: "핵심 결함", placeholder: "가장 큰 약점은?" },
                          { key: "arc", label: "변화 호 (Arc)", placeholder: "어떻게 변하는가?" },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, color: "rgba(251,146,60,0.7)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                            <textarea
                              value={charEditDraft[key] || ""}
                              onChange={e => setCharEditDraft(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={placeholder}
                              rows={key === "want" || key === "need" || key === "ghost" ? 2 : 1}
                              style={{ width: "100%", padding: "8px 12px", background: "rgba(var(--tw),0.04)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 8, color: "var(--text-main)", fontSize: 12, lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical", boxSizing: "border-box", outline: "none" }}
                            />
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                          {writerEdits.character && (
                            <button onClick={() => { clearWriterEdit("character"); setEditingCharacter(false); }}
                              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(232,93,117,0.3)", background: "rgba(232,93,117,0.06)", color: "#E85D75", fontSize: 11, cursor: "pointer" }}>
                              AI 원본으로
                            </button>
                          )}
                          <button onClick={() => setEditingCharacter(false)}
                            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-45)", fontSize: 11, cursor: "pointer" }}>
                            취소
                          </button>
                          <button
                            onClick={() => { setWriterEdit("character", charEditDraft); setEditingCharacter(false); }}
                            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.4)", background: "rgba(78,204,163,0.1)", color: "#4ECCA3", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            저장 — 시나리오에 반영
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <FeedbackBox value={charDevFeedback} onChange={setCharDevFeedback} onSubmit={refineCharDev} loading={charDevRefineLoading} placeholder="수정 요청을 입력하세요" />
                </ResultCard>
              )}
              {/* ── 캐릭터 → 스토리 교차 연결 힌트 ── */}
              {charDevResult && (
                <div style={{
                  marginTop: 20, padding: "14px 16px", borderRadius: 10,
                  background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.18)",
                }}>
                  <div style={{ fontSize: 10, letterSpacing: 1, color: "rgba(78,204,163,0.7)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                    Stage 4 연결 준비됨
                  </div>
                  <div style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.65, marginBottom: 10 }}>
                    {charDevResult.protagonist && (
                      <>
                        <strong style={{ color: "var(--c-tx-70)" }}>{charDevResult.protagonist.name_suggestion || "주인공"}</strong>
                        {charDevResult.protagonist.want && (
                          <span>의 외적 목표 <em style={{ color: "rgba(78,204,163,0.8)" }}>"{charDevResult.protagonist.want}"</em></span>
                        )}
                        {charDevResult.protagonist.need && (
                          <span>와 내적 욕구 <em style={{ color: "rgba(78,204,163,0.8)" }}>"{charDevResult.protagonist.need}"</em></span>
                        )}
                        가 시놉시스 구조에 자동 반영됩니다.
                      </>
                    )}
                    {!charDevResult.protagonist && "캐릭터 데이터가 시놉시스 파이프라인에 자동으로 반영됩니다."}
                  </div>
                  {charDevResult.supporting_characters?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                      {charDevResult.supporting_characters.slice(0, 4).map((c, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 20,
                          background: "rgba(78,204,163,0.08)", color: "rgba(78,204,163,0.7)",
                          border: "1px solid rgba(78,204,163,0.2)",
                        }}>
                          {c.character_name || c.name || `조연 ${i + 1}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

    </div></ErrorBoundary>
  );
}
