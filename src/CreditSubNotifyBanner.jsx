import { useState } from "react";

export default function CreditSubNotifyBanner({ user, showToast }) {
  const [notifyEmail, setNotifyEmail] = useState(user?.email || "");
  const [notifyDone, setNotifyDone] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  async function handleNotify(e) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyLoading(true);
    try {
      const token = localStorage.getItem("hll_auth_token");
      const headers = { "Content-Type": "application/json" };
      if (token) { headers["x-auth-token"] = token; headers["Authorization"] = `Bearer ${token}`; }
      const res = await fetch("/api/notify-subscribe", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ email: notifyEmail.trim() }),
      });
      if (res.ok) {
        setNotifyDone(true);
        showToast("success", "출시 알림이 등록되었습니다!");
      } else {
        const d = await res.json().catch(() => ({}));
        showToast("error", d.error || "등록에 실패했습니다. 다시 시도해주세요.");
      }
    } catch {
      showToast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      setNotifyLoading(false);
    }
  }

  return (
    <div style={{ margin: "14px 24px 0", padding: "12px 16px", borderRadius: 10, background: "linear-gradient(135deg, rgba(78,204,163,0.08), rgba(167,139,250,0.08))", border: "1px solid rgba(78,204,163,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
        </svg>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#4ECCA3" }}>월 구독 플랜 출시 예정</div>
      </div>
      <div style={{ fontSize: 11, color: "var(--c-tx-40)", lineHeight: 1.5, marginBottom: 8 }}>
        월 9,900원 → 100cr/월 자동 충전 · 출시 알림 등록 시 <strong style={{ color: "#4ECCA3" }}>첫 달 30% 할인</strong>
      </div>
      {notifyDone ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, background: "rgba(78,204,163,0.1)", border: "1px solid rgba(78,204,163,0.3)" }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round">
            <path d="M5 13l4 4L19 7"/>
          </svg>
          <span style={{ fontSize: 11, color: "#4ECCA3", fontWeight: 700 }}>알림 등록 완료</span>
        </div>
      ) : (
        <form onSubmit={handleNotify} style={{ display: "flex", gap: 6 }}>
          <input
            type="email"
            value={notifyEmail}
            onChange={e => setNotifyEmail(e.target.value)}
            placeholder="이메일 주소 입력"
            required
            style={{
              flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 11,
              border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.06)",
              color: "var(--text-main)", outline: "none", fontFamily: "'Noto Sans KR', sans-serif",
            }}
          />
          <button
            type="submit"
            disabled={notifyLoading}
            style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.35)", background: "rgba(78,204,163,0.1)", color: "#4ECCA3", fontSize: 11, fontWeight: 700, cursor: notifyLoading ? "not-allowed" : "pointer", fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "nowrap", opacity: notifyLoading ? 0.6 : 1 }}
          >
            {notifyLoading ? "..." : "알림 신청"}
          </button>
        </form>
      )}
    </div>
  );
}
