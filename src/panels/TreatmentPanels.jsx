import { useState } from "react";

export function DialogueDevPanel({ data, isMobile }) {
  return (
    <div>
      {data.character_voices?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, textTransform: "uppercase" }}>인물별 목소리 설계</div>
          {data.character_voices.map((v, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FB923C", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 8 }}>{v.character}</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
                {[
                  { l: "말투 패턴", v: v.speech_pattern },
                  { l: "어휘 수준", v: v.vocabulary_level },
                  { l: "절대 직접 말 안 하는 것", v: v.what_they_never_say },
                  { l: "말버릇", v: v.verbal_tic },
                ].map(({ l, v: val }) => val && (
                  <div key={l} style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.02)" }}>
                    <div style={{ fontSize: 9, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 11, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
                  </div>
                ))}
              </div>
              {v.sample_line && (
                <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 7, background: "var(--c-card-3)", border: "1px solid rgba(251,146,60,0.15)" }}>
                  <div style={{ fontSize: 9, color: "rgba(251,146,60,0.5)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>SAMPLE LINE</div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-75)", fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>"{v.sample_line}"</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.key_scene_dialogue && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>핵심 씬 대사 초안</div>
          <div style={{ padding: "14px", borderRadius: 10, border: "1px solid rgba(69,183,209,0.2)", background: "var(--c-card-3)" }}>
            <div style={{ fontSize: 11, color: "rgba(69,183,209,0.7)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 10 }}>{data.key_scene_dialogue.scene_context}</div>
            <pre style={{ fontSize: 12, color: "var(--c-tx-75)", fontFamily: "'Noto Sans KR', monospace", lineHeight: 1.85, whiteSpace: "pre-wrap", margin: 0 }}>{data.key_scene_dialogue.dialogue_draft}</pre>
            {data.key_scene_dialogue.subtext_note && (
              <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: "rgba(69,183,209,0.07)", border: "1px solid rgba(69,183,209,0.15)", fontSize: 11, color: "rgba(69,183,209,0.8)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                💬 하위텍스트: {data.key_scene_dialogue.subtext_note}
              </div>
            )}
          </div>
        </div>
      )}
      {data.subtext_techniques?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>하위텍스트 기법</div>
          {data.subtext_techniques.map((t, i) => (
            <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.02)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#45B7D1", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>{t.technique}</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>{t.when_to_use}</div>
              {t.example && <div style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 3, fontStyle: "italic" }}>예: {t.example}</div>}
            </div>
          ))}
        </div>
      )}
      {[
        { label: "피해야 할 대사 실수", val: data.dialogue_pitfalls?.join(" / "), c: "#E85D75" },
        { label: "목소리 일관성 유지 방법", val: data.voice_consistency_tips, c: "#4ECCA3" },
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
// 캐릭터 디벨롭 결과 패널
// ─────────────────────────────────────────────
export function TreatmentInputPanel({ chars, onCharsChange, structure, onStructureChange, onGenerate, loading, isMobile, charDevResult }) {
  const proto = chars.protagonist;

  const setProto = (field, val) =>
    onCharsChange({ ...chars, protagonist: { ...proto, [field]: val } });

  const setSupporting = (idx, field, val) => {
    const updated = chars.supporting.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    onCharsChange({ ...chars, supporting: updated });
  };

  const addSupporting = () =>
    onCharsChange({ ...chars, supporting: [...chars.supporting, { name: "", role: "", relation: "" }] });

  const removeSupporting = (idx) =>
    onCharsChange({ ...chars, supporting: chars.supporting.filter((_, i) => i !== idx) });

  const structures = [
    { id: "3act", label: "3막 구조", sub: "Field (1982)" },
    { id: "hero", label: "영웅의 여정", sub: "Campbell (1949)" },
    { id: "4act", label: "4막 구조", sub: "Parker (2005)" },
    { id: "miniseries", label: "화별 구조", sub: "미니시리즈" },
    { id: "tvdrama", label: "TV 드라마 감정곡선", sub: "한국식 감정 아크" },
    { id: "webdrama", label: "웹드라마 훅 구조", sub: "화별 훅 + 클리프행어" },
  ];

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)",
    color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
    outline: "none",
  };
  const labelStyle = { fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, display: "block", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 0.5 };

  return (
    <div style={{ padding: "20px", borderRadius: 12, border: "1px solid rgba(251,191,36,0.15)", background: "rgba(251,191,36,0.02)" }}>

      {/* 서사 구조 선택 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>서사 구조</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7 }}>
          {structures.map((s) => (
            <button key={s.id} onClick={() => onStructureChange(s.id)} style={{
              padding: "9px 12px", borderRadius: 9, textAlign: "left",
              border: structure === s.id ? "1px solid rgba(251,191,36,0.5)" : "1px solid var(--c-bd-2)",
              background: structure === s.id ? "rgba(251,191,36,0.1)" : "rgba(var(--tw),0.02)",
              color: structure === s.id ? "#FBBf24" : "var(--c-tx-45)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}>{s.label}</div>
              <div style={{ fontSize: 10, color: structure === s.id ? "rgba(251,191,36,0.6)" : "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{s.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 인물 정보: Stage 3 캐릭터 분석 결과가 있으면 자동 반영 카드, 없으면 직접 입력 폼 */}
      {charDevResult?.protagonist ? (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>인물 정보</div>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--c-card-1)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 10, color: "var(--c-tx-28)", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
              ✓ 캐릭터 분석(3단계) 결과 자동 반영
            </div>
            {/* 주인공 요약 */}
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{charDevResult.protagonist.name_suggestion || "주인공"}</span>
              {charDevResult.protagonist.egri_dimensions?.sociological && (
                <span style={{ fontSize: 11, color: "rgba(var(--tw),0.38)", marginLeft: 8 }}>
                  {charDevResult.protagonist.egri_dimensions.sociological.slice(0, 50)}{charDevResult.protagonist.egri_dimensions.sociological.length > 50 ? "…" : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: charDevResult.supporting_characters?.length ? 10 : 0 }}>
              {charDevResult.protagonist.want && (
                <span style={{ fontSize: 10, color: "var(--c-tx-50)", background: "var(--c-card-3)", padding: "3px 8px", borderRadius: 6 }}>
                  Want: {charDevResult.protagonist.want}
                </span>
              )}
              {charDevResult.protagonist.need && (
                <span style={{ fontSize: 10, color: "var(--c-tx-50)", background: "var(--c-card-3)", padding: "3px 8px", borderRadius: 6 }}>
                  Need: {charDevResult.protagonist.need}
                </span>
              )}
              {charDevResult.protagonist.ghost && (
                <span style={{ fontSize: 10, color: "var(--c-tx-50)", background: "var(--c-card-3)", padding: "3px 8px", borderRadius: 6 }}>
                  Ghost: {charDevResult.protagonist.ghost.slice(0, 30)}{charDevResult.protagonist.ghost.length > 30 ? "…" : ""}
                </span>
              )}
            </div>
            {/* 주요 인물 */}
            {charDevResult.supporting_characters?.filter((s) => s.suggested_name || s.role_name).length > 0 && (
              <div style={{ borderTop: "1px solid var(--c-bd-1)", paddingTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {charDevResult.supporting_characters.filter((s) => s.suggested_name || s.role_name).slice(0, 5).map((s, i) => (
                  <span key={i} style={{ fontSize: 10, color: "rgba(var(--tw),0.38)", background: "var(--c-card-2)", padding: "2px 8px", borderRadius: 10, border: "1px solid var(--c-bd-1)" }}>
                    {s.suggested_name || ""}{s.role_name ? ` (${s.role_name})` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 18, padding: "14px 16px", borderRadius: 10, background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>👤</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-tx-60)", marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>캐릭터 분석 결과가 없습니다</div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
              3단계 캐릭터에서 분석을 먼저 실행하면 인물 정보가 자동으로 반영됩니다.
            </div>
          </div>
        </div>
      )}

      {/* 생성 버튼 */}
      <button
        onClick={onGenerate}
        disabled={loading}
        style={{
          width: "100%", padding: "13px", borderRadius: 10,
          border: "none", cursor: loading ? "wait" : "pointer",
          background: loading ? "rgba(251,191,36,0.15)" : "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.12))",
          color: "#FBBf24", fontSize: 14, fontWeight: 700,
          fontFamily: "'Noto Sans KR', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
        }}
      >
        {loading ? (
          <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(251,191,36,0.3)", borderTop: "2px solid #FBBf24", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />트리트먼트 생성 중...</>
        ) : (
          <>📋 트리트먼트 생성</>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 구조 분석 패널 (Structure Analysis)
// ─────────────────────────────────────────────
