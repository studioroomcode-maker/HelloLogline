import { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
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
  REWRITE_DIAG_SYSTEM_PROMPT, PARTIAL_REWRITE_SYSTEM_PROMPT, FULL_REWRITE_SYSTEM_PROMPT,
  CRITERIA_GUIDE, LABELS_KR, GENRES, DURATION_OPTIONS, EXAMPLE_LOGLINES,
  EPISODE_SERIES_SYSTEM_PROMPT,
  MASTER_REPORT_SYSTEM_PROMPT,
} from "./constants.js";
import { getGrade, getInterestLevel, formatDate, calcSectionTotal, callClaude, callClaudeText } from "./utils.js";
import { REVISION_COLORS } from "./editor/FountainParser.js";
import { exportToPdf, exportToMarkdown, downloadHtmlAsPdf } from "./utils-pdf.js";
import {
  DEMO_LOGLINE, DEMO_GENRE, DEMO_RESULT, DEMO_CHAR_DEV_RESULT,
  DEMO_SHADOW_RESULT, DEMO_AUTHENTICITY_RESULT, DEMO_SYNOPSIS_RESULTS,
  DEMO_TREATMENT_RESULT, DEMO_BEAT_SHEET_RESULT, DEMO_SCRIPT_COVERAGE_RESULT,
  DEMO_VALUATION_RESULT, DEMO_STRUCTURE_RESULT, DEMO_REWRITE_DIAG_RESULT,
  DEMO_EARLY_COVERAGE_RESULT, DEMO_INSIGHT_RESULT,
  DEMO_EXPERT_PANEL_RESULT, DEMO_VALUE_CHARGE_RESULT, DEMO_ACADEMIC_RESULT,
  DEMO_MYTH_MAP_RESULT, DEMO_BARTHES_CODE_RESULT, DEMO_KOREAN_MYTH_RESULT,
  DEMO_SUBTEXT_RESULT, DEMO_THEME_RESULT, DEMO_COMPARABLE_RESULT,
  DEMO_DIALOGUE_DEV_RESULT, DEMO_SCENE_LIST_RESULT,
  DEMO_SCENARIO_DRAFT_RESULT, DEMO_PARTIAL_REWRITE_RESULT, DEMO_FULL_REWRITE_RESULT,
} from "./demo-data.js";
import {
  LoglineAnalysisSchema, SynopsisSchema, AcademicAnalysisSchema,
  MythMapSchema, BarthesCodeSchema, KoreanMythSchema, ExpertPanelSchema,
  ValueChargeSchema, ShadowAnalysisSchema, AuthenticitySchema, CharacterDevSchema,
  StructureAnalysisSchema, ThemeAnalysisSchema, SubtextSchema,
  BeatSheetSchema, DialogueDevSchema, ScriptCoverageSchema,
  ComparableWorksSchema, ValuationSchema, EarlyCoverageSchema, InsightSchema,
  EpisodeSeriesSchema,
  MasterReportSchema,
} from "./schemas.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import LoginScreen from "./LoginScreen.jsx";
import { LoglineProvider } from "./context/LoglineContext.jsx";
import WelcomeModal from "./WelcomeModal.jsx";
import SidebarLayout from "./stages/SidebarLayout.jsx";
import { saveProject, loadProjects, deleteProject } from "./db.js";
import { ApiKeyModal, HistoryPanel } from "./panels.jsx";
import { useStage1State } from "./hooks/useStage1State.js";
import { useNetworkStatus } from "./hooks/useNetworkStatus.js";

/* ─── Lazy-loaded heavy panels ─── */
/* ─── Lazy-loaded stage content ─── */

/**
 * 청크 로드 실패 시 한 번 자동 새로고침하는 lazy 래퍼.
 * 새 빌드 배포 후 서비스워커가 이전 해시 청크를 제거하면
 * "Failed to fetch dynamically imported module" 에러가 발생한다.
 * → 감지 즉시 페이지 새로고침으로 새 청크를 로드한다.
 */
function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch((err) => {
      const isChunkError =
        err?.message?.includes("dynamically imported module") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("Importing a module script failed") ||
        err?.name === "ChunkLoadError";

      if (isChunkError) {
        const alreadyRetried = sessionStorage.getItem("hll-chunk-reload");
        if (!alreadyRetried) {
          sessionStorage.setItem("hll-chunk-reload", "1");
          window.location.reload();
          // 새로고침 중이므로 resolve하지 않는 Promise 반환
          return new Promise(() => {});
        }
      }
      throw err;
    })
  );
}

const Stage1Content = lazyWithRetry(() => import("./stages/Stage1Content.jsx"));
const Stage2Content = lazyWithRetry(() => import("./stages/Stage2Content.jsx"));
const Stage3Content = lazyWithRetry(() => import("./stages/Stage3Content.jsx"));
const Stage7Content = lazyWithRetry(() => import("./stages/Stage7Content.jsx"));
const Stage6Content = lazyWithRetry(() => import("./stages/Stage6Content.jsx"));
const Stage8Content = lazyWithRetry(() => import("./stages/Stage8Content.jsx"));
const Stage4Content = lazyWithRetry(() => import("./stages/Stage4Content.jsx"));
const Stage5Content = lazyWithRetry(() => import("./stages/Stage5Content.jsx"));
const DashboardView = lazyWithRetry(() => import("./stages/DashboardView.jsx"));
const ScriptCoveragePanel = lazyWithRetry(() =>
  import("./panels/EvaluationPanels.jsx").then((m) => ({ default: m.ScriptCoveragePanel }))
);
const ValuationPanel = lazyWithRetry(() =>
  import("./panels/EvaluationPanels.jsx").then((m) => ({ default: m.ValuationPanel }))
);
const StoryDoctorPanel = lazyWithRetry(() => import("./stages/StoryDoctorPanel.jsx"));

/* ─── 크레딧 사용 내역 트래킹 ─── */
function trackCreditUsage(feature, amount = 1) {
  try {
    const history = JSON.parse(localStorage.getItem("hll_credit_history") || "[]");
    history.unshift({ date: new Date().toISOString(), feature, amount });
    localStorage.setItem("hll_credit_history", JSON.stringify(history.slice(0, 50)));
  } catch {}
}

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
  { id: "2", num: "02", name: "개념 분석", sub: "테마 / 신화구조 / 학술 / 전문가 (선택)", icon: ICON.chart },
  { id: "3", num: "03", name: "캐릭터", sub: "그림자 / 진정성 / 캐릭터 디벨롭", icon: ICON.users },
  { id: "4", num: "04", name: "시놉시스", sub: "구조분석 / 가치전하 / 하위텍스트 / 시놉시스", icon: ICON.doc },
  { id: "5", num: "05", name: "트리트먼트 비트", sub: "트리트먼트 / 비트시트 / 대사", icon: ICON.film },
  { id: "6", num: "06", name: "시나리오 초고", sub: "시나리오 생성 / Field · McKee · Snyder", icon: ICON.film },
  { id: "7", num: "07", name: "Script Coverage", sub: "커버리지 · 시장가치 · 고쳐쓰기 전 진단", icon: ICON.clipboard },
  { id: "8", num: "08", name: "시나리오 고쳐쓰기", sub: "초고 진단 / 부분 재작성 / 전체 개고", icon: ICON.edit },
];

/* ─── AI Transition Hint Prompts ─── */
const CHAR_HINT_PROMPT = `당신은 시나리오 개발 컨설턴트입니다.
로그라인 분석 결과를 바탕으로 캐릭터 개발 단계에서 집중해야 할 핵심 3가지를 제시합니다.
낮은 점수 항목을 직접 보완하는 캐릭터 전략으로 연결하세요. 구체적이고 실행 가능하게.

반드시 아래 JSON 형식으로만 응답하세요.
{
  "weakness": "로그라인의 핵심 약점 한 줄 요약 (구체적으로)",
  "points": [
    {"focus": "집중 항목명 (짧게)", "action": "캐릭터 개발 시 구체적으로 할 것 (1문장)"},
    {"focus": "집중 항목명 (짧게)", "action": "캐릭터 개발 시 구체적으로 할 것 (1문장)"},
    {"focus": "집중 항목명 (짧게)", "action": "캐릭터 개발 시 구체적으로 할 것 (1문장)"}
  ]
}`;

const REWRITE_HINT_PROMPT = `당신은 스크립트 에디터입니다.
Script Coverage 결과를 바탕으로 고쳐쓰기 우선순위 3가지를 제시합니다.
가장 낮은 등급 영역을 중심으로 구체적이고 실행 가능한 수정 방향을 제시하세요.

반드시 아래 JSON 형식으로만 응답하세요.
{
  "verdict": "고쳐쓰기 핵심 방향 한 줄",
  "priorities": [
    {"rank": 1, "area": "영역명", "issue": "문제점 (1문장)", "action": "수정 방향 (1문장)"},
    {"rank": 2, "area": "영역명", "issue": "문제점 (1문장)", "action": "수정 방향 (1문장)"},
    {"rank": 3, "area": "영역명", "issue": "문제점 (1문장)", "action": "수정 방향 (1문장)"}
  ]
}`;

/* ─── Genre-specific beat structure hints ─── */
const GENRE_BEAT_HINTS = {
  thriller: `[스릴러/액션 구조 강조]
- 오프닝: 즉각적 위기 또는 미스터리로 시작
- 2막 전반: 위협 고조 + 주인공이 직접 나서는 계기
- 미드포인트: 거짓 해결 또는 충격적 반전 (적이 더 가까이 있음을 발각)
- 2막 후반: 추적/쫓김 교차, 동료 배신/탈락, 코너에 몰리는 주인공
- 3막: 최후 대결 → 반전 결말. 비트마다 긴장-이완-긴장 사이클 명시`,

  romance: `[로맨스/멜로 구조 강조]
- 오프닝: 주인공의 결핍(사랑 없는 상태) 시각화
- 첫 만남(Meet Cute) 비트 필수 포함
- B스토리(로맨스 라인) 비트에서 두 인물 연결의 계기
- 미드포인트: 설레는 '가장 가까운 순간'
- 모든 것을 잃다: 오해·이별·포기 — 감정적 최저점
- 3막: 깨달음 → 용기 → 재결합. 감정 곡선(설렘→갈등→상실→희망→결합) 명시`,

  drama: `[드라마 구조 강조]
- 각 비트마다 내면 변화(캐릭터 아크)와 외부 사건을 함께 서술
- 촉발 사건: 주인공의 세계관이 무너지는 계기
- 미드포인트: 외적 목표 달성 vs 내적 공허함의 충돌
- 모든 것을 잃다: 도덕적·감정적 붕괴 → 자기 직면
- 피날레: 외적 해결보다 내적 변화·수용이 중심`,

  comedy: `[코미디 구조 강조]
- 코미디 전제(premise) 비트: 주인공이 엉뚱한 상황에 빠지는 설정을 명확히
- 재미와 게임 비트: 코미디 가장 재미있는 상황들 열거 (에스컬레이션 필수)
- 각 비트 tone 필드에 '코믹 피크', '블랙코미디', '시추에이션 코미디' 등 명시
- 미드포인트: 코미디가 반전되는 순간 (웃음이 갑자기 진지해지거나 역전)
- 피날레: 설정된 모든 개그 페이오프 + 따뜻한 결말`,

  horror: `[호러 구조 강조]
- 오프닝: 일상 위협의 전조 + 불안감 씨앗 심기
- 설정 비트: 규칙(호러 세계관 논리) 확립
- 2막 비트: 공포 강도 점진적 에스컬레이션 (개별 공포 → 집단 위협 → 생존 불가능 상황)
- 미드포인트: 첫 번째 '진짜' 공포 폭로 또는 희생자 발생
- 모든 것을 잃다: 보호막 완전 붕괴
- 3막: 최후 생존 시도. 각 비트 tone 필드에 긴장감/공포 강도 명시`,

  sf: `[SF/판타지 구조 강조]
- 설정 비트: SF/판타지 세계관 법칙 확립 (관객이 이해해야 3막이 작동함)
- B스토리: 세계관의 인간적 의미 전달하는 감정선
- 재미와 게임: SF/판타지 아이디어가 가장 흥미롭게 탐구되는 구간
- 미드포인트: 세계관 법칙의 결정적 역설 또는 충격 폭로
- 모든 것을 잃다: 주인공이 세계관의 희생자가 되는 순간
- 피날레: SF/판타지 아이디어의 인간적 해답 제시`,

  crime: `[범죄/느와르 구조 강조]
- 오프닝: 범죄 현장 또는 부패한 세계 소개
- 촉발 사건: 수사/복수/범행 시작 계기
- 2막: 단서 배치 + 오해를 유도하는 허위 단서(red herring) 비트 포함
- 미드포인트: 진실의 일부 폭로 + 더 큰 음모의 실마리
- 모든 것을 잃다: 주인공이 도덕적 타협 또는 배신당함
- 피날레: 진실 전체 폭로 + 도덕적 대가. 비트마다 도덕적 양면성 명시`,

  animation: `[애니메이션 구조 강조]
- 시각적 유머·상상력 비트를 별도로 명시
- 오프닝: 색감·캐릭터 디자인·세계관이 단번에 전달되는 장면
- 설정: 타겟 연령대에 맞는 세계관 소개 속도 조정
- 재미와 게임: 애니메이션만의 시각적 과장·변형 활용 구간
- 각 비트 key_elements에 '시각적 개그', '표정 연기', '색채 변화' 등 포함`,

  auto: "",
};

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
          border: "1px solid var(--border-tooltip)",
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

/* ─── MBTI 데이터 & 말풍선 입력 컴포넌트 ─── */
const MBTI_INFO = {
  INTJ: { emoji: "🏰", nickname: "전략가", desc: "독립적이고 냉철한 설계자. 장기 계획을 즐기며, 비효율을 혐오한다. 감정보다 논리로 움직인다." },
  INTP: { emoji: "🔬", nickname: "논리술사", desc: "조용한 분석가. 이론과 원리에 집착하며 끝없이 질문한다. 규칙보다 진실을 따른다." },
  ENTJ: { emoji: "👑", nickname: "통솔자", desc: "타고난 리더. 목표를 향해 거침없이 달리며 다른 사람을 이끈다. 도전을 즐긴다." },
  ENTP: { emoji: "⚡", nickname: "변론가", desc: "아이디어 발전기. 논쟁을 즐기고 고정관념을 깨기 좋아한다. 지루함을 못 참는다." },
  INFJ: { emoji: "🌙", nickname: "옹호자", desc: "깊은 통찰력을 지닌 이상주의자. 타인의 감정을 직감적으로 읽는다. 혼자만의 시간이 필요하다." },
  INFP: { emoji: "🌿", nickname: "중재자", desc: "내면 세계가 풍부한 몽상가. 자신의 가치관에 강한 신념을 품는다. 공감 능력이 뛰어나다." },
  ENFJ: { emoji: "🌟", nickname: "선도자", desc: "카리스마 넘치는 조력자. 다른 사람의 성장을 위해 헌신한다. 갈등 조율에 능하다." },
  ENFP: { emoji: "🎨", nickname: "활동가", desc: "에너지 넘치는 자유로운 영혼. 새로운 가능성에 열광하며 사람들을 북돋운다. 루틴을 싫어한다." },
  ISTJ: { emoji: "📋", nickname: "현실주의자", desc: "철두철미한 관리자. 규칙과 책임을 중시하며 약속을 반드시 지킨다. 변화를 불편해한다." },
  ISFJ: { emoji: "🛡", nickname: "수호자", desc: "헌신적인 보호자. 가까운 사람들을 위해 묵묵히 희생한다. 갈등을 피하려는 경향이 있다." },
  ESTJ: { emoji: "⚖️", nickname: "경영자", desc: "질서와 원칙의 수호자. 체계적으로 일을 처리하며 주도권을 쥐려 한다. 직설적이다." },
  ESFJ: { emoji: "🤝", nickname: "집정관", desc: "사교적인 돌봄 제공자. 주변 사람의 감정과 필요에 민감하게 반응한다. 인정받고 싶어한다." },
  ISTP: { emoji: "🔧", nickname: "장인", desc: "조용한 문제 해결사. 실용적이고 손으로 직접 해결하는 것을 선호한다. 감정 표현이 적다." },
  ISFP: { emoji: "🎶", nickname: "모험가", desc: "온화하고 감각적인 예술가. 아름다움과 조화를 추구하며 자유롭게 살고 싶어한다." },
  ESTP: { emoji: "🏄", nickname: "사업가", desc: "대담하고 현실 감각이 뛰어난 행동파. 순간에 집중하며 위험을 즐긴다. 지루함과 이론을 싫어한다." },
  ESFP: { emoji: "🎉", nickname: "연예인", desc: "삶을 축제로 만드는 엔터테이너. 사람과 어울리는 것을 좋아하며 즉흥적이다. 현재에 충실하다." },
};

function MbtiInput({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  const info = MBTI_INFO[value];
  const showBubble = focused || (value.length === 4 && info);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase().slice(0, 4))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="예: INFJ"
        maxLength={4}
        style={{
          width: 90, padding: "9px 12px", borderRadius: 8,
          border: `1px solid ${info ? "rgba(200,168,75,0.5)" : "var(--c-bd-3)"}`,
          background: info ? "rgba(200,168,75,0.06)" : "var(--bg-page)",
          color: "var(--text-main)", fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          outline: "none", boxSizing: "border-box", letterSpacing: 2,
          transition: "border-color 0.2s, background 0.2s",
        }}
      />
      {showBubble && info && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",
          left: 0,
          width: 220,
          background: "var(--bg-tooltip, #1e1e2e)",
          border: "1px solid rgba(200,168,75,0.25)",
          borderRadius: 12,
          padding: "11px 14px",
          zIndex: 500,
          pointerEvents: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        }}>
          {/* 말풍선 꼬리 */}
          <div style={{
            position: "absolute", top: "100%", left: 20,
            width: 0, height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "7px solid rgba(200,168,75,0.25)",
          }} />
          <div style={{
            position: "absolute", top: "calc(100% - 1px)", left: 21,
            width: 0, height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid var(--bg-tooltip, #1e1e2e)",
          }} />
          {/* 내용 */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{info.emoji}</span>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#C8A84B", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>{value}</span>
              <span style={{ fontSize: 10, color: "rgba(200,168,75,0.7)", marginLeft: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{info.nickname}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-tooltip, #ccc)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif", wordBreak: "keep-all" }}>
            {info.desc}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ToolButton component ─── */
function ToolButton({ icon, label, sub, done, loading, color, onClick, disabled, tooltip, creditCost = 0 }) {
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
          {creditCost > 0 && (
            <span style={{
              fontSize: 9, padding: "2px 5px", borderRadius: 6,
              background: "rgba(200,168,75,0.12)", color: "#C8A84B",
              border: "1px solid rgba(200,168,75,0.25)",
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, lineHeight: 1.2,
            }}>{creditCost}cr</span>
          )}
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
          border: "1px solid var(--border-tooltip)",
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

/* ─── FeedbackBox — 결과물 하단 피드백 입력 UI ─── */
function FeedbackBox({ value, onChange, onSubmit, loading, placeholder = "수정 요청을 입력하세요" }) {
  return (
    <div style={{
      marginTop: 16, paddingTop: 14,
      borderTop: "1px dashed var(--c-bd-2)",
    }}>
      <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginBottom: 7, fontWeight: 600, letterSpacing: "0.02em" }}>
        AI에게 수정 요청
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 9,
          border: "1px solid var(--c-bd-3)", background: "rgba(var(--tw),0.025)",
          color: "var(--text-main)", fontSize: 12, resize: "vertical",
          fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6,
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 7 }}>
        <button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          style={{
            padding: "8px 18px", borderRadius: 8,
            border: "1px solid rgba(167,139,250,0.35)",
            background: loading || !value.trim() ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.1)",
            color: loading || !value.trim() ? "var(--c-tx-30)" : "#A78BFA",
            fontSize: 12, fontWeight: 600, cursor: loading || !value.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {loading ? "수정 중..." : "피드백 반영"}
        </button>
      </div>
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

/* ─── Toast component ─── */
function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  const colors = {
    error:   { bg: "rgba(232,93,117,0.12)", border: "rgba(232,93,117,0.35)", text: "#E85D75", icon: "✕" },
    success: { bg: "rgba(78,204,163,0.12)",  border: "rgba(78,204,163,0.35)",  text: "#4ECCA3", icon: "✓" },
    info:    { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)",  text: "#60A5FA", icon: "ℹ" },
    warn:    { bg: "rgba(200,168,75,0.12)",  border: "rgba(200,168,75,0.35)",  text: "#C8A84B", icon: "🔒" },
  };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380, pointerEvents: "none" }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(12,12,28,0.88)", border: `1px solid ${c.border}`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 var(--glass-bd-top)`,
            backdropFilter: "var(--blur-micro)", WebkitBackdropFilter: "var(--blur-micro)",
            animation: "fadeSlideUp 0.28s var(--ease-out)",
            pointerEvents: "auto",
          }}>
            <span style={{ fontSize: 13, color: c.text, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
            <span style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", flex: 1 }}>{t.message}</span>
            <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", color: "var(--c-tx-35)", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        );
      })}
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

  // ── Education Mode ──
  const [eduMode, setEduMode] = useState(() => localStorage.getItem("hll_edu_mode") === "1");
  useEffect(() => {
    localStorage.setItem("hll_edu_mode", eduMode ? "1" : "0");
  }, [eduMode]);

  // ── API Key ── (sessionStorage 우선, localStorage 하위 호환)
  const [apiKey, setApiKey] = useState(
    () => sessionStorage.getItem("logline_api_key") || localStorage.getItem("logline_api_key") || ""
  );
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [serverHasKey, setServerHasKey] = useState(false);

  // ── Input ──
  const [logline, setLogline] = useState("");
  const [genre, setGenre] = useState("auto");
  const [activeTab, setActiveTab] = useState("overview");

  // ── Stage 1 상태 (useStage1State 훅으로 분리) ──
  const {
    result, setResult,
    loading, setLoading,
    error, setError,
    compareMode, setCompareMode,
    logline2, setLogline2,
    result2, setResult2,
    loading2, setLoading2,
    earlyCoverageResult, setEarlyCoverageResult,
    earlyCoverageLoading, setEarlyCoverageLoading,
    earlyCoverageError, setEarlyCoverageError,
    storyFixes, setStoryFixes,
    storyPivots, setStoryPivots,
    aiImprovement, setAiImprovement,
    insightResult, setInsightResult,
    insightLoading, setInsightLoading,
    insightError, setInsightError,
  } = useStage1State();

  // ── History ──
  const [history, setHistory] = useState(
    () => JSON.parse(localStorage.getItem("logline_history") || "[]")
  );
  const [showHistory, setShowHistory] = useState(false);

  // ── Mobile ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // ── Stage ──
  const [currentStage, setCurrentStage] = useState("dashboard");

  // ── Synopsis ──
  const [showSynopsisPanel, setShowSynopsisPanel] = useState(false);
  const [synopsisMode, setSynopsisMode] = useState("auto");
  const [selectedDuration, setSelectedDuration] = useState("feature");
  const [customTheme, setCustomTheme] = useState("");
  const [customDurationText, setCustomDurationText] = useState("");
  const [customFormatLabel, setCustomFormatLabel] = useState("");

  // ── 기존 시나리오 참고 ──
  const [referenceScenario, setReferenceScenario] = useState(() =>
    localStorage.getItem("hll_ref_scenario") || ""
  );
  const [referenceScenarioEnabled, setReferenceScenarioEnabled] = useState(() =>
    localStorage.getItem("hll_ref_scenario_enabled") === "1"
  );
  const [referenceScenarioSummary, setReferenceScenarioSummary] = useState(() =>
    localStorage.getItem("hll_ref_summary") || ""
  );
  const [extractLoglineLoading, setExtractLoglineLoading] = useState(false);
  const [extractLoglineError, setExtractLoglineError] = useState("");
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const [summarizeError, setSummarizeError] = useState("");

  // ── 기존 시나리오 localStorage 동기화 ──
  useEffect(() => {
    localStorage.setItem("hll_ref_scenario", referenceScenario);
  }, [referenceScenario]);
  useEffect(() => {
    localStorage.setItem("hll_ref_scenario_enabled", referenceScenarioEnabled ? "1" : "0");
  }, [referenceScenarioEnabled]);
  useEffect(() => {
    localStorage.setItem("hll_ref_summary", referenceScenarioSummary);
  }, [referenceScenarioSummary]);
  // 시나리오 내용이 바뀌면 요약 초기화 (최초 로드 제외)
  const refScenarioFirstRender = useRef(true);
  useEffect(() => {
    if (refScenarioFirstRender.current) { refScenarioFirstRender.current = false; return; }
    setReferenceScenarioSummary("");
  }, [referenceScenario]);

  // ── 스토리 닥터 ──
  const [showStoryDoctor, setShowStoryDoctor] = useState(false);

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

  // ── 팀 협업 ──
  const [teamMembers, setTeamMembers] = useState([]);
  const [sceneAssignments, setSceneAssignments] = useState({});
  const [stageComments, setStageComments] = useState({});
  const [currentWorkingAs, setCurrentWorkingAs] = useState(null); // null = "나" (owner)
  const [activityLog, setActivityLog] = useState([]); // 변경 알림 로그

  // ── 개정본 버전 관리 (Final Draft 스타일) ──
  const [revisions, setRevisions] = useState([]); // [{ id, name, shortName, color, snapshot, createdAt }]
  const [currentRevisionId, setCurrentRevisionId] = useState(null); // null = 원고 (흰색)
  const [sceneRevisionMap, setSceneRevisionMap] = useState({}); // { sceneHeading: { id, color, shortName } }

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

  // ── AI 전환 가이드 ──
  const [charGuide, setCharGuide] = useState(null);
  const [charGuideLoading, setCharGuideLoading] = useState(false);
  const [charGuideError, setCharGuideError] = useState("");
  const [rewriteGuide, setRewriteGuide] = useState(null);
  const [rewriteGuideLoading, setRewriteGuideLoading] = useState(false);
  const [rewriteGuideError, setRewriteGuideError] = useState("");

  // ── Comparable Works ──
  const [comparableResult, setComparableResult] = useState(null);
  const [comparableLoading, setComparableLoading] = useState(false);
  const [comparableError, setComparableError] = useState("");
  const comparableRef = useRef(null);

  // ── Master Report ──
  const [masterReportResult, setMasterReportResult] = useState(null);
  const [masterReportLoading, setMasterReportLoading] = useState(false);
  const [masterReportError, setMasterReportError] = useState("");

  // ── Episode Series Design ──
  const [episodeDesignResult, setEpisodeDesignResult] = useState(null);
  const [episodeDesignLoading, setEpisodeDesignLoading] = useState(false);
  const [episodeDesignError, setEpisodeDesignError] = useState("");

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

  // ── Generation Context Badges (결과 생성 시 사용된 컨텍스트 추적) ──
  const [treatmentCtx, setTreatmentCtx] = useState(null);   // { char, synopsis, plotPoints, genre }
  const [beatSheetCtx, setBeatSheetCtx] = useState(null);   // { char, treatment, synopsis, genre }
  const [scenarioDraftCtx, setScenarioDraftCtx] = useState(null); // { char, treatment, beats, dialogue, genre }

  // ── Feedback Refine (각 결과물 대화형 수정) ──
  const [treatmentFeedback, setTreatmentFeedback] = useState("");
  const [treatmentRefineLoading, setTreatmentRefineLoading] = useState(false);
  const [scenarioDraftFeedback, setScenarioDraftFeedback] = useState("");
  const [scenarioDraftRefineLoading, setScenarioDraftRefineLoading] = useState(false);
  const [treatmentBefore, setTreatmentBefore] = useState(null);
  const [showTreatmentBefore, setShowTreatmentBefore] = useState(false);
  const [scenarioDraftBefore, setScenarioDraftBefore] = useState(null);
  const [showScenarioDraftBefore, setShowScenarioDraftBefore] = useState(false);
  const [beatSheetFeedback, setBeatSheetFeedback] = useState("");
  const [beatSheetRefineLoading, setBeatSheetRefineLoading] = useState(false);
  const [beatSheetBefore, setBeatSheetBefore] = useState(null);
  const [showBeatSheetBefore, setShowBeatSheetBefore] = useState(false);
  const [charDevFeedback, setCharDevFeedback] = useState("");
  const [charDevRefineLoading, setCharDevRefineLoading] = useState(false);

  // ── Version History (최대 5개) ──
  const [treatmentHistory, setTreatmentHistory] = useState([]);
  const [beatSheetHistory, setBeatSheetHistory] = useState([]);
  const [scenarioDraftHistory, setScenarioDraftHistory] = useState([]);
  const [charDevHistory, setCharDevHistory] = useState([]);
  const [pipelineHistory, setPipelineHistory] = useState([]);

  // ── Staleness Flags ──
  const [treatmentStale, setTreatmentStale] = useState(false);
  const [beatSheetStale, setBeatSheetStale] = useState(false);
  const [scenarioDraftStale, setScenarioDraftStale] = useState(false);

  // ── Rewrite (Stage 8) ──
  const [rewriteDiagResult, setRewriteDiagResult] = useState(null);
  const [rewriteDiagLoading, setRewriteDiagLoading] = useState(false);
  const [rewriteDiagError, setRewriteDiagError] = useState("");
  const [partialRewriteInstruction, setPartialRewriteInstruction] = useState("");
  const [partialRewriteResult, setPartialRewriteResult] = useState("");
  const [partialRewriteLoading, setPartialRewriteLoading] = useState(false);
  const [partialRewriteError, setPartialRewriteError] = useState("");
  const [fullRewriteNotes, setFullRewriteNotes] = useState("");
  const [fullRewriteResult, setFullRewriteResult] = useState("");
  const [fullRewriteLoading, setFullRewriteLoading] = useState(false);
  const [fullRewriteError, setFullRewriteError] = useState("");

  // ── Early Coverage / StoryFixes / AiImprovement → useStage1State로 이동 ──

  // ── Structure Twist (구조 비틀기 제안) ──
  const [structureTwistResult, setStructureTwistResult] = useState(null);
  const [structureTwistLoading, setStructureTwistLoading] = useState(false);
  const [structureTwistError, setStructureTwistError] = useState("");

  const [editingTreatment, setEditingTreatment] = useState(false);
  const [treatmentEditDraft, setTreatmentEditDraft] = useState("");
  const [editingCharacter, setEditingCharacter] = useState(false);
  const [charEditDraft, setCharEditDraft] = useState({});
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [synopsisEditDraft, setSynopsisEditDraft] = useState("");
  const [editingBeats, setEditingBeats] = useState({}); // { [beatId]: boolean }
  const [beatEditDrafts, setBeatEditDrafts] = useState({}); // { [beatId]: string }

  // ── 종합 인사이트 → useStage1State로 이동 ──

  // ── Project persistence ──
  const [showProjects, setShowProjects] = useState(false);
  const [showStoryBible, setShowStoryBible] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [saveStatus, setSaveStatus] = useState(""); // "saving" | "saved" | ""
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm }
  const importFileRef = useRef(null);

  // ── First visit onboarding ──
  const [isFirstVisit] = useState(() => !localStorage.getItem("logline_visited"));
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("logline_visited"));
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLinkLoading, setShareLinkLoading] = useState(false);

  // ── Demo mode ──
  const [isDemoMode, setIsDemoMode] = useState(false);

  // ── 역방향 진입 스테이지 (이 번호 이하는 전제조건 우회) ──
  const [reverseEntryStage, setReverseEntryStage] = useState(null); // e.g. "4", "5", "6"

  // ── 새로고침 복구 배너 ──
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  // ── Auth ──
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminRedisOk, setAdminRedisOk] = useState(true);
  const [tierSaving, setTierSaving] = useState({});

  // ── Credits ──
  const [credits, setCredits] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditPurchasing, setCreditPurchasing] = useState(false);

  // ── Toast notifications ──
  const [toasts, setToasts] = useState([]);
  const showToast = (type, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── 네트워크 상태 ──
  const isOnline = useNetworkStatus();
  const prevOnlineRef = useRef(true);
  useEffect(() => {
    if (prevOnlineRef.current === isOnline) return;
    prevOnlineRef.current = isOnline;
    if (!isOnline) {
      showToast("warn", "오프라인 상태입니다. 편집·저장·내보내기는 계속 사용 가능합니다.", 6000);
    } else {
      showToast("success", "인터넷에 다시 연결되었습니다.");
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

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
    protagonist: { name: "", role: "", want: "", need: "", flaw: "", mbti: "", description: "" },
    supporting: [{ name: "", role: "", relation: "", mbti: "", description: "" }],
  });
  const [showManualCharInput, setShowManualCharInput] = useState(false);
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
  }

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── 키보드 단축키 (Alt+0~8) ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === "0") { setCurrentStage("dashboard"); e.preventDefault(); }
      else if (e.key >= "1" && e.key <= "8") { setCurrentStage(e.key); e.preventDefault(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Auth: check session on mount ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginParam  = params.get("login");       // "success" from OAuth callback
    const errorParam  = params.get("auth_error");  // error code from OAuth callback
    const asParam     = params.get("as");          // 팀원 역할 전환 (Feature 3)

    // ?as= 파라미터: 팀원 역할 미리 설정 (URL 유지)
    if (asParam) setCurrentWorkingAs(asParam);

    // 항상 URL 파라미터 제거
    if (loginParam || errorParam) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (errorParam) {
      setAuthError(errorParam);
      setAuthLoading(false);
      return;
    }

    if (loginParam === "success") {
      localStorage.setItem("logline_visited", "1");
    }

    // httpOnly 쿠키 → credentials:include로 자동 전송
    // 구형 localStorage 토큰도 x-auth-token으로 병행 지원 (하위 호환)
    const legacyToken = localStorage.getItem("hll_auth_token");
    const headers = {};
    if (legacyToken) headers["x-auth-token"] = legacyToken;

    fetch("/api/auth/me", { credentials: "include", headers })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("logline_visited", "1");
        } else {
          localStorage.removeItem("hll_auth_token");
        }
      })
      .catch(() => localStorage.removeItem("hll_auth_token"))
      .finally(() => setAuthLoading(false));
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
            if (!sessionStorage.getItem("logline_api_key") && !localStorage.getItem("logline_api_key")) {
              setApiKey("__server__");
            }
          } else if (!apiKey) {
            if (!localStorage.getItem("logline_visited")) {
              // 첫 방문자는 welcome 오버레이 닫은 후 API 키 모달 표시
              setTimeout(() => setShowApiKeyModal(true), 100);
            } else {
              setShowApiKeyModal(true);
            }
          }
        });

    checkHealth("/api/health")
      .catch(() => checkHealth("/health"))
      .catch(() => { if (!apiKey && localStorage.getItem("logline_visited")) setShowApiKeyModal(true); });
  }, []);

  // ── Credits: fetch on login ──
  useEffect(() => {
    if (!user) { setCredits(null); return; }
    const token = localStorage.getItem("hll_auth_token");
    if (!token) return;
    fetch("/api/credits", { headers: { "x-auth-token": token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.credits != null) setCredits(d.credits); })
      .catch(() => {});
  }, [user]);

  // ── 새로고침 후 이전 작업 복구 안내 ──
  useEffect(() => {
    // 첫 방문자나 현재 작업이 있는 경우엔 표시 안함
    if (!localStorage.getItem("logline_visited")) return;
    // IndexedDB에 저장된 프로젝트가 있으면 배너 표시
    loadProjects().then(list => {
      if (list && list.length > 0) setShowRecoveryBanner(true);
    }).catch(() => {});
  }, []);

  // ── Credits: listen for hll:credits-empty & Toss URL params ──
  useEffect(() => {
    const onEmpty = () => setShowCreditModal(true);
    window.addEventListener("hll:credits-empty", onEmpty);

    // Toss 결제 후 리다이렉트 파라미터 처리
    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");
    const paymentFail = params.get("code"); // Toss fail: code=PAY_PROCESS_CANCELED etc.

    if (paymentKey && orderId && amount) {
      window.history.replaceState({}, "", window.location.pathname);
      const token = localStorage.getItem("hll_auth_token");
      setCreditPurchasing(true);
      fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token || "" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setCredits(prev => d.new_balance ?? (prev ?? 0) + d.credits_added);
            showToast("success", `${d.credits_added}크레딧이 충전되었습니다! 현재 잔액: ${d.new_balance}cr`);
          } else {
            showToast("error", d.error || "결제 확인에 실패했습니다.");
          }
        })
        .catch(() => showToast("error", "결제 처리 중 오류가 발생했습니다."))
        .finally(() => setCreditPurchasing(false));
    } else if (paymentFail) {
      window.history.replaceState({}, "", window.location.pathname);
      showToast("info", "결제가 취소되었습니다.");
    }

    return () => window.removeEventListener("hll:credits-empty", onEmpty);
  }, []);

  // ── Admin: fetch users when panel opens ──
  useEffect(() => {
    if (!showAdminPanel || !isAdmin) return;
    setAdminUsersLoading(true);
    const token = localStorage.getItem("hll_auth_token");
    fetch("/api/admin/users", { headers: { "x-auth-token": token || "" } })
      .then(r => r.json())
      .then(d => {
        setAdminRedisOk(d.configured !== false);
        setAdminUsers(d.users || []);
      })
      .catch(() => setAdminUsers([]))
      .finally(() => setAdminUsersLoading(false));
  }, [showAdminPanel]);

  const handleSetTier = async (email, newTier) => {
    setTierSaving(prev => ({ ...prev, [email]: true }));
    try {
      const token = localStorage.getItem("hll_auth_token");
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token || "" },
        body: JSON.stringify({ email, tier: newTier }),
      });
      if (r.ok) {
        setAdminUsers(prev => prev.map(u => u.email === email ? { ...u, tier: newTier } : u));
        showToast("success", `${email} → ${newTier} 변경 완료`);
      } else {
        showToast("error", "등급 변경에 실패했습니다.");
      }
    } catch {
      showToast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      setTierSaving(prev => ({ ...prev, [email]: false }));
    }
  };

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
    teamMembers, sceneAssignments, stageComments, activityLog,
    revisions, currentRevisionId, sceneRevisionMap,
    dialogueDevResult, scriptCoverageResult,
    structureResult, themeResult, sceneListResult, scenarioDraftResult,
    comparableResult, valuationResult, episodeDesignResult, masterReportResult,
    rewriteDiagResult, partialRewriteResult, fullRewriteResult,
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
    setTeamMembers(proj.teamMembers || []);
    setSceneAssignments(proj.sceneAssignments || {});
    setStageComments(proj.stageComments || {});
    setActivityLog(proj.activityLog || []);
    setRevisions(proj.revisions || []);
    setCurrentRevisionId(proj.currentRevisionId ?? null);
    setSceneRevisionMap(proj.sceneRevisionMap || {});
    setDialogueDevResult(proj.dialogueDevResult || null);
    setScriptCoverageResult(proj.scriptCoverageResult || null);
    setStructureResult(proj.structureResult || null);
    setThemeResult(proj.themeResult || null);
    setSceneListResult(proj.sceneListResult || "");
    setScenarioDraftResult(proj.scenarioDraftResult || "");
    setRewriteDiagResult(proj.rewriteDiagResult || null);
    setPartialRewriteResult(proj.partialRewriteResult || "");
    setFullRewriteResult(proj.fullRewriteResult || "");
    setComparableResult(proj.comparableResult || null);
    setValuationResult(proj.valuationResult || null);
    setEpisodeDesignResult(proj.episodeDesignResult || null);
    setMasterReportResult(proj.masterReportResult || null);
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
    setShowWelcome(false);
    if (!apiKey && !serverHasKey) setShowApiKeyModal(true);
  };

  const dismissFirstVisit = () => {
    localStorage.setItem("logline_visited", "1");
    setShowWelcome(false);
    if (!apiKey && !serverHasKey) setShowApiKeyModal(true);
  };

  // ── 데모 모드 활성화 ──
  const activateDemo = () => {
    localStorage.setItem("logline_visited", "1");
    setShowWelcome(false);
    setIsDemoMode(true);
    setLogline(DEMO_LOGLINE);
    setGenre(DEMO_GENRE);
    // Stage 1
    setResult(DEMO_RESULT);
    setEarlyCoverageResult(DEMO_EARLY_COVERAGE_RESULT);
    setInsightResult(DEMO_INSIGHT_RESULT);
    // Stage 2
    setExpertPanelResult(DEMO_EXPERT_PANEL_RESULT);
    setValueChargeResult(DEMO_VALUE_CHARGE_RESULT);
    setAcademicResult(DEMO_ACADEMIC_RESULT);
    setMythMapResult(DEMO_MYTH_MAP_RESULT);
    setBarthesCodeResult(DEMO_BARTHES_CODE_RESULT);
    setKoreanMythResult(DEMO_KOREAN_MYTH_RESULT);
    // Stage 3
    setCharDevResult(DEMO_CHAR_DEV_RESULT);
    setShadowResult(DEMO_SHADOW_RESULT);
    setAuthenticityResult(DEMO_AUTHENTICITY_RESULT);
    // Stage 4
    setSynopsisResults(DEMO_SYNOPSIS_RESULTS);
    setStructureResult(DEMO_STRUCTURE_RESULT);
    setThemeResult(DEMO_THEME_RESULT);
    setSubtextResult(DEMO_SUBTEXT_RESULT);
    setComparableResult(DEMO_COMPARABLE_RESULT);
    // Stage 5
    setTreatmentResult(DEMO_TREATMENT_RESULT);
    setBeatSheetResult(DEMO_BEAT_SHEET_RESULT);
    setDialogueDevResult(DEMO_DIALOGUE_DEV_RESULT);
    setSceneListResult(DEMO_SCENE_LIST_RESULT);
    // Stage 6
    setScenarioDraftResult(DEMO_SCENARIO_DRAFT_RESULT);
    // Stage 7
    setScriptCoverageResult(DEMO_SCRIPT_COVERAGE_RESULT);
    setValuationResult(DEMO_VALUATION_RESULT);
    // Stage 8
    setRewriteDiagResult(DEMO_REWRITE_DIAG_RESULT);
    setPartialRewriteResult(DEMO_PARTIAL_REWRITE_RESULT);
    setFullRewriteResult(DEMO_FULL_REWRITE_RESULT);
    setCurrentStage("dashboard");
    showToast("info", "데모 모드입니다. 8단계 전체 분석 결과를 자유롭게 둘러보세요.");
  };

  // ── 데모 모드 해제 ──
  const deactivateDemo = () => {
    setIsDemoMode(false);
    setLogline("");
    setGenre("auto");
    setResult(null);
    setCharDevResult(null);
    setShadowResult(null);
    setAuthenticityResult(null);
    setSynopsisResults(null);
    setTreatmentResult("");
    setBeatSheetResult(null);
    setScriptCoverageResult(null);
    setValuationResult(null);
    setStructureResult(null);
    setRewriteDiagResult(null);
    if (!apiKey && !serverHasKey) setShowApiKeyModal(true);
  };

  // ── 역방향 임포트 ──────────────────────────────────────────
  // type: "logline" | "synopsis" | "treatment" | "draft"
  // text: 붙여넣은 원본 텍스트
  // loglineText: AI 추출 로그라인 (없으면 빈 문자열)
  // genreId: 장르 id
  const onReverseImport = ({ type, text, loglineText, genreId }) => {
    const labels = { logline: "로그라인", synopsis: "시놉시스", treatment: "트리트먼트", draft: "시나리오 초고" };
    const stageMap = { logline: "1", synopsis: "4", treatment: "5", draft: "6" };

    if (loglineText) setLogline(loglineText);
    if (genreId && genreId !== "auto") setGenre(genreId);

    switch (type) {
      case "logline":
        setLogline(text.trim());
        setReverseEntryStage(null);
        advanceToStage("1");
        break;
      case "synopsis":
        // 최소 pipelineResult 구조로 감싸 Stage 4가 표시되도록
        setPipelineResult({
          synopsis: text.trim(),
          direction_title: "가져온 시놉시스",
          theme: "",
          genre_tone: genreId !== "auto" ? genreId : "",
          key_scenes: [],
          ending_type: "",
        });
        setReverseEntryStage("4"); // Stage 1~4 전제조건 우회
        advanceToStage("4");
        break;
      case "treatment":
        setTreatmentResult(text.trim());
        setReverseEntryStage("5"); // Stage 1~5 전제조건 우회
        advanceToStage("5");
        break;
      case "draft":
        setScenarioDraftResult(text.trim());
        setReverseEntryStage("6"); // Stage 1~6 전제조건 우회
        advanceToStage("6");
        break;
      default:
        advanceToStage(stageMap[type] || "1");
    }

    showToast("success", `${labels[type] || "텍스트"}를 가져왔습니다. Stage ${stageMap[type] || "1"}에서 시작합니다.`);
  };

  // ── 새 프로젝트 ──
  const startNewProject = () => {
    if (logline.trim()) {
      setConfirmModal({
        title: "새 프로젝트 시작",
        message: "현재 작업 내용이 초기화됩니다.\n진행하시겠습니까?",
        onConfirm: () => { setConfirmModal(null); _doStartNewProject(); },
      });
      return;
    }
    _doStartNewProject();
  };

  const _doStartNewProject = () => {
    setIsDemoMode(false);
    setLogline(""); setGenre("auto");
    setSelectedDuration("feature"); setCustomTheme(""); setCustomDurationText(""); setCustomFormatLabel("");
    setResult(null); setResult2(null); setEarlyCoverageResult(null); setInsightResult(null);
    setAcademicResult(null); setMythMapResult(null); setKoreanMythResult(null);
    setExpertPanelResult(null); setBarthesCodeResult(null);
    setShadowResult(null); setAuthenticityResult(null); setCharDevResult(null);
    setValueChargeResult(null); setSubtextResult(null);
    setSynopsisResults(null); setSelectedSynopsisIndex(null); setPipelineResult(null);
    setTreatmentResult(""); setBeatSheetResult(null); setBeatScenes({});
    setDialogueDevResult(null); setSceneListResult(""); setScenarioDraftResult("");
    setScriptCoverageResult(null); setStructureResult(null); setThemeResult(null);
    setComparableResult(null); setRewriteDiagResult(null);
    setPartialRewriteResult(""); setFullRewriteResult("");
    setValuationResult(null); setEpisodeDesignResult(null); setMasterReportResult(null);
    setWriterEdits({}); setTreatmentHistory([]); setBeatSheetHistory([]);
    setScenarioDraftHistory([]); setCharDevHistory([]); setPipelineHistory([]);
    setCurrentProjectId(null);
    setCurrentStage("1");
    showToast("success", "새 프로젝트가 시작되었습니다.");
  };

  // ── Logout ──
  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("hll_auth_token");
    setUser(null);
    setIsDemoMode(false);
  };

  // ── PDF 분석 리포트 내보내기 ──
  const handleExportPdf = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const safeLogline = logline.slice(0, 20).replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "");
      await exportToPdf({
        logline, genre, result, charDevResult, shadowResult, authenticityResult,
        synopsisResults, pipelineResult, structureResult, valueChargeResult,
        treatmentResult, beatSheetResult, scenarioDraftResult, rewriteDiagResult,
        scriptCoverageResult, valuationResult, darkMode,
      }, `hellologline-${safeLogline || "report"}`);
    } catch (e) {
      console.error("PDF 생성 실패:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── 공유 링크 생성 ──
  const handleShare = async () => {
    if (!logline.trim() || shareLinkLoading) return;
    setShareLinkLoading(true);
    try {
      const token = localStorage.getItem("hll_token");
      const res = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-auth-token": token } : {}),
        },
        body: JSON.stringify({ logline, genre, data: shareSnapshot }),
      });
      const json = await res.json();
      if (json.id) {
        const url = `${window.location.origin}/share/${json.id}`;
        await navigator.clipboard.writeText(url);
        showToast("success", "공유 링크가 클립보드에 복사되었습니다.");
      } else {
        showToast("error", "공유 링크 생성에 실패했습니다.");
      }
    } catch {
      showToast("error", "공유 링크 생성 중 오류가 발생했습니다.");
    } finally {
      setShareLinkLoading(false);
    }
  };

  // ── Application Document PDF Generator ──
  const openApplicationDoc = async (docType) => {
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
    const synopsisGenreTone = pipelineResult?.genre_tone || synopsisResults?.synopses?.[0]?.genre_tone || "";
    const synopsisEndingType = pipelineResult?.ending_type || synopsisResults?.synopses?.[0]?.ending_type || "";

    const protagonist = charDevResult?.protagonist;
    const supporting = charDevResult?.supporting_characters || [];

    // ── 시놉시스 PDF: A4 단일 페이지 전용 레이아웃 ──
    if (docType === "synopsis") {
      const qualBar = (label, score, max) => `
        <div style="display:flex;align-items:center;gap:8pt;margin-bottom:5pt;">
          <span style="font-size:7.5pt;color:#888;min-width:80pt;">${label}</span>
          <div style="flex:1;height:5pt;background:#eee;border-radius:3pt;overflow:hidden;">
            <div style="height:100%;width:${max ? Math.round(score/max*100) : 0}%;background:#1a1a2e;border-radius:3pt;"></div>
          </div>
          <span style="font-size:7.5pt;font-weight:700;min-width:30pt;text-align:right;">${score}/${max}</span>
        </div>`;

      // ── 분석 페이지용 헬퍼 ──
      const sBar = (label, score, max) =>
        `<div style="display:flex;align-items:center;gap:8pt;margin-bottom:4pt;"><span style="font-size:7.5pt;color:#777;min-width:100pt;">${label}</span><div style="flex:1;height:4pt;background:#eee;border-radius:2pt;overflow:hidden;"><div style="height:100%;width:${Math.round(((score)||0)/((max)||10)*100)}%;background:#1a1a2e;border-radius:2pt;"></div></div><span style="font-size:7.5pt;font-weight:700;min-width:28pt;text-align:right;">${score||0}/${max}</span></div>`;
      const sHead = (title, color) =>
        `<div style="font-size:7pt;font-weight:700;color:${color||'#1a1a2e'};text-transform:uppercase;letter-spacing:2px;border-bottom:1.5pt solid ${color||'#1a1a2e'};padding-bottom:4pt;margin-bottom:10pt;">${title}</div>`;
      const kv2 = (label, value) => value ? `<div style="margin-bottom:3pt;font-size:8.5pt;line-height:1.65;"><span style="color:#999;font-size:7.5pt;">${label}&nbsp;&nbsp;</span>${value}</div>` : '';
      const bul = (arr) => Array.isArray(arr) && arr.length ? `<ul style="padding-left:14pt;margin:3pt 0 0;">${arr.map(s => `<li style="font-size:8.5pt;color:#333;margin-bottom:2pt;line-height:1.55;">${s}</li>`).join('')}</ul>` : '';
      const box = (title, content) => content ? `<div style="border:1pt solid #e0e0e0;border-radius:4pt;padding:8pt 10pt;background:#fafafa;margin-bottom:8pt;page-break-inside:avoid;">${title ? `<div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:5pt;">${title}</div>` : ''}<div style="font-size:8.5pt;color:#333;line-height:1.7;">${content}</div></div>` : '';
      const flatKV = (obj, depth) => {
        const d = depth||0;
        if (!obj || typeof obj !== 'object') return String(obj||'');
        if (Array.isArray(obj)) return obj.slice(0,6).map(item => typeof item === 'object' ? flatKV(item,d+1) : `<div style="padding-left:6pt;margin-bottom:2pt;">\u2022 ${item}</div>`).join('');
        return Object.entries(obj).filter(([k,v]) => k!=='score'&&v!==null&&v!==undefined&&v!=='').slice(0,8).map(([k,v]) => {
          const lbl = k.replace(/_/g,' ');
          if (typeof v==='object'&&d<1) return `<div style="margin-bottom:4pt;"><span style="font-weight:700;color:#666;font-size:7.5pt;">${lbl}:</span><div style="padding-left:8pt;margin-top:2pt;">${flatKV(v,d+1)}</div></div>`;
          const sv = typeof v==='object' ? '' : String(v);
          return sv ? `<div style="margin-bottom:2pt;font-size:8.5pt;"><span style="color:#999;font-size:7.5pt;">${lbl}&nbsp;</span>${sv}</div>` : '';
        }).join('');
      };

      // ── 분석 섹션 빌드 ──
      let anaSections = '';

      // ① 빠른 상업성 체크
      if (earlyCoverageResult) {
        const ec = earlyCoverageResult;
        anaSections += sHead('빠른 상업성 체크', '#7c3aed');
        anaSections += `<div style="display:grid;grid-template-columns:80pt 1fr;gap:12pt;align-items:start;margin-bottom:8pt;"><div style="border:2pt solid #7c3aed;border-radius:6pt;padding:8pt;text-align:center;"><div style="font-size:24pt;font-weight:800;color:#7c3aed;line-height:1;">${ec.marketability_score||0}</div><div style="font-size:7pt;color:#999;margin-top:3pt;">/ 10</div></div><div>${ec.one_line_verdict ? `<div style="font-size:9pt;font-weight:700;color:#333;margin-bottom:6pt;line-height:1.5;">${ec.one_line_verdict}</div>` : ''}${kv2('최적 플랫폼',ec.best_platform)}${kv2('핵심 타겟',ec.target_audience)}${kv2('유사 히트작',ec.comparable_hit)}</div></div>`;
        anaSections += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8pt;">${ec.key_strengths?.length?box('강점',bul(ec.key_strengths)):''}${ec.key_risks?.length?box('위험 요소',bul(ec.key_risks)):''}</div>`;
        if (ec.development_priority) anaSections += box('지금 당장 보완할 것', `<span style="color:#7c3aed;font-weight:700;">${ec.development_priority}</span>`);
        anaSections += '<div style="margin-bottom:20pt;"></div>';
      }

      // ② 로그라인 상세 분석
      if (result) {
        const RL = { protagonist:"주인공 구체성", inciting_incident:"촉발 사건", goal:"목표 선명성", conflict:"갈등/장애물", stakes:"이해관계", irony:"아이러니/훅", mental_picture:"심상 유발력", emotional_hook:"감정적 공명", originality:"독창성", conciseness:"간결성", active_language:"능동적 언어", no_violations:"금기사항", genre_tone:"장르 톤", information_gap:"정보 격차", cognitive_dissonance:"인지적 부조화", narrative_transportation:"서사 몰입", universal_relatability:"보편적 공감", unpredictability:"예측 불가능성" };
        const rSec = (data, keys) => (data ? keys.map(k => data[k]?.score!=null ? sBar(RL[k]||k, data[k].score, 10) : '').join('') : '');
        anaSections += sHead('로그라인 분석', '#1a1a2e');
        anaSections += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14pt;margin-bottom:8pt;"><div><div style="font-size:7pt;font-weight:700;color:#888;margin-bottom:5pt;text-transform:uppercase;letter-spacing:1px;">구조 (${calcSectionTotal(result,'structure')}/50)</div>${rSec(result.structure,['protagonist','inciting_incident','goal','conflict','stakes'])}<div style="font-size:7pt;font-weight:700;color:#888;margin-top:9pt;margin-bottom:5pt;text-transform:uppercase;letter-spacing:1px;">기술 (${calcSectionTotal(result,'technical')}/40)</div>${rSec(result.technical,['conciseness','active_language','no_violations','genre_tone'])}</div><div><div style="font-size:7pt;font-weight:700;color:#888;margin-bottom:5pt;text-transform:uppercase;letter-spacing:1px;">표현 (${calcSectionTotal(result,'expression')}/40)</div>${rSec(result.expression,['irony','mental_picture','emotional_hook','originality'])}<div style="font-size:7pt;font-weight:700;color:#888;margin-top:9pt;margin-bottom:5pt;text-transform:uppercase;letter-spacing:1px;">흥미도 (${calcSectionTotal(result,'interest')}/50)</div>${rSec(result.interest,['information_gap','cognitive_dissonance','narrative_transportation','universal_relatability','unpredictability'])}</div></div>`;
        if (result.overall_feedback) anaSections += `<div style="font-size:8.5pt;color:#333;background:#f5f5f5;border-left:3pt solid #1a1a2e;padding:7pt 12pt;border-radius:2pt;line-height:1.7;margin-bottom:8pt;">${result.overall_feedback}</div>`;
        anaSections += '<div style="margin-bottom:20pt;"></div>';
      }

      // ③ 인물 분석
      if (charDevResult || shadowResult || authenticityResult) {
        anaSections += sHead('인물 분석', '#0f766e');
        if (charDevResult?.protagonist) {
          const p = charDevResult.protagonist;
          anaSections += box('주인공', (p.want?kv2('Want (외적 목표)',p.want):'')+(p.need?kv2('Need (내적 욕구)',p.need):'')+(p.arc_type?kv2('캐릭터 아크',p.arc_type):'')+(p.ghost?kv2('Ghost (상처)',p.ghost):'')+(p.egri_dimensions?`<div style="margin-top:6pt;"><div style="font-size:7pt;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:1px;margin-bottom:3pt;">Egri 3차원</div>${flatKV(p.egri_dimensions)}</div>`:''));
        }
        if (charDevResult?.supporting_characters?.length) {
          const rows = charDevResult.supporting_characters.slice(0,5).map(s=>`<div style="padding:5pt 0;border-bottom:1pt solid #eee;font-size:8.5pt;"><strong>${s.name||s.character_name||'—'}</strong>${s.role||s.function?` \u00b7 ${s.role||s.function}`:''}${s.relationship?` \u2014 ${s.relationship}`:''}</div>`).join('');
          anaSections += box('조연 인물', rows);
        }
        if (charDevResult?.moral_argument) anaSections += `<div style="margin-bottom:8pt;font-size:8.5pt;color:#444;background:#f0fdf4;border-left:3pt solid #0f766e;padding:7pt 12pt;border-radius:2pt;line-height:1.7;">${charDevResult.moral_argument}</div>`;
        if (shadowResult) anaSections += box('Jung 그림자 분석', flatKV(shadowResult.hero_archetype)+(shadowResult.shadow?`<div style="margin-top:5pt;font-size:7.5pt;color:#999;text-transform:uppercase;margin-bottom:3pt;">그림자</div>${flatKV(shadowResult.shadow)}`:'')+(shadowResult.jung_verdict?`<div style="margin-top:7pt;padding-top:5pt;border-top:1pt solid #eee;font-style:italic;color:#555;font-size:8.5pt;">${shadowResult.jung_verdict}</div>`:''));
        if (authenticityResult) anaSections += box('진정성 분석 (실존주의)', sBar('진정성 지수',authenticityResult.authenticity_score,10)+(authenticityResult.authenticity_label?`<div style="margin:4pt 0;font-weight:700;font-size:9pt;">${authenticityResult.authenticity_label}</div>`:'')+( authenticityResult.existential_verdict?`<div style="font-size:8.5pt;color:#444;margin-top:4pt;">${authenticityResult.existential_verdict}</div>`:''));
        anaSections += '<div style="margin-bottom:20pt;"></div>';
      }

      // ④ 개념·이론 분석
      if (academicResult || mythMapResult || barthesCodeResult || koreanMythResult || valueChargeResult) {
        anaSections += sHead('개념 \u00b7 이론 분석', '#9a3412');
        if (academicResult) {
          const ia = academicResult.integrated_assessment;
          anaSections += box('학문적 분석 (아리스토텔레스 외)', flatKV(academicResult.aristotle)+(ia?.dominant_theory_fit?kv2('지배 이론',ia.dominant_theory_fit):'')+(ia?.theoretical_verdict?`<div style="margin-top:6pt;padding-top:5pt;border-top:1pt solid #eee;font-style:italic;color:#555;">${ia.theoretical_verdict}</div>`:''));
        }
        if (mythMapResult) anaSections += box('신화 지도 (Campbell 영웅 여정)', kv2('현재 단계',mythMapResult.primary_stage)+(mythMapResult.journey_phases?`<div style="margin-top:5pt;">${flatKV(mythMapResult.journey_phases)}</div>`:'')+( mythMapResult.campbell_verdict?`<div style="margin-top:7pt;font-style:italic;color:#555;border-top:1pt solid #eee;padding-top:5pt;">${mythMapResult.campbell_verdict}</div>`:''));
        if (barthesCodeResult) {
          const bc = barthesCodeResult;
          anaSections += box('바르트 서사 코드', sBar('해석 코드 (Hermeneutic)',bc.hermeneutic_code?.score,10)+sBar('행동 코드 (Proairetic)',bc.proairetic_code?.score,10)+sBar('의미 코드 (Semic)',bc.semic_code?.score,10)+sBar('상징 코드 (Symbolic)',bc.symbolic_code?.score,10)+sBar('문화 코드 (Cultural)',bc.cultural_code?.score,10)+kv2('지배 코드',bc.dominant_code)+(bc.barthes_verdict?`<div style="margin-top:6pt;font-style:italic;color:#555;border-top:1pt solid #eee;padding-top:5pt;">${bc.barthes_verdict}</div>`:''));
        }
        if (koreanMythResult) {
          const km = koreanMythResult;
          anaSections += box('한국 정서 분석', sBar('한(\u6068) 공명도',km.han_resonance?.score,10)+sBar('정(\u60c5) 공명도',km.jeong_resonance?.score,10)+sBar('신명(\u795e\u660e) 요소',km.sinmyeong_element?.score,10)+(km.korean_myth_verdict?`<div style="margin-top:6pt;font-style:italic;color:#555;border-top:1pt solid #eee;padding-top:5pt;">${km.korean_myth_verdict}</div>`:''));
        }
        if (valueChargeResult) {
          const vc = valueChargeResult;
          anaSections += box('McKee 가치 충전', flatKV(vc.primary_charge)+(vc.charge_intensity?.score!=null?sBar('충전 강도',vc.charge_intensity.score,10):'')+(vc.mckee_verdict?`<div style="margin-top:6pt;font-style:italic;color:#555;border-top:1pt solid #eee;padding-top:5pt;">${vc.mckee_verdict}</div>`:''));
        }
        anaSections += '<div style="margin-bottom:20pt;"></div>';
      }

      // ⑤ 전문가 패널
      if (expertPanelResult) {
        const ep = expertPanelResult;
        anaSections += sHead(`전문가 패널${ep.panel_title?' \u2014 '+ep.panel_title:''}`, '#1d4ed8');
        if (ep.round1?.length) {
          ep.round1.slice(0,4).forEach(ex => {
            const nm = ex.expert||ex.name||ex.role||ex.title||'전문가';
            const op = ex.opinion||ex.analysis||ex.comment||ex.feedback||flatKV(ex);
            anaSections += box(nm, `<div style="font-size:8.5pt;color:#333;line-height:1.7;">${op}</div>`);
          });
        }
        if (ep.synthesis?.consensus||ep.synthesis?.strongest_element) {
          anaSections += `<div style="background:#eff6ff;border-left:3pt solid #1d4ed8;padding:8pt 12pt;border-radius:2pt;margin-bottom:8pt;">${ep.synthesis.strongest_element?`<div style="font-size:7.5pt;font-weight:700;color:#1d4ed8;margin-bottom:3pt;">최강 요소</div><div style="font-size:8.5pt;margin-bottom:7pt;line-height:1.6;">${ep.synthesis.strongest_element}</div>`:''} ${ep.synthesis.consensus?`<div style="font-size:7.5pt;font-weight:700;color:#1d4ed8;margin-bottom:3pt;">종합 의견</div><div style="font-size:8.5pt;line-height:1.6;">${ep.synthesis.consensus}</div>`:''}</div>`;
        }
        anaSections += '<div style="margin-bottom:20pt;"></div>';
      }

      // ⑥ 구조·테마·서브텍스트
      if (structureResult || themeResult || subtextResult) {
        anaSections += sHead('구조 \u00b7 테마 \u00b7 서브텍스트', '#065f46');
        if (structureResult) {
          const sr = structureResult;
          const actsH = sr.acts?.length ? sr.acts.slice(0,4).map(a=>`<div style="margin-bottom:6pt;padding-bottom:5pt;border-bottom:1pt solid #e5e5e5;"><span style="font-weight:700;color:#065f46;font-size:8pt;">${a.act||a.name||a.act_name||''}</span>${(a.description||a.content||a.summary)?`<div style="font-size:8pt;color:#444;margin-top:2pt;line-height:1.55;">${a.description||a.content||a.summary}</div>`:''}</div>`).join('') : '';
          const ppH = sr.plot_points?.length ? bul(sr.plot_points.slice(0,5).map(p=>p.name||p.description||String(p))) : '';
          anaSections += box(`구조 분석 \u2014 ${sr.structure_type||''}`, actsH+ppH);
        }
        if (themeResult) {
          const tr = themeResult;
          anaSections += box('테마 분석', kv2('컨트롤링 아이디어',tr.controlling_idea)+(tr.moral_premise?.statement?kv2('도덕적 전제',tr.moral_premise.statement):flatKV(tr.moral_premise||{}))+kv2('테마 질문',tr.thematic_question)+(tr.protagonist_inner_journey?`<div style="margin-top:6pt;"><div style="font-size:7pt;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:1px;margin-bottom:3pt;">주인공 내면 여정</div>${flatKV(tr.protagonist_inner_journey)}</div>`:''));
        }
        if (subtextResult) {
          const st = subtextResult;
          anaSections += box('서브텍스트 (체호프)', sBar('서브텍스트 지수',st.subtext_score,10)+kv2('표면 이야기',st.surface_story)+kv2('이면 이야기',st.deeper_story)+(st.chekhov_verdict?`<div style="margin-top:6pt;font-style:italic;color:#444;border-top:1pt solid #eee;padding-top:5pt;">${st.chekhov_verdict}</div>`:''));
        }
        anaSections += '<div style="margin-bottom:20pt;"></div>';
      }

      // ⑦ 유사 작품 비교
      if (comparableResult?.comparable_works?.length) {
        const cr = comparableResult;
        anaSections += sHead('유사 작품 비교', '#831843');
        anaSections += `<table style="width:100%;border-collapse:collapse;font-size:8pt;margin-bottom:8pt;"><thead><tr style="background:#fdf2f8;"><th style="text-align:left;padding:5pt 7pt;border-bottom:1.5pt solid #d1d5db;font-size:7.5pt;color:#555;">작품</th><th style="text-align:center;padding:5pt 7pt;border-bottom:1.5pt solid #d1d5db;font-size:7.5pt;color:#555;white-space:nowrap;">유사도</th><th style="text-align:left;padding:5pt 7pt;border-bottom:1.5pt solid #d1d5db;font-size:7.5pt;color:#555;">유사 이유</th><th style="text-align:left;padding:5pt 7pt;border-bottom:1.5pt solid #d1d5db;font-size:7.5pt;color:#555;">배울 점</th></tr></thead><tbody>${cr.comparable_works.slice(0,6).map((w,i)=>`<tr style="background:${i%2===0?'#fff':'#fafafa'};"><td style="padding:5pt 7pt;border-bottom:1pt solid #f0f0f0;font-weight:700;">${w.title||''}${w.year?` (${w.year})`:''}</td><td style="padding:5pt 7pt;border-bottom:1pt solid #f0f0f0;text-align:center;color:#831843;font-weight:700;">${w.similarity_score||0}/10</td><td style="padding:5pt 7pt;border-bottom:1pt solid #f0f0f0;color:#444;line-height:1.5;">${w.why_comparable||''}</td><td style="padding:5pt 7pt;border-bottom:1pt solid #f0f0f0;color:#444;line-height:1.5;">${w.what_to_learn||''}</td></tr>`).join('')}</tbody></table>`;
        if (cr.market_positioning) anaSections += kv2('시장 포지셔닝', String(cr.market_positioning));
        if (cr.tone_reference) anaSections += kv2('톤 레퍼런스', String(cr.tone_reference));
        anaSections += '<div style="margin-bottom:20pt;"></div>';
      }

      const synHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>시놉시스 — ${logline.slice(0,20) || "문서"}</title>
<style>
  @page { size: A4 portrait; margin: 14mm 16mm 14mm 16mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: "Malgun Gothic","AppleGothic","NanumGothic",sans-serif;
    font-size: 9.5pt;
    color: #1a1a2e;
    background: #fff;
    line-height: 1.75;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10pt;
  }
  /* 헤더 */
  .header {
    border-bottom: 2.5pt solid #1a1a2e;
    padding-bottom: 8pt;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header-left .doc-label {
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 2.5px;
    color: #999;
    text-transform: uppercase;
    margin-bottom: 3pt;
  }
  .header-left .logline-text {
    font-size: 11pt;
    font-weight: 800;
    line-height: 1.4;
    max-width: 390pt;
    word-break: keep-all;
  }
  .header-right {
    text-align: right;
    font-size: 7.5pt;
    color: #888;
    line-height: 1.8;
    flex-shrink: 0;
    padding-left: 12pt;
  }
  /* 메타 배지 행 */
  .meta-row {
    display: flex;
    gap: 8pt;
    flex-wrap: wrap;
    align-items: center;
  }
  .badge {
    font-size: 7.5pt;
    font-weight: 700;
    padding: 2pt 8pt;
    border-radius: 10pt;
    border: 1pt solid #ddd;
    color: #555;
    background: #f7f7f7;
    white-space: nowrap;
  }
  .badge.direction { border-color: #c8a84b; color: #9a7a20; background: #fdf8ee; }
  .badge.genre-tone { border-color: #bbb; }
  /* 시놉시스 본문 */
  .synopsis-block {
    border-left: 3pt solid #1a1a2e;
    padding-left: 12pt;
  }
  .synopsis-body {
    font-size: 9.5pt;
    line-height: 1.85;
    color: #222;
    word-break: keep-all;
    text-align: justify;
  }
  /* 핵심 장면 */
  .scenes-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7pt;
  }
  .scene-card {
    border: 1pt solid #e0e0e0;
    border-radius: 4pt;
    padding: 7pt 9pt;
    background: #fafafa;
  }
  .scene-num {
    font-size: 7pt;
    font-weight: 800;
    color: #999;
    margin-bottom: 3pt;
    font-family: "Courier New", monospace;
  }
  .scene-text { font-size: 8pt; color: #444; line-height: 1.6; }
  /* 하단 2단 */
  .bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10pt;
  }
  .info-box {
    border: 1pt solid #e0e0e0;
    border-radius: 4pt;
    padding: 8pt 10pt;
  }
  .info-box-title {
    font-size: 7pt;
    font-weight: 700;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5pt;
  }
  .info-box-body { font-size: 8.5pt; color: #333; line-height: 1.7; }
  /* 주제 */
  .theme-bar {
    background: #f5f5f5;
    border-radius: 4pt;
    padding: 7pt 12pt;
    font-size: 8.5pt;
    color: #444;
    border-left: 3pt solid #c8a84b;
    word-break: keep-all;
  }
  /* 푸터 */
  .footer {
    border-top: 1pt solid #e0e0e0;
    padding-top: 6pt;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: #bbb;
    font-family: "Courier New", monospace;
  }
  h3 { font-size: 8pt; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6pt; }
</style>
</head>
<body>
<div class="page">

  <!-- 헤더 -->
  <div class="header">
    <div class="header-left">
      <div class="doc-label">시놉시스 문서 &nbsp;·&nbsp; Hello Logline</div>
      <div class="logline-text">${logline || "—"}</div>
    </div>
    <div class="header-right">
      <div><strong>장르</strong> ${genreLabel}</div>
      <div><strong>포맷</strong> ${durLabel}</div>
      <div>${today}</div>
    </div>
  </div>

  <!-- 메타 배지 -->
  <div class="meta-row">
    ${synopsisTitle ? `<span class="badge direction">${synopsisTitle}</span>` : ""}
    ${synopsisGenreTone ? `<span class="badge genre-tone">${synopsisGenreTone}</span>` : ""}
    ${synopsisEndingType ? `<span class="badge">${synopsisEndingType}</span>` : ""}
    ${qualScore != null ? `<span class="badge">품질 ${qualScore}/100</span>` : ""}
    ${intScore != null ? `<span class="badge">흥미 ${intScore}/100</span>` : ""}
  </div>

  <!-- 시놉시스 본문 -->
  ${synopsisText ? `
  <div class="synopsis-block">
    <h3>시놉시스</h3>
    <div class="synopsis-body">${synopsisText.replace(/\n\n/g, "</p><p style='margin-top:7pt;'>").replace(/\n/g, "<br>")}</div>
  </div>` : ""}

  <!-- 핵심 장면 -->
  ${keyScenes.length > 0 ? `
  <div>
    <h3>핵심 장면</h3>
    <div class="scenes-grid">
      ${keyScenes.slice(0,3).map((s, i) => `
        <div class="scene-card">
          <div class="scene-num">SCENE ${i + 1}</div>
          <div class="scene-text">${s}</div>
        </div>`).join("")}
    </div>
  </div>` : ""}

  <!-- 주제 -->
  ${synopsisTheme ? `
  <div class="theme-bar">
    <strong>주제&nbsp;&nbsp;</strong>${synopsisTheme}
  </div>` : ""}

  <!-- 점수 + 캐릭터 (2단) -->
  ${(qualScore != null || protagonist) ? `
  <div class="bottom-row">
    ${qualScore != null ? `
    <div class="info-box">
      <div class="info-box-title">로그라인 분석 점수</div>
      <div class="info-box-body">
        ${qualBar("품질 점수", qualScore, 100, "#1a1a2e")}
        ${qualBar("흥미 유발 지수", intScore, 100, "#1a1a2e")}
      </div>
    </div>` : "<div></div>"}
    ${protagonist ? `
    <div class="info-box">
      <div class="info-box-title">주인공</div>
      <div class="info-box-body">
        <strong>${protagonist.name_suggestion || protagonist.name || "—"}</strong>${protagonist.egri?.sociology || protagonist.role ? ` · ${protagonist.egri?.sociology || ""}` : ""}<br>
        ${protagonist.want ? `Want: ${protagonist.want}<br>` : ""}
        ${protagonist.need ? `Need: ${protagonist.need}` : ""}
      </div>
    </div>` : "<div></div>"}
  </div>` : ""}

  <!-- 푸터 -->
  <div class="footer">
    <span>HelloLogline × Claude AI — 시놉시스 문서</span>
    <span>${today}</span>
  </div>

</div>
</body>
</html>`;

      // 분석 섹션을 시놉시스 HTML에 삽입
      const anaBlock = anaSections
        ? `<div style="padding-top:10pt;">${anaSections}<div style="border-top:1pt solid #e0e0e0;padding-top:6pt;display:flex;justify-content:space-between;font-size:7pt;color:#bbb;font-family:'Courier New',monospace;margin-top:4pt;"><span>HelloLogline \u00d7 Claude AI \u2014 시놉시스 기획서</span><span>${today}</span></div></div>`
        : '';
      const fullHtml = anaBlock
        ? synHtml.replace('</body>', `${anaBlock}</body>`)
        : synHtml;
      const synTitle = anaBlock ? "시놉시스 기획서" : "시놉시스";
      await downloadHtmlAsPdf(fullHtml, synTitle, [14, 16, 14, 16]);
      return;
    }


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
      const LABELS = {
        protagonist: "주인공 구체성", inciting_incident: "촉발 사건",
        goal: "목표 선명성", conflict: "갈등/장애물", stakes: "이해관계(Stakes)",
        irony: "아이러니/훅", mental_picture: "심상 유발력",
        emotional_hook: "감정적 공명", originality: "독창성",
        conciseness: "간결성", active_language: "능동적 언어",
        no_violations: "금기사항", genre_tone: "장르 톤",
        information_gap: "정보 격차", cognitive_dissonance: "인지적 부조화",
        narrative_transportation: "서사 몰입", universal_relatability: "보편적 공감",
        unpredictability: "예측 불가능성",
      };

      const detailBlock = (key, val) => `
        <div class="detail-item">
          <div class="detail-header">
            <span class="detail-label">${LABELS[key] || key}</span>
            <span class="detail-score">${val.score ?? "-"}/${val.max ?? "-"}</span>
          </div>
          <div class="detail-track"><div class="detail-fill" style="width:${val.max ? Math.round((val.score / val.max) * 100) : 0}%"></div></div>
          ${val.found ? `<div class="detail-found">감지: &ldquo;${val.found}&rdquo;</div>` : ""}
          ${val.feedback ? `<div class="detail-feedback">${val.feedback}</div>` : ""}
        </div>`;

      const structureTotal = Object.values(result.structure || {}).reduce((s, v) => s + (v?.score || 0), 0);
      const expressionTotal = Object.values(result.expression || {}).reduce((s, v) => s + (v?.score || 0), 0);
      const technicalTotal = Object.values(result.technical || {}).reduce((s, v) => s + (v?.score || 0), 0);
      const interestTotal = Object.values(result.interest || {}).reduce((s, v) => s + (v?.score || 0), 0);

      body += `
      <section class="allow-break">
        <h2>종합 점수</h2>
        <div class="section-body">
          ${scoreBar("품질 점수 (구조+표현+기술)", qualScore, 100)}
          ${scoreBar("흥미 유발 지수", intScore, 100)}
          ${result.detected_genre ? `<p style="margin-top:8pt;font-size:9.5pt;color:#555;">감지된 장르: <strong>${result.detected_genre}</strong></p>` : ""}
        </div>
      </section>`;

      if (result.structure) {
        body += `
      <section class="allow-break">
        <h2>A. 구조적 완성도 &nbsp;<span style="font-weight:400;font-size:10pt;color:#666;">${structureTotal}/50</span></h2>
        <div class="section-body detail-section">
          ${Object.entries(result.structure).map(([k, v]) => detailBlock(k, v)).join("")}
        </div>
      </section>`;
      }

      if (result.expression) {
        body += `
      <section class="allow-break">
        <h2>B. 표현적 매력도 &nbsp;<span style="font-weight:400;font-size:10pt;color:#666;">${expressionTotal}/30</span></h2>
        <div class="section-body detail-section">
          ${Object.entries(result.expression).map(([k, v]) => detailBlock(k, v)).join("")}
        </div>
      </section>`;
      }

      if (result.technical) {
        body += `
      <section class="allow-break">
        <h2>C. 기술적 완성도 &nbsp;<span style="font-weight:400;font-size:10pt;color:#666;">${technicalTotal}/20</span></h2>
        <div class="section-body detail-section">
          ${Object.entries(result.technical).map(([k, v]) => detailBlock(k, v)).join("")}
        </div>
      </section>`;
      }

      if (result.interest) {
        body += `
      <section class="allow-break">
        <h2>D. 흥미 유발 지수 &nbsp;<span style="font-weight:400;font-size:10pt;color:#666;">${interestTotal}/100</span></h2>
        <div class="section-body detail-section">
          ${Object.entries(result.interest).map(([k, v]) => detailBlock(k, v)).join("")}
        </div>
      </section>`;
      }

      body += `
      <section class="allow-break">
        <h2>개선 방향</h2>
        <div class="section-body">
          ${result.overall_feedback ? `<p class="feedback">${result.overall_feedback}</p>` : ""}
          ${result.improvement_questions?.length > 0 ? `
            <h3 style="margin-top:14pt;">스스로 점검해볼 질문</h3>
            <ol class="improvement-list">
              ${result.improvement_questions.map(q => `<li>${q}</li>`).join("")}
            </ol>` : ""}
          ${themeResult?.controlling_idea ? `<p style="margin-top:10pt;"><strong>테마:</strong> ${themeResult.controlling_idea}</p>` : ""}
        </div>
      </section>
      ${storyFixes.length > 0 ? `
      <section class="allow-break">
        <h2>🔧 약점 집중 수정안</h2>
        <div class="section-body">
          ${storyFixes.map((fix, i) => `
            <div class="improve-card" style="border-left-color:#F87171;">
              <div class="improve-card-title" style="color:#c0392b;">${i + 1}. ${fix.weakness || ""}</div>
              ${fix.score_issue ? `<div class="improve-card-sub">${fix.score_issue}</div>` : ""}
              <div class="improve-card-logline">&ldquo;${fix.fixed_logline || ""}&rdquo;</div>
              ${fix.key_change ? `<div class="improve-card-why">→ ${fix.key_change}</div>` : ""}
            </div>`).join("")}
        </div>
      </section>` : ""}
      ${storyPivots.length > 0 ? `
      <section class="allow-break">
        <h2>🔀 방향 전환안</h2>
        <div class="section-body">
          ${storyPivots.map((pivot, i) => `
            <div class="improve-card" style="border-left-color:#8B5CF6;">
              <div class="improve-card-title" style="color:#6d28d9;">${i + 1}. ${pivot.label || ""}</div>
              <div class="improve-card-logline">&ldquo;${pivot.pivot_logline || ""}&rdquo;</div>
              ${pivot.why_interesting ? `<div class="improve-card-why">${pivot.why_interesting}</div>` : ""}
            </div>`).join("")}
        </div>
      </section>` : ""}
      ${aiImprovement ? `
      <section class="allow-break">
        <h2>✨ AI 개선안</h2>
        <div class="section-body">
          <div class="improve-card" style="border-left-color:#45B7D1;">
            <div class="improve-card-logline">&ldquo;${aiImprovement.improved || ""}&rdquo;</div>
            ${aiImprovement.why ? `<div class="improve-card-why">${aiImprovement.why}</div>` : ""}
            ${(aiImprovement.changes || []).length > 0 ? `
              <ul class="improvement-list" style="margin-top:8pt;">
                ${aiImprovement.changes.map(c => `<li>${c}</li>`).join("")}
              </ul>` : ""}
          </div>
        </div>
      </section>` : ""}`;
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

    // 7-1. 비트 시트 (treatment+)
    if ((docType === "treatment" || docType === "final") && beatSheetResult?.beats?.length) {
      const bs = beatSheetResult;
      const beatsHtml = `
        ${bs.format_name || bs.total_pages ? `<p style="margin-bottom:10pt;"><strong>포맷:</strong> ${bs.format_name || ""}${bs.total_pages ? ` · 총 ${bs.total_pages}페이지` : ""}</p>` : ""}
        <table>
          <thead><tr><th style="width:28pt;text-align:center;">#</th><th style="width:120pt;">비트 이름</th><th>내용 요약</th></tr></thead>
          <tbody>
            ${bs.beats.map((b, i) => `
              <tr>
                <td style="text-align:center;color:#888;font-size:9pt;">${b.id || (i + 1)}</td>
                <td><strong>${b.name_kr || "—"}</strong></td>
                <td>${b.summary || ""}</td>
              </tr>`).join("")}
          </tbody>
        </table>`;
      body += sec("비트 시트", beatsHtml);
    }

    // 7-2. 대사 디벨롭 (treatment+)
    if ((docType === "treatment" || docType === "final") && dialogueDevResult) {
      const dd = dialogueDevResult;
      let ddHtml = "";
      if (dd.character_voices?.length) {
        ddHtml += `<h3>캐릭터 목소리 설계</h3>`;
        dd.character_voices.slice(0, 5).forEach(v => {
          const name = v.name || v.character || v.character_name || "—";
          const style = v.voice_style || v.speaking_style || v.style || "";
          const traits = v.linguistic_traits || v.traits || "";
          const sample = v.sample_line || v.sample || v.example_line || v.example || "";
          ddHtml += `<div class="character-block secondary">
            <h3>${name}</h3>
            ${style ? `<p><strong>말투:</strong> ${style}</p>` : ""}
            ${traits ? `<p><strong>언어적 특징:</strong> ${traits}</p>` : ""}
            ${sample ? `<p><em style="color:#555;">&ldquo;${sample}&rdquo;</em></p>` : ""}
          </div>`;
        });
      }
      if (dd.subtext_techniques?.length) {
        const techItems = dd.subtext_techniques.slice(0, 4).map(t => {
          const name = t.technique || t.name || t.title || "";
          const desc = t.description || t.explanation || t.example || "";
          return `<li><strong>${name}</strong>${desc ? `: ${desc}` : ""}</li>`;
        }).join("");
        ddHtml += `<h3 style="margin-top:12pt;">서브텍스트 기법</h3><ul>${techItems}</ul>`;
      }
      if (dd.key_scene_dialogue) {
        const ks = dd.key_scene_dialogue;
        const sceneName = ks.scene || ks.scene_name || ks.title || "";
        const lines = ks.dialogue || ks.lines || ks.exchange || "";
        if (sceneName || lines) {
          ddHtml += `<h3 style="margin-top:12pt;">핵심 장면 대사</h3>`;
          if (sceneName) ddHtml += `<p><strong>장면:</strong> ${sceneName}</p>`;
          if (typeof lines === "string" && lines) {
            ddHtml += `<div class="treatment-text" style="margin-top:6pt;">${lines.replace(/\n/g, "<br>")}</div>`;
          } else if (Array.isArray(lines) && lines.length) {
            ddHtml += `<div class="treatment-text" style="margin-top:6pt;">${lines.map(l => `<p>${typeof l === "object" ? (l.line || l.text || "") : l}</p>`).join("")}</div>`;
          }
        }
      }
      if (ddHtml) body += sec("대사 디벨롭", ddHtml);
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

  .detail-section { display: flex; flex-direction: column; gap: 10pt; }
  .detail-item { border: 1pt solid #e8e8ee; border-radius: 4pt; padding: 9pt 12pt; page-break-inside: avoid; }
  .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5pt; }
  .detail-label { font-size: 9.5pt; font-weight: 700; color: #1a1a2e; }
  .detail-score { font-size: 9pt; font-weight: 700; color: #555; font-family: "Courier New", monospace; }
  .detail-track { height: 5pt; background: #eee; border-radius: 3pt; overflow: hidden; margin-bottom: 6pt; }
  .detail-fill { height: 100%; background: #1a1a2e; border-radius: 3pt; }
  .detail-found { font-size: 8.5pt; color: #888; background: #f5f5f5; border-radius: 3pt; padding: 3pt 8pt; margin-bottom: 4pt; font-style: italic; }
  .detail-feedback { font-size: 9pt; color: #444; line-height: 1.7; }
  .improvement-list { padding-left: 18pt; }
  .improvement-list li { font-size: 9.5pt; color: #444; margin-bottom: 6pt; line-height: 1.75; }
  .improve-card { border-left: 3pt solid #ccc; padding: 10pt 14pt; margin-bottom: 10pt; background: #fafafa; border-radius: 0 4pt 4pt 0; page-break-inside: avoid; }
  .improve-card-title { font-size: 9.5pt; font-weight: 700; margin-bottom: 4pt; }
  .improve-card-sub { font-size: 8.5pt; color: #777; margin-bottom: 6pt; line-height: 1.6; }
  .improve-card-logline { font-size: 11pt; font-weight: 600; color: #1a1a2e; line-height: 1.7; margin-bottom: 6pt; }
  .improve-card-why { font-size: 9pt; color: #555; line-height: 1.65; }

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
</body>
</html>`;

    await downloadHtmlAsPdf(html, docMeta.title, [20, 20, 20, 25]);
  };

  // ── 피치 덱 생성 (10슬라이드) ──────────────────────────────────
  const openPitchDeck = () => {
    const genreLabel = genre === "auto" ? (result?.detected_genre || "미정") : GENRES.find(g => g.id === genre)?.label || "미정";
    const today = new Date().toLocaleDateString("ko-KR");
    const qualScore = result ? (calcSectionTotal(result,"structure") + calcSectionTotal(result,"expression") + calcSectionTotal(result,"technical")) : null;
    const synopsis = pipelineResult?.synopsis || synopsisResults?.synopses?.[0]?.synopsis || "";
    const synopsisTitle = pipelineResult?.direction_title || synopsisResults?.synopses?.[0]?.direction_title || "";
    const theme = pipelineResult?.theme || synopsisResults?.synopses?.[0]?.theme || "";
    const hook = pipelineResult?.hook || synopsisResults?.synopses?.[0]?.hook || "";
    const protagonist = charDevResult?.protagonist;
    const supporting = charDevResult?.supporting_characters || [];
    const coverage = scriptCoverageResult;

    const slide = (num, title, bg, content) => `
      <section class="slide" style="background:${bg};">
        <div class="slide-num">${num}/10</div>
        <div class="slide-title">${title}</div>
        <div class="slide-body">${content}</div>
      </section>`;

    const slides = [
      // 1. Title
      slide(1, "TITLE", "linear-gradient(135deg,#0f0f1a,#1a1a2e)", `
        <div style="text-align:center;padding-top:40px;">
          <div style="font-size:11px;letter-spacing:4px;color:#C8A84B;text-transform:uppercase;margin-bottom:16px;">${genreLabel} / ${getDurText()}</div>
          <div style="font-size:36px;font-weight:900;color:#fff;line-height:1.25;max-width:700px;margin:0 auto;">${logline || "로그라인을 입력하세요"}</div>
          <div style="margin-top:40px;font-size:12px;color:rgba(255,255,255,0.35);">${today}</div>
        </div>`),

      // 2. The Concept
      slide(2, "THE CONCEPT", "#0d1117", `
        ${qualScore ? `<div style="display:flex;gap:20px;justify-content:center;margin-bottom:28px;">${[["로그라인 품질",`${qualScore}/100`,"#C8A84B"],["장르",genreLabel,"#45B7D1"],["포맷",getDurText(),"#4ECCA3"]].map(([l,v,c])=>`<div style="text-align:center;padding:16px 24px;border:1px solid ${c}30;border-radius:10px;"><div style="font-size:22px;font-weight:800;color:${c};">${v}</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">${l}</div></div>`).join("")}</div>` : ""}
        ${hook ? `<blockquote style="font-size:18px;color:#fff;border-left:3px solid #C8A84B;padding:12px 20px;margin:0;line-height:1.6;">${hook}</blockquote>` : ""}`),

      // 3. The Story
      slide(3, "THE STORY", "#0d1117", `
        ${synopsisTitle ? `<div style="font-size:11px;letter-spacing:3px;color:#4ECCA3;text-transform:uppercase;margin-bottom:12px;">${synopsisTitle}</div>` : ""}
        <div style="font-size:14px;color:rgba(255,255,255,0.8);line-height:1.8;max-height:280px;overflow:hidden;">${synopsis ? synopsis.slice(0,600)+(synopsis.length>600?"…":"") : "시놉시스를 Stage 4에서 생성하세요."}</div>`),

      // 4. Protagonist
      slide(4, "PROTAGONIST", "#0d1117", `
        ${protagonist ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            ${[["Want (외적 목표)", protagonist.want],["Need (내적 욕구)", protagonist.need],["캐릭터 아크", protagonist.arc_type],["Ghost (상처)", protagonist.ghost]].filter(([,v])=>v).map(([l,v])=>`<div style="padding:14px 16px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;"><div style="font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">${l}</div><div style="font-size:13px;color:#fff;line-height:1.6;">${v}</div></div>`).join("")}
          </div>` : "<div style='color:rgba(255,255,255,0.4);'>Stage 3에서 캐릭터를 설계하세요.</div>"}`),

      // 5. Supporting Cast
      slide(5, "ENSEMBLE CAST", "#0d1117", `
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${supporting.slice(0,4).map(s=>`<div style="display:flex;align-items:center;gap:14px;padding:10px 14px;border:1px solid rgba(255,255,255,0.07);border-radius:8px;"><div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:16px;">👤</div><div><div style="font-size:13px;font-weight:700;color:#fff;">${s.name||s.character_name||"—"}</div><div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px;">${s.role||s.function||""} ${s.relationship?"· "+s.relationship:""}</div></div></div>`).join("")}
          ${supporting.length === 0 ? "<div style='color:rgba(255,255,255,0.4);'>Stage 3에서 캐릭터를 설계하세요.</div>" : ""}
        </div>`),

      // 6. Theme & Tone
      slide(6, "THEME & TONE", "#0d1117", `
        ${theme ? `<blockquote style="font-size:20px;color:#C8A84B;font-weight:700;border-left:3px solid #C8A84B;padding:12px 20px;margin:0 0 20px;line-height:1.5;">"${theme}"</blockquote>` : ""}
        ${result?.overall_feedback ? `<div style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.8;max-height:160px;overflow:hidden;">${result.overall_feedback.slice(0,400)}</div>` : ""}`),

      // 7. Market Position
      slide(7, "MARKET POSITION", "#0d1117", `
        ${comparableResult ? `
          <div style="margin-bottom:16px;">
            <div style="font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:10px;">비교 작품</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">${(comparableResult.comparable_works||[]).slice(0,4).map(w=>`<div style="padding:8px 14px;border:1px solid rgba(255,255,255,0.1);border-radius:20px;font-size:12px;color:rgba(255,255,255,0.7);">${typeof w==="string"?w:(w.title||"")}</div>`).join("")}</div>
          </div>` : ""}
        ${valuationResult ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${valuationResult.platform_fit ? `<div style="padding:12px;border:1px solid rgba(96,165,250,0.2);border-radius:8px;"><div style="font-size:9px;color:rgba(96,165,250,0.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">추천 플랫폼</div><div style="font-size:13px;color:#60A5FA;">${valuationResult.platform_fit}</div></div>` : ""}
            ${valuationResult.target_audience ? `<div style="padding:12px;border:1px solid rgba(78,204,163,0.2);border-radius:8px;"><div style="font-size:9px;color:rgba(78,204,163,0.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">핵심 타겟</div><div style="font-size:13px;color:#4ECCA3;">${valuationResult.target_audience}</div></div>` : ""}
          </div>` : "<div style='color:rgba(255,255,255,0.4);'>Stage 7에서 시장 분석을 실행하세요.</div>"}`),

      // 8. Script Coverage
      slide(8, "SCRIPT COVERAGE", "#0d1117", `
        ${coverage ? `
          <div style="display:flex;gap:20px;justify-content:center;margin-bottom:20px;">
            <div style="text-align:center;padding:20px 30px;border:2px solid ${coverage.recommendation==="RECOMMEND"?"#4ECCA3":coverage.recommendation==="PASS"?"#E85D75":"#FFD166"}40;border-radius:12px;">
              <div style="font-size:32px;font-weight:900;color:${coverage.recommendation==="RECOMMEND"?"#4ECCA3":coverage.recommendation==="PASS"?"#E85D75":"#FFD166"};">${coverage.recommendation||"—"}</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;">방송사 판정</div>
            </div>
          </div>
          ${coverage.overall_impression ? `<div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.8;text-align:center;">${coverage.overall_impression.slice(0,300)}</div>` : ""}` : "<div style='color:rgba(255,255,255,0.4);'>Stage 7에서 Script Coverage를 실행하세요.</div>"}`),

      // 9. Development Status
      slide(9, "DEVELOPMENT STATUS", "#0d1117", `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
          ${["로그라인","개념 분석","캐릭터","스토리 설계","트리트먼트","초고","Coverage","고쳐쓰기"].map((name,i)=>{
            const sid = String(i+1);
            const done = getStageStatus(sid) === "done";
            return `<div style="padding:12px;border:1px solid ${done?"rgba(78,204,163,0.3)":"rgba(255,255,255,0.06)"};border-radius:8px;text-align:center;background:${done?"rgba(78,204,163,0.08)":"transparent"};"><div style="font-size:16px;margin-bottom:6px;">${done?"✅":"⬜"}</div><div style="font-size:10px;color:${done?"#4ECCA3":"rgba(255,255,255,0.35)"};">${name}</div></div>`;
          }).join("")}
        </div>`),

      // 10. Next Steps
      slide(10, "NEXT STEPS", "linear-gradient(135deg,#0f0f1a,#1a1a2e)", `
        <div style="text-align:center;padding-top:20px;">
          <div style="font-size:24px;font-weight:800;color:#C8A84B;margin-bottom:16px;">준비됐습니까?</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:2;">기획개발 협업 · 공동제작 · 투자 문의</div>
          <div style="margin-top:40px;padding:20px;border:1px solid rgba(200,168,75,0.3);border-radius:12px;max-width:400px;margin-left:auto;margin-right:auto;">
            <div style="font-size:12px;color:rgba(255,255,255,0.5);">Generated by HelloLogline</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:6px;">${today}</div>
          </div>
        </div>`),
    ].join("");

    const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>피치 덱 — ${logline?.slice(0,30)||"Logline"}</title>
    <style>
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif; background:#000; color:#fff; }
      .slide { min-height:100vh; padding:60px 80px; display:flex; flex-direction:column; position:relative; page-break-after:always; }
      .slide-num { position:absolute; top:24px; right:32px; font-size:10px; color:rgba(255,255,255,0.2); font-family:monospace; letter-spacing:1px; }
      .slide-title { font-size:10px; letter-spacing:4px; text-transform:uppercase; color:rgba(255,255,255,0.3); margin-bottom:40px; font-family:monospace; }
      .slide-body { flex:1; }
      @media print { body { margin:0; } .slide { page-break-after:always; } }
    </style></head><body>${slides}
    <script>document.title="피치 덱 — ${(logline||"").slice(0,20)}";</script>
    </body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) { win.document.write(html); win.document.close(); }
  };

  // ── 스토리 바이블 HTML 출력 ─────────────────────────────────────
  const openStoryBibleDoc = () => {
    const genreLabel = genre === "auto" ? (result?.detected_genre || "미정") : GENRES.find(g => g.id === genre)?.label || "미정";
    const today = new Date().toLocaleDateString("ko-KR");
    const protagonist = charDevResult?.protagonist;
    const supporting = charDevResult?.supporting_characters || [];
    const synopsis = pipelineResult?.synopsis || synopsisResults?.synopses?.[0]?.synopsis || "";
    const synopsisTitle = pipelineResult?.direction_title || synopsisResults?.synopses?.[0]?.direction_title || "";
    const theme = pipelineResult?.theme || synopsisResults?.synopses?.[0]?.theme || "";
    const tone = pipelineResult?.genre_tone || synopsisResults?.synopses?.[0]?.genre_tone || "";

    const sec = (title, content) => content ? `
      <div class="section">
        <div class="sec-head">${title}</div>
        <div class="sec-body">${content}</div>
      </div>` : "";
    const kv = (label, value) => value ? `<div class="kv"><span class="kv-label">${label}</span><span class="kv-value">${value}</span></div>` : "";

    const charSection = protagonist ? `
      <div class="char-card">
        <div class="char-name">주인공</div>
        ${kv("Want", protagonist.want)}
        ${kv("Need", protagonist.need)}
        ${kv("Arc", protagonist.arc_type)}
        ${kv("Ghost", protagonist.ghost)}
        ${protagonist.wound ? kv("상처", protagonist.wound) : ""}
      </div>
      ${supporting.slice(0,5).map(s=>`
        <div class="char-card">
          <div class="char-name">${s.name||s.character_name||"조연"} <span class="char-role">${s.role||s.function||""}</span></div>
          ${kv("역할", s.relationship||"")}
          ${kv("기능", s.narrative_function||"")}
        </div>`).join("")}` : "<p>Stage 3에서 캐릭터를 설계하세요.</p>";

    const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>스토리 바이블 — ${logline?.slice(0,30)||"Logline"}</title>
    <style>
      body { font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif; background:#fff; color:#1a1a2e; max-width:800px; margin:0 auto; padding:60px 40px; line-height:1.75; }
      h1 { font-size:26px; font-weight:900; margin-bottom:6px; }
      .meta { font-size:12px; color:#888; margin-bottom:40px; }
      .section { margin-bottom:40px; page-break-inside:avoid; }
      .sec-head { font-size:10px; letter-spacing:3px; text-transform:uppercase; font-weight:700; color:#1a1a2e; border-bottom:2px solid #1a1a2e; padding-bottom:6px; margin-bottom:16px; }
      .sec-body { font-size:14px; color:#333; }
      .kv { display:flex; gap:12px; margin-bottom:8px; }
      .kv-label { min-width:80px; font-size:11px; color:#999; font-weight:600; flex-shrink:0; }
      .kv-value { font-size:14px; color:#1a1a2e; }
      .char-card { padding:16px 20px; border:1px solid #e0e0e0; border-radius:8px; margin-bottom:12px; }
      .char-name { font-size:15px; font-weight:700; margin-bottom:10px; }
      .char-role { font-size:11px; color:#888; font-weight:400; margin-left:8px; }
      .logline-box { background:#fafafa; border-left:4px solid #1a1a2e; padding:16px 20px; margin-bottom:16px; font-size:16px; font-weight:600; line-height:1.6; }
      @media print { body { padding:40px; } .section { page-break-inside:avoid; } }
    </style></head><body>
      <h1>${synopsisTitle || logline?.slice(0,40) || "스토리 바이블"}</h1>
      <div class="meta">${genreLabel} / ${getDurText()} &nbsp;·&nbsp; ${today} &nbsp;·&nbsp; HelloLogline</div>

      ${sec("로그라인", `<div class="logline-box">${logline||""}</div>`)}
      ${sec("테마 & 톤", `${kv("주제", theme)}${kv("톤", tone)}`)}
      ${sec("시놉시스", synopsis ? `<p>${synopsis}</p>` : "")}
      ${sec("인물 설계", charSection)}
      ${beatSheetResult?.beats?.length ? sec("비트 구조", `
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <tr style="background:#f5f5f5;"><th style="text-align:left;padding:6px 8px;border:1px solid #e0e0e0;">비트</th><th style="text-align:left;padding:6px 8px;border:1px solid #e0e0e0;">막</th><th style="text-align:left;padding:6px 8px;border:1px solid #e0e0e0;">요약</th><th style="text-align:right;padding:6px 8px;border:1px solid #e0e0e0;">페이지</th></tr>
          ${beatSheetResult.beats.map(b=>`<tr><td style="padding:5px 8px;border:1px solid #e0e0e0;font-weight:600;">${b.name_kr}</td><td style="padding:5px 8px;border:1px solid #e0e0e0;color:#888;">${b.act||""}</td><td style="padding:5px 8px;border:1px solid #e0e0e0;">${(b.summary||"").slice(0,80)}</td><td style="padding:5px 8px;border:1px solid #e0e0e0;text-align:right;color:#888;">p.${b.page_start||""}</td></tr>`).join("")}
        </table>`) : ""}
      ${treatmentResult?.scenes?.length ? sec("주요 씬 목록", `
        <ol style="font-size:13px;color:#333;padding-left:18px;">
          ${treatmentResult.scenes.slice(0,10).map(s=>`<li style="margin-bottom:8px;">${s.scene_heading||s.location||""} — ${(s.description||s.action||"").slice(0,100)}</li>`).join("")}
        </ol>`) : ""}
      <script>document.title="스토리 바이블 — ${(logline||"").slice(0,20)}";</script>
    </body></html>`;

    const win = window.open("", "_blank", "width=900,height=1100");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const saveApiKey = (key, remember = false) => {
    if (remember) {
      localStorage.setItem("logline_api_key", key);
      sessionStorage.setItem("logline_api_key", key);
    } else {
      sessionStorage.setItem("logline_api_key", key);
      localStorage.removeItem("logline_api_key");
    }
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

  // ── HTML 엔티티 디코더 (AI가 &nbsp; 등을 출력할 때 정리) ──
  function decodeHtmlEntities(str) {
    if (!str) return str;
    return str
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'");
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
    let bible = "";
    // 기존 시나리오/시놉시스 참고 (체크 시 모든 단계에 주입)
    if (referenceScenarioEnabled && referenceScenario.trim()) {
      if (referenceScenarioSummary.trim()) {
        // 요약본이 있으면 요약만 주입 (토큰 절약)
        bible += `\n\n━━━ 기존 시나리오 요약 참고 — 이 방향으로 이야기를 발전시킬 것 ━━━\n${referenceScenarioSummary}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      } else {
        // 요약 없으면 원문 앞부분 사용
        bible += `\n\n━━━ 기존 시나리오/시놉시스 참고 — 이 내용을 바탕으로 분석하고 발전시킬 것 ━━━\n${referenceScenario.trim().slice(0, 12000)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      }
    }
    const s = pipelineResult
      || (selectedSynopsisIndex !== null ? synopsisResults?.synopses?.[selectedSynopsisIndex] : null);
    if (!s) return bible;
    const scenes = (s.key_scenes || []).map((sc, i) => `  ${i + 1}. ${sc}`).join("\n");
    const storyText = getEffective("synopsis", s.synopsis || "");
    bible += `\n\n━━━ 확정된 시놉시스 — 반드시 이 방향으로 이야기를 발전시킬 것 ━━━
제목/방향: ${s.direction_title || ""}
장르/톤: ${s.genre_tone || ""}
훅: ${s.hook || ""}

${storyText}${scenes ? `\n\n핵심 장면:\n${scenes}` : ""}${s.theme ? `\n\n주제: ${s.theme}` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

※ 위 시놉시스의 등장인물 이름·설정·배경·핵심 장면을 그대로 유지하세요. 새로운 이야기를 창작하지 말고, 위 시놉시스를 발전시키세요.`;
    return bible;
  };

  // ── 스토리 닥터 컨텍스트 빌더 ──
  const buildStoryDoctorContext = () => {
    const genreLabel = genre === "auto"
      ? (result?.detected_genre || "미정")
      : GENRES.find(g => g.id === genre)?.label || "미정";
    const durLabel = getDurText();

    let ctx = `【 작품 기본 정보 】\n`;
    ctx += `로그라인: ${logline.trim()}\n`;
    ctx += `장르: ${genreLabel} | 포맷: ${durLabel}\n`;

    // 기존 시나리오 요약
    if (referenceScenarioSummary.trim()) {
      ctx += `\n【 참고 시나리오 요약 】\n${referenceScenarioSummary.slice(0, 500)}\n`;
    }

    // 캐릭터
    if (charDevResult?.protagonist) {
      const p = charDevResult.protagonist;
      const name = p.name || "주인공";
      const desire = p.psychological_depth?.desire || p.desire || "";
      const wound = p.psychological_depth?.wound || p.wound || "";
      ctx += `\n【 주인공 】\n이름: ${name}`;
      if (desire) ctx += ` | 욕망: ${desire}`;
      if (wound) ctx += ` | 상처: ${wound}`;
      ctx += "\n";
      const supporting = charDevResult.supporting_characters || [];
      if (supporting.length > 0) {
        ctx += `조연: ${supporting.slice(0, 3).map(c => c.name || "").filter(Boolean).join(", ")}\n`;
      }
    }

    // 시놉시스
    const synopsisText = pipelineResult?.synopsis
      || (selectedSynopsisIndex !== null ? synopsisResults?.synopses?.[selectedSynopsisIndex]?.synopsis : null)
      || "";
    if (synopsisText.trim()) {
      ctx += `\n【 시놉시스 】\n${synopsisText.trim().slice(0, 600)}\n`;
    }

    // 트리트먼트
    const effectiveTreatment = (writerEdits?.treatment || treatmentResult || "").trim();
    if (effectiveTreatment) {
      ctx += `\n【 트리트먼트 요약 】\n${effectiveTreatment.slice(0, 600)}\n`;
    }

    // 비트 시트
    if (beatSheetResult?.beats?.length) {
      const keyBeats = beatSheetResult.beats.filter(b =>
        ["opening_image", "midpoint", "all_is_lost", "finale"].includes(b.id)
      );
      if (keyBeats.length > 0) {
        ctx += `\n【 주요 비트 】\n`;
        keyBeats.forEach(b => {
          ctx += `• ${b.name}: ${(b.description || "").slice(0, 120)}\n`;
        });
      }
    }

    // 초고
    if (scenarioDraftResult.trim()) {
      ctx += `\n【 시나리오 초고 (앞부분) 】\n${scenarioDraftResult.trim().slice(0, 800)}\n`;
    }

    // 개고 결과
    if (fullRewriteResult?.trim()) {
      ctx += `\n【 개고 결과 (앞부분) 】\n${fullRewriteResult.trim().slice(0, 600)}\n`;
    } else if (partialRewriteResult?.trim()) {
      ctx += `\n【 부분 재작성 결과 (앞부분) 】\n${partialRewriteResult.trim().slice(0, 600)}\n`;
    }

    return ctx;
  };

  // ── 기존 시나리오에서 로그라인 추출 ──
  const extractLoglineFromScenario = async () => {
    if (!referenceScenario.trim() || !apiKey) return;
    setExtractLoglineLoading(true);
    setExtractLoglineError("");
    const loglineRanges = { ultrashort: [20, 40], shortform: [30, 50], shortfilm: [40, 70], webdrama: [50, 80], tvdrama: [60, 90], feature: [70, 110], miniseries: [90, 140], shortformseries: [60, 100] };
    const [lo, hi] = loglineRanges[selectedDuration] || [70, 110];
    const durLabel = DURATION_OPTIONS.find(d => d.id === selectedDuration)?.label || "장편영화";
    const sysPrompt = `당신은 시나리오 분석 전문가입니다. 주어진 시나리오나 시놉시스를 읽고 핵심을 한 문장의 로그라인으로 추출합니다.

로그라인 작성 규칙:
- 반드시 한 문장으로 작성 (${lo}~${hi}자 — ${durLabel} 형식 기준, 반드시 준수)
- 주인공 + 촉발 사건 + 목표/욕망 + 핵심 갈등/장애물 포함
- 능동적인 언어 사용, 주인공이 주어
- 장르 톤을 반영
- 결말은 포함하지 않음

출력 형식: 로그라인 문장만 출력하세요. 설명이나 부연 없이 로그라인 한 문장만 답하세요.`;
    try {
      const extracted = await callClaudeText(
        apiKey,
        sysPrompt,
        `다음 시나리오/시놉시스에서 로그라인을 추출해주세요:\n\n${referenceScenario.trim().slice(0, 50000)}`,
        300,
        "claude-sonnet-4-6"
      );
      if (extracted?.trim()) {
        setLogline(extracted.trim());
      }
    } catch (err) {
      setExtractLoglineError("로그라인 추출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setExtractLoglineLoading(false);
    }
  };

  // ── 기존 시나리오 요약 생성 (이후 단계에 요약본만 주입) ──
  const summarizeReferenceScenario = async () => {
    if (!referenceScenario.trim() || !apiKey) return;
    setSummarizeLoading(true);
    setSummarizeError("");
    const sysPrompt = `당신은 시나리오 분석 전문가입니다. 주어진 시나리오/시놉시스의 핵심 정보를 구조화하여 요약합니다. 단편부터 장편까지 어떤 분량이든 처리합니다.

다음 형식으로 800자 이내로 요약하세요:
- 장르/톤: (2~4단어)
- 배경: (시대, 장소)
- 주요 인물: (이름 · 역할 · 핵심 특성, 최대 5명)
- 핵심 갈등: (한 문장)
- 3막 구조:
  1막: (핵심 설정 사건)
  2막: (주요 대결/전환점)
  3막: (결말 방향)
- 주제/메시지: (한 문장)
- 고유 요소: (이 작품만의 특색 1~2가지)

설명이나 부연 없이 위 형식만 답하세요.`;
    try {
      const summary = await callClaudeText(
        apiKey,
        sysPrompt,
        referenceScenario.trim().slice(0, 80000),
        900,
        "claude-haiku-4-5-20251001"
      );
      if (summary?.trim()) setReferenceScenarioSummary(summary.trim());
    } catch (err) {
      setSummarizeError("요약 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSummarizeLoading(false);
    }
  };

  const buildUserMsg = (text, genreId) => {
    const genreText = genreId === "auto"
      ? "장르를 자동으로 감지해주세요."
      : `선택된 장르: ${GENRES.find((g) => g.id === genreId)?.label}`;
    return `다음 로그라인을 분석해주세요.\n\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreText}\n글자수: ${text.length}자\n\n로그라인:\n"${text.trim()}"`;
  };

  // ── Analyze ──
  const generateInsight = async () => {
    if (!apiKey || !result) return;
    setInsightLoading(true);
    setInsightError("");
    setInsightResult(null);
    try {
      const genreLabel = genre === "auto" ? (result?.detected_genre || "미정") : GENRES.find(g => g.id === genre)?.label || "미정";
      const lines = [
        `로그라인: "${logline}"`,
        `장르: ${genreLabel} / 포맷: ${getDurText()}`,
        "",
        "── 완료된 분석 결과 요약 ──",
      ];
      if (result) {
        lines.push(`로그라인 품질: 구조 ${calcSectionTotal(result,"structure")}/50, 표현 ${calcSectionTotal(result,"expression")}/30, 기술 ${calcSectionTotal(result,"technical")}/20, 흥미도 ${calcSectionTotal(result,"interest")}/50`);
        if (result.overall_feedback) lines.push(`종합 피드백: ${result.overall_feedback}`);
      }
      if (earlyCoverageResult) lines.push(`상업성: ${earlyCoverageResult.marketability_score}/10 — ${earlyCoverageResult.one_line_verdict || ""}`);
      if (charDevResult?.protagonist) {
        const p = charDevResult.protagonist;
        lines.push(`주인공 Want: ${p.want||"미정"} / Need: ${p.need||"미정"} / Arc: ${p.arc_type||"미정"}`);
      }
      if (shadowResult?.jung_verdict) lines.push(`Jung 분석: ${shadowResult.jung_verdict}`);
      if (authenticityResult) lines.push(`진정성: ${authenticityResult.authenticity_score}/10 — ${authenticityResult.authenticity_label||""}`);
      if (mythMapResult) lines.push(`신화 단계: ${mythMapResult.primary_stage||""} — ${mythMapResult.campbell_verdict||""}`);
      if (barthesCodeResult) lines.push(`바르트 지배 코드: ${barthesCodeResult.dominant_code||""} / ${barthesCodeResult.barthes_verdict||""}`);
      if (koreanMythResult?.korean_myth_verdict) lines.push(`한국 정서: ${koreanMythResult.korean_myth_verdict}`);
      if (expertPanelResult?.synthesis?.consensus) lines.push(`전문가 패널: ${expertPanelResult.synthesis.consensus}`);
      if (themeResult) lines.push(`컨트롤링 아이디어: ${themeResult.controlling_idea||""} / 질문: ${themeResult.thematic_question||""}`);
      if (subtextResult) lines.push(`서브텍스트: ${subtextResult.subtext_score}/10 — ${subtextResult.chekhov_verdict||""}`);
      if (structureResult) lines.push(`구조 유형: ${structureResult.structure_type||""}`);
      if (comparableResult?.market_positioning) lines.push(`시장 포지셔닝: ${comparableResult.market_positioning}`);
      const synText = pipelineResult?.synopsis || synopsisResults?.synopses?.[0]?.synopsis || "";
      if (synText) lines.push(`시놉시스 (앞부분): ${synText.slice(0,250)}…`);

      const sysPrompt = `당신은 시나리오 전문 컨설턴트입니다. 제공된 여러 분석 결과를 종합하여 지금 이 작품의 발전을 위해 가장 중요한 개선점 3가지를 명확하고 실용적으로 제시하세요.

반드시 아래 JSON 형식으로만 답하세요:
{
  "priority_issues": [
    {
      "title": "개선점 제목 (6-12자)",
      "problem": "무엇이 문제인가 (1-2문장, 분석 데이터 기반)",
      "why_matters": "왜 지금 중요한가 (1문장)",
      "action": "구체적으로 어떻게 고칠 수 있는가 (2-3문장, 실용적 방법)"
    }
  ],
  "overall_verdict": "현재 이 작품의 가장 핵심적인 한 줄 평가 (20-35자)",
  "strongest_element": "현재 가장 잘 되어 있는 요소 (10-25자)"
}`;

      const parsed = await callClaude(apiKey, sysPrompt, lines.join("\n"), 3000, "claude-sonnet-4-6", undefined, InsightSchema, "insight");
      setInsightResult(parsed);
    } catch (e) {
      setInsightError(e.message || "인사이트 생성 실패");
    } finally {
      setInsightLoading(false);
    }
  };

  const analyze = async (overrideLogline) => {
    const target = overrideLogline ?? logline;
    if (!target.trim() || !apiKey) return;
    if (overrideLogline) setLogline(overrideLogline);
    if (isDemoMode) setIsDemoMode(false);
    const ctrl = makeController("analyze");
    setLoading(true);
    setError("");
    setResult(null);
    setResult2(null);
    setStoryFixes([]);
    setStoryPivots([]);
    setAiImprovement(null);
    setInsightResult(null);
    setInsightError("");
    try {
      const parsed = await callClaude(apiKey, SYSTEM_PROMPT, buildUserMsg(target, genre), 4500, "claude-sonnet-4-6", ctrl.signal, LoglineAnalysisSchema, "logline");
      const sT = calcSectionTotal(parsed, "structure");
      const eT = calcSectionTotal(parsed, "expression");
      const tT = calcSectionTotal(parsed, "technical");
      const iT = calcSectionTotal(parsed, "interest");
      const qScore = sT + eT + tT;
      setResult(parsed);
      saveToHistory(target, genre, parsed, qScore, iT);
      trackCreditUsage("로그라인 분석", 2);
      showToast("success", `로그라인 분석 완료 — 품질 ${qScore}점 / 흥미 ${iT}점`);
      if (compareMode && logline2.trim()) {
        setLoading2(true);
        try {
          const parsed2 = await callClaude(apiKey, SYSTEM_PROMPT, buildUserMsg(logline2, genre), 4500, "claude-sonnet-4-6", ctrl.signal, LoglineAnalysisSchema, "logline");
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
      if (err.name !== "AbortError") {
        setError(err.message || "분석 중 오류가 발생했습니다.");
        showToast("error", err.message || "분석 중 오류가 발생했습니다.");
      }
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

    if (themeResult) {
      const tr = [];
      if (themeResult.controlling_idea) tr.push(`컨트롤링 아이디어: ${themeResult.controlling_idea}`);
      if (themeResult.thematic_question) tr.push(`테마 질문: ${themeResult.thematic_question}`);
      if (themeResult.moral_premise?.statement) tr.push(`도덕적 전제: ${themeResult.moral_premise.statement}`);
      if (themeResult.protagonist_inner_journey?.lesson) tr.push(`주인공이 배우는 것: ${themeResult.protagonist_inner_journey.lesson}`);
      if (tr.length > 0) contextParts.push(`[테마 분석 결과 — 시놉시스 주제의식에 반영]\n${tr.join("\n")}`);
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

    // ── 인물 직접 설정 (treatmentChars) — 항상 최우선 반영 ──
    {
      const p = treatmentChars.protagonist;
      const manualLines = [];
      if (p.name) manualLines.push(`주인공 이름: ${p.name}${p.role ? ` (${p.role})` : ""}`);
      if (p.want) manualLines.push(`외적 목표(Want): ${p.want}`);
      if (p.need) manualLines.push(`내적 욕구(Need): ${p.need}`);
      if (p.flaw) manualLines.push(`핵심 결함: ${p.flaw}`);
      const activeSupporting = treatmentChars.supporting.filter(s => s.name?.trim());
      if (activeSupporting.length > 0) {
        activeSupporting.forEach(s => {
          let line = `조연: ${s.name}${s.role ? ` (${s.role})` : ""}${s.relation ? ` — ${s.relation}` : ""}${s.mbti ? ` [MBTI: ${s.mbti}]` : ""}`;
          if (s.description) line += `\n  설명: ${s.description}`;
          manualLines.push(line);
        });
      }
      if (manualLines.length > 0) {
        contextParts.unshift(`[작가 직접 설정 — 반드시 이 인물 이름·설정·관계를 그대로 사용할 것]\n${manualLines.join("\n")}`);
      }
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
      const data = await callClaude(apiKey, SYNOPSIS_SYSTEM_PROMPT, msg, 6000, "claude-sonnet-4-6", ctrl.signal, SynopsisSchema, "synopsis");
      setSynopsisResults(data);
      trackCreditUsage("시놉시스 생성", 3);
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
    try { const data = await callClaude(apiKey, VALUE_CHARGE_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ValueChargeSchema, "valuecharge"); setValueChargeResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setValueChargeError(err.message || "가치 전하 분석 중 오류가 발생했습니다."); }
    finally { setValueChargeLoading(false); clearController("valueCharge"); }
  };

  // ── Shadow (Jung) ──
  const analyzeShadow = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("shadow");
    setShadowLoading(true); setShadowError(""); setShadowResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const charHint = treatmentChars.protagonist.name ? `\n\n[작가 설정]\n주인공: ${treatmentChars.protagonist.name}${treatmentChars.protagonist.role ? ` (${treatmentChars.protagonist.role})` : ""}${treatmentChars.protagonist.want ? `\n외적 목표: ${treatmentChars.protagonist.want}` : ""}${treatmentChars.protagonist.need ? `\n내적 욕구: ${treatmentChars.protagonist.need}` : ""}${treatmentChars.protagonist.flaw ? `\n핵심 결함: ${treatmentChars.protagonist.flaw}` : ""}${treatmentChars.supporting.filter(s => s.name).map(s => `\n조연: ${s.name}${s.role ? ` (${s.role})` : ""}${s.relation ? ` — ${s.relation}` : ""}${s.mbti ? ` [MBTI: ${s.mbti}]` : ""}${s.description ? `\n  설명: ${s.description}` : ""}`).join("")}` : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}${charHint}\n\n위 로그라인의 캐릭터 원형을 Jung의 분석심리학으로 분석하세요.`;
    try { const data = await callClaude(apiKey, SHADOW_ANALYSIS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ShadowAnalysisSchema, "character"); setShadowResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setShadowError(err.message || "그림자 분석 중 오류가 발생했습니다."); }
    finally { setShadowLoading(false); clearController("shadow"); }
  };

  // ── Authenticity (Sartre) ──
  const analyzeAuthenticity = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("authenticity");
    setAuthenticityLoading(true); setAuthenticityError(""); setAuthenticityResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const charHint = treatmentChars.protagonist.name ? `\n\n[작가 설정]\n주인공: ${treatmentChars.protagonist.name}${treatmentChars.protagonist.role ? ` (${treatmentChars.protagonist.role})` : ""}${treatmentChars.protagonist.want ? `\n외적 목표: ${treatmentChars.protagonist.want}` : ""}${treatmentChars.protagonist.need ? `\n내적 욕구: ${treatmentChars.protagonist.need}` : ""}${treatmentChars.protagonist.flaw ? `\n핵심 결함: ${treatmentChars.protagonist.flaw}` : ""}${treatmentChars.supporting.filter(s => s.name).map(s => `\n조연: ${s.name}${s.role ? ` (${s.role})` : ""}${s.relation ? ` — ${s.relation}` : ""}${s.mbti ? ` [MBTI: ${s.mbti}]` : ""}${s.description ? `\n  설명: ${s.description}` : ""}`).join("")}` : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}${charHint}\n\n위 로그라인의 진정성 지수를 실존주의 철학으로 분석하세요.`;
    try { const data = await callClaude(apiKey, AUTHENTICITY_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, AuthenticitySchema, "character"); setAuthenticityResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, ACADEMIC_ANALYSIS_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, AcademicAnalysisSchema, "academic"); setAcademicResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, EXPERT_PANEL_SYSTEM_PROMPT, msg, 8000, "claude-sonnet-4-6", ctrl.signal, ExpertPanelSchema, "expertpanel"); setExpertPanelResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, SUBTEXT_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, SubtextSchema, "subtext"); setSubtextResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, MYTH_MAP_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, MythMapSchema, "mythmap"); setMythMapResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, BARTHES_CODE_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, BarthesCodeSchema, "barthes"); setBarthesCodeResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, KOREAN_MYTH_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, KoreanMythSchema, "koreantmyth"); setKoreanMythResult(data); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setKoreanMythError(err.message || "한국 신화 분석 중 오류가 발생했습니다."); }
    finally { setKoreanMythLoading(false); clearController("koreanMyth"); }
  };

  // ── Script Coverage ──
  const analyzeScriptCoverage = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("scriptCoverage");
    setScriptCoverageLoading(true); setScriptCoverageError(""); setScriptCoverageResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    // 이전 스테이지 결과 컨텍스트 수집
    const coverageCtxParts = [];
    if (themeResult?.controlling_idea) coverageCtxParts.push(`[테마] 컨트롤링 아이디어: ${themeResult.controlling_idea}${themeResult.thematic_question ? ` / 테마 질문: ${themeResult.thematic_question}` : ""}`);
    if (expertPanelResult?.consensus) coverageCtxParts.push(`[전문가 패널] ${expertPanelResult.consensus}${expertPanelResult.key_concern ? ` / 우려: ${expertPanelResult.key_concern}` : ""}`);
    if (charDevResult?.protagonist) {
      const p = charDevResult.protagonist;
      const cd = [`주인공: ${p.name_suggestion || "주인공"}`];
      if (p.want) cd.push(`Want: ${p.want}`);
      if (p.need) cd.push(`Need: ${p.need}`);
      if (p.ghost) cd.push(`Ghost: ${p.ghost}`);
      coverageCtxParts.push(`[캐릭터] ${cd.join(" / ")}`);
    }
    if (pipelineResult) {
      const pp = [`시놉시스 방향: ${pipelineResult.direction_title || ""}`];
      if (pipelineResult.theme) pp.push(`주제: ${pipelineResult.theme}`);
      if (pipelineResult.ending_type) pp.push(`결말: ${pipelineResult.ending_type}`);
      coverageCtxParts.push(`[스토리 설계] ${pp.join(" / ")}`);
    }
    if (treatmentResult) {
      coverageCtxParts.push(`[트리트먼트 요약]\n${String(treatmentResult).slice(0, 800)}`);
    }
    const coverageCtxBlock = coverageCtxParts.length > 0
      ? `\n\n━━━ 이전 단계 분석 결과 (Coverage 평가에 반영할 것) ━━━\n${coverageCtxParts.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}${coverageCtxBlock}\n\n위 로그라인(및 이전 단계 분석 결과)에 대한 할리우드 + 한국 방송사 스타일 Script Coverage를 작성하세요. 이전 단계에서 구축된 캐릭터·테마·시놉시스 정보가 있다면 그것을 기준으로 평가하세요.`;
    try { const data = await callClaude(apiKey, SCRIPT_COVERAGE_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, ScriptCoverageSchema, "coverage"); setScriptCoverageResult(data); trackCreditUsage("Script Coverage", 2); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") setScriptCoverageError(err.message || "Script Coverage 생성 중 오류가 발생했습니다."); }
    finally { setScriptCoverageLoading(false); clearController("scriptCoverage"); }
  };

  // ── AI 전환 가이드: 로그라인 → 캐릭터 ──
  const generateCharGuide = async () => {
    if (!result) return;
    setCharGuideLoading(true); setCharGuideError(""); setCharGuide(null);
    const items = [
      ...Object.entries(result.structure || {}),
      ...Object.entries(result.expression || {}),
    ].map(([k, v]) => `${k}: ${v.score ?? "?"}점 — ${v.feedback || ""}`).join("\n");
    const msg = `로그라인: "${logline}"\n\n항목별 분석:\n${items}\n\n종합 피드백: ${result.overall_feedback || ""}`;
    try {
      const data = await callClaude(apiKey, CHAR_HINT_PROMPT, msg, 800, "claude-haiku-4-5-20251001", null, null, "char_guide");
      setCharGuide(data);
    } catch (err) {
      setCharGuideError(err.message || "가이드 생성 중 오류가 발생했습니다.");
    } finally {
      setCharGuideLoading(false);
    }
  };

  // ── AI 전환 가이드: Coverage → 고쳐쓰기 ──
  const generateRewriteGuide = async () => {
    if (!scriptCoverageResult) return;
    setRewriteGuideLoading(true); setRewriteGuideError(""); setRewriteGuide(null);
    const scoresText = Object.entries(scriptCoverageResult.scores || {})
      .map(([k, v]) => `${k}: ${v.score}/10 (${v.grade}) — ${v.comment}`)
      .join("\n");
    const msg = `Script Coverage 결과:\n${scoresText}\n\n종합 판정: ${scriptCoverageResult.recommendation || ""}\n약점: ${(scriptCoverageResult.weaknesses || []).join(", ")}\n총평: ${scriptCoverageResult.reader_comment || ""}`;
    try {
      const data = await callClaude(apiKey, REWRITE_HINT_PROMPT, msg, 800, "claude-haiku-4-5-20251001", null, null, "rewrite_guide");
      setRewriteGuide(data);
    } catch (err) {
      setRewriteGuideError(err.message || "우선순위 생성 중 오류가 발생했습니다.");
    } finally {
      setRewriteGuideLoading(false);
    }
  };

  // ── Master Report ──
  const generateMasterReport = async () => {
    if (!logline.trim() || !apiKey) return;
    setMasterReportLoading(true); setMasterReportError(""); setMasterReportResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find(g => g.id === genre)?.label || "";
    const parts = [`로그라인: "${logline.trim()}"`, `장르: ${genreLabel} / 포맷: ${getDurText()}`, ""];
    if (result) {
      const sT = calcSectionTotal(result, "structure"), eT = calcSectionTotal(result, "expression"), tT = calcSectionTotal(result, "technical"), iT = calcSectionTotal(result, "interest");
      parts.push(`[Stage 1] 로그라인 품질: 구조 ${sT}/50, 표현 ${eT}/30, 기술 ${tT}/20, 흥미 ${iT}/100`);
      if (result.overall_feedback) parts.push(`  피드백: ${result.overall_feedback.slice(0, 200)}`);
    }
    if (charDevResult?.protagonist) {
      const p = charDevResult.protagonist;
      parts.push(`[Stage 3] 주인공 — Want: ${p.want||""} / Need: ${p.need||""} / Arc: ${p.arc_type||""}`);
    }
    if (pipelineResult?.synopsis) parts.push(`[Stage 4] 시놉시스 방향: ${pipelineResult.direction_title||""} — ${pipelineResult.synopsis.slice(0,200)}`);
    if (beatSheetResult?.beats?.length) parts.push(`[Stage 5] 비트시트: ${beatSheetResult.beats.length}개 비트 완성`);
    if (scenarioDraftResult) parts.push(`[Stage 6] 시나리오 초고 완성`);
    if (scriptCoverageResult) parts.push(`[Stage 7] Script Coverage: ${scriptCoverageResult.recommendation||""} — ${scriptCoverageResult.overall_impression?.slice(0,150)||""}`);
    if (rewriteDiagResult) parts.push(`[Stage 8] 고쳐쓰기 진단 완료`);
    const msg = parts.join("\n");
    try {
      const data = await callClaude(apiKey, MASTER_REPORT_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", null, MasterReportSchema, "master_report");
      setMasterReportResult(data);
      trackCreditUsage("통합 마스터 리포트", 3);
      await autoSave();
    } catch (err) {
      setMasterReportError(err.message || "마스터 리포트 생성 중 오류가 발생했습니다.");
    } finally { setMasterReportLoading(false); }
  };

  // ── Episode Series Design ──
  const generateEpisodeDesign = async (episodeCount = 8) => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("episode");
    setEpisodeDesignLoading(true); setEpisodeDesignError(""); setEpisodeDesignResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find(g => g.id === genre)?.label || "";
    const synopsisCtx = pipelineResult?.synopsis
      ? `\n\n확정 시놉시스:\n${pipelineResult.synopsis}`
      : synopsisResults?.synopses?.[0]?.synopsis
      ? `\n\n시놉시스 방향:\n${synopsisResults.synopses[0].synopsis}`
      : "";
    const charCtx = charDevResult?.protagonist
      ? `\n\n주인공: ${charDevResult.protagonist.want || ""} / Need: ${charDevResult.protagonist.need || ""}`
      : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}\n에피소드 수: ${episodeCount}부작${synopsisCtx}${charCtx}\n\n위 로그라인을 기반으로 ${episodeCount}부작 시리즈 구조를 설계하세요. 각 에피소드의 개별 갈등과 클리프행어, 시즌 전체 아크를 포함하세요.`;
    try {
      const data = await callClaude(apiKey, EPISODE_SERIES_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, EpisodeSeriesSchema, "episode");
      setEpisodeDesignResult(data);
      trackCreditUsage("에피소드 시리즈 설계", 3);
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") setEpisodeDesignError(err.message || "에피소드 설계 중 오류가 발생했습니다.");
    } finally { setEpisodeDesignLoading(false); clearController("episode"); }
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
    try { const data = await callClaude(apiKey, COMPARABLE_WORKS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ComparableWorksSchema, "comparable"); setComparableResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, VALUATION_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ValuationSchema, "valuation"); setValuationResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, DIALOGUE_DEV_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, DialogueDevSchema, "dialoguedev"); setDialogueDevResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, STRUCTURE_ANALYSIS_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, StructureAnalysisSchema, "structure"); setStructureResult(data); await autoSave(); }
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
    try { const data = await callClaude(apiKey, THEME_ANALYSIS_SYSTEM_PROMPT, msg, 3000, "claude-haiku-4-5-20251001", ctrl.signal, ThemeAnalysisSchema, "theme"); setThemeResult(data); await autoSave(); }
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
      const text = await callClaudeText(apiKey, SCENE_LIST_SYSTEM_PROMPT, msg, 7000, "claude-sonnet-4-6", ctrl.signal, "scenelist");
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
      const text = await callClaudeText(apiKey, SCENARIO_DRAFT_SYSTEM_PROMPT, msg, 8000, "claude-sonnet-4-6", ctrl.signal, "scenario");
      setScenarioDraftResult(decodeHtmlEntities(text));
      setScenarioDraftStale(false);
      setScenarioDraftCtx({
        char: !!(charDevResult?.protagonist || writerEdits.character),
        treatment: !!effectiveTreatment,
        beats: !!beatSheetResult?.beats?.length,
        dialogue: !!dialogueDevResult?.character_voices?.length,
        synopsis: !!(pipelineResult || synopsisResults),
        genre: genre !== "auto" ? genreLabel : null,
      });
      await autoSave();
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
    const genreHint = GENRE_BEAT_HINTS[genre] || "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel}${charBlock ? `\n\n캐릭터 정보:\n${charBlock}` : ""}${getStoryBible()}${structureBlock}${contextBlock}${genreHint ? `\n\n${genreHint}` : ""}\n\n위 정보를 바탕으로 포맷에 맞는 비트 시트를 생성하세요. 시놉시스·트리트먼트·플롯포인트가 있다면 반드시 그 방향의 이야기와 인물을 따르세요.`;
    try {
      trackCreditUsage("비트시트 생성", 3);
      const data = await callClaude(apiKey, BEAT_SHEET_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, BeatSheetSchema, "beatsheet");
      setBeatSheetResult(data);
      setBeatSheetStale(false);
      if (scenarioDraftResult) setScenarioDraftStale(true);
      setBeatSheetCtx({
        char: !!charDevResult?.protagonist,
        treatment: !!treatmentResult,
        synopsis: !!(pipelineResult || synopsisResults),
        plotPoints: !!structureResult?.plot_points?.length,
        genre: genre !== "auto" ? genreLabel : null,
      });
      await autoSave();
    }
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
      const sceneText = await callClaudeText(apiKey, SCENE_GEN_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", ctrl.signal, "scenario");
      setBeatScenes((prev) => ({ ...prev, [beat.id]: sceneText }));
      setExpandedBeats((prev) => ({ ...prev, [beat.id]: true }));
      addActivity("scene_gen", currentWorkingMember?.name || user?.name || "나", currentWorkingMember?.color || "#C8A84B", `씬 #${beat.id} (${beat.name_kr}) 생성`, "5");
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
          const sceneText = await callClaudeText(apiKey, SCENE_GEN_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", ctrl.signal, "scenario");
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

  // ── Early Coverage ──
  const analyzeEarlyCoverage = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("earlyCoverage");
    setEarlyCoverageLoading(true); setEarlyCoverageError("");
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}\n\n이 로그라인의 상업적 잠재력을 간략히 평가하세요. 현재 한국 OTT·극장·방송 시장 기준으로 솔직하게 평가하고, 가장 시급한 개발 과제 1가지를 명확히 짚어주세요.`;
    const EARLY_COVERAGE_PROMPT = `당신은 드라마·영화 개발 전문가입니다. 주어진 로그라인의 상업적 잠재력을 빠르고 솔직하게 평가합니다. 희망적인 말보다 실질적인 진단을 제공하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "marketability_score": 1~10 정수,
  "one_line_verdict": "한 줄 판정 (예: 넷플릭스 오리지널 가능성 있음 — 단, 주인공 설득력 보완 필요)",
  "best_platform": "가장 적합한 플랫폼 (예: 넷플릭스/티빙/극장/유튜브 숏폼 등)",
  "target_audience": "핵심 타겟 설명 (예: 20~35세 직장인, 특히 번아웃 경험자)",
  "comparable_hit": "최근 3년 내 유사 히트작 1편 (제목 + 한 줄 이유)",
  "key_strengths": ["강점 1", "강점 2"],
  "key_risks": ["위험 1", "위험 2"],
  "development_priority": "지금 당장 가장 먼저 보완해야 할 것 — 구체적으로"
}`;
    try {
      const data = await callClaude(apiKey, EARLY_COVERAGE_PROMPT, msg, 2000, "claude-haiku-4-5-20251001", ctrl.signal, EarlyCoverageSchema, "coverage");
      setEarlyCoverageResult(data);
    }
    catch (err) { if (err.name !== "AbortError") setEarlyCoverageError(err.message || "상업성 분석 중 오류가 발생했습니다."); }
    finally { setEarlyCoverageLoading(false); clearController("earlyCoverage"); }
  };

  // ── Structure Twist ──
  const analyzeStructureTwist = async () => {
    if (!beatSheetResult?.beats?.length || !apiKey) return;
    const ctrl = makeController("structureTwist");
    setStructureTwistLoading(true); setStructureTwistError(""); setStructureTwistResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find(g => g.id === genre)?.label || "";
    const beatList = beatSheetResult.beats
      .map(b => `비트 ${b.id}. ${b.name_kr}${b.name_en ? ` (${b.name_en})` : ""} — ${b.summary || ""}`)
      .join("\n");
    const TWIST_PROMPT = `당신은 실험적 서사 구조 전문가입니다. 주어진 비트 시트를 분석하고, 장르 관습을 의도적으로 '비틀어' 더 강렬하고 기억에 남는 효과를 낼 수 있는 지점 2~3곳을 찾아냅니다.

단순한 전형성 탈피가 아닌, 이 이야기의 고유한 긴장 구조를 오히려 강화하는 구체적 비틀기를 제안하세요. 비틀기는 관객의 기대를 역이용하거나, 감정 타이밍을 어긋나게 하거나, 캐릭터 행동이 장르 관습과 반대로 가게 하는 방식입니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "twists": [
    {
      "beat_id": 비트 번호 (숫자),
      "beat_name": "비트 이름",
      "convention": "현재 관습적으로 하는 것 — 한 문장",
      "twist": "비틀기 제안 — 구체적으로 어떻게 바꾸는가",
      "effect": "이 비틀기가 관객에게 만들어낼 효과",
      "risk": "이 비틀기의 위험 또는 작가가 주의해야 할 것"
    }
  ],
  "overall_note": "전체 비틀기 방향성 한 줄 요약"
}`;
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n\n비트 시트:\n${beatList}\n\n이 비트 시트에서 관습을 비틀어 더 강렬한 효과를 낼 수 있는 지점 2~3곳을 제안하세요.`;
    try {
      const data = await callClaude(apiKey, TWIST_PROMPT, msg, 2500, "claude-haiku-4-5-20251001", ctrl.signal, null, "structure");
      setStructureTwistResult(data);
    }
    catch (err) { if (err.name !== "AbortError") setStructureTwistError(err.message || "구조 비틀기 분석 중 오류가 발생했습니다."); }
    finally { setStructureTwistLoading(false); clearController("structureTwist"); }
  };

  // ── Character Dev ──
  const analyzeCharacterDev = async () => {
    if (!logline.trim() || !apiKey) return;
    const ctrl = makeController("charDev");
    setCharDevLoading(true); setCharDevError("");
    pushHistory(setCharDevHistory, charDevResult, "character");
    setCharDevResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const charHint = treatmentChars.protagonist.name ? `\n\n[작가 설정 — 이 정보를 우선하여 캐릭터를 분석하세요]\n주인공: ${treatmentChars.protagonist.name}${treatmentChars.protagonist.role ? ` (${treatmentChars.protagonist.role})` : ""}${treatmentChars.protagonist.want ? `\n외적 목표: ${treatmentChars.protagonist.want}` : ""}${treatmentChars.protagonist.need ? `\n내적 욕구: ${treatmentChars.protagonist.need}` : ""}${treatmentChars.protagonist.flaw ? `\n핵심 결함: ${treatmentChars.protagonist.flaw}` : ""}${treatmentChars.supporting.filter(s => s.name).map(s => `\n조연: ${s.name}${s.role ? ` (${s.role})` : ""}${s.relation ? ` — ${s.relation}` : ""}${s.mbti ? ` [MBTI: ${s.mbti}]` : ""}${s.description ? `\n  설명: ${s.description}` : ""}`).join("")}` : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}${getStoryBible()}${charHint}\n\n위 로그라인의 인물들을 Egri-Hauge-Truby-Vogler-Jung-Maslow-Stanislavski 이론으로 깊이 발굴하고 구조화하세요. 시놉시스가 있다면 그 방향의 인물 이름·설정을 따르세요.`;
    try { const data = await callClaude(apiKey, CHARACTER_DEV_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, CharacterDevSchema, "character"); setCharDevResult(data); trackCreditUsage("캐릭터 설계", 3); if (treatmentResult) setTreatmentStale(true); if (beatSheetResult) setBeatSheetStale(true); if (scenarioDraftResult) setScenarioDraftStale(true); await autoSave(); }
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
    // Stage 4에서 선택한 서사 프레임워크를 트리트먼트에도 그대로 사용
    const fw = NARRATIVE_FRAMEWORKS.find(f => f.id === selectedFramework);
    const structureLabel = fw
      ? `${fw.label} (${fw.ref}) — ${fw.instruction}`
      : "3막 구조 (Field)";
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
      charBlock = [`주인공: ${proto.name || "미정"} (${proto.role || "역할 미정"})`, proto.want ? `  - 외적 목표(Want): ${proto.want}` : "", proto.need ? `  - 내적 욕구(Need): ${proto.need}` : "", proto.flaw ? `  - 핵심 결함: ${proto.flaw}` : "", ...treatmentChars.supporting.filter((s) => s.name?.trim()).map((s) => `조력/적대 인물: ${s.name} (${s.role}) — ${s.relation}${s.mbti ? ` [MBTI: ${s.mbti}]` : ""}${s.description ? `\n  설명: ${s.description}` : ""}`)].filter(Boolean).join("\n");
    }
    const storyBible = getStoryBible();
    const genreContext = result?.detected_genre ? `\n로그라인 분석 감지 장르: ${result.detected_genre}` : "";
    const structurePlotPoints = structureResult?.plot_points?.length
      ? `\n\n확정된 플롯 포인트 (이 구조를 따를 것):\n${structureResult.plot_points.map(p => `  ${p.name}: ${p.description || ""}`).join("\n")}`
      : "";
    const genreHint = GENRE_BEAT_HINTS[genre] || "";
    // Stage 2 전문가 패널 결과 반영
    const expertCtx = expertPanelResult ? (() => {
      const ep = [];
      if (expertPanelResult.consensus) ep.push(`전문가 합의: ${expertPanelResult.consensus}`);
      if (expertPanelResult.key_concern) ep.push(`핵심 우려: ${expertPanelResult.key_concern}`);
      if (expertPanelResult.development_direction) ep.push(`발전 방향: ${expertPanelResult.development_direction}`);
      return ep.length > 0 ? `\n\n[Stage 2 전문가 패널 분석 — 이 방향성을 트리트먼트에 반영할 것]\n${ep.join("\n")}` : "";
    })() : "";
    // Stage 2 테마 분석 반영
    const themeCtx = themeResult ? (() => {
      const th = [];
      if (themeResult.controlling_idea) th.push(`컨트롤링 아이디어: ${themeResult.controlling_idea}`);
      if (themeResult.thematic_question) th.push(`테마 질문: ${themeResult.thematic_question}`);
      if (themeResult.moral_premise?.statement) th.push(`도덕적 전제: ${themeResult.moral_premise.statement}`);
      return th.length > 0 ? `\n\n[테마 분석 결과 — 트리트먼트 주제의식에 반영]\n${th.join("\n")}` : "";
    })() : "";
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n장르: ${genreLabel}${genreContext}\n서사 구조: ${structureLabel}\n\n등장인물 정보:\n${charBlock}${storyBible}${expertCtx}${themeCtx}${structurePlotPoints}${genreHint ? `\n\n${genreHint}` : ""}\n\n위 정보를 바탕으로 완성도 높은 트리트먼트를 한국어로 작성해주세요. 시놉시스와 플롯 포인트가 있다면 반드시 그 방향을 따르세요. 등장인물 이름·배경·핵심 장면을 시놉시스와 일치시키세요.`;
    try {
      const text = await callClaudeText(apiKey, TREATMENT_SYSTEM_PROMPT, msg, 10000, "claude-sonnet-4-6", ctrl.signal, "treatment");
      setTreatmentResult(text);
      setTreatmentStale(false);
      if (beatSheetResult) setBeatSheetStale(true);
      if (scenarioDraftResult) setScenarioDraftStale(true);
      setTreatmentCtx({
        char: !!charDevResult?.protagonist,
        synopsis: !!(pipelineResult || synopsisResults),
        plotPoints: !!structureResult?.plot_points?.length,
        genre: genre !== "auto" ? genreLabel : null,
        structure: structureLabel,
      });
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
    try { const data = await callClaude(apiKey, PIPELINE_REFINE_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, null, "pipeline"); pushHistory(setPipelineHistory, pipelineResult, "synopsis"); setPipelineResult(data); if (treatmentResult) setTreatmentStale(true); if (beatSheetResult) setBeatSheetStale(true); if (scenarioDraftResult) setScenarioDraftStale(true); setPipelineFeedback(""); await autoSave(); }
    catch (err) { if (err.name !== "AbortError") alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요.")); }
    finally { setPipelineRefineLoading(false); clearController("pipelineRefine"); }
  };

  // ── Treatment 피드백 다듬기 ──
  const refineTreatment = async () => {
    if (!treatmentResult || !treatmentFeedback.trim() || !apiKey) return;
    const ctrl = makeController("treatmentRefine");
    setTreatmentRefineLoading(true);
    const beforeText = getEffective("treatment", treatmentResult);
    setTreatmentBefore(beforeText);
    setShowTreatmentBefore(false);
    const effective = getEffective("treatment", treatmentResult);
    const msg = `원본 로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}${getStoryBible()}\n\n── 현재 트리트먼트 ──\n${effective.slice(0, 4000)}\n\n── 작가 피드백 ──\n${treatmentFeedback.trim()}\n\n위 피드백을 반영하여 트리트먼트를 수정하세요. 피드백이 언급하지 않은 부분은 그대로 유지하세요.`;
    try {
      const text = await callClaudeText(apiKey, TREATMENT_SYSTEM_PROMPT, msg, 10000, "claude-sonnet-4-6", ctrl.signal, "treatment");
      pushHistory(setTreatmentHistory, treatmentResult, "treatment");
      setTreatmentResult(text);
      setTreatmentStale(false);
      if (beatSheetResult) setBeatSheetStale(true);
      if (scenarioDraftResult) setScenarioDraftStale(true);
      setTreatmentFeedback("");
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요."));
    } finally { setTreatmentRefineLoading(false); clearController("treatmentRefine"); }
  };

  // ── 비트 시트 피드백 다듬기 ──
  const refineBeatSheet = async () => {
    if (!beatSheetResult || !beatSheetFeedback.trim() || !apiKey) return;
    const ctrl = makeController("beatSheetRefine");
    setBeatSheetRefineLoading(true);
    setBeatSheetBefore(JSON.stringify(beatSheetResult));
    setShowBeatSheetBefore(false);
    const beatsText = (beatSheetResult.beats || []).map((b) =>
      `${b.name_en || b.id}. ${b.name_kr || ""} (p.${b.page}): ${b.summary || ""}`
    ).join("\n");
    const msg = `로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}${getStoryBible()}\n\n── 현재 비트 시트 ──\n${beatsText.slice(0, 3000)}\n\n── 작가 피드백 ──\n${beatSheetFeedback.trim()}\n\n위 피드백을 반영하여 비트 시트를 수정하세요. 15개 비트 구조를 유지하면서 피드백이 요청한 내용만 수정하세요.`;
    try {
      const result = await callClaude(apiKey, BEAT_SHEET_SYSTEM_PROMPT, msg, 6000, "claude-sonnet-4-6", ctrl.signal, "beat_sheet");
      pushHistory(setBeatSheetHistory, beatSheetResult, null);
      setBeatSheetResult(result);
      setBeatSheetFeedback("");
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") alert("비트 시트 다듬기 중 오류: " + (err.message || "다시 시도해주세요."));
    } finally { setBeatSheetRefineLoading(false); clearController("beatSheetRefine"); }
  };

  // ── 시나리오 초고 피드백 다듬기 ──
  const refineScenarioDraft = async () => {
    if (!scenarioDraftResult || !scenarioDraftFeedback.trim() || !apiKey) return;
    const ctrl = makeController("scenarioRefine");
    setScenarioDraftRefineLoading(true);
    setScenarioDraftBefore(scenarioDraftResult);
    setShowScenarioDraftBefore(false);
    const msg = `원본 로그라인: "${logline.trim()}"\n포맷: ${getDurText()}${getCustomContext()}\n\n── 현재 시나리오 초고 (일부) ──\n${scenarioDraftResult.slice(0, 5000)}\n\n── 작가 피드백 ──\n${scenarioDraftFeedback.trim()}\n\n위 피드백을 반영하여 시나리오를 수정하세요. 표준 시나리오 포맷(씬 헤더·액션라인·대사)을 유지하고, 피드백이 언급하지 않은 부분은 최대한 그대로 유지하세요.`;
    try {
      const text = await callClaudeText(apiKey, SCENARIO_DRAFT_SYSTEM_PROMPT, msg, 8000, "claude-sonnet-4-6", ctrl.signal, "scenario");
      pushHistory(setScenarioDraftHistory, scenarioDraftResult, null);
      setScenarioDraftResult(decodeHtmlEntities(text));
      setScenarioDraftFeedback("");
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요."));
    } finally { setScenarioDraftRefineLoading(false); clearController("scenarioRefine"); }
  };

  // ── 시나리오 고쳐쓰기: 초고 진단 ──
  const generateRewriteDiag = async () => {
    if (!scenarioDraftResult || !apiKey) return;
    const ctrl = makeController("rewriteDiag");
    setRewriteDiagLoading(true);
    setRewriteDiagError("");
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n\n── 시나리오 초고 ──\n${scenarioDraftResult.slice(0, 8000)}\n\n위 초고를 분석하고 고쳐쓰기 우선순위를 제시하세요.`;
    try {
      const data = await callClaude(apiKey, REWRITE_DIAG_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, null, "rewrite_diag");
      setRewriteDiagResult(data);
      await autoSave();
    } catch (e) {
      if (e.name !== "AbortError") setRewriteDiagError(e.message || "분석 중 오류가 발생했습니다.");
    } finally { setRewriteDiagLoading(false); clearController("rewriteDiag"); }
  };

  // ── 시나리오 고쳐쓰기: 부분 재작성 ──
  const generatePartialRewrite = async () => {
    if (!scenarioDraftResult || !partialRewriteInstruction.trim() || !apiKey) return;
    const ctrl = makeController("partialRewrite");
    setPartialRewriteLoading(true);
    setPartialRewriteError("");
    const msg = `로그라인: "${logline.trim()}"\n\n── 시나리오 초고 ──\n${scenarioDraftResult.slice(0, 8000)}\n\n── 재작성 지시 ──\n${partialRewriteInstruction.trim()}\n\n위 지시에 따라 해당 부분을 재작성하세요.`;
    try {
      const text = await callClaudeText(apiKey, PARTIAL_REWRITE_SYSTEM_PROMPT, msg, 4000, "claude-sonnet-4-6", ctrl.signal, "partial_rewrite");
      setPartialRewriteResult(text);
      await autoSave();
    } catch (e) {
      if (e.name !== "AbortError") setPartialRewriteError(e.message || "재작성 중 오류가 발생했습니다.");
    } finally { setPartialRewriteLoading(false); clearController("partialRewrite"); }
  };

  // ── 시나리오 고쳐쓰기: 전체 개고 ──
  const generateFullRewrite = async () => {
    if (!scenarioDraftResult || !apiKey) return;
    const ctrl = makeController("fullRewrite");
    setFullRewriteLoading(true);
    setFullRewriteError("");
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const diagSummary = rewriteDiagResult
      ? `\n\n── 진단 결과 (반영 필수) ──\n${(rewriteDiagResult.priority_fixes || []).slice(0, 3).map((f) => `• ${f.category}: ${f.issue} → ${f.fix_direction}`).join("\n")}`
      : "";
    const notes = fullRewriteNotes.trim() ? `\n\n── 작가 메모 ──\n${fullRewriteNotes.trim()}` : "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}${diagSummary}${notes}\n\n── 개고할 초고 ──\n${scenarioDraftResult.slice(0, 8000)}\n\n위 초고를 전체적으로 개고하세요.`;
    try {
      const text = await callClaudeText(apiKey, FULL_REWRITE_SYSTEM_PROMPT, msg, 10000, "claude-sonnet-4-6", ctrl.signal, "full_rewrite");
      setFullRewriteResult(text);
      await autoSave();
    } catch (e) {
      if (e.name !== "AbortError") setFullRewriteError(e.message || "개고 중 오류가 발생했습니다.");
    } finally { setFullRewriteLoading(false); clearController("fullRewrite"); }
  };

  // ── 캐릭터 피드백 다듬기 ──
  const refineCharDev = async () => {
    if (!charDevResult || !charDevFeedback.trim() || !apiKey) return;
    const ctrl = makeController("charDevRefine");
    setCharDevRefineLoading(true);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const p = charDevResult.protagonist || {};
    const currentProfile = `주인공: ${p.name_suggestion || ""}, Want: ${p.want || ""}, Need: ${p.need || ""}, Ghost: ${p.ghost || ""}, Lie: ${p.lie_they_believe || ""}, Flaw: ${p.flaw || ""}, Arc: ${p.arc_type || ""}`;
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n포맷: ${getDurText()}${getCustomContext()}${getStoryBible()}\n\n── 현재 캐릭터 프로필 ──\n${currentProfile}\n\n── 작가 피드백 ──\n${charDevFeedback.trim()}\n\n위 피드백을 반영하여 캐릭터 분석을 수정하세요. 피드백이 언급하지 않은 부분은 그대로 유지하세요.`;
    try {
      const data = await callClaude(apiKey, CHARACTER_DEV_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", ctrl.signal, CharacterDevSchema, "character");
      pushHistory(setCharDevHistory, charDevResult, "character");
      setCharDevResult(data);
      if (treatmentResult) setTreatmentStale(true);
      if (beatSheetResult) setBeatSheetStale(true);
      if (scenarioDraftResult) setScenarioDraftStale(true);
      setCharDevFeedback("");
      await autoSave();
    } catch (err) {
      if (err.name !== "AbortError") alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요."));
    } finally { setCharDevRefineLoading(false); clearController("charDevRefine"); }
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
    if (stageId === "8") {
      if (rewriteDiagResult || partialRewriteResult || fullRewriteResult) return "done";
      if (rewriteDiagLoading || partialRewriteLoading || fullRewriteLoading) return "active";
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
    if (stageId === "8") {
      return [rewriteDiagResult, partialRewriteResult || fullRewriteResult].filter(Boolean).length;
    }
    if (stageId === "7") {
      return [scriptCoverageResult || valuationResult].filter(Boolean).length;
    }
    return 0;
  }
  const STAGE_TOTALS = { "1": 1, "2": 1, "3": 1, "4": 2, "5": 3, "6": 1, "8": 2, "7": 1 };

  // ── Error display helper ──
  function ErrorMsg({ msg, onRetry }) {
    if (!msg) return null;
    return (
      <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <span style={{ flex: 1, lineHeight: 1.6 }}>{msg}</span>
        {onRetry && (
          <button onClick={onRetry} style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(232,93,117,0.4)", background: "rgba(232,93,117,0.1)", color: "#E85D75", fontSize: 11, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
            다시 시도
          </button>
        )}
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

  // ── Tier helpers ──
  const tier = user?.tier || "basic";
  const isAdmin = tier === "admin";
  const isPro = tier === "admin" || tier === "pro";
  const isBlocked = tier === "blocked";
  const hasOwnApiKey = !!(apiKey && apiKey !== "__server__");
  const canUseAllStages = isPro || hasOwnApiKey;
  const cc = (cost) => (hasOwnApiKey || isDemoMode) ? 0 : cost;

  const TIER_LABEL = { admin: "관리자", pro: "프리미엄", basic: "기본", blocked: "차단" };
  const TIER_COLOR = { admin: "#C8A84B", pro: "#60A5FA", basic: "var(--c-tx-35)", blocked: "#E85D75" };

  // ── 변경 알림 헬퍼 (hooks: 조기 return 이전에 위치해야 함) ──
  const addActivity = useCallback((type, actorName, actorColor, detail, stageId = null) => {
    const entry = {
      id: Date.now() + Math.random(),
      type,        // "comment"|"assign"|"scene_gen"|"beat_edit"|"generate"|"import"
      actorName: actorName || "나",
      actorColor: actorColor || "#C8A84B",
      detail,
      stageId,
      timestamp: Date.now(),
    };
    setActivityLog(prev => [entry, ...prev].slice(0, 100)); // 최대 100개 유지
  }, []);

  // ── 개정본 시작 (hooks: 조기 return 이전에 위치해야 함) ──
  const startNewRevision = useCallback((name, snapshotText) => {
    const nextId = revisions.length + 1;
    const revColor = REVISION_COLORS[Math.min(nextId - 1, REVISION_COLORS.length - 1)];
    const revision = {
      id: nextId,
      name: name || revColor.name,
      shortName: revColor.shortName,
      color: revColor.color,
      snapshot: snapshotText || "",
      createdAt: Date.now(),
    };
    setRevisions(prev => [...prev, revision]);
    setCurrentRevisionId(nextId);
  }, [revisions]);

  // ── Auth guard ──
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={28} color="#C8A84B" />
      </div>
    );
  }
  if (!user && !isDemoMode) {
    return <LoginScreen onDemo={activateDemo} authError={authError} />;
  }
  if (isBlocked) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-main)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans KR', sans-serif", gap: 16 }}>
        <div style={{ fontSize: 40 }}>🚫</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>접근이 차단된 계정입니다</div>
        <div style={{ fontSize: 13, color: "var(--c-tx-40)" }}>관리자에게 문의하세요.</div>
        <button onClick={handleLogout} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 10, border: "1px solid var(--c-bd-4)", background: "transparent", color: "var(--c-tx-40)", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}>
          로그아웃
        </button>
      </div>
    );
  }

  // 각 스테이지 완료 상태 요약 (사이드바 + 대시보드 표시용)
  const stageResultSummary = {
    "1": result ? `${qualityScore}점` : null,
    "2": expertPanelResult ? "패널 완료" : (
      (mythMapResult || barthesCodeResult || koreanMythResult || academicResult) ? "분석 완료" : null
    ),
    "3": charDevResult ? (charDevResult.protagonist?.name ? `${charDevResult.protagonist.name}` : "캐릭터 완료") : null,
    "4": pipelineResult ? (pipelineResult.direction_title ? pipelineResult.direction_title.slice(0, 12) : "시놉시스 완료") : (synopsisResults ? "방향 선택 완료" : null),
    "5": treatmentResult ? "트리트먼트 완료" : (beatSheetResult ? "비트시트 완료" : null),
    "6": scenarioDraftResult ? "초고 완료" : null,
    "7": scriptCoverageResult ? (scriptCoverageResult.recommendation || "커버리지 완료") : null,
    "8": fullRewriteResult ? "전면 개고 완료" : (rewriteDiagResult ? "진단 완료" : null),
  };

  // 공유용 snapshot (logline + stage1 분석 + script coverage)
  const shareSnapshot = {
    result,
    scriptCoverageResult,
    charDevResult,
  };

  // ── 팀 권한 헬퍼 ──
  const currentWorkingMember = currentWorkingAs
    ? teamMembers.find(m => m.id === currentWorkingAs) || null
    : null;
  const isOwner = !currentWorkingAs || currentWorkingMember?.role === "메인작가";
  const isReadOnly = currentWorkingMember?.role === "작가실장";
  // beatId: null → 스테이지 전체 편집 가능 여부 / 있으면 해당 비트 편집 가능 여부
  const getEditPermission = (beatId = null) => {
    if (!currentWorkingAs) return true;
    if (!currentWorkingMember) return true;
    if (currentWorkingMember.role === "메인작가") return true;
    if (currentWorkingMember.role === "작가실장") return false;
    if (currentWorkingMember.role === "보조작가") {
      if (beatId == null) return true; // 보조작가는 일부 편집 가능
      return sceneAssignments[beatId] === currentWorkingAs;
    }
    return true;
  };

  const loglineCtxValue = {
    // 입력
    logline, setLogline, genre, setGenre,
    // 인증/API
    apiKey, isDemoMode, hasOwnApiKey, canUseAllStages,
    user, credits, cc,
    // UI
    isMobile, darkMode,
    // 교육 모드
    eduMode, setEduMode,
    // 스테이지 네비게이션
    currentStage, setCurrentStage, advanceToStage, stageRefs,
    // 스테이지 상태 헬퍼
    getStageStatus, getStageDoneCount, STAGE_TOTALS, statusDotColor,
    // 액션
    showToast, openApplicationDoc, openPitchDeck, openStoryBibleDoc,
    generateMasterReport, masterReportResult, masterReportLoading, masterReportError,
    // 포맷 헬퍼
    getDurText, getCustomContext,
    // 스테이지 결과 요약 (사이드바 배지용)
    stageResultSummary,
    // 공유 snapshot
    shareSnapshot,
    // 기존 시나리오 참고
    referenceScenario, setReferenceScenario,
    referenceScenarioEnabled, setReferenceScenarioEnabled,
    referenceScenarioSummary,
    // 스토리 닥터
    showStoryDoctor, setShowStoryDoctor,
    // 역방향 임포트
    onReverseImport,
    reverseEntryStage,
    // 팀 협업
    teamMembers, setTeamMembers, sceneAssignments, setSceneAssignments,
    stageComments, setStageComments,
    currentWorkingAs, setCurrentWorkingAs,
    currentWorkingMember, isOwner, isReadOnly, getEditPermission,
    activityLog, addActivity,
    // 개정본 버전 관리
    revisions, setRevisions, currentRevisionId, setCurrentRevisionId,
    sceneRevisionMap, setSceneRevisionMap, startNewRevision,
    // 네트워크 상태
    isOnline,
  };

  return (
  <LoglineProvider value={loglineCtxValue}>
    <WelcomeModal />
    {confirmModal && (
      <ConfirmModal
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    )}
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* ─── Toast notifications ─── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

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
                    navigator.clipboard.writeText(sections.join("\n---\n\n")).then(() => showToast("success", "스토리 바이블이 클립보드에 복사되었습니다."));
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
              ) : savedProjects.map((proj) => {
                const stagesDone = [
                  { n: 1, label: "분석", done: !!proj.result },
                  { n: 2, label: "개념", done: !!(proj.academicResult || proj.mythMapResult || proj.expertPanelResult || proj.barthesCodeResult || proj.themeResult || proj.koreanMythResult) },
                  { n: 3, label: "캐릭터", done: !!(proj.shadowResult || proj.authenticityResult || proj.charDevResult || proj.valueChargeResult) },
                  { n: 4, label: "시놉시스", done: !!(proj.pipelineResult || proj.synopsisResults || proj.treatmentResult || proj.beatSheetResult) },
                ];
                const doneCount = stagesDone.filter(s => s.done).length;
                return (
                <div key={proj.id} style={{
                  padding: "12px 14px", borderRadius: 10, marginBottom: 6,
                  border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.02)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.title || "제목 없음"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                      {stagesDone.map(s => (
                        <span key={s.n} style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: s.done ? (s.n === 1 ? "rgba(200,168,75,0.15)" : s.n === 2 ? "rgba(167,139,250,0.15)" : s.n === 3 ? "rgba(96,165,250,0.15)" : "rgba(78,204,163,0.15)") : "rgba(var(--tw),0.04)",
                          color: s.done ? (s.n === 1 ? "#C8A84B" : s.n === 2 ? "#A78BFA" : s.n === 3 ? "#60A5FA" : "#4ECCA3") : "var(--c-tx-20)",
                          border: s.done ? "none" : "1px solid var(--c-bd-1)",
                        }}>
                          {s.n}. {s.label}
                        </span>
                      ))}
                      <span style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {new Date(proj.updatedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { exportProjectJson(); }} title="현재 작업 내보내기" style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.07)", color: "#C8A84B", cursor: "pointer", fontSize: 11 }}>↓ JSON</button>
                  <button onClick={() => loadProjectState(proj)} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.07)", color: "#4ECCA3", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>불러오기</button>
                  <button onClick={() => deleteProjectById(proj.id)} style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(232,93,117,0.2)", background: "rgba(232,93,117,0.05)", color: "#E85D75", cursor: "pointer", fontSize: 11 }}>삭제</button>
                </div>
                );
              })}
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
        position: "sticky", top: 0, zIndex: "var(--z-nav)",
        background: "var(--glass-modal)", backdropFilter: "var(--blur-micro)", WebkitBackdropFilter: "var(--blur-micro)",
        borderBottom: "1px solid var(--glass-bd-micro)",
        boxShadow: "0 1px 0 var(--glass-bd-nano), 0 4px 20px rgba(0,0,0,0.15)",
        height: 56,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 12px" : "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: "var(--text-main)", letterSpacing: -0.3 }}>Hello Loglines</div>
            {!isMobile && <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: -1 }}>시나리오 개발 워크스테이션</div>}
          </div>
          {isDemoMode && (
            <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#FFD166", background: "rgba(255,209,102,0.12)", border: "1px solid rgba(255,209,102,0.3)", borderRadius: 6, padding: "3px 8px", letterSpacing: 1 }}>DEMO</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Save status */}
          {saveStatus && (
            <span style={{
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
              color: saveStatus === "saved" ? "#4ECCA3" : "var(--c-tx-35)",
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 6,
              background: saveStatus === "saved" ? "rgba(78,204,163,0.08)" : "var(--glass-nano)",
              border: `1px solid ${saveStatus === "saved" ? "rgba(78,204,163,0.2)" : "var(--glass-bd-nano)"}`,
              transition: "all 0.2s var(--ease-spring)",
            }}>
              {saveStatus === "saving" ? (
                <>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  {!isMobile && "저장 중..."}
                </>
              ) : (
                <>
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  {!isMobile && "저장됨"}
                </>
              )}
            </span>
          )}
          {/* 취소 — 로딩 중일 때만 */}
          {isAnyLoading && (
            <button onClick={() => { Object.keys(abortControllersRef.current).forEach(k => abortControllersRef.current[k].abort()); abortControllersRef.current = {}; }}
              style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", border: "1px solid rgba(232,93,117,0.35)", background: "rgba(232,93,117,0.08)", color: "#E85D75", display: "flex", alignItems: "center", gap: 4 }}>
              취소
            </button>
          )}
          {/* 내보내기 드롭다운 — result 있을 때만 */}
          {result && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowExportMenu(v => !v)} style={{
                padding: "5px 11px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)",
                color: "var(--c-tx-55)", display: "flex", alignItems: "center", gap: 5,
              }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                내보내기 <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
              </button>
              {showExportMenu && (
                <>
                  <div onClick={() => setShowExportMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100, background: "var(--glass-modal)", border: "1px solid var(--glass-bd-base)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 var(--glass-bd-top)", minWidth: 160, padding: "4px 0", overflow: "hidden" }}>
                    <button onClick={() => { setShowStoryBible(true); setShowExportMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#4ECCA3", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      스토리 바이블
                    </button>
                    <button onClick={() => { handleExportPdf(); setShowExportMenu(false); }} disabled={pdfLoading} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: pdfLoading ? "default" : "pointer", fontSize: 12, color: pdfLoading ? "var(--c-tx-25)" : "#60A5FA", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      {pdfLoading ? "PDF 생성 중..." : "PDF"}
                    </button>
                    <button onClick={() => { const s = logline.slice(0,20).replace(/\s+/g,"-").replace(/[^\w가-힣-]/g,""); exportToMarkdown({ logline, genre, result, charDevResult, synopsisResults, pipelineResult, treatmentResult, beatSheetResult, scenarioDraftResult, scriptCoverageResult, valuationResult }, `hellologline-${s||"report"}`); showToast("success","Markdown 파일이 다운로드되었습니다."); setShowExportMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#A78BFA", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Markdown
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {/* 공유하기 */}
          {logline.trim() && result && (
            <button
              onClick={handleShare}
              disabled={shareLinkLoading}
              title="공유 링크 복사"
              style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.35)", background: "rgba(78,204,163,0.07)", color: "#4ECCA3", cursor: shareLinkLoading ? "wait" : "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              {shareLinkLoading
                ? <span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(78,204,163,0.3)", borderTop: "1.5px solid #4ECCA3", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              }
              {!isMobile && "공유"}
            </button>
          )}
          {/* 새 프로젝트 */}
          <button
            onClick={startNewProject}
            title="새 프로젝트 시작"
            style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              border: "1px solid rgba(200,168,75,0.35)",
              background: "rgba(200,168,75,0.10)",
              color: "var(--accent-gold)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              fontFamily: "'Noto Sans KR', sans-serif",
              transition: "all 0.18s var(--ease-spring)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,168,75,0.18)"; e.currentTarget.style.borderColor = "rgba(200,168,75,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(200,168,75,0.10)"; e.currentTarget.style.borderColor = "rgba(200,168,75,0.35)"; }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {!isMobile && "새 프로젝트"}
          </button>
          {/* 프로젝트 */}
          <button onClick={openProjects} title="프로젝트" style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--c-tx-45)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            {!isMobile && "프로젝트"}
          </button>
          {/* 기록 */}
          <button onClick={() => setShowHistory(true)} title="기록" style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)", color: "var(--c-tx-45)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
            <SvgIcon d={ICON.history} size={13} />
            {!isMobile && `기록${history.length > 0 ? ` (${history.length})` : ""}`}
            {isMobile && history.length > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3" }}>{history.length}</span>}
          </button>
          {/* 크레딧 */}
          {user && credits !== null && (
            <button onClick={() => setShowCreditModal(true)} title="크레딧 충전" style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${credits <= 5 ? "rgba(232,93,117,0.5)" : "rgba(167,139,250,0.35)"}`, background: credits <= 5 ? "rgba(232,93,117,0.1)" : "rgba(167,139,250,0.08)", color: credits <= 5 ? "#E85D75" : "#A78BFA", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              ⚡ {creditPurchasing ? "..." : `${credits}cr`}
            </button>
          )}
          {/* API 키 */}
          <button onClick={() => setShowApiKeyModal(true)} title="API 키 설정" style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: apiKey ? "rgba(200,168,75,0.08)" : "rgba(232,93,117,0.1)", color: apiKey ? "rgba(200,168,75,0.7)" : "#E85D75", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <SvgIcon d={ICON.key} size={14} />
          </button>
          {/* 다크모드 */}
          {/* 교육 모드 토글 */}
          <button
            onClick={() => { setEduMode(v => !v); }}
            title={eduMode ? "교육 모드 ON — 클릭하여 끄기" : "교육 모드 OFF — 클릭하여 켜기"}
            style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              border: eduMode ? "1px solid rgba(167,139,250,0.5)" : "1px solid var(--c-bd-3)",
              background: eduMode ? "rgba(167,139,250,0.12)" : "var(--c-card-1)",
              color: eduMode ? "#A78BFA" : "var(--c-tx-40)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s",
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
            </svg>
            {!isMobile && (eduMode ? "교육 모드" : "교육 모드")}
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: eduMode ? "#A78BFA" : "var(--c-bd-5)", flexShrink: 0 }} />
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            style={{
              padding: "5px 8px", borderRadius: 8, fontSize: 14, lineHeight: 1,
              border: "1px solid var(--glass-bd-base)", background: "var(--glass-nano)",
              color: darkMode ? "#C8A84B" : "var(--c-tx-50)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              width: 30, height: 28,
              transition: "all 0.2s var(--ease-spring)",
              boxShadow: "inset 0 1px 0 var(--glass-bd-nano)",
            }}
          >
            {darkMode ? (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          {/* 유저 아바타 → 드롭다운 */}
          {user && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowUserMenu(v => !v)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--c-bd-4)" }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,168,75,0.2)", border: "1px solid rgba(200,168,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#C8A84B" }}>
                    {user.name?.[0] || "?"}
                  </div>
                )}
              </button>
              {showUserMenu && (
                <>
                  <div onClick={() => setShowUserMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100, background: "var(--bg-nav)", border: "1px solid var(--c-bd-2)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 160, padding: "8px 0", overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid var(--c-bd-1)" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)", marginBottom: 2 }}>{user.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TIER_COLOR[tier], fontFamily: "'JetBrains Mono', monospace" }}>{TIER_LABEL[tier]}</div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => { setShowAdminPanel(true); setShowUserMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#C8A84B", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                        관리자 패널
                      </button>
                    )}
                    <button onClick={() => { handleLogout(); setShowUserMenu(false); }} style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--c-tx-45)", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}>
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ─── Progress bar (모바일 전용) ─── */}
      <div style={{
        display: isMobile ? "flex" : "none", justifyContent: "center", alignItems: "center",
        padding: "14px 24px 20px",
        background: "var(--glass-modal)", backdropFilter: "var(--blur-micro)", WebkitBackdropFilter: "var(--blur-micro)",
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
                <button onClick={() => { setCurrentStage(s.id); }} title={s.name} style={{
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

      {/* ─── 첫 방문 웰컴 오버레이 ─── */}
      {showWelcome && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 16 : 24 }}>
          <div style={{ maxWidth: 600, width: "100%", background: "var(--bg-surface)", border: "1px solid rgba(78,204,163,0.25)", borderRadius: 20, padding: isMobile ? "24px 20px" : "36px 40px", overflowY: "auto", maxHeight: "90vh" }}>
            {/* 헤더 */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "var(--text-main)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.5, marginBottom: 8 }}>
                Hello<span style={{ color: "#4ECCA3" }}>Logline</span>
              </div>
              <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--c-tx-55)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
                로그라인 한 줄로 시작하는 <strong style={{ color: "var(--c-tx-75)" }}>8단계 시나리오 개발 워크스테이션</strong><br />
                아리스토텔레스부터 블레이크 스나이더까지, 학술 이론이 AI로 작동합니다
              </div>
            </div>

            {/* 8단계 파이프라인 */}
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

            {/* 주요 기능 포인트 */}
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

            {/* 안내 */}
            <div style={{ marginBottom: 20, padding: "10px 14px", borderRadius: 8, background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.15)" }}>
              <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>
                💡 <strong style={{ color: "var(--c-tx-65)" }}>Anthropic API 키</strong>가 필요합니다. <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: "#4ECCA3", textDecoration: "none" }}>console.anthropic.com</a>에서 무료로 발급받으세요. 키는 이 브라우저에만 저장됩니다.
              </div>
            </div>

            {/* 버튼 */}
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
      )}

      {/* ─── Sidebar + Stage Layout ─── */}
      <div ref={mainContentRef} style={{ width: "100%", boxSizing: "border-box" }}>

          {/* ── 데모 모드 배너 ── */}
          {isDemoMode && (
            <div style={{ maxWidth: isMobile ? "100%" : 990, margin: "0 auto", padding: isMobile ? "12px 12px 0" : "16px 28px 0" }}>
              <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 12, background: "rgba(255,209,102,0.07)", border: "1px solid rgba(255,209,102,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🎬</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#FFD166", marginBottom: 2 }}>데모 모드 — 샘플 분석 결과 체험 중</div>
                    <div style={{ fontSize: 11, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}>로그라인: "{DEMO_LOGLINE.slice(0, 40)}…" — 8단계 결과를 자유롭게 둘러보세요.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => { deactivateDemo(); setShowApiKeyModal(true); }}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#FFD166", color: "#0d0d1a", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}
                  >
                    내 API 키로 시작
                  </button>
                  <button
                    onClick={deactivateDemo}
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,209,102,0.3)", background: "transparent", color: "#FFD166", fontSize: 11, cursor: "pointer" }}
                  >
                    데모 종료
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 새로고침 복구 배너 ── */}
          {showRecoveryBanner && !isDemoMode && (
            <div style={{ maxWidth: isMobile ? "100%" : 990, margin: "0 auto", padding: isMobile ? "12px 12px 0" : "16px 28px 0" }}>
              <div style={{
                marginBottom: 16, padding: "13px 16px 13px 18px",
                borderRadius: 12, background: "rgba(78,204,163,0.07)",
                border: "1px solid rgba(78,204,163,0.25)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#4ECCA3", marginBottom: 2 }}>이전 작업이 저장되어 있습니다</div>
                    <div style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                      새로고침 전 작업을 이어서 진행하려면 프로젝트를 불러오세요.
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                  <button
                    onClick={() => { setShowRecoveryBanner(false); openProjects(); }}
                    style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#4ECCA3", color: "#0d0d1a", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: "nowrap" }}
                  >
                    프로젝트 불러오기
                  </button>
                  <button
                    onClick={() => setShowRecoveryBanner(false)}
                    style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.25)", background: "transparent", color: "var(--c-tx-40)", fontSize: 11, cursor: "pointer", lineHeight: 1 }}
                    title="닫기"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          <SidebarLayout
            isMobile={isMobile}
            stageProps={{
              renderStage: (stageId) => {
                switch (stageId) {
                  case "dashboard": return <DashboardView />;
                  case "1": return (
                    <Stage1Content
                      result={result}
                      setResult={setResult}
                      loading={loading}
                      error={error}
                      analyze={analyze}
                      compareMode={compareMode}
                      setCompareMode={setCompareMode}
                      logline2={logline2}
                      setLogline2={setLogline2}
                      result2={result2}
                      loading2={loading2}
                      selectedDuration={selectedDuration}
                      setSelectedDuration={setSelectedDuration}
                      customTheme={customTheme}
                      setCustomTheme={setCustomTheme}
                      customDurationText={customDurationText}
                      setCustomDurationText={setCustomDurationText}
                      customFormatLabel={customFormatLabel}
                      setCustomFormatLabel={setCustomFormatLabel}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      insightResult={insightResult}
                      insightLoading={insightLoading}
                      insightError={insightError}
                      generateInsight={generateInsight}
                      earlyCoverageResult={earlyCoverageResult}
                      setEarlyCoverageResult={setEarlyCoverageResult}
                      earlyCoverageLoading={earlyCoverageLoading}
                      earlyCoverageError={earlyCoverageError}
                      analyzeEarlyCoverage={analyzeEarlyCoverage}
                      setStoryFixes={setStoryFixes}
                      setStoryPivots={setStoryPivots}
                      setAiImprovement={setAiImprovement}
                      academicResult={academicResult}
                      apiKey={apiKey}
                      serverHasKey={serverHasKey}
                      referenceScenario={referenceScenario}
                      setReferenceScenario={setReferenceScenario}
                      referenceScenarioEnabled={referenceScenarioEnabled}
                      setReferenceScenarioEnabled={setReferenceScenarioEnabled}
                      referenceScenarioSummary={referenceScenarioSummary}
                      extractLoglineFromScenario={extractLoglineFromScenario}
                      extractLoglineLoading={extractLoglineLoading}
                      extractLoglineError={extractLoglineError}
                      summarizeReferenceScenario={summarizeReferenceScenario}
                      summarizeLoading={summarizeLoading}
                      summarizeError={summarizeError}
                    />
                  );
                  case "2": return (
                    <Stage2Content
                      expertPanelResult={expertPanelResult}
                      setExpertPanelResult={setExpertPanelResult}
                      expertPanelLoading={expertPanelLoading}
                      expertPanelError={expertPanelError}
                      runExpertPanel={runExpertPanel}
                      narrativeTheoryDone={narrativeTheoryDone}
                      narrativeTheoryLoading={narrativeTheoryLoading}
                      analyzeNarrativeTheory={analyzeNarrativeTheory}
                      academicResult={academicResult}
                      mythMapResult={mythMapResult}
                      barthesCodeResult={barthesCodeResult}
                      koreanMythResult={koreanMythResult}
                      themeResult={themeResult}
                    />
                  );
                  case "3": return (
                    <Stage3Content
                      result={result}
                      charGuide={charGuide}
                      setCharGuide={setCharGuide}
                      charGuideLoading={charGuideLoading}
                      charGuideError={charGuideError}
                      generateCharGuide={generateCharGuide}
                      showManualCharInput={showManualCharInput}
                      setShowManualCharInput={setShowManualCharInput}
                      treatmentChars={treatmentChars}
                      setTreatmentChars={setTreatmentChars}
                      shadowResult={shadowResult}
                      setShadowResult={setShadowResult}
                      shadowLoading={shadowLoading}
                      shadowError={shadowError}
                      analyzeShadow={analyzeShadow}
                      authenticityResult={authenticityResult}
                      setAuthenticityResult={setAuthenticityResult}
                      authenticityLoading={authenticityLoading}
                      authenticityError={authenticityError}
                      analyzeAuthenticity={analyzeAuthenticity}
                      charDevResult={charDevResult}
                      setCharDevResult={setCharDevResult}
                      charDevLoading={charDevLoading}
                      charDevError={charDevError}
                      charDevFeedback={charDevFeedback}
                      setCharDevFeedback={setCharDevFeedback}
                      charDevRefineLoading={charDevRefineLoading}
                      charDevHistory={charDevHistory}
                      setCharDevHistory={setCharDevHistory}
                      analyzeCharacterDev={analyzeCharacterDev}
                      charAllDone={charAllDone}
                      editingCharacter={editingCharacter}
                      setEditingCharacter={setEditingCharacter}
                      charEditDraft={charEditDraft}
                      setCharEditDraft={setCharEditDraft}
                      writerEdits={writerEdits}
                      clearWriterEdit={clearWriterEdit}
                      setWriterEdit={setWriterEdit}
                      refineCharDev={refineCharDev}
                      undoHistory={undoHistory}
                    />
                  );
                  case "4": return (
                    <Stage4Content
                      result={result}
                      structureResult={structureResult}
                      setStructureResult={setStructureResult}
                      structureLoading={structureLoading}
                      structureError={structureError}
                      valueChargeResult={valueChargeResult}
                      setValueChargeResult={setValueChargeResult}
                      valueChargeLoading={valueChargeLoading}
                      valueChargeError={valueChargeError}
                      analyzeStructureAll={analyzeStructureAll}
                      structureAllLoading={structureAllLoading}
                      structureAllDone={structureAllDone}
                      comparableResult={comparableResult}
                      setComparableResult={setComparableResult}
                      comparableLoading={comparableLoading}
                      comparableError={comparableError}
                      analyzeComparableWorks={analyzeComparableWorks}
                      academicResult={academicResult}
                      mythMapResult={mythMapResult}
                      koreanMythResult={koreanMythResult}
                      expertPanelResult={expertPanelResult}
                      barthesCodeResult={barthesCodeResult}
                      shadowResult={shadowResult}
                      authenticityResult={authenticityResult}
                      charDevResult={charDevResult}
                      subtextResult={subtextResult}
                      themeResult={themeResult}
                      synopsisMode={synopsisMode}
                      setSynopsisMode={setSynopsisMode}
                      NARRATIVE_FRAMEWORKS={NARRATIVE_FRAMEWORKS}
                      selectedFramework={selectedFramework}
                      setSelectedFramework={setSelectedFramework}
                      frameworkInfoId={frameworkInfoId}
                      setFrameworkInfoId={setFrameworkInfoId}
                      directionCount={directionCount}
                      setDirectionCount={setDirectionCount}
                      generateSynopsis={generateSynopsis}
                      synopsisLoading={synopsisLoading}
                      synopsisError={synopsisError}
                      synopsisResults={synopsisResults}
                      selectedSynopsisIndex={selectedSynopsisIndex}
                      setSelectedSynopsisIndex={setSelectedSynopsisIndex}
                      selectedDuration={selectedDuration}
                      treatmentChars={treatmentChars}
                      pipelineResult={pipelineResult}
                      setPipelineResult={setPipelineResult}
                      pipelineHistory={pipelineHistory}
                      setPipelineHistory={setPipelineHistory}
                      editingSynopsis={editingSynopsis}
                      setEditingSynopsis={setEditingSynopsis}
                      synopsisEditDraft={synopsisEditDraft}
                      setSynopsisEditDraft={setSynopsisEditDraft}
                      writerEdits={writerEdits}
                      setWriterEdit={setWriterEdit}
                      clearWriterEdit={clearWriterEdit}
                      treatmentResult={treatmentResult}
                      setTreatmentStale={setTreatmentStale}
                      beatSheetResult={beatSheetResult}
                      setBeatSheetStale={setBeatSheetStale}
                      scenarioDraftResult={scenarioDraftResult}
                      setScenarioDraftStale={setScenarioDraftStale}
                      pipelineFeedback={pipelineFeedback}
                      setPipelineFeedback={setPipelineFeedback}
                      refinePipelineSynopsis={refinePipelineSynopsis}
                      pipelineRefineLoading={pipelineRefineLoading}
                      undoHistory={undoHistory}
                      episodeDesignResult={episodeDesignResult}
                      episodeDesignLoading={episodeDesignLoading}
                      episodeDesignError={episodeDesignError}
                      generateEpisodeDesign={generateEpisodeDesign}
                    />
                  );
                  case "5": return (
                    <Stage5Content
                      showTreatmentPanel={showTreatmentPanel}
                      setShowTreatmentPanel={setShowTreatmentPanel}
                      treatmentChars={treatmentChars}
                      setTreatmentChars={setTreatmentChars}
                      treatmentStructure={treatmentStructure}
                      setTreatmentStructure={setTreatmentStructure}
                      selectedFramework={selectedFramework}
                      NARRATIVE_FRAMEWORKS={NARRATIVE_FRAMEWORKS}
                      selectedDuration={selectedDuration}
                      pipelineResult={pipelineResult}
                      charDevResult={charDevResult}
                      treatmentResult={treatmentResult}
                      setTreatmentResult={setTreatmentResult}
                      treatmentLoading={treatmentLoading}
                      treatmentError={treatmentError}
                      treatmentStale={treatmentStale}
                      setTreatmentStale={setTreatmentStale}
                      treatmentHistory={treatmentHistory}
                      setTreatmentHistory={setTreatmentHistory}
                      generateTreatment={generateTreatment}
                      treatmentFeedback={treatmentFeedback}
                      setTreatmentFeedback={setTreatmentFeedback}
                      refineTreatment={refineTreatment}
                      treatmentRefineLoading={treatmentRefineLoading}
                      treatmentBefore={treatmentBefore}
                      showTreatmentBefore={showTreatmentBefore}
                      setShowTreatmentBefore={setShowTreatmentBefore}
                      editingTreatment={editingTreatment}
                      setEditingTreatment={setEditingTreatment}
                      treatmentEditDraft={treatmentEditDraft}
                      setTreatmentEditDraft={setTreatmentEditDraft}
                      writerEdits={writerEdits}
                      setWriterEdit={setWriterEdit}
                      setWriterEdits={setWriterEdits}
                      clearWriterEdit={clearWriterEdit}
                      treatmentCtx={treatmentCtx}
                      beatSheetResult={beatSheetResult}
                      setBeatSheetResult={setBeatSheetResult}
                      beatSheetLoading={beatSheetLoading}
                      beatSheetError={beatSheetError}
                      beatSheetStale={beatSheetStale}
                      setBeatSheetStale={setBeatSheetStale}
                      beatSheetHistory={beatSheetHistory}
                      setBeatSheetHistory={setBeatSheetHistory}
                      generateBeatSheet={generateBeatSheet}
                      beatSheetCtx={beatSheetCtx}
                      beatScenes={beatScenes}
                      expandedBeats={expandedBeats}
                      setExpandedBeats={setExpandedBeats}
                      editingBeats={editingBeats}
                      setEditingBeats={setEditingBeats}
                      beatEditDrafts={beatEditDrafts}
                      setBeatEditDrafts={setBeatEditDrafts}
                      structureTwistLoading={structureTwistLoading}
                      structureTwistError={structureTwistError}
                      structureTwistResult={structureTwistResult}
                      analyzeStructureTwist={analyzeStructureTwist}
                      GENRE_BEAT_HINTS={GENRE_BEAT_HINTS}
                      undoHistory={undoHistory}
                      beatSheetFeedback={beatSheetFeedback}
                      setBeatSheetFeedback={setBeatSheetFeedback}
                      refineBeatSheet={refineBeatSheet}
                      beatSheetRefineLoading={beatSheetRefineLoading}
                      beatSheetBefore={beatSheetBefore}
                      showBeatSheetBefore={showBeatSheetBefore}
                      setShowBeatSheetBefore={setShowBeatSheetBefore}
                      dialogueDevResult={dialogueDevResult}
                      setDialogueDevResult={setDialogueDevResult}
                      dialogueDevLoading={dialogueDevLoading}
                      dialogueDevError={dialogueDevError}
                      analyzeDialogueDev={analyzeDialogueDev}
                      generatingBeat={generatingBeat}
                      generateScene={generateScene}
                    />
                  );
                  case "6": return (
                    <Stage6Content
                      scenarioDraftResult={scenarioDraftResult}
                      setScenarioDraftResult={setScenarioDraftResult}
                      scenarioDraftLoading={scenarioDraftLoading}
                      scenarioDraftError={scenarioDraftError}
                      generateScenarioDraft={generateScenarioDraft}
                      scenarioDraftStale={scenarioDraftStale}
                      setScenarioDraftStale={setScenarioDraftStale}
                      scenarioDraftHistory={scenarioDraftHistory}
                      setScenarioDraftHistory={setScenarioDraftHistory}
                      refineScenarioDraft={refineScenarioDraft}
                      scenarioDraftRefineLoading={scenarioDraftRefineLoading}
                      scenarioDraftFeedback={scenarioDraftFeedback}
                      setScenarioDraftFeedback={setScenarioDraftFeedback}
                      scenarioDraftCtx={scenarioDraftCtx}
                      scenarioDraftBefore={scenarioDraftBefore}
                      showScenarioDraftBefore={showScenarioDraftBefore}
                      setShowScenarioDraftBefore={setShowScenarioDraftBefore}
                      undoHistory={undoHistory}
                    />
                  );
                  case "7": return (
                    <Stage7Content
                      scriptCoverageResult={scriptCoverageResult}
                      setScriptCoverageResult={setScriptCoverageResult}
                      valuationResult={valuationResult}
                      setValuationResult={setValuationResult}
                      scriptCoverageLoading={scriptCoverageLoading}
                      valuationLoading={valuationLoading}
                      scriptCoverageError={scriptCoverageError}
                      valuationError={valuationError}
                      analyzeScriptCoverage={analyzeScriptCoverage}
                      analyzeValuation={analyzeValuation}
                    />
                  );
                  case "8": return (
                    <Stage8Content
                      scriptCoverageResult={scriptCoverageResult}
                      rewriteGuide={rewriteGuide}
                      setRewriteGuide={setRewriteGuide}
                      rewriteGuideLoading={rewriteGuideLoading}
                      rewriteGuideError={rewriteGuideError}
                      generateRewriteGuide={generateRewriteGuide}
                      rewriteDiagResult={rewriteDiagResult}
                      setRewriteDiagResult={setRewriteDiagResult}
                      rewriteDiagLoading={rewriteDiagLoading}
                      rewriteDiagError={rewriteDiagError}
                      generateRewriteDiag={generateRewriteDiag}
                      scenarioDraftResult={scenarioDraftResult}
                      partialRewriteInstruction={partialRewriteInstruction}
                      setPartialRewriteInstruction={setPartialRewriteInstruction}
                      generatePartialRewrite={generatePartialRewrite}
                      partialRewriteLoading={partialRewriteLoading}
                      partialRewriteError={partialRewriteError}
                      partialRewriteResult={partialRewriteResult}
                      setPartialRewriteResult={setPartialRewriteResult}
                      fullRewriteNotes={fullRewriteNotes}
                      setFullRewriteNotes={setFullRewriteNotes}
                      generateFullRewrite={generateFullRewrite}
                      fullRewriteLoading={fullRewriteLoading}
                      fullRewriteError={fullRewriteError}
                      fullRewriteResult={fullRewriteResult}
                      setFullRewriteResult={setFullRewriteResult}
                    />
                  );
                  default: return null;
                }
              }
            }}
          />

        </div>

      {/* ─── Credit Purchase Modal ─── */}
      {showCreditModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 12 : 24 }} onClick={() => setShowCreditModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: "100%", background: "var(--bg-surface)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 20, overflow: "hidden", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--c-bd-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#A78BFA" }}>⚡ 크레딧 충전</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-40)", marginTop: 3 }}>현재 잔액: <span style={{ color: "#A78BFA", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{credits ?? 0}cr</span></div>
              </div>
              <button onClick={() => setShowCreditModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--c-tx-35)", padding: 4 }}>
                <SvgIcon d={ICON.close} size={18} />
              </button>
            </div>

            {/* 이벤트 배너 */}
            <div style={{ margin: "16px 24px 0", padding: "10px 14px", borderRadius: 10, background: "rgba(200,168,75,0.08)", border: "1px solid rgba(200,168,75,0.2)", fontSize: 12, color: "#C8A84B", lineHeight: 1.6 }}>
              🎉 <strong>이벤트 기간</strong> — 로그라인 분석 · 캐릭터 분석은 <strong>무료</strong>! 기타 기능 1~5cr 소모.
            </div>

            {/* 기능별 비용 안내 */}
            <div style={{ margin: "12px 24px 0", padding: "12px 14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-35)", marginBottom: 8, letterSpacing: 0.5 }}>기능별 크레딧 비용</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  { label: "로그라인 기본 분석", cost: "무료" },
                  { label: "개선안 생성",        cost: "1cr" },
                  { label: "상업성 체크",         cost: "1cr" },
                  { label: "전문가 패널",         cost: "2cr" },
                  { label: "학술/신화 분석",      cost: "2cr" },
                  { label: "캐릭터 분석",         cost: "2cr" },
                  { label: "시놉시스·구조",       cost: "2cr" },
                  { label: "트리트먼트·비트",     cost: "3cr" },
                  { label: "시나리오 초고",       cost: "3cr" },
                  { label: "Script Coverage",     cost: "4cr" },
                  { label: "에피소드 설계",       cost: "3cr" },
                  { label: "마스터 리포트",       cost: "3cr" },
                ].map(({ label, cost }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--c-bd-1)" }}>
                    <span style={{ fontSize: 10, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cost === "무료" ? "#4ECCA3" : "#A78BFA", fontFamily: "'JetBrains Mono', monospace" }}>{cost}</span>
                  </div>
                ))}
              </div>
              {credits !== null && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--c-bd-2)", fontSize: 11, color: "var(--c-tx-45)" }}>
                  현재 <span style={{ color: "#A78BFA", fontWeight: 700 }}>{credits}cr</span>으로 Script Coverage <span style={{ color: "#A78BFA", fontWeight: 700 }}>{Math.floor(credits / 4)}회</span> · 트리트먼트 <span style={{ color: "#A78BFA", fontWeight: 700 }}>{Math.floor(credits / 3)}회</span> 가능
                </div>
              )}
            </div>

            {/* Packages */}
            <div style={{ padding: "16px 24px 24px", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", gap: 10 }}>
              {[
                { key: "c30",  credits: 30,  price: 3000,  label: "스타터",    color: "#60A5FA" },
                { key: "c70",  credits: 70,  price: 7000,  label: "스탠다드",  color: "#4ECCA3" },
                { key: "c230", credits: 230, price: 20000, label: "프로",      color: "#A78BFA" },
                { key: "c400", credits: 400, price: 35000, label: "울트라",    color: "#C8A84B" },
              ].map(pkg => (
                <button
                  key={pkg.key}
                  disabled={creditPurchasing}
                  onClick={() => {
                    if (!window.TossPayments) { showToast("error", "결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요."); return; }
                    const tossKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
                    if (!tossKey) { showToast("error", "결제 키가 설정되지 않았습니다."); return; }
                    const orderId = `hll-${pkg.key}-${Date.now()}`;
                    const toss = window.TossPayments(tossKey);
                    setCreditPurchasing(true);
                    toss.requestPayment("카드", {
                      amount: pkg.price,
                      orderId,
                      orderName: `Hello Loglines ${pkg.label} ${pkg.credits}cr`,
                      successUrl: window.location.href,
                      failUrl: window.location.href,
                    }).catch(() => setCreditPurchasing(false));
                  }}
                  style={{
                    padding: "16px 12px", borderRadius: 12, cursor: creditPurchasing ? "not-allowed" : "pointer",
                    border: `1px solid ${pkg.color}40`,
                    background: `${pkg.color}08`,
                    transition: "all 0.15s", textAlign: "center",
                    fontFamily: "'Noto Sans KR', sans-serif",
                    opacity: creditPurchasing ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: pkg.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{pkg.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: pkg.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{pkg.credits}<span style={{ fontSize: 12, fontWeight: 400 }}>cr</span></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-tx-70)", marginTop: 6 }}>{pkg.price.toLocaleString()}원</div>
                  <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginTop: 2 }}>{Math.round(pkg.price / pkg.credits)}원/cr</div>
                </button>
              ))}
            </div>
            <div style={{ padding: "0 24px 20px", fontSize: 11, color: "var(--c-tx-30)", textAlign: "center" }}>
              구매 후 즉시 크레딧이 적립됩니다 · 환불은 미사용 크레딧에 한해 가능
            </div>
          </div>
        </div>
      )}

      {/* ─── Admin Panel Modal ─── */}
      {showAdminPanel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 12 : 24 }} onClick={() => setShowAdminPanel(false)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 620, width: "100%", background: "var(--bg-surface)", border: "1px solid rgba(200,168,75,0.35)", borderRadius: 20, overflowY: "auto", maxHeight: "90vh", fontFamily: "'Noto Sans KR', sans-serif", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid var(--c-bd-2)", flexShrink: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#C8A84B" }}>관리자 패널</div>
              <button onClick={() => setShowAdminPanel(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--c-tx-35)", padding: 4 }}>
                <SvgIcon d={ICON.close} size={18} />
              </button>
            </div>

            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>

              {/* ── 사용자 목록 ── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1 }}>
                    로그인 사용자 목록
                  </div>
                  <button
                    onClick={() => {
                      setAdminUsersLoading(true);
                      const token = localStorage.getItem("hll_auth_token");
                      fetch("/api/admin/users", { headers: { "x-auth-token": token || "" } })
                        .then(r => r.json())
                        .then(d => { setAdminRedisOk(d.configured !== false); setAdminUsers(d.users || []); })
                        .catch(() => setAdminUsers([]))
                        .finally(() => setAdminUsersLoading(false));
                    }}
                    style={{ fontSize: 10, color: "var(--c-tx-35)", background: "transparent", border: "1px solid var(--c-bd-3)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
                  >
                    새로고침
                  </button>
                </div>

                {/* DB 미설정 안내 */}
                {!adminRedisOk && !adminUsersLoading && (
                  <div style={{ background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B", marginBottom: 10 }}>DB 연동 필요</div>
                    <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.8, marginBottom: 12 }}>
                      사용자 목록을 보려면 Supabase 또는 Upstash Redis 중 하나를 연동해야 합니다.
                    </div>

                    {/* Supabase 안내 */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4ECCA3", marginBottom: 6 }}>▸ Supabase (권장 · 무료)</div>
                      <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 6, lineHeight: 1.7 }}>
                        1. <strong style={{ color: "var(--c-tx-70)" }}>supabase.com</strong>에서 프로젝트 생성<br/>
                        2. SQL Editor에서 실행:
                      </div>
                      <div style={{ background: "var(--bg-code)", borderRadius: 7, padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4ECCA3", marginBottom: 6 }}>
                        {`CREATE TABLE hll_users (\n  email text PRIMARY KEY,\n  name text, provider text, avatar text,\n  last_seen bigint DEFAULT 0,\n  tier text DEFAULT 'basic'\n);`}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 4 }}>
                        3. Project Settings → API → 아래 값을 Vercel 환경변수에 추가:
                      </div>
                      <div style={{ background: "var(--bg-code-alt)", borderRadius: 7, padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--c-tx-65)" }}>
                        <div>SUPABASE_URL=https://xxxx.supabase.co</div>
                        <div>SUPABASE_SERVICE_KEY=eyJhbGci...</div>
                      </div>
                    </div>

                    {/* Upstash 안내 */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", marginBottom: 6 }}>▸ Upstash Redis (대안)</div>
                      <div style={{ background: "var(--bg-code-alt)", borderRadius: 7, padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--c-tx-65)" }}>
                        <div>UPSTASH_REDIS_REST_URL=https://xxx.upstash.io</div>
                        <div>UPSTASH_REDIS_REST_TOKEN=your_token</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 로딩 */}
                {adminUsersLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0", color: "var(--c-tx-35)", fontSize: 13 }}>
                    <Spinner size={14} /> 사용자 목록 불러오는 중...
                  </div>
                )}

                {/* 사용자 없음 */}
                {!adminUsersLoading && adminRedisOk && adminUsers.length === 0 && (
                  <div style={{ padding: "20px 0", color: "var(--c-tx-30)", fontSize: 13, textAlign: "center" }}>
                    아직 로그인한 사용자가 없습니다.
                  </div>
                )}

                {/* 사용자 목록 */}
                {!adminUsersLoading && adminUsers.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {adminUsers.map(u => {
                      const uTier = u.tier || "basic";
                      const uColor = TIER_COLOR[uTier] || "var(--c-tx-35)";
                      const isSelf = u.email === user?.email;
                      return (
                        <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: isSelf ? "rgba(200,168,75,0.05)" : "rgba(var(--tw),0.02)", border: `1px solid ${isSelf ? "rgba(200,168,75,0.2)" : "var(--c-bd-2)"}` }}>
                          {/* Avatar */}
                          {u.avatar ? (
                            <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(96,165,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#60A5FA", flexShrink: 0 }}>
                              {u.name?.[0] || "?"}
                            </div>
                          )}
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {u.name || u.email}
                              {isSelf && <span style={{ marginLeft: 6, fontSize: 9, color: "#C8A84B", fontWeight: 700 }}>나</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--c-tx-40)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {u.email}
                              {u.provider && <span style={{ marginLeft: 6, fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>{u.provider}</span>}
                            </div>
                          </div>
                          {/* Tier select */}
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            {tierSaving[u.email] ? (
                              <Spinner size={14} color={uColor} />
                            ) : (
                              <select
                                value={uTier}
                                disabled={isSelf}
                                onChange={e => handleSetTier(u.email, e.target.value)}
                                style={{
                                  appearance: "none", WebkitAppearance: "none",
                                  padding: "4px 24px 4px 10px",
                                  borderRadius: 8, border: `1px solid ${uColor}55`,
                                  background: `${uColor}11`,
                                  color: uColor,
                                  fontSize: 11, fontWeight: 700,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  cursor: isSelf ? "not-allowed" : "pointer",
                                  opacity: isSelf ? 0.5 : 1,
                                }}
                              >
                                <option value="basic">기본</option>
                                <option value="pro">프리미엄</option>
                                <option value="admin">관리자</option>
                                <option value="blocked">차단</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── 등급 안내 ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>등급 체계</div>
                {[
                  { t: "admin", label: "관리자", color: "#C8A84B", desc: "모든 기능 무제한, 서버 API 키 사용" },
                  { t: "pro", label: "프리미엄", color: "#60A5FA", desc: "전체 8단계 기능 사용 가능" },
                  { t: "basic", label: "기본", color: "var(--c-tx-35)", desc: "Stage 1만 또는 자기 API 키로 전체 이용" },
                  { t: "blocked", label: "차단", color: "#E85D75", desc: "API 접근 완전 차단" },
                ].map(({ t, label, color, desc }) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 7, background: "rgba(var(--tw),0.02)", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", minWidth: 44 }}>{label}</span>
                    <span style={{ fontSize: 11, color: "var(--c-tx-45)" }}>{desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: "var(--c-tx-28)", lineHeight: 1.7 }}>
                * 등급 변경은 즉시 저장됩니다. 대상자가 재로그인 시 반영됩니다.
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ─── 스토리 닥터 패널 ─── */}
      {showStoryDoctor && (
        <Suspense fallback={null}>
          <StoryDoctorPanel
            apiKey={apiKey}
            storyContext={buildStoryDoctorContext()}
            hasStory={{
              logline: !!logline,
              char: !!charDevResult,
              synopsis: !!(pipelineResult || synopsisResults),
              treatment: !!treatmentResult.trim(),
              beats: !!(beatSheetResult?.beats?.length),
              draft: !!scenarioDraftResult.trim(),
              rewrite: !!(fullRewriteResult?.trim() || partialRewriteResult?.trim()),
            }}
            onClose={() => setShowStoryDoctor(false)}
            isMobile={isMobile}
          />
        </Suspense>
      )}

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
  </LoglineProvider>
  );
}
