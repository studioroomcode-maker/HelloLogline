import { useEffect, useState } from "react";

const STORAGE_KEY = "hll_welcomed_v1";

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={close}>
      <div onClick={e => e.stopPropagation()} style={{
        maxWidth: 480, width: "100%",
        background: "var(--bg-surface)",
        border: "1px solid rgba(200,168,75,0.3)",
        borderRadius: 20, overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {/* 헤더 */}
        <div style={{ padding: "24px 28px 0" }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: "rgba(200,168,75,0.7)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>AI 시나리오 워크스테이션</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", lineHeight: 1.3 }}>
            로그라인 한 줄로<br />
            <span style={{ color: "#C8A84B" }}>시나리오를 완성하세요</span>
          </div>
        </div>

        {/* 3단계 설명 */}
        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { step: "01", icon: "✏️", title: "로그라인 입력", desc: "한 줄 아이디어만 있으면 됩니다. 18개 항목으로 즉시 점수를 매깁니다." },
            { step: "02", icon: "🔬", title: "8단계 심층 개발", desc: "캐릭터·구조·트리트먼트·비트시트까지 학술 이론 기반으로 자동 설계합니다." },
            { step: "03", icon: "📋", title: "Script Coverage 판정", desc: "실제 방송사·제작사 심사 방식으로 RECOMMEND / CONSIDER / PASS 판정을 받습니다." },
          ].map(item => (
            <div key={item.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-45)", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 무료 안내 */}
        <div style={{ margin: "0 28px 20px", padding: "10px 14px", borderRadius: 10, background: "rgba(78,204,163,0.06)", border: "1px solid rgba(78,204,163,0.2)" }}>
          <div style={{ fontSize: 12, color: "#4ECCA3" }}>✓ <strong>로그라인 기본 분석은 무료</strong>입니다. 지금 바로 시작해보세요.</div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 28px 24px" }}>
          <button onClick={close} style={{
            width: "100%", padding: "14px", borderRadius: 12,
            border: "none", background: "linear-gradient(135deg, #C8A84B, #E8C86A)",
            color: "#1a1a1a", fontSize: 14, fontWeight: 800,
            cursor: "pointer", letterSpacing: 0.3,
          }}>
            시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
