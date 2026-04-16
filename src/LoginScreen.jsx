import { useState } from "react";

const PROVIDERS = [
  {
    key: "kakao",
    label: "카카오로 계속하기",
    bg: "#FEE500",
    hoverBg: "#f5dc00",
    color: "#000000",
    Logo: () => (
      <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5C4.857 1.5 1.5 4.086 1.5 7.25c0 2.06 1.32 3.866 3.32 4.9L3.97 15.303c-.073.273.224.491.455.333L8.19 13.127c.261.023.527.035.81.035 4.143 0 7.5-2.586 7.5-5.75C16.5 4.086 13.143 1.5 9 1.5z" fill="#000000"/>
      </svg>
    ),
  },
  {
    key: "google",
    label: "Google로 계속하기",
    bg: "#ffffff",
    hoverBg: "#f5f5f5",
    color: "#1f1f1f",
    border: "1px solid rgba(0,0,0,0.15)",
    Logo: () => (
      <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.66 14.013 17.64 11.706 17.64 9.2z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    key: "naver",
    label: "네이버로 계속하기",
    bg: "#03C75A",
    hoverBg: "#02b350",
    color: "#ffffff",
    Logo: () => (
      <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <path d="M10.35 9.27L7.65 5.4H5.4v7.2h2.25V8.73L10.35 12.6H12.6V5.4h-2.25v3.87z" fill="#ffffff"/>
      </svg>
    ),
  },
];

export default function LoginScreen({ onDemo, authError }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-main)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Noto Sans KR', sans-serif", padding: "24px",
    }}>
      {/* Branding */}
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
          color: "#C8A84B", letterSpacing: 3, marginBottom: 16, opacity: 0.75,
        }}>HELLO LOGLINES</div>
        <div style={{
          fontSize: 30, fontWeight: 900, color: "var(--text-main)",
          lineHeight: 1.2, marginBottom: 14, letterSpacing: -0.5,
        }}>
          시나리오 개발<br/>워크스테이션
        </div>
        <div style={{ fontSize: 13, color: "var(--c-tx-40)", lineHeight: 1.7, maxWidth: 300 }}>
          AI 기반 로그라인 분석부터<br/>비트시트 · 시나리오 초고까지
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 360,
        background: "var(--bg-surface)", border: "1px solid var(--c-bd-3)",
        borderRadius: 20, padding: "32px 28px",
        boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>로그인</div>
        <div style={{ fontSize: 12, color: "var(--c-tx-35)", marginBottom: 22 }}>소셜 계정으로 시작하세요</div>

        {authError && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)",
            fontSize: 12, color: "#E85D75",
          }}>
            {authError === "csrf"
              ? "보안 검증에 실패했습니다. 다시 로그인해주세요. (CSRF)"
              : "로그인에 실패했습니다. 다시 시도해주세요."}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PROVIDERS.map(({ key, label, bg, hoverBg, color, border, Logo }) => (
            <button
              key={key}
              onClick={() => { window.location.href = `/auth/${key}`; }}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "13px 20px", borderRadius: 12, cursor: "pointer",
                background: hovered === key ? hoverBg : bg,
                color, border: border || "none",
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: 14, fontWeight: 600, transition: "all 0.15s",
                boxShadow: hovered === key ? "0 4px 14px rgba(0,0,0,0.18)" : "0 2px 6px rgba(0,0,0,0.08)",
              }}
            >
              <Logo />
              {label}
            </button>
          ))}
        </div>

        <div style={{ margin: "22px 0 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--c-bd-2)" }} />
          <span style={{ fontSize: 11, color: "var(--c-tx-25)" }}>또는</span>
          <div style={{ flex: 1, height: 1, background: "var(--c-bd-2)" }} />
        </div>

        <button
          onClick={onDemo}
          onMouseEnter={() => setHovered("demo")}
          onMouseLeave={() => setHovered(null)}
          style={{
            width: "100%", padding: "12px", borderRadius: 12, cursor: "pointer",
            background: hovered === "demo" ? "rgba(200,168,75,0.12)" : "rgba(200,168,75,0.06)",
            border: "1px solid rgba(200,168,75,0.25)", color: "#C8A84B",
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          로그인 없이 데모 체험하기
        </button>
        <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: "var(--c-tx-35)", lineHeight: 1.9, fontFamily: "'Noto Sans KR', sans-serif" }}>
          처음 이용하신다면 여기서 시작하세요<br />
          로그인 없이 로그라인 분석부터 시나리오 초고까지<br />
          전 과정을 체험할 수 있습니다
        </div>
      </div>

      {/* Privacy assurance */}
      <div style={{
        marginTop: 16, width: "100%", maxWidth: 360,
        padding: "12px 16px", borderRadius: 12,
        background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.15)",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(78,204,163,0.8)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <div style={{ fontSize: 11, color: "var(--c-tx-40)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif" }}>
          <span style={{ color: "rgba(78,204,163,0.85)", fontWeight: 700 }}>여러분의 아이디어는 절대 저장되지 않습니다.</span><br />
          입력하신 내용은 분석 즉시 처리 후 폐기되며,<br />
          아이디어의 안전이 보장됩니다.
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "var(--c-tx-20)", textAlign: "center" }}>
        로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
      </div>
    </div>
  );
}
