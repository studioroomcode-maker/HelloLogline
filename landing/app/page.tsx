const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.hellologlines.com";

const FEATURES = [
  { icon: "◈", color: "#C8A84B", title: "18개 기준 즉시 점수화", desc: "주인공 구체성, 아이러니/훅, 정보 격차 등 학술적으로 검증된 18개 항목을 AI가 0.5초 안에 채점합니다." },
  { icon: "◉", color: "#A78BFA", title: "12개 학술 이론 분석",   desc: "블레이크 스나이더 비트 시트, 융의 그림자 이론, 바르트 서사 코드 등 세계 유수 시나리오 이론을 적용합니다." },
  { icon: "◎", color: "#4ECCA3", title: "8단계 파이프라인",      desc: "로그라인 → 개념 분석 → 캐릭터 → 시놉시스 → 트리트먼트 → 초고 → 커버리지 → 고쳐쓰기까지 원스톱." },
  { icon: "◇", color: "#60A5FA", title: "전문가 패널 리뷰",       desc: "PD, 작가, 평론가 등 역할별 AI 전문가 6인의 시각으로 작품의 강점과 약점을 입체적으로 파악합니다." },
];

const STAGES = [
  { num: "01", name: "로그라인 분석",   color: "#C8A84B", desc: "18개 항목 채점 + 개선 제안" },
  { num: "02", name: "개념·이론 분석", color: "#A78BFA", desc: "신화 구조 · 바르트 · 학술 분석" },
  { num: "03", name: "캐릭터 개발",    color: "#60A5FA", desc: "그림자 · 진정성 · 캐릭터 아크" },
  { num: "04", name: "시놉시스",        color: "#4ECCA3", desc: "구조 분석 · 3개 방향 시놉시스" },
  { num: "05", name: "트리트먼트",      color: "#FFD166", desc: "비트 시트 + 장면별 대사 개발" },
  { num: "06", name: "시나리오 초고",   color: "#E85D75", desc: "Field · McKee · Snyder 형식" },
  { num: "07", name: "Script Coverage", color: "#45B7D1", desc: "시장 가치 + 커버리지 리포트" },
  { num: "08", name: "고쳐쓰기",        color: "#98D8C8", desc: "부분·전체 재작성 + 리라이트 가이드" },
];

const TESTIMONIALS = [
  { name: "김지은", role: "드라마 작가 (SBS 납품)", text: "로그라인 단계에서 '정보 격차' 점수가 낮다는 걸 알고 첫 문장을 수정했더니 피칭 통과율이 달라졌어요." },
  { name: "박현우", role: "독립영화 감독", text: "블레이크 스나이더 비트 시트를 AI가 자동 생성해주는 건 처음 봤습니다. 개발 기간이 3분의 1로 줄었어요." },
  { name: "이수진", role: "제작사 개발팀장", text: "팀원 5명이 각자 로그라인을 분석하고 비교 기능으로 최선안을 선택합니다. B2B 플랜으로 사용 중입니다." },
];

const PLANS = [
  { name: "무료",    price: "0원",        period: "",       color: "#4ECCA3", features: ["크레딧 10개", "Stage 1 로그라인 분석", "분석 결과 저장 (1개)"],                  cta: "무료 시작", highlight: false },
  { name: "프리미엄", price: "29,900원",   period: "/월",    color: "#C8A84B", features: ["월 100 크레딧", "8단계 전체 기능", "무제한 프로젝트 저장", "버전 히스토리"], cta: "프리미엄 시작", highlight: true },
  { name: "팀 5인",  price: "99,000원",   period: "/월",    color: "#A78BFA", features: ["월 500 크레딧 공유 풀", "팀 프로젝트 공유", "관리자 크레딧 관리", "비교 분석 대시보드", "팀 청구서 발행"], cta: "팀 문의", highlight: false },
];

export default function LandingPage() {
  return (
    <main>
      {/* ── Nav ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(12,12,28,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#C8A84B", letterSpacing: -0.3 }}>Hello Loglines</div>
        <a href={APP_URL} style={{ padding: "8px 20px", borderRadius: 8, background: "#C8A84B", color: "#0c0c1c", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
          무료로 시작하기 →
        </a>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "96px 24px 72px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(200,168,75,0.35)", background: "rgba(200,168,75,0.07)", fontSize: 12, color: "#C8A84B", fontWeight: 700, marginBottom: 24, letterSpacing: 0.5 }}>
          <span aria-hidden="true">🇰🇷</span> 한국 시나리오·드라마 포맷에 최적화된 AI 워크스테이션
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 54px)", fontWeight: 900, lineHeight: 1.2, color: "#f0f0f4", marginBottom: 20, letterSpacing: -1 }}>
          로그라인 한 줄에서<br />
          <span style={{ color: "#C8A84B" }}>시나리오 초고</span>까지
        </h1>
        <p style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(240,240,244,0.6)", lineHeight: 1.7, marginBottom: 28, maxWidth: 620, margin: "0 auto 28px" }}>
          영문 툴을 억지로 한국어로 쓰던 시대는 끝. <strong style={{ color: "#f0f0f4", fontWeight: 700 }}>미니시리즈 16부작·8부작·단편·공모전 분량</strong>의
          한국형 서사 구조와 대사 톤을 이해하는 AI가 <strong style={{ color: "#f0f0f4", fontWeight: 700 }}>18개 항목 즉시 채점</strong>부터
          <strong style={{ color: "#f0f0f4", fontWeight: 700 }}> 8단계 초고 완성</strong>까지 함께합니다.
        </p>

        {/* 차별점 3대 핵심 (경쟁사 대비) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, maxWidth: 680, margin: "0 auto 36px" }}>
          {[
            { label: "국내 방송·영화 포맷 프리셋", sub: "16부작·미니·단편·공모전" },
            { label: "한국어 뉘앙스·대사 톤 학습", sub: "번역체 없는 자연스러운 문장" },
            { label: "Toss 결제·국내 CS", sub: "원화 결제·환불·고객지원" },
          ].map(({ label, sub }) => (
            <div key={label} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(78,204,163,0.22)", background: "rgba(78,204,163,0.04)", textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#4ECCA3", marginBottom: 3 }}>✓ {label}</div>
              <div style={{ fontSize: 11, color: "rgba(240,240,244,0.5)" }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={APP_URL} style={{ padding: "14px 32px", borderRadius: 12, background: "#C8A84B", color: "#0c0c1c", fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 24px rgba(200,168,75,0.35)" }}>
            무료로 시작하기
          </a>
          <a href="#features" style={{ padding: "14px 28px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(240,240,244,0.7)", fontSize: 15, textDecoration: "none" }}>
            기능 살펴보기 ↓
          </a>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>신용카드 불필요 · 무료 크레딧 10개 즉시 지급 · 해외 툴과 달리 원화·세금계산서 가능</p>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(200,168,75,0.7)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>핵심 기능</div>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, color: "#f0f0f4", letterSpacing: -0.5 }}>전문 시나리오 작가의 도구를<br />누구나 사용할 수 있도록</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ padding: "28px 24px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 24, color: f.color, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f4", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "rgba(240,240,244,0.5)", lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 8단계 파이프라인 ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(167,139,250,0.7)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>워크플로우</div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: "#f0f0f4" }}>8단계 개발 파이프라인</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {STAGES.map((s, i) => (
            <div key={s.num} style={{ padding: "18px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}22`, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: s.color, fontFamily: "monospace", minWidth: 24 }}>{s.num}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f4", marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "rgba(240,240,244,0.45)" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 후기 ── */}
      <section style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(78,204,163,0.7)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>사용 후기</div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: "#f0f0f4" }}>현업 작가와 제작자가 선택했습니다</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ padding: "28px 24px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 22, color: "#C8A84B", marginBottom: 14, fontWeight: 800 }}>"</div>
                <p style={{ fontSize: 13, color: "rgba(240,240,244,0.7)", lineHeight: 1.8, marginBottom: 16 }}>{t.text}</p>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f4" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(240,240,244,0.4)" }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 가격표 ── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(96,165,250,0.7)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>가격</div>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: "#f0f0f4" }}>투명한 가격, 유연한 플랜</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, alignItems: "start" }}>
          {PLANS.map(p => (
            <div key={p.name} style={{ padding: "32px 28px", borderRadius: 18, background: p.highlight ? `${p.color}0d` : "rgba(255,255,255,0.025)", border: `${p.highlight ? 2 : 1}px solid ${p.highlight ? p.color + "55" : "rgba(255,255,255,0.07)"}`, position: "relative" }}>
              {p.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "3px 14px", borderRadius: 20, background: p.color, color: "#0c0c1c", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>가장 인기</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 8 }}>{p.name}</div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#f0f0f4" }}>{p.price}</span>
                <span style={{ fontSize: 13, color: "rgba(240,240,244,0.4)" }}>{p.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(240,240,244,0.7)", marginBottom: 10 }}>
                    <span style={{ color: p.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href={p.name === "팀 5인" ? "mailto:contact@hellologlines.com" : APP_URL} style={{ display: "block", padding: "12px 0", borderRadius: 10, background: p.highlight ? p.color : "transparent", border: p.highlight ? "none" : `1.5px solid ${p.color}55`, color: p.highlight ? "#0c0c1c" : p.color, textAlign: "center", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "linear-gradient(135deg, rgba(200,168,75,0.08) 0%, rgba(167,139,250,0.06) 100%)", borderTop: "1px solid rgba(200,168,75,0.15)", padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 900, color: "#f0f0f4", marginBottom: 16 }}>오늘 로그라인을 입력해보세요</h2>
        <p style={{ fontSize: 15, color: "rgba(240,240,244,0.5)", marginBottom: 36 }}>18개 항목 분석 결과를 10초 안에 받아보세요. 신용카드 없이 무료 시작.</p>
        <a href={APP_URL} style={{ padding: "16px 40px", borderRadius: 14, background: "#C8A84B", color: "#0c0c1c", fontSize: 16, fontWeight: 900, textDecoration: "none", display: "inline-block", boxShadow: "0 6px 32px rgba(200,168,75,0.4)" }}>
          무료로 시작하기 →
        </a>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B", marginBottom: 8 }}>Hello Loglines</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} Studio Room · <a href="mailto:contact@hellologlines.com" style={{ color: "inherit" }}>contact@hellologlines.com</a>
        </div>
      </footer>
    </main>
  );
}
