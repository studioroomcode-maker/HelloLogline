/**
 * First-visit welcome overlay extracted from LoglineAnalyzer.
 */
export default function WelcomePanel({ isMobile, activateDemo, applyExampleLogline, dismissFirstVisit }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 16 : 24 }}>
      <div style={{ maxWidth: 600, width: "100%", background: "var(--bg-surface)", border: "1px solid rgba(78,204,163,0.25)", borderRadius: 20, padding: isMobile ? "24px 20px" : "36px 40px", overflowY: "auto", maxHeight: "90vh" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "var(--text-main)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.5, marginBottom: 8 }}>
            Hello<span style={{ color: "#4ECCA3" }}>Logline</span>
          </div>
          <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--c-tx-55)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
            로그라인 한 줄로 시작하는 <strong style={{ color: "var(--c-tx-75)" }}>8단계 시나리오 개발 워크스테이션</strong><br />
            아리스토텔레스부터 블레이크 스나이더까지, 학술 이론이 AI로 작동합니다
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, textAlign: "center" }}>8단계 파이프라인</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { num: "01", name: "로그라인", desc: "18개 기준으로 점수 평가", color: "#C8A84B" },
              { num: "02", name: "개념 분석", desc: "이야기 방향·신화구조 설계", color: "#45B7D1" },
              { num: "03", name: "캐릭터", desc: "주인공 심리·욕구·상처 설계", color: "#FB923C" },
              { num: "04", name: "시놉시스", desc: "3막 구조·시놉시스 생성", color: "#4ECCA3" },
              { num: "05", name: "트리트먼트", desc: "씬 구성·비트시트·대사", color: "#FFD166" },
              { num: "06", name: "시나리오 초고", desc: "완성된 초고 자동 생성", color: "#A78BFA" },
              { num: "07", name: "Script Coverage", desc: "작품 심사 + 시장 가치", color: "#60A5FA" },
              { num: "08", name: "고쳐쓰기", desc: "진단 → 부분·전체 개고", color: "#FB923C" },
            ].map(s => (
              <div key={s.num} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(var(--tw),0.03)", border: "1px solid var(--c-bd-1)", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: s.color, fontWeight: 700, marginBottom: 4 }}>{s.num}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-tx-70)", marginBottom: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>{s.name}</div>
                <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 28, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {[
            { icon: "🎯", text: "로그라인을 18개 기준으로 점수화 + AI 개선안" },
            { icon: "🧠", text: "주인공 심리·욕구·내적 갈등 자동 설계" },
            { icon: "📝", text: "트리트먼트·15비트·대사까지 한 번에" },
            { icon: "✍️", text: "초고 생성 → Coverage 심사 → 고쳐쓰기 완결" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif" }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.15)" }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>
            💡 <strong style={{ color: "var(--c-tx-65)" }}>Anthropic API 키</strong>가 필요합니다. <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: "#4ECCA3", textDecoration: "none" }}>console.anthropic.com</a>에서 무료로 발급받으세요. 키는 이 브라우저에만 저장됩니다.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <button
            onClick={activateDemo}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #4ECCA3, #45B7D1)", color: "#0d0d1a", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            API 키 없이 데모 체험하기
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={applyExampleLogline}
              style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(78,204,163,0.35)", background: "rgba(78,204,163,0.08)", color: "#4ECCA3", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              예시 로그라인으로 시작
            </button>
            <button
              onClick={dismissFirstVisit}
              style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1px solid var(--c-bd-4)", background: "transparent", color: "var(--c-tx-45)", fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              직접 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
