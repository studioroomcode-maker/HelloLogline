// ─────────────────────────────────────────────
// Script Coverage 패널 + Valuation 패널 (lazy-loaded)
// ─────────────────────────────────────────────

export function ScriptCoveragePanel({ data, isMobile }) {
  const REC_COLOR = { "STRONG PASS": "#4ECCA3", "RECOMMEND": "#60A5FA", "CONSIDER": "#FFD166", "PASS": "#E85D75" };
  const recColor = REC_COLOR[data.recommendation] || "#aaa";
  const gradeColor = (g) => ({ A: "#4ECCA3", B: "#60A5FA", C: "#FFD166", D: "#F7A072", F: "#E85D75" }[g] || "#aaa");
  const scoreKeys = [
    { key: "premise", label: "전제 (Premise)" },
    { key: "story", label: "이야기 (Story)" },
    { key: "character", label: "인물 (Character)" },
    { key: "dialogue_potential", label: "대사 잠재력" },
    { key: "setting", label: "세계관 (Setting)" },
    { key: "marketability", label: "시장성 (Marketability)" },
  ];
  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(var(--tw),0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.title_suggestion || "제목 미정"}</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{data.format} | {data.genre}</div>
        </div>
        <div style={{ textAlign: "center", padding: "8px 18px", borderRadius: 10, border: `2px solid ${recColor}`, background: `${recColor}12` }}>
          <div style={{ fontSize: 11, color: recColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{data.recommendation}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: recColor, fontFamily: "'JetBrains Mono', monospace" }}>{data.overall_score}/10</div>
        </div>
      </div>
      {/* 항목별 점수 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {scoreKeys.map(({ key, label }) => {
          const s = data.scores?.[key]; if (!s) return null;
          return (
            <div key={key} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: gradeColor(s.grade), fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{s.grade}</span>
                  <span style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace" }}>{s.score}/10</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "var(--c-bd-1)", marginBottom: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.score * 10}%`, background: gradeColor(s.grade), borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>{s.comment}</div>
            </div>
          );
        })}
      </div>
      {/* 강점·약점 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {data.strengths?.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(78,204,163,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>STRENGTHS</div>
            {data.strengths.map((s, i) => <div key={i} style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>✓ {s}</div>)}
          </div>
        )}
        {data.weaknesses?.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(232,93,117,0.2)", background: "rgba(232,93,117,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(232,93,117,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>WEAKNESSES</div>
            {data.weaknesses.map((s, i) => <div key={i} style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>✗ {s}</div>)}
          </div>
        )}
      </div>
      {[
        { label: "비교 작품", val: data.comparable_works?.join(" / "), c: "#A78BFA" },
        { label: "추천 플랫폼", val: data.target_platform, c: "#60A5FA" },
        { label: "리더 총평", val: data.reader_comment, c: "#FFD166" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

export function ValuationPanel({ data, isMobile }) {
  if (!data) return null;

  const scoreColor = (score) => {
    if (score >= 80) return "#4ECCA3";
    if (score >= 65) return "#60A5FA";
    if (score >= 50) return "#FFD166";
    if (score >= 35) return "#F7A072";
    return "#E85D75";
  };

  const fmt = (n) => {
    if (!n && n !== 0) return "미정";
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억원`;
    if (n >= 10000000) return `${(n / 10000000).toFixed(0)}천만원`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(0)}백만원`;
    return `${n.toLocaleString()}원`;
  };

  const fmtUsd = (n) => {
    if (!n && n !== 0) return "미정";
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const sc = scoreColor(data.completion_score);
  const bd = data.completion_breakdown || {};
  const breakdownKeys = [
    { key: "premise_originality", label: "전제 독창성", max: 30 },
    { key: "structural_potential", label: "구조 완성 가능성", max: 25 },
    { key: "character_depth_potential", label: "캐릭터 심리 깊이", max: 25 },
    { key: "market_potential", label: "시장성 잠재력", max: 20 },
  ];

  const km = data.korean_market || {};
  const um = data.us_market || {};

  return (
    <div>
      {/* 완성도 점수 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 20, marginBottom: 20,
        padding: "16px 18px", borderRadius: 12,
        background: `${sc}08`, border: `1px solid ${sc}30`,
      }}>
        {/* 원형 점수 */}
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={36} cy={36} r={30} fill="none" stroke="var(--c-bd-1)" strokeWidth={6} />
            <circle cx={36} cy={36} r={30} fill="none" stroke={sc} strokeWidth={6}
              strokeDasharray={`${2 * Math.PI * 30 * data.completion_score / 100} ${2 * Math.PI * 30}`}
              strokeLinecap="round" />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: sc, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
              {data.completion_score}
            </div>
            <div style={{ fontSize: 8, color: "var(--c-tx-40)", marginTop: 1 }}>/ 100</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: sc, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>
            {data.completion_label}
          </div>
          <div style={{ fontSize: 11, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {data.market_tier}
          </div>
        </div>
      </div>

      {/* 세부 점수 */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-40)", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>완성도 세부 평가</div>
        {breakdownKeys.map(({ key, label, max }) => {
          const item = bd[key] || {};
          const score = item.score ?? 0;
          const pct = Math.round(score / max * 100);
          const c = scoreColor(pct);
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{score}/{max}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", overflow: "hidden", marginBottom: 4 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 2, transition: "width 0.6s ease" }} />
              </div>
              {item.comment && (
                <div style={{ fontSize: 10, color: "var(--c-tx-40)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{item.comment}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 한국 시장 가격 */}
      <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(255,209,102,0.05)", border: "1px solid rgba(255,209,102,0.2)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#FFD166", letterSpacing: 0.5, marginBottom: 10 }}>한국 시장 예상 가격</div>
        {km.format_assumed && (
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif" }}>
            기준 포맷: {km.format_assumed}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {km.option_price && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif" }}>옵션 계약 (개발 단계)</div>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", marginTop: 1, fontFamily: "'Noto Sans KR', sans-serif" }}>{km.option_price.basis}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFD166", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>
                {fmt(km.option_price.min_krw)} ~ {fmt(km.option_price.max_krw)}
              </div>
            </div>
          )}
          {km.full_price_rookie && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 6, borderTop: "1px solid var(--c-card-3)" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif" }}>신인 작가 기준</div>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", marginTop: 1, fontFamily: "'Noto Sans KR', sans-serif" }}>{km.full_price_rookie.basis}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,209,102,0.7)", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>
                {fmt(km.full_price_rookie.min_krw)} ~ {fmt(km.full_price_rookie.max_krw)}
              </div>
            </div>
          )}
          {km.full_price_experienced && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 6, borderTop: "1px solid var(--c-card-3)" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif" }}>경력 작가 기준</div>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", marginTop: 1, fontFamily: "'Noto Sans KR', sans-serif" }}>{km.full_price_experienced.basis}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFD166", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>
                {fmt(km.full_price_experienced.min_krw)} ~ {fmt(km.full_price_experienced.max_krw)}
              </div>
            </div>
          )}
        </div>
        {km.recommended_buyers && km.recommended_buyers.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--c-card-3)" }}>
            <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 5 }}>추천 바이어</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {km.recommended_buyers.map((b, i) => (
                <span key={i} style={{ padding: "2px 8px", borderRadius: 5, background: "rgba(255,209,102,0.1)", color: "#FFD166", fontSize: 10, fontWeight: 600 }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
        {km.price_rationale && (
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {km.price_rationale}
          </div>
        )}
      </div>

      {/* 미국 시장 */}
      {(um.wga_minimum || um.spec_market_estimate) && (
        <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.15)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: 0.5, marginBottom: 10 }}>미국 시장 참고 (USD)</div>
          {um.format_assumed && (
            <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif" }}>기준: {um.format_assumed}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {um.wga_minimum && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>WGA 최저 기준</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtUsd(um.wga_minimum.min_usd)} ~ {fmtUsd(um.wga_minimum.max_usd)}
                </div>
              </div>
            )}
            {um.spec_market_estimate && (
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid var(--c-card-3)" }}>
                <div style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>스펙 시장 추정가</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtUsd(um.spec_market_estimate.min_usd)} ~ {fmtUsd(um.spec_market_estimate.max_usd)}
                </div>
              </div>
            )}
          </div>
          {um.us_market_feasibility && (
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
              {um.us_market_feasibility}
            </div>
          )}
        </div>
      )}

      {/* 가치 요인 */}
      {(data.factors_boosting_value?.length > 0 || data.factors_reducing_value?.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {data.factors_boosting_value?.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", marginBottom: 7 }}>가치 상승 요인</div>
              {data.factors_boosting_value.map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--c-tx-60)", marginBottom: 4, lineHeight: 1.4, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  + {f}
                </div>
              ))}
            </div>
          )}
          {data.factors_reducing_value?.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#E85D75", marginBottom: 7 }}>가치 하락 요인</div>
              {data.factors_reducing_value.map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--c-tx-60)", marginBottom: 4, lineHeight: 1.4, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  - {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 개발 권고 */}
      {data.development_recommendation && (
        <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 9, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", marginBottom: 6, letterSpacing: 0.5 }}>가치를 높이려면</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {data.development_recommendation}
          </div>
        </div>
      )}

      {/* 비교 거래 사례 */}
      {data.comparable_deals?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-30)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>비교 거래 사례</div>
          {data.comparable_deals.map((deal, i) => (
            <div key={i} style={{ marginBottom: 6, padding: "9px 12px", borderRadius: 7, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>
                {deal.title}
              </div>
              <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                {deal.deal_info}
              </div>
              {deal.relevance && (
                <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {deal.relevance}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 면책 */}
      {data.disclaimer && (
        <div style={{ padding: "8px 12px", borderRadius: 7, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-card-3)" }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
            ⚠ {data.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
