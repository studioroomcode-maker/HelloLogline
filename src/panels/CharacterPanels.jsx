import { useState } from "react";

export function AuthenticityPanel({ data, isMobile }) {
  const scoreColor = data.authenticity_score >= 75 ? "#4ECCA3"
    : data.authenticity_score >= 50 ? "#F7A072"
    : data.authenticity_score >= 25 ? "#E85D75"
    : "#888";

  const stageColor = { "심미적": "#F7A072", "윤리적": "#45B7D1", "종교적": "#a78bfa" };
  const absurdColor = { "반항": "#4ECCA3", "도피": "#E85D75", "수용": "#45B7D1" };

  const mf = data.mauvaise_foi || {};
  const gc = data.genuine_choice || {};
  const og = data.other_gaze || {};
  const abs = data.absurdity || {};
  const kk = data.kierkegaard_stage || {};
  const nz = data.nietzsche_connection || {};
  const ft = data.facticity || {};

  const stage = (kk.stage || "").split("(")[0].trim();
  const absResponse = (abs.response || "").split("(")[0].trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 진정성 점수 */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px", borderRadius: 12, border: `1px solid ${scoreColor}30`, background: `${scoreColor}06`, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: scoreColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {data.authenticity_score ?? "?"}
          </div>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>AUTHENTICITY</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: scoreColor, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 6 }}>
            {data.authenticity_label}
          </div>
          {/* 점수 바 */}
          <div style={{ height: 4, background: "var(--c-bd-1)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${data.authenticity_score ?? 0}%`, background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})`, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ fontSize: 9, color: "var(--c-tx-20)", fontFamily: "'JetBrains Mono', monospace" }}>자기기만</span>
            <span style={{ fontSize: 9, color: "var(--c-tx-20)", fontFamily: "'JetBrains Mono', monospace" }}>실존적 각성</span>
          </div>
        </div>
      </div>

      {/* 피투성 + 자기기만 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-3)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>FACTICITY — 피투성 (Heidegger)</div>
          <p style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", margin: "0 0 6px" }}>{ft.description}</p>
          {ft.response_to_facticity && (
            <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>반응 방식: {ft.response_to_facticity}</div>
          )}
        </div>
        <div style={{ padding: "14px", borderRadius: 10, background: mf.present ? "rgba(232,93,117,0.05)" : "rgba(78,204,163,0.05)", border: mf.present ? "1px solid rgba(232,93,117,0.2)" : "1px solid rgba(78,204,163,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: mf.present ? "#E85D75" : "#4ECCA3", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>MAUVAISE FOI (Sartre)</div>
            <span style={{ fontSize: 10, color: mf.present ? "#E85D75" : "#4ECCA3", fontWeight: 700 }}>{mf.present ? "감지됨" : "없음"}</span>
          </div>
          {mf.elements?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              {mf.elements.map((el, i) => (
                <div key={i} style={{ fontSize: 10, color: "rgba(232,93,117,0.7)", background: "rgba(232,93,117,0.08)", padding: "2px 7px", borderRadius: 5, marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>· {el}</div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{mf.description}</p>
        </div>
      </div>

      {/* 진정한 선택 */}
      <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>GENUINE CHOICE</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: gc.has_real_choice ? "#4ECCA3" : "#E85D75", background: gc.has_real_choice ? "rgba(78,204,163,0.12)" : "rgba(232,93,117,0.12)", padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {gc.has_real_choice ? "진짜 선택" : "선택 부재"}
          </span>
          {gc.responsibility_acknowledged !== undefined && (
            <span style={{ fontSize: 10, color: gc.responsibility_acknowledged ? "#4ECCA3" : "#E85D75", fontFamily: "'Noto Sans KR', sans-serif" }}>
              책임 인식 {gc.responsibility_acknowledged ? "✓" : "✗"}
            </span>
          )}
        </div>
        {gc.choice_description && (
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>{gc.choice_description}</div>
        )}
        <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{gc.description}</p>
      </div>

      {/* 타자의 시선 + 부조리 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {og.present && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>LE REGARD — 타자의 시선</div>
            {og.who && <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{og.who}</div>}
            {og.effect && <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{og.effect}</div>}
            <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{og.description}</p>
          </div>
        )}
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(247,160,114,0.04)", border: "1px solid rgba(247,160,114,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>ABSURDE — 부조리 (Camus)</div>
            {absResponse && (
              <span style={{ fontSize: 10, fontWeight: 700, color: absurdColor[absResponse] || "#aaa", background: `${absurdColor[absResponse] || "#aaa"}15`, padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{absResponse}</span>
            )}
          </div>
          {abs.absurd_condition && <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{abs.absurd_condition}</div>}
          {abs.sisyphus_moment && (
            <div style={{ fontSize: 10, color: "#F7A072", background: "rgba(247,160,114,0.08)", padding: "5px 8px", borderRadius: 6, marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
              시지프 순간: {abs.sisyphus_moment}
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{abs.description}</p>
        </div>
      </div>

      {/* 키르케고르 + 니체 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {kk.stage && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>KIERKEGAARD STAGE</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: stageColor[stage] || "#aaa", background: `${stageColor[stage] || "#aaa"}18`, padding: "3px 10px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{stage} 실존</span>
            <p style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: "8px 0 0" }}>{kk.description}</p>
          </div>
        )}
        {nz.will_to_power && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>NIETZSCHE — 의지·위버멘쉬</div>
            <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
              <span style={{ color: "var(--c-tx-25)" }}>의지: </span>{nz.will_to_power}
            </div>
            {nz.ubermensch_potential && (
              <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
                <span style={{ color: "var(--c-tx-25)" }}>위버멘쉬: </span>{nz.ubermensch_potential}
              </div>
            )}
            {nz.eternal_recurrence_test && (
              <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5, fontStyle: "italic" }}>영원회귀: {nz.eternal_recurrence_test}</div>
            )}
          </div>
        )}
      </div>

      {/* 사르트르 평결 + 팁 */}
      {data.sartre_verdict && (
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(247,160,114,0.05)", border: "1px solid rgba(247,160,114,0.2)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>SARTRE VERDICT</div>
          <p style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.sartre_verdict}</p>
        </div>
      )}
      {data.authenticity_tip && (
        <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>AUTHENTICITY TIP</div>
          <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.authenticity_tip}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 가치 전하 분석 컴포넌트 (McKee)
// ─────────────────────────────────────────────
export function ShadowAnalysisPanel({ data, isMobile }) {
  const archetypeColors = {
    "영웅": "#4ECCA3", "그림자": "#E85D75", "아니마": "#a78bfa",
    "아니무스": "#a78bfa", "자기": "#FFD166", "페르소나": "#45B7D1",
    "변환자": "#F7A072", "트릭스터": "#F7A072", "현자": "#95E1D3",
  };
  const integrationColor = { "높음": "#4ECCA3", "중간": "#F7A072", "낮음": "#E85D75" };

  const shadow = data.shadow || {};
  const hero = data.hero_archetype || {};
  const anima = data.anima_animus || {};
  const indiv = data.individuation_arc || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 영웅 원형 */}
      <div style={{ padding: "16px", borderRadius: 12, border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.04)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>HERO ARCHETYPE</div>
        <p style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: "0 0 10px" }}>{hero.description}</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {hero.wound && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(232,93,117,0.06)", border: "1px solid rgba(232,93,117,0.15)" }}>
              <div style={{ fontSize: 9, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>WOUND</div>
              <p style={{ fontSize: 11, color: "var(--c-tx-50)", margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{hero.wound}</p>
            </div>
          )}
          {hero.persona_gap && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(69,183,209,0.06)", border: "1px solid rgba(69,183,209,0.15)" }}>
              <div style={{ fontSize: 9, color: "#45B7D1", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>PERSONA GAP</div>
              <p style={{ fontSize: 11, color: "var(--c-tx-50)", margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{hero.persona_gap}</p>
            </div>
          )}
        </div>
      </div>

      {/* 그림자 */}
      <div style={{ padding: "16px", borderRadius: 12, border: "1px solid rgba(232,93,117,0.25)", background: "rgba(232,93,117,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>SHADOW ARCHETYPE</div>
          {shadow.integration_potential && (
            <span style={{ fontSize: 10, fontWeight: 700, color: integrationColor[shadow.integration_potential] || "#aaa", background: `${integrationColor[shadow.integration_potential] || "#aaa"}15`, padding: "2px 8px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>
              통합 가능성: {shadow.integration_potential}
            </span>
          )}
        </div>
        {shadow.who && (
          <div style={{ fontSize: 12, fontWeight: 600, color: "#E85D75", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{shadow.who}</div>
        )}
        {shadow.represents && (
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 8, padding: "6px 10px", background: "rgba(232,93,117,0.06)", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
            반영하는 억압된 자아: {shadow.represents}
          </div>
        )}
        <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{shadow.description}</p>
      </div>

      {/* 아니마/아니무스 + 기타 원형 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {anima.present && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>ANIMA / ANIMUS</div>
            {anima.who && <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", marginBottom: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{anima.who}</div>}
            <p style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{anima.description}</p>
          </div>
        )}
        {(data.other_archetypes || []).length > 0 && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>OTHER ARCHETYPES</div>
            {data.other_archetypes.map((a, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: archetypeColors[a.archetype] || "#aaa", background: `${archetypeColors[a.archetype] || "#aaa"}15`, padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.archetype}</span>
                {a.who && <span style={{ fontSize: 11, color: "var(--c-tx-40)", marginLeft: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.who}</span>}
                {a.description && <p style={{ fontSize: 10, color: "var(--c-tx-30)", margin: "2px 0 0", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 개성화 여정 */}
      {indiv.description && (
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,209,102,0.04)", border: "1px solid rgba(255,209,102,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#FFD166", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>INDIVIDUATION ARC</div>
            {indiv.stage && (
              <span style={{ fontSize: 10, color: "#FFD166", background: "rgba(255,209,102,0.12)", padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{indiv.stage}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{indiv.description}</p>
        </div>
      )}

      {/* 집단 무의식 연결 + 융 평결 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.collective_unconscious_connection && (
          <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(149,225,211,0.04)", border: "1px solid rgba(149,225,211,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#95E1D3", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>COLLECTIVE UNCONSCIOUS</div>
            <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.collective_unconscious_connection}</p>
          </div>
        )}
        {data.jung_verdict && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>JUNG VERDICT</div>
            <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.jung_verdict}</p>
          </div>
        )}
        {data.missing_archetype && (
          <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>MISSING ARCHETYPE</div>
            <p style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.missing_archetype}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 전문가 패널 결과 컴포넌트
// ─────────────────────────────────────────────
export function CharacterDevPanel({ data, isMobile }) {
  const [openSection, setOpenSection] = useState("protagonist");
  const proto = data.protagonist || {};
  const supporting = data.supporting_characters || [];
  const web = data.relationship_web || [];

  const Section = ({ id, title, color, children }) => {
    const open = openSection === id;
    return (
      <div style={{ marginBottom: 12, borderRadius: 12, border: `1px solid ${open ? color + "33" : "var(--c-bd-1)"}`, overflow: "hidden", transition: "all 0.2s" }}>
        <button onClick={() => setOpenSection(open ? null : id)} style={{ width: "100%", padding: "12px 16px", background: open ? `${color}0d` : "rgba(var(--tw),0.01)", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: open ? color : "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, fontWeight: 700 }}>
          {title}
          <span style={{ fontSize: 11, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
        </button>
        {open && <div style={{ padding: "4px 16px 16px" }}>{children}</div>}
      </div>
    );
  };

  const Field = ({ label, value, ref: _ref, color = "#FB923C" }) => {
    if (!value) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--c-tx-75)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", paddingLeft: 10, borderLeft: `2px solid ${color}44` }}>{value}</div>
      </div>
    );
  };

  const Tag = ({ text, color }) => (
    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, border: `1px solid ${color}40`, background: `${color}12`, color, fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", marginRight: 6, marginBottom: 4 }}>{text}</span>
  );

  return (
    <div>
      {/* 주인공 */}
      <Section id="protagonist" title={`주인공 — ${proto.name_suggestion || "분석 결과"}`} color="#FB923C">
        {/* 이름 + 아크 타입 */}
        <div style={{ marginBottom: 14 }}>
          <Tag text={proto.arc_type || "아크 미정"} color="#FB923C" />
          <Tag text={`매슬로: ${proto.maslow_level || "?"}`} color="#60A5FA" />
          <Tag text={proto.erikson_stage || "에릭슨 단계"} color="#A78BFA" />
        </div>

        {/* Egri 3차원 */}
        {proto.egri_dimensions && (
          <div style={{ marginBottom: 14, padding: "12px", borderRadius: 9, background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.12)" }}>
            <div style={{ fontSize: 10, color: "rgba(251,146,60,0.7)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, marginBottom: 8 }}>EGRI 3차원 (1946)</div>
            <Field label="생리적(Physiological)" value={proto.egri_dimensions.physiological} color="#FB923C" />
            <Field label="사회적(Sociological)" value={proto.egri_dimensions.sociological} color="#FB923C" />
            <Field label="심리적(Psychological)" value={proto.egri_dimensions.psychological} color="#FB923C" />
          </div>
        )}

        {/* Hauge Want/Need/Fear/Wound */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Want — 외적 목표 (Hauge)", val: proto.want, c: "#4ECCA3" },
            { label: "Need — 내적 욕구 (Hauge)", val: proto.need, c: "#A78BFA" },
            { label: "Wound — 상처 (Hauge)", val: proto.wound, c: "#E85D75" },
            { label: "Fear — 핵심 두려움 (Hauge)", val: proto.fear, c: "#F7A072" },
          ].map(({ label, val, c }) => val && (
            <div key={label} style={{ padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}20`, background: `${c}08` }}>
              <div style={{ fontSize: 10, color: `${c}99`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{val}</div>
            </div>
          ))}
        </div>

        <Field label="Ghost — 과거 트라우마 (Truby 2007)" value={proto.ghost} color="#95E1D3" />
        <Field label="믿는 거짓 — The Lie (Snyder 2005)" value={proto.lie_they_believe} color="#FFD166" />
        <Field label="배워야 할 진실 — Self-revelation (Truby 2007)" value={proto.truth_to_learn} color="#4ECCA3" />
        <Field label="Identity vs Essence (Hauge 1988)" value={proto.identity_vs_essence} color="#FB923C" />
        <Field label="슈퍼-오브젝티브 (Stanislavski 1936)" value={proto.super_objective} color="#45B7D1" />

        {/* Jung Shadow */}
        {proto.jungian_shadow && (
          <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(167,139,250,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>그림자(Shadow) — Jung (1969)</div>
            <div style={{ fontSize: 12, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{proto.jungian_shadow}</div>
          </div>
        )}

        <Field label="McKee 압박 테스트 — True Character (McKee 1997)" value={proto.true_character_test} color="#FFD166" />
        <Field label="캐릭터 아크 여정 (Seger 1990)" value={proto.arc_journey} color="#FB923C" />
        {proto.voice_hint && <Field label="말투·화법 힌트 (Stanislavski 1936)" value={proto.voice_hint} color="#45B7D1" />}
      </Section>

      {/* 주요 인물 */}
      {supporting.length > 0 && (
        <Section id="supporting" title="주요 인물" color="#60A5FA">
          {supporting.map((s, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < supporting.length - 1 ? "1px solid var(--c-card-3)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--tw),0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.suggested_name || s.role_name}</span>
                <Tag text={s.role_name} color="#60A5FA" />
                {s.vogler_archetype && <Tag text={s.vogler_archetype} color="#A3E635" />}
              </div>
              <Field label="서사적 기능" value={s.narrative_function} color="#60A5FA" />
              <Field label="주인공 반영/대조 (Mirror/Foil)" value={s.protagonist_mirror} color="#F472B6" />
              <Field label="관계 역학" value={s.relationship_dynamic} color="#60A5FA" />
            </div>
          ))}
        </Section>
      )}

      {/* 관계망 */}
      {web.length > 0 && (
        <Section id="web" title="관계망" color="#F472B6">
          {web.map((r, i) => (
            <div key={i} style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(244,114,182,0.12)", background: "rgba(244,114,182,0.04)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F472B6", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 6 }}>{r.pair}</div>
              {r.dynamic_type && <Tag text={r.dynamic_type} color="#F472B6" />}
              <div style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", marginTop: 6 }}>{r.dramatic_tension}</div>
            </div>
          ))}
        </Section>
      )}

      {/* 도덕적 논증 + 빠진 원형 + 팁 */}
      {(data.moral_argument || data.missing_archetype || data.character_development_tips?.length) && (
        <Section id="synthesis" title="종합 분석" color="#4ECCA3">
          <Field label="도덕적 논증 (Truby 2007: Moral Argument)" value={data.moral_argument} color="#4ECCA3" />
          {data.missing_archetype && <Field label="빠진 원형 (Vogler 1992)" value={data.missing_archetype} color="#FFD166" />}
          {data.character_development_tips?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>발전 제안</div>
              {data.character_development_tips.map((tip, i) => (
                <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(78,204,163,0.06)", border: "1px solid rgba(78,204,163,0.12)", fontSize: 12, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                  {i + 1}. {tip}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 트리트먼트 입력 패널
// ─────────────────────────────────────────────
