import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

function VoiceCard({ card, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card);

  if (editing) {
    return (
      <div style={{
        padding: "14px 16px", borderRadius: 10, marginBottom: 10,
        background: "var(--glass-micro)", border: "1px solid rgba(167,139,250,0.4)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        <input
          value={draft.character_name || ""}
          onChange={e => setDraft(d => ({ ...d, character_name: e.target.value }))}
          placeholder="캐릭터 이름"
          style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
        />
        {[
          { k: "writer_signature", label: "★ 시그니처 (한 줄)" },
          { k: "tone", label: "톤 (반말/존댓말/혼용 + 일관성)" },
          { k: "sentence_length", label: "문장 길이" },
          { k: "swearing", label: "비속어 (없음/약함/강함)" },
          { k: "vocabulary_register", label: "어휘 결" },
        ].map(f => (
          <input
            key={f.k}
            value={draft[f.k] || ""}
            onChange={e => setDraft(d => ({ ...d, [f.k]: e.target.value }))}
            placeholder={f.label}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 11, marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
          />
        ))}
        {[
          { k: "frequent_words", label: "자주 쓰는 어휘 (쉼표 구분)" },
          { k: "forbidden_words", label: "절대 안 쓰는 단어 (쉼표 구분)" },
          { k: "speech_quirks", label: "말버릇 (쉼표 구분)" },
          { k: "do_say_examples", label: "이런 식으로 말함 (쉼표 구분)" },
          { k: "dont_say_examples", label: "이렇게는 안 말함 (쉼표 구분)" },
        ].map(f => (
          <input
            key={f.k}
            value={(draft[f.k] || []).join(", ")}
            onChange={e => setDraft(d => ({ ...d, [f.k]: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
            placeholder={f.label}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 11, marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
          />
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={() => { onUpdate(card.character_name, draft); setEditing(false); }} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 7, border: "none", background: "#A78BFA", color: "#fff", cursor: "pointer", fontWeight: 800 }}>저장</button>
          <button onClick={() => { setDraft(card); setEditing(false); }} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "transparent", color: "var(--c-tx-50)", cursor: "pointer", fontWeight: 700 }}>취소</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10, marginBottom: 10,
      background: "var(--glass-micro)", border: "1px solid var(--glass-bd-nano)",
      borderLeft: "3px solid #A78BFA",
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)" }}>{card.character_name}</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setEditing(true)} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "var(--glass-nano)", color: "var(--c-tx-50)", cursor: "pointer", fontWeight: 700 }}>편집</button>
          <button onClick={() => onDelete(card.character_name)} style={{ fontSize: 11, color: "var(--c-tx-30)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>×</button>
        </div>
      </div>
      {card.writer_signature && (
        <div style={{ marginBottom: 10, padding: "8px 10px", borderRadius: 7, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)", fontSize: 12, color: "var(--text-main)", lineHeight: 1.55 }}>
          <span style={{ color: "#C8A84B", fontWeight: 800, marginRight: 6 }}>★</span>
          {card.writer_signature}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 11, lineHeight: 1.55 }}>
        {[
          ["톤", card.tone],
          ["문장 길이", card.sentence_length],
          ["비속어", card.swearing],
          ["어휘 결", card.vocabulary_register],
          ["자주 쓰는 어휘", (card.frequent_words || []).join(", ")],
          ["절대 안 쓰는 단어", (card.forbidden_words || []).join(", ")],
          ["말버릇", (card.speech_quirks || []).join(" / ")],
          ["이런 식", (card.do_say_examples || []).map(e => `"${e}"`).join(" / ")],
          ["이렇게는 X", (card.dont_say_examples || []).map(e => `"${e}"`).join(" / ")],
        ].filter(([, v]) => v && v.length > 0).map(([label, value]) => (
          <>
            <div key={`l-${label}`} style={{ color: "var(--c-tx-30)", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</div>
            <div key={`v-${label}`} style={{ color: "var(--c-tx-65)" }}>{value}</div>
          </>
        ))}
      </div>
    </div>
  );
}

export default function VoiceCardsPanel({ onClose }) {
  const {
    characterVoiceCards, voiceCardLoadingFor, voiceCardError, apiKey,
    extractVoiceCard, updateVoiceCard, deleteVoiceCard,
    charDevResult,
  } = useLoglineCtx();

  const [draftName, setDraftName] = useState("");
  const [draftSample, setDraftSample] = useState("");

  const cards = Object.values(characterVoiceCards || {});

  // 등장인물 자동 후보 — Stage 3 캐릭터 분석에서.
  const characterSuggestions = (() => {
    const list = [];
    const p = charDevResult?.protagonist;
    if (p?.name_suggestion || p?.name) list.push(p.name_suggestion || p.name);
    (charDevResult?.supporting_characters || []).slice(0, 4).forEach(s => {
      const n = s.suggested_name || s.role_name || s.name;
      if (n) list.push(n);
    });
    return list.filter(n => !characterVoiceCards?.[n]);
  })();

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 399 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 400, width: "min(720px, 96vw)", maxHeight: "92vh",
        background: "var(--bg-surface)", border: "1px solid var(--c-bd-4)",
        borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎙</span>
              캐릭터 보이스 카드
            </div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 3, lineHeight: 1.55 }}>
              작가가 직접 쓴 한 캐릭터의 대사 샘플을 주면 AI가 그 *말투*를 추출합니다.
              이후 모든 대사 생성에 자동 주입돼 균질한 AI 보이스를 막습니다.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px" }}>
          {/* 카드 추가 폼 */}
          <div style={{
            padding: "12px 14px", borderRadius: 10, marginBottom: 16,
            background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-tx-50)", letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
              + 새 보이스 카드 만들기
            </div>
            <input
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              placeholder="캐릭터 이름"
              list="char-suggestions"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 12, marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
            />
            {characterSuggestions.length > 0 && (
              <datalist id="char-suggestions">
                {characterSuggestions.map(n => <option key={n} value={n} />)}
              </datalist>
            )}
            <textarea
              value={draftSample}
              onChange={e => setDraftSample(e.target.value)}
              placeholder={"이 캐릭터가 등장하는 5씬 정도의 대사 (작가가 직접 쓴 것). 예:\n\n민혁: 그게 제 영화에요? 진짜 제 게 맞나요?\n만수: ...국수, 식는다.\n민혁: 아저씨, 그거 제 콘티 아니에요?\n만수: 너 거 게 어딨노.\n..."}
              rows={6}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 11, lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical", boxSizing: "border-box", marginBottom: 8 }}
            />
            <button
              onClick={() => { if (draftName.trim() && draftSample.trim()) { extractVoiceCard(draftName.trim(), draftSample.trim()); setDraftName(""); setDraftSample(""); } }}
              disabled={!apiKey || !draftName.trim() || !draftSample.trim() || !!voiceCardLoadingFor}
              style={{
                fontSize: 11, padding: "7px 14px", borderRadius: 7,
                border: "none",
                background: apiKey && draftName.trim() && draftSample.trim() ? "linear-gradient(135deg, #A78BFA, #818CF8)" : "var(--c-bd-3)",
                color: apiKey && draftName.trim() && draftSample.trim() ? "#fff" : "var(--c-tx-30)",
                cursor: apiKey && draftName.trim() && draftSample.trim() && !voiceCardLoadingFor ? "pointer" : "not-allowed",
                fontWeight: 800, fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              {voiceCardLoadingFor ? `${voiceCardLoadingFor} 카드 추출 중…` : "🎙 보이스 카드 추출"}
            </button>
            {voiceCardError && (
              <div style={{ marginTop: 6, fontSize: 10, color: "#E85D75" }}>{voiceCardError}</div>
            )}
          </div>

          {/* 카드 리스트 */}
          {cards.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--c-tx-30)", fontSize: 12, lineHeight: 1.7 }}>
              아직 추출된 보이스 카드가 없습니다.
              <br />작가가 직접 쓴 대사 5씬 정도가 있으면 추출 정확도가 높아집니다.
            </div>
          ) : (
            cards.map(c => (
              <VoiceCard
                key={c.character_name}
                card={c}
                onUpdate={updateVoiceCard}
                onDelete={deleteVoiceCard}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
