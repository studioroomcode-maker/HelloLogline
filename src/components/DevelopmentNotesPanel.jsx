import { useState, useMemo } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

const SOURCE_LABEL = {
  coverage: "Coverage",
  logline: "로그라인",
  coreDesign: "핵심 설계",
  rewriteDiag: "고쳐쓰기 진단",
  manual: "직접 추가",
};

const AREA_LABEL = {
  logline: "로그라인",
  coreDesign: "핵심 설계",
  character: "캐릭터",
  synopsis: "시놉시스",
  structure: "구조",
  treatment: "트리트먼트",
  beat: "비트시트",
  draft: "초고",
  theme: "테마",
  general: "일반",
};

const STATUS_META = {
  open: { label: "열림", color: "#FB923C" },
  applied: { label: "적용", color: "#4ECCA3" },
  ignored: { label: "보류", color: "#9CA3AF" },
};

const AREA_TO_STAGE = {
  logline: "1",
  coreDesign: "2",
  character: "3",
  synopsis: "4",
  structure: "4",
  theme: "4",
  treatment: "5",
  beat: "5",
  draft: "6",
};

function NoteCard({ note, onUpdate, onDelete, onJump, onRevisit, revisitLoading, onDismissOutdated }) {
  const status = STATUS_META[note.status] || STATUS_META.open;
  const stageId = note.linkedStage || AREA_TO_STAGE[note.area];
  const isOutdated = note.mayBeOutdated && note.status === "open";

  return (
    <div style={{
      padding: "12px 14px", borderRadius: 10,
      background: note.status === "applied" ? "rgba(78,204,163,0.04)" : note.status === "ignored" ? "rgba(156,163,175,0.04)" : isOutdated ? "rgba(96,165,250,0.05)" : "var(--glass-micro)",
      border: `1px solid ${note.status === "applied" ? "rgba(78,204,163,0.2)" : note.status === "ignored" ? "rgba(156,163,175,0.2)" : isOutdated ? "rgba(96,165,250,0.3)" : "var(--glass-bd-nano)"}`,
      borderLeft: `3px solid ${isOutdated ? "#60A5FA" : status.color}`,
      opacity: note.status === "ignored" ? 0.6 : 1,
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: status.color,
          padding: "2px 7px", borderRadius: 6,
          background: `${status.color}14`, border: `1px solid ${status.color}40`,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>{status.label}</span>
        {isOutdated && (
          <span
            title="작품의 상위 단계가 갱신됐습니다 — 이 노트가 여전히 유효한지 재검토하세요"
            style={{
              fontSize: 9, fontWeight: 800, color: "#60A5FA",
              padding: "2px 7px", borderRadius: 6,
              background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.4)",
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3,
              display: "inline-flex", alignItems: "center", gap: 3,
            }}
          >🔄 재검토</span>
        )}
        <span style={{ fontSize: 9, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace" }}>
          {SOURCE_LABEL[note.source] || note.source}
        </span>
        <span style={{ fontSize: 9, color: "var(--c-tx-35)" }}>·</span>
        <span style={{ fontSize: 9, color: "var(--c-tx-45)", fontWeight: 700 }}>
          {AREA_LABEL[note.area] || note.area}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => onDelete(note.id)}
          title="삭제"
          style={{ fontSize: 11, color: "var(--c-tx-30)", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
        >×</button>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", lineHeight: 1.5, marginBottom: note.why || note.action ? 6 : 0 }}>
        {note.title}
      </div>
      {note.why && (
        <div style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.55, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: "var(--c-tx-35)" }}>영향: </span>{note.why}
        </div>
      )}
      {note.action && (
        <div style={{ fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.55, padding: "6px 8px", borderRadius: 6, background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)", marginTop: 6 }}>
          <span style={{ fontWeight: 700, color: "#C8A84B" }}>수정 제안: </span>{note.action}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {isOutdated && onRevisit && (
          <>
            <button
              onClick={() => onRevisit(note)}
              disabled={!!revisitLoading}
              style={{
                fontSize: 10, padding: "4px 10px", borderRadius: 6,
                border: "1px solid rgba(96,165,250,0.4)",
                background: revisitLoading === note.id ? "rgba(96,165,250,0.18)" : "rgba(96,165,250,0.08)",
                color: "#60A5FA", cursor: revisitLoading ? "not-allowed" : "pointer", fontWeight: 700,
                opacity: revisitLoading && revisitLoading !== note.id ? 0.5 : 1,
              }}
            >
              {revisitLoading === note.id ? "AI 검토 중…" : "🤖 AI에게 다시 검토"}
            </button>
            <button
              onClick={() => onDismissOutdated?.(note.id)}
              style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "transparent", color: "var(--c-tx-40)", cursor: "pointer", fontWeight: 700 }}
            >그대로 유효</button>
          </>
        )}
        {note.status !== "applied" && (
          <button
            onClick={() => onUpdate(note.id, { status: "applied" })}
            style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(78,204,163,0.35)", background: "rgba(78,204,163,0.08)", color: "#4ECCA3", cursor: "pointer", fontWeight: 700 }}
          >적용함</button>
        )}
        {note.status !== "ignored" && (
          <button
            onClick={() => onUpdate(note.id, { status: "ignored" })}
            style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(156,163,175,0.35)", background: "rgba(156,163,175,0.08)", color: "#9CA3AF", cursor: "pointer", fontWeight: 700 }}
          >보류</button>
        )}
        {note.status !== "open" && (
          <button
            onClick={() => onUpdate(note.id, { status: "open" })}
            style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(251,146,60,0.35)", background: "rgba(251,146,60,0.08)", color: "#FB923C", cursor: "pointer", fontWeight: 700 }}
          >다시 열기</button>
        )}
        {stageId && onJump && (
          <button
            onClick={() => onJump(stageId)}
            style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "var(--glass-nano)", color: "var(--c-tx-50)", cursor: "pointer", fontWeight: 700 }}
          >Stage {stageId}로 이동 →</button>
        )}
      </div>
    </div>
  );
}

export default function DevelopmentNotesPanel({ onClose }) {
  const {
    developmentNotes, updateDevelopmentNote, deleteDevelopmentNote, addDevelopmentNote,
    advanceToStage, isMobile,
    revisitNote, revisitNoteLoadingId, dismissNoteOutdated,
  } = useLoglineCtx();
  const [filter, setFilter] = useState("open"); // open | all | applied | ignored | outdated
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ title: "", why: "", action: "", area: "general" });

  const filtered = useMemo(() => {
    if (filter === "all") return developmentNotes;
    if (filter === "outdated") return developmentNotes.filter(n => n.mayBeOutdated && n.status === "open");
    return developmentNotes.filter(n => n.status === filter);
  }, [developmentNotes, filter]);

  const counts = useMemo(() => ({
    open: developmentNotes.filter(n => n.status === "open").length,
    applied: developmentNotes.filter(n => n.status === "applied").length,
    ignored: developmentNotes.filter(n => n.status === "ignored").length,
    outdated: developmentNotes.filter(n => n.mayBeOutdated && n.status === "open").length,
    all: developmentNotes.length,
  }), [developmentNotes]);

  const handleJump = (stageId) => {
    advanceToStage(stageId);
    onClose?.();
  };

  const handleAdd = () => {
    if (!draft.title.trim()) return;
    addDevelopmentNote({ ...draft, source: "manual", status: "open" });
    setDraft({ title: "", why: "", action: "", area: "general" });
    setShowAdd(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 399 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 400, width: "min(720px, 96vw)", maxHeight: "88vh",
        background: "var(--bg-surface)", border: "1px solid var(--c-bd-4)",
        borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth={2} strokeLinecap="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              수정 과제 보드
            </div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 3 }}>
              모든 분석이 남긴 "그래서 뭘 고치지?" 목록 — 하나씩 닫으며 작품을 발전시키세요.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        {/* Filter tabs */}
        <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { key: "open", label: `열림 ${counts.open}`, color: "#FB923C" },
            ...(counts.outdated > 0 ? [{ key: "outdated", label: `🔄 재검토 ${counts.outdated}`, color: "#60A5FA" }] : []),
            { key: "applied", label: `적용 ${counts.applied}`, color: "#4ECCA3" },
            { key: "ignored", label: `보류 ${counts.ignored}`, color: "#9CA3AF" },
            { key: "all", label: `전체 ${counts.all}`, color: "var(--c-tx-50)" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                fontSize: 11, padding: "5px 11px", borderRadius: 7,
                border: filter === t.key ? `1px solid ${t.color}` : "1px solid var(--c-bd-2)",
                background: filter === t.key ? `${t.color}14` : "transparent",
                color: filter === t.key ? t.color : "var(--c-tx-40)",
                cursor: "pointer", fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >{t.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{ fontSize: 11, padding: "5px 11px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.35)", background: "rgba(200,168,75,0.08)", color: "#C8A84B", cursor: "pointer", fontWeight: 700 }}
          >+ 직접 추가</button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--c-bd-1)", background: "var(--glass-nano)" }}>
            <input
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="문제 제목 (예: 주인공 목표가 추상적)"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 12, marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
            />
            <input
              value={draft.why}
              onChange={e => setDraft(d => ({ ...d, why: e.target.value }))}
              placeholder="영향 (예: 2막 동력이 약해짐)"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 12, marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
            />
            <input
              value={draft.action}
              onChange={e => setDraft(d => ({ ...d, action: e.target.value }))}
              placeholder="수정 제안 (예: 외적 목표를 마감일이 있는 행동으로 바꾸기)"
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 12, marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={draft.area}
                onChange={e => setDraft(d => ({ ...d, area: e.target.value }))}
                style={{ padding: "6px 8px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                {Object.entries(AREA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button
                onClick={handleAdd}
                disabled={!draft.title.trim()}
                style={{ fontSize: 11, padding: "6px 14px", borderRadius: 7, border: "none", background: draft.title.trim() ? "#C8A84B" : "var(--c-bd-3)", color: draft.title.trim() ? "#0c0c1c" : "var(--c-tx-30)", cursor: draft.title.trim() ? "pointer" : "not-allowed", fontWeight: 800 }}
              >추가</button>
              <button
                onClick={() => setShowAdd(false)}
                style={{ fontSize: 11, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--c-bd-2)", background: "transparent", color: "var(--c-tx-40)", cursor: "pointer", fontWeight: 700 }}
              >취소</button>
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--c-tx-30)", fontSize: 12, lineHeight: 1.7 }}>
              {filter === "open"
                ? "열린 과제가 없습니다. 분석을 실행해서 자동으로 노트를 채우거나, 직접 추가하세요."
                : filter === "applied"
                ? "적용한 과제가 없습니다."
                : filter === "ignored"
                ? "보류한 과제가 없습니다."
                : "노트가 없습니다."}
            </div>
          ) : (
            filtered.map(n => (
              <NoteCard
                key={n.id}
                note={n}
                onUpdate={updateDevelopmentNote}
                onDelete={deleteDevelopmentNote}
                onJump={handleJump}
                onRevisit={revisitNote}
                revisitLoading={revisitNoteLoadingId}
                onDismissOutdated={dismissNoteOutdated}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
