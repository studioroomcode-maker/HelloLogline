import { useState } from "react";
import { markNextCallsAsRetry } from "./utils.js";

/* ─── SVG Icon Paths ─── */
export const ICON = {
  edit: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  film: "M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  close: "M6 18L18 6M6 6l12 12",
  key: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
  history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  check: "M5 13l4 4L19 7",
  spinner: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z",
};

export function SvgIcon({ d, size = 16, color = "currentColor", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

export function Spinner({ size = 14, color = "var(--c-tx-70)" }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: `2px solid ${color}33`, borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0,
    }} />
  );
}

export function DocButton({ label, sub, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 16px", borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer",
        border: "1px solid rgba(96,165,250,0.35)",
        background: hovered && !disabled ? "rgba(96,165,250,0.12)" : "rgba(96,165,250,0.06)",
        color: disabled ? "rgba(96,165,250,0.35)" : "#60A5FA",
        opacity: disabled ? 0.5 : 1, transition: "all 0.2s",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>{sub}</div>}
      </div>
    </button>
  );
}

export function ToolButton({ icon, label, sub, done, loading, color, onClick, disabled, tooltip, creditCost = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        onMouseEnter={() => { setHovered(true); setTipVisible(true); }}
        onMouseLeave={() => { setHovered(false); setTipVisible(false); }}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10,
          border: done ? `1px solid ${color}40` : "1px solid var(--c-bd-2)",
          background: done ? `${color}08` : hovered ? "var(--c-card-1)" : "rgba(var(--tw),0.02)",
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
          display: "flex", alignItems: "center", gap: 10,
          textAlign: "left", transition: "all 0.2s",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <div style={{ color: done ? color : "var(--c-tx-40)", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: done ? color : "var(--c-tx-75)", lineHeight: 1.3 }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {creditCost > 0 && (
            <span style={{
              fontSize: 9, padding: "2px 5px", borderRadius: 6,
              background: "rgba(200,168,75,0.12)", color: "#C8A84B",
              border: "1px solid rgba(200,168,75,0.25)",
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1.2,
            }}>{creditCost}cr</span>
          )}
          {tooltip && <span style={{ fontSize: 12, color: "rgba(var(--tw),0.18)", lineHeight: 1, userSelect: "none" }}>ⓘ</span>}
          {done && !loading && (
            <span style={{ fontSize: 9, color: `${color}b3`, fontFamily: "'JetBrains Mono', monospace", marginLeft: "auto" }}>
              재실행 가능
            </span>
          )}
          {loading ? <Spinner size={12} color={color} /> : done ? (
            <SvgIcon d={ICON.check} size={14} color={color} />
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-bd-5)" }} />
          )}
        </div>
      </button>
      {tipVisible && tooltip && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          background: "var(--bg-tooltip)",
          border: "1px solid var(--border-tooltip)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 12,
          color: "var(--text-tooltip)",
          lineHeight: 1.75,
          maxWidth: 320,
          width: "max-content",
          zIndex: 400,
          pointerEvents: "none",
          boxShadow: "0 10px 32px rgba(0,0,0,0.6)",
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 400,
          whiteSpace: "pre-wrap",
          wordBreak: "keep-all",
        }}>
          <div style={{
            position: "absolute", bottom: "100%", right: 16,
            width: 0, height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderBottom: "7px solid var(--bg-tooltip)",
          }} />
          {tooltip}
        </div>
      )}
    </div>
  );
}

export function FeedbackBox({ value, onChange, onSubmit, loading, placeholder = "수정 요청을 입력하세요" }) {
  return (
    <div style={{
      marginTop: 16, paddingTop: 14,
      borderTop: "1px dashed var(--c-bd-2)",
    }}>
      <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginBottom: 7, fontWeight: 600, letterSpacing: "0.02em" }}>
        AI에게 수정 요청
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 9,
          border: "1px solid var(--c-bd-3)", background: "rgba(var(--tw),0.025)",
          color: "var(--text-main)", fontSize: 12, resize: "vertical",
          fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6,
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 7 }}>
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          style={{
            padding: "8px 18px", borderRadius: 8,
            border: "1px solid rgba(167,139,250,0.35)",
            background: loading || !value.trim() ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.1)",
            color: loading || !value.trim() ? "var(--c-tx-30)" : "#A78BFA",
            fontSize: 12, fontWeight: 600, cursor: loading || !value.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {loading ? "수정 중..." : "피드백 반영"}
        </button>
      </div>
    </div>
  );
}

export function ResultCard({ children, onClose, title, color = "var(--c-bd-1)", onUndo, historyCount = 0 }) {
  return (
    <div style={{
      marginTop: 12, borderRadius: 14,
      border: `1px solid ${color}`,
      background: "rgba(var(--tw),0.02)",
      boxShadow: "inset 0 1px 0 var(--c-card-2)",
      position: "relative",
    }}>
      {(title || onClose || (onUndo && historyCount > 0)) && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", borderBottom: "1px solid var(--c-card-2)",
        }}>
          {title && <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{title}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {onUndo && historyCount > 0 && (
              <button
                onClick={onUndo}
                title={`이전 버전으로 되돌리기 (${historyCount}개 저장됨)`}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 7,
                  border: "1px solid rgba(167,139,250,0.3)",
                  background: "rgba(167,139,250,0.07)",
                  color: "#A78BFA", fontSize: 11, cursor: "pointer",
                  fontWeight: 600, lineHeight: 1.4,
                }}
              >
                ↩ 되돌리기 <span style={{ opacity: 0.6, fontWeight: 400 }}>({historyCount})</span>
              </button>
            )}
            {onClose && (
              <button onClick={onClose} style={{
                background: "none", border: "none", cursor: "pointer", padding: 4,
                color: "var(--c-tx-30)", lineHeight: 1,
              }}>
                <SvgIcon d={ICON.close} size={14} />
              </button>
            )}
          </div>
        </div>
      )}
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  const colors = {
    error:   { bg: "rgba(232,93,117,0.12)", border: "rgba(232,93,117,0.35)", text: "#E85D75", icon: "✕" },
    success: { bg: "rgba(78,204,163,0.12)",  border: "rgba(78,204,163,0.35)",  text: "#4ECCA3", icon: "✓" },
    info:    { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)",  text: "#60A5FA", icon: "ℹ" },
    warn:    { bg: "rgba(200,168,75,0.12)",  border: "rgba(200,168,75,0.35)",  text: "#C8A84B", icon: "🔒" },
  };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380, pointerEvents: "none" }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px 16px", borderRadius: 12,
            background: c.bg, border: `1px solid ${c.border}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            backdropFilter: "blur(8px)",
            animation: "fadeSlideUp 0.25s ease",
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

export function ErrorMsg({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
      <span style={{ flex: 1, lineHeight: 1.6 }}>{msg}</span>
      {onRetry && (
        <button onClick={() => { markNextCallsAsRetry(2); onRetry(); }} style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(232,93,117,0.4)", background: "rgba(232,93,117,0.1)", color: "#E85D75", fontSize: 11, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
          다시 시도
        </button>
      )}
    </div>
  );
}
