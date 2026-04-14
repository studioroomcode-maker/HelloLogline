import { useRef, useEffect, useState } from "react";
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
import {
  EduHintChecklist, SelfAssessPanel, ComparePanel, ReflectionBox, ScoreCriteriaModal,
} from "./EduModePanel.jsx";

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
  // 기존 시나리오 참고
  referenceScenario, setReferenceScenario,
  referenceScenarioEnabled, setReferenceScenarioEnabled,
  referenceScenarioSummary,
  extractLoglineFromScenario, extractLoglineLoading, extractLoglineError,
  summarizeReferenceScenario, summarizeLoading, summarizeError,
}) {
  const {
    logline, setLogline,
    genre, setGenre,
    isMobile, cc,
    getStageStatus, advanceToStage,
    openApplicationDoc,
    showToast,
    eduMode,
    isDemoMode, demoTourStep,
  } = useLoglineCtx();

  // ── 기존 시나리오 패널 ──
  const [refPanelOpen, setRefPanelOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleRefFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하만 지원합니다.");
      return;
    }

    if (ext === "pdf") {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + "\n";
        }
        setReferenceScenario(text.trim());
      } catch {
        alert("PDF를 읽는 중 오류가 발생했습니다. 텍스트를 직접 붙여넣어 주세요.");
      }
      return;
    }

    if (ext === "fdx") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(ev.target.result, "application/xml");
          const paragraphs = doc.querySelectorAll("Paragraph");
          const text = Array.from(paragraphs)
            .map((p) => p.textContent.trim())
            .filter(Boolean)
            .join("\n");
          setReferenceScenario(text);
        } catch {
          alert("FDX 파일을 읽는 중 오류가 발생했습니다. 텍스트를 직접 붙여넣어 주세요.");
        }
      };
      reader.readAsText(file, "utf-8");
      return;
    }

    // .txt, .md
    const reader = new FileReader();
    reader.onload = (ev) => setReferenceScenario(ev.target.result || "");
    reader.readAsText(file, "utf-8");
  };

  // ── 교육 모드 로컬 상태 ──
  const [eduPhase, setEduPhase] = useState("checklist"); // "checklist" | "selfAssess" | "result"
  const [selfScores, setSelfScores] = useState(null);
  const [criteriaKey, setCriteriaKey] = useState(null); // 기준 모달 열린 항목

  // 교육 모드가 꺼지거나 새 분석이 시작되면 초기화
  useEffect(() => {
    if (!eduMode) { setEduPhase("checklist"); setSelfScores(null); }
  }, [eduMode]);
  useEffect(() => {
    if (result && eduPhase === "checklist") setEduPhase("result");
  }, [result]);

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
    // 구조 (5항목, 각 /10)
    { label: "주인공",  section: "structure",  rawScore: result.structure?.protagonist?.score       || 0, rawMax: 10, value: (result.structure?.protagonist?.score       || 0) / 10 },
    { label: "촉발사건",section: "structure",  rawScore: result.structure?.inciting_incident?.score || 0, rawMax: 10, value: (result.structure?.inciting_incident?.score || 0) / 10 },
    { label: "목표",    section: "structure",  rawScore: result.structure?.goal?.score              || 0, rawMax: 10, value: (result.structure?.goal?.score              || 0) / 10 },
    { label: "갈등",    section: "structure",  rawScore: result.structure?.conflict?.score          || 0, rawMax: 10, value: (result.structure?.conflict?.score          || 0) / 10 },
    { label: "스테이크",section: "structure",  rawScore: result.structure?.stakes?.score            || 0, rawMax: 10, value: (result.structure?.stakes?.score            || 0) / 10 },
    // 표현 (4항목)
    { label: "아이러니",section: "expression", rawScore: result.expression?.irony?.score            || 0, rawMax: 10, value: (result.expression?.irony?.score            || 0) / 10 },
    { label: "심상",    section: "expression", rawScore: result.expression?.mental_picture?.score   || 0, rawMax: 8,  value: (result.expression?.mental_picture?.score   || 0) / 8  },
    { label: "감정공명",section: "expression", rawScore: result.expression?.emotional_hook?.score   || 0, rawMax: 7,  value: (result.expression?.emotional_hook?.score   || 0) / 7  },
    { label: "독창성",  section: "expression", rawScore: result.expression?.originality?.score      || 0, rawMax: 5,  value: (result.expression?.originality?.score      || 0) / 5  },
    // 기술 (4항목)
    { label: "간결성",  section: "technical",  rawScore: result.technical?.conciseness?.score       || 0, rawMax: 8,  value: (result.technical?.conciseness?.score       || 0) / 8  },
    { label: "능동언어",section: "technical",  rawScore: result.technical?.active_language?.score   || 0, rawMax: 5,  value: (result.technical?.active_language?.score   || 0) / 5  },
    { label: "금기사항",section: "technical",  rawScore: result.technical?.no_violations?.score     || 0, rawMax: 3,  value: (result.technical?.no_violations?.score     || 0) / 3  },
    { label: "장르톤",  section: "technical",  rawScore: result.technical?.genre_tone?.score        || 0, rawMax: 4,  value: (result.technical?.genre_tone?.score        || 0) / 4  },
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

    {/* ── 교육 모드 배너 ── */}
    {eduMode && (
      <div style={{ marginBottom: 16, padding: "11px 14px", borderRadius: 10, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
        </svg>
        <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.65 }}>
          <strong style={{ color: "#A78BFA" }}>교육 모드 활성화</strong>
          {" "}— AI 분석 전에 체크리스트로 자가 진단하고, 직접 채점한 뒤 AI 결과와 비교합니다. 분석 후 반성 일지를 작성해 학습을 심화할 수 있습니다.
          <span style={{ fontSize: 10, color: "var(--c-tx-30)", display: "block", marginTop: 3 }}>
            각 항목 옆 <strong style={{ color: "#A78BFA" }}>?</strong> 버튼으로 평가 기준과 학문적 근거를 확인할 수 있습니다.
          </span>
        </div>
      </div>
    )}

    {/* ── 단계 안내 ── */}
    {!result && (
      <div style={{ marginBottom: 20, padding: "11px 14px", borderRadius: 10, background: "rgba(200,168,75,0.05)", borderLeft: "2px solid rgba(200,168,75,0.4)", display: "flex", gap: 10, alignItems: "flex-start" }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(200,168,75,0.75)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
          <strong style={{ color: "rgba(200,168,75,0.9)" }}>시나리오의 시작, 로그라인입니다.</strong>{" "}
          한 문장에 주인공·목표·갈등을 담아 입력하면 18개 항목으로 점수를 매기고 개선안·상업성 진단을 즉시 받을 수 있습니다.
        </div>
      </div>
    )}

    {/* Duration selector */}
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: "var(--c-tx-25)", marginBottom: 9, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>형식 / 길이</div>
      {/* 가로 스크롤 필 — 4열 그리드 대신 */}
      <div style={{
        display: "flex", gap: 6,
        overflowX: "auto", WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        paddingBottom: 2,
      }}>
        {DURATION_OPTIONS.map((d) => {
          const isSelected = selectedDuration === d.id;
          return (
            <button key={d.id} onClick={() => setSelectedDuration(d.id)} style={{
              flexShrink: 0, padding: "7px 11px", borderRadius: 20, cursor: "pointer",
              border: isSelected ? "1px solid rgba(200,168,75,0.5)" : "1px solid var(--c-bd-2)",
              background: isSelected ? "rgba(200,168,75,0.1)" : "rgba(var(--tw),0.02)",
              transition: "all 0.15s",
              display: "flex", flexDirection: "column", gap: 2, textAlign: "left",
            }}>
              <span style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, color: isSelected ? "#C8A84B" : "var(--c-tx-45)", whiteSpace: "nowrap" }}>{d.label}</span>
              <span style={{ fontSize: 9, color: isSelected ? "rgba(200,168,75,0.6)" : "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>{d.duration}</span>
            </button>
          );
        })}
        {/* 커스텀 */}
        <button onClick={() => setSelectedDuration("custom")} style={{
          flexShrink: 0, padding: "7px 11px", borderRadius: 20, cursor: "pointer",
          border: selectedDuration === "custom" ? "1px solid rgba(139,92,246,0.5)" : "1px solid var(--c-bd-2)",
          background: selectedDuration === "custom" ? "rgba(139,92,246,0.09)" : "rgba(var(--tw),0.02)",
          transition: "all 0.15s",
          display: "flex", flexDirection: "column", gap: 2, textAlign: "left",
        }}>
          <span style={{ fontSize: 11, fontWeight: selectedDuration === "custom" ? 700 : 500, color: selectedDuration === "custom" ? "#A78BFA" : "var(--c-tx-45)", whiteSpace: "nowrap" }}>커스텀</span>
          <span style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>직접 설정</span>
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

    {/* ── 기존 시나리오/시놉시스 참고 패널 ── */}
    <div style={{ marginBottom: 16 }}>
      {/* 헤더 토글 */}
      <button
        onClick={() => setRefPanelOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 14px", borderRadius: refPanelOpen ? "10px 10px 0 0" : 10,
          border: refPanelOpen
            ? "1px solid rgba(78,204,163,0.4)"
            : referenceScenario.trim()
              ? "1px solid rgba(78,204,163,0.3)"
              : "1px solid var(--c-bd-2)",
          background: refPanelOpen
            ? "rgba(78,204,163,0.07)"
            : referenceScenario.trim()
              ? "rgba(78,204,163,0.05)"
              : "rgba(var(--tw),0.02)",
          cursor: "pointer", transition: "all 0.15s",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={referenceScenario.trim() ? "#4ECCA3" : "var(--c-tx-35)"} strokeWidth={2} strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: referenceScenario.trim() ? "#4ECCA3" : "var(--c-tx-45)" }}>
            기존 시나리오 / 시놉시스 참고
          </span>
          {referenceScenario.trim() && !refPanelOpen && (
            <>
              <span style={{ fontSize: 10, color: "rgba(78,204,163,0.7)", background: "rgba(78,204,163,0.1)", padding: "1px 7px", borderRadius: 10 }}>
                {referenceScenario.trim().length.toLocaleString()}자
              </span>
              {referenceScenarioSummary && (
                <span style={{ fontSize: 10, color: "rgba(78,204,163,0.85)", background: "rgba(78,204,163,0.15)", padding: "1px 7px", borderRadius: 10 }}>
                  요약 완료
                </span>
              )}
              {referenceScenarioEnabled && (
                <span style={{ fontSize: 10, color: "#4ECCA3", background: "rgba(78,204,163,0.18)", padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>
                  반영 중
                </span>
              )}
            </>
          )}
        </div>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-35)" strokeWidth={2.5} strokeLinecap="round"
          style={{ transform: refPanelOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* 패널 본문 */}
      {refPanelOpen && (
        <div style={{
          padding: "14px 16px 16px",
          border: "1px solid rgba(78,204,163,0.4)", borderTop: "none",
          borderRadius: "0 0 10px 10px",
          background: "rgba(78,204,163,0.04)",
        }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", lineHeight: 1.65, marginBottom: 12 }}>
            시나리오나 시놉시스를 붙여넣거나 파일로 첨부하세요.
            <strong style={{ color: "rgba(78,204,163,0.9)" }}> 요약 생성</strong>을 누르면 핵심 내용만 압축해 이후 단계마다 크레딧을 아낄 수 있습니다.
            <span style={{ display: "block", marginTop: 4, color: "var(--c-tx-30)", fontSize: 10 }}>
              지원 형식: .txt · .md · .pdf · .fdx (Final Draft)
            </span>
          </div>

          {/* 텍스트 입력 영역 */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <textarea
              value={referenceScenario}
              onChange={(e) => setReferenceScenario(e.target.value)}
              placeholder="시나리오나 시놉시스 전문을 붙여넣으세요..."
              rows={6}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px 28px", borderRadius: 8,
                border: referenceScenario.length > 12000 && !referenceScenarioSummary
                  ? "1px solid rgba(247,160,114,0.5)"
                  : "1px solid rgba(78,204,163,0.2)",
                background: "var(--c-card-2)", color: "var(--text-main)",
                fontSize: 12, lineHeight: 1.7, resize: "vertical",
                fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
              }}
            />
            {/* 글자수 표시 */}
            <div style={{
              position: "absolute", bottom: 8, right: 10, fontSize: 10,
              color: referenceScenario.length > 12000 ? "#F7A072" : "var(--c-tx-25)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {referenceScenario.length.toLocaleString()}자
              {referenceScenario.length > 12000 && !referenceScenarioSummary && " · 12,000자 초과"}
            </div>
          </div>

          {/* 12,000자 초과 & 요약 없음 경고 */}
          {referenceScenario.length > 12000 && !referenceScenarioSummary && (
            <div style={{
              marginBottom: 10, padding: "8px 12px", borderRadius: 7,
              background: "rgba(247,160,114,0.08)", border: "1px solid rgba(247,160,114,0.3)",
              fontSize: 11, color: "#F7A072", lineHeight: 1.6,
              display: "flex", alignItems: "flex-start", gap: 6,
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>
                현재 12,000자 이후 내용은 분석에서 잘립니다.{" "}
                <strong style={{ color: "#F7A072" }}>요약 생성</strong>을 눌러 전체 내용을 반영하세요.
              </span>
            </div>
          )}

          {/* 요약 완료 상태 표시 */}
          {referenceScenarioSummary && (
            <div style={{
              marginBottom: 10, padding: "8px 12px", borderRadius: 7,
              background: "rgba(78,204,163,0.07)", border: "1px solid rgba(78,204,163,0.25)",
              fontSize: 11, color: "rgba(78,204,163,0.9)", lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                요약 완료 — 이후 단계 분석에 요약본이 주입됩니다 ({referenceScenarioSummary.length}자)
              </div>
              <div style={{ fontSize: 10, color: "rgba(78,204,163,0.65)", whiteSpace: "pre-wrap", lineHeight: 1.5, maxHeight: 80, overflow: "hidden" }}>
                {referenceScenarioSummary.slice(0, 200)}…
              </div>
            </div>
          )}

          {/* 버튼 행 */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* 파일 첨부 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.fdx"
              style={{ display: "none" }}
              onChange={handleRefFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "7px 13px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                border: "1px solid rgba(78,204,163,0.3)",
                background: "rgba(78,204,163,0.06)", color: "#4ECCA3",
                cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              파일 첨부
            </button>

            {/* 요약 생성 버튼 */}
            <button
              onClick={summarizeReferenceScenario}
              disabled={summarizeLoading || !referenceScenario.trim() || !apiKey}
              style={{
                padding: "7px 13px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                border: "1px solid rgba(78,204,163,0.4)",
                background: summarizeLoading ? "rgba(78,204,163,0.04)" : "rgba(78,204,163,0.1)",
                color: !referenceScenario.trim() || !apiKey ? "rgba(78,204,163,0.35)" : "#4ECCA3",
                cursor: summarizeLoading || !referenceScenario.trim() || !apiKey ? "not-allowed" : "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {summarizeLoading ? (
                <><span style={{ display: "inline-block", width: 9, height: 9, border: "2px solid rgba(78,204,163,0.3)", borderTop: "2px solid #4ECCA3", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />요약 중...</>
              ) : (
                <><svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>{referenceScenarioSummary ? "요약 다시 생성" : "요약 생성"}</>
              )}
            </button>

            {/* 로그라인 추출 버튼 */}
            <button
              onClick={extractLoglineFromScenario}
              disabled={extractLoglineLoading || !referenceScenario.trim() || !apiKey}
              style={{
                padding: "7px 13px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                border: "1px solid rgba(200,168,75,0.4)",
                background: extractLoglineLoading ? "rgba(200,168,75,0.04)" : "rgba(200,168,75,0.1)",
                color: !referenceScenario.trim() || !apiKey ? "rgba(200,168,75,0.4)" : "#C8A84B",
                cursor: extractLoglineLoading || !referenceScenario.trim() || !apiKey ? "not-allowed" : "pointer",
                fontFamily: "'Noto Sans KR', sans-serif",
                display: "flex", alignItems: "center", gap: 5, opacity: !apiKey ? 0.6 : 1,
              }}
            >
              {extractLoglineLoading ? (
                <><span style={{ display: "inline-block", width: 9, height: 9, border: "2px solid rgba(200,168,75,0.3)", borderTop: "2px solid #C8A84B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />추출 중...</>
              ) : (
                <><svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>로그라인 추출</>
              )}
            </button>

            {/* 내용 지우기 */}
            {referenceScenario.trim() && (
              <button
                onClick={() => { setReferenceScenario(""); setReferenceScenarioEnabled(false); }}
                style={{
                  padding: "7px 10px", borderRadius: 7, fontSize: 11,
                  border: "1px solid rgba(232,93,117,0.25)",
                  background: "rgba(232,93,117,0.05)", color: "rgba(232,93,117,0.7)",
                  cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                지우기
              </button>
            )}
          </div>

          {/* 에러 메시지 */}
          {(extractLoglineError || summarizeError) && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#E85D75", padding: "6px 10px", background: "rgba(232,93,117,0.07)", borderRadius: 6 }}>
              {extractLoglineError || summarizeError}
            </div>
          )}

          {/* '분석에 반영' 체크박스 */}
          <label style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 12,
            cursor: referenceScenario.trim() ? "pointer" : "not-allowed",
            opacity: referenceScenario.trim() ? 1 : 0.4,
          }}>
            <input
              type="checkbox"
              checked={referenceScenarioEnabled}
              disabled={!referenceScenario.trim()}
              onChange={(e) => setReferenceScenarioEnabled(e.target.checked)}
              style={{ accentColor: "#4ECCA3", width: 14, height: 14, cursor: "inherit" }}
            />
            <span style={{ fontSize: 12, color: referenceScenarioEnabled ? "#4ECCA3" : "var(--c-tx-45)", fontWeight: referenceScenarioEnabled ? 700 : 400, fontFamily: "'Noto Sans KR', sans-serif" }}>
              이후 모든 단계 분석에 이 내용 반영
            </span>
            {referenceScenarioEnabled && (
              <span style={{ fontSize: 10, color: "rgba(78,204,163,0.85)", background: "rgba(78,204,163,0.15)", padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>
                활성화됨 {referenceScenarioSummary ? "· 요약본 사용" : "· 원문 앞부분"}
              </span>
            )}
          </label>
        </div>
      )}
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

    {/* Empty state — 로그라인 미입력 시 예시 카드 표시 */}
    {!logline.trim() && !compareMode && (() => {
      const SAMPLE_LOGLINES = [
        { genre: "drama",   label: "드라마",  color: "#45B7D1", text: "가난한 청년이 재벌 가문의 비밀을 알게 된 후, 자신이 바로 그 가문의 숨겨진 후계자임을 깨닫고 가족과 신념 사이에서 선택을 강요받는다." },
        { genre: "thriller", label: "스릴러", color: "#E85D75", text: "연쇄살인마를 추적하던 형사가 다음 피해자가 자신의 딸임을 알게 되고, 법을 어기지 않고는 구할 수 없는 상황에 몰린다." },
        { genre: "romance", label: "로맨스",  color: "#A78BFA", text: "이혼 전문 변호사인 여자와 결혼 상담사인 남자가 서로의 직업을 숨긴 채 사랑에 빠지고, 진실이 드러나는 순간 관계가 무너진다." },
        { genre: "action",  label: "액션",   color: "#F7A072", text: "은퇴한 전직 요원이 평범한 삶을 살던 중 과거 자신이 훈련시킨 제자가 테러 조직의 수장이 되었다는 사실을 알고 다시 임무에 복귀한다." },
      ];
      return (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            예시로 바로 시작하거나 직접 입력하세요
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", gap: 8 }}>
            {SAMPLE_LOGLINES.map((item) => (
              <button
                key={item.genre}
                onClick={() => { setLogline(item.text); setGenre(item.genre); }}
                style={{
                  textAlign: "left", padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${item.color}22`,
                  background: `${item.color}08`,
                  cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${item.color}55`; e.currentTarget.style.background = `${item.color}14`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${item.color}22`; e.currentTarget.style.background = `${item.color}08`; }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.text}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    })()}

    {/* ── 교육 모드: 힌트 체크리스트 (분석 전) ── */}
    {eduMode && !result && logline.trim() && (
      <>
        {eduPhase === "checklist" && (
          <EduHintChecklist
            onStartAnalysis={() => { setEduPhase("selfAssess"); }}
            loading={loading}
          />
        )}
        {eduPhase === "selfAssess" && (
          <SelfAssessPanel
            onConfirm={(scores) => { setSelfScores(scores); analyze(); }}
            onInfoClick={setCriteriaKey}
          />
        )}
      </>
    )}

    {/* ── 교육 모드: 기준 모달 ── */}
    <ScoreCriteriaModal itemKey={criteriaKey} onClose={() => setCriteriaKey(null)} />

    {/* Main analyze button */}
    <Tooltip text={"로그라인을 입력하면 AI가 시나리오 전문가 관점에서 종합 분석을 시작합니다.\n\n분석 항목:\n• 구조적 완성도 — 이야기의 뼈대가 탄탄한지\n• 표현적 매력도 — 읽는 사람을 끌어당기는 힘\n• 기술적 완성도 — 장르·캐릭터·갈등의 명확성\n• 흥미 유발 지수 — 제작사가 관심을 가질 가능성\n\n분석 결과를 바탕으로 아래 심화 도구들이 활성화됩니다."} maxWidth={340}>
    <button onClick={() => { if (eduMode && !result) { setEduPhase("checklist"); } analyze(); }} disabled={loading || !logline.trim() || !apiKey} style={{
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

    {/* ── 데모 투어 Step 1 인라인 힌트 ── */}
    {isDemoMode && demoTourStep === 1 && result && (
      <div style={{
        margin: "20px 0 0", padding: "10px 14px",
        borderRadius: 10, animation: "fadeSlideUp 0.3s var(--ease-spring)",
        background: "rgba(200,168,75,0.07)",
        border: "1px solid rgba(200,168,75,0.3)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>👇</span>
        <span style={{ fontSize: 12, color: "#C8A84B", fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}>
          분석 결과가 아래 있어요! 스크롤해서 점수·흥미도·개선안을 확인해보세요.
        </span>
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
          <div style={{ display: "flex", gap: 4, minWidth: "max-content" }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: "0 0 auto", padding: isMobile ? "7px 11px" : "8px 14px",
                borderRadius: 8, cursor: "pointer", transition: "all 0.18s",
                border: activeTab === tab.id
                  ? "1px solid rgba(200,168,75,0.55)"
                  : "1px solid var(--c-bd-2)",
                background: activeTab === tab.id
                  ? "rgba(200,168,75,0.12)"
                  : "var(--glass-micro)",
                color: activeTab === tab.id ? "#C8A84B" : "var(--c-tx-50)",
                fontSize: 11, fontWeight: activeTab === tab.id ? 700 : 500,
                whiteSpace: "nowrap", fontFamily: "'Noto Sans KR', sans-serif",
              }}>{tab.label}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <ResultCard>
          {activeTab === "overview" && (
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <RadarChart data={radarData} size={isMobile ? 220 : 280} />
              </div>

              {/* ── 점수 히트맵 ── */}
              {radarData.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: "var(--c-tx-30)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Score Snapshot</div>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMobile ? 4 : 7}, 1fr)`, gap: 5 }}>
                    {radarData.map((d) => {
                      const pct = d.value;
                      const color = pct >= 0.8 ? "#4ECCA3" : pct >= 0.6 ? "#60A5FA" : pct >= 0.4 ? "#FFD166" : pct >= 0.2 ? "#F7A072" : "#E85D75";
                      return (
                        <div key={d.label} title={`${d.label}: ${d.rawScore}/${d.rawMax}`} style={{ padding: "6px 4px", borderRadius: 8, background: `${color}14`, border: `1px solid ${color}30`, textAlign: "center", cursor: "default" }}>
                          <div style={{ fontSize: 8, color: "var(--c-tx-40)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3, lineHeight: 1.2 }}>{d.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{d.rawScore}</div>
                          <div style={{ height: 2, borderRadius: 1, background: "var(--c-bd-1)", marginTop: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct * 100}%`, background: color, borderRadius: 1 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                      <span style={{ fontWeight: 700, color: "#C8A84B", marginRight: 5 }}>개선 팁</span>{CRITERIA_GUIDE[key]}
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
                      <span style={{ fontWeight: 700, color: "#C8A84B", marginRight: 5 }}>개선 팁</span>{CRITERIA_GUIDE[key]}
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
                      <span style={{ fontWeight: 700, color: "#C8A84B", marginRight: 5 }}>개선 팁</span>{CRITERIA_GUIDE[key]}
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
                      <span style={{ fontWeight: 700, color: "#C8A84B", marginRight: 5 }}>개선 팁</span>{CRITERIA_GUIDE[key]}
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
                    { color: "#C8A84B", title: "약점 수정", desc: "낮은 점수 항목만 골라 직접 고친 버전 제안" },
                    { color: "#60A5FA", title: "방향 전환", desc: "장르·관점·갈등을 완전히 다르게 바꾼 3가지 버전" },
                    { color: "#4ECCA3", title: "AI 개선안", desc: "종합 피드백을 반영한 자유 형식 개선 로그라인" },
                  ].map((item) => (
                    <div key={item.title} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(var(--tw),0.02)" }}>
                      <div style={{ width: 4, flexShrink: 0, borderRadius: 2, background: item.color, alignSelf: "stretch", minHeight: 32 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.title}</div>
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
    {/* ── 교육 모드: 예상 vs AI 비교 + 반성 일지 ── */}
    {eduMode && result && selfScores && (
      <ComparePanel selfScores={selfScores} aiResult={result} />
    )}
    {eduMode && result && (
      <ReflectionBox />
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
