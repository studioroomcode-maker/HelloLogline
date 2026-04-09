import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  SYSTEM_PROMPT, IMPROVEMENT_SYSTEM_PROMPT, SYNOPSIS_SYSTEM_PROMPT,
  ACADEMIC_ANALYSIS_SYSTEM_PROMPT, NARRATIVE_FRAMEWORKS, PIPELINE_ALL_QUESTIONS,
  PIPELINE_QUESTIONS_BY_DURATION, PIPELINE_SYNOPSIS_SYSTEM_PROMPT, PIPELINE_REFINE_SYSTEM_PROMPT,
  PANEL_EXPERTS, EXPERT_PANEL_SYSTEM_PROMPT, VALUE_CHARGE_SYSTEM_PROMPT, SHADOW_ANALYSIS_SYSTEM_PROMPT,
  AUTHENTICITY_SYSTEM_PROMPT, BEAT_SHEET_SYSTEM_PROMPT, SCENE_GEN_SYSTEM_PROMPT,
  CHARACTER_DEV_SYSTEM_PROMPT, TREATMENT_SYSTEM_PROMPT, SUBTEXT_SYSTEM_PROMPT,
  MYTH_MAP_SYSTEM_PROMPT, BARTHES_CODE_SYSTEM_PROMPT, KOREAN_MYTH_SYSTEM_PROMPT,
  SCRIPT_COVERAGE_SYSTEM_PROMPT, DIALOGUE_DEV_SYSTEM_PROMPT, SCENARIO_DRAFT_SYSTEM_PROMPT,
  STRUCTURE_ANALYSIS_SYSTEM_PROMPT, THEME_ANALYSIS_SYSTEM_PROMPT, SCENE_LIST_SYSTEM_PROMPT,
  COMPARABLE_WORKS_SYSTEM_PROMPT, VALUATION_SYSTEM_PROMPT,
  CRITERIA_GUIDE, LABELS_KR, GENRES, DURATION_OPTIONS, EXAMPLE_LOGLINES,
} from "./constants.js";
import { getGrade, getInterestLevel, formatDate, calcSectionTotal, callClaude, callClaudeText } from "./utils.js";
import {
  LoglineAnalysisSchema, SynopsisSchema, AcademicAnalysisSchema,
  MythMapSchema, BarthesCodeSchema, KoreanMythSchema, ExpertPanelSchema,
  ValueChargeSchema, ShadowAnalysisSchema, AuthenticitySchema, CharacterDevSchema,
  StructureAnalysisSchema, ThemeAnalysisSchema, SubtextSchema,
  BeatSheetSchema, DialogueDevSchema, ScriptCoverageSchema,
  ComparableWorksSchema, ValuationSchema,
} from "./schemas.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { saveProject, loadProjects, deleteProject } from "./db.js";
import {
  ApiKeyModal, HistoryPanel, ImprovementPanel, ExportButton, StoryDevPanel,
  AcademicPanel, AuthenticityPanel, ValueChargePanel, ShadowAnalysisPanel,
  ExpertPanelSection, PipelinePanel, SynopsisCard, CompareSection,
  BeatSheetPanel, TreatmentInputPanel, CharacterDevPanel,
  SubtextPanel, MythMapPanel, BarthesCodePanel, KoreanMythPanel,
  ScriptCoveragePanel, DialogueDevPanel,
  StructureAnalysisPanel, ThemeAnalysisPanel, SceneListPanel,
  ComparableWorksPanel, ValuationPanel,
  RadarChart, CircleGauge, ScoreBar, ScoreHistoryChart,
} from "./panels.jsx";

/* ─── SVG Icon Paths ─── */
const ICON = {
  edit: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  film: "M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  close: "M6 18L18 6M6 6l12 12",
  key: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
  history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  check: "M5 13l4 4L19 7",
  spinner: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z",
};

function SvgIcon({ d, size = 16, color = "currentColor", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

function Spinner({ size = 14, color = "var(--c-tx-70)" }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: `2px solid ${color}33`, borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0,
    }} />
  );
}

/* ─── DocButton ─── */
function DocButton({ label, sub, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 16px", borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer",
        border: "1px solid rgba(96,165,250,0.35)",
        background: hovered && !disabled ? "rgba(96,165,250,0.12)" : "rgba(96,165,250,0.06)",
        color: disabled ? "rgba(96,165,250,0.35)" : "#60A5FA",
        opacity: disabled ? 0.5 : 1, transition: "all 0.2s",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>{sub}</div>}
      </div>
    </button>
  );
}

/* ─── Stage definitions ─── */
const STAGES = [
  { id: "1", num: "01", name: "로그라인", sub: "입력 / 기본 분석 / 개선", icon: ICON.edit },
  { id: "3", num: "02", name: "캐릭터", sub: "그림자 / 진정성 / 캐릭터 디벨롭", icon: ICON.users },
  { id: "4", num: "03", name: "시놉시스", sub: "구조분석 / 가치전하 / 하위텍스트 / 시놉시스", icon: ICON.doc },
  { id: "2", num: "04", name: "개념 분석", sub: "학술 / 신화 / 전문가 / 서사 코드 / 테마 (선택)", icon: ICON.chart },
  { id: "5", num: "05", name: "트리트먼트 비트", sub: "트리트먼트 / 비트시트 / 대사", icon: ICON.film },
  { id: "6", num: "06", name: "시나리오 초고", sub: "시나리오 생성 / Field · McKee · Snyder", icon: ICON.film },
  { id: "7", num: "07", name: "Script Coverage", sub: "최종 커버리지 리포트", icon: ICON.clipboard },
];

/* ─── Tooltip component ─── */
// align: "left" | "center" | "right" — controls which edge of the tooltip anchors to the trigger
function Tooltip({ text, children, maxWidth = 300, align = "center" }) {
  const [visible, setVisible] = useState(false);
  const posStyle = align === "left"
    ? { left: 0 }
    : align === "right"
    ? { right: 0 }
    : { left: "50%", transform: "translateX(-50%)" };
  const arrowStyle = align === "left"
    ? { left: 20 }
    : align === "right"
    ? { right: 20 }
    : { left: "50%", transform: "translateX(-50%)" };
  return (
    <div
      style={{ position: "relative", display: "block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",
          ...posStyle,
          background: "var(--bg-tooltip)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 12,
          color: "var(--text-tooltip)",
          lineHeight: 1.75,
          maxWidth,
          width: "max-content",
          zIndex: 400,
          pointerEvents: "none",
          boxShadow: "0 10px 32px rgba(0,0,0,0.6)",
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 400,
          whiteSpace: "pre-wrap",
          wordBreak: "keep-all",
        }}>
          <div style={{
            position: "absolute", top: "100%",
            ...arrowStyle,
            width: 0, height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "7px solid var(--bg-tooltip)",
          }} />
          {text}
        </div>
      )}
    </div>
  );
}

/* ─── ToolButton component ─── */
function ToolButton({ icon, label, sub, done, loading, color, onClick, disabled, tooltip }) {
  const [hovered, setHovered] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        onMouseEnter={() => { setHovered(true); setTipVisible(true); }}
        onMouseLeave={() => { setHovered(false); setTipVisible(false); }}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10,
          border: done ? `1px solid ${color}40` : "1px solid var(--c-bd-2)",
          background: done ? `${color}08` : hovered ? "var(--c-card-1)" : "rgba(var(--tw),0.02)",
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
          display: "flex", alignItems: "center", gap: 10,
          textAlign: "left", transition: "all 0.2s",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <div style={{ color: done ? color : "var(--c-tx-40)", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: done ? color : "var(--c-tx-75)", lineHeight: 1.3 }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {tooltip && <span style={{ fontSize: 12, color: "rgba(var(--tw),0.18)", lineHeight: 1, userSelect: "none" }}>ⓘ</span>}
          {loading ? <Spinner size={12} color={color} /> : done ? (
            <SvgIcon d={ICON.check} size={14} color={color} />
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-bd-5)" }} />
          )}
        </div>
      </button>
      {tipVisible && tooltip && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          background: "var(--bg-tooltip)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 12,
          color: "var(--text-tooltip)",
          lineHeight: 1.75,
          maxWidth: 320,
          width: "max-content",
          zIndex: 400,
          pointerEvents: "none",
          boxShadow: "0 10px 32px rgba(0,0,0,0.6)",
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 400,
          whiteSpace: "pre-wrap",
          wordBreak: "keep-all",
        }}>
          <div style={{
            position: "absolute", bottom: "100%", right: 16,
            width: 0, height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderBottom: "7px solid var(--bg-tooltip)",
          }} />
          {tooltip}
        </div>
      )}
    </div>
  );
}

/* ─── ResultCard wrapper ─── */
function ResultCard({ children, onClose, title, color = "var(--c-bd-1)", onUndo, historyCount = 0 }) {
  return (
    <div style={{
      marginTop: 12, borderRadius: 14,
      border: `1px solid ${color}`,
      background: "rgba(var(--tw),0.02)",
      boxShadow: "inset 0 1px 0 var(--c-card-2)",
      position: "relative",
    }}>
      {(title || onClose || (onUndo && historyCount > 0)) && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", borderBottom: "1px solid var(--c-card-2)",
        }}>
          {title && <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{title}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {onUndo && historyCount > 0 && (
              <button
                onClick={onUndo}
                title={`이전 버전으로 되돌리기 (${historyCount}개 저장됨)`}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 7,
                  border: "1px solid rgba(167,139,250,0.3)",
                  background: "rgba(167,139,250,0.07)",
                  color: "#A78BFA", fontSize: 11, cursor: "pointer",
                  fontWeight: 600, lineHeight: 1.4,
                }}
              >
                ↩ 되돌리기 <span style={{ opacity: 0.6, fontWeight: 400 }}>({historyCount})</span>
              </button>
            )}
            {onClose && (
              <button onClick={onClose} style={{
                background: "none", border: "none", cursor: "pointer", padding: 4,
                color: "var(--c-tx-30)", lineHeight: 1,
              }}>
                <SvgIcon d={ICON.close} size={14} />
              </button>
            )}
          </div>
        </div>
      )}
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function LoglineAnalyzer() {
  // ── Theme ──
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ── API Key ──
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("logline_api_key") || ""
  );
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [serverHasKey, setServerHasKey] = useState(false);

  // ── Input ──
  const [logline, setLogline] = useState("");
  const [genre, setGenre] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // ── Compare mode ──
  const [compareMode, setCompareMode] = useState(false);
  const [logline2, setLogline2] = useState("");
  const [result2, setResult2] = useState(null);
  const [loading2, setLoading2] = useState(false);

  // ── History ──
  const [history, setHistory] = useState(
    () => JSON.parse(localStorage.getItem("logline_history") || "[]")
  );
  const [showHistory, setShowHistory] = useState(false);

  // ── Mobile ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // ── Stage ──
  const [currentStage, setCurrentStage] = useState("1");

  // ── Synopsis ──
  const [showSynopsisPanel, setShowSynopsisPanel] = useState(false);
  const [synopsisMode, setSynopsisMode] = useState("auto");
  const [selectedDuration, setSelectedDuration] = useState("feature");
  const [customTheme, setCustomTheme] = useState("");
  const [customDurationText, setCustomDurationText] = useState("");
  const [customFormatLabel, setCustomFormatLabel] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("three_act");
  const [frameworkInfoId, setFrameworkInfoId] = useState(null);
  const [directionCount, setDirectionCount] = useState(3);
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [synopsisResults, setSynopsisResults] = useState(null);
  const [synopsisError, setSynopsisError] = useState("");
  const [selectedSynopsisIndex, setSelectedSynopsisIndex] = useState(null);

  // ── Pipeline ──
  const [pipelineResult, setPipelineResult] = useState(null);
  const [pipelineFeedback, setPipelineFeedback] = useState("");
  const [pipelineRefineLoading, setPipelineRefineLoading] = useState(false);
  const [pipelineEditMode, setPipelineEditMode] = useState(false);
  const [pipelineEditData, setPipelineEditData] = useState(null);

  // ── Expert Panel ──
  const [expertPanelResult, setExpertPanelResult] = useState(null);
  const [expertPanelLoading, setExpertPanelLoading] = useState(false);
  const [expertPanelError, setExpertPanelError] = useState("");
  const expertPanelRef = useRef(null);

  // ── Value Charge (McKee) ──
  const [valueChargeResult, setValueChargeResult] = useState(null);
  const [valueChargeLoading, setValueChargeLoading] = useState(false);
  const [valueChargeError, setValueChargeError] = useState("");
  const valueChargeRef = useRef(null);

  // ── Shadow Analysis (Jung) ──
  const [shadowResult, setShadowResult] = useState(null);
  const [shadowLoading, setShadowLoading] = useState(false);
  const [shadowError, setShadowError] = useState("");
  const shadowRef = useRef(null);

  // ── Authenticity Index (Sartre) ──
  const [authenticityResult, setAuthenticityResult] = useState(null);
  const [authenticityLoading, setAuthenticityLoading] = useState(false);
  const [authenticityError, setAuthenticityError] = useState("");
  const authenticityRef = useRef(null);

  // ── Academic ──
  const [academicResult, setAcademicResult] = useState(null);
  const [academicLoading, setAcademicLoading] = useState(false);
  const [academicError, setAcademicError] = useState("");

  // ── Beat Sheet ──
  const [beatSheetResult, setBeatSheetResult] = useState(null);
  const [beatSheetLoading, setBeatSheetLoading] = useState(false);
  const [beatSheetError, setBeatSheetError] = useState("");
  const beatSheetRef = useRef(null);
  const [beatScenes, setBeatScenes] = useState({});
  const [generatingBeat, setGeneratingBeat] = useState(null);
  const [expandedBeats, setExpandedBeats] = useState({});
  const [allScenesLoading, setAllScenesLoading] = useState(false);
  const [allScenesProgress, setAllScenesProgress] = useState({ current: 0, total: 0, failed: [] });

  // ── Character Development ──
  const [charDevResult, setCharDevResult] = useState(null);
  const [charDevLoading, setCharDevLoading] = useState(false);
  const [charDevError, setCharDevError] = useState("");
  const charDevRef = useRef(null);

  // ── Subtext ──
  const [subtextResult, setSubtextResult] = useState(null);
  const [subtextLoading, setSubtextLoading] = useState(false);
  const [subtextError, setSubtextError] = useState("");
  const subtextRef = useRef(null);

  // ── Myth Map ──
  const [mythMapResult, setMythMapResult] = useState(null);
  const [mythMapLoading, setMythMapLoading] = useState(false);
  const [mythMapError, setMythMapError] = useState("");
  const mythMapRef = useRef(null);

  // ── Barthes Code ──
  const [barthesCodeResult, setBarthesCodeResult] = useState(null);
  const [barthesCodeLoading, setBarthesCodeLoading] = useState(false);
  const [barthesCodeError, setBarthesCodeError] = useState("");
  const barthesCodeRef = useRef(null);

  // ── Korean Myth ──
  const [koreanMythResult, setKoreanMythResult] = useState(null);
  const [koreanMythLoading, setKoreanMythLoading] = useState(false);
  const [koreanMythError, setKoreanMythError] = useState("");
  const koreanMythRef = useRef(null);

  // ── Script Coverage ──
  const [scriptCoverageResult, setScriptCoverageResult] = useState(null);
  const [scriptCoverageLoading, setScriptCoverageLoading] = useState(false);
  const [scriptCoverageError, setScriptCoverageError] = useState("");
  const scriptCoverageRef = useRef(null);

  // ── Comparable Works ──
  const [comparableResult, setComparableResult] = useState(null);
  const [comparableLoading, setComparableLoading] = useState(false);
  const [comparableError, setComparableError] = useState("");
  const comparableRef = useRef(null);

  // ── Valuation ──
  const [valuationResult, setValuationResult] = useState(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationError, setValuationError] = useState("");
  const valuationRef = useRef(null);

  // ── Dialogue Dev ──
  const [dialogueDevResult, setDialogueDevResult] = useState(null);
  const [dialogueDevLoading, setDialogueDevLoading] = useState(false);
  const [dialogueDevError, setDialogueDevError] = useState("");
  const dialogueDevRef = useRef(null);

  // ── Structure Analysis ──
  const [structureResult, setStructureResult] = useState(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState("");
  const structureRef = useRef(null);

  // ── Theme Analysis ──
  const [themeResult, setThemeResult] = useState(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeError, setThemeError] = useState("");
  const themeRef = useRef(null);

  // ── Scene List ──
  const [sceneListResult, setSceneListResult] = useState("");
  const [sceneListLoading, setSceneListLoading] = useState(false);
  const [sceneListError, setSceneListError] = useState("");
  const sceneListRef = useRef(null);

  // ── Scenario Draft ──
  const [scenarioDraftResult, setScenarioDraftResult] = useState("");
  const [scenarioDraftLoading, setScenarioDraftLoading] = useState(false);
  const [scenarioDraftError, setScenarioDraftError] = useState("");

  // ── Writer Edits ──
  const [writerEdits, setWriterEdits] = useState({});
  // 구조: { treatment: string|null, synopsis: string|null, character: {...}|null, beats: {[id]: string} }

  // ── Version History (최대 5개) ──
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [beatSheetHistory, setBeatSheetHistory] = useState([]);
  const [scenarioDraftHistory, setScenarioDraftHistory] = useState([]);
  const [charDevHistory, setCharDevHistory] = useState([]);
  const [pipelineHistory, setPipelineHistory] = useState([]);

  const [editingTreatment, setEditingTreatment] = useState(false);
  const [treatmentEditDraft, setTreatmentEditDraft] = useState("");
  const [editingCharacter, setEditingCharacter] = useState(false);
  const [charEditDraft, setCharEditDraft] = useState({});
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [synopsisEditDraft, setSynopsisEditDraft] = useState("");
  const [editingBeats, setEditingBeats] = useState({}); // { [beatId]: boolean }
  const [beatEditDrafts, setBeatEditDrafts] = useState({}); // { [beatId]: string }

  // ── Project persistence ──
  const [showProjects, setShowProjects] = useState(false);
  const [showStoryBible, setShowStoryBible] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [saveStatus, setSaveStatus] = useState(""); // "saving" | "saved" | ""
  const importFileRef = useRef(null);

  // ── First visit onboarding ──
  const [isFirstVisit] = useState(() => !localStorage.getItem("logline_visited"));

  // ── Abort controllers (per operation key) ──
  const abortControllersRef = useRef({});

  function makeController(key) {
    if (abortControllersRef.current[key]) {
      abortControllersRef.current[key].abort();
    }
    const ctrl = new AbortController();
    abortControllersRef.current[key] = ctrl;
    return ctrl;
  }
  function clearController(key) {
    delete abortControllersRef.current[key];
  }
  function cancelOperation(key, setLoadingFn) {
    if (abortControllersRef.current[key]) {
      abortControllersRef.current[key].abort();
      clearController(key);
    }
    if (setLoadingFn) setLoadingFn(false);
  }

  // ── Treatment ──
  const [showTreatmentPanel, setShowTreatmentPanel] = useState(false);
  const [treatmentChars, setTreatmentChars] = useState({
    protagonist: { name: "", role: "", want: "", need: "", flaw: "" },
    supporting: [{ name: "", role: "", relation: "" }],
  });
  const [treatmentStructure, setTreatmentStructure] = useState("3act");
  const [treatmentResult, setTreatmentResult] = useState("");
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [treatmentError, setTreatmentError] = useState("");
  const treatmentRef = useRef(null);

  const resultRef = useRef(null);
  const synopsisRef = useRef(null);
  const academicRef = useRef(null);
  const mainContentRef = useRef(null);
  const stageRefs = useRef({});

  function advanceToStage(nextId) {
    setCurrentStage(nextId);
    setTimeout(() => {
      stageRefs.current[nextId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    // 서버가 API 키를 갖고 있으면 클라이언트 키 불필요
    // /api/health (Vercel) 또는 /health (로컬 Express) 순서로 시도
    const checkHealth = (url) =>
      fetch(url)
        .then((r) => r.ok ? r.json() : Promise.reject(r.status))
        .then((d) => {
          if (d.hasKey) {
            setServerHasKey(true);
            if (!localStorage.getItem("logline_api_key")) {
              setApiKey("__server__");
            }
          } else if (!apiKey) {
            setShowApiKeyModal(true);
          }
        });

    checkHealth("/api/health")
      .catch(() => checkHealth("/health"))
      .catch(() => { if (!apiKey) setShowApiKeyModal(true); });
  }, []);

  // ── Auto-save helper ──
  const collectProjectSnapshot = () => ({
    id: currentProjectId || Date.now(),
    title: logline.slice(0, 60) || "제목 없음",
    logline, genre, selectedDuration, customTheme, customDurationText, customFormatLabel,
    result, result2,
    academicResult, mythMapResult, koreanMythResult,
    expertPanelResult, barthesCodeResult,
    shadowResult, authenticityResult, charDevResult,
    valueChargeResult, subtextResult,
    synopsisResults, pipelineResult, selectedSynopsisIndex,
    treatmentResult, beatSheetResult, beatScenes,
    dialogueDevResult, scriptCoverageResult,
    structureResult, themeResult, sceneListResult, scenarioDraftResult,
    comparableResult, valuationResult,
    writerEdits,
    treatmentHistory, beatSheetHistory, scenarioDraftHistory, charDevHistory, pipelineHistory,
  });

  const autoSave = async () => {
    setSaveStatus("saving");
    try {
      const snapshot = collectProjectSnapshot();
      if (!currentProjectId) setCurrentProjectId(snapshot.id);
      await saveProject(snapshot);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      console.error("자동 저장 실패:", e);
      setSaveStatus("");
    }
  };

  const openProjects = async () => {
    try {
      const list = await loadProjects();
      setSavedProjects(list);
      setShowProjects(true);
    } catch (e) {
      console.error("프로젝트 목록 로드 실패:", e);
    }
  };

  const loadProjectState = (proj) => {
    setLogline(proj.logline || "");
    setGenre(proj.genre || "auto");
    setSelectedDuration(proj.selectedDuration || "feature");
    setCustomTheme(proj.customTheme || "");
    setCustomDurationText(proj.customDurationText || "");
    setCustomFormatLabel(proj.customFormatLabel || "");
    setResult(proj.result || null);
    setResult2(proj.result2 || null);
    setAcademicResult(proj.academicResult || null);
    setMythMapResult(proj.mythMapResult || null);
    setKoreanMythResult(proj.koreanMythResult || null);
    setExpertPanelResult(proj.expertPanelResult || null);
    setBarthesCodeResult(proj.barthesCodeResult || null);
    setShadowResult(proj.shadowResult || null);
    setAuthenticityResult(proj.authenticityResult || null);
    setCharDevResult(proj.charDevResult || null);
    setValueChargeResult(proj.valueChargeResult || null);
    setSubtextResult(proj.subtextResult || null);
    setSynopsisResults(proj.synopsisResults || null);
    setSelectedSynopsisIndex(proj.selectedSynopsisIndex ?? null);
    setPipelineResult(proj.pipelineResult || null);
    setTreatmentResult(proj.treatmentResult || "");
    setBeatSheetResult(proj.beatSheetResult || null);
    setBeatScenes(proj.beatScenes || {});
    setDialogueDevResult(proj.dialogueDevResult || null);
    setScriptCoverageResult(proj.scriptCoverageResult || null);
    setStructureResult(proj.structureResult || null);
    setThemeResult(proj.themeResult || null);
    setSceneListResult(proj.sceneListResult || "");
    setScenarioDraftResult(proj.scenarioDraftResult || "");
    setComparableResult(proj.comparableResult || null);
    setValuationResult(proj.valuationResult || null);
    setWriterEdits(proj.writerEdits || {});
    setTreatmentHistory(proj.treatmentHistory || []);
    setBeatSheetHistory(proj.beatSheetHistory || []);
    setScenarioDraftHistory(proj.scenarioDraftHistory || []);
    setCharDevHistory(proj.charDevHistory || []);
    setPipelineHistory(proj.pipelineHistory || []);
    setCurrentProjectId(proj.id);
    setShowProjects(false);
    setCurrentStage("1");
  };

  const deleteProjectById = async (id) => {
    await deleteProject(id);
    setSavedProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // ── JSON 내보내기 ──
  const exportProjectJson = () => {
    const snapshot = collectProjectSnapshot();
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logline_${snapshot.title.slice(0, 20).replace(/\s+/g, "_") || "project"}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── JSON 가져오기 ──
  const importProjectJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const proj = JSON.parse(ev.target.result);
        if (!proj.logline) throw new Error("유효하지 않은 프로젝트 파일입니다.");
        proj.id = Date.now();
        loadProjectState(proj);
        alert(`"${proj.title || proj.logline.slice(0, 30)}" 프로젝트를 불러왔습니다.`);
      } catch (err) {
        alert("파일을 읽는 중 오류가 발생했습니다: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── 첫 방문 예시 자동 입력 ──
  const applyExampleLogline = () => {
    const example = EXAMPLE_LOGLINES[0];
    setLogline(example);
    setGenre("comedy");
    localStorage.setItem("logline_visited", "1");
  };

  const dismissFirstVisit = () => {
    localStorage.setItem("logline_visited", "1");
  };

  // ── Application Document PDF Generator ──
  const openApplicationDoc = (docType) => {
    const genreLabel = genre === "auto"
      ? (result?.detected_genre || "미정")
      : GENRES.find(g => g.id === genre)?.label || "미정";
    const durLabel = getDurText();
    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
    const qualScore = result ? (calcSectionTotal(result, "structure") + calcSectionTotal(result, "expression") + calcSectionTotal(result, "technical")) : null;
    const intScore = result ? calcSectionTotal(result, "interest") : null;

    const synopsisText = pipelineResult?.synopsis || synopsisResults?.synopses?.[0]?.synopsis || "";
    const synopsisTitle = pipelineResult?.direction_title || synopsisResults?.synopses?.[0]?.direction_title || "";
    const keyScenes = pipelineResult?.key_scenes || synopsisResults?.synopses?.[0]?.key_scenes || [];
    const synopsisTheme = pipelineResult?.theme || synopsisResults?.synopses?.[0]?.theme || "";

    const protagonist = charDevResult?.protagonist;
    const supporting = charDevResult?.supporting_characters || [];

    const docMeta = {
      logline:   { title: "기초 기획서",     subtitle: "로그라인 기반 초기 기획", badge: "STEP 1" },
      synopsis:  { title: "기획서",           subtitle: "시놉시스 포함 기획 문서",  badge: "STEP 2" },
      treatment: { title: "상세 기획서",      subtitle: "트리트먼트 포함 제작 기획", badge: "STEP 3" },
      final:     { title: "투자·지원 제안서", subtitle: "스크립트 커버리지 포함 최종 제안", badge: "FINAL" },
    }[docType] || { title: "기획서", subtitle: "", badge: "" };

    const sec = (title, content) => content ? `
      <section>
        <h2>${title}</h2>
        <div class="section-body">${content}</div>
      </section>` : "";

    const tag = (label, value) => value ? `<div class="tag-row"><span class="tag-label">${label}</span><span class="tag-value">${value}</span></div>` : "";

    const scoreBar = (label, score, max) => `
      <div class="score-item">
        <span class="score-label">${label}</span>
        <div class="score-track"><div class="score-fill" style="width:${Math.round(score/max*100)}%"></div></div>
        <span class="score-num">${score}/${max}</span>
      </div>`;

    // ── Sections by docType ──
    let body = "";

    // 1. 프로젝트 개요 (all)
    body += sec("프로젝트 개요", `
      ${tag("장르", genreLabel)}
      ${tag("포맷", durLabel)}
      ${tag("로그라인", logline || "—")}
      ${themeResult?.controlling_idea ? tag("컨트롤링 아이디어", themeResult.controlling_idea) : ""}
      ${synopsisTheme ? tag("핵심 주제", synopsisTheme) : ""}
    `);

    // 2. 기획의도 (synopsis+)
    if (docType !== "logline") {
      const intent = themeResult ? `
        <p><strong>핵심 메시지:</strong> ${themeResult.theme_statement || themeResult.controlling_idea || ""}</p>
        ${themeResult.thematic_question ? `<p><strong>작품이 던지는 질문:</strong> "${themeResult.thematic_question}"</p>` : ""}
        ${themeResult.moral_premise?.statement ? `<p><strong>도덕적 전제 (Egri):</strong> ${themeResult.moral_premise.statement}</p>` : ""}
        ${themeResult.protagonist_inner_journey?.lesson ? `<p><strong>주인공이 배우는 것:</strong> ${themeResult.protagonist_inner_journey.lesson}</p>` : ""}
        ${themeResult.thematic_layers ? themeResult.thematic_layers.map(l => `<p><strong>${l.layer}:</strong> ${l.description}</p>`).join("") : ""}
      ` : synopsisTheme ? `<p>${synopsisTheme}</p>` : null;
      if (intent) body += sec("기획의도", intent);
    }

    // 3. 로그라인 분석 (logline 단계)
    if (docType === "logline" && result) {
      body += sec("로그라인 분석 결과", `
        ${qualScore !== null ? scoreBar("품질 점수", qualScore, 100) : ""}
        ${intScore !== null ? scoreBar("흥미 유발 지수", intScore, 100) : ""}
        ${result.overall_feedback ? `<p class="feedback">${result.overall_feedback}</p>` : ""}
        ${themeResult?.controlling_idea ? `<p><strong>테마:</strong> ${themeResult.controlling_idea}</p>` : ""}
      `);
    }

    // 4. 등장인물 소개 (treatment+)
    if (docType === "treatment" || docType === "final") {
      if (protagonist) {
        const charContent = `
          <div class="character-block">
            <h3>${protagonist.name_suggestion || "주인공"}</h3>
            ${protagonist.egri?.sociology ? `<p><strong>배경:</strong> ${protagonist.egri.sociology}</p>` : ""}
            ${protagonist.want ? `<p><strong>외적 목표 (Want):</strong> ${protagonist.want}</p>` : ""}
            ${protagonist.need ? `<p><strong>내적 욕구 (Need):</strong> ${protagonist.need}</p>` : ""}
            ${protagonist.flaw ? `<p><strong>핵심 결함:</strong> ${protagonist.flaw}</p>` : ""}
            ${protagonist.ghost ? `<p><strong>상처 (Ghost):</strong> ${protagonist.ghost}</p>` : ""}
          </div>
          ${supporting.slice(0, 3).map(c => `
            <div class="character-block secondary">
              <h3>${c.name || "조연"} <span class="role-badge">${c.role || ""}</span></h3>
              ${c.function ? `<p>${c.function}</p>` : ""}
            </div>
          `).join("")}
        `;
        body += sec("등장인물 소개", charContent);
      }
    }

    // 5. 시놉시스 (synopsis+)
    if (docType !== "logline" && synopsisText) {
      let synContent = `<p class="synopsis-text">${synopsisText.replace(/\n/g, "<br>")}</p>`;
      if (keyScenes.length > 0) {
        synContent += `<h3>주요 장면</h3><ul>${keyScenes.map(s => `<li>${s}</li>`).join("")}</ul>`;
      }
      if (synopsisTitle) synContent = `<p class="synopsis-direction"><strong>방향:</strong> ${synopsisTitle}</p>` + synContent;
      body += sec("시놉시스", synContent);
    }

    // 6. 구조 개요 (synopsis+)
    if (docType !== "logline" && structureResult) {
      const structContent = `
        ${structureResult.moral_argument ? `<p><strong>서사 논증:</strong> ${structureResult.moral_argument}</p>` : ""}
        ${structureResult.plot_points ? `
          <table>
            <thead><tr><th>플롯 포인트</th><th>페이지</th><th>내용</th></tr></thead>
            <tbody>
              ${structureResult.plot_points.map(pp => `
                <tr>
                  <td><strong>${pp.name}</strong></td>
                  <td>p.${pp.page}</td>
                  <td>${pp.description}</td>
                </tr>`).join("")}
            </tbody>
          </table>` : ""}
        ${structureResult.structural_strengths?.length > 0 ? `<p><strong>구조적 강점:</strong> ${structureResult.structural_strengths.join(", ")}</p>` : ""}
      `;
      body += sec("3막 구조 개요", structContent);
    }

    // 7. 트리트먼트 (treatment+)
    if ((docType === "treatment" || docType === "final") && treatmentResult) {
      body += sec("트리트먼트", `<div class="treatment-text">${treatmentResult.replace(/\n/g, "<br>").replace(/#{1,3} (.+)/g, "<strong>$1</strong>")}</div>`);
    }

    // 8. Script Coverage 요약 (final)
    if (docType === "final" && scriptCoverageResult) {
      const cv = scriptCoverageResult;
      const verdictColor = cv.verdict === "RECOMMEND" ? "#1a7a4a" : cv.verdict === "CONSIDER" ? "#7a5a1a" : "#7a1a1a";
      const verdictKr = { RECOMMEND: "추천", CONSIDER: "검토", PASS: "보류" }[cv.verdict] || cv.verdict;
      body += sec("Script Coverage", `
        <div class="verdict-box" style="border-color:${verdictColor};background:${verdictColor}11">
          <span class="verdict-label" style="color:${verdictColor}">${verdictKr} (${cv.verdict})</span>
          ${cv.logline_score !== undefined ? `<span class="verdict-score">종합 ${cv.logline_score ?? "—"}/100</span>` : ""}
        </div>
        ${cv.summary ? `<p>${cv.summary}</p>` : ""}
        ${cv.strengths?.length > 0 ? `<p><strong>강점:</strong> ${cv.strengths.join(" / ")}</p>` : ""}
        ${cv.weaknesses?.length > 0 ? `<p><strong>보완점:</strong> ${cv.weaknesses.join(" / ")}</p>` : ""}
        ${cv.recommendation ? `<p><strong>제언:</strong> ${cv.recommendation}</p>` : ""}
      `);
    }

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${docMeta.title} — ${logline.slice(0, 20) || "기획서"}</title>
<style>
  /* ── A4 페이지 기준 설정 ── */
  @page {
    size: A4 portrait;
    margin: 20mm 25mm 20mm 25mm;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: "Malgun Gothic", "AppleGothic", "NanumGothic", sans-serif;
    font-size: 10.5pt;
    color: #1a1a2e;
    background: #fff;
    line-height: 1.8;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── 커버: A4 한 장 (297mm - 상하마진 40mm = 257mm) ── */
  .cover {
    height: 257mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    border-bottom: 3px solid #1a1a2e;
    page-break-after: always;
  }
  .cover-badge { font-size: 8.5pt; font-weight: 700; letter-spacing: 3px; color: #666; margin-bottom: 28pt; }
  .cover-title { font-size: 32pt; font-weight: 900; line-height: 1.15; margin-bottom: 10pt; }
  .cover-subtitle { font-size: 12pt; color: #555; margin-bottom: 40pt; }
  .cover-divider { width: 50pt; height: 3pt; background: #1a1a2e; margin-bottom: 28pt; }
  .cover-meta { font-size: 10pt; color: #444; line-height: 2.2; }
  .cover-meta strong { color: #1a1a2e; }
  .cover-date { margin-top: 40pt; font-size: 8.5pt; color: #888; }

  /* ── 본문: @page 마진이 여백 처리 — 패딩 불필요 ── */
  .content { padding: 0; }

  /* ── 섹션: 기본적으로 페이지 내부에서 안 잘리게 ── */
  section {
    margin-bottom: 28pt;
    page-break-inside: avoid;
  }

  /* 트리트먼트처럼 긴 섹션은 페이지 넘어가도 허용 */
  section.allow-break {
    page-break-inside: auto;
  }

  /* 제목 다음에 바로 페이지 끊기지 않게 */
  h2 {
    font-size: 13pt;
    font-weight: 800;
    border-left: 4pt solid #1a1a2e;
    padding-left: 10pt;
    margin-bottom: 12pt;
    letter-spacing: 0.3pt;
    page-break-after: avoid;
  }
  h3 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #333;
    margin: 11pt 0 5pt;
    page-break-after: avoid;
  }

  .section-body { padding-left: 14pt; }

  p {
    margin-bottom: 8pt;
    orphans: 3;
    widows: 3;
  }

  .tag-row { display: flex; gap: 10pt; margin-bottom: 7pt; align-items: flex-start; }
  .tag-label { font-size: 8.5pt; font-weight: 700; color: #666; min-width: 90pt; padding-top: 1pt; white-space: nowrap; }
  .tag-value { font-size: 10pt; color: #1a1a2e; line-height: 1.65; }

  .score-item { display: flex; align-items: center; gap: 10pt; margin-bottom: 7pt; page-break-inside: avoid; }
  .score-label { font-size: 8.5pt; min-width: 70pt; color: #555; }
  .score-track { flex: 1; height: 6pt; background: #eee; border-radius: 3pt; overflow: hidden; }
  .score-fill { height: 100%; background: #1a1a2e; border-radius: 3pt; }
  .score-num { font-size: 8.5pt; font-weight: 700; min-width: 35pt; text-align: right; }

  .feedback { font-style: italic; color: #444; background: #f8f8f8; padding: 10pt 14pt; border-left: 3pt solid #ccc; border-radius: 0 3pt 3pt 0; page-break-inside: avoid; }

  .synopsis-direction { color: #666; font-size: 9.5pt; margin-bottom: 7pt; }
  .synopsis-text { line-height: 2; text-indent: 1em; }

  .character-block { border: 1pt solid #ddd; border-radius: 3pt; padding: 12pt 14pt; margin-bottom: 10pt; page-break-inside: avoid; }
  .character-block.secondary { background: #fafafa; }
  .character-block h3 { margin-top: 0; font-size: 11pt; }
  .role-badge { font-size: 7.5pt; font-weight: 600; color: #888; background: #eee; padding: 1pt 6pt; border-radius: 8pt; margin-left: 5pt; }

  .treatment-text { font-size: 9.5pt; line-height: 1.95; color: #333; }

  /* 테이블: row 단위로는 안 잘리게 */
  table { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 9.5pt; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  th { background: #1a1a2e; color: #fff; padding: 7pt 10pt; text-align: left; font-weight: 700; }
  td { padding: 7pt 10pt; border-bottom: 1pt solid #eee; vertical-align: top; }
  tr:nth-child(even) td { background: #f9f9f9; }

  .verdict-box { border: 2pt solid; border-radius: 5pt; padding: 12pt 16pt; margin-bottom: 12pt; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid; }
  .verdict-label { font-size: 15pt; font-weight: 900; }
  .verdict-score { font-size: 11pt; font-weight: 700; }

  ul { padding-left: 16pt; }
  li { margin-bottom: 4pt; orphans: 2; widows: 2; }

  /* 화면 미리보기용 (인쇄 전) */
  @media screen {
    body { padding: 20mm 25mm; max-width: 210mm; margin: 0 auto; box-shadow: 0 0 20px rgba(0,0,0,0.15); }
    .cover { height: auto; min-height: 180mm; padding: 40pt 0; }
  }
</style>
</head>
<body>
  <div class="cover">
    <div class="cover-badge">${docMeta.badge} &nbsp;·&nbsp; HELLO LOGLINE</div>
    <div class="cover-title">${docMeta.title}</div>
    <div class="cover-subtitle">${docMeta.subtitle}</div>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div><strong>장르:</strong> ${genreLabel}</div>
      <div><strong>포맷:</strong> ${durLabel}</div>
      <div><strong>로그라인:</strong> ${logline || "—"}</div>
    </div>
    <div class="cover-date">작성일: ${today} &nbsp;·&nbsp; Powered by Hello Loglines × Claude AI</div>
  </div>
  <div class="content">
    ${body}
  </div>
  <script>window.onload = () => { document.title = "${docMeta.title}"; window.print(); };</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=794,height=1123");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const saveApiKey = (key) => {
    localStorage.setItem("logline_api_key", key);
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  const saveToHistory = (loglineText, genreId, resultData, qScore, iScore) => {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      logline: loglineText,
      genre: genreId,
      detectedGenre: resultData?.detected_genre,
      result: resultData,
      qualityScore: qScore,
      interestScore: iScore,
    };
    const prev = JSON.parse(localStorage.getItem("logline_history") || "[]");
    const updated = [entry, ...prev].slice(0, 30);
    localStorage.setItem("logline_history", JSON.stringify(updated));
    setHistory(updated);
  };

  // 현재 선택된 포맷 텍스트 반환 (커스텀 / 프리셋 통합)
  const getDurText = () => {
    if (selectedDuration === "custom") {
      const label = customFormatLabel || "커스텀 포맷";
      const dur = customDurationText || "길이 미지정";
      return `${label} (${dur})`;
    }
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    return dur ? `${dur.label} (${dur.duration})` : "장편영화 (90~120분)";
  };

  // 커스텀 모드일 때 주제/컨셉 컨텍스트 블록 반환
  const getCustomContext = () => {
    if (selectedDuration !== "custom" || !customTheme.trim()) return "";
    return `\n주제/컨셉: ${customTheme.trim()}`;
  };

  // ── Writer Edits 헬퍼 ──
  // 작가 수정본이 있으면 그걸, 없으면 AI 원본 반환
  function getEffective(key, aiValue) {
    const v = writerEdits[key];
    return (v !== undefined && v !== null && v !== "") ? v : aiValue;
  }
  function setWriterEdit(key, value) {
    setWriterEdits(prev => ({ ...prev, [key]: value }));
  }
  function clearWriterEdit(key) {
    setWriterEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  // ── Version History 헬퍼 ──
  // 현재 값을 히스토리에 쌓고 (최대 5), writerEdit도 함께 클리어
  function pushHistory(setHistoryFn, currentValue, editKey) {
    if (currentValue === null || currentValue === "" || currentValue === undefined) return;
    setHistoryFn(prev => [...prev.slice(-4), currentValue]);
    if (editKey) clearWriterEdit(editKey);
  }
  // 히스토리에서 마지막 항목을 꺼내 복원
  function undoHistory(setHistoryFn, setResultFn, historyArr) {
    if (!historyArr.length) return;
    const last = historyArr[historyArr.length - 1];
    setResultFn(last);
    setHistoryFn(prev => prev.slice(0, -1));
  }

  // ── Story Bible: 확정된 시놉시스를 다음 단계 프롬프트에 전달하는 컨텍스트 블록 ──
  // 파이프라인 결과 > 사용자가 선택한 시놉시스 방향 > 빈 문자열 순으로 우선순위 결정
  const getStoryBible = () => {
    const s = pipelineResult
      || (selectedSynopsisIndex !== null ? synopsisResults?.synopses?.[selectedSynopsisIndex] : null);
    if (!s) return "";
    const scenes = (s.key_scenes || []).map((sc, i) => `  ${i + 1}. ${sc}`).join("\n");
    const storyText = getEffective("synopsis", s.synopsis || "");
    return `\n\n━━━ 확정된 시놉시스 — 반드시 이 방향으로 이야기를 발전시킬 것 ━━━
제목/방향: ${s.direction_title || ""}
장르/톤: ${s.genre_tone || ""}
훅: ${s.hook || ""}

${storyText}${scenes ? `\n\n핵심 장면:\n${scenes}` : ""}${s.theme ? `\n\n주제: ${s.theme}` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

※ 위 시놉시스의 등장인물 이름·설정·배경·핵심 장면을 그대로 유지하세요. 새로운 이야기를 창작하지 말고, 위 시놉시스를 발전시키세요.`;
  };

  const buildUserMsg = (text, genreId) => {
    const genreText = genreId === "auto"
      ? "장르를 자동으로 감지해주세요."
      : `선택된 장르: ${GENRES.find((g) => g.id === genreId)?.label}`;
    return `다음 로그라인을 분석해주세요.\n\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreText}\n글자수: ${text.length}자\n\n로그라인:\n"${text.trim()}"`;
  };

  // ── Analyze ──
  const analyze = async (overrideLogline) => {
    const target = overrideLogline ?? logline;
    if (!target.trim() || !apiKey) return;
    if (overrideLogline) setLogline(overrideLogline);
    const ctrl = makeController("analyze");
    setLoading(true);
    setError("");
    setResult(null);
    setResult2(null);
    try {
      const parsed = await callClaude(apiKey, SYSTEM_PROMPT, buildUserMsg(target, genre), 3000, "claude-sonnet-4-6", ctrl.signal, LoglineAnalysisSchema);
      const sT = calcSectionTotal(parsed, "structure");
      const eT = calcSectionTotal(parsed, "expression");
      const tT = calcSectionTotal(parsed, "technical");
      const iT = calcSectionTotal(parsed, "interest");
      const qScore = sT + eT + tT;
      setResult(parsed);
      saveToHistory(target, genre, parsed, qScore, iT);
      if (compareMode && logline2.trim()) {
        setLoading2(true);
        try {
          const parsed2 = await callClaude(apiKey, SYSTEM_PROMPT, buildUserMsg(logline2, genre), 3000, "claude-sonnet-4-6", ctrl.signal, LoglineAnalysisSchema);
          const s2 = calcSectionTotal(parsed2, "structure");
          const e2 = calcSectionTotal(parsed2, "expression");
          const t2 = calcSectionTotal(parsed2, "technical");
          const i2 = calcSectionTotal(parsed2, "interest");
          setResult2(parsed2);
          saveToHistory(logline2, genre, parsed2, s2 + e2 + t2, i2);
        } catch (err2) { if (err2.name !== "AbortError") console.error("Compare error:", err2); }
        finally { setLoading2(false); }
      }
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message || "분석 중 오류가 발생했습니다.");
    } finally { setLoading(false); clearController("analyze"); }
  };

  // ── Synopsis ──
  const generateSynopsis = async () => {
    if (!logline.trim() || !apiKey) return;
    setSynopsisLoading(true);
    setSynopsisError("");
    setSynopsisResults(null);
    const duration = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const genreLabel = genre === "auto" ? "자동 감지 (로그라인에서 판단)" : GENRES.find((g) => g.id === genre)?.label || "";
    const framework = NARRATIVE_FRAMEWORKS.find((f) => f.id === selectedFramework);

    // ── 이전 스테이지 분석 결과 컨텍스트 수집 ──
    const contextParts = [];

    if (academicResult) {
      const highlights = [];
      if (academicResult.aristotle?.hamartia) highlights.push(`하마르티아(비극적 결함): ${academicResult.aristotle.hamartia}`);
      if (academicResult.campbell?.stage) highlights.push(`캠벨 여정 단계: ${academicResult.campbell.stage}`);
      if (academicResult.overall_insight) highlights.push(`학술 종합: ${academicResult.overall_insight}`);
      if (highlights.length > 0) contextParts.push(`[학술 분석 결과 — 시놉시스에 반영할 것]\n${highlights.join("\n")}`);
    }

    if (valueChargeResult) {
      const vc = [];
      if (valueChargeResult.opening_charge) vc.push(`시작 가치: ${valueChargeResult.opening_charge}`);
      if (valueChargeResult.climax_charge) vc.push(`클라이맥스 가치 전하: ${valueChargeResult.climax_charge}`);
      if (valueChargeResult.recommended_arc) vc.push(`권장 가치 아크: ${valueChargeResult.recommended_arc}`);
      if (vc.length > 0) contextParts.push(`[McKee 가치 전하 분석 — 감정 아크 설계에 반영]\n${vc.join("\n")}`);
    }

    if (shadowResult) {
      const sh = [];
      if (shadowResult.protagonist_archetype) sh.push(`주인공 원형: ${shadowResult.protagonist_archetype}`);
      if (shadowResult.shadow_figure) sh.push(`그림자 인물: ${shadowResult.shadow_figure}`);
      if (shadowResult.individuation_path) sh.push(`개성화 경로: ${shadowResult.individuation_path}`);
      if (sh.length > 0) contextParts.push(`[Jung 그림자 분석 — 캐릭터 심리 설계에 반영]\n${sh.join("\n")}`);
    }

    if (authenticityResult) {
      const au = [];
      if (authenticityResult.authenticity_verdict) au.push(`진정성 판단: ${authenticityResult.authenticity_verdict}`);
      if (authenticityResult.bad_faith_risk) au.push(`자기기만 위험: ${authenticityResult.bad_faith_risk}`);
      if (authenticityResult.recommendation) au.push(`실존적 방향 제언: ${authenticityResult.recommendation}`);
      if (au.length > 0) contextParts.push(`[Sartre 진정성 분석 — 주인공 선택의 진정성에 반영]\n${au.join("\n")}`);
    }

    if (expertPanelResult) {
      const ep = [];
      if (expertPanelResult.consensus) ep.push(`전문가 합의: ${expertPanelResult.consensus}`);
      if (expertPanelResult.key_concern) ep.push(`핵심 우려: ${expertPanelResult.key_concern}`);
      if (expertPanelResult.development_direction) ep.push(`발전 방향: ${expertPanelResult.development_direction}`);
      if (ep.length > 0) contextParts.push(`[전문가 패널 토론 결과 — 이야기 방향에 반영]\n${ep.join("\n")}`);
    }

    if (subtextResult) {
      const st = [];
      if (subtextResult.deeper_story) st.push(`하위텍스트 이야기: ${subtextResult.deeper_story}`);
      if (subtextResult.core_desire) st.push(`숨겨진 욕망: ${subtextResult.core_desire}`);
      if (st.length > 0) contextParts.push(`[하위텍스트 분석 — 표면 아래 이야기 설계에 반영]\n${st.join("\n")}`);
    }

    if (mythMapResult) {
      const mm = [];
      if (mythMapResult.journey_phase) mm.push(`신화적 여정 단계: ${mythMapResult.journey_phase}`);
      if (mythMapResult.myth_parallel) mm.push(`대응 신화: ${mythMapResult.myth_parallel}`);
      if (mm.length > 0) contextParts.push(`[신화 매핑 분석 — 서사 원형 구조에 반영]\n${mm.join("\n")}`);
    }

    if (charDevResult) {
      const cd = [];
      if (charDevResult.protagonist?.name_suggestion) cd.push(`주인공 이름 제안: ${charDevResult.protagonist.name_suggestion}`);
      if (charDevResult.protagonist?.want) cd.push(`외적 목표(Want): ${charDevResult.protagonist.want}`);
      if (charDevResult.protagonist?.need) cd.push(`내적 욕구(Need): ${charDevResult.protagonist.need}`);
      if (charDevResult.protagonist?.ghost) cd.push(`심리적 상처(Ghost): ${charDevResult.protagonist.ghost}`);
      if (charDevResult.protagonist?.flaw) cd.push(`핵심 결함: ${charDevResult.protagonist.flaw}`);
      if (cd.length > 0) contextParts.push(`[캐릭터 디벨롭 — 인물 심리를 시놉시스에 반영]\n${cd.join("\n")}`);
    }

    const contextBlock = contextParts.length > 0
      ? `\n\n━━━ 이전 분석 결과 (시놉시스에 적극 반영할 것) ━━━\n${contextParts.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      : "";

    const msg = `로그라인: "${logline.trim()}"

장르: ${genreLabel}
포맷: ${duration.label} (${duration.duration}) — ${duration.desc}
포맷 구조 가이드: ${duration.structure}

서사 구조 프레임워크: ${framework.label} (${framework.ref})
프레임워크 적용 지침: ${framework.instruction}

방향 수: ${directionCount}가지${contextBlock}

위 로그라인을 바탕으로 ${directionCount}가지 서로 다른 방향의 시놉시스를 작성하세요.
모든 방향은 반드시 '${framework.label}' 프레임워크(${framework.ref}) 구조를 따라야 합니다.
각 방향은 장르 해석, 톤, 주제의식이 뚜렷하게 달라야 합니다.${contextParts.length > 0 ? "\n이전 분석 결과에서 도출된 인사이트(가치 전하 아크, 원형 심리, 진정성, 하위텍스트 등)를 각 방향에 구체적으로 녹여내세요." : ""}`;

    const ctrl = makeController("synopsis");
    try {
      const data = await callClaude(apiKey, SYNOPSIS_SYSTEM_PROMPT, msg, 6000, "claude-sonnet-4-6", ctrl.signal, SynopsisSchema);
      setSynopsisResults(data);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setSynopsisError(err.message || "시놉시스 생성 중 오류가 발생했습니다.");
    } finally { setSynopsisLoading(false); clearController("synopsis"); }
  };

  // ── Value Charge (McKee) ──
  const analyzeValueCharge = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("valueCharge");
    setValueChargeLoading(true); setValueChargeError(""); setValueChargeResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n\n위 로그라인의 가치 전하(Value Charge)를 McKee의 이론으로 분석하세요.`;
    try { const data = await callClaude(apiKey, VALUE_CHARGE_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ValueChargeSchema); setValueChargeResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setValueChargeError(err.message || "가치 전하 분석 중 오류가 발생했습니다."); }
    finally { setValueChargeLoading(false); clearController("valueCharge"); }
  };

  // ── Shadow (Jung) ──
  const analyzeShadow = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("shadow");
    setShadowLoading(true); setShadowError(""); setShadowResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n\n위 로그라인의 캐릭터 원형을 Jung의 분석심리학으로 분석하세요.`;
    try { const data = await callClaude(apiKey, SHADOW_ANALYSIS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ShadowAnalysisSchema); setShadowResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setShadowError(err.message || "그림자 분석 중 오류가 발생했습니다."); }
    finally { setShadowLoading(false); clearController("shadow"); }
  };

  // ── Authenticity (Sartre) ──
  const analyzeAuthenticity = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("authenticity");
    setAuthenticityLoading(true); setAuthenticityError(""); setAuthenticityResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n\n위 로그라인의 진정성 지수를 실존주의 철학으로 분석하세요.`;
    try { const data = await callClaude(apiKey, AUTHENTICITY_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, AuthenticitySchema); setAuthenticityResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setAuthenticityError(err.message || "진정성 분석 중 오류가 발생했습니다."); }
    finally { setAuthenticityLoading(false); clearController("authenticity"); }
  };

  // ── Academic ──
  const analyzeAcademic = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("academic");
    setAcademicLoading(true); setAcademicError(""); setAcademicResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `다음 로그라인을 제시된 학술 이론 체계 전체에 걸쳐 엄밀하게 분석하세요.\n\n로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n글자 수: ${logline.length}자\n\n아리스토텔레스 시학, 프롭 민담 형태론, 캠벨 영웅 여정, 토도로프 서사 이론, 바르트 서사 코드, 프라이탁 피라미드, 질만 흥분 전이 이론, 머레이 스미스 관객 참여 이론, 한국 서사 미학을 각각 적용하여 분석하세요.`;
    try { const data = await callClaude(apiKey, ACADEMIC_ANALYSIS_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, AcademicAnalysisSchema); setAcademicResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setAcademicError(err.message || "학술 분석 중 오류가 발생했습니다."); }
    finally { setAcademicLoading(false); clearController("academic"); }
  };

  // ── Expert Panel ──
  const runExpertPanel = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("expertPanel");
    setExpertPanelLoading(true); setExpertPanelError(""); setExpertPanelResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `분석할 로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n글자수: ${logline.trim().length}자\n\n위 로그라인을 7명의 전문가 패널이 학술 이론을 바탕으로 토론하세요.`;
    try { const data = await callClaude(apiKey, EXPERT_PANEL_SYSTEM_PROMPT, msg, 7000, "claude-sonnet-4-6", ctrl.signal, ExpertPanelSchema); setExpertPanelResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setExpertPanelError(err.message || "전문가 패널 분석 중 오류가 발생했습니다."); }
    finally { setExpertPanelLoading(false); clearController("expertPanel"); }
  };

  // ── Subtext ──
  const analyzeSubtext = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("subtext");
    setSubtextLoading(true); setSubtextError(""); setSubtextResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인의 하위텍스트를 체호프-스타니슬랍스키-브레히트-핀터-마멧 이론으로 분석하세요.`;
    try { const data = await callClaude(apiKey, SUBTEXT_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, SubtextSchema); setSubtextResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setSubtextError(err.message || "하위텍스트 분석 중 오류가 발생했습니다."); }
    finally { setSubtextLoading(false); clearController("subtext"); }
  };

  // ── Myth Map ──
  const analyzeMythMap = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("mythMap");
    setMythMapLoading(true); setMythMapError(""); setMythMapResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인을 캠벨 영웅 여정-프롭 민담 형태론-프레이저 신화 이론으로 신화적 위치를 매핑하세요.`;
    try { const data = await callClaude(apiKey, MYTH_MAP_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, MythMapSchema); setMythMapResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setMythMapError(err.message || "신화 매핑 중 오류가 발생했습니다."); }
    finally { setMythMapLoading(false); clearController("mythMap"); }
  };

  // ── Barthes Code ──
  const analyzeBarthesCode = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("barthesCode");
    setBarthesCodeLoading(true); setBarthesCodeError(""); setBarthesCodeResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인을 롤랑 바르트의 S/Z(1970) 5개 서사 코드로 분석하세요.`;
    try { const data = await callClaude(apiKey, BARTHES_CODE_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, BarthesCodeSchema); setBarthesCodeResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setBarthesCodeError(err.message || "바르트 코드 분석 중 오류가 발생했습니다."); }
    finally { setBarthesCodeLoading(false); clearController("barthesCode"); }
  };

  // ── Korean Myth ──
  const analyzeKoreanMyth = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("koreanMyth");
    setKoreanMythLoading(true); setKoreanMythError(""); setKoreanMythResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인의 한국 신화-미학 공명을 한(恨)-정(情)-신명(神明)-무속-유교 미학으로 분석하세요.`;
    try { const data = await callClaude(apiKey, KOREAN_MYTH_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, KoreanMythSchema); setKoreanMythResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setKoreanMythError(err.message || "한국 신화 분석 중 오류가 발생했습니다."); }
    finally { setKoreanMythLoading(false); clearController("koreanMyth"); }
  };

  // ── Script Coverage ──
  const analyzeScriptCoverage = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("scriptCoverage");
    setScriptCoverageLoading(true); setScriptCoverageError(""); setScriptCoverageResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}\n\n위 로그라인에 대한 할리우드 + 한국 방송사 스타일 Script Coverage를 작성하세요.`;
    try { const data = await callClaude(apiKey, SCRIPT_COVERAGE_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, ScriptCoverageSchema); setScriptCoverageResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setScriptCoverageError(err.message || "Script Coverage 생성 중 오류가 발생했습니다."); }
    finally { setScriptCoverageLoading(false); clearController("scriptCoverage"); }
  };

  // ── Comparable Works ──
  const analyzeComparableWorks = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("comparable");
    setComparableLoading(true); setComparableError(""); setComparableResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const synopsisContext = pipelineResult?.synopsis
      ? `\n\n시놉시스:\n${pipelineResult.synopsis.slice(0, 2000)}`
      : synopsisResults?.synopses?.[0]?.synopsis
      ? `\n\n시놉시스 (첫 번째 방향):\n${synopsisResults.synopses[0].synopsis.slice(0, 2000)}`
      : "";
    const treatmentContext = treatmentResult
      ? `\n\n트리트먼트 (앞부분):\n${treatmentResult.slice(0, 1500)}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}${synopsisContext}${treatmentContext}\n\n위 이야기와 유사한 기존 영화·드라마 작품을 분석하고 시장 포지셔닝을 평가하세요.`;
    try { const data = await callClaude(apiKey, COMPARABLE_WORKS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ComparableWorksSchema); setComparableResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setComparableError(err.message || "유사 작품 분석 중 오류가 발생했습니다."); }
    finally { setComparableLoading(false); clearController("comparable"); }
  };

  // ── Valuation ──
  const analyzeValuation = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("valuation");
    setValuationLoading(true); setValuationError(""); setValuationResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const structureTotal = calcSectionTotal(result, "structure");
    const expressionTotal = calcSectionTotal(result, "expression");
    const technicalTotal = calcSectionTotal(result, "technical");
    const interestTotal = calcSectionTotal(result, "interest");
    const scoreContext = result
      ? `\n\n로그라인 분석 점수:\n- 구조적 완성도: ${structureTotal}/50\n- 표현적 매력도: ${expressionTotal}/30\n- 기술적 완성도: ${technicalTotal}/20\n- 흥미 유발 지수: ${interestTotal}/100\n- 감지 장르: ${result.detected_genre || genreLabel}`
      : "";
    const coverageContext = scriptCoverageResult
      ? `\n\nScript Coverage 결과:\n- 전체 점수: ${scriptCoverageResult.overall_score}/10\n- 추천 등급: ${scriptCoverageResult.recommendation}\n- 강점: ${(scriptCoverageResult.strengths || []).join(", ")}\n- 약점: ${(scriptCoverageResult.weaknesses || []).join(", ")}`
      : "";
    const synopsisContext = pipelineResult?.synopsis
      ? `\n\n시놉시스 (요약):\n${pipelineResult.synopsis.slice(0, 1500)}`
      : "";
    const comparableContext = comparableResult
      ? `\n\n유사 작품: ${(comparableResult.comparable_works || []).slice(0, 3).map((w) => `${w.title}(${w.year || ""})`).join(", ")}\n시장 포지셔닝: ${comparableResult.market_positioning?.slice(0, 200) || ""}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}${scoreContext}${coverageContext}${synopsisContext}${comparableContext}\n\n위 정보를 바탕으로 이 이야기의 완성도와 시장 판매 가격을 평가하세요.`;
    try { const data = await callClaude(apiKey, VALUATION_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ValuationSchema); setValuationResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setValuationError(err.message || "시장 가치 평가 중 오류가 발생했습니다."); }
    finally { setValuationLoading(false); clearController("valuation"); }
  };

  // ── Dialogue Dev ──
  const analyzeDialogueDev = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("dialogueDev");
    setDialogueDevLoading(true); setDialogueDevError(""); setDialogueDevResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    let charContext = "";
    if (charDevResult?.protagonist) {
      const p = charDevResult.protagonist;
      const lines = [
        `주인공: ${p.name_suggestion || "주인공"}`,
        p.want  ? `  - 목표: ${p.want}` : "",
        p.ghost ? `  - 상처: ${p.ghost}` : "",
        p.flaw  ? `  - 결함: ${p.flaw}` : "",
        ...(charDevResult.supporting_characters || [])
          .filter((s) => s.suggested_name || s.role_name)
          .map((s) => `인물: ${s.suggested_name || ""} (${s.role_name || ""})`)
      ];
      charContext = `\n\n등장인물:\n${lines.filter(Boolean).join("\n")}`;
    }
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}${charContext}${getStoryBible()}\n\n위 인물들의 대사 고유 목소리와 하위텍스트 기법을 설계하세요. 등장인물 정보가 있다면 그 이름과 성격을 그대로 사용하세요.`;
    try { const data = await callClaude(apiKey, DIALOGUE_DEV_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, DialogueDevSchema); setDialogueDevResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setDialogueDevError(err.message || "대사 디벨롭 중 오류가 발생했습니다."); }
    finally { setDialogueDevLoading(false); clearController("dialogueDev"); }
  };

  // ── Structure Analysis ──
  const analyzeStructure = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("structure");
    setStructureLoading(true); setStructureError(""); setStructureResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const charBlock = charDevResult?.protagonist ? `주인공: ${charDevResult.protagonist.name_suggestion || ""} — 결함: ${charDevResult.protagonist.flaw || ""} / 원하는 것: ${charDevResult.protagonist.want || ""}` : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel}${charBlock ? `\n\n캐릭터 정보:\n${charBlock}` : ""}${getStoryBible()}\n\n위 로그라인의 3막 구조 핵심 플롯 포인트와 감정 아크를 설계하세요. 시놉시스가 있다면 반드시 그 방향의 등장인물과 이야기를 따르세요.`;
    try { const data = await callClaude(apiKey, STRUCTURE_ANALYSIS_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, StructureAnalysisSchema); setStructureResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setStructureError(err.message || "구조 분석 중 오류가 발생했습니다."); }
    finally { setStructureLoading(false); clearController("structure"); }
  };

  // ── Theme Analysis ──
  const analyzeTheme = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("theme");
    setThemeLoading(true); setThemeError(""); setThemeResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const charBlock = charDevResult?.protagonist ? `주인공 Want: ${charDevResult.protagonist.want || ""} / Need: ${charDevResult.protagonist.need || ""} / Ghost: ${charDevResult.protagonist.ghost || ""}` : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel}${charBlock ? `\n\n캐릭터 정보:\n${charBlock}` : ""}${getStoryBible()}\n\n위 로그라인의 핵심 테마, 도덕적 전제, 감정선을 분석하세요. 시놉시스가 있다면 그 방향의 이야기를 기반으로 분석하세요.`;
    try { const data = await callClaude(apiKey, THEME_ANALYSIS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ThemeAnalysisSchema); setThemeResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setThemeError(err.message || "테마 분석 중 오류가 발생했습니다."); }
    finally { setThemeLoading(false); clearController("theme"); }
  };

  // ── Scene List ──
  const generateSceneList = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("sceneList");
    setSceneListLoading(true); setSceneListError(""); setSceneListResult("");
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const treatmentBlock = treatmentResult ? `트리트먼트:\n${treatmentResult.slice(0, 3000)}` : "";
    const structureBlock = structureResult ? `플롯 포인트:\n${(structureResult.plot_points || []).map(pp => `- ${pp.name} (p.${pp.page}): ${pp.description}`).join("\n")}` : "";
    const charBlock = charDevResult?.protagonist ? `주인공: ${charDevResult.protagonist.name_suggestion || "주인공"} — ${charDevResult.protagonist.want || ""}` : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel}${charBlock ? `\n${charBlock}` : ""}${getStoryBible()}${structureBlock ? `\n\n${structureBlock}` : ""}${treatmentBlock ? `\n\n${treatmentBlock}` : ""}\n\n위 정보를 바탕으로 포맷에 맞는 씬 리스트(스텝 아웃라인)를 작성하세요. 시놉시스·트리트먼트가 있다면 반드시 그 방향의 이야기와 인물을 따르세요.`;
    try {
      const text = await callClaudeText(apiKey, SCENE_LIST_SYSTEM_PROMPT, msg, 7000, "claude-sonnet-4-6", ctrl.signal);
      setSceneListResult(text); await autoSave();
    }
    catch (err) { if (err.name !== "AbortError") setSceneListError(err.message || "씬 리스트 생성 중 오류가 발생했습니다."); }
    finally { setSceneListLoading(false); clearController("sceneList"); }
  };

  // ── Scenario Draft ──
  const generateScenarioDraft = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("scenarioDraft");
    setScenarioDraftLoading(true); setScenarioDraftError("");
    pushHistory(setScenarioDraftHistory, scenarioDraftResult, null);
    setScenarioDraftResult("");
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

    // ── 1. 전체 캐릭터 프로필 ──
    let charBlock = "";
    if (charDevResult?.protagonist || writerEdits.character) {
      const charOverride = writerEdits.character || {};
      const p = charDevResult?.protagonist || {};
      const lines = [
        `주인공: ${charOverride.name || p.name_suggestion || "주인공"}`,
        (charOverride.want || p.want) ? `  - 외적 목표(Want): ${charOverride.want || p.want}` : "",
        (charOverride.need || p.need) ? `  - 내적 욕구(Need): ${charOverride.need || p.need}` : "",
        (charOverride.ghost || p.ghost) ? `  - 심리적 상처(Ghost): ${charOverride.ghost || p.ghost}` : "",
        (charOverride.lie || p.lie_they_believe) ? `  - 믿는 거짓: ${charOverride.lie || p.lie_they_believe}` : "",
        (charOverride.flaw || p.flaw) ? `  - 핵심 결함: ${charOverride.flaw || p.flaw}` : "",
        (charOverride.arc || p.arc_type) ? `  - 변화 호(Arc): ${charOverride.arc || p.arc_type}` : "",
        ...(charDevResult?.supporting_characters || [])
          .filter((s) => s.suggested_name || s.role_name)
          .map((s) => `인물: ${s.suggested_name || ""} (${s.role_name || ""}) — ${s.relationship_dynamic || s.protagonist_mirror || ""}`)
      ];
      charBlock = `\n\n등장인물:\n${lines.filter(Boolean).join("\n")}`;
    }

    // ── 2. 대사 목소리 프로필 ──
    let dialogueBlock = "";
    if (dialogueDevResult?.character_voices?.length) {
      const voices = dialogueDevResult.character_voices
        .map((v) => `  ${v.character}: ${v.speech_pattern} / 절대 말하지 않는 것: ${v.what_they_never_say} / 말버릇: ${v.verbal_tic || "-"}`)
        .join("\n");
      dialogueBlock = `\n\n인물별 대사 목소리 (반드시 준수):\n${voices}`;
      if (dialogueDevResult.subtext_techniques?.length) {
        dialogueBlock += `\n하위텍스트 기법: ${dialogueDevResult.subtext_techniques.slice(0, 2).map((t) => t.technique).join(", ")}`;
      }
    }

    // ── 3. 구조 플롯 포인트 ──
    const structureBlock = structureResult?.plot_points?.length
      ? `\n\n핵심 플롯 포인트:\n${structureResult.plot_points.map((p) => `  ${p.name} (p.${p.page}): ${p.description}`).join("\n")}`
      : "";

    // ── 4. 트리트먼트 ──
    const effectiveTreatment = getEffective("treatment", treatmentResult);
    const treatmentBlock = effectiveTreatment ? `\n\n트리트먼트:\n${effectiveTreatment.slice(0, 2500)}` : "";

    // ── 5. 비트 시트 (풍부한 정보 + 집필된 씬 참고) ──
    let beatBlock = "";
    if (beatSheetResult?.beats?.length) {
      const beatLines = beatSheetResult.beats.map((b) => {
        const writtenSummary = writerEdits.beats?.[b.id] || b.summary;
        const written = beatScenes[b.id] ? `\n     [집필 참고: ${beatScenes[b.id].slice(0, 150)}...]` : "";
        return `  #${b.id} ${b.name_kr} (p.${b.page_start}~${b.page_end}) | ${writtenSummary} | 가치: ${b.value_start}→${b.value_end} | 장소: ${b.location_hint || "미정"} | 톤: ${b.tone || ""}${written}`;
      });
      beatBlock = `\n\n비트 시트 (${beatSheetResult.beats.length}비트 — 이 순서와 구조를 따를 것):\n${beatLines.join("\n")}`;
    }

    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel}${charBlock}${getStoryBible()}${structureBlock}${dialogueBlock}${treatmentBlock}${beatBlock}\n\n위 모든 정보를 반드시 반영해서 시나리오 초고를 작성하세요.\n- 등장인물 이름·성격·관계를 그대로 유지하세요\n- 비트 시트가 있다면 그 순서와 구조를 따르세요\n- 대사 목소리 프로필이 있다면 각 인물의 말투를 그에 맞게 쓰세요\n- 트리트먼트가 있다면 그 방향의 이야기를 따르세요`;
    try {
      const text = await callClaudeText(apiKey, SCENARIO_DRAFT_SYSTEM_PROMPT, msg, 8000, "claude-sonnet-4-6", ctrl.signal);
      setScenarioDraftResult(text); await autoSave();
    }
    catch (err) { if (err.name !== "AbortError") setScenarioDraftError(err.message || "시나리오 생성 중 오류가 발생했습니다."); }
    finally { setScenarioDraftLoading(false); clearController("scenarioDraft"); }
  };

  // ── Beat Sheet ──
  const generateBeatSheet = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("beatSheet");
    setBeatSheetLoading(true); setBeatSheetError("");
    pushHistory(setBeatSheetHistory, beatSheetResult, "beats");
    setBeatSheetResult(null);
    setBeatScenes({}); setExpandedBeats({});
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const contextBlock = treatmentResult ? `\n\n트리트먼트:\n${treatmentResult.slice(0, 3000)}` : "";
    let charBlock = "";
    if (charDevResult?.protagonist) {
      const p = charDevResult.protagonist;
      const lines = [
        `주인공: ${p.name_suggestion || ""} — Want: ${p.want || ""} / Need: ${p.need || ""} / Ghost: ${p.ghost || ""}`,
        p.flaw ? `  - 핵심 결함: ${p.flaw}` : "",
        ...(charDevResult.supporting_characters || [])
          .filter((s) => s.suggested_name || s.role_name)
          .map((s) => `인물: ${s.suggested_name || ""} (${s.role_name || ""}) — ${s.relationship_dynamic || ""}`)
      ];
      charBlock = lines.filter(Boolean).join("\n");
    }
    const structureBlock = structureResult?.plot_points?.length
      ? `\n\n플롯 포인트:\n${structureResult.plot_points.map((p) => `  ${p.name} (p.${p.page}): ${p.description}`).join("\n")}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel}${charBlock ? `\n\n캐릭터 정보:\n${charBlock}` : ""}${getStoryBible()}${structureBlock}${contextBlock}\n\n위 정보를 바탕으로 포맷에 맞는 비트 시트를 생성하세요. 시놉시스·트리트먼트·플롯포인트가 있다면 반드시 그 방향의 이야기와 인물을 따르세요.`;
    try { const data = await callClaude(apiKey, BEAT_SHEET_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, BeatSheetSchema); setBeatSheetResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setBeatSheetError(err.message || "비트 시트 생성 중 오류가 발생했습니다."); }
    finally { setBeatSheetLoading(false); clearController("beatSheet"); }
  };

  // ── Scene generation ──
  const generateScene = async (beat) => {
    if (!apiKey) return;
    setGeneratingBeat(beat.id);
    const ctrl = makeController(`scene_${beat.id}`);
    const charSummary = charDevResult?.protagonist ? `주인공: ${charDevResult.protagonist.name_suggestion || "주인공"} (Want: ${charDevResult.protagonist.want || ""}, 말투: ${charDevResult.protagonist.voice_hint || ""})` : "";
    const prevScenes = Object.entries(beatScenes).filter(([id]) => Number(id) < beat.id).slice(-3).map(([id, text]) => { const b = beatSheetResult?.beats?.find((b) => b.id === Number(id)); return `[${b?.name_kr || `비트 ${id}`}] ${text.slice(0, 200)}...`; }).join("\n\n");
    const msg = `로그라인: "${logline.trim()}"\n${charSummary}\n\n[생성할 비트]\n비트 번호: ${beat.id} / ${beat.name_kr} (${beat.name_en})\n막: ${beat.act} — ${beat.act_phase}\n페이지 범위: p.${beat.page_start}~p.${beat.page_end} (약 ${beat.page_end - beat.page_start + 1}페이지)\n장소: ${beat.location_hint || "미정"}\n등장 인물: ${(beat.characters_present || []).join(", ")}\n이 씬의 기능: ${beat.dramatic_function}\n이 씬에서 일어나는 일: ${beat.summary}\n가치 변화: ${beat.value_start} → ${beat.value_end}\n톤: ${beat.tone}\n반드시 포함: ${(beat.key_elements || []).join(", ")}${prevScenes ? `\n\n이전 씬 요약:\n${prevScenes}` : ""}\n\n위 정보로 시나리오 씬을 한국어로 작성하세요.`;
    try {
      const sceneText = await callClaudeText(apiKey, SCENE_GEN_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", ctrl.signal);
      setBeatScenes((prev) => ({ ...prev, [beat.id]: sceneText }));
      setExpandedBeats((prev) => ({ ...prev, [beat.id]: true }));
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setBeatSheetError(`씬 ${beat.id} 생성 오류: ${err.message}`);
    } finally { setGeneratingBeat(null); clearController(`scene_${beat.id}`); }
  };

  // ── All Scenes (batch) ──
  const generateAllScenes = async () => {
    if (!apiKey || !beatSheetResult?.beats?.length) return;
    const beats = beatSheetResult.beats;
    setAllScenesLoading(true);
    setAllScenesProgress({ current: 0, total: beats.length, failed: [] });
    setBeatSheetError("");
    const ctrl = makeController("allScenes");
    const localScenes = { ...beatScenes };
    const failedBeats = [];

    try {
      for (let i = 0; i < beats.length; i++) {
        if (ctrl.signal.aborted) break;
        const beat = beats[i];
        setGeneratingBeat(beat.id);
        setAllScenesProgress((prev) => ({ ...prev, current: i + 1, failed: [...failedBeats] }));

        const charSummary = charDevResult?.protagonist
          ? `주인공: ${charDevResult.protagonist.name_suggestion || "주인공"} (Want: ${charDevResult.protagonist.want || ""}, 말투: ${charDevResult.protagonist.voice_hint || ""})`
          : "";
        const prevScenes = Object.entries(localScenes)
          .filter(([id]) => Number(id) < beat.id).slice(-3)
          .map(([id, text]) => { const b = beats.find((b) => b.id === Number(id)); return `[${b?.name_kr || `비트 ${id}`}] ${text.slice(0, 250)}...`; })
          .join("\n\n");
        const msg = `로그라인: "${logline.trim()}"\n${charSummary}\n\n[생성할 비트]\n비트 번호: ${beat.id} / ${beat.name_kr} (${beat.name_en})\n막: ${beat.act} — ${beat.act_phase}\n페이지 범위: p.${beat.page_start}~p.${beat.page_end}\n장소: ${beat.location_hint || "미정"}\n등장 인물: ${(beat.characters_present || []).join(", ")}\n이 씬의 기능: ${beat.dramatic_function}\n이 씬에서 일어나는 일: ${beat.summary}\n가치 변화: ${beat.value_start} → ${beat.value_end}\n톤: ${beat.tone}\n반드시 포함: ${(beat.key_elements || []).join(", ")}${prevScenes ? `\n\n이전 씬 흐름:\n${prevScenes}` : ""}\n\n위 정보로 시나리오 씬을 한국어로 작성하세요.`;

        try {
          const sceneText = await callClaudeText(apiKey, SCENE_GEN_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", ctrl.signal);
          localScenes[beat.id] = sceneText;
          setBeatScenes((prev) => ({ ...prev, [beat.id]: sceneText }));
          setExpandedBeats((prev) => ({ ...prev, [beat.id]: true }));
        } catch (err) {
          if (err.name === "AbortError") break;
          failedBeats.push({ id: beat.id, name: beat.name_kr });
          console.warn(`씬 ${beat.id} 생성 실패:`, err.message);
        }
      }
      await autoSave();
    } finally {
      setAllScenesLoading(false);
      setGeneratingBeat(null);
      setAllScenesProgress({ current: 0, total: 0, failed: failedBeats });
      clearController("allScenes");
    }
  };

  // ── Character Dev ──
  const analyzeCharacterDev = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("charDev");
    setCharDevLoading(true); setCharDevError("");
    pushHistory(setCharDevHistory, charDevResult, "character");
    setCharDevResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}${getStoryBible()}\n\n위 로그라인의 인물들을 Egri-Hauge-Truby-Vogler-Jung-Maslow-Stanislavski 이론으로 깊이 발굴하고 구조화하세요. 시놉시스가 있다면 그 방향의 인물 이름·설정을 따르세요.`;
    try { const data = await callClaude(apiKey, CHARACTER_DEV_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, CharacterDevSchema); setCharDevResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setCharDevError(err.message || "캐릭터 분석 중 오류가 발생했습니다."); }
    finally { setCharDevLoading(false); clearController("charDev"); }
  };

  // ── Treatment ──
  const generateTreatment = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("treatment");
    setTreatmentLoading(true); setTreatmentError("");
    pushHistory(setTreatmentHistory, treatmentResult, "treatment");
    setTreatmentResult("");
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const structureLabel = { "3act": "3막 구조 (Field)", hero: "영웅의 여정 12단계 (Campbell)", "4act": "4막 구조", miniseries: "미니시리즈 화별 구조" }[treatmentStructure] || "3막 구조";
    // Stage 3 캐릭터 분석 결과가 있으면 그것을 우선 사용, 없으면 treatmentChars 폼 값 사용
    let charBlock;
    if (charDevResult?.protagonist) {
      const prot = charDevResult.protagonist;
      const lines = [
        `주인공: ${prot.name_suggestion || "주인공"} (${prot.egri_dimensions?.sociological || prot.egri_dimensions?.physiological || ""})`,
        prot.want ? `  - 외적 목표(Want): ${prot.want}` : "",
        prot.need ? `  - 내적 욕구(Need): ${prot.need}` : "",
        prot.ghost ? `  - 과거 상처(Ghost): ${prot.ghost}` : "",
        prot.lie_they_believe ? `  - 믿는 거짓: ${prot.lie_they_believe}` : "",
        ...(charDevResult.supporting_characters || [])
          .filter((s) => s.suggested_name || s.role_name)
          .map((s) => `주요 인물: ${s.suggested_name || ""} (${s.role_name || s.vogler_archetype || ""}) — ${s.relationship_dynamic || s.protagonist_mirror || ""}`)
      ];
      charBlock = lines.filter(Boolean).join("\n");
    } else {
      const proto = treatmentChars.protagonist;
      charBlock = [`주인공: ${proto.name || "미정"} (${proto.role || "역할 미정"})`, proto.want ? `  - 외적 목표(Want): ${proto.want}` : "", proto.need ? `  - 내적 욕구(Need): ${proto.need}` : "", proto.flaw ? `  - 핵심 결함: ${proto.flaw}` : "", ...treatmentChars.supporting.filter((s) => s.name.trim()).map((s) => `조력/적대 인물: ${s.name} (${s.role}) — ${s.relation}`)].filter(Boolean).join("\n");
    }
    const storyBible = getStoryBible();
    const genreContext = result?.detected_genre ? `\n로그라인 분석 감지 장르: ${result.detected_genre}` : "";
    const structurePlotPoints = structureResult?.plot_points?.length
      ? `\n\n확정된 플롯 포인트 (이 구조를 따를 것):\n${structureResult.plot_points.map(p => `  ${p.name}: ${p.description || ""}`).join("\n")}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel}${genreContext}\n서사 구조: ${structureLabel}\n\n등장인물 정보:\n${charBlock}${storyBible}${structurePlotPoints}\n\n위 정보를 바탕으로 완성도 높은 트리트먼트를 한국어로 작성해주세요. 시놉시스와 플롯 포인트가 있다면 반드시 그 방향을 따르세요. 등장인물 이름·배경·핵심 장면을 시놉시스와 일치시키세요.`;
    try {
      const text = await callClaudeText(apiKey, TREATMENT_SYSTEM_PROMPT, msg, 10000, "claude-sonnet-4-6", ctrl.signal);
      setTreatmentResult(text);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setTreatmentError(err.message || "트리트먼트 생성 중 오류가 발생했습니다.");
    } finally { setTreatmentLoading(false); clearController("treatment"); }
  };

  // ── Pipeline refine ──
  const refinePipelineSynopsis = async () => {
    if (!pipelineResult || !pipelineFeedback.trim() || !apiKey) return;
    const ctrl = makeController("pipelineRefine");
    setPipelineRefineLoading(true);
    const msg = `원본 로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n\n── 현재 시놉시스 ──\n제목: ${pipelineResult.direction_title}\n장르/톤: ${pipelineResult.genre_tone}\n훅: ${pipelineResult.hook}\n시놉시스:\n${pipelineResult.synopsis}\n핵심 장면: ${(pipelineResult.key_scenes || []).join(" / ")}\n주제: ${pipelineResult.theme}\n결말: ${pipelineResult.ending_type}\n\n── 사용자 피드백 ──\n${pipelineFeedback.trim()}\n\n위 피드백을 반영하여 시놉시스를 수정하세요.`;
    try { const data = await callClaude(apiKey, PIPELINE_REFINE_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal); pushHistory(setPipelineHistory, pipelineResult, "synopsis"); setPipelineResult(data); setPipelineFeedback(""); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요.")); }
    finally { setPipelineRefineLoading(false); clearController("pipelineRefine"); }
  };

  // ── 복합 분석 함수 (여러 개별 분석을 병렬로 실행) ──

  // Stage 2: 서사 이론 종합 (학술+신화+바르트+한국미학+테마 → 1버튼)
  const analyzeNarrativeTheory = async () => {
    if (!logline.trim() || !apiKey) return;
    await Promise.all([
      analyzeAcademic(),
      analyzeMythMap(),
      analyzeBarthesCode(),
      analyzeKoreanMyth(),
      analyzeTheme(),
    ]);
  };

  // Stage 3: 캐릭터 심층 분석 (그림자+진정성+캐릭터디벨롭 → 1버튼)
  const analyzeCharacterAll = async () => {
    if (!logline.trim() || !apiKey) return;
    await Promise.all([
      analyzeShadow(),
      analyzeAuthenticity(),
      analyzeCharacterDev(),
    ]);
  };

  // Stage 4: 구조 & 감정 아크 (구조분석+가치전하 → 1버튼)
  const analyzeStructureAll = async () => {
    if (!logline.trim() || !apiKey) return;
    await Promise.all([
      analyzeStructure(),
      analyzeValueCharge(),
    ]);
  };

  // 복합 상태 파생
  const narrativeTheoryDone = !!(academicResult || mythMapResult || barthesCodeResult || koreanMythResult || themeResult);
  const narrativeTheoryLoading = academicLoading || mythMapLoading || barthesCodeLoading || koreanMythLoading || themeLoading;
  const charAllDone = !!(shadowResult || authenticityResult || charDevResult);
  const charAllLoading = shadowLoading || authenticityLoading || charDevLoading;
  const structureAllDone = !!(structureResult || valueChargeResult);
  const structureAllLoading = structureLoading || valueChargeLoading;

  // ── Score calculations ──
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

  // ── Stage status ──
  function getStageStatus(stageId) {
    if (stageId === "1") {
      if (result) return "done";
      if (loading) return "active";
      return "idle";
    }
    if (stageId === "2") {
      if (academicResult || mythMapResult || koreanMythResult || expertPanelResult || barthesCodeResult || themeResult) return "done";
      if (academicLoading || mythMapLoading || koreanMythLoading || expertPanelLoading || barthesCodeLoading || themeLoading) return "active";
      return "idle";
    }
    if (stageId === "3") {
      if (shadowResult || authenticityResult || charDevResult) return "done";
      if (shadowLoading || authenticityLoading || charDevLoading) return "active";
      return "idle";
    }
    if (stageId === "4") {
      if (structureAllDone || subtextResult || synopsisResults || pipelineResult) return "done";
      if (structureAllLoading || subtextLoading || synopsisLoading) return "active";
      return "idle";
    }
    if (stageId === "5") {
      if (treatmentResult || beatSheetResult || dialogueDevResult || sceneListResult) return "done";
      if (treatmentLoading || beatSheetLoading || dialogueDevLoading || sceneListLoading) return "active";
      return "idle";
    }
    if (stageId === "6") {
      if (scenarioDraftResult) return "done";
      if (scenarioDraftLoading) return "active";
      return "idle";
    }
    if (stageId === "7") {
      if (scriptCoverageResult) return "done";
      if (scriptCoverageLoading) return "active";
      return "idle";
    }
    return "idle";
  }

  const statusDotColor = { idle: "var(--c-bd-6)", active: "#C8A84B", done: "#4ECCA3" };

  // ── Stage별 완료 기능 카운트 ──
  function getStageDoneCount(stageId) {
    if (stageId === "1") {
      return [result, /* improvement done = result exists */].filter(Boolean).length;
    }
    if (stageId === "2") {
      return [expertPanelResult].filter(Boolean).length;
    }
    if (stageId === "3") {
      return [shadowResult || authenticityResult || charDevResult].filter(Boolean).length;
    }
    if (stageId === "4") {
      return [structureResult, synopsisResults].filter(Boolean).length;
    }
    if (stageId === "5") {
      return [treatmentResult, beatSheetResult, dialogueDevResult].filter(Boolean).length;
    }
    if (stageId === "6") {
      return [scenarioDraftResult].filter(Boolean).length;
    }
    if (stageId === "7") {
      return [scriptCoverageResult || valuationResult].filter(Boolean).length;
    }
    return 0;
  }
  const STAGE_TOTALS = { "1": 1, "2": 1, "3": 1, "4": 2, "5": 3, "6": 1, "7": 1 };

  // ── Error display helper ──
  function ErrorMsg({ msg }) {
    if (!msg) return null;
    return (
      <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>
        {msg}
      </div>
    );
  }

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  // ── Determine if any operation is in progress ──
  const isAnyLoading = loading || synopsisLoading || academicLoading || expertPanelLoading ||
    valueChargeLoading || shadowLoading || authenticityLoading || subtextLoading ||
    mythMapLoading || barthesCodeLoading || koreanMythLoading || scriptCoverageLoading || allScenesLoading ||
    dialogueDevLoading || beatSheetLoading || charDevLoading || treatmentLoading ||
    structureLoading || themeLoading || sceneListLoading || scenarioDraftLoading;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* ─── Modals ─── */}
      {showApiKeyModal && (
        <ApiKeyModal initialKey={apiKey} onSave={saveApiKey} onCancel={apiKey ? () => setShowApiKeyModal(false) : undefined} />
      )}

      {/* ─── Story Bible modal ─── */}
      {showStoryBible && (
        <>
          <div onClick={() => setShowStoryBible(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 399 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            zIndex: 400, width: "min(780px, 96vw)", maxHeight: "88vh",
            background: "var(--bg-surface)", border: "1px solid var(--c-bd-4)", borderRadius: 18,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2} strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  스토리 바이블
                </div>
                <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 3 }}>지금까지 확정된 모든 요소의 통합 뷰</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => {
                    const sections = [];
                    sections.push(`# 스토리 바이블\n`);
                    sections.push(`## 로그라인\n${logline}\n`);
                    const confirmedSynopsis = pipelineResult || (selectedSynopsisIndex !== null ? synopsisResults?.synopses?.[selectedSynopsisIndex] : null);
                    if (confirmedSynopsis) {
                      sections.push(`## 시놉시스 방향\n**${confirmedSynopsis.direction_title || ""}**\n${confirmedSynopsis.synopsis_text || confirmedSynopsis.synopsis || ""}\n`);
                    }
                    if (charDevResult?.protagonist) {
                      const p = charDevResult.protagonist;
                      sections.push(`## 주인공\n이름: ${p.name_suggestion || "—"}\nWant: ${p.want || "—"}\nNeed: ${p.need || "—"}\nGhost: ${p.ghost || "—"}\nArc: ${p.arc_type || "—"}\n`);
                    }
                    if (treatmentResult) sections.push(`## 트리트먼트\n${treatmentResult}\n`);
                    if (beatSheetResult?.beats?.length) {
                      const beatLines = beatSheetResult.beats.map((b) => `- #${b.id} ${b.name_kr} (p.${b.page_start}): ${b.summary}`).join("\n");
                      sections.push(`## 비트 시트\n${beatLines}\n`);
                    }
                    navigator.clipboard.writeText(sections.join("\n---\n\n"));
                  }}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.07)", color: "#4ECCA3", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                >
                  전체 복사
                </button>
                <button onClick={() => setShowStoryBible(false)} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}>×</button>
              </div>
            </div>
            {/* Body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px" }}>
              {/* Logline */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#C8A84B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>로그라인</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-main)", padding: "14px 16px", borderRadius: 10, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.15)" }}>{logline}</div>
                {result?.scores && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(result.scores).slice(0, 6).map(([k, v]) => (
                      <span key={k} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(200,168,75,0.08)", color: "#C8A84B", border: "1px solid rgba(200,168,75,0.15)" }}>
                        {k}: {v}/5
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Synopsis */}
              {(() => {
                const confirmedSynopsis = pipelineResult || (selectedSynopsisIndex !== null ? synopsisResults?.synopses?.[selectedSynopsisIndex] : null);
                if (!confirmedSynopsis) return null;
                return (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#45B7D1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>확정 시놉시스 방향</div>
                    {confirmedSynopsis.direction_title && <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 6 }}>{confirmedSynopsis.direction_title}</div>}
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--c-tx-65)", padding: "14px 16px", borderRadius: 10, background: "rgba(69,183,209,0.05)", border: "1px solid rgba(69,183,209,0.15)" }}>
                      {confirmedSynopsis.synopsis_text || confirmedSynopsis.synopsis || ""}
                    </div>
                  </div>
                );
              })()}

              {/* Character */}
              {charDevResult?.protagonist && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#FB923C", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>주인공 프로필</div>
                  <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.15)" }}>
                    {(() => {
                      const p = charDevResult.protagonist;
                      const rows = [
                        ["이름/유형", p.name_suggestion || "—"],
                        ["외적 목표 (Want)", p.want || "—"],
                        ["내적 욕구 (Need)", p.need || "—"],
                        ["심리적 상처 (Ghost)", p.ghost || "—"],
                        ["믿는 거짓", p.lie_they_believe || "—"],
                        ["핵심 결함", p.flaw || "—"],
                        ["변화 호", p.arc_type || "—"],
                      ].filter(([, v]) => v && v !== "—");
                      return (
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: "6px 14px" }}>
                          {rows.map(([label, value]) => (
                            <>
                              <div key={`l-${label}`} style={{ fontSize: 11, color: "rgba(251,146,60,0.7)", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</div>
                              <div key={`v-${label}`} style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.5 }}>{value}</div>
                            </>
                          ))}
                        </div>
                      );
                    })()}
                    {charDevResult.supporting_characters?.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--c-bd-1)" }}>
                        <div style={{ fontSize: 10, color: "rgba(251,146,60,0.6)", fontWeight: 600, marginBottom: 6 }}>조연 캐릭터</div>
                        {charDevResult.supporting_characters.slice(0, 4).map((s, i) => (
                          <div key={i} style={{ fontSize: 11, color: "var(--c-tx-55)", marginBottom: 3 }}>
                            <strong style={{ color: "var(--c-tx-70)" }}>{s.suggested_name || s.role_name || "—"}</strong> — {s.relationship_dynamic || s.protagonist_mirror || ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Structure */}
              {structureResult?.plot_points?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>구조 플롯 포인트</div>
                  <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.12)" }}>
                    {structureResult.plot_points.map((pt, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 10, color: "#4ECCA3", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", marginTop: 2 }}>p.{pt.page}</span>
                        <div>
                          <strong style={{ fontSize: 11, color: "var(--c-tx-70)" }}>{pt.name}</strong>
                          <span style={{ fontSize: 11, color: "var(--c-tx-50)", marginLeft: 6 }}>{pt.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Beat Sheet summary */}
              {beatSheetResult?.beats?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#FFD166", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>비트 시트 ({beatSheetResult.beats.length}비트)</div>
                  <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,209,102,0.04)", border: "1px solid rgba(255,209,102,0.12)" }}>
                    {beatSheetResult.beats.map((b) => (
                      <div key={b.id} style={{ display: "flex", gap: 10, marginBottom: 5, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 9, color: "#FFD166", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", marginTop: 3, minWidth: 32 }}>p.{b.page_start}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: 11, color: "var(--c-tx-70)" }}>{b.name_kr}</strong>
                          <span style={{ fontSize: 10, color: "var(--c-tx-45)", marginLeft: 6 }}>{b.summary}</span>
                        </div>
                        {beatScenes[b.id] && <span style={{ fontSize: 9, color: "#4ECCA3", flexShrink: 0 }}>✓ 집필</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dialogue voices */}
              {dialogueDevResult?.character_voices?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#F472B6", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>대사 목소리 프로필</div>
                  <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(244,114,182,0.04)", border: "1px solid rgba(244,114,182,0.12)" }}>
                    {dialogueDevResult.character_voices.map((v, i) => (
                      <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < dialogueDevResult.character_voices.length - 1 ? "1px solid var(--c-bd-1)" : "none" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-tx-75)", marginBottom: 3 }}>{v.character}</div>
                        <div style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.5 }}>{v.speech_pattern}</div>
                        {v.verbal_tic && <div style={{ fontSize: 10, color: "rgba(244,114,182,0.65)", marginTop: 2 }}>말버릇: {v.verbal_tic}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!charDevResult && !synopsisResults && !structureResult && (
                <div style={{ textAlign: "center", color: "var(--c-tx-30)", fontSize: 13, padding: "30px 0" }}>
                  Stage 3 이후 분석을 진행하면 여기에 통합 뷰가 채워집니다.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Project list modal ─── */}
      {showProjects && (
        <>
          <div onClick={() => setShowProjects(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 299 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            zIndex: 300, width: "min(520px, 94vw)", maxHeight: "80vh",
            background: "var(--bg-surface)", border: "1px solid var(--c-bd-4)", borderRadius: 16,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>저장된 프로젝트</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 2 }}>분석이 완료될 때마다 자동 저장됩니다</div>
              </div>
              <button onClick={() => setShowProjects(false)} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 16px 8px" }}>
              {savedProjects.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--c-tx-30)", fontSize: 13, padding: "40px 0" }}>저장된 프로젝트가 없습니다</div>
              ) : savedProjects.map((proj) => (
                <div key={proj.id} style={{
                  padding: "12px 14px", borderRadius: 10, marginBottom: 6,
                  border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.02)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.title || "제목 없음"}</div>
                    <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(proj.updatedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <button onClick={() => { exportProjectJson(); }} title="현재 작업 내보내기" style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.07)", color: "#C8A84B", cursor: "pointer", fontSize: 11 }}>↓ JSON</button>
                  <button onClick={() => loadProjectState(proj)} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.07)", color: "#4ECCA3", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>불러오기</button>
                  <button onClick={() => deleteProjectById(proj.id)} style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(232,93,117,0.2)", background: "rgba(232,93,117,0.05)", color: "#E85D75", cursor: "pointer", fontSize: 11 }}>삭제</button>
                </div>
              ))}
            </div>
            {/* ── 내보내기/가져오기 하단 영역 ── */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--c-card-3)", display: "flex", gap: 8 }}>
              <button
                onClick={exportProjectJson}
                style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.07)", color: "#C8A84B", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                ↓ 현재 작업 내보내기 (JSON)
              </button>
              <button
                onClick={() => importFileRef.current?.click()}
                style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.07)", color: "#60A5FA", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                ↑ JSON 파일 불러오기
              </button>
              <input ref={importFileRef} type="file" accept=".json" style={{ display: "none" }} onChange={importProjectJson} />
            </div>
          </div>
        </>
      )}

      {showHistory && (
        <>
          <div onClick={() => setShowHistory(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 199 }} />
          <HistoryPanel
            history={history}
            onClose={() => setShowHistory(false)}
            onDelete={(id) => { const updated = history.filter((h) => h.id !== id); setHistory(updated); localStorage.setItem("logline_history", JSON.stringify(updated)); }}
            onClear={() => { localStorage.removeItem("logline_history"); setHistory([]); }}
            onSelect={(entry) => { setLogline(entry.logline); setGenre(entry.genre || "auto"); setResult(entry.result); setResult2(null); setActiveTab("overview"); setShowHistory(false); setCurrentStage("1"); }}
          />
        </>
      )}

      {/* ─── Header ─── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--bg-nav)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--c-card-3)",
        height: 56,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 12px" : "0 28px" }}>
        <div>
          <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: "var(--text-main)", letterSpacing: -0.3 }}>Hello Loglines</div>
          {!isMobile && <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: -1 }}>시나리오 개발 워크스테이션</div>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Save status */}
          {saveStatus && (
            <span style={{ fontSize: 10, color: saveStatus === "saved" ? "#4ECCA3" : "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace" }}>
              {saveStatus === "saving" ? "저장 중..." : "저장됨"}
            </span>
          )}
          {/* Cancel button — visible when any operation is running */}
          {isAnyLoading && (
            <button
              onClick={() => {
                Object.keys(abortControllersRef.current).forEach((key) => {
                  abortControllersRef.current[key].abort();
                });
                abortControllersRef.current = {};
              }}
              style={{
                padding: "5px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                border: "1px solid rgba(232,93,117,0.35)", background: "rgba(232,93,117,0.08)",
                color: "#E85D75", display: "flex", alignItems: "center", gap: 4,
              }}
            >
              취소
            </button>
          )}
          {result && (
            <button onClick={() => setShowStoryBible(true)} style={{
              padding: "5px 12px", borderRadius: 8,
              border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.07)",
              color: "#4ECCA3", cursor: "pointer", fontSize: 11, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              스토리 바이블
            </button>
          )}
          <button onClick={openProjects} style={{
            padding: "5px 12px", borderRadius: 8,
            border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)",
            color: "var(--c-tx-45)", cursor: "pointer", fontSize: 11,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            프로젝트
          </button>
          <button onClick={() => setShowHistory(true)} style={{
            padding: "5px 12px", borderRadius: 8,
            border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)",
            color: "var(--c-tx-45)", cursor: "pointer", fontSize: 11,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <SvgIcon d={ICON.history} size={12} />
            기록{history.length > 0 ? ` (${history.length})` : ""}
          </button>
          <button onClick={() => setShowApiKeyModal(true)} title="API 키 설정" style={{
            padding: "5px 10px", borderRadius: 8,
            border: "1px solid var(--c-bd-3)",
            background: apiKey ? "rgba(200,168,75,0.08)" : "rgba(232,93,117,0.1)",
            color: apiKey ? "rgba(200,168,75,0.7)" : "#E85D75",
            cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4,
          }}>
            <SvgIcon d={ICON.key} size={13} />
            API
          </button>
          {/* ── Theme toggle ── */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            style={{
              padding: "5px 8px", borderRadius: 8, fontSize: 14, lineHeight: 1,
              border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)",
              color: "var(--c-tx-50)", cursor: "pointer",
            }}
          >{darkMode ? "☀️" : "🌙"}</button>
        </div>
        </div>
      </div>

      {/* ─── Progress bar ─── */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "14px 24px 20px",
        background: "var(--bg-nav)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--c-card-2)",
        position: "sticky", top: 56, zIndex: 20,
      }}>
        {STAGES.map((s, idx) => {
          const st = getStageStatus(s.id);
          const isActive = currentStage === s.id;
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
              {idx > 0 && (
                <div style={{
                  width: isMobile ? 20 : 36, height: 2, flexShrink: 0,
                  background: st === "done" ? "#4ECCA3" : "var(--c-bd-3)",
                  transition: "background 0.4s",
                }} />
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <button onClick={() => setCurrentStage(s.id)} title={s.name} style={{
                  width: isMobile ? 28 : 34, height: isMobile ? 28 : 34, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isActive ? "#C8A84B" : st === "done" ? "#4ECCA3" : "var(--c-bd-5)"}`,
                  background: isActive ? "rgba(200,168,75,0.18)" : st === "done" ? "rgba(78,204,163,0.12)" : "transparent",
                  color: isActive ? "#C8A84B" : st === "done" ? "#4ECCA3" : "var(--c-tx-28)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  transition: "all 0.25s",
                }}>
                  {st === "done" ? (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                  ) : s.num}
                </button>
                {!isMobile && (
                  <div style={{ fontSize: 9, color: isActive ? "#C8A84B" : "var(--c-tx-25)", fontWeight: isActive ? 700 : 400, whiteSpace: "nowrap", transition: "color 0.2s" }}>
                    {s.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 첫 방문 온보딩 배너 ─── */}
      {isFirstVisit && !result && (
        <div style={{ background: "rgba(200,168,75,0.07)", borderBottom: "1px solid rgba(200,168,75,0.15)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "14px 16px" : "14px 28px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B", marginBottom: 3 }}>처음 오셨나요?</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6 }}>
                로그라인을 입력하면 18개 기준으로 분석 → 시놉시스 → 트리트먼트 → 씬 대본까지 자동 생성됩니다.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => { applyExampleLogline(); }}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.12)", color: "#C8A84B", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                예시 로그라인 입력
              </button>
              <button
                onClick={dismissFirstVisit}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-30)", cursor: "pointer", fontSize: 11 }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Accordion stages ─── */}
      <div ref={mainContentRef} style={{
        maxWidth: 860, width: "100%", margin: "0 auto", boxSizing: "border-box",
        padding: isMobile ? "16px 12px 80px" : "24px 28px 80px",
      }}>

          {/* ═══ STAGE 1: Logline ═══ */}
          <div ref={(el) => { stageRefs.current["1"] = el; }} style={{ borderRadius: 14, marginBottom: 10, overflow: "visible", border: `1px solid ${currentStage === "1" ? "rgba(200,168,75,0.25)" : "var(--c-bd-1)"}`, transition: "border-color 0.25s" }}>
            <div onClick={() => setCurrentStage("1")} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: currentStage === "1" ? "rgba(200,168,75,0.05)" : "rgba(var(--tw),0.01)", transition: "background 0.2s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: `2px solid ${statusDotColor[getStageStatus("1")]}`, display: "flex", alignItems: "center", justifyContent: "center", background: getStageStatus("1") === "done" ? "rgba(78,204,163,0.1)" : "transparent", transition: "all 0.25s" }}>
                {getStageStatus("1") === "done" ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg> : <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: statusDotColor[getStageStatus("1")] }}>01</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentStage === "1" ? "var(--text-main)" : getStageStatus("1") === "done" ? "var(--c-tx-75)" : "var(--c-tx-45)" }}>로그라인</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2 }}>입력 / 기본 분석 / AI 개선안</div>
              </div>
              {currentStage !== "1" && getStageDoneCount("1") > 0 && <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)", fontFamily: "'JetBrains Mono', monospace" }}>{getStageDoneCount("1")}/{STAGE_TOTALS["1"]}</span>}
              {getStageStatus("1") === "active" && <Spinner size={12} color="#C8A84B" />}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-25)" strokeWidth={2} strokeLinecap="round" style={{ transform: currentStage === "1" ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {currentStage === "1" && (
              <div style={{ borderTop: "1px solid var(--c-card-3)", padding: isMobile ? "20px 16px" : "24px 24px" }}>
              <ErrorBoundary><div>

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
                <button onClick={() => { setCompareMode(!compareMode); if (compareMode) { setLogline2(""); setResult2(null); } }} style={{
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

              {/* Example buttons */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "var(--c-tx-25)", lineHeight: "28px" }}>예시:</span>
                {EXAMPLE_LOGLINES.map((ex, i) => (
                  <button key={i} onClick={() => setLogline(ex)} style={{
                    padding: "4px 12px", borderRadius: 14,
                    border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.02)",
                    color: "rgba(var(--tw),0.38)", cursor: "pointer", fontSize: 11,
                  }}>예시 {i + 1}</button>
                ))}
              </div>

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
                      </div>
                    )}
                    {activeTab === "structure" && result.structure && (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4ECCA3", marginBottom: 18 }}>A. 구조적 완성도 -- {structureTotal}/50</div>
                        {Object.entries(result.structure).map(([key, val], i) => (
                          <ScoreBar key={key} score={val.score} max={val.max} label={LABELS_KR[key]} found={val.found} feedback={val.feedback} delay={i * 100} criterionKey={key} />
                        ))}
                      </div>
                    )}
                    {activeTab === "expression" && result.expression && (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#45B7D1", marginBottom: 18 }}>B. 표현적 매력도 -- {expressionTotal}/30</div>
                        {Object.entries(result.expression).map(([key, val], i) => (
                          <ScoreBar key={key} score={val.score} max={val.max} label={LABELS_KR[key]} found={val.found} feedback={val.feedback} delay={i * 100} criterionKey={key} />
                        ))}
                      </div>
                    )}
                    {activeTab === "technical" && result.technical && (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#F7A072", marginBottom: 18 }}>C. 기술적 완성도 -- {technicalTotal}/20</div>
                        {Object.entries(result.technical).map(([key, val], i) => (
                          <ScoreBar key={key} score={val.score} max={val.max} label={LABELS_KR[key]} feedback={val.feedback} delay={i * 100} criterionKey={key} />
                        ))}
                      </div>
                    )}
                    {activeTab === "interest" && result.interest && (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#FFD700", marginBottom: 18 }}>D. 흥미 유발 지수 -- {interestScore}/100</div>
                        {Object.entries(result.interest).map(([key, val], i) => (
                          <ScoreBar key={key} score={val.score} max={val.max} label={LABELS_KR[key]} feedback={val.feedback} delay={i * 100} criterionKey={key} />
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
                        />
                        <ImprovementPanel
                          logline={logline}
                          genre={genre}
                          apiKey={apiKey}
                          result={result}
                          onReanalyze={(improved) => analyze(improved)}
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
              {getStageStatus("1") === "done" && (
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => advanceToStage("3")} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                    다음 단계: 캐릭터
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div></ErrorBoundary>
              </div>
            )}
          </div>

          {/* ═══ STAGE 3: 캐릭터 ═══ */}
          <div ref={(el) => { stageRefs.current["3"] = el; }} style={{ borderRadius: 14, marginBottom: 10, overflow: "visible", border: `1px solid ${currentStage === "3" ? "rgba(251,146,60,0.25)" : "var(--c-bd-1)"}`, transition: "border-color 0.25s" }}>
            <div onClick={() => setCurrentStage("3")} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: currentStage === "3" ? "rgba(251,146,60,0.05)" : "rgba(var(--tw),0.01)", transition: "background 0.2s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: `2px solid ${statusDotColor[getStageStatus("3")]}`, display: "flex", alignItems: "center", justifyContent: "center", background: getStageStatus("3") === "done" ? "rgba(78,204,163,0.1)" : "transparent", transition: "all 0.25s" }}>
                {getStageStatus("3") === "done" ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg> : <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: statusDotColor[getStageStatus("3")] }}>03</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentStage === "3" ? "var(--text-main)" : getStageStatus("3") === "done" ? "var(--c-tx-75)" : "var(--c-tx-45)" }}>캐릭터</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2 }}>심리 원형 · 실존적 동기 · 3차원 인물 설계</div>
              </div>
              {currentStage !== "3" && getStageDoneCount("3") > 0 && <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)", fontFamily: "'JetBrains Mono', monospace" }}>{getStageDoneCount("3")}/{STAGE_TOTALS["3"]}</span>}
              {getStageStatus("3") === "active" && <Spinner size={12} color="#C8A84B" />}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-25)" strokeWidth={2} strokeLinecap="round" style={{ transform: currentStage === "3" ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {currentStage === "3" && (
              <div style={{ borderTop: "1px solid var(--c-card-3)", padding: isMobile ? "20px 16px" : "24px 24px" }}>
              <ErrorBoundary><div>

              <ToolButton icon={<SvgIcon d={ICON.users} size={16} />} label="캐릭터 종합 분석" sub="Jung 그림자 · 진정성 · Want/Need/Ghost/Arc" done={!!(shadowResult || authenticityResult || charDevResult)} loading={shadowLoading || authenticityLoading || charDevLoading} color="#FB923C" onClick={async () => { await analyzeShadow(); await analyzeAuthenticity(); await analyzeCharacterDev(); }} disabled={!logline.trim()}
                tooltip={"이 로그라인의 주인공이 얼마나 입체적인 캐릭터인지 다각도로 분석합니다.\n\n• Jung — 영웅·그림자·아니마·페르소나 원형과 개성화 여정\n• Sartre — 실존적 진정성과 자기기만 구조\n• Egri·Truby — 생리·사회·심리 3차원 인물 설계\n• Maslow — 욕구 위계(생존→안전→소속→존중→자아실현)\n• Vogler — 영웅의 여정 속 캐릭터 기능 역할"} />
              <ErrorMsg msg={shadowError || authenticityError || charDevError} />

              {charAllDone && (
                <ResultCard
                  title="캐릭터 심층 분석"
                  onClose={() => { setShadowResult(null); setAuthenticityResult(null); setCharDevResult(null); setCharDevHistory([]); }}
                  onUndo={() => undoHistory(setCharDevHistory, setCharDevResult, charDevHistory)}
                  historyCount={charDevHistory.length}
                  color="rgba(251,146,60,0.15)"
                >
                  {[
                    charDevResult && { label: "3차원 인물 설계 (Egri · Truby · Hauge · Vogler · Maslow)", node: <ErrorBoundary><CharacterDevPanel data={charDevResult} isMobile={isMobile} /></ErrorBoundary> },
                    shadowResult && { label: "심리 원형 & 그림자 (Jung)", node: <ErrorBoundary><ShadowAnalysisPanel data={shadowResult} isMobile={isMobile} /></ErrorBoundary> },
                    authenticityResult && { label: "실존적 진정성 (Sartre)", node: <ErrorBoundary><AuthenticityPanel data={authenticityResult} isMobile={isMobile} /></ErrorBoundary> },
                  ].filter(Boolean).map((item, i) => (
                    <div key={i}>
                      {i > 0 && <div style={{ margin: "20px 0", height: 1, background: "var(--c-bd-1)" }} />}
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(251,146,60,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{item.label}</div>
                      {item.node}
                    </div>
                  ))}

                  {/* ── 핵심 설정 편집 ── */}
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--c-bd-1)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingCharacter ? 14 : 0 }}>
                      <button
                        onClick={() => {
                          if (!editingCharacter) {
                            const p = charDevResult?.protagonist || {};
                            const ov = writerEdits.character || {};
                            setCharEditDraft({
                              name: ov.name ?? p.name_suggestion ?? "",
                              want: ov.want ?? p.want ?? "",
                              need: ov.need ?? p.need ?? "",
                              ghost: ov.ghost ?? p.ghost ?? "",
                              lie: ov.lie ?? p.lie_they_believe ?? "",
                              flaw: ov.flaw ?? p.flaw ?? "",
                              arc: ov.arc ?? p.arc_type ?? "",
                            });
                          }
                          setEditingCharacter(v => !v);
                        }}
                        style={{ fontSize: 12, color: editingCharacter ? "var(--c-tx-45)" : "#FB923C", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}
                      >
                        {editingCharacter ? "▲ 편집 닫기" : "✏ 핵심 설정 편집"}
                        {writerEdits.character && !editingCharacter && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(78,204,163,0.15)", color: "#4ECCA3", fontWeight: 600, border: "1px solid rgba(78,204,163,0.25)", marginLeft: 4 }}>수정됨</span>}
                      </button>
                      {writerEdits.character && !editingCharacter && (
                        <button onClick={() => clearWriterEdit("character")} style={{ fontSize: 10, color: "rgba(232,93,117,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>AI 원본으로</button>
                      )}
                    </div>

                    {editingCharacter && (
                      <div style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.15)", borderRadius: 10, padding: "14px 16px" }}>
                        {[
                          { key: "name", label: "이름/유형", placeholder: "예: 전직 형사 박민준" },
                          { key: "want", label: "외적 목표 (Want)", placeholder: "무엇을 얻으려 하는가?" },
                          { key: "need", label: "내적 욕구 (Need)", placeholder: "진짜로 필요한 것은?" },
                          { key: "ghost", label: "심리적 상처 (Ghost)", placeholder: "과거의 어떤 사건이 현재를 지배하는가?" },
                          { key: "lie", label: "믿는 거짓", placeholder: "스스로에 대해 어떤 거짓을 믿는가?" },
                          { key: "flaw", label: "핵심 결함", placeholder: "가장 큰 약점은?" },
                          { key: "arc", label: "변화 호 (Arc)", placeholder: "어떻게 변하는가?" },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, color: "rgba(251,146,60,0.7)", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                            <textarea
                              value={charEditDraft[key] || ""}
                              onChange={e => setCharEditDraft(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={placeholder}
                              rows={key === "want" || key === "need" || key === "ghost" ? 2 : 1}
                              style={{
                                width: "100%", padding: "8px 12px", background: "rgba(var(--tw),0.04)",
                                border: "1px solid rgba(251,146,60,0.2)", borderRadius: 8,
                                color: "var(--text-main)", fontSize: 12, lineHeight: 1.6,
                                fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical",
                                boxSizing: "border-box", outline: "none",
                              }}
                            />
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                          {writerEdits.character && (
                            <button onClick={() => { clearWriterEdit("character"); setEditingCharacter(false); }}
                              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(232,93,117,0.3)", background: "rgba(232,93,117,0.06)", color: "#E85D75", fontSize: 11, cursor: "pointer" }}>
                              AI 원본으로
                            </button>
                          )}
                          <button onClick={() => setEditingCharacter(false)}
                            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-45)", fontSize: 11, cursor: "pointer" }}>
                            취소
                          </button>
                          <button
                            onClick={() => { setWriterEdit("character", charEditDraft); setEditingCharacter(false); }}
                            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.4)", background: "rgba(78,204,163,0.1)", color: "#4ECCA3", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            저장 — 시나리오에 반영
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </ResultCard>
              )}
              {getStageStatus("3") === "done" && (
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => advanceToStage("4")} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                    다음 단계: 시놉시스
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div></ErrorBoundary>
              </div>
            )}
          </div>

          {/* ═══ STAGE 4: 시놉시스 ═══ */}
          <div ref={(el) => { stageRefs.current["4"] = el; }} style={{ borderRadius: 14, marginBottom: 10, overflow: "visible", border: `1px solid ${currentStage === "4" ? "rgba(78,204,163,0.25)" : "var(--c-bd-1)"}`, transition: "border-color 0.25s" }}>
            <div onClick={() => setCurrentStage("4")} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: currentStage === "4" ? "rgba(78,204,163,0.04)" : "rgba(var(--tw),0.01)", transition: "background 0.2s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: `2px solid ${statusDotColor[getStageStatus("4")]}`, display: "flex", alignItems: "center", justifyContent: "center", background: getStageStatus("4") === "done" ? "rgba(78,204,163,0.1)" : "transparent", transition: "all 0.25s" }}>
                {getStageStatus("4") === "done" ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg> : <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: statusDotColor[getStageStatus("4")] }}>04</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentStage === "4" ? "var(--text-main)" : getStageStatus("4") === "done" ? "var(--c-tx-75)" : "var(--c-tx-45)" }}>시놉시스</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2 }}>구조 설계 · 감정 아크 · 하위텍스트 · 시놉시스</div>
              </div>
              {currentStage !== "4" && getStageDoneCount("4") > 0 && <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)", fontFamily: "'JetBrains Mono', monospace" }}>{getStageDoneCount("4")}/{STAGE_TOTALS["4"]}</span>}
              {getStageStatus("4") === "active" && <Spinner size={12} color="#C8A84B" />}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-25)" strokeWidth={2} strokeLinecap="round" style={{ transform: currentStage === "4" ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {currentStage === "4" && (
              <div style={{ borderTop: "1px solid var(--c-card-3)", padding: isMobile ? "20px 16px" : "24px 24px" }}>
              <ErrorBoundary><div>

              {/* ── 구조 & 감정 아크 (통합 버튼) ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--c-tx-40)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>1순위 — 구조 & 감정 아크</div>
                <ToolButton icon={<SvgIcon d={ICON.film} size={16} />} label="구조 & 감정 아크" sub="Field · Snyder · McKee 3막 구조 + 가치 전하" done={structureAllDone} loading={structureAllLoading} color="#4ECCA3" onClick={analyzeStructureAll} disabled={!logline.trim()}
                  tooltip={"이야기의 뼈대와 감정 흐름을 설계합니다.\n\n• 3막 구조 — Field·Snyder·McKee·Hauge·Truby의 핵심 플롯 포인트 배치\n  (1막 설정 → 촉발 사건 → 2막 대립 → 절정 → 3막 해소)\n\n• 가치 전하 (McKee) — 장면마다 긍정↔부정으로 뒤바뀌는 감정 가치를 추적합니다.\n  감정 기복이 없는 이야기는 관객을 잃습니다."} />
                <ErrorMsg msg={structureError || valueChargeError} />
                {structureAllDone && (
                  <ResultCard
                    title="구조 & 감정 아크"
                    onClose={() => { setStructureResult(null); setValueChargeResult(null); }}
                    color="rgba(78,204,163,0.15)"
                  >
                    {structureResult && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(78,204,163,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>3막 구조 (Field · Snyder · McKee · Hauge · Truby)</div>
                        <ErrorBoundary><StructureAnalysisPanel data={structureResult} isMobile={isMobile} /></ErrorBoundary>
                      </div>
                    )}
                    {valueChargeResult && (
                      <div>
                        {structureResult && <div style={{ margin: "20px 0", height: 1, background: "var(--c-bd-1)" }} />}
                        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(78,204,163,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>가치 전하 & 감정 아크 (McKee)</div>
                        <ValueChargePanel data={valueChargeResult} isMobile={isMobile} />
                      </div>
                    )}
                  </ResultCard>
                )}
              </div>

              {/* ── 유사 작품 비교 ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--c-tx-40)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>시장 포지셔닝</div>
                <ToolButton
                  icon={<SvgIcon d={ICON.film} size={16} />}
                  label="유사 작품 비교 분석"
                  sub="한국·해외 참고 작품 + 시장 포지셔닝"
                  done={!!comparableResult}
                  loading={comparableLoading}
                  color="#F472B6"
                  onClick={analyzeComparableWorks}
                  disabled={!logline.trim()}
                  tooltip={"이 이야기와 유사한 국내외 레퍼런스 작품을 찾아 시장 맥락을 파악합니다.\n\n• 유사 작품 — 장르·톤·주제 기준 비교 분석\n• 배울 점 — 각 레퍼런스에서 참고할 전략\n• 시장 포지셔닝 — OTT·극장·방송 채널 적합성\n• 타깃 관객 — 연령·성별·취향 프로파일\n\n투자 제안서와 방송사 기획안에 필수로 포함되는 섹션입니다."}
                />
                <ErrorMsg msg={comparableError} />
                {comparableResult && (
                  <ResultCard title="유사 작품 비교" onClose={() => setComparableResult(null)} color="rgba(244,114,182,0.15)">
                    <ErrorBoundary><ComparableWorksPanel data={comparableResult} isMobile={isMobile} /></ErrorBoundary>
                  </ResultCard>
                )}
              </div>

              {/* ── 이전 분석 반영 표시 ── */}
              {(() => {
                const badges = [
                  academicResult && { label: "학술", color: "#45B7D1" },
                  mythMapResult && { label: "신화매핑", color: "#a78bfa" },
                  koreanMythResult && { label: "한국신화", color: "#E85D75" },
                  expertPanelResult && { label: "전문가패널", color: "#FFD166" },
                  barthesCodeResult && { label: "바르트코드", color: "#64DCC8" },
                  shadowResult && { label: "Jung원형", color: "#E85D75" },
                  authenticityResult && { label: "진정성", color: "#a78bfa" },
                  charDevResult && { label: "캐릭터", color: "#FB923C" },
                  valueChargeResult && { label: "가치전하", color: "#4ECCA3" },
                  subtextResult && { label: "하위텍스트", color: "#95E1D3" },
                  structureResult && { label: "구조분석", color: "#4ECCA3" },
                  themeResult && { label: "테마", color: "#F472B6" },
                ].filter(Boolean);
                if (badges.length === 0) return (
                  <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--c-card-3)", background: "rgba(var(--tw),0.02)", fontSize: 11, color: "var(--c-tx-30)" }}>
                    개념 분석·캐릭터·가치전하·하위텍스트를 먼저 실행하면 그 결과가 시놉시스 생성에 자동으로 반영됩니다.
                  </div>
                );
                return (
                  <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(200,168,75,0.15)", background: "rgba(200,168,75,0.04)" }}>
                    <div style={{ fontSize: 10, color: "rgba(200,168,75,0.7)", marginBottom: 7, fontWeight: 700, letterSpacing: 0.5 }}>시놉시스에 반영되는 분석</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {badges.map((b) => (
                        <span key={b.label} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, border: `1px solid ${b.color}40`, background: `${b.color}0f`, color: b.color }}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Synopsis mode toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "var(--c-card-1)", padding: 4, borderRadius: 10, border: "1px solid var(--c-bd-1)" }}>
                {[
                  { id: "auto", label: "자동 생성", align: "left", tip: "로그라인과 이전 분석 결과를 바탕으로 원하는 서사 구조와 방향 수를 선택해 여러 시놉시스를 한 번에 생성합니다.\n\n생성된 시놉시스 중 마음에 드는 방향을 '확정'하면, 이후 트리트먼트·비트시트가 그 방향을 기반으로 작성됩니다." },
                  { id: "pipeline", label: "파이프라인", align: "right", tip: "AI가 일련의 질문(주제·갈등·해결 등)을 순서대로 던지며 이야기를 함께 구체화하는 인터뷰 방식입니다.\n\n아직 이야기 방향이 불확실하거나, 처음부터 AI와 함께 발전시키고 싶을 때 유용합니다." },
                ].map((m) => (
                  <Tooltip key={m.id} text={m.tip} align={m.align}>
                    <button onClick={() => setSynopsisMode(m.id)} style={{
                      padding: "8px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: synopsisMode === m.id ? 700 : 400,
                      background: synopsisMode === m.id ? "rgba(200,168,75,0.15)" : "transparent",
                      color: synopsisMode === m.id ? "#C8A84B" : "var(--c-tx-35)",
                      transition: "all 0.15s", width: "100%",
                    }}>{m.label}</button>
                  </Tooltip>
                ))}
              </div>

              {/* Auto mode */}
              {synopsisMode === "auto" && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "var(--c-tx-40)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>서사 구조</div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 6 }}>
                      {NARRATIVE_FRAMEWORKS.map((f) => (
                        <div key={f.id} style={{ position: "relative" }}>
                          <button onClick={() => setSelectedFramework(f.id)} style={{
                            width: "100%", padding: "8px 10px", borderRadius: 9, textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                            border: selectedFramework === f.id ? "1px solid rgba(200,168,75,0.5)" : "1px solid var(--c-bd-1)",
                            background: selectedFramework === f.id ? "rgba(200,168,75,0.08)" : "rgba(var(--tw),0.02)",
                            color: selectedFramework === f.id ? "#C8A84B" : "var(--c-tx-45)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setFrameworkInfoId(frameworkInfoId === f.id ? null : f.id); }}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0 4px", color: "var(--c-tx-25)", fontSize: 11, lineHeight: 1, flexShrink: 0 }}
                                title="설명 보기"
                              >ⓘ</button>
                            </div>
                            <div style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>{f.ref}</div>
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* 서사 구조 설명 팝업 */}
                    {frameworkInfoId && (() => {
                      const fi = NARRATIVE_FRAMEWORKS.find(f => f.id === frameworkInfoId);
                      if (!fi) return null;
                      return (
                        <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B" }}>{fi.icon} {fi.label}</span>
                            <button onClick={() => setFrameworkInfoId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-tx-30)", fontSize: 14, padding: 0 }}>✕</button>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--c-tx-60)", marginBottom: 6, fontWeight: 500 }}>{fi.desc}</div>
                          <div style={{ fontSize: 11, color: "rgba(var(--tw),0.38)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{fi.instruction}</div>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--c-tx-40)" }}>방향 수:</span>
                    {[2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setDirectionCount(n)} style={{
                        padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                        border: directionCount === n ? "1px solid rgba(200,168,75,0.5)" : "1px solid var(--c-bd-3)",
                        background: directionCount === n ? "rgba(200,168,75,0.1)" : "var(--c-card-1)",
                        color: directionCount === n ? "#C8A84B" : "var(--c-tx-40)",
                        fontWeight: directionCount === n ? 700 : 400,
                      }}>{n}가지</button>
                    ))}
                  </div>
                  <button onClick={generateSynopsis} disabled={synopsisLoading || !logline.trim() || !apiKey} style={{
                    width: "100%", padding: 13, borderRadius: 10, border: "1px solid rgba(200,168,75,0.3)",
                    background: synopsisLoading ? "rgba(200,168,75,0.05)" : "rgba(200,168,75,0.1)",
                    color: "#C8A84B", cursor: synopsisLoading || !logline.trim() ? "not-allowed" : "pointer",
                    fontSize: 14, fontWeight: 700, transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {synopsisLoading ? (<><Spinner size={14} color="#C8A84B" />{directionCount}가지 시놉시스 작성 중...</>) : `${directionCount}가지 방향으로 시놉시스 생성`}
                  </button>
                  <ErrorMsg msg={synopsisError} />
                  {synopsisResults?.synopses && (
                    <div style={{ marginTop: 16 }}>
                      {selectedSynopsisIndex !== null && (
                        <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 8, background: "rgba(78,204,163,0.08)", border: "1px solid rgba(78,204,163,0.25)", fontSize: 12, color: "#4ECCA3", fontFamily: "'Noto Sans KR', sans-serif" }}>
                          ✓ 방향 {selectedSynopsisIndex + 1} 확정 — 이후 모든 단계가 이 시놉시스를 기반으로 생성됩니다
                        </div>
                      )}
                      {synopsisResults.synopses.map((s, i) => (
                        <SynopsisCard
                          key={i}
                          synopsis={s}
                          index={i}
                          isSelected={selectedSynopsisIndex === i}
                          onSelect={() => setSelectedSynopsisIndex(i === selectedSynopsisIndex ? null : i)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pipeline mode */}
              {synopsisMode === "pipeline" && (
                <div style={{ marginBottom: 20 }}>
                  <PipelinePanel selectedDuration={selectedDuration} logline={logline} apiKey={apiKey} isMobile={isMobile} onResult={(data) => setPipelineResult(data)} />
                  {pipelineResult && (
                    <ResultCard title={pipelineResult.direction_title} onClose={() => { setPipelineResult(null); setPipelineHistory([]); }} onUndo={() => undoHistory(setPipelineHistory, setPipelineResult, pipelineHistory)} historyCount={pipelineHistory.length} color="rgba(78,204,163,0.15)">
                      <SynopsisCard synopsis={pipelineResult} index={0} />
                      <div style={{ marginTop: 14 }}>
                        <textarea value={pipelineFeedback} onChange={(e) => setPipelineFeedback(e.target.value)} placeholder="피드백을 입력하여 시놉시스를 다듬으세요..." rows={3} style={{
                          width: "100%", padding: 12, borderRadius: 10,
                          border: "1px solid var(--c-bd-3)", background: "rgba(var(--tw),0.025)",
                          color: "var(--text-main)", fontSize: 13, resize: "vertical", fontFamily: "'Noto Sans KR', sans-serif",
                        }} />
                        <button onClick={refinePipelineSynopsis} disabled={pipelineRefineLoading || !pipelineFeedback.trim()} style={{
                          marginTop: 8, padding: "10px 20px", borderRadius: 9,
                          border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.07)",
                          color: "#4ECCA3", cursor: pipelineRefineLoading ? "not-allowed" : "pointer",
                          fontSize: 12, fontWeight: 600,
                        }}>
                          {pipelineRefineLoading ? "다듬는 중..." : "피드백 반영하여 다듬기"}
                        </button>
                      </div>
                    </ResultCard>
                  )}
                </div>
              )}

              {/* ── 기획서 PDF ── */}
              {(synopsisResults || pipelineResult) && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <DocButton label="기획서 PDF" sub="시놉시스 포함 지원·투자 기획서" onClick={() => openApplicationDoc("synopsis")} />
                </div>
              )}
              {getStageStatus("4") === "done" && (() => {
                const hasSynopsis = !!(synopsisResults?.synopses?.length || pipelineResult);
                const isConfirmed = !!(pipelineResult || selectedSynopsisIndex !== null);
                const confirmedTitle = pipelineResult?.direction_title
                  || (selectedSynopsisIndex !== null ? synopsisResults?.synopses?.[selectedSynopsisIndex]?.direction_title : null);
                return (
                  <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)" }}>
                    {hasSynopsis && !isConfirmed && (
                      <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(247,160,114,0.08)", border: "1px solid rgba(247,160,114,0.3)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#F7A072", marginBottom: 3 }}>시놉시스 방향이 확정되지 않았습니다</div>
                          <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6 }}>
                            위 시놉시스 중 하나를 선택해야 트리트먼트·비트 시트·시나리오가 그 방향으로 생성됩니다.<br />
                            선택하지 않고 넘어가면 이후 단계가 시놉시스 없이 로그라인만 참고해서 진행됩니다.
                          </div>
                        </div>
                      </div>
                    )}
                    {isConfirmed && confirmedTitle && (
                      <div style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 10, background: "rgba(78,204,163,0.07)", border: "1px solid rgba(78,204,163,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13 }}>✅</span>
                        <div style={{ fontSize: 12, color: "#4ECCA3" }}>
                          <span style={{ fontWeight: 700 }}>확정:</span> {confirmedTitle} — 이후 모든 단계가 이 시놉시스를 기반으로 생성됩니다
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <button onClick={() => advanceToStage("2")} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(69,183,209,0.25)", background: "rgba(69,183,209,0.05)", color: "rgba(69,183,209,0.7)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        이론 심화 분석 (선택)
                      </button>
                      <button
                        onClick={() => advanceToStage("5")}
                        style={{
                          padding: "11px 24px", borderRadius: 10, cursor: "pointer",
                          border: isConfirmed ? "1px solid rgba(78,204,163,0.4)" : "1px solid rgba(200,168,75,0.4)",
                          background: isConfirmed ? "rgba(78,204,163,0.1)" : "rgba(200,168,75,0.1)",
                          color: isConfirmed ? "#4ECCA3" : "#C8A84B",
                          fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
                        }}
                      >
                        {isConfirmed ? "✓ 시놉시스 확정 — 다음 단계: 트리트먼트 & 비트" : "다음 단계: 트리트먼트 & 비트 (시놉시스 미확정)"}
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div></ErrorBoundary>
              </div>
            )}
          </div>

          {/* ═══ STAGE 2: 개념 분석 (선택) ═══ */}
          <div ref={(el) => { stageRefs.current["2"] = el; }} style={{ borderRadius: 14, marginBottom: 10, overflow: "visible", border: `1px solid ${currentStage === "2" ? "rgba(69,183,209,0.25)" : "var(--c-bd-1)"}`, transition: "border-color 0.25s" }}>
            <div onClick={() => setCurrentStage("2")} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: currentStage === "2" ? "rgba(69,183,209,0.05)" : "rgba(var(--tw),0.01)", transition: "background 0.2s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: `2px solid ${statusDotColor[getStageStatus("2")]}`, display: "flex", alignItems: "center", justifyContent: "center", background: getStageStatus("2") === "done" ? "rgba(78,204,163,0.1)" : "transparent", transition: "all 0.25s" }}>
                {getStageStatus("2") === "done" ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg> : <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: statusDotColor[getStageStatus("2")] }}>04</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentStage === "2" ? "var(--text-main)" : getStageStatus("2") === "done" ? "var(--c-tx-75)" : "var(--c-tx-45)", display: "flex", alignItems: "center", gap: 8 }}>개념 분석 <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 8, background: "rgba(69,183,209,0.1)", color: "rgba(69,183,209,0.65)", border: "1px solid rgba(69,183,209,0.2)", letterSpacing: 0.5 }}>선택</span></div>
                <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2 }}>학술 이론 · 신화 매핑 · 전문가 패널 — 시놉시스 후 심화 분석</div>
              </div>
              {currentStage !== "2" && getStageDoneCount("2") > 0 && <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)", fontFamily: "'JetBrains Mono', monospace" }}>{getStageDoneCount("2")}/{STAGE_TOTALS["2"]}</span>}
              {getStageStatus("2") === "active" && <Spinner size={12} color="#C8A84B" />}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-25)" strokeWidth={2} strokeLinecap="round" style={{ transform: currentStage === "2" ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {currentStage === "2" && (
              <div style={{ borderTop: "1px solid var(--c-card-3)", padding: isMobile ? "20px 16px" : "24px 24px" }}>
              <ErrorBoundary><div>

              {/* ── 선택 단계 안내 ── */}
              <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 10, background: "rgba(69,183,209,0.05)", border: "1px solid rgba(69,183,209,0.15)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
                <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
                  <strong style={{ color: "rgba(69,183,209,0.85)" }}>선택 심화 분석 단계입니다.</strong> 시놉시스가 확정된 지금, 학술 이론으로 이야기의 구조적 깊이를 강화할 수 있습니다.<br />
                  건너뛰어도 되고, 트리트먼트 작업 전·후 언제든 돌아올 수 있습니다.
                </div>
              </div>

              {/* ── 전문가 패널 ── */}
              <div style={{ marginTop: 8 }}>
                <ToolButton icon={<SvgIcon d={ICON.users} size={16} />} label="전문가 패널" sub="현업 전문가 10인의 독립 시각" done={!!expertPanelResult} loading={expertPanelLoading} color="#FFD166" onClick={runExpertPanel} disabled={!logline.trim()}
                  tooltip={"시나리오 작가, 제작사 PD, 문학평론가, 마케터 등 현업 전문가 10인이 이 로그라인을 독립적으로 평가합니다.\n\n라운드 1 — 각자 개별 의견 제시\n라운드 2 — 의견 교환 후 토론\n종합 — 합의점·핵심 강점 도출\n\n실제 방송사·제작사 심사 환경과 유사한 피드백을 얻을 수 있습니다."} />
                <ErrorMsg msg={expertPanelError} />
                {expertPanelResult && <ResultCard title="전문가 패널 토론" onClose={() => setExpertPanelResult(null)} color="rgba(255,209,102,0.15)"><ErrorBoundary><ExpertPanelSection data={expertPanelResult} isMobile={isMobile} /></ErrorBoundary></ResultCard>}
              </div>
              {getStageStatus("2") === "done" && (
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => advanceToStage("5")} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                    다음 단계: 트리트먼트 & 비트
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div></ErrorBoundary>
              </div>
            )}
          </div>

          {/* ═══ STAGE 5: Treatment / Beat Sheet ═══ */}
          <div ref={(el) => { stageRefs.current["5"] = el; }} style={{ borderRadius: 14, marginBottom: 10, overflow: "visible", border: `1px solid ${currentStage === "5" ? "rgba(255,209,102,0.25)" : "var(--c-bd-1)"}`, transition: "border-color 0.25s" }}>
            <div onClick={() => setCurrentStage("5")} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: currentStage === "5" ? "rgba(255,209,102,0.04)" : "rgba(var(--tw),0.01)", transition: "background 0.2s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: `2px solid ${statusDotColor[getStageStatus("5")]}`, display: "flex", alignItems: "center", justifyContent: "center", background: getStageStatus("5") === "done" ? "rgba(78,204,163,0.1)" : "transparent", transition: "all 0.25s" }}>
                {getStageStatus("5") === "done" ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg> : <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: statusDotColor[getStageStatus("5")] }}>05</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentStage === "5" ? "var(--text-main)" : getStageStatus("5") === "done" ? "var(--c-tx-75)" : "var(--c-tx-45)" }}>트리트먼트 & 비트</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2 }}>트리트먼트 · 씬 리스트 · 비트시트 · 대사</div>
              </div>
              {currentStage !== "5" && getStageDoneCount("5") > 0 && <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)", fontFamily: "'JetBrains Mono', monospace" }}>{getStageDoneCount("5")}/{STAGE_TOTALS["5"]}</span>}
              {getStageStatus("5") === "active" && <Spinner size={12} color="#C8A84B" />}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-25)" strokeWidth={2} strokeLinecap="round" style={{ transform: currentStage === "5" ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {currentStage === "5" && (
              <div style={{ borderTop: "1px solid var(--c-card-3)", padding: isMobile ? "20px 16px" : "24px 24px" }}>
              <ErrorBoundary><div>

              {/* ── STEP 1: 트리트먼트 ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: treatmentResult ? "rgba(78,204,163,0.15)" : "rgba(200,168,75,0.12)", color: treatmentResult ? "#4ECCA3" : "#C8A84B", border: `1px solid ${treatmentResult ? "rgba(78,204,163,0.25)" : "rgba(200,168,75,0.25)"}`, fontFamily: "'JetBrains Mono', monospace" }}>{treatmentResult ? "✓ STEP 1" : "STEP 1"}</div>
                  <span style={{ fontSize: 12, color: "var(--c-tx-45)", fontWeight: 500 }}>트리트먼트 — 스토리 전체 흐름 서술</span>
                </div>
                <button onClick={() => setShowTreatmentPanel(!showTreatmentPanel)} style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: showTreatmentPanel ? "1px solid rgba(200,168,75,0.4)" : "1px solid var(--c-bd-3)",
                  background: showTreatmentPanel ? "rgba(200,168,75,0.07)" : "rgba(var(--tw),0.02)",
                  color: showTreatmentPanel ? "#C8A84B" : "var(--c-tx-45)",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
                }}>
                  <SvgIcon d={ICON.doc} size={16} />
                  트리트먼트로 발전시키기
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{showTreatmentPanel ? "^" : "v"}</span>
                </button>
                {showTreatmentPanel && (
                  <div style={{ marginTop: 8 }}>
                    <TreatmentInputPanel chars={treatmentChars} onCharsChange={setTreatmentChars} structure={treatmentStructure} onStructureChange={setTreatmentStructure} onGenerate={generateTreatment} loading={treatmentLoading} isMobile={isMobile} charDevResult={charDevResult} />
                    <ErrorMsg msg={treatmentError} />
                  </div>
                )}
                {treatmentResult && (
                  <ResultCard
                    title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      트리트먼트
                      {writerEdits.treatment && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(78,204,163,0.15)", color: "#4ECCA3", fontWeight: 600, border: "1px solid rgba(78,204,163,0.25)" }}>✏ 수정됨</span>}
                    </span>}
                    onClose={() => { setTreatmentResult(""); clearWriterEdit("treatment"); setEditingTreatment(false); setTreatmentHistory([]); }}
                    onUndo={() => undoHistory(setTreatmentHistory, setTreatmentResult, treatmentHistory)}
                    historyCount={treatmentHistory.length}
                    color="rgba(200,168,75,0.15)"
                  >
                    {editingTreatment ? (
                      <div>
                        <textarea
                          value={treatmentEditDraft}
                          onChange={e => setTreatmentEditDraft(e.target.value)}
                          style={{
                            width: "100%", minHeight: 400, padding: "14px 16px",
                            background: "rgba(var(--tw),0.03)", border: "1px solid rgba(200,168,75,0.3)",
                            borderRadius: 10, color: "var(--text-main)", fontSize: 13, lineHeight: 1.8,
                            fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical", boxSizing: "border-box",
                            outline: "none",
                          }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                          {writerEdits.treatment && (
                            <button
                              onClick={() => { clearWriterEdit("treatment"); setEditingTreatment(false); }}
                              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(232,93,117,0.3)", background: "rgba(232,93,117,0.06)", color: "#E85D75", fontSize: 11, cursor: "pointer" }}
                            >AI 원본으로</button>
                          )}
                          <button
                            onClick={() => setEditingTreatment(false)}
                            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-45)", fontSize: 11, cursor: "pointer" }}
                          >취소</button>
                          <button
                            onClick={() => { setWriterEdit("treatment", treatmentEditDraft); setEditingTreatment(false); }}
                            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.4)", background: "rgba(78,204,163,0.1)", color: "#4ECCA3", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >저장 — 시나리오에 반영</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }}>
                          <button
                            onClick={() => { setTreatmentEditDraft(writerEdits.treatment || treatmentResult); setEditingTreatment(true); }}
                            style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.06)", color: "#C8A84B", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}
                          >✏ 편집</button>
                          <button
                            onClick={() => {
                              const blob = new Blob([writerEdits.treatment || treatmentResult], { type: "text/markdown;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a"); a.href = url;
                              a.download = `treatment_${new Date().toISOString().slice(0,10)}.md`;
                              a.click(); URL.revokeObjectURL(url);
                            }}
                            style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.06)", color: "#C8A84B", cursor: "pointer", fontSize: 11 }}
                          >MD 내보내기</button>
                        </div>
                        <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: isMobile ? 13 : 14, lineHeight: 1.9, color: "rgba(var(--tw),0.82)" }}>
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#C8A84B", marginBottom: 8, marginTop: 0 }}>{children}</h1>,
                              h2: ({ children }) => <h2 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: "rgba(var(--tw),0.9)", marginTop: 28, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--c-bd-2)" }}>{children}</h2>,
                              h3: ({ children }) => <h3 style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "#C8A84B", marginTop: 18, marginBottom: 6 }}>{children}</h3>,
                              p: ({ children }) => <p style={{ marginBottom: 12, marginTop: 0 }}>{children}</p>,
                              strong: ({ children }) => <strong style={{ color: "rgba(var(--tw),0.95)", fontWeight: 700 }}>{children}</strong>,
                              em: ({ children }) => <em style={{ color: "rgba(200,168,75,0.8)", fontStyle: "italic" }}>{children}</em>,
                              ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
                              li: ({ children }) => <li style={{ marginBottom: 5 }}>{children}</li>,
                              hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--c-bd-1)", margin: "20px 0" }} />,
                              table: ({ children }) => <div style={{ overflowX: "auto", marginBottom: 16 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>{children}</table></div>,
                              th: ({ children }) => <th style={{ padding: "7px 10px", background: "rgba(200,168,75,0.08)", color: "var(--c-tx-70)", fontWeight: 600, textAlign: "left", borderBottom: "1px solid var(--c-bd-3)" }}>{children}</th>,
                              td: ({ children }) => <td style={{ padding: "7px 10px", color: "var(--c-tx-60)", borderBottom: "1px solid var(--c-card-2)" }}>{children}</td>,
                            }}
                          >{writerEdits.treatment || treatmentResult}</ReactMarkdown>
                        </div>
                      </>
                    )}
                  </ResultCard>
                )}
                {treatmentResult && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <DocButton label="상세 기획서 PDF" sub="트리트먼트 포함 제작 기획서" onClick={() => openApplicationDoc("treatment")} />
                  </div>
                )}
              </div>

              {/* ── STEP 2: 비트 시트 ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: beatSheetResult ? "rgba(78,204,163,0.15)" : "rgba(255,209,102,0.12)", color: beatSheetResult ? "#4ECCA3" : "#FFD166", border: `1px solid ${beatSheetResult ? "rgba(78,204,163,0.25)" : "rgba(255,209,102,0.25)"}`, fontFamily: "'JetBrains Mono', monospace" }}>{beatSheetResult ? "✓ STEP 2" : "STEP 2"}</div>
                  <span style={{ fontSize: 12, color: "var(--c-tx-45)", fontWeight: 500 }}>비트 시트 — Snyder 15비트 구조 설계</span>
                  {!treatmentResult && <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,209,102,0.55)", fontStyle: "italic" }}>Step 1 완료 후 추천</span>}
                </div>
                <ToolButton icon={<SvgIcon d={ICON.film} size={16} />} label="비트 시트" sub="Snyder 15비트" done={!!beatSheetResult} loading={beatSheetLoading} color="#FFD166" onClick={generateBeatSheet} disabled={!logline.trim()}
                  tooltip={"Blake Snyder의 'Save the Cat' 15비트 구조를 적용합니다.\n\n할리우드 표준 이정표 15개를 정확한 페이지 위치에 배치합니다:\n오프닝 이미지 → 테마 제시 → 설정 → 촉발사건 → 고민 → 2막 진입 → B스토리 → 재미와 게임 → 중간점 → 적의 위협 → 전부 잃다 → 영혼의 밤 → 3막 진입 → 피날레 → 클로징 이미지\n\n각 비트마다 AI가 직접 씬을 집필할 수 있습니다."} />
                <ErrorMsg msg={beatSheetError} />
                {beatSheetResult && (
                  <ResultCard title="비트 시트" onClose={() => { setBeatSheetResult(null); setBeatSheetHistory([]); }} onUndo={() => undoHistory(setBeatSheetHistory, setBeatSheetResult, beatSheetHistory)} historyCount={beatSheetHistory.length} color="rgba(255,209,102,0.15)">
                    <BeatSheetPanel
                      data={beatSheetResult}
                      beatScenes={beatScenes}
                      expandedBeats={expandedBeats}
                      onToggle={(id) => setExpandedBeats((prev) => ({ ...prev, [id]: !prev[id] }))}
                      isMobile={isMobile}
                      editingBeats={editingBeats}
                      beatEditDrafts={writerEdits.beats || {}}
                      onEditBeat={(id, val) => {
                        if (val === null) {
                          // 편집 시작
                          setEditingBeats(prev => ({ ...prev, [id]: true }));
                          setBeatEditDrafts(prev => ({ ...prev, [id]: (writerEdits.beats?.[id] || beatSheetResult.beats?.find(b => b.id === id)?.summary || "") }));
                        } else {
                          setBeatEditDrafts(prev => ({ ...prev, [id]: val }));
                        }
                      }}
                      onSaveBeat={(id) => {
                        setWriterEdits(prev => ({ ...prev, beats: { ...(prev.beats || {}), [id]: beatEditDrafts[id] } }));
                        setEditingBeats(prev => ({ ...prev, [id]: false }));
                      }}
                      onCancelBeat={(id) => {
                        setEditingBeats(prev => ({ ...prev, [id]: false }));
                      }}
                    />
                  </ResultCard>
                )}
              </div>

              {/* ── STEP 3: 대사 디벨롭 ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: dialogueDevResult ? "rgba(78,204,163,0.15)" : "rgba(244,114,182,0.12)", color: dialogueDevResult ? "#4ECCA3" : "#F472B6", border: `1px solid ${dialogueDevResult ? "rgba(78,204,163,0.25)" : "rgba(244,114,182,0.25)"}`, fontFamily: "'JetBrains Mono', monospace" }}>{dialogueDevResult ? "✓ STEP 3" : "STEP 3"}</div>
                  <span style={{ fontSize: 12, color: "var(--c-tx-45)", fontWeight: 500 }}>대사 디벨롭 — 캐릭터별 목소리 설계</span>
                  {!beatSheetResult && <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(244,114,182,0.55)", fontStyle: "italic" }}>Step 2 완료 후 추천</span>}
                </div>
                <ToolButton icon={<SvgIcon d={ICON.doc} size={16} />} label="대사 디벨롭" sub="Mamet/Pinter" done={!!dialogueDevResult} loading={dialogueDevLoading} color="#F472B6" onClick={analyzeDialogueDev} disabled={!logline.trim()}
                  tooltip={"캐릭터마다 고유한 목소리와 말하는 방식을 설계합니다.\n\n• Mamet — 캐릭터는 원하는 것을 직접 말하지 않는다. 행동이 대사를 대신한다.\n• Pinter — 침묵, 공백, 반복이 대사보다 강한 의미를 만든다.\n\n결과물:\n• 주인공·조력자·대립자의 개별 말투 프로필\n• 핵심 장면의 하위텍스트 대사 예시\n• 대화 속 권력 역학과 감정 변화 지도"} />
                <ErrorMsg msg={dialogueDevError} />
                {dialogueDevResult && <ResultCard title="대사 디벨롭" onClose={() => setDialogueDevResult(null)} color="rgba(244,114,182,0.15)"><ErrorBoundary><DialogueDevPanel data={dialogueDevResult} isMobile={isMobile} /></ErrorBoundary></ResultCard>}
              </div>

              {getStageStatus("5") === "done" && (
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => advanceToStage("6")} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                    다음 단계: 시나리오 초고
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div></ErrorBoundary>
              </div>
            )}
          </div>

          {/* ═══ STAGE 6: 시나리오 초고 ═══ */}
          <div ref={(el) => { stageRefs.current["6"] = el; }} style={{ borderRadius: 14, marginBottom: 10, overflow: "visible", border: `1px solid ${currentStage === "6" ? "rgba(167,139,250,0.25)" : "var(--c-bd-1)"}`, transition: "border-color 0.25s" }}>
            <div onClick={() => setCurrentStage("6")} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: currentStage === "6" ? "rgba(167,139,250,0.04)" : "rgba(var(--tw),0.01)", transition: "background 0.2s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: `2px solid ${statusDotColor[getStageStatus("6")]}`, display: "flex", alignItems: "center", justifyContent: "center", background: getStageStatus("6") === "done" ? "rgba(78,204,163,0.1)" : "transparent", transition: "all 0.25s" }}>
                {getStageStatus("6") === "done" ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg> : <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: statusDotColor[getStageStatus("6")] }}>06</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentStage === "6" ? "var(--text-main)" : getStageStatus("6") === "done" ? "var(--c-tx-75)" : "var(--c-tx-45)" }}>시나리오 초고</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2 }}>Field · McKee · Snyder</div>
              </div>
              {currentStage !== "6" && getStageDoneCount("6") > 0 && <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)", fontFamily: "'JetBrains Mono', monospace" }}>{getStageDoneCount("6")}/{STAGE_TOTALS["6"]}</span>}
              {getStageStatus("6") === "active" && <Spinner size={12} color="#A78BFA" />}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-25)" strokeWidth={2} strokeLinecap="round" style={{ transform: currentStage === "6" ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {currentStage === "6" && (
              <div style={{ borderTop: "1px solid var(--c-card-3)", padding: isMobile ? "20px 16px" : "24px 24px" }}>
              <ErrorBoundary><div>

              {/* ── 솔직한 안내 배너 ── */}
              <div style={{ marginBottom: 18, padding: "14px 16px", borderRadius: 12, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA", marginBottom: 6 }}>이 단계에 대해 솔직하게</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.7 }}>
                  이 시나리오는 <strong style={{ color: "var(--c-tx-75)" }}>구조 스캐폴드</strong>입니다 — 완성본이 아닙니다.<br />
                  AI가 비트 시트의 흐름을 따라 전체 초고를 작성하지만, <strong style={{ color: "var(--c-tx-75)" }}>씬별 세부 집필과 대사 수정은 반드시 직접 해야 합니다.</strong><br />
                  <span style={{ color: "rgba(167,139,250,0.7)", fontSize: 11, marginTop: 4, display: "block" }}>Stage 5의 트리트먼트·비트 시트·대사 디벨롭을 모두 완료하면 훨씬 완성도 높은 초고가 나옵니다.</span>
                </div>
              </div>
              <ToolButton
                icon={<SvgIcon d={ICON.film} size={16} />}
                label="시나리오 생성"
                sub="Field · McKee · Snyder"
                done={!!scenarioDraftResult}
                loading={scenarioDraftLoading}
                color="#A78BFA"
                onClick={generateScenarioDraft}
                disabled={!logline.trim()}
                tooltip={"로그라인·캐릭터·트리트먼트·비트 시트를 바탕으로 시나리오 초고를 작성합니다.\n\n표준 시나리오 포맷 (씬 헤더 · 액션 라인 · 대사)으로 출력되며, 3막 구조 전체를 커버합니다.\n\n트리트먼트와 비트 시트를 먼저 생성하면 더 완성도 높은 초고가 나옵니다."}
              />
              <ErrorMsg msg={scenarioDraftError} />
              {scenarioDraftResult && (
                <ResultCard title="시나리오 초고" onClose={() => { setScenarioDraftResult(""); setScenarioDraftHistory([]); }} onUndo={() => undoHistory(setScenarioDraftHistory, setScenarioDraftResult, scenarioDraftHistory)} historyCount={scenarioDraftHistory.length} color="rgba(167,139,250,0.15)">
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(scenarioDraftResult)}
                      style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#A78BFA", fontSize: 11, cursor: "pointer" }}
                    >
                      전체 복사
                    </button>
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: isMobile ? 12 : 13, lineHeight: 1.8, color: "var(--c-tx-75)", margin: 0 }}>
                    {scenarioDraftResult}
                  </pre>
                </ResultCard>
              )}

              {getStageStatus("6") === "done" && (
                <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => advanceToStage("7")} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid rgba(200,168,75,0.4)", background: "rgba(200,168,75,0.1)", color: "#C8A84B", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                    다음 단계: Script Coverage
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div></ErrorBoundary>
              </div>
            )}
          </div>

          {/* ═══ STAGE 7: Script Coverage ═══ */}
          <div ref={(el) => { stageRefs.current["7"] = el; }} style={{ borderRadius: 14, marginBottom: 10, overflow: "visible", border: `1px solid ${currentStage === "7" ? "rgba(96,165,250,0.25)" : "var(--c-bd-1)"}`, transition: "border-color 0.25s" }}>
            <div onClick={() => setCurrentStage("7")} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: currentStage === "7" ? "rgba(96,165,250,0.05)" : "rgba(var(--tw),0.01)", transition: "background 0.2s" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: `2px solid ${statusDotColor[getStageStatus("7")]}`, display: "flex", alignItems: "center", justifyContent: "center", background: getStageStatus("7") === "done" ? "rgba(78,204,163,0.1)" : "transparent", transition: "all 0.25s" }}>
                {getStageStatus("7") === "done" ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg> : <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: statusDotColor[getStageStatus("7")] }}>07</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentStage === "7" ? "var(--text-main)" : getStageStatus("7") === "done" ? "var(--c-tx-75)" : "var(--c-tx-45)" }}>Script Coverage</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2 }}>최종 커버리지 · 시장 가치 평가</div>
              </div>
              {currentStage !== "7" && getStageDoneCount("7") > 0 && <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.06)", fontFamily: "'JetBrains Mono', monospace" }}>{getStageDoneCount("7")}/{STAGE_TOTALS["7"]}</span>}
              {getStageStatus("7") === "active" && <Spinner size={12} color="#C8A84B" />}
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-25)" strokeWidth={2} strokeLinecap="round" style={{ transform: currentStage === "7" ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {currentStage === "7" && (
              <div style={{ borderTop: "1px solid var(--c-card-3)", padding: isMobile ? "20px 16px" : "24px 24px" }}>
              <ErrorBoundary><div>

              <ToolButton icon={<SvgIcon d={ICON.clipboard} size={16} />} label="최종 평가" sub="Script Coverage · 시장 가치" done={!!(scriptCoverageResult || valuationResult)} loading={scriptCoverageLoading || valuationLoading} color="#60A5FA" onClick={async () => { await analyzeScriptCoverage(); await analyzeValuation(); }} disabled={!logline.trim()}
                tooltip={"할리우드 스튜디오와 한국 방송사 스타일의 공식 심사 보고서를 생성하고 시장 가치를 추정합니다.\n\n• Script Coverage — RECOMMEND / CONSIDER / PASS 3단계 판정\n• 시장 가치 — 한국·미국 시장 추정 판매가 · 신인/경력 기준"} />
              <ErrorMsg msg={scriptCoverageError || valuationError} />

              {scriptCoverageResult && (
                <>
                  <ResultCard title="Script Coverage" onClose={() => setScriptCoverageResult(null)} color="rgba(96,165,250,0.15)">
                    <ErrorBoundary><ScriptCoveragePanel data={scriptCoverageResult} isMobile={isMobile} /></ErrorBoundary>
                  </ResultCard>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                    <DocButton label="투자·지원 제안서 PDF" sub="커버리지 포함 완성 제안서" onClick={() => openApplicationDoc("final")} />
                  </div>
                </>
              )}

              {valuationResult && (
                <ResultCard title="시장 가치 평가" onClose={() => setValuationResult(null)} color="rgba(255,209,102,0.15)">
                  <ErrorBoundary><ValuationPanel data={valuationResult} isMobile={isMobile} /></ErrorBoundary>
                </ResultCard>
              )}
            </div></ErrorBoundary>
              </div>
            )}
          </div>

        </div>

      {/* ─── Footer ─── */}
      <div style={{
        borderTop: "1px solid var(--c-card-2)",
        background: "var(--bg-page-alt)",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "14px 12px" : "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-20)", fontFamily: "'JetBrains Mono', monospace" }}>
            &copy; {new Date().getFullYear()} Hello Loglines &nbsp;·&nbsp; Powered by Claude AI
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "rgba(var(--tw),0.18)", fontFamily: "'JetBrains Mono', monospace" }}>made by</span>
            <img
              src="/studioroom-logo-light.png"
              alt="STUDIO ROOM"
              style={{ height: 16, opacity: 0.55, filter: "brightness(1)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
