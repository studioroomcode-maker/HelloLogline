import { useEffect } from "react";
import { SvgIcon, ICON } from "./ui.jsx";
import CreditSubNotifyBanner from "./CreditSubNotifyBanner.jsx";

export default function CreditModal({
  credits, isMobile, user,
  creditPurchasing, setCreditPurchasing,
  subscription, subCancelling, setSubCancelling, setSubscription,
  showToast, onClose,
}) {
  // ESC로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 12 : 24 }} onClick={onClose} role="presentation">
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="크레딧 충전 및 구독" style={{ maxWidth: 480, width: "100%", background: "var(--bg-surface)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 20, overflow: "hidden", fontFamily: "'Noto Sans KR', sans-serif" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--c-bd-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {credits === 0 ? (
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#E85D75" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ) : (
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: credits === 0 ? "#E85D75" : "#A78BFA" }}>
                {credits === 0 ? "크레딧 소진" : "크레딧 충전"}
              </div>
              <div style={{ fontSize: 12, color: "var(--c-tx-40)", marginTop: 2 }}>
                현재 잔액: <span style={{ color: credits === 0 ? "#E85D75" : "#A78BFA", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{credits ?? 0}cr</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="크레딧 모달 닫기" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--c-tx-35)", padding: 4 }}>
            <SvgIcon d={ICON.close} size={18} />
          </button>
        </div>

        {/* 크레딧 소진 시 강조 배너 */}
        {credits === 0 && (
          <div style={{ margin: "16px 24px 0", padding: "12px 16px", borderRadius: 10, background: "rgba(232,93,117,0.1)", border: "1px solid rgba(232,93,117,0.35)", fontSize: 13, color: "#E85D75", lineHeight: 1.6, fontWeight: 600 }}>
            크레딧이 모두 소진되었습니다.<br />
            <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(232,93,117,0.8)" }}>아래에서 충전하면 즉시 분석을 계속할 수 있습니다.</span>
          </div>
        )}

        {/* 이벤트 배너 */}
        <div style={{ margin: "16px 24px 0", padding: "10px 14px", borderRadius: 10, background: "rgba(200,168,75,0.08)", border: "1px solid rgba(200,168,75,0.2)", fontSize: 12, color: "#C8A84B", lineHeight: 1.6, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span><strong>이벤트 기간</strong> — 로그라인 분석 · 캐릭터 분석은 <strong>무료</strong>! 기타 기능 1~5cr 소모.</span>
        </div>

        {/* 기능별 비용 안내 */}
        <div style={{ margin: "12px 24px 0", padding: "12px 14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-35)", marginBottom: 8, letterSpacing: 0.5 }}>기능별 크레딧 비용</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {[
              { label: "로그라인 기본 분석", cost: "무료" },
              { label: "개선안 생성",        cost: "무료" },
              { label: "캐릭터 분석",         cost: "무료" },
              { label: "상업성·전문가 패널", cost: "1cr" },
              { label: "학술·신화 분석",     cost: "1cr" },
              { label: "시놉시스·구조 분석", cost: "1cr" },
              { label: "트리트먼트·비트시트", cost: "2cr" },
              { label: "Script Coverage",    cost: "2cr" },
              { label: "부분 개고",           cost: "2cr" },
              { label: "에피소드 설계",       cost: "2cr" },
              { label: "전체 개고",           cost: "3cr" },
              { label: "시나리오 초고",       cost: "5cr" },
            ].map(({ label, cost }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--c-bd-1)" }}>
                <span style={{ fontSize: 10, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: cost === "무료" ? "#4ECCA3" : "#A78BFA", fontFamily: "'JetBrains Mono', monospace" }}>{cost}</span>
              </div>
            ))}
          </div>
          {credits !== null && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--c-bd-2)", fontSize: 11, color: "var(--c-tx-45)" }}>
              현재 <span style={{ color: "#A78BFA", fontWeight: 700 }}>{credits}cr</span>으로 Script Coverage <span style={{ color: "#A78BFA", fontWeight: 700 }}>{Math.floor(credits / 2)}회</span> · 시나리오 초고 <span style={{ color: "#A78BFA", fontWeight: 700 }}>{Math.floor(credits / 5)}회</span> 가능
            </div>
          )}
        </div>

        {/* 구독 플랜 */}
        <div style={{ margin: "12px 24px 0", padding: "14px", borderRadius: 12, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.2)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", letterSpacing: 0.5, marginBottom: 10 }}>월간 구독 플랜 — 자동 갱신</div>

          {subscription && subscription.status === "active" ? (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(78,204,163,0.08)", border: "1px solid rgba(78,204,163,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4ECCA3" }}>
                    {subscription.plan === "sub_pro" ? "Pro" : "Basic"} 구독 중
                  </div>
                  {subscription.next_billing_at && (
                    <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginTop: 3 }}>
                      다음 결제일: {new Date(subscription.next_billing_at).toLocaleDateString("ko-KR")}
                    </div>
                  )}
                </div>
                <button
                  disabled={subCancelling}
                  onClick={() => {
                    if (!confirm("구독을 취소하시겠습니까? 남은 기간은 계속 사용할 수 있습니다.")) return;
                    const token = localStorage.getItem("hll_auth_token");
                    setSubCancelling(true);
                    fetch("/api/subscribe/cancel", {
                      method: "POST",
                      headers: { "x-auth-token": token || "" },
                    })
                      .then(r => r.json())
                      .then(d => {
                        if (d.ok) {
                          setSubscription(s => ({ ...s, status: "cancelled" }));
                          showToast("info", d.message || "구독이 취소되었습니다.");
                        } else {
                          showToast("error", d.error || "취소에 실패했습니다.");
                        }
                      })
                      .catch(() => showToast("error", "네트워크 문제로 요청이 닿지 않았어요. 인터넷 연결을 확인하고 다시 시도해 주세요."))
                      .finally(() => setSubCancelling(false));
                  }}
                  style={{
                    padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(232,93,117,0.3)",
                    background: "rgba(232,93,117,0.06)", color: "#E85D75",
                    fontSize: 10, cursor: subCancelling ? "not-allowed" : "pointer",
                    fontFamily: "'Noto Sans KR', sans-serif", opacity: subCancelling ? 0.6 : 1,
                  }}
                >
                  {subCancelling ? "..." : "구독 취소"}
                </button>
              </div>
            </div>
          ) : subscription && subscription.status === "cancelled" ? (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(232,93,117,0.06)", border: "1px solid rgba(232,93,117,0.2)", fontSize: 11, color: "#E85D75" }}>
              구독이 취소되었습니다.{subscription.next_billing_at && ` ${new Date(subscription.next_billing_at).toLocaleDateString("ko-KR")}까지 사용 가능`}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { key: "sub_basic", credits: 100, price: 9900,  label: "Basic", color: "#4ECCA3" },
                  { key: "sub_pro",   credits: 250, price: 19900, label: "Pro",   color: "#A78BFA" },
                ].map(pkg => (
                  <button
                    key={pkg.key}
                    disabled={creditPurchasing || !user}
                    onClick={() => {
                      if (!user) { showToast("info", "로그인 후 구독하실 수 있습니다."); return; }
                      if (!window.TossPayments) { showToast("error", "결제 모듈 로딩 중입니다."); return; }
                      const tossKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
                      if (!tossKey) { showToast("error", "결제 키가 설정되지 않았습니다."); return; }
                      const toss = window.TossPayments(tossKey);
                      const base = window.location.origin + window.location.pathname;
                      toss.requestBillingAuth("카드", {
                        customerKey: user.email,
                        successUrl: `${base}?plan=${pkg.key}`,
                        failUrl: base,
                      });
                    }}
                    style={{
                      padding: "12px 10px", borderRadius: 10,
                      cursor: (creditPurchasing || !user) ? "not-allowed" : "pointer",
                      border: `1px solid ${pkg.color}40`, background: `${pkg.color}08`,
                      transition: "all 0.15s", textAlign: "center",
                      fontFamily: "'Noto Sans KR', sans-serif",
                      opacity: (creditPurchasing || !user) ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: pkg.color, letterSpacing: 1, marginBottom: 4 }}>{pkg.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: pkg.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{pkg.credits}<span style={{ fontSize: 11, fontWeight: 400 }}>cr</span></div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-tx-70)", marginTop: 5 }}>{pkg.price.toLocaleString()}원/월</div>
                    <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginTop: 2 }}>{Math.round(pkg.price / pkg.credits)}원/cr</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: "var(--c-tx-30)", textAlign: "center" }}>
                매월 자동 갱신 · 언제든지 취소 가능
              </div>
            </>
          )}
        </div>

        {/* 구독 플랜 알림 신청 */}
        <CreditSubNotifyBanner user={user} showToast={showToast} />

        {/* 일회성 충전 패키지 */}
        <div style={{ padding: "0 24px 4px", marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-35)", letterSpacing: 0.5 }}>일회성 충전</div>
        </div>
        <div style={{ padding: "8px 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { key: "c30",  credits: 30,  price: 3000,  label: "스타터",    color: "#60A5FA" },
            { key: "c70",  credits: 70,  price: 7000,  label: "스탠다드",  color: "#4ECCA3" },
            { key: "c230", credits: 230, price: 20000, label: "프로",      color: "#A78BFA" },
            { key: "c400", credits: 400, price: 35000, label: "울트라",    color: "#C8A84B" },
          ].map(pkg => (
            <button
              key={pkg.key}
              disabled={creditPurchasing}
              onClick={() => {
                if (!window.TossPayments) { showToast("error", "결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요."); return; }
                const tossKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
                if (!tossKey) { showToast("error", "결제 키가 설정되지 않았습니다."); return; }
                const orderId = `hll-${pkg.key}-${Date.now()}`;
                const toss = window.TossPayments(tossKey);
                setCreditPurchasing(true);
                toss.requestPayment("카드", {
                  amount: pkg.price,
                  orderId,
                  orderName: `Hello Loglines ${pkg.label} ${pkg.credits}cr`,
                  successUrl: window.location.href,
                  failUrl: window.location.href,
                }).catch(() => setCreditPurchasing(false));
              }}
              style={{
                padding: "16px 12px", borderRadius: 12, cursor: creditPurchasing ? "not-allowed" : "pointer",
                border: `1px solid ${pkg.color}40`,
                background: `${pkg.color}08`,
                transition: "all 0.15s", textAlign: "center",
                fontFamily: "'Noto Sans KR', sans-serif",
                opacity: creditPurchasing ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: pkg.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{pkg.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: pkg.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{pkg.credits}<span style={{ fontSize: 12, fontWeight: 400 }}>cr</span></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-tx-70)", marginTop: 6 }}>{pkg.price.toLocaleString()}원</div>
              <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginTop: 2 }}>{Math.round(pkg.price / pkg.credits)}원/cr</div>
            </button>
          ))}
        </div>
        <div style={{ padding: "0 24px 8px", fontSize: 11, color: "var(--c-tx-30)", textAlign: "center" }}>
          구매 후 즉시 크레딧이 적립됩니다 · 환불은 미사용 크레딧에 한해 가능
        </div>
        <div style={{ padding: "0 24px 20px", fontSize: 10, color: "var(--c-tx-30)", textAlign: "center", display: "flex", justifyContent: "center", gap: 10 }}>
          <a href="/legal/terms.html" target="_blank" rel="noreferrer" style={{ color: "var(--c-tx-40)", textDecoration: "underline" }}>이용약관</a>
          <span style={{ color: "var(--c-tx-20)" }}>·</span>
          <a href="/legal/privacy.html" target="_blank" rel="noreferrer" style={{ color: "var(--c-tx-40)", textDecoration: "underline" }}>개인정보처리방침</a>
          <span style={{ color: "var(--c-tx-20)" }}>·</span>
          <a href="/legal/refund.html" target="_blank" rel="noreferrer" style={{ color: "var(--c-tx-40)", textDecoration: "underline" }}>환불 정책</a>
        </div>
      </div>
    </div>
  );
}
