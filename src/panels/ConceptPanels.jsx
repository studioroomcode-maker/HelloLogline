import { useState } from "react";
import { PANEL_EXPERTS } from "../constants.js";

export function ExpertPanelSection({ data, isMobile }) {
  const [openRound, setOpenRound] = useState(2); // 0=모두접기, 1=R1, 2=R2, 3=종합

  const getExpert = (id) => PANEL_EXPERTS.find((e) => e.id === id) || { name: id, color: "#aaa", initial: "?" };

  const stanceLabel = { agree: "동의", extend: "보완", disagree: "반론" };
  const stanceColor = { agree: "#4ECCA3", extend: "#45B7D1", disagree: "#E85D75" };

  const Avatar = ({ expert, size = 32 }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${expert.color}22`,
      border: `1.5px solid ${expert.color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, overflow: "hidden",
      fontSize: size < 30 ? 9 : 11,
      fontWeight: 700, color: expert.color,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {expert.image ? (
        <img
          src={expert.image}
          alt={expert.name}
          style={{ width: "85%", height: "85%", objectFit: "contain" }}
          onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
        />
      ) : null}
      <span style={{ display: expert.image ? "none" : "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
        {expert.initial}
      </span>
    </div>
  );

  const SectionHeader = ({ num, label, isOpen, onToggle }) => (
    <button onClick={onToggle} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: 10,
      border: "1px solid var(--c-bd-2)",
      background: isOpen ? "var(--c-card-2)" : "rgba(var(--tw),0.02)",
      cursor: "pointer", marginBottom: isOpen ? 10 : 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace", background: "rgba(167,139,250,0.12)", padding: "2px 7px", borderRadius: 6 }}>
          {num}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: "var(--c-tx-30)" }}>{isOpen ? "▲" : "▼"}</span>
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* 패널 제목 */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>
          {data.panel_title}
        </div>
      </div>

      {/* 전문가 아바타 줄 */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", paddingBottom: 10, borderBottom: "1px solid var(--c-bd-1)" }}>
        {PANEL_EXPERTS.map((ex) => (
          <div key={ex.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Avatar expert={ex} size={36} />
            <span style={{ fontSize: 9, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>{ex.name}</span>
          </div>
        ))}
      </div>

      {/* ── 라운드 1 ── */}
      <div>
        <SectionHeader num="R1" label="초기 분석 — 각 전문가의 첫 번째 발언" isOpen={openRound === 1} onToggle={() => setOpenRound(openRound === 1 ? 0 : 1)} />
        {openRound === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(data.round1 || []).map((item, i) => {
              const ex = getExpert(item.expert_id);
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${ex.color}20`, background: `${ex.color}06` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Avatar expert={ex} size={26} />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.name}</span>
                      <span style={{ fontSize: 10, color: "var(--c-tx-30)", marginLeft: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.role}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
                    {item.statement}
                  </p>
                  {item.reference && (
                    <div style={{ marginTop: 8, fontSize: 10, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", borderLeft: `2px solid ${ex.color}40`, paddingLeft: 8 }}>
                      {item.reference}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 라운드 2 ── */}
      <div>
        <SectionHeader num="R2" label="상호 토론 — 동의·보완·반론" isOpen={openRound === 2} onToggle={() => setOpenRound(openRound === 2 ? 0 : 2)} />
        {openRound === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(data.round2 || []).map((item, i) => {
              const ex = getExpert(item.expert_id);
              const toEx = getExpert(item.responding_to);
              const sc = stanceColor[item.stance] || "#aaa";
              const sl = stanceLabel[item.stance] || item.stance;
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${ex.color}20`, background: `${ex.color}05` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <Avatar expert={ex} size={26} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.name}</span>
                    <span style={{ fontSize: 10, color: "var(--c-tx-25)", fontFamily: "'Noto Sans KR', sans-serif" }}>→</span>
                    <Avatar expert={toEx} size={22} />
                    <span style={{ fontSize: 10, color: "var(--c-tx-40)", fontFamily: "'Noto Sans KR', sans-serif" }}>{toEx.name}에게</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sc, background: `${sc}18`, padding: "2px 7px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{sl}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
                    {item.statement}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 종합 ── */}
      <div>
        <SectionHeader num="종합" label="합의 — 핵심 개선 방향" isOpen={openRound === 3} onToggle={() => setOpenRound(openRound === 3 ? 0 : 3)} />
        {openRound === 3 && (() => {
          // synthesis가 null이면 루트 레벨 flat 필드 fallback
          const synthesis = data.synthesis || (
            data.consensus || data.improvements || data.strongest_element || data.critical_gap ? {
              consensus: data.consensus || "",
              improvements: Array.isArray(data.improvements) ? data.improvements : [],
              strongest_element: data.strongest_element || "",
              critical_gap: data.critical_gap || "",
              philosophical_core: data.philosophical_core || "",
            } : null
          );
          return !synthesis ? (
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.12)", fontSize: 12, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif", textAlign: "center" }}>
              합의 데이터를 불러올 수 없습니다. 다시 분석해보세요.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* 합의점 */}
              {synthesis.consensus && (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>CONSENSUS</div>
                  <p style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{synthesis.consensus}</p>
                </div>
              )}
              {/* 개선 제안 */}
              {(synthesis.improvements || []).length > 0 && (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>IMPROVEMENTS</div>
                  {(synthesis.improvements || []).map((imp, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", background: "rgba(78,204,163,0.15)", padding: "1px 6px", borderRadius: 4, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{imp}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* 강점 / 보완 */}
              {(synthesis.strongest_element || synthesis.critical_gap) && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                  {synthesis.strongest_element && (
                    <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(69,183,209,0.05)", border: "1px solid rgba(69,183,209,0.18)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#45B7D1", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>STRONGEST ELEMENT</div>
                      <p style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{synthesis.strongest_element}</p>
                    </div>
                  )}
                  {synthesis.critical_gap && (
                    <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(232,93,117,0.05)", border: "1px solid rgba(232,93,117,0.18)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>CRITICAL GAP</div>
                      <p style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{synthesis.critical_gap}</p>
                    </div>
                  )}
                </div>
              )}
              {/* 철학적 핵심 */}
              {synthesis.philosophical_core && (
                <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(247,160,114,0.05)", border: "1px solid rgba(247,160,114,0.18)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>PHILOSOPHICAL CORE</div>
                  <p style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{synthesis.philosophical_core}</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 파이프라인 패널 (인터랙티브 서사 선택기)
// ─────────────────────────────────────────────
export function SubtextPanel({ data, isMobile }) {
  const scoreColor = data.subtext_score >= 70 ? "#4ECCA3" : data.subtext_score >= 40 ? "#FFD166" : "#E85D75";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{data.subtext_score}</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 2 }}>하위텍스트 지수</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.subtext_level}</div>
          <div style={{ fontSize: 12, color: "var(--c-tx-50)", marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.surface_story}</div>
          <div style={{ fontSize: 12, color: "#45B7D1", marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>→ {data.deeper_story}</div>
        </div>
      </div>
      {data.chekhovs_guns?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>체호프의 총</div>
          {data.chekhovs_guns.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: `1px solid ${g.is_loaded ? "rgba(78,204,163,0.2)" : "rgba(232,93,117,0.2)"}`, background: g.is_loaded ? "rgba(78,204,163,0.05)" : "rgba(232,93,117,0.05)" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{g.is_loaded ? "🔫" : "🚫"}</span>
              <div><div style={{ fontSize: 12, color: "var(--c-tx-75)", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>{g.element}</div><div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>{g.function}</div></div>
            </div>
          ))}
        </div>
      )}
      {data.unspoken_desires?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>말 vs 진짜 의도 (Stanislavski)</div>
          {data.unspoken_desires.map((u, i) => (
            <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(69,183,209,0.15)", background: "rgba(69,183,209,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#45B7D1", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{u.character}</div>
              <div style={{ fontSize: 12, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>말: {u.surface_want}</div>
              <div style={{ fontSize: 12, color: "var(--c-tx-75)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 3 }}>진짜: {u.real_need}</div>
            </div>
          ))}
        </div>
      )}
      {[
        { label: "침묵의 힘", val: data.silence_power, c: "#95E1D3" },
        { label: "브레히트 소외 효과", val: data.brecht_alienation, c: "#F7A072" },
        { label: "하위텍스트 약점 & 개선", val: data.subtext_weakness, c: "#E85D75" },
        { label: "체호프·스타니슬랍스키 총평", val: data.chekhov_verdict, c: "#45B7D1" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
      {data.dramatic_irony?.present && (
        <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,209,102,0.2)", background: "rgba(255,209,102,0.06)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,209,102,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>극적 아이러니</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.dramatic_irony.description}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 신화적 위치 매핑 패널
// ─────────────────────────────────────────────
export function MythMapPanel({ data, isMobile }) {
  return (
    <div>
      <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,209,102,0.2)", background: "rgba(255,209,102,0.06)" }}>
        <div style={{ fontSize: 10, color: "rgba(255,209,102,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>현재 단계 — Campbell Monomyth</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFD166", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.primary_stage}</div>
        {data.stages_covered?.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {data.stages_covered.map((s, i) => <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(255,209,102,0.12)", color: "rgba(255,209,102,0.8)", fontFamily: "'Noto Sans KR', sans-serif" }}>{s}</span>)}
          </div>
        )}
      </div>
      {data.journey_phases && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>3단계 여정</div>
          {[
            { label: "① 분리 (Departure)", val: data.journey_phases.departure, c: "#4ECCA3" },
            { label: "② 입문 (Initiation)", val: data.journey_phases.initiation, c: "#45B7D1" },
            { label: "③ 귀환 (Return)", val: data.journey_phases.return, c: "#A78BFA" },
          ].map(({ label, val, c }) => val && (
            <div key={label} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: `1px solid ${c}20`, background: `${c}07` }}>
              <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{val}</div>
            </div>
          ))}
        </div>
      )}
      {data.archetype_roles && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>원형 역할</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
            {Object.entries(data.archetype_roles).filter(([, v]) => v).map(([key, val]) => (
              <div key={key} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.02)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,209,102,0.6)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{key.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {[
        { label: "세계 신화 공명", val: data.universal_myth_parallel, c: "#FFD166" },
        { label: "신화의 기능", val: data.myth_function, c: "#F7A072" },
        { label: "빠진 여정 요소", val: data.missing_journey_element, c: "#E85D75" },
        { label: "캠벨 총평", val: data.campbell_verdict, c: "#FFD166" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 바르트 서사 코드 패널
// ─────────────────────────────────────────────
export function BarthesCodePanel({ data, isMobile }) {
  const codes = [
    { key: "hermeneutic_code", label: "해석적 코드", en: "Hermeneutic", color: "#A78BFA" },
    { key: "proairetic_code", label: "행동적 코드", en: "Proairetic", color: "#4ECCA3" },
    { key: "semic_code", label: "의미론적 코드", en: "Semic", color: "#45B7D1" },
    { key: "symbolic_code", label: "상징적 코드", en: "Symbolic", color: "#F7A072" },
    { key: "cultural_code", label: "문화적 코드", en: "Cultural", color: "#E85D75" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#95E1D3", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{data.total_activation}</div>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: 2 }}>총 활성화 점수</div>
        </div>
        <div style={{ flex: 1 }}>
          {codes.map(({ key, label, color }) => {
            const c = data[key]; if (!c) return null;
            const pct = (c.score / 20) * 100;
            return (
              <div key={key} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                  <span style={{ fontSize: 11, color, fontFamily: "'JetBrains Mono', monospace" }}>{c.score}/20</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {codes.map(({ key, label, en, color }) => {
          const c = data[key]; if (!c) return null;
          return (
            <div key={key} style={{ padding: "11px 12px", borderRadius: 10, border: `1px solid ${color}22`, background: `${color}07` }}>
              <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label} ({en})</div>
              <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{c.analysis}</div>
              {(c.binary_oppositions || c.information_gaps || c.key_connotations || c.cultural_references) && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(c.binary_oppositions || c.information_gaps || c.key_connotations || c.cultural_references || []).slice(0, 2).map((t, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${color}15`, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {[
        { label: "가장 강한 코드", val: data.dominant_code, c: "#4ECCA3" },
        { label: "가장 약한 코드 & 강화 방법", val: data.weakest_code, c: "#E85D75" },
        { label: "바르트 총평", val: data.barthes_verdict, c: "#95E1D3" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 한국 신화 공명 패널
// ─────────────────────────────────────────────
export function KoreanMythPanel({ data, isMobile }) {
  const aesthetics = [
    { key: "han_resonance", label: "한(恨)", color: "#E85D75", max: 25 },
    { key: "jeong_resonance", label: "정(情)", color: "#F472B6", max: 25 },
    { key: "sinmyeong_element", label: "신명(神明)", color: "#FFD166", max: 25 },
  ];
  const total = aesthetics.reduce((s, a) => s + (data[a.key]?.score || 0), 0);
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "var(--c-tx-40)", fontFamily: "'JetBrains Mono', monospace" }}>한·정·신명 공명 지수</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace" }}>{total}/75</span>
        </div>
        {aesthetics.map(({ key, label, color, max }) => {
          const d = data[key]; if (!d) return null;
          return (
            <div key={key} style={{ marginBottom: 12, padding: "11px 13px", borderRadius: 10, border: `1px solid ${color}22`, background: `${color}07` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <span style={{ fontSize: 12, color, fontFamily: "'JetBrains Mono', monospace" }}>{d.score}/{max}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", marginBottom: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(d.score / max) * 100}%`, background: color, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{d.analysis}</div>
            </div>
          );
        })}
      </div>
      {data.korean_archetypes?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>한국 원형 인물</div>
          {data.korean_archetypes.map((a, i) => (
            <div key={i} style={{ marginBottom: 7, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(232,93,117,0.15)", background: "rgba(232,93,117,0.04)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🎭</span>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#E85D75", fontFamily: "'Noto Sans KR', sans-serif" }}>{a.archetype}</span>
                <span style={{ fontSize: 11, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}> — {a.character}</span>
                {a.tradition && <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.tradition}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {[
        { label: "공명하는 한국 신화·설화", val: data.myth_parallel, c: "#E85D75" },
        { label: "무속 제의 구조", val: data.shamanic_structure, c: "#F7A072" },
        { label: "유교적 긴장", val: data.confucian_tension, c: "#60A5FA" },
        { label: "계승하는 현대 한국 영화", val: data.modern_korean_film, c: "#A3E635" },
        { label: "한국 신화·미학 총평", val: data.korean_myth_verdict, c: "#E85D75" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ScriptCoveragePanel / ValuationPanel — see panels/EvaluationPanels.jsx (lazy-loaded by logline-analyzer)

// ─────────────────────────────────────────────
// 대사 디벨롭 패널
// ─────────────────────────────────────────────
export function ThemeAnalysisPanel({ data, isMobile }) {
  const [openSection, setOpenSection] = useState("premise");

  if (!data) return null;

  const Section = ({ id, title, color, children }) => {
    const isOpen = openSection === id;
    return (
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setOpenSection(isOpen ? null : id)} style={{
          width: "100%", padding: "10px 14px", borderRadius: isOpen ? "10px 10px 0 0" : 10, cursor: "pointer",
          border: `1px solid ${color}${isOpen ? "40" : "20"}`,
          background: isOpen ? `${color}0a` : "rgba(var(--tw),0.02)",
          display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: isOpen ? color : "var(--c-tx-60)" }}>{title}</div>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)" }}>{isOpen ? "▲" : "▼"}</div>
        </button>
        {isOpen && (
          <div style={{ padding: "14px 16px", background: `${color}05`, border: `1px solid ${color}15`, borderTop: "none", borderRadius: "0 0 10px 10px" }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* Controlling Idea */}
      {data.controlling_idea && (
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(200,168,75,0.07)", border: "1px solid rgba(200,168,75,0.25)", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "rgba(200,168,75,0.7)", fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>컨트롤링 아이디어 (McKee)</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", lineHeight: 1.7 }}>{data.controlling_idea}</div>
        </div>
      )}

      <Section id="premise" title="도덕적 전제 (Egri)" color="#4ECCA3">
        {data.moral_premise && (
          <div>
            <div style={{ fontSize: 13, color: "rgba(var(--tw),0.8)", lineHeight: 1.7, marginBottom: 12, fontStyle: "italic" }}>"{data.moral_premise.statement}"</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "긍정하는 덕목", value: data.moral_premise.virtue, color: "#4ECCA3" },
                { label: "경고하는 결함", value: data.moral_premise.vice, color: "#E85D75" },
                { label: "덕목의 보상", value: data.moral_premise.consequence_positive, color: "#4ECCA3" },
                { label: "결함의 대가", value: data.moral_premise.consequence_negative, color: "#E85D75" },
              ].map((item) => (
                <div key={item.label} style={{ padding: "8px 10px", borderRadius: 8, background: `${item.color}06`, border: `1px solid ${item.color}15` }}>
                  <div style={{ fontSize: 9, color: `${item.color}90`, fontWeight: 700, marginBottom: 3, letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.5 }}>{item.value || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section id="question" title="테마 질문 & 진술" color="#45B7D1">
        {data.thematic_question && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "rgba(69,183,209,0.7)", fontWeight: 700, marginBottom: 4 }}>핵심 질문</div>
            <div style={{ fontSize: 13, color: "rgba(var(--tw),0.8)", lineHeight: 1.7, fontStyle: "italic" }}>"{data.thematic_question}"</div>
          </div>
        )}
        {data.theme_statement && (
          <div>
            <div style={{ fontSize: 10, color: "rgba(69,183,209,0.7)", fontWeight: 700, marginBottom: 4, marginTop: 10 }}>주제 진술</div>
            <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.7 }}>{data.theme_statement}</div>
          </div>
        )}
      </Section>

      <Section id="journey" title="주인공 내면 여정" color="#FB923C">
        {data.protagonist_inner_journey && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "핵심 결함", value: data.protagonist_inner_journey.starting_flaw, icon: "⚡" },
              { label: "잘못된 믿음", value: data.protagonist_inner_journey.false_belief, icon: "✗" },
              { label: "진짜 필요", value: data.protagonist_inner_journey.true_need, icon: "◎" },
              { label: "과거의 상처 (Ghost)", value: data.protagonist_inner_journey.ghost, icon: "👻" },
              { label: "변화", value: data.protagonist_inner_journey.transformation, icon: "→" },
              { label: "배움", value: data.protagonist_inner_journey.lesson, icon: "💡" },
            ].filter(item => item.value).map(item => (
              <div key={item.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, flexShrink: 0, width: 18, textAlign: "center" }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(251,146,60,0.7)", fontWeight: 700, marginBottom: 2, letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.6 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="arc" title="감정선 (Emotional Arc)" color="#C8A84B">
        {data.emotional_arc && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "1막 (시작)", value: data.emotional_arc.act1, color: "#4ECCA3" },
              { label: "미드포인트 전환", value: data.emotional_arc.midpoint, color: "#C8A84B" },
              { label: "어두운 밤 (최저점)", value: data.emotional_arc.dark_night, color: "#E85D75" },
              { label: "결말 카타르시스", value: data.emotional_arc.resolution, color: "#45B7D1" },
            ].filter(item => item.value).map((item, i) => (
              <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: `${item.color}06`, border: `1px solid ${item.color}18`, display: "flex", gap: 10 }}>
                <div style={{ width: 3, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, color: `${item.color}90`, fontWeight: 700, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.6 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="layers" title="이야기 레이어" color="#a78bfa">
        {data.thematic_layers && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.thematic_layers.map((layer, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)" }}>
                <div style={{ fontSize: 10, color: "rgba(167,139,250,0.8)", fontWeight: 700, marginBottom: 4 }}>{layer.layer}</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.6 }}>{layer.description}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Genre Conventions */}
      {data.genre_theme_conventions && (
        <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-40)", fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>장르 테마 컨벤션</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(78,204,163,0.7)", fontWeight: 700, marginBottom: 3 }}>관객 기대</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6 }}>{data.genre_theme_conventions.expected}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(200,168,75,0.7)", fontWeight: 700, marginBottom: 3 }}>이 작품의 접근</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6 }}>{data.genre_theme_conventions.subversion}</div>
            </div>
          </div>
        </div>
      )}

      {/* Weakness & Recommendation */}
      {(data.thematic_weakness || data.thematic_recommendation) && (
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {data.thematic_weakness && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.12)" }}>
              <div style={{ fontSize: 9, color: "#E85D75", fontWeight: 700, marginBottom: 4 }}>테마 약점</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6 }}>{data.thematic_weakness}</div>
            </div>
          )}
          {data.thematic_recommendation && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.12)" }}>
              <div style={{ fontSize: 9, color: "#4ECCA3", fontWeight: 700, marginBottom: 4 }}>강화 권고</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6 }}>{data.thematic_recommendation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 씬 리스트 패널 (Scene List / Step Outline)
// ─────────────────────────────────────────────
