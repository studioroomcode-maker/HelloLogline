// ─────────────────────────────────────────────
// Stage 파일에서 프롬프트 re-export (하위 호환성 유지)
// ─────────────────────────────────────────────

export { SYSTEM_PROMPT, IMPROVEMENT_SYSTEM_PROMPT, WEAKNESS_FIX_SYSTEM_PROMPT, STORY_PIVOT_SYSTEM_PROMPT } from "./stages/stage1.js";

export { SYNOPSIS_SYSTEM_PROMPT, ACADEMIC_ANALYSIS_SYSTEM_PROMPT, MYTH_MAP_SYSTEM_PROMPT, BARTHES_CODE_SYSTEM_PROMPT, KOREAN_MYTH_SYSTEM_PROMPT, PANEL_EXPERTS, EXPERT_PANEL_SYSTEM_PROMPT, VALUE_CHARGE_SYSTEM_PROMPT, NARRATIVE_FRAMEWORKS, PIPELINE_ALL_QUESTIONS, PIPELINE_QUESTIONS_BY_DURATION, PIPELINE_SYNOPSIS_SYSTEM_PROMPT, PIPELINE_REFINE_SYSTEM_PROMPT } from "./stages/stage2.js";

export { SHADOW_ANALYSIS_SYSTEM_PROMPT, AUTHENTICITY_SYSTEM_PROMPT, CHARACTER_DEV_SYSTEM_PROMPT } from "./stages/stage3.js";

export { STRUCTURE_ANALYSIS_SYSTEM_PROMPT, THEME_ANALYSIS_SYSTEM_PROMPT, SUBTEXT_SYSTEM_PROMPT, COMPARABLE_WORKS_SYSTEM_PROMPT } from "./stages/stage4.js";

export { TREATMENT_SYSTEM_PROMPT, BEAT_SHEET_SYSTEM_PROMPT, SCENE_LIST_SYSTEM_PROMPT, SCENE_GEN_SYSTEM_PROMPT, DIALOGUE_DEV_SYSTEM_PROMPT, SCENARIO_DRAFT_SYSTEM_PROMPT } from "./stages/stage5.js";

export { SCRIPT_COVERAGE_SYSTEM_PROMPT, VALUATION_SYSTEM_PROMPT } from "./stages/stage6.js";

// ─────────────────────────────────────────────
// 영상 포맷 옵션 (UI 데이터 — 이동하지 않음)
// ─────────────────────────────────────────────
export const DURATION_OPTIONS = [
  {
    id: "ultrashort",
    label: "초단편",
    duration: "5분 이하",
    icon: "🎯",
    desc: "단일 장면·순간 포착. 플래시픽션",
    structure: `초단편(Ultra-Short Film, 5분 이하 = 시나리오 약 3~5페이지) 형식으로 작성하세요.

핵심 원칙:
- 단일 장면(Single Scene) 또는 최대 2~3개 장면으로 완결
- 하나의 감정·순간·전환에만 집중 (서브플롯 금지)
- 대사 최소화 — 시각적·청각적 스토리텔링 극대화
- 열린 결말 또는 순간적 반전 허용
- 시놉시스 150~250자

구조: 설정(1장면, 10초~30초) → 핵심 순간(1~2장면, 2~3분) → 여운(1장면, 30초~1분)
참고 형식: 단편영화제 제출용 초단편, 플래시 픽션(Flash Fiction)의 영상 버전.`,
  },
  {
    id: "shortform",
    label: "숏폼",
    duration: "5~15분",
    icon: "⚡",
    desc: "핵심만 압축. 단일 갈등",
    structure: "2막 구조 또는 압축 3막. 한 가지 사건·감정에 집중. 시놉시스 250~400자.",
  },
  {
    id: "shortfilm",
    label: "단편영화",
    duration: "20~40분",
    icon: "🎞",
    desc: "완결된 짧은 이야기",
    structure: "압축 3막 구조. 1~2개 주요 장소. 뚜렷한 시작-중간-끝. 시놉시스 500~700자.",
  },
  {
    id: "webdrama",
    label: "웹드라마 파일럿",
    duration: "15~30분/화",
    icon: "📱",
    desc: "1화 파일럿. 시리즈 설정",
    structure: "파일럿 에피소드 구조. 세계관 설정 + 훅 + 다음 화 기대감 포함. 시놉시스 600~800자.",
  },
  {
    id: "tvdrama",
    label: "TV 드라마 1화",
    duration: "60분/화",
    icon: "📺",
    desc: "정규 드라마. 서브플롯 포함",
    structure: "A/B 플롯 구조. 클리프행어 필수. 주요 캐릭터 소개 포함. 시놉시스 900~1100자.",
  },
  {
    id: "feature",
    label: "장편영화",
    duration: "90~120분",
    icon: "🎬",
    desc: "풀 피처. Save the Cat 구조",
    structure: "완전한 3막 구조. 발단·전개·절정·결말 포함. 주요 플롯 포인트 명시. 시놉시스 1100~1400자.",
  },
  {
    id: "miniseries",
    label: "미니시리즈 전체",
    duration: "4~6화 × 45분",
    icon: "🗂",
    desc: "리미티드 시리즈. 전체 아크",
    structure: "시리즈 전체 아크. 각 화의 역할과 클리프행어 포함. 시즌 피날레 포함. 시놉시스 1200~1500자.",
  },
  {
    id: "shortformseries",
    label: "숏폼 시리즈",
    duration: "10~20화 × 5~15분",
    icon: "📲",
    desc: "숏폼 멀티 에피소드. 화별 훅",
    structure: "에피소드별 단일 사건 + 시리즈 전체 연결 훅. 각 화 도입부 15초 안에 훅 필수. 시놉시스 800~1000자.",
  },
];

// ─────────────────────────────────────────────
// 평가 기준 가이드 (툴팁용)
// ─────────────────────────────────────────────
export const CRITERIA_GUIDE = {
  protagonist:
    "주인공은 '형용사+유형'으로 구체화해야 합니다. 예: '전직 형사', '이혼한 요리사'. 결핍이나 특성이 드러날수록 높은 점수입니다.",
  inciting_incident:
    "일상을 깨뜨리는 구체적 사건. '어느 날'처럼 모호한 표현보다 구체적 사건이 중요합니다. 주인공의 세계가 변하는 순간이어야 합니다.",
  goal:
    "주인공이 이야기 내내 추구하는 원초적이고 구체적인 목표. '~하려 한다', '~해야만 한다'가 명확할수록 좋습니다.",
  conflict:
    "목표를 방해하는 힘 — 적대자, 환경, 내면의 갈등. 갈등이 구체적일수록 긴장감이 살아납니다.",
  stakes:
    "실패하면 무엇을 잃는가? 목숨·사랑·정체성 등 이해관계가 암시될 때 관객이 몰입합니다.",
  irony:
    "Blake Snyder: '아이러니는 로그라인의 생명'. 가장 그럴 것 같지 않은 사람이 그 일을 해야 하는 역설적 상황이 최고점입니다.",
  mental_picture:
    "로그라인을 읽었을 때 영화 전체가 머릿속에 그려지는가? 장소·분위기·톤이 느껴져야 합니다.",
  emotional_hook:
    "읽었을 때 즉각적으로 감정이 움직이는가? 웃음, 공포, 기대, 슬픔 등 감정 반응 유발 여부를 평가합니다.",
  originality:
    "기존 작품의 단순 변주가 아닌가? 신선한 소재·캐릭터·상황의 조합인지 평가합니다.",
  conciseness:
    "한국어 기준 50~100자가 적정. 너무 짧으면 정보 부족, 너무 길면 집중도가 떨어집니다.",
  active_language:
    "수동태보다 능동태. 추상적 언어보다 시각적·구체적 언어. '겪다'보다 '싸우다', '직면하다'.",
  no_violations:
    "금기사항: 고유명사 남용, 질문형 로그라인, 결말 노출, 과도한 형용사 나열, 장르 클리셰 문구.",
  genre_tone:
    "장르가 암시하는 톤과 언어가 일치하는가? 호러라면 불안감, 코미디라면 경쾌함이 느껴져야 합니다.",
  information_gap:
    "Loewenstein(1994): '알고 싶지만 모르는 상태'가 호기심을 만듭니다. '그래서 어떻게 되는데?'라는 질문이 자연스럽게 떠오르는가?",
  cognitive_dissonance:
    "서로 어울리지 않는 두 요소의 충돌이 기억에 남는 로그라인을 만듭니다. 모순·대비·역설이 뇌를 자극합니다.",
  narrative_transportation:
    "Green & Brock(2000): 이야기 속으로 들어가는 경험. 장면이 머릿속에 생생하게 재생되는 정도입니다.",
  universal_relatability:
    "인간이라면 누구나 공감하는 원초적 경험 — 사랑, 생존, 소속감, 정체성 — 에 닿는가?",
  unpredictability:
    "결말이 예측되지 않는가? 클리셰를 벗어난 신선한 전개가 암시되는가?",
};

// ─────────────────────────────────────────────
// 장르 목록
// ─────────────────────────────────────────────
export const GENRES = [
  { id: "auto", label: "자동 감지", icon: "🔍" },
  { id: "thriller", label: "스릴러/액션", icon: "🔫" },
  { id: "romance", label: "로맨스/멜로", icon: "💕" },
  { id: "drama", label: "드라마", icon: "🎭" },
  { id: "comedy", label: "코미디", icon: "😂" },
  { id: "horror", label: "호러", icon: "👻" },
  { id: "sf", label: "SF/판타지", icon: "🚀" },
  { id: "crime", label: "범죄/느와르", icon: "🔪" },
  { id: "animation", label: "애니메이션", icon: "🎨" },
];

export const EXAMPLE_LOGLINES = [
  "평생 거짓말을 밥 먹듯 하던 천재 변호사가, 아들의 생일 소원 때문에 24시간 동안 단 한마디의 거짓말도 할 수 없게 되면서, 가장 중요한 재판에서 진실만으로 승리해야 한다.",
  "기억을 지우는 시술을 받은 남자가 지워진 연인의 흔적을 되찾기 위해 자신의 무의식 속으로 여행한다.",
  "좀비 바이러스가 퍼진 서울행 KTX 안에서 한 아빠가 딸을 지키기 위해 사투를 벌인다.",
];

// ─────────────────────────────────────────────
// 한국어 레이블
// ─────────────────────────────────────────────
export const LABELS_KR = {
  protagonist: "주인공 구체성",
  inciting_incident: "촉발 사건",
  goal: "목표 선명성",
  conflict: "갈등/장애물",
  stakes: "이해관계(Stakes)",
  irony: "아이러니/훅",
  mental_picture: "심상 유발력",
  emotional_hook: "감정적 공명",
  originality: "독창성",
  conciseness: "간결성",
  active_language: "능동적 언어",
  no_violations: "금기사항",
  genre_tone: "장르 톤",
  information_gap: "정보 격차",
  cognitive_dissonance: "인지적 부조화",
  narrative_transportation: "서사 몰입",
  universal_relatability: "보편적 공감",
  unpredictability: "예측 불가능성",
};
