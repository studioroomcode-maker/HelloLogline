import { useEffect } from "react";

/**
 * ConfirmModal — window.confirm() 대체
 * 사용: <ConfirmModal title="..." message="..." onConfirm={fn} onCancel={fn} />
 */
export default function ConfirmModal({ title, message, confirmLabel = "확인", cancelLabel = "취소", confirmColor = "var(--accent-gold)", onConfirm, onCancel }) {
  // ESC로 취소
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2100,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "var(--blur-base)", WebkitBackdropFilter: "var(--blur-base)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={onCancel}
    >
      {/* outer bezel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 360, width: "100%",
          padding: 2, borderRadius: 18,
          background: "var(--glass-nano)",
          border: "1px solid var(--glass-bd-nano)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        {/* inner core */}
        <div style={{
          background: "var(--glass-modal)",
          border: "1px solid var(--glass-bd-base)",
          borderRadius: 16,
          boxShadow: "inset 0 1px 0 var(--glass-bd-top)",
          padding: "24px 22px 20px",
        }}>
          {title && (
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)", marginBottom: 8, lineHeight: 1.3 }}>
              {title}
            </div>
          )}
          {message && (
            <div style={{ fontSize: 13, color: "var(--c-tx-55)", lineHeight: 1.65, marginBottom: 22, whiteSpace: "pre-line" }}>
              {message}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "9px 18px", borderRadius: 9,
                border: "1px solid var(--glass-bd-base)", background: "var(--glass-nano)",
                color: "var(--c-tx-55)", fontSize: 13, cursor: "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.18s var(--ease-spring)",
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: "9px 20px", borderRadius: 9,
                border: "none", background: confirmColor,
                color: "#0c0c1c", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
                boxShadow: `0 3px 12px ${confirmColor}40`,
                transition: "all 0.18s var(--ease-spring)",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
