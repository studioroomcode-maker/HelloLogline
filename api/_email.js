/**
 * 이메일 발송 헬퍼 — Resend API 사용
 * RESEND_API_KEY 없으면 콘솔 로그만 남기고 무시
 */

const RESEND_KEY = (process.env.RESEND_API_KEY || "").trim();
const FROM = process.env.EMAIL_FROM || "Hello Loglines <noreply@hellologlines.com>";

export async function sendEmail({ to, subject, html }) {
  if (!RESEND_KEY) {
    console.log(`[email:skip] to=${to} subject="${subject}"`);
    return { ok: false, reason: "no_api_key" };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error("[email:error]", r.status, err);
      return { ok: false, reason: err };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email:error]", e.message);
    return { ok: false, reason: e.message };
  }
}

export function subscriptionRenewedHtml({ plan, credits, amount, nextBillingAt }) {
  const planLabel = plan === "sub_pro" ? "Pro" : "Basic";
  const next = new Date(nextBillingAt).toLocaleDateString("ko-KR");
  return `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0e1512;color:#e0e0e0;border-radius:12px">
  <div style="font-size:12px;font-weight:700;letter-spacing:3px;color:#C8A84B;margin-bottom:20px">HELLO LOGLINES</div>
  <h2 style="font-size:20px;margin:0 0 12px;color:#4ECCA3">구독이 갱신되었습니다</h2>
  <p style="font-size:14px;line-height:1.7;color:#aaa">
    <strong style="color:#e0e0e0">${planLabel} 플랜</strong> 구독이 자동 갱신되었습니다.<br>
    <strong style="color:#A78BFA">${credits}cr</strong>이 즉시 충전되었습니다.
  </p>
  <div style="margin:20px 0;padding:14px 16px;background:rgba(78,204,163,0.08);border:1px solid rgba(78,204,163,0.2);border-radius:8px;font-size:13px">
    <div>결제 금액: <strong style="color:#e0e0e0">${amount.toLocaleString()}원</strong></div>
    <div style="margin-top:4px">다음 결제일: <strong style="color:#e0e0e0">${next}</strong></div>
  </div>
  <p style="font-size:12px;color:#666;margin-top:24px">
    구독을 취소하려면 앱에서 크레딧 모달 → 구독 관리를 이용하세요.
  </p>
</div>`;
}

export function subscriptionFailedHtml({ plan, amount }) {
  const planLabel = plan === "sub_pro" ? "Pro" : "Basic";
  return `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0e1512;color:#e0e0e0;border-radius:12px">
  <div style="font-size:12px;font-weight:700;letter-spacing:3px;color:#C8A84B;margin-bottom:20px">HELLO LOGLINES</div>
  <h2 style="font-size:20px;margin:0 0 12px;color:#E85D75">구독 갱신 실패</h2>
  <p style="font-size:14px;line-height:1.7;color:#aaa">
    <strong style="color:#e0e0e0">${planLabel} 플랜</strong>(${amount.toLocaleString()}원) 자동 결제에 실패했습니다.<br>
    카드 정보를 확인 후 앱에서 재구독해주세요.
  </p>
</div>`;
}

export function subscriptionCreatedHtml({ plan, credits, amount, nextBillingAt }) {
  const planLabel = plan === "sub_pro" ? "Pro" : "Basic";
  const next = new Date(nextBillingAt).toLocaleDateString("ko-KR");
  return `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0e1512;color:#e0e0e0;border-radius:12px">
  <div style="font-size:12px;font-weight:700;letter-spacing:3px;color:#C8A84B;margin-bottom:20px">HELLO LOGLINES</div>
  <h2 style="font-size:20px;margin:0 0 12px;color:#4ECCA3">구독이 시작되었습니다</h2>
  <p style="font-size:14px;line-height:1.7;color:#aaa">
    <strong style="color:#e0e0e0">${planLabel} 플랜</strong>에 가입해주셔서 감사합니다.<br>
    <strong style="color:#A78BFA">${credits}cr</strong>이 즉시 충전되었습니다.
  </p>
  <div style="margin:20px 0;padding:14px 16px;background:rgba(78,204,163,0.08);border:1px solid rgba(78,204,163,0.2);border-radius:8px;font-size:13px">
    <div>결제 금액: <strong style="color:#e0e0e0">${amount.toLocaleString()}원/월</strong></div>
    <div style="margin-top:4px">다음 결제일: <strong style="color:#e0e0e0">${next}</strong></div>
  </div>
</div>`;
}
