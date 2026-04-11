import { useRef, useEffect } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, Spinner, DocButton } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import {
  CRITERIA_GUIDE, LABELS_KR, GENRES, DURATION_OPTIONS, EXAMPLE_LOGLINES,
} from "../constants.js";
import { calcSectionTotal } from "../utils.js";
import {
  RadarChart, CircleGauge, ScoreBar, CompareSection,
  ExportButton, ImprovementPanel, StoryDevPanel, AcademicPanel,
} from "../panels.jsx";

/* ─── Tooltip wrapper (simplified — no pop-up, just renders children) ─── */
function Tooltip({ text, children, maxWidth = 300 }) {
  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
      {children}
    </div>
  );
}

export default function Stage1Content({
  // analysis
  result, setResult,
  loading, error,
  analyze,
  // compare mode
  compareMode, setCompareMode,
  logline2, setLogline2,
  result2, loading2,
  // duration
  selectedDuration, setSelectedDuration,
  customTheme, setCustomTheme,
  customDurationText, setCustomDurationText,
  customFormatLabel, setCustomFormatLabel,
  // tabs
  activeTab, setActiveTab,
  // insight
  insightResult, insightLoading, insightError,
  generateInsight,
  // early coverage
  earlyCoverageResult, setEarlyCoverageResult,
  earlyCoverageLoading, earlyCoverageError,
  analyzeEarlyCoverage,
  // story dev
  setStoryFixes, setStoryPivots, setAiImprovement,
  // academic (for tabs)
  academicResult,
  // api
  apiKey, serverHasKey,
}) {
  const {
    logline, setLogline,
    genre, setGenre,
    isMobile, cc,
    getStageStatus, advanceToStage,
    openApplicationDoc,
    showToast,
  } = useLoglineCtx();

  const resultRef = useRef(null);

  // 첫 분석 완료 시 다음 단계 안내 토스트
  const prevResultRef = useRef(null);
  useEffect(() => {
    if (result && !prevResultRef.current) {
      setTimeout(() => {
        showToast("success", "✓ 분석 완료! 왼쪽 사이드바에서 다음 단계로 이동하거나, 개선안·상업성 분석을 먼저 받아보세요.");
      }, 800);
    }
    prevResultRef.current = result;
  }, [result]);

  // Score calculations
  const structureTotal = calcSectionTotal(result, "structure");
  const expressionTotal = calcSectionTotal(result, "expression");
  const technicalTotal = calcSectionTotal(result, "technical");
  const qualityScore = structureTotal + expressionTotal + technicalTotal;
  const interestScore = calcSectionTotal(result, "interest");
  const structureTotal2 = calcSectionTotal(result2, "structure");
  const expressionTotal2 = calcSectionTotal(result2, "expression");
  const technicalTotal2 = calcSectionTotal(result2, "technical");
  const qualityScore2 = structureTotal2 + expressionTotal2 + technicalTotal2;
  const interestScore2 = calcSectionTotal(result2, "interest");

  const radarData = result ? [
    { label: "구조", value: structureTotal / 50 },
    { label: "아이러니", value: (result.expression?.irony?.score || 0) / 10 },
    { label: "심상", value: (result.expression?.mental_picture?.score || 0) / 8 },
    { label: "감정", value: (result.expression?.emotional_hook?.score || 0) / 7 },
    { label: "독창성", value: (result.expression?.originality?.score || 0) / 5 },
    { label: "간결성", value: (result.technical?.conciseness?.score || 0) / 8 },
    { label: "흥미", value: interestScore / 100 },
  ] : [];

  const tabs = [
    { id: "overview", label: "종합" },
    { id: "structure", label: isMobile ? "구조" : "구조 (50)" },
    { id: "expression", label: isMobile ? "표현" : "표현 (30)" },
    { id: "technical", label: isMobile ? "기술" : "기술 (20)" },
    { id: "interest", label: isMobile ? "흥미도" : "흥미도 (100)" },
    { id: "feedback", label: "개선·방향" },
    ...(academicResult ? [{ id: "academic", label: "학술" }] : []),
  ];

  const charCount = logline.length;

  return (
    <ErrorBoundary><div>

    {/* ── 단계 안내 ── */}
    {!result && (
      <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(200,168,75,0.05)", border: "1px solid rgba(200,168,75,0.15)", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>✏️</span>
        <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
          <strong style={{ color: "rgba(200,168,75,0.9)" }}>시나리오의 시작, 로그라인입니다.</strong>{" "}
          한 문장으로 주인공·사건·목표·갈등을 담아야 합니다. 입력하면 18개 항목으로 점수를 매기고 어디가 약한지 짚어줍니다. 개선안과 상업성 진단도 즉시 받을 수 있습니다.
        </div>
      </div>
    )}

    {/* Duration selector */}
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>영상 길이</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
        {DURATION_OPTIONS.map((d) => (
          <button key={d.id} onClick={() => setSelectedDuration(d.id)} style={{
            padding: "9px 10px", borderRadius: 10, textAlign: "left", transition: "all 0.15s",
            border: selectedDuration === d.id ? "1px solid rgba(200,168,75,0.55)" : "1px solid var(--c-bd-2)",
            background: selectedDuration === d.id ? "rgba(200,168,75,0.08)" : "rgba(var(--tw),0.02)",
            color: selectedDuration === d.id ? "#C8A84B" : "var(--c-tx-45)",
            cursor: "pointer",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>{d.label}</div>
            <div style={{ fontSize: 10, color: selectedDuration === d.id ? "rgba(200,168,75,0.65)" : "var(--c-tx-28)", fontFamily: "'JetBrains Mono', monospace" }}>{d.duration}</div>
          </button>
        ))}
        {/* 커스텀 버튼 */}
        <button onClick={() => setSelectedDuration("custom")} style={{
          padding: "9px 10px", borderRadius: 10, textAlign: "left", transition: "all 0.15s",
          border: selectedDuration === "custom" ? "1px solid rgba(139,92,246,0.6)" : "1px solid var(--c-bd-2)",
          background: selectedDuration === "custom" ? "rgba(139,92,246,0.1)" : "rgba(var(--tw),0.02)",
          color: selectedDuration === "custom" ? "#A78BFA" : "var(--c-tx-45)",
          cursor: "pointer",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>커스텀</div>
          <div style={{ fontSize: 10, color: selectedDuration === "custom" ? "rgba(167,139,250,0.65)" : "var(--c-tx-28)", fontFamily: "'JetBrains Mono', monospace" }}>직접 설정</div>
        </button>
      </div>

      {/* 커스텀 입력 필드 */}
      {selectedDuration === "custom" && (
        <div style={{ marginTop: 12, padding: "14px 16px", background: "rgba(139,92,246,0.06)", borderRadius: 10, border: "1px solid rgba(139,92,246,0.2)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", marginBottom: 2 }}>커스텀 포맷 설정</div>
          <div>
            <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>주제 / 컨셉</div>
            <input
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              placeholder="예: 나의 이야기 — 내가 주인공인 실제/상상 경험"
              style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(139,92,246,0.25)", background: "var(--c-card-2)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>영상 길이</div>
              <input
                value={customDurationText}
                onChange={(e) => setCustomDurationText(e.target.value)}
                placeholder="예: 1~2분"
                style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(139,92,246,0.25)", background: "var(--c-card-2)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>형식 / 매체</div>
              <input
                value={customFormatLabel}
                onChange={(e) => setCustomFormatLabel(e.target.value)}
                placeholder="예: 2D 애니메이션 초단편"
                style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(139,92,246,0.25)", background: "var(--c-card-2)", color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none" }}
              />
            </div>
          </div>
          {(customFormatLabel || customDurationText || customTheme) && (
            <div style={{ fontSize: 11, color: "rgba(167,139,250,0.7)", padding: "6px 10px", background: "rgba(139,92,246,0.07)", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
              포맷: {customFormatLabel || "커스텀"} ({customDurationText || "?"}){customTheme ? ` · 주제: ${customTheme}` : ""}
            </div>
          )}
        </div>
      )}
    </div>

    {/* Genre selector */}
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>장르</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {GENRES.map((g) => (
          <button key={g.id} onClick={() => setGenre(g.id)} style={{
            padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, transition: "all 0.2s",
            border: genre === g.id ? "1px solid #C8A84B" : "1px solid var(--c-bd-3)",
            background: genre === g.id ? "rgba(200,168,75,0.1)" : "var(--c-card-1)",
            color: genre === g.id ? "#C8A84B" : "var(--c-tx-45)",
          }}>{g.label}</button>
        ))}
      </div>
    </div>

    {/* Compare toggle */}
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
      <button onClick={() => { setCompareMode(!compareMode); if (compareMode) { setLogline2(""); } }} style={{
        padding: "5px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all 0.2s",
        border: compareMode ? "1px solid rgba(69,183,209,0.5)" : "1px solid var(--c-bd-3)",
        background: compareMode ? "rgba(69,183,209,0.1)" : "var(--c-card-1)",
        color: compareMode ? "#45B7D1" : "var(--c-tx-40)",
      }}>
        {compareMode ? "비교 모드 ON" : "비교 모드"}
      </button>
    </div>

    {/* Textarea */}
    <div style={{ display: "grid", gridTemplateColumns: compareMode && !isMobile ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 12 }}>
      <div>
        {compareMode && <div style={{ fontSize: 11, color: "#C8A84B", marginBottom: 6, fontWeight: 600 }}>로그라인 A</div>}
        <div style={{ position: "relative" }}>
          <textarea
            value={logline} onChange={(e) => setLogline(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (logline.trim() && apiKey && !loading) analyze(); } }}
            placeholder="로그라인을 입력하세요..."
            rows={compareMode ? 5 : 4}
            style={{
              width: "100%", padding: "16px 16px 32px", borderRadius: 12,
              border: "1px solid var(--c-bd-4)",
              background: "rgba(var(--tw),0.025)", color: "var(--text-main)",
              fontSize: 14, lineHeight: 1.75, resize: "vertical",
              fontFamily: "'Noto Sans KR', sans-serif", transition: "border-color 0.2s",
              minHeight: 120,
            }}
          />
          <div style={{
            position: "absolute", bottom: 10, right: 12, fontSize: 11,
            color: (() => {
              const ranges = { ultrashort: [20, 40], shortform: [30, 50], shortfilm: [40, 70], webdrama: [50, 80], tvdrama: [60, 90], feature: [70, 110], miniseries: [90, 140], shortformseries: [60, 100] };
              const [lo, hi] = ranges[selectedDuration] || [70, 110];
              return charCount > hi ? "#E85D75" : charCount >= lo ? "#4ECCA3" : charCount > 0 ? "#F7A072" : "var(--c-tx-25)";
            })(),
          }}>
            {charCount}자{charCount > 0 && (() => {
              const ranges = { ultrashort: [20, 40], shortform: [30, 50], shortfilm: [40, 70], webdrama: [50, 80], tvdrama: [60, 90], feature: [70, 110], miniseries: [90, 140], shortformseries: [60, 100] };
              const [lo, hi] = ranges[selectedDuration] || [70, 110];
              return charCount < lo ? ` (목표 ${lo}~${hi}자)` : charCount <= hi ? " 적정" : ` (목표 ${lo}~${hi}자)`;
            })()}
          </div>
        </div>
      </div>
      {compareMode && (
        <div>
          <div style={{ fontSize: 11, color: "#45B7D1", marginBottom: 6, fontWeight: 600 }}>로그라인 B</div>
          <textarea value={logline2} onChange={(e) => setLogline2(e.target.value)} placeholder="비교할 로그라인..." rows={5} style={{
            width: "100%", padding: "16px 16px 32px", borderRadius: 12,
            border: "1px solid rgba(69,183,209,0.18)", background: "rgba(69,183,209,0.03)",
            color: "var(--text-main)", fontSize: 14, lineHeight: 1.75, resize: "vertical",
            fontFamily: "'Noto Sans KR', sans-serif", minHeight: 120,
          }} />
        </div>
      )}
    </div>

    {/* Logline quality hint */}
    {logline.trim().length > 0 && !compareMode && (() => {
      const ranges = { ultrashort: [20, 40], shortform: [30, 50], shortfilm: [40, 70], webdrama: [50, 80], tvdrama: [60, 90], feature: [70, 110], miniseries: [90, 140], shortformseries: [60, 100] };
      const [lo, hi] = ranges[selectedDuration] || [70, 110];
      const n = logline.trim().length;
      if (n < lo) return <div style={{ marginBottom: 10, fontSize: 11, color: "#F7A072", display: "flex", alignItems: "center", gap: 6 }}><span>⚠</span> 로그라인이 너무 짧습니다. 주인공·목표·장애·결과를 구체적으로 작성해보세요. (현재 {n}자 / 권장 {lo}자 이상)</div>;
      if (n > hi) return <div style={{ marginBottom: 10, fontSize: 11, color: "#E85D75", display: "flex", alignItems: "center", gap: 6 }}><span>⚠</span> 로그라인이 너무 깁니다. 한 문장으로 압축해보세요. (현재 {n}자 / 권장 {hi}자 이하)</div>;
      return <div style={{ marginBottom: 10, fontSize: 11, color: "#4ECCA3", display: "flex", alignItems: "center", gap: 6 }}><span>✓</span> 적절한 길이입니다. ({n}자)</div>;
    })()}

    {/* Sample logline buttons — shown only when textarea is empty */}
    {!logline.trim() && !compareMode && (() => {
      const SAMPLE_LOGLINES = [
        { genre: "drama", label: "드라마", text: "가난한 청년이 재벌 가문의 비밀을 알게 된 후, 자신이 바로 그 가문의 숨겨진 후계자임을 깨닫고 가족과 신념 사이에서 선택을 강요받는다." },
        { genre: "thriller", label: "스릴러", text: "연쇄살인마를 추적하던 형사가 다음 피해자가 자신의 딸임을 알게 되고, 법을 어기지 않고는 구할 수 없는 상황에 몰린다." },
        { genre: "romance", label: "로맨스", text: "이혼 전문 변호사인 여자와 결혼 상담사인 남자가 서로의 직업을 숨긴 채 사랑에 빠지고, 진실이 드러나는 순간 관계가 무너진다." },
        { genre: "action", label: "액션", text: "은퇴한 전직 요원이 평범한 삶을 살던 중 과거 자신이 훈련시킨 제자가 테러 조직의 수장이 되었다는 사실을 알고 다시 임무에 복귀한다." },
      ];
      return (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-25)", marginBottom: 8 }}>예시 로그라인으로 바로 시작해보세요</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SAMPLE_LOGLINES.map((item) => (
              <button
                key={item.genre}
                onClick={() => { setLogline(item.text); setGenre(item.genre); }}
                style={{
                  padding: "5px 14px", borderRadius: 16,
                  border: "1px solid var(--c-bd-3)",
                  background: "rgba(var(--tw),0.03)",
                  color: "var(--c-tx-40)", cursor: "pointer", fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(200,168,75,0.45)"; e.currentTarget.style.color = "#C8A84B"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--c-bd-3)"; e.currentTarget.style.color = "var(--c-tx-40)"; }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      );
    })()}

    {/* Main analyze button */}
    <Tooltip text={"로그라인을 입력하면 AI가 시나리오 전문가 관점에서 종합 분석을 시작합니다.\n\n분석 항목:\n• 구조적 완성도 — 이야기의 뼈대가 탄탄한지\n• 표현적 매력도 — 읽는 사람을 끌어당기는 힘\n• 기술적 완성도 — 장르·캐릭터·갈등의 명확성\n• 흥미 유발 지수 — 제작사가 관심을 가질 가능성\n\n분석 결과를 바탕으로 아래 심화 도구들이 활성화됩니다."} maxWidth={340}>
    <button onClick={() => analyze()} disabled={loading || !logline.trim() || !apiKey} style={{
      width: "100%", height: 48, borderRadius: 12, border: "1px solid rgba(200,168,75,0.4)",
      cursor: loading || !logline.trim() || !apiKey ? "not-allowed" : "pointer",
      background: loading || !logline.trim() || !apiKey ? "rgba(200,168,75,0.05)" : "linear-gradient(135deg, rgba(200,168,75,0.2), rgba(200,168,75,0.1))",
      color: "#C8A84B", fontSize: 15, fontWeight: 700, transition: "all 0.3s",
      opacity: !logline.trim() || !apiKey ? 0.5 : 1,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      {loading ? (<><Spinner size={15} color="#C8A84B" />{compareMode ? "두 로그라인 분석 중..." : "분석 중..."}</>) : (
        <>{compareMode && logline2.trim() ? "두 로그라인 비교 분석" : "로그라인 분석하기"}</>
      )}
    </button>
    </Tooltip>
    <div style={{ marginTop: 6, textAlign: "right", fontSize: 10, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>
      {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}+Enter
    </div>
    {!apiKey && !serverHasKey && <div style={{ marginTop: 8, fontSize: 11, textAlign: "center", color: "rgba(232,93,117,0.7)" }}>API 키를 먼저 설정해주세요</div>}
    {serverHasKey && apiKey === "__server__" && <div style={{ marginTop: 8, fontSize: 11, textAlign: "center", color: "rgba(78,204,163,0.7)" }}>서버 API 키 사용 중</div>}
    {error && (
      <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(232,93,117,0.1)", border: "1px solid rgba(232,93,117,0.25)", color: "#E85D75", fontSize: 12, lineHeight: 1.6 }}>
        ⚠️ {error}
      </div>
    )}

    {/* ── Result display ── */}
    {result && (
      <div ref={resultRef} style={{ marginTop: 24 }}>
        {/* Score card */}
        <ResultCard color="var(--c-bd-1)">
          {compareMode && result2 ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#C8A84B", marginBottom: 14, fontWeight: 700 }}>로그라인 A</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                    <CircleGauge score={qualityScore} label="품질 점수" size={isMobile ? 90 : 110} />
                    <CircleGauge score={interestScore} label="흥미도" size={isMobile ? 90 : 110} />
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#45B7D1", marginBottom: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    로그라인 B {loading2 && <Spinner size={10} color="#45B7D1" />}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                    <CircleGauge score={qualityScore2} label="품질 점수" size={isMobile ? 90 : 110} />
                    <CircleGauge score={interestScore2} label="흥미도" size={isMobile ? 90 : 110} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 20 : 40, flexWrap: "wrap", marginBottom: 16 }}>
                <CircleGauge score={qualityScore} label="품질 점수" subLabel={`구조${structureTotal} + 표현${expressionTotal} + 기술${technicalTotal}`} size={isMobile ? 100 : 120} />
                <CircleGauge score={interestScore} label="흥미도" subLabel="정보격차 이론 기반" size={isMobile ? 100 : 120} />
              </div>
              {result.detected_genre && (
                <div style={{ textAlign: "center", fontSize: 12, color: "var(--c-tx-35)", marginBottom: 12 }}>
                  감지된 장르: <span style={{ color: "#C8A84B" }}>{result.detected_genre}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <ExportButton result={result} logline={logline} qualityScore={qualityScore} interestScore={interestScore} />
              </div>
            </div>
          )}
        </ResultCard>

        {/* Compare sections */}
        {compareMode && result2 && (
          <div style={{ marginTop: 16 }}>
            <CompareSection result1={result} result2={result2} section="structure" title="A. 구조적 완성도" maxTotal={50} color="#4ECCA3" />
            <CompareSection result1={result} result2={result2} section="expression" title="B. 표현적 매력도" maxTotal={30} color="#45B7D1" />
            <CompareSection result1={result} result2={result2} section="technical" title="C. 기술적 완성도" maxTotal={20} color="#F7A072" />
            <CompareSection result1={result} result2={result2} section="interest" title="D. 흥미 유발 지수" maxTotal={100} color="#FFD700" />
          </div>
        )}

        {/* ── 개선·방향 탭 유도 CTA ── */}
        <div
          onClick={() => setActiveTab("feedback")}
          style={{
            marginTop: 14, padding: "12px 16px", borderRadius: 10,
            background: activeTab === "feedback"
              ? "rgba(200,168,75,0.04)"
              : "linear-gradient(90deg, rgba(200,168,75,0.1) 0%, rgba(96,165,250,0.08) 100%)",
            border: activeTab === "feedback"
              ? "1px solid rgba(200,168,75,0.12)"
              : "1px solid rgba(200,168,75,0.22)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🔀</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B", marginBottom: 2 }}>
              이 로그라인을 발전시키고 싶다면?
            </div>
            <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6 }}>
              약점만 골라 수정 · 장르·관점·갈등 방향 전환 · AI 개선안 — <span style={{ color: "#C8A84B", fontWeight: 700 }}>개선·방향 탭</span>에서 확인하세요
            </div>
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.7 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </div>

        {/* Tab nav */}
        <div style={{ overflowX: "auto", marginTop: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 3, background: "rgba(var(--tw),0.02)", borderRadius: 10, padding: 4, minWidth: "max-content" }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: "0 0 auto", padding: isMobile ? "7px 10px" : "8px 13px",
                borderRadius: 7, border: "none", cursor: "pointer",
                background: activeTab === tab.id ? "rgba(200,168,75,0.14)" : "transparent",
                color: activeTab === tab.id ? "#C8A84B" : "rgba(var(--tw),0.38)",
                fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 400, transition: "all 0.2s", whiteSpace: "nowrap",
              }}>{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <ResultCard>
          {activeTab === "overview" && (
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <RadarChart data={radarData} size={isMobile ? 220 : 280} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "구조적 완성도", score: structureTotal, max: 50, color: "#4ECCA3" },
                  { label: "표현적 매력도", score: expressionTotal, max: 30, color: "#45B7D1" },
                  { label: "기술적 완성도", score: technicalTotal, max: 20, color: "#F7A072" },
                  { label: "흥미 유발 지수", score: interestScore, max: 100, color: "#FFD700" },
                ].map((item, i) => (
                  <div key={i} style={{ padding: isMobile ? 12 : 16, background: "rgba(var(--tw),0.02)", borderRadius: 12, border: `1px solid ${item.color}18` }}>
                    <div style={{ fontSize: 11, color: "var(--c-tx-45)", marginBottom: 5 }}>{item.label}</div>
                    <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {item.score}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--c-tx-25)" }}>/{item.max}</span>
                    </div>
                    <div style={{ marginTop: 8, height: 3, background: "var(--c-card-3)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(item.score / item.max) * 100}%`, background: item.color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 종합 인사이트 ── */}
              <div style={{ marginTop: 20, borderTop: "1px solid var(--c-bd-1)", paddingTop: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-tx-80)" }}>종합 인사이트</div>
                    <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2 }}>모든 분석을 종합해 지금 가장 중요한 개선점 3가지를 뽑아줍니다</div>
                  </div>
                  <button
                    onClick={generateInsight}
                    disabled={insightLoading}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #C8A84B", background: insightLoading ? "rgba(200,168,75,0.08)" : "rgba(200,168,75,0.12)", color: "#C8A84B", fontSize: 12, fontWeight: 700, cursor: insightLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    {insightLoading ? <><Spinner size={12} color="#C8A84B" /> 분석 중…</> : "✦ 인사이트 생성"}
                  </button>
                </div>
                <ErrorMsg msg={insightError} />
                {insightResult && (
                  <div>
                    {/* 한 줄 평가 + 강점 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {insightResult.overall_verdict && (
                        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>전체 평가</div>
                          <div style={{ fontSize: 12, color: "var(--c-tx-75)", lineHeight: 1.6 }}>{insightResult.overall_verdict}</div>
                        </div>
                      )}
                      {insightResult.strongest_element && (
                        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.2)" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>가장 강한 요소</div>
                          <div style={{ fontSize: 12, color: "var(--c-tx-75)", lineHeight: 1.6 }}>{insightResult.strongest_element}</div>
                        </div>
                      )}
                    </div>
                    {/* 우선 개선점 3가지 */}
                    {insightResult.priority_issues?.map((issue, idx) => (
                      <div key={idx} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)", borderLeft: `3px solid ${["#FF6B6B","#C8A84B","#45B7D1"][idx]||"#C8A84B"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: ["#FF6B6B","#C8A84B","#45B7D1"][idx]||"#C8A84B", fontFamily: "monospace" }}>0{idx+1}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-tx-80)" }}>{issue.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.65, marginBottom: 5 }}>{issue.problem}</div>
                        {issue.why_matters && <div style={{ fontSize: 11, color: "var(--c-tx-45)", marginBottom: 6, fontStyle: "italic" }}>→ {issue.why_matters}</div>}
                        {issue.action && (
                          <div style={{ padding: "7px 10px", borderRadius: 7, background: "rgba(var(--tw),0.03)", border: "1px solid var(--c-bd-1)", fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.65 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-35)", marginRight: 6 }}>개선 방법</span>{issue.action}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "structure" && result.structure && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#4ECCA3", marginBottom: 18 }}>A. 구조적 완성도 -- {structureTotal}/50</div>
              {Object.entries(result.structure).map(([key, val], i) => (
                <div key={key}>
                  <ScoreBar score={val.score} max={val.max} label={LABELS_KR[key]} found={val.found} feedback={val.feedback} delay={i * 100} criterionKey={key} />
                  {val.score != null && val.max != null && val.score / val.max <= 0.5 && CRITERIA_GUIDE[key] && (
                    <div style={{ margin: "-6px 0 14px 0", padding: "8px 12px", borderRadius: "0 0 8px 8px", background: "rgba(200,168,75,0.07)", borderLeft: "3px solid rgba(200,168,75,0.5)", fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65 }}>
                      <span style={{ fontWeight: 700, color: "#C8A84B", marginRight: 5 }}>💡 개선 팁</span>{CRITERIA_GUIDE[key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === "expression" && result.expression && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#45B7D1", marginBottom: 18 }}>B. 표현적 매력도 -- {expressionTotal}/30</div>
              {Object.entries(result.expression).map(([key, val], i) => (
                <div key={key}>
                  <ScoreBar score={val.score} max={val.max} label={LABELS_KR[key]} found={val.found} feedback={val.feedback} delay={i * 100} criterionKey={key} />
                  {val.score != null && val.max != null && val.score / val.max <= 0.5 && CRITERIA_GUIDE[key] && (
                    <div style={{ margin: "-6px 0 14px 0", padding: "8px 12px", borderRadius: "0 0 8px 8px", background: "rgba(200,168,75,0.07)", borderLeft: "3px solid rgba(200,168,75,0.5)", fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65 }}>
                      <span style={{ fontWeight: 700, color: "#C8A84B", marginRight: 5 }}>💡 개선 팁</span>{CRITERIA_GUIDE[key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === "technical" && result.technical && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F7A072", marginBottom: 18 }}>C. 기술적 완성도 -- {technicalTotal}/20</div>
              {Object.entries(result.technical).map(([key, val], i) => (
                <div key={key}>
                  <ScoreBar score={val.score} max={val.max} label={LABELS_KR[key]} feedback={val.feedback} delay={i * 100} criterionKey={key} />
                  {val.score != null && val.max != null && val.score / val.max <= 0.5 && CRITERIA_GUIDE[key] && (
                    <div style={{ margin: "-6px 0 14px 0", padding: "8px 12px", borderRadius: "0 0 8px 8px", background: "rgba(200,168,75,0.07)", borderLeft: "3px solid rgba(200,168,75,0.5)", fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65 }}>
                      <span style={{ fontWeight: 700, color: "#C8A84B", marginRight: 5 }}>💡 개선 팁</span>{CRITERIA_GUIDE[key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === "interest" && result.interest && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FFD700", marginBottom: 18 }}>D. 흥미 유발 지수 -- {interestScore}/100</div>
              {Object.entries(result.interest).map(([key, val], i) => (
                <div key={key}>
                  <ScoreBar score={val.score} max={val.max} label={LABELS_KR[key]} feedback={val.feedback} delay={i * 100} criterionKey={key} />
                  {val.score != null && val.max != null && val.score / val.max <= 0.5 && CRITERIA_GUIDE[key] && (
                    <div style={{ margin: "-6px 0 14px 0", padding: "8px 12px", borderRadius: "0 0 8px 8px", background: "rgba(200,168,75,0.07)", borderLeft: "3px solid rgba(200,168,75,0.5)", fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65 }}>
                      <span style={{ fontWeight: 700, color: "#C8A84B", marginRight: 5 }}>💡 개선 팁</span>{CRITERIA_GUIDE[key]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === "feedback" && (
            <div>
              {/* 탭 설명 헤더 */}
              <div style={{ marginBottom: 20, padding: "12px 14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-tx-60)", marginBottom: 8, letterSpacing: 0.5 }}>이 탭에서 할 수 있는 것</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { icon: "🔧", title: "약점 수정", desc: "낮은 점수 항목만 골라 직접 고친 버전 제안" },
                    { icon: "🔀", title: "방향 전환", desc: "장르·관점·갈등을 완전히 다르게 바꾼 3가지 버전" },
                    { icon: "✨", title: "AI 개선안", desc: "종합 피드백을 반영한 자유 형식 개선 로그라인" },
                  ].map((item) => (
                    <div key={item.title} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(var(--tw),0.02)" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#C8A84B" }}>{item.title}</div>
                        <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginTop: 2, lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 종합 피드백 */}
              {result.overall_feedback && (
                <div style={{ fontSize: 14, lineHeight: 1.85, color: "var(--c-tx-75)", marginBottom: 20, padding: "14px 16px", borderRadius: 10, background: "rgba(200,168,75,0.04)", borderLeft: "3px solid rgba(200,168,75,0.3)" }}>
                  {result.overall_feedback}
                </div>
              )}

              {/* AI 유도 질문 */}
              {result.improvement_questions?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-40)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>스스로 점검해볼 질문</div>
                  {result.improvement_questions.map((q, i) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--c-tx-60)", padding: "9px 14px", marginBottom: 6, background: "rgba(200,168,75,0.04)", borderRadius: 8, borderLeft: "2px solid rgba(200,168,75,0.25)", lineHeight: 1.7 }}>
                      <span style={{ color: "rgba(200,168,75,0.6)", fontWeight: 700, marginRight: 6 }}>Q{i + 1}.</span>{q}
                    </div>
                  ))}
                </div>
              )}

              <StoryDevPanel
                logline={logline}
                genre={genre}
                result={result}
                apiKey={apiKey}
                onApply={(improved) => analyze(improved)}
                onFixesChange={setStoryFixes}
                onPivotsChange={setStoryPivots}
              />
              <ImprovementPanel
                logline={logline}
                genre={genre}
                apiKey={apiKey}
                result={result}
                onReanalyze={(improved) => analyze(improved)}
                onImprovementChange={setAiImprovement}
              />
            </div>
          )}
          {activeTab === "academic" && academicResult && <AcademicPanel academic={academicResult} />}
        </ResultCard>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <DocButton label="기초 기획서 PDF" sub="로그라인 분석 기반 초기 기획서" onClick={() => openApplicationDoc("logline")} disabled={!logline.trim()} />
        </div>
      </div>
    )}
    {/* ── 얼리 커버리지 ── */}
    {result && (
      <div style={{ marginTop: 16 }}>
        <ToolButton
          icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
          label="빠른 상업성 체크"
          sub="시장 잠재력 · 플랫폼 적합성 · 개발 우선순위"
          done={!!earlyCoverageResult}
          loading={earlyCoverageLoading}
          color="#45B7D1"
          onClick={analyzeEarlyCoverage}
          disabled={!logline.trim()}
          tooltip={"로그라인 단계에서 이 이야기의 상업적 가능성을 빠르게 진단합니다.\n\n• 시장성 점수 (1~10)\n• 최적 플랫폼 (OTT/극장/방송 등)\n• 유사 히트작 레퍼런스\n• 핵심 강점 및 리스크\n• 지금 당장 보완해야 할 것 1가지\n\n방향을 잡기 전에 먼저 시장의 냉정한 시각으로 체크해보세요."}
          creditCost={cc(2)}
        />
        <ErrorMsg msg={earlyCoverageError} />
        {earlyCoverageResult && (
          <ResultCard title="빠른 상업성 체크" onClose={() => setEarlyCoverageResult(null)} color="rgba(69,183,209,0.15)">
            <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
              {/* 점수 */}
              <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(69,183,209,0.1)", border: "1px solid rgba(69,183,209,0.25)", textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#45B7D1", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{earlyCoverageResult.marketability_score}<span style={{ fontSize: 14, opacity: 0.6 }}>/10</span></div>
                <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginTop: 3 }}>시장성</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 4, lineHeight: 1.5 }}>{earlyCoverageResult.one_line_verdict}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 7, background: "rgba(69,183,209,0.1)", color: "#45B7D1", border: "1px solid rgba(69,183,209,0.2)" }}>{earlyCoverageResult.best_platform}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 7, background: "rgba(var(--tw),0.05)", color: "var(--c-tx-50)", border: "1px solid var(--c-bd-2)" }}>{earlyCoverageResult.target_audience}</span>
                </div>
              </div>
            </div>
            {earlyCoverageResult.comparable_hit && (
              <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(var(--tw),0.03)", border: "1px solid var(--c-bd-1)" }}>
                <span style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", marginRight: 6 }}>유사 히트작</span>
                <span style={{ fontSize: 12, color: "var(--c-tx-65)" }}>{earlyCoverageResult.comparable_hit}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(78,204,163,0.06)", border: "1px solid rgba(78,204,163,0.15)" }}>
                <div style={{ fontSize: 10, color: "rgba(78,204,163,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>강점</div>
                {(earlyCoverageResult.key_strengths || []).map((s, i) => <div key={i} style={{ fontSize: 12, color: "var(--c-tx-60)", marginBottom: 3, paddingLeft: 8, borderLeft: "2px solid rgba(78,204,163,0.3)" }}>· {s}</div>)}
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(232,93,117,0.06)", border: "1px solid rgba(232,93,117,0.15)" }}>
                <div style={{ fontSize: 10, color: "rgba(232,93,117,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>리스크</div>
                {(earlyCoverageResult.key_risks || []).map((r, i) => <div key={i} style={{ fontSize: 12, color: "var(--c-tx-60)", marginBottom: 3, paddingLeft: 8, borderLeft: "2px solid rgba(232,93,117,0.3)" }}>· {r}</div>)}
              </div>
            </div>
            {earlyCoverageResult.development_priority && (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(247,160,114,0.07)", border: "1px solid rgba(247,160,114,0.25)" }}>
                <div style={{ fontSize: 10, color: "rgba(247,160,114,0.8)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>지금 당장 보완할 것</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#F7A072", lineHeight: 1.5 }}>{earlyCoverageResult.development_priority}</div>
              </div>
            )}
          </ResultCard>
        )}
      </div>
    )}
    {getStageStatus("1") === "done" && (
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => advanceToStage("2")} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
          다음 단계: 개념 분석
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </div>
    )}

    </div></ErrorBoundary>
  );
}
