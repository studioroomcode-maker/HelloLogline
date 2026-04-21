const COLORS = {
  error:   { bg: "rgba(232,93,117,0.12)", border: "rgba(232,93,117,0.35)", text: "#E85D75", icon: "✕" },
  success: { bg: "rgba(78,204,163,0.12)",  border: "rgba(78,204,163,0.35)",  text: "#4ECCA3", icon: "✓" },
  info:    { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)",  text: "#60A5FA", icon: "ℹ" },
  warn:    { bg: "rgba(200,168,75,0.12)",  border: "rgba(200,168,75,0.35)",  text: "#C8A84B", icon: "!" },
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380, pointerEvents: "none" }}>
      {toasts.map(t => {
        const c = COLORS[t.type] || COLORS.info;
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(12,12,28,0.88)", border: `1px solid ${c.border}`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 var(--glass-bd-top)`,
            backdropFilter: "var(--blur-micro)", WebkitBackdropFilter: "var(--blur-micro)",
            animation: "fadeSlideUp 0.28s var(--ease-out)",
            pointerEvents: "auto",
          }}>
            <span style={{ fontSize: 13, color: c.text, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
            <span style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", flex: 1 }}>{t.message}</span>
            <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", color: "var(--c-tx-35)", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}
