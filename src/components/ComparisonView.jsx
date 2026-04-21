import { LABELS_KR } from "../constants.js";

const CRITERIA_ORDER = [
  "protagonist", "inciting_incident", "goal", "conflict", "stakes",
  "irony", "mental_picture", "emotional_hook", "originality", "conciseness",
  "active_language", "no_violations", "genre_tone", "information_gap",
  "cognitive_dissonance", "narrative_transportation", "universal_relatability", "unpredictability",
];

const COL_A = "#C8A84B";
const COL_B = "#A78BFA";

function ScoreBar({ scoreA, scoreB, label }) {
  const maxScore = 5;
  const pctA = (scoreA ?? 0) / maxScore * 100;
  const pctB = (scoreB ?? 0) / maxScore * 100;
  const delta = (scoreB ?? 0) - (scoreA ?? 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 28px 1fr 36px", alignItems: "center", gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 10, color: "var(--c-tx-45)", textAlign: "right", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.3 }}>{label}</span>
      {/* Bar A (right-aligned) */}
      <div style={{ height: 8, borderRadius: 4, background: "rgba(200,168,75,0.08)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${pctA}%`, background: COL_A, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
      {/* Center score */}
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: delta > 0 ? COL_B : delta < 0 ? "#E85D75" : "var(--c-tx-30)", fontWeight: 700 }}>
          {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
        </span>
      </div>
      {/* Bar B (left-aligned) */}
      <div style={{ height: 8, borderRadius: 4, background: "rgba(167,139,250,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${pctB}%`, height: "100%", background: COL_B, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
      {/* Score B */}
      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: COL_B }}>{scoreB ?? "—"}/5</span>
    </div>
  );
}

function RadarChart({ scoresA, scoresB, size = 200 }) {
  const keys = CRITERIA_ORDER.filter(k => scoresA?.[k] !== undefined || scoresB?.[k] !== undefined).slice(0, 12);
  const n = keys.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;
  const maxVal = 5;

  function point(i, value) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    const dist = (value / maxVal) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  }

  function labelPoint(i) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    const dist = r + 14;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  }

  function polygonPath(scores, color) {
    const pts = keys.map((k, i) => point(i, scores?.[k] ?? 0));
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
    return <path d={d} fill={color + "33"} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />;
  }

  // Grid rings at 1,2,3,4,5
  const rings = [1, 2, 3, 4, 5].map(v => {
    const pts = keys.map((_, i) => point(i, v));
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
    return <path key={v} d={d} fill="none" stroke="rgba(var(--tw),0.08)" strokeWidth={v === 5 ? 1 : 0.5} />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto" }}>
      {/* Grid */}
      {rings}
      {keys.map((_, i) => {
        const p = point(i, 5);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(var(--tw),0.06)" strokeWidth={0.5} />;
      })}
      {/* Data polygons */}
      {polygonPath(scoresA, COL_A)}
      {polygonPath(scoresB, COL_B)}
      {/* Labels */}
      {keys.map((k, i) => {
        const lp = labelPoint(i);
        const label = (LABELS_KR[k] || k).replace("(Stakes)", "").replace("인지적 ", "").replace("보편적 ", "");
        return (
          <text key={k} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 7, fontFamily: "'Noto Sans KR', sans-serif", fill: "var(--c-tx-40)" }}>
            {label.length > 6 ? label.slice(0, 6) + "…" : label}
          </text>
        );
      })}
    </svg>
  );
}

export default function ComparisonView({ projectA, projectB, onClose }) {
  const scoresA = projectA?.result?.scores ?? {};
  const scoresB = projectB?.result?.scores ?? {};

  const totalA = Object.values(scoresA).reduce((s, v) => s + (v ?? 0), 0);
  const totalB = Object.values(scoresB).reduce((s, v) => s + (v ?? 0), 0);
  const maxPossible = CRITERIA_ORDER.length * 5;

  const hasData = Object.keys(scoresA).length > 0 || Object.keys(scoresB).length > 0;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 499 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 500, width: "min(780px, 96vw)", maxHeight: "90vh",
        background: "var(--bg-surface)", border: "1px solid var(--c-bd-4)", borderRadius: 18,
        display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>분석 결과 비교</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {/* Project titles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: COL_A, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>원본 A</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)", marginBottom: 4 }}>{projectA?.title || "제목 없음"}</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.5 }}>{projectA?.logline?.slice(0, 60) || "—"}…</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 8px" }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-30)" strokeWidth={2} strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: COL_B, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>분기 B</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)", marginBottom: 4 }}>{projectB?.title || "제목 없음"}</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.5 }}>{projectB?.logline?.slice(0, 60) || "—"}…</div>
            </div>
          </div>

          {!hasData && (
            <div style={{ textAlign: "center", color: "var(--c-tx-35)", fontSize: 13, padding: "40px 0" }}>
              두 프로젝트 모두 Stage 1 분석 결과가 있어야 비교할 수 있습니다.
            </div>
          )}

          {hasData && (
            <>
              {/* 총점 요약 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[{ proj: projectA, scores: scoresA, total: totalA, col: COL_A, label: "원본 A" },
                  { proj: projectB, scores: scoresB, total: totalB, col: COL_B, label: "분기 B" }].map(({ label, scores, total, col }) => (
                  <div key={label} style={{ padding: "14px 16px", borderRadius: 10, background: `${col}08`, border: `1px solid ${col}25`, textAlign: "center" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label} 총점</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: col, fontFamily: "'JetBrains Mono', monospace" }}>
                      {total}<span style={{ fontSize: 12, opacity: 0.6 }}>/{maxPossible}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginTop: 4 }}>
                      평균 {(total / Math.max(Object.keys(scores).length, 1)).toFixed(1)} / 5
                    </div>
                  </div>
                ))}
              </div>

              {/* 레이더 차트 */}
              <div style={{ marginBottom: 24, padding: "16px 0", borderRadius: 12, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 12 }}>레이더 차트 (상위 12개 항목)</div>
                <RadarChart scoresA={scoresA} scoresB={scoresB} size={260} />
                <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
                  {[{ col: COL_A, label: "원본 A" }, { col: COL_B, label: "분기 B" }].map(({ col, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: col + "55", border: `1.5px solid ${col}` }} />
                      <span style={{ fontSize: 10, color: "var(--c-tx-45)" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 항목별 상세 비교 */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 28px 1fr 36px", gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--c-bd-1)" }}>
                  <div />
                  <div style={{ fontSize: 9, fontWeight: 700, color: COL_A, textAlign: "center", textTransform: "uppercase" }}>원본 A ←</div>
                  <div style={{ fontSize: 9, color: "var(--c-tx-25)", textAlign: "center" }}>Δ</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: COL_B, textTransform: "uppercase" }}>→ 분기 B</div>
                  <div />
                </div>
                {CRITERIA_ORDER.map(key => {
                  const labelKr = LABELS_KR[key] || key;
                  const a = scoresA[key];
                  const b = scoresB[key];
                  if (a === undefined && b === undefined) return null;
                  return <ScoreBar key={key} label={labelKr} scoreA={a ?? 0} scoreB={b ?? 0} />;
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
