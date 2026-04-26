import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

const PURPOSE_OPTIONS = ["정보", "갈등", "반전", "감정 전환", "복선 심기", "페이오프"];
const STATUS_META = {
  outline: { label: "아웃라인", color: "#9CA3AF" },
  drafted: { label: "초안", color: "#FB923C" },
  revised: { label: "수정 완료", color: "#4ECCA3" },
};

function SceneCard({ card, onUpdate, onDelete, onMoveUp, onMoveDown, onExpand, expanded, isStale }) {
  const [draft, setDraft] = useState(card);
  const [editing, setEditing] = useState(false);
  const status = STATUS_META[card.status] || STATUS_META.outline;

  const save = () => {
    onUpdate(card.id, draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(card);
    setEditing(false);
  };

  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12,
      background: "var(--glass-micro)",
      border: "1px solid var(--glass-bd-nano)",
      borderLeft: `3px solid ${status.color}`,
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
          background: `${status.color}14`, border: `1px solid ${status.color}40`,
          color: status.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>{status.label}</span>
        <span style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>
          #{card.order}
        </span>
        {card.beatId && (
          <span style={{ fontSize: 9, color: "var(--c-tx-35)" }}>
            · 비트 #{card.beatId}
          </span>
        )}
        {isStale && (
          <span style={{
            fontSize: 8, color: "#F7A072", fontWeight: 700,
            padding: "1px 5px", borderRadius: 5,
            border: "1px solid rgba(247,160,114,0.4)",
            background: "rgba(247,160,114,0.1)",
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3,
          }} title="비트시트가 변경됐습니다 — 위쪽 배너의 '메타만 병합' 또는 '덮어쓰기' 사용">stale</span>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onMoveUp} title="위로" style={{ fontSize: 11, color: "var(--c-tx-30)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>↑</button>
        <button onClick={onMoveDown} title="아래로" style={{ fontSize: 11, color: "var(--c-tx-30)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>↓</button>
        <button onClick={() => onDelete(card.id)} title="삭제" style={{ fontSize: 11, color: "var(--c-tx-30)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>×</button>
      </div>

      {/* Title + Location */}
      {editing ? (
        <>
          <input
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            placeholder="씬 제목"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 13, fontWeight: 700, marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
          />
          <input
            value={draft.location}
            onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
            placeholder="INT. 장소 - 시간"
            style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 11, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", boxSizing: "border-box" }}
          />
        </>
      ) : (
        <div onClick={onExpand} style={{ cursor: "pointer" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", marginBottom: 4, lineHeight: 1.4 }}>
            {card.title || "(제목 없음)"}
          </div>
          {card.location && (
            <div style={{ fontSize: 10, color: "var(--c-tx-45)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
              {card.location}
            </div>
          )}
        </div>
      )}

      {/* Expanded fields */}
      {(expanded || editing) && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 10px", fontSize: 11, marginTop: 4, marginBottom: 8 }}>
            {[
              { k: "characters", label: "등장인물", placeholder: "주인공, 조연 (쉼표 구분)", isArray: true },
              { k: "purpose", label: "기능", placeholder: "정보 / 갈등 / 반전 / 감정 전환", select: true },
              { k: "conflict", label: "갈등", placeholder: "씬 내부 핵심 갈등" },
              { k: "valueShift", label: "가치 변화", placeholder: "예: 희망 → 절망" },
              { k: "reveal", label: "폭로/질문", placeholder: "다음 씬으로 넘기는 질문" },
              { k: "subtext", label: "하위텍스트", placeholder: "한 줄로" },
            ].map(({ k, label, placeholder, isArray, select }) => (
              <>
                <div key={`l-${k}`} style={{ color: "var(--c-tx-35)", fontWeight: 700, paddingTop: editing ? 7 : 1 }}>{label}</div>
                {editing ? (
                  select ? (
                    <select
                      value={draft[k] || ""}
                      onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}
                    >
                      {PURPOSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      value={isArray ? (draft[k] || []).join(", ") : (draft[k] || "")}
                      onChange={e => setDraft(d => ({ ...d, [k]: isArray ? e.target.value.split(",").map(s => s.trim()).filter(Boolean) : e.target.value }))}
                      placeholder={placeholder}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box", minWidth: 0 }}
                    />
                  )
                ) : (
                  <div key={`v-${k}`} style={{ color: "var(--c-tx-65)", lineHeight: 1.55 }}>
                    {isArray
                      ? ((card[k] || []).length > 0 ? card[k].join(", ") : <span style={{ color: "var(--c-tx-25)" }}>—</span>)
                      : (card[k] || <span style={{ color: "var(--c-tx-25)" }}>—</span>)}
                  </div>
                )}
              </>
            ))}
          </div>

          {/* 상태 토글 */}
          {!editing && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => onUpdate(card.id, { status: key })}
                  style={{
                    fontSize: 10, padding: "3px 9px", borderRadius: 6,
                    border: card.status === key ? `1px solid ${meta.color}` : "1px solid var(--c-bd-2)",
                    background: card.status === key ? `${meta.color}14` : "transparent",
                    color: card.status === key ? meta.color : "var(--c-tx-40)",
                    cursor: "pointer", fontWeight: 700,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >{meta.label}</button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {editing ? (
          <>
            <button onClick={save} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 6, border: "none", background: "#C8A84B", color: "#0c0c1c", cursor: "pointer", fontWeight: 800 }}>저장</button>
            <button onClick={cancel} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 6, border: "1px solid var(--c-bd-2)", background: "transparent", color: "var(--c-tx-40)", cursor: "pointer", fontWeight: 700 }}>취소</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} style={{ fontSize: 10, padding: "5px 12px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "var(--glass-nano)", color: "var(--c-tx-50)", cursor: "pointer", fontWeight: 700 }}>편집</button>
        )}
      </div>
    </div>
  );
}

export default function SceneCardsPanel({ onClose }) {
  const {
    sceneCards, updateSceneCard, deleteSceneCard, reorderSceneCards,
    addSceneCard, seedSceneCardsFromBeatSheet, beatSheetResult,
    beatSheetStaleCardIds, clearBeatSheetStale, setSceneCards,
    charDevResult, showToast,
  } = useLoglineCtx();
  const [expandedId, setExpandedId] = useState(null);
  const staleCount = (beatSheetStaleCardIds || []).length;

  const reseedFromBeatSheet = (mode) => {
    // mode: "merge" — beatId가 같은 카드의 메타만 갱신, fountainText는 보존
    //       "overwrite" — beatId가 같은 카드를 새 메타로 완전 교체 (fountainText 비움)
    if (!beatSheetResult?.beats) return;
    import("../sceneCardsAdapters.js").then(({ sceneCardsFromBeatSheet }) => {
      const fresh = sceneCardsFromBeatSheet(beatSheetResult, charDevResult);
      setSceneCards(prev => {
        // 새 카드 우선으로 매칭, 없는 비트는 옛 카드 유지(작가가 직접 만든 것 보존)
        const byBeat = new Map();
        fresh.forEach(c => { if (c.beatId != null) byBeat.set(String(c.beatId), c); });
        const next = prev.map(old => {
          if (old.beatId == null) return old;
          const freshOne = byBeat.get(String(old.beatId));
          if (!freshOne) return old;
          if (mode === "overwrite") {
            return { ...freshOne, id: old.id, fountainText: "", status: "outline", createdAt: old.createdAt, updatedAt: Date.now() };
          }
          // merge: 메타만 갱신, 본문/상태/작가 편집 보존
          return {
            ...old,
            title: freshOne.title,
            location: old.location || freshOne.location,
            characters: old.characters?.length ? old.characters : freshOne.characters,
            purpose: freshOne.purpose,
            conflict: old.conflict || freshOne.conflict,
            valueShift: freshOne.valueShift,
            reveal: old.reveal || freshOne.reveal,
            updatedAt: Date.now(),
          };
        });
        return next;
      });
      clearBeatSheetStale?.();
      showToast?.("success", mode === "overwrite" ? "비트시트 기준으로 덮어썼습니다." : "비트시트 메타만 병합했습니다.");
    });
  };

  const sorted = [...(sceneCards || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const moveUp = (id) => {
    const idx = sorted.findIndex(c => c.id === id);
    if (idx <= 0) return;
    const next = [...sorted];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    reorderSceneCards(next.map(c => c.id));
  };
  const moveDown = (id) => {
    const idx = sorted.findIndex(c => c.id === id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const next = [...sorted];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    reorderSceneCards(next.map(c => c.id));
  };

  const counts = {
    outline: sorted.filter(c => c.status === "outline").length,
    drafted: sorted.filter(c => c.status === "drafted").length,
    revised: sorted.filter(c => c.status === "revised").length,
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 399 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 400, width: "min(820px, 96vw)", maxHeight: "92vh",
        background: "var(--bg-surface)", border: "1px solid var(--c-bd-4)",
        borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2} strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
              씬 카드 보드
            </div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 3 }}>
              비트시트 → 씬 카드 → 초고. 각 씬을 작가가 하나씩 장악하세요.
              <span style={{ marginLeft: 8, fontSize: 10, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>
                전체 {sorted.length} · 아웃라인 {counts.outline} · 초안 {counts.drafted} · 수정 {counts.revised}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={addSceneCard}
            style={{ fontSize: 11, padding: "5px 11px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.35)", background: "rgba(200,168,75,0.08)", color: "#C8A84B", cursor: "pointer", fontWeight: 700 }}
          >+ 씬 추가</button>
          {sorted.length === 0 && beatSheetResult?.beats?.length > 0 && (
            <button
              onClick={seedSceneCardsFromBeatSheet}
              style={{ fontSize: 11, padding: "5px 11px", borderRadius: 7, border: "1px solid rgba(78,204,163,0.35)", background: "rgba(78,204,163,0.08)", color: "#4ECCA3", cursor: "pointer", fontWeight: 700 }}
            >비트 시트에서 자동 생성 ({beatSheetResult.beats.length}개)</button>
          )}
        </div>

        {/* Stale 배너 — 비트시트가 변경됐을 때 */}
        {staleCount > 0 && beatSheetResult?.beats && (
          <div style={{
            padding: "10px 24px", borderBottom: "1px solid var(--c-bd-1)",
            background: "rgba(247,160,114,0.08)",
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 14 }}>⚠</span>
            <div style={{ flex: 1, fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.5 }}>
              비트 시트가 변경됐습니다. <strong>{staleCount}개 씬 카드</strong>가 옛 비트 정보를 가지고 있을 수 있습니다.
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => reseedFromBeatSheet("merge")}
                title="작가가 채운 본문/장소/갈등은 보존하고 제목·기능·가치 변화만 새 비트 기준으로 갱신"
                style={{ fontSize: 10, padding: "4px 11px", borderRadius: 6, border: "1px solid rgba(78,204,163,0.4)", background: "rgba(78,204,163,0.1)", color: "#4ECCA3", cursor: "pointer", fontWeight: 700 }}
              >메타만 병합</button>
              <button
                onClick={() => reseedFromBeatSheet("overwrite")}
                title="비트 시트 기준으로 카드를 완전히 새로 — 작가가 쓴 본문은 사라집니다"
                style={{ fontSize: 10, padding: "4px 11px", borderRadius: 6, border: "1px solid rgba(232,93,117,0.4)", background: "rgba(232,93,117,0.08)", color: "#E85D75", cursor: "pointer", fontWeight: 700 }}
              >완전 덮어쓰기</button>
              <button
                onClick={() => clearBeatSheetStale?.()}
                style={{ fontSize: 10, padding: "4px 11px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "transparent", color: "var(--c-tx-40)", cursor: "pointer", fontWeight: 700 }}
              >무시</button>
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--c-tx-30)", fontSize: 12, lineHeight: 1.7 }}>
              씬 카드가 없습니다.
              {beatSheetResult?.beats?.length > 0
                ? <><br />비트 시트에서 자동 생성하거나, 위 "+ 씬 추가" 버튼으로 직접 만드세요.</>
                : <><br />Stage 5에서 비트 시트를 먼저 만들면 자동 생성할 수 있습니다.</>}
            </div>
          ) : (
            sorted.map(card => (
              <SceneCard
                key={card.id}
                card={card}
                onUpdate={updateSceneCard}
                onDelete={deleteSceneCard}
                onMoveUp={() => moveUp(card.id)}
                onMoveDown={() => moveDown(card.id)}
                onExpand={() => setExpandedId(expandedId === card.id ? null : card.id)}
                expanded={expandedId === card.id}
                isStale={(beatSheetStaleCardIds || []).includes(card.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
