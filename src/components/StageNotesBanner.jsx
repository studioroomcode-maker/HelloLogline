import { useMemo } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

// stageId → 이 단계에서 처리하는 area 묶음.
// developmentNotes의 area가 이 묶음에 속하면 해당 단계 화면에서 표시.
const STAGE_AREAS = {
  "1": ["logline"],
  "2": ["coreDesign"],
  "3": ["character"],
  "4": ["synopsis", "structure", "theme"],
  "5": ["treatment", "beat"],
  "6": ["draft"],
  "7": ["draft"],   // Coverage가 만든 draft 영역 노트는 Stage 7과 8 모두에서
  "8": ["draft", "character", "structure", "theme", "beat"], // 고쳐쓰기는 모든 영역 적용 가능
  "9": [], // Deep Analysis는 노트 영역이 아님
};

const STATUS_META = {
  open: { label: "열림", color: "#FB923C" },
  applied: { label: "적용", color: "#4ECCA3" },
  ignored: { label: "보류", color: "#9CA3AF" },
};

/**
 * 각 Stage Content 상단에 두는 "이 단계 노트 N개" 배너.
 * area가 해당 단계에 속하는 노트만 보여주고, 인라인으로 상태 토글.
 * "보드에서 보기"는 전체 모달 진입.
 */
export default function StageNotesBanner({ stageId }) {
  const { developmentNotes, updateDevelopmentNote, setShowNotesPanel } = useLoglineCtx();
  const areas = STAGE_AREAS[stageId] || [];

  const stageNotes = useMemo(() => {
    if (areas.length === 0) return [];
    return (developmentNotes || []).filter(n => areas.includes(n.area));
  }, [developmentNotes, areas]);

  const open = stageNotes.filter(n => n.status === "open");
  const applied = stageNotes.filter(n => n.status === "applied");

  if (stageNotes.length === 0) return null;

  return (
    <div style={{
      marginBottom: 16, padding: "12px 14px", borderRadius: 10,
      background: open.length > 0
        ? "linear-gradient(135deg, rgba(251,146,60,0.07), var(--glass-micro))"
        : "var(--glass-micro)",
      border: open.length > 0
        ? "1px solid rgba(251,146,60,0.28)"
        : "1px solid var(--glass-bd-nano)",
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: open.length > 0 ? 10 : 0, flexWrap: "wrap" }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={open.length > 0 ? "#FB923C" : "var(--c-tx-40)"} strokeWidth={2} strokeLinecap="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 800, color: open.length > 0 ? "#FB923C" : "var(--c-tx-50)" }}>
          {open.length > 0 ? `이 단계에서 처리할 과제 ${open.length}개` : "이 단계의 모든 과제 처리 완료"}
        </span>
        {applied.length > 0 && (
          <span style={{ fontSize: 9, color: "#4ECCA3", fontFamily: "'JetBrains Mono', monospace" }}>
            · 적용 {applied.length}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowNotesPanel(true)}
          style={{
            fontSize: 10, padding: "3px 9px", borderRadius: 6,
            border: "1px solid var(--c-bd-3)",
            background: "var(--glass-nano)",
            color: "var(--c-tx-55)",
            cursor: "pointer", fontWeight: 700,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >보드에서 전체 보기 →</button>
      </div>
      {open.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {open.slice(0, 3).map(note => (
            <div key={note.id} style={{
              padding: "8px 10px", borderRadius: 8,
              background: "var(--glass-nano)",
              border: "1px solid var(--glass-bd-nano)",
              borderLeft: "3px solid #FB923C",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)", lineHeight: 1.45 }}>
                {note.title}
              </div>
              {note.action && (
                <div style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.55 }}>
                  <span style={{ fontWeight: 700, color: "#C8A84B" }}>수정 제안: </span>
                  {note.action}
                </div>
              )}
              <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
                <button
                  onClick={() => updateDevelopmentNote(note.id, { status: "applied" })}
                  style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, border: "1px solid rgba(78,204,163,0.35)", background: "rgba(78,204,163,0.08)", color: "#4ECCA3", cursor: "pointer", fontWeight: 700 }}
                >적용함</button>
                <button
                  onClick={() => updateDevelopmentNote(note.id, { status: "ignored" })}
                  style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, border: "1px solid rgba(156,163,175,0.35)", background: "rgba(156,163,175,0.08)", color: "#9CA3AF", cursor: "pointer", fontWeight: 700 }}
                >보류</button>
              </div>
            </div>
          ))}
          {open.length > 3 && (
            <button
              onClick={() => setShowNotesPanel(true)}
              style={{
                fontSize: 10, padding: "5px 0", borderRadius: 6,
                border: "1px dashed var(--c-bd-2)",
                background: "transparent",
                color: "var(--c-tx-40)", cursor: "pointer", fontWeight: 700,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >+ {open.length - 3}개 더 보기</button>
          )}
        </div>
      )}
    </div>
  );
}
