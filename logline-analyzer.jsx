import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

// ─────────────────────────────────────────────
// SYSTEM PROMPT - 로그라인 분석 프레임워크
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `당신은 시나리오 로그라인 전문 분석가입니다. Blake Snyder(Save the Cat), Robert McKee(Story), Syd Field(Screenplay)의 이론과 할리우드 Script Coverage 체계, Loewenstein의 정보격차 이론(1994)을 기반으로 로그라인을 분석합니다.

## 분석 체계

### A. 구조적 완성도 (50점)
- protagonist (12점): 주인공 구체성 - 형용사+유형, 결핍/특성이 드러나는가
- inciting_incident (10점): 촉발 사건 - 일상을 깨뜨리는 구체적 사건이 있는가
- goal (10점): 목표의 선명성 - 원초적이고 구체적인 목표가 보이는가
- conflict (10점): 갈등/장애물 - 목표를 방해하는 힘이 드러나는가
- stakes (8점): 이해관계 - 실패 시 잃는 것이 암시되는가

### B. 표현적 매력도 (30점)
- irony (10점): 아이러니/훅 - 상황의 역설·모순이 있는가 (Snyder: "가장 중요한 요소")
- mental_picture (8점): 심상 유발력 - 영화 전체가 머릿속에 떠오르는가
- emotional_hook (7점): 감정적 공명 - 읽었을 때 감정이 움직이는가
- originality (5점): 독창성 - 신선한 조합인가

### C. 기술적 완성도 (20점)
- conciseness (8점): 간결성 - 포맷별 적정 길이 (초단편 20~40자 / 숏폼 30~50자 / 단편 40~70자 / 웹드라마 50~80자 / TV드라마 60~90자 / 장편 70~110자 / 미니시리즈 90~140자). 제공된 포맷 기준으로 평가.
- active_language (5점): 능동적/시각적 언어 사용
- no_violations (4점): 금기사항 위반 없음 (고유명사 남용, 질문형, 결말 노출 등)
- genre_tone (3점): 장르 톤 적합성

### D. 흥미 유발 지수 (100점 별도 축)
- information_gap (25점): 정보 격차 생성력 - "그래서 어떻게 되는데?" 질문이 떠오르는가 (Loewenstein 이론)
- cognitive_dissonance (25점): 인지적 부조화 - 모순·대비·역설이 존재하는가
- narrative_transportation (20점): 서사 몰입 가능성 - 장면이 머릿속에 재생되는가
- universal_relatability (15점): 보편적 공감 - 원초적 인간 경험에 닿는가
- unpredictability (15점): 예측 불가능성 - 클리셰를 벗어난 신선함이 있는가

## 장르별 가중치 조정
사용자가 장르를 선택하면 해당 장르에 맞게 평가 시 참고합니다:
- 스릴러/액션: stakes, conflict, information_gap에 관대하게
- 로맨스/드라마: emotional_hook, universal_relatability에 관대하게
- 코미디: irony, originality, cognitive_dissonance에 관대하게
- 호러: stakes, narrative_transportation, genre_tone에 관대하게
- SF/판타지: mental_picture, originality, unpredictability에 관대하게

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "structure": {
    "protagonist": {"score": 0, "max": 12, "found": "", "feedback": ""},
    "inciting_incident": {"score": 0, "max": 10, "found": "", "feedback": ""},
    "goal": {"score": 0, "max": 10, "found": "", "feedback": ""},
    "conflict": {"score": 0, "max": 10, "found": "", "feedback": ""},
    "stakes": {"score": 0, "max": 8, "found": "", "feedback": ""}
  },
  "expression": {
    "irony": {"score": 0, "max": 10, "found": "", "feedback": ""},
    "mental_picture": {"score": 0, "max": 8, "found": "", "feedback": ""},
    "emotional_hook": {"score": 0, "max": 7, "found": "", "feedback": ""},
    "originality": {"score": 0, "max": 5, "found": "", "feedback": ""}
  },
  "technical": {
    "conciseness": {"score": 0, "max": 8, "feedback": ""},
    "active_language": {"score": 0, "max": 5, "feedback": ""},
    "no_violations": {"score": 0, "max": 4, "feedback": ""},
    "genre_tone": {"score": 0, "max": 3, "feedback": ""}
  },
  "interest": {
    "information_gap": {"score": 0, "max": 25, "feedback": ""},
    "cognitive_dissonance": {"score": 0, "max": 25, "feedback": ""},
    "narrative_transportation": {"score": 0, "max": 20, "feedback": ""},
    "universal_relatability": {"score": 0, "max": 15, "feedback": ""},
    "unpredictability": {"score": 0, "max": 15, "feedback": ""}
  },
  "overall_feedback": "전체적인 종합 피드백 (2~3문장)",
  "improvement_questions": ["개선을 위한 유도 질문1", "유도 질문2", "유도 질문3"],
  "detected_genre": "감지된 장르"
}

"found" 필드: 로그라인에서 해당 요소로 감지된 텍스트 부분 (없으면 빈 문자열)
"feedback" 필드: 해당 항목에 대한 구체적 피드백 (1~2문장, 한국어)
"improvement_questions": 학생이 스스로 생각할 수 있도록 유도하는 질문 (답을 주지 말고 질문만)`;

// ─────────────────────────────────────────────
// IMPROVEMENT PROMPT
// ─────────────────────────────────────────────
const IMPROVEMENT_SYSTEM_PROMPT = `당신은 시나리오 로그라인 전문 작가입니다. 제공된 원본 로그라인과 분석 결과를 바탕으로 더 강력한 버전의 로그라인을 작성해주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "improved": "개선된 로그라인 (한국어, 50~100자 이내)",
  "changes": [
    "변경사항 설명 1 — 어떤 요소를 왜 바꿨는지 구체적으로",
    "변경사항 설명 2",
    "변경사항 설명 3"
  ],
  "why": "핵심 개선 방향과 기대 효과 (1~2문장)"
}`;

// ─────────────────────────────────────────────
// SYNOPSIS GENERATION PROMPT
// ─────────────────────────────────────────────
const SYNOPSIS_SYSTEM_PROMPT = `당신은 한국 시나리오 시놉시스 전문 작가입니다. 주어진 로그라인을 바탕으로 지정된 영상 포맷에 맞는 시놉시스를 다양한 방향으로 작성합니다.

각 방향은 장르 해석, 톤, 주제의식, 서사 구조 중 적어도 하나가 뚜렷하게 달라야 합니다. 창의적이고 구체적으로 작성하되, 로그라인의 핵심 설정은 유지하세요.

시놉시스는 실제 제작 가능한 수준으로 구체적이어야 하며, 장면·감정·갈등이 생생하게 느껴져야 합니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "synopses": [
    {
      "direction_title": "방향 이름 (예: '심리 스릴러 버전', '따뜻한 가족 드라마')",
      "genre_tone": "장르와 톤 (예: '심리 스릴러 / 긴장·불안·반전')",
      "hook": "이 방향의 핵심 차별점 한 줄 — 왜 이 방향인가",
      "synopsis": "시놉시스 본문. 포맷 가이드에 맞는 길이와 구조로 작성. 구체적인 장면과 감정이 살아있어야 함.",
      "key_scenes": [
        "핵심 장면 1 — 구체적 묘사",
        "핵심 장면 2 — 구체적 묘사",
        "핵심 장면 3 — 구체적 묘사"
      ],
      "theme": "작품이 말하고자 하는 것 한 줄",
      "ending_type": "결말 유형 (예: '열린 결말', '비극적 승리', '해피엔딩', '반전 결말', '카타르시스')"
    }
  ]
}`;

// ─────────────────────────────────────────────
// 영상 포맷 옵션
// ─────────────────────────────────────────────
const DURATION_OPTIONS = [
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
];

// ─────────────────────────────────────────────
// 학술 분석 프롬프트
// 참고 이론:
//   Aristotle, Poetics (c.335 BCE)
//   Propp, Morphology of the Folktale (1928, Eng. trans. 1968)
//   Campbell, The Hero with a Thousand Faces (1949, Pantheon Books)
//   Todorov, The Poetics of Prose (1977, Cornell UP)
//   Barthes, S/Z (1970, Eng. trans. Hill & Wang 1974)
//   Freytag, Die Technik des Dramas (1863, Eng. trans. 1895)
//   Zillmann, "Transfer of Excitation in Emotional Behavior" (1983)
//   Smith, Engaging Characters (1995, Oxford UP)
//   Bakhtin, "Forms of Time and of the Chronotope in the Novel" (1937-38, pub. 1981)
//   Harmon, "Story Structure 106" (Channel 101, 2012)
// ─────────────────────────────────────────────
const ACADEMIC_ANALYSIS_SYSTEM_PROMPT = `당신은 서사학·영화이론·인지심리학을 전공한 학술 분석가입니다. 아래 이론들을 원전에 충실하게 적용하여 로그라인을 분석하세요. 분석은 구체적이고 학술적이어야 하며, 해당 이론의 핵심 개념을 로그라인에 실제로 연결해야 합니다.

## 적용 이론 체계

### 1. 아리스토텔레스 시학 (Aristotle, Poetics, c.335 BCE)
- **하마르티아(Hamartia)**: 비극적 결함 또는 판단 오류 — 주인공의 어떤 속성이 파국을 낳는가
- **페리페테이아(Peripeteia)**: 운명의 역전 — 행운이 불운으로, 또는 역으로 급반전되는 지점
- **아나그노리시스(Anagnorisis)**: 인식/발견 — 무지에서 지식으로의 전환, 정체 노출
- **카타르시스(Catharsis)**: 감정 정화 잠재력 — 연민(eleos)과 공포(phobos)를 통한 정서 해방
- **미메시스(Mimesis)**: 현실 재현의 완성도 — 로그라인이 개연성 있는 인간 행동을 모방하는가

### 2. 프롭 민담 형태론 (Vladimir Propp, Morphology of the Folktale, 1928/1968)
- **7가지 인물 행동 영역(Spheres of Action)**: 악당(Villain), 증여자(Donor), 조력자(Helper), 찾는 인물/공주(Sought-for Person), 파견자(Dispatcher), 영웅(Hero), 가짜 영웅(False Hero)
- **핵심 기능(Functions) 감지**: Absentation(이탈)·Interdiction(금지)·Villainy/Lack(악행/결핍)·Departure(출발)·Struggle(투쟁)·Victory(승리)·Return(귀환) 등 31가지 중 로그라인에서 감지되는 것들

### 3. 캠벨 영웅 여정 (Joseph Campbell, The Hero with a Thousand Faces, 1949)
- **분리(Departure)**: 일상 세계→모험의 부름(Call to Adventure)→부름의 거부(Refusal)→초자연적 조력(Supernatural Aid)→첫 번째 경계 통과(Crossing the First Threshold)
- **입문(Initiation)**: 시련의 길(Road of Trials)→여신과의 만남(Meeting the Goddess)→유혹(Temptation)→원초적 아버지와의 화해(Atonement)·신격화(Apotheosis)·최후의 은혜(Ultimate Boon)
- **귀환(Return)**: 귀환 거부(Refusal of the Return)·마법의 도주(Magic Flight)·외부로부터의 구출·귀환 경계 통과·부활(Resurrection)·귀환하는 영약(Return with Elixir)

### 4. 토도로프 서사 이론 (Tzvetan Todorov, The Poetics of Prose, 1977)
- **초기 평형(Initial Equilibrium)**: 이야기 시작의 안정 상태
- **파열(Disruption/Disequilibrium)**: 평형을 깨뜨리는 힘 또는 사건
- **변환 인식(Recognition of Disruption)**: 파열이 문제로 인식되는 순간
- **회복 시도(Attempt to Repair)**: 평형 복구를 위한 행동
- **새로운 평형(New Equilibrium)**: 변화된 세계의 새로운 안정

### 5. 바르트 서사 코드 (Roland Barthes, S/Z, 1970)
- **헤르메네우틱 코드(HER, Hermeneutic Code)**: 수수께끼·비밀·질문을 생성하고 지연하는 구조 — 서스펜스의 원천
- **프로아이레틱 코드(ACT, Proairetic/Action Code)**: 행동 시퀀스의 논리 — 원인→결과 사슬
- **세믹 코드(SEM, Semic Code)**: 인물·사물에 부착된 함축적 의미·분위기 단위
- **상징 코드(SYM, Symbolic Code)**: 텍스트의 이항 대립 구조 — 삶/죽음, 선/악, 안/밖
- **문화 코드(REF, Cultural/Referential Code)**: 독자가 공유하는 문화적 지식에의 의존

### 6. 프라이탁 피라미드 (Gustav Freytag, Die Technik des Dramas, 1863)
- **발단(Exposition)**: 배경·인물·상황 제시
- **상승 행동(Rising Action)**: 갈등 심화, 긴장 고조
- **절정(Climax/Turning Point)**: 극적 긴장의 최고점, 운명의 결정적 전환
- **하강 행동(Falling Action)**: 결과의 전개, 긴장 이완
- **대단원(Dénouement/Resolution)**: 갈등 해소, 새로운 질서

### 7. 질만 흥분 전이 이론 (Dolf Zillmann, 1983)
- **생리적 각성(Physiological Arousal)**: 서사가 유발하는 신체적 흥분 반응
- **전이 메커니즘(Transfer Mechanism)**: 이전 장면의 잔류 각성이 이후 감정을 증폭
- **오귀인(Misattribution)**: 각성의 원인을 새로운 자극으로 잘못 귀인하는 현상

### 8. 머레이 스미스 관객 참여 이론 (Murray Smith, Engaging Characters, 1995)
- **인식(Recognition)**: 인물을 구별되는 존재로 식별하는 능력 — 주인공이 뚜렷이 구별되는가
- **정렬(Alignment)**: 특정 인물의 행동·정보에 접근하는 시점 구조 — 누구의 눈으로 이야기가 전달되는가
- **충성(Allegiance)**: 인물의 도덕적 지향을 평가하고 동일시하는 과정 — 관객이 주인공을 응원하는가

### 9. 한국 서사 미학
- **한(恨)**: 억눌린 슬픔·원한·미완의 욕망이 서사의 동력이 되는 한국 고유 정서 — 이효인, 『한국 영화의 정체성』(1992); 김소영, 『근대성의 유령들』(2000)
- **정(情)**: 시간과 공유 경험에서 쌓이는 정서적 유대 — 관계 중심 서사의 핵심 stakes
- **신명(神明)**: 공동체적 흥과 도취 — 해학·역동성과 연결된 서사 에너지
- **눈치(Nunchi)**: 타인의 감정·의도를 읽는 사회적 감수성 — 심리 갈등 구조에 내재

반드시 아래 JSON 형식으로만 응답하세요. 각 분석은 구체적이고 로그라인의 실제 언어에 근거해야 합니다.
{
  "aristotle": {
    "hamartia": {"detected": "로그라인에서 감지된 결함 요소 또는 '없음'", "analysis": "1~2문장 분석"},
    "peripeteia": {"detected": "역전 요소 또는 '잠재적'/'없음'", "analysis": "1~2문장 분석"},
    "anagnorisis": {"detected": "인식/발견 요소 또는 '잠재적'/'없음'", "analysis": "1~2문장 분석"},
    "catharsis_potential": {"score": 0, "max": 10, "analysis": "카타르시스 가능성 평가"},
    "mimesis_quality": {"score": 0, "max": 10, "analysis": "개연성 있는 현실 재현 수준 평가"},
    "unity_of_action": {"score": 0, "max": 10, "analysis": "단일한 행동 계열의 완결성"}
  },
  "propp": {
    "detected_functions": ["감지된 기능명 (영어)", "예: Absentation", "예: Villainy/Lack"],
    "character_spheres": {
      "villain": "악당 역할 분석 (없으면 '암시적' 또는 '없음')",
      "donor": "증여자 역할 분석",
      "helper": "조력자 역할 분석",
      "sought_person": "찾는 인물/목표 대상 분석",
      "dispatcher": "파견자 역할 분석",
      "hero": "영웅 역할 분석",
      "false_hero": "가짜 영웅 분석 (없으면 빈 문자열)"
    },
    "narrative_completeness": {"score": 0, "max": 10, "analysis": "프롭적 서사 완결성 평가"}
  },
  "campbell": {
    "detected_departure_stage": "분리 단계 중 감지된 단계 이름",
    "hero_archetype": "영웅 원형 분석",
    "shadow_archetype": "그림자/적 원형 분석",
    "call_to_adventure": "모험의 부름 요소 분석",
    "threshold": "경계 요소 분석",
    "elixir": "영약/획득물 예측 — 이야기가 끝날 때 영웅이 돌아올 변화나 지식",
    "monomyth_alignment": {"score": 0, "max": 10, "analysis": "모노미스 구조와의 정합성"}
  },
  "todorov": {
    "initial_equilibrium": "초기 평형 상태 — 이야기 시작 전 세계",
    "disruption": "파열 요소 — 평형을 깨뜨리는 것",
    "recognition": "파열 인식 방식 분석",
    "repair_attempt": "회복 시도 예측",
    "new_equilibrium": "새로운 평형 예측 — 이야기가 도달할 새로운 상태"
  },
  "barthes": {
    "hermeneutic_code": "생성된 수수께끼·질문·비밀 — 독자가 궁금해하는 것",
    "proairetic_code": "행동 시퀀스의 논리적 사슬 분석",
    "semic_code": "인물과 상황에 부착된 함축 의미 분석",
    "symbolic_code": "로그라인 내 이항 대립 구조 (예: '거짓말/진실', '생존/죽음')",
    "cultural_code": "의존하는 공유 문화 지식 분석"
  },
  "freytag": {
    "exposition": "발단 — 제시된 배경·인물·상황",
    "rising_action": "상승 행동 예측",
    "climax": "절정 예측 — 전환점",
    "falling_action": "하강 행동 예측",
    "denouement": "대단원 예측"
  },
  "zillmann": {
    "arousal_mechanism": "이 로그라인이 유발할 생리적 각성 메커니즘",
    "predicted_arousal_intensity": "낮음/중간/높음/매우 높음",
    "transfer_potential": "흥분 전이의 서사적 설계 가능성 분석",
    "dominant_emotion": "주된 감정 예측 (예: '공포+연민', '희열+긴장')"
  },
  "smith": {
    "recognition": {"score": 0, "max": 10, "analysis": "주인공의 구별 가능성·개성 평가"},
    "alignment": {"score": 0, "max": 10, "analysis": "시점 구조·정보 접근 방식 평가"},
    "allegiance": {"score": 0, "max": 10, "analysis": "도덕적 동일시 가능성 평가"}
  },
  "korean_aesthetics": {
    "han": {"present": true, "analysis": "한(恨)의 서사적 역할 분석 또는 '감지되지 않음'"},
    "jeong": {"present": true, "analysis": "정(情)의 서사적 역할 분석 또는 '감지되지 않음'"},
    "sinmyeong": {"present": false, "analysis": "신명(神明) 요소 분석 또는 '감지되지 않음'"},
    "nunchi": {"present": false, "analysis": "눈치(Nunchi) 요소 분석 또는 '감지되지 않음'"},
    "korean_narrative_strength": {"score": 0, "max": 10, "analysis": "한국 서사 정서와의 친화도"}
  },
  "integrated_assessment": {
    "dominant_theory_fit": "가장 잘 맞는 이론 체계와 이유",
    "theoretical_verdict": "종합 학술 평가 (3~4문장, 구체적 이론 용어 사용)",
    "strengths": ["이론적 강점 1", "이론적 강점 2", "이론적 강점 3"],
    "weaknesses": ["이론적 약점 1", "이론적 약점 2"],
    "academic_recommendation": "학술적 관점에서의 개선 제언 (2~3문장)"
  }
}`;

// ─────────────────────────────────────────────
// 서사 구조 프레임워크 (시놉시스 생성용)
// ─────────────────────────────────────────────
const NARRATIVE_FRAMEWORKS = [
  {
    id: "three_act",
    label: "3막 구조",
    ref: "Syd Field, Screenplay (1982)",
    icon: "📐",
    desc: "설정→대립→해결. 할리우드 표준",
    instruction:
      "Syd Field(1982)의 3막 구조를 따르세요. 1막(설정·계기): 전체의 25%, 2막(대립·발전): 50%, 3막(해결·클라이맥스): 25%. 1막→2막 전환점(Pinch I), 2막→3막 전환점(Pinch II)을 명시적으로 배치하세요.",
  },
  {
    id: "freytag",
    label: "프라이탁 피라미드",
    ref: "Gustav Freytag, Die Technik des Dramas (1863)",
    icon: "▲",
    desc: "발단→전개→절정→하강→대단원 5막",
    instruction:
      "Freytag(1863)의 5막 피라미드 구조로 작성하세요. 발단(Exposition)·상승 행동(Rising Action)·절정(Climax)·하강 행동(Falling Action)·대단원(Dénouement) 5단계를 각각 명시하고 그 내용을 채우세요.",
  },
  {
    id: "heros_journey",
    label: "영웅의 여정",
    ref: "Joseph Campbell, The Hero with a Thousand Faces (1949)",
    icon: "⚔️",
    desc: "12단계 모노미스. 분리→입문→귀환",
    instruction:
      "Campbell(1949)의 모노미스 12단계를 따르세요. 분리(Departure): 일상 세계→모험의 부름→부름의 거부→초자연적 조력→경계 통과. 입문(Initiation): 시련의 길→최대 시련→영약 획득. 귀환(Return): 귀환의 길→부활→영약을 가진 귀환. 각 단계를 시놉시스에 반영하세요.",
  },
  {
    id: "kishoten",
    label: "기승전결",
    ref: "漢詩 4행 구조 / Ki-Shō-Ten-Ketsu",
    icon: "☯️",
    desc: "갈등 없는 동아시아 4막 구조",
    instruction:
      "기승전결(起承轉結) 4막 구조로 작성하세요. 기(起): 이야기의 출발점 설정. 승(承): 기의 흐름 발전·심화. 전(轉): 전환 — 예상치 못한 시각·상황 도입 (갈등 없이도 가능). 결(結): 기승전을 수렴하는 해소. 서양적 갈등 구조 없이 주제·분위기의 전환으로 서사를 이끄세요.",
  },
  {
    id: "story_circle",
    label: "스토리 서클",
    ref: "Dan Harmon, Story Structure 106 (Channel 101, 2012)",
    icon: "🔄",
    desc: "캠벨 기반 8단계 원형 구조",
    instruction:
      "Dan Harmon(2012)의 스토리 서클 8단계로 작성하세요. ① You(주인공의 안락한 상황) → ② Need(욕구·결핍 발생) → ③ Go(낯선 세계 진입) → ④ Search(시련 속 탐색) → ⑤ Find(욕구 충족·진실 발견) → ⑥ Take(대가 지불) → ⑦ Return(귀환) → ⑧ Change(변화된 주인공). 각 단계를 시놉시스에 명확히 반영하세요.",
  },
  {
    id: "in_medias_res",
    label: "인 메디아스 레스",
    ref: "Horace, Ars Poetica (c.19 BCE) / Homer, Iliad (c.8th C. BCE)",
    icon: "⚡",
    desc: "절정 한가운데서 시작. 역순 구성",
    instruction:
      "In medias res(사건의 한가운데서) 구조로 작성하세요. Horace(c.19 BCE)가 Homer의 서사시에서 정식화한 이 기법에 따라: 최고 긴장 장면(절정 근방)에서 시작 → 회상·단서를 통해 배경 점진적 노출 → 현재 시제로 돌아와 클라이맥스 해소. 시간의 역순·교차를 적극 활용하세요.",
  },
  {
    id: "todorov",
    label: "토도로프 평형 모델",
    ref: "Tzvetan Todorov, The Poetics of Prose (1977)",
    icon: "⚖️",
    desc: "평형→파열→인식→회복→새 평형 5단계",
    instruction:
      "Todorov(1977)의 5단계 서사 모델로 작성하세요. ① 초기 평형(Initial Equilibrium): 세계의 안정 상태. ② 파열(Disruption): 평형을 깨뜨리는 사건. ③ 파열의 인식(Recognition): 문제가 인지되는 순간. ④ 회복 시도(Attempt to Repair): 평형 회복을 위한 행동. ⑤ 새로운 평형(New Equilibrium): 변화된 형태의 새 안정. 각 단계를 시놉시스에 명시하세요.",
  },
];

// ─────────────────────────────────────────────
// 파이프라인 시놉시스: 전체 질문 풀
// 이론 근거: Campbell(1949), Aristotle(c.335 BCE),
//   Propp(1928), Freytag(1863), Zillmann(1983),
//   Todorov(1977), Barthes(1970), Smith(1995)
// ─────────────────────────────────────────────
const PIPELINE_ALL_QUESTIONS = [
  {
    id: "protagonist_state",
    label: "주인공의 내면 상태",
    subtext: "Campbell(1949) 분리 단계 · Aristotle 하마르티아",
    options: [
      { id: "A", label: "안락한 일상 속 잠재된 갈망", desc: "편안하지만 내면 깊이 변화를 갈망한다 (Campbell: Ordinary World with latent Call)" },
      { id: "B", label: "트라우마로 황폐해진 내면", desc: "상실이나 상처로 인해 스스로를 고립시킨 상태 (Vogler: Wounded Hero)" },
      { id: "C", label: "사명감이 넘치나 방법을 모름", desc: "강한 의지를 가졌지만 결핍된 수단 (Propp: Hero with lack of means)" },
      { id: "D", label: "결함을 인식 못한 과신 상태", desc: "비극적 결함을 안고 과잉 확신하는 주인공 (Aristotle: Hamartia)" },
    ],
  },
  {
    id: "conflict_nature",
    label: "핵심 갈등의 성격",
    subtext: "Propp(1928) 악당 기능 · Aristotle 내적 하마르티아",
    options: [
      { id: "A", label: "외부 세력과의 충돌", desc: "적대자·사회·자연과 맞서는 구조 (Propp: Villain function)" },
      { id: "B", label: "가까운 관계에서의 균열", desc: "가족·연인·동료와의 내부 갈등이 핵심" },
      { id: "C", label: "자기 모순과의 내면 싸움", desc: "욕망과 신념의 충돌 (Aristotle: internal hamartia)" },
      { id: "D", label: "운명·시스템에 대한 실존적 저항", desc: "구조와 체계에 맞서는 이야기" },
    ],
  },
  {
    id: "pacing",
    label: "서사의 리듬과 속도",
    subtext: "Freytag(1863) 피라미드 · Zillmann(1983) 각성 전이",
    options: [
      { id: "A", label: "빠른 전개와 반전의 연속", desc: "각성 고조와 반전으로 긴장 유지 (Zillmann: Excitation Transfer)" },
      { id: "B", label: "느린 감정 축적과 정서적 여운", desc: "서정적 속도감, 감정을 천천히 쌓기" },
      { id: "C", label: "긴장과 이완의 리드미컬한 교차", desc: "상승·하강의 반복 (Freytag: rising/falling action)" },
      { id: "D", label: "비선형 시간구조의 퍼즐감", desc: "현재와 과거의 교차, 역순 구성 (In medias res)" },
    ],
  },
  {
    id: "theme",
    label: "핵심 주제 의식",
    subtext: "Smith(1995) 감정 정렬 · 한국 미학: 정(情)·한(恨) · Campbell(1949) 초월",
    options: [
      { id: "A", label: "회복력과 연대", desc: "상처를 넘는 공동체의 힘 (한국 정情의 미학)" },
      { id: "B", label: "정체성과 소속감", desc: "나는 누구이며 어디에 속하는가의 탐구" },
      { id: "C", label: "권력과 부패에 대한 비판", desc: "사회·제도·구조에 대한 시선" },
      { id: "D", label: "사랑과 상실의 보편적 경험", desc: "인간 감정의 본질적 고통과 아름다움" },
      { id: "E", label: "생존과 자유 의지", desc: "극한 상황에서 인간의 본질적 의지 (Maslow: survival → self-actualization)" },
      { id: "F", label: "초월과 구원", desc: "인간 한계를 넘는 숭고·신화·구원의 서사 (Campbell: transcendence & return)" },
    ],
  },
  {
    id: "world_atmosphere",
    label: "세계관과 분위기",
    subtext: "Barthes(1970) 내러티브 코드 · García Márquez 마술적 리얼리즘 · 장르 문법",
    options: [
      { id: "A", label: "현실 밀착 — 일상의 균열", desc: "일상에서 시작하는 사실주의적 긴장 (Kitchen Sink Drama)" },
      { id: "B", label: "장르적 스타일리시", desc: "느와르·스릴러·SF의 세계관 문법 활용" },
      { id: "C", label: "감성적 낭만 — 서정적 공간", desc: "일상이 시처럼 물드는 감성적 분위기" },
      { id: "D", label: "사회적 우화 — 메타포 세계", desc: "현실을 재해석하는 알레고리적 세계" },
      { id: "E", label: "마술적 리얼리즘", desc: "일상 속 초현실이 공존 — 경이로운 것이 자연스럽다 (García Márquez)" },
      { id: "F", label: "역사·시대 재현", desc: "특정 시대의 정치·문화적 질감이 이야기의 공기가 된다" },
    ],
  },
  {
    id: "turning_point",
    label: "핵심 전환점의 성격",
    subtext: "Aristotle(c.335 BCE) 페리페테이아·아나그노리시스 · Todorov(1977)",
    options: [
      { id: "A", label: "외부 사건의 충격으로 반전", desc: "갑작스러운 상황 역전 (Aristotle: Peripeteia)" },
      { id: "B", label: "숨겨진 진실의 발견으로 세계 변화", desc: "인식의 전환이 모든 것을 바꾼다 (Aristotle: Anagnorisis)" },
      { id: "C", label: "주인공의 내면 변화로 세상을 새롭게 봄", desc: "외부가 아닌 내면의 성장이 전환점" },
      { id: "D", label: "두 가치관의 충돌이 새 균형을 만듦", desc: "갈등 해소로 새로운 안정 (Todorov: new equilibrium)" },
    ],
  },
  {
    id: "ending",
    label: "결말의 철학",
    subtext: "Aristotle(c.335 BCE) 카타르시스 · Todorov(1977) 새로운 평형 · 한국 미학 한(恨)",
    options: [
      { id: "A", label: "비극적 카타르시스", desc: "상실이지만 깊은 정화 (Aristotle: catharsis through tragedy)" },
      { id: "B", label: "희망적 열린 결말", desc: "해결되지 않아도 계속 나아가는 힘" },
      { id: "C", label: "아이러니한 성취", desc: "원했던 것을 얻었지만 다른 것을 잃는다" },
      { id: "D", label: "변화된 평형", desc: "세계와 주인공이 모두 달라진 새 안정 (Todorov: transformed equilibrium)" },
      { id: "E", label: "순환적 귀환", desc: "시작과 끝이 맞닿는 원형 구조 — 변한 것은 주인공 내면뿐 (circular narrative)" },
      { id: "F", label: "씁쓸한 달콤함", desc: "상실과 성장이 공존 — 완전하지 않지만 의미 있는 마무리 (bittersweet · 한恨의 미학)" },
    ],
  },
  {
    id: "series_arc",
    label: "시리즈 전체 아크",
    subtext: "Campbell(1949) 모노미스 전체 여정 · Harmon(2012) 스토리 서클",
    options: [
      { id: "A", label: "사건 해결형 아크", desc: "하나의 거대한 미스터리·사건이 전 시리즈를 이끈다" },
      { id: "B", label: "인물 성장형 아크", desc: "주인공의 내면 여정이 각 화를 연결하는 축" },
      { id: "C", label: "세계관 확장형 아크", desc: "에피소드마다 세계의 새로운 층위가 드러난다" },
      { id: "D", label: "관계 변주형 아크", desc: "인물 간 관계 역학이 시즌을 통해 복잡하게 진화" },
      { id: "E", label: "사회 변혁형 아크", desc: "개인과 사회가 함께 변화하는 이중 아크 — 인물의 선택이 세계를 바꾼다" },
    ],
  },
];

// 듀레이션별 사용할 질문 인덱스 (PIPELINE_ALL_QUESTIONS 인덱스)
const PIPELINE_QUESTIONS_BY_DURATION = {
  ultrashort: [0, 2, 6],
  shortform:  [0, 1, 2, 6],
  shortfilm:  [0, 1, 3, 4, 6],
  webdrama:   [0, 1, 3, 5, 6],
  tvdrama:    [0, 1, 3, 4, 5, 6],
  feature:    [0, 1, 2, 3, 4, 5, 6],
  miniseries: [0, 1, 2, 3, 4, 5, 6, 7],
};

// ─────────────────────────────────────────────
// 파이프라인 시놉시스 생성 프롬프트
// ─────────────────────────────────────────────
const PIPELINE_SYNOPSIS_SYSTEM_PROMPT = `당신은 인터랙티브 서사 설계 전문가입니다. 사용자가 단계적으로 선택한 서사 요소들을 유기적으로 통합하여 단 하나의 완성도 높은 맞춤형 시놉시스를 생성합니다.

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록이나 설명 텍스트 없이 JSON만 출력하세요.

{
  "direction_title": "이 시놉시스의 방향 제목 (한국어 15자 이내, 선택된 요소를 반영)",
  "genre_tone": "장르와 감성 톤 (예: 감성 드라마 · 비극적 리얼리즘)",
  "hook": "핵심 매력 포인트 한 문장 — 왜 이 이야기인가 (선택된 요소들을 녹여낸 훅)",
  "synopsis": "선택된 모든 서사 요소들을 유기적으로 반영한 완성도 높은 시놉시스. 포맷에 맞는 분량으로 작성하세요.",
  "key_scenes": ["핵심 장면 또는 시퀀스 1", "핵심 장면 또는 시퀀스 2", "핵심 장면 또는 시퀀스 3"],
  "theme": "이 이야기의 핵심 주제 한 문장",
  "ending_type": "결말 유형 (선택된 결말 철학을 반영)",
  "narrative_dna": "선택된 서사 요소들이 어떻게 이야기에 통합되었는지 학술적으로 설명 (2~3문장)"
}`;

// ─────────────────────────────────────────────
// 파이프라인 시놉시스 피드백 다듬기 프롬프트
// ─────────────────────────────────────────────
const PIPELINE_REFINE_SYSTEM_PROMPT = `당신은 서사 편집 전문가입니다. 기존 시놉시스를 사용자의 피드백에 맞게 정밀하게 수정합니다.

핵심 원칙:
- 잘 작동하는 부분은 그대로 유지하고, 피드백이 지적한 부분만 수정하세요.
- 세계관 규칙과 인물 논리의 일관성을 최우선으로 지키세요.
- 피드백이 "이 부분이 이상해요"이면 그 부분을 명확하게 재작성하세요.
- 피드백이 "이렇게 바꿔주세요"이면 방향성을 그쪽으로 전환하세요.

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록이나 설명 텍스트 없이 JSON만 출력하세요.

{
  "direction_title": "수정된 방향 제목 (한국어 15자 이내)",
  "genre_tone": "장르와 감성 톤",
  "hook": "수정된 핵심 매력 포인트 한 문장",
  "synopsis": "피드백을 반영하여 수정된 완성도 높은 시놉시스",
  "key_scenes": ["핵심 장면 1", "핵심 장면 2", "핵심 장면 3"],
  "theme": "핵심 주제 한 문장",
  "ending_type": "결말 유형",
  "narrative_dna": "어떤 부분을 어떻게 수정했는지, 왜 그 방향이 서사적으로 더 일관적인지 설명 (2~3문장)"
}`;

// ─────────────────────────────────────────────
// 전문가 패널 — 전문가 정의 (색상·아이콘·역할)
// ─────────────────────────────────────────────
const PANEL_EXPERTS = [
  { id: "mckee",   name: "맥키",   role: "시나리오 구조 전문가",  color: "#4ECCA3", initial: "M" },
  { id: "auteur",  name: "오토르", role: "한국 영화 감독",        color: "#E85D75", initial: "감" },
  { id: "jung",    name: "융",     role: "심층 심리학자",         color: "#a78bfa", initial: "J" },
  { id: "sartre",  name: "사르트르", role: "실존주의 철학자",     color: "#F7A072", initial: "S" },
  { id: "chekhov", name: "체호프", role: "드라마투르그",          color: "#45B7D1", initial: "C" },
  { id: "campbell",name: "캠벨",  role: "신화학자",              color: "#FFD166", initial: "Ca" },
  { id: "barthes", name: "바르트", role: "기호학자·문학이론가",   color: "#95E1D3", initial: "B" },
  { id: "drucker", name: "드러커", role: "경영·경제 전문가",      color: "#60A5FA", initial: "D" },
  { id: "kotler",  name: "코틀러", role: "마케팅 전문가",         color: "#F472B6", initial: "K" },
  { id: "porter",  name: "포터",   role: "경쟁전략 전문가",       color: "#A3E635", initial: "P" },
];

// ─────────────────────────────────────────────
// 전문가 패널 시스템 프롬프트
// 참고 원전 (모두 학습 반영):
//   Aristotle, Poetics (c.335 BCE)
//   Chekhov Letters (1886-1904) / Stanislavski (1936) / Brecht (1964)
//   Campbell, The Hero with a Thousand Faces (1949)
//   Propp, Morphology of the Folktale (1928/1968)
//   Jung, Archetypes and the Collective Unconscious (1934-54/1969)
//   Freud, The Interpretation of Dreams (1900)
//   Maslow, A Theory of Human Motivation (1943)
//   Erikson, Childhood and Society (1950)
//   Sartre, L'Être et le Néant (1943) / L'Existentialisme est un humanisme (1946)
//   Camus, Le Mythe de Sisyphe (1942)
//   Nietzsche, Also sprach Zarathustra (1883-85)
//   Heidegger, Sein und Zeit (1927)
//   Kierkegaard, Enten-Eller (1843)
//   Barthes, S/Z (1970) / Mythologies (1957) / La mort de l'auteur (1968)
//   Genette, Narrative Discourse (1972)
//   Ricoeur, Temps et Récit (1984)
//   Lévi-Strauss, The Structural Study of Myth (1955)
//   McKee, Story (1997)
//   Field, Screenplay (1982)
//   Truby, The Anatomy of Story (2007)
//   Snyder, Save the Cat (2005)
//   Goldman, Adventures in the Screen Trade (1983)
//   Bazin, What is Cinema? (1967)
//   Eisenstein, Film Form (1949)
//   Mulvey, Visual Pleasure and Narrative Cinema (1975)
//   Vogler, The Writer's Journey (1992)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// 가치 전하 분석 프롬프트 (McKee, Story 1997)
// ─────────────────────────────────────────────
const VALUE_CHARGE_SYSTEM_PROMPT = `당신은 로버트 맥키(Robert McKee)의 이론에 정통한 시나리오 구조 분석가입니다.
맥키의 핵심 통찰 — "이야기는 가치를 뒤집는 행위다" — 를 바탕으로 로그라인을 분석합니다.

참고 원전:
  McKee, R. (1997). Story: Substance, Structure, Style, and the Principles of Screenwriting. HarperCollins.
  Field, S. (1982). Screenplay: The Foundations of Screenwriting. Dell.
  Truby, J. (2007). The Anatomy of Story: 22 Steps to Becoming a Master Storyteller. FSG.
  Aristotle. Poetics (c.335 BCE). — 페리페테이아(Peripeteia): 운명의 역전

핵심 가치 쌍 목록 (이야기가 뒤집는 대립 가치들):
  삶 ↔ 죽음 / 희망 ↔ 절망 / 자유 ↔ 예속
  사랑 ↔ 증오·고독 / 진실 ↔ 거짓·기만 / 정의 ↔ 불의
  용기 ↔ 비겁 / 성숙 ↔ 퇴행 / 연대 ↔ 배신
  권력 ↔ 무력함 / 정체성 ↔ 상실 / 구원 ↔ 저주

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.

{
  "primary_charge": {
    "value_pair": ["가치A", "가치B"],
    "start_pole": "가치A 또는 가치B (이야기 시작 시 상태)",
    "end_pole": "가치A 또는 가치B (이야기 종착 시 상태, 로그라인에서 암시된)",
    "arc_label": "예: 예속 → 자유",
    "polarity": "positive_to_negative 또는 negative_to_positive 또는 positive_to_ironic",
    "description": "이 가치 전하가 이야기에서 어떻게 작동하는지 2문장"
  },
  "secondary_charges": [
    {
      "value_pair": ["가치A", "가치B"],
      "arc_label": "예: 거짓 → 진실",
      "description": "1~2문장"
    }
  ],
  "charge_intensity": {
    "score": 0~100,
    "label": "약함 / 보통 / 강렬 / 극렬",
    "reason": "이 강도로 평가한 이유 1문장"
  },
  "genre_value_match": {
    "genre_expected": "이 장르가 전통적으로 뒤집어야 하는 가치",
    "actual_match": true 또는 false,
    "analysis": "장르 기대와 실제 가치 전하의 일치·불일치 분석 2문장"
  },
  "missing_charge": "빠진 가치 전하 또는 모호한 부분 (없으면 null)",
  "mckee_verdict": "맥키 관점에서의 종합 평가 2~3문장 — 이 로그라인이 진정한 가치 역전을 보여주는가",
  "strengthening_tip": "가치 전하를 더 날카롭게 만들기 위한 구체적 제안 1~2문장"
}`;

// ─────────────────────────────────────────────
// 그림자 캐릭터 분석 프롬프트 (Jung 1969)
// ─────────────────────────────────────────────
const SHADOW_ANALYSIS_SYSTEM_PROMPT = `당신은 칼 구스타프 융(C.G. Jung)의 분석심리학에 정통한 이야기 심리 분석가입니다.
융의 원형 이론을 바탕으로 로그라인의 캐릭터 구조를 심층 분석합니다.

참고 원전:
  Jung, C.G. (1969). The Archetypes and the Collective Unconscious. Princeton UP. [원전 1934-54]
  Jung, C.G. (1971). Psychological Types. Princeton UP. [원전 1921]
  Jung, C.G. (1963). Memories, Dreams, Reflections. Pantheon.
  Vogler, C. (1992). The Writer's Journey: Mythic Structure for Writers. Michael Wiese.
  Freud, S. (1900). The Interpretation of Dreams. — 무의식적 욕망과의 비교
  Maslow, A. (1943). A Theory of Human Motivation. Psych. Review.
  Erikson, E. (1950). Childhood and Society. Norton. — 정체성 위기

핵심 원형(Archetype) 체계:
  영웅(Hero): 변화의 주체, 세계를 바꾸거나 세계에 의해 바뀌는 존재
  그림자(Shadow): 영웅이 억압한 어두운 자아, 종종 적대자로 외화됨
  아니마/아니무스(Anima/Animus): 영웅의 이성적 측면, 내면의 연인·영혼
  자기(Self): 전체성, 개성화의 목표
  페르소나(Persona): 사회적 가면, 진짜 자아와의 괴리
  변환자/트릭스터(Trickster): 경계를 흐리는 자, 변화를 촉진하는 혼돈
  현자(Wise Old Man/Woman): 지혜·인도의 원형, 멘토

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.

{
  "hero_archetype": {
    "description": "주인공이 구현하는 영웅 원형의 특성 2문장",
    "wound": "주인공의 심리적 상처·결핍 (융의 콤플렉스 개념)",
    "persona_gap": "페르소나(사회적 가면)와 진짜 자아의 괴리 설명"
  },
  "shadow": {
    "who": "그림자 원형을 구현하는 인물 또는 내면 요소",
    "represents": "이 그림자가 영웅의 어떤 억압된 자아를 반영하는지",
    "integration_potential": "영웅이 그림자를 통합(개성화)할 가능성 — 높음/중간/낮음",
    "description": "그림자 분석 2~3문장"
  },
  "anima_animus": {
    "present": true 또는 false,
    "who": "아니마/아니무스를 구현하는 인물 (없으면 null)",
    "function": "이 원형이 이야기에서 하는 역할",
    "description": "1~2문장"
  },
  "other_archetypes": [
    {
      "archetype": "원형 이름",
      "who": "구현 인물 또는 요소",
      "description": "1문장"
    }
  ],
  "individuation_arc": {
    "stage": "분리(Separation) / 입문(Initiation) / 귀환(Return) — 로그라인이 어느 단계를 다루는가",
    "completeness": "개성화 여정의 완결성 평가",
    "description": "융의 개성화 관점에서 이 이야기의 심리적 여정 2~3문장"
  },
  "collective_unconscious_connection": "이 이야기가 집단 무의식의 어떤 층위를 건드리는가 — 어떤 보편적 두려움·욕망과 연결되는가 (2문장)",
  "missing_archetype": "빠진 원형이 있다면 무엇이며 왜 중요한가 (없으면 null)",
  "jung_verdict": "융의 관점에서 이 로그라인의 심리적 깊이와 원형 완성도 종합 평가 2~3문장"
}`;

// ─────────────────────────────────────────────
// 진정성 지수 프롬프트 (Sartre + Camus + Heidegger + Kierkegaard)
// ─────────────────────────────────────────────
const AUTHENTICITY_SYSTEM_PROMPT = `당신은 실존주의 철학에 정통한 서사 분석가입니다.
사르트르·카뮈·하이데거·키르케고르의 이론을 바탕으로 로그라인의 주인공이 진정한 실존적 선택을 하는지 분석합니다.

참고 원전:
  Sartre, J-P. (1943). L'Être et le Néant [존재와 무]. Gallimard.
    — 실존은 본질에 앞선다, 자기기만(mauvaise foi), 타자의 시선(le regard), 상황(situation)
  Sartre, J-P. (1946). L'Existentialisme est un humanisme [실존주의는 휴머니즘이다].
    — 자유와 전적 책임, 참여(engagement)
  Camus, A. (1942). Le Mythe de Sisyphe [시지프 신화]. Gallimard.
    — 부조리(absurde), 반항(révolte), 시지프의 행복
  Camus, A. (1942). L'Étranger [이방인]. Gallimard.
    — 무관심한 우주, 부조리적 인간
  Heidegger, M. (1927). Sein und Zeit [존재와 시간]. Niemeyer.
    — 현존재(Dasein), 피투성(Geworfenheit), 죽음을 향한 존재(Sein-zum-Tode), 진정성(Eigentlichkeit)
  Nietzsche, F. (1883-85). Also sprach Zarathustra [차라투스트라는 이렇게 말했다].
    — 의지에의 의지(Wille zur Macht), 위버멘쉬(Übermensch), 영원회귀(ewige Wiederkehr)
  Kierkegaard, S. (1843). Enten-Eller [이것이냐 저것이냐].
    — 심미적(æstetisk) / 윤리적(etisk) / 종교적(religiøs) 실존 단계

핵심 개념:
  자기기만(Mauvaise foi): 자신의 자유를 부정하고 타인의 시선·역할·운명에 굴복하는 태도
  진정성(Authenticité): 자신의 자유와 책임을 온전히 받아들이는 용기
  피투성(Geworfenheit): 내가 선택하지 않은 채 던져진 상황 — 이것이 출발점
  부조리(Absurde): 의미를 갈망하는 인간과 침묵하는 우주의 충돌
  시지프 순간: 불가능한 조건 속에서도 자신의 상황을 받아들이고 계속 나아가는 순간

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.

{
  "authenticity_score": 0에서 100 사이 정수,
  "authenticity_label": "심각한 자기기만 / 부분적 자기기만 / 불완전한 진정성 / 진정성 있는 실존 / 실존적 각성",
  "facticity": {
    "description": "주인공이 던져진 상황(피투성) — 선택하지 않은 조건들 (Heidegger: Geworfenheit) 1~2문장",
    "response_to_facticity": "주인공이 이 조건에 어떻게 반응하는가 — 도피·수용·반항 중 무엇인가"
  },
  "mauvaise_foi": {
    "present": true 또는 false,
    "elements": ["자기기만 요소 1", "자기기만 요소 2"],
    "description": "주인공의 자기기만 방식 또는 진정성의 근거 2문장 (Sartre: L'Être et le Néant)"
  },
  "genuine_choice": {
    "has_real_choice": true 또는 false,
    "choice_description": "주인공이 하는 가장 핵심적인 선택과 그것이 진짜 선택인지 여부",
    "responsibility_acknowledged": true 또는 false,
    "description": "선택의 진정성 분석 2문장"
  },
  "other_gaze": {
    "present": true 또는 false,
    "who": "타자의 시선을 구현하는 인물 또는 구조",
    "effect": "타자의 시선이 주인공을 어떻게 규정하는가",
    "description": "1~2문장 (Sartre: le regard)"
  },
  "absurdity": {
    "absurd_condition": "주인공이 직면한 부조리한 조건 (Camus: absurde)",
    "response": "반항(révolte) / 도피(évasion) / 수용(acceptation) 중 무엇인가",
    "sisyphus_moment": "이 이야기의 시지프 순간 — 불가능하지만 계속 나아가는 장면 또는 요소",
    "description": "카뮈 관점 분석 1~2문장"
  },
  "kierkegaard_stage": {
    "stage": "심미적(æstetisk) / 윤리적(etisk) / 종교적(religiøs)",
    "description": "이 이야기가 키르케고르의 어느 실존 단계에 있는지, 그리고 단계 전환이 일어나는가 2문장"
  },
  "nietzsche_connection": {
    "will_to_power": "주인공의 의지에의 의지 발현 방식",
    "ubermensch_potential": "위버멘쉬적 가능성 — 자신을 극복하는가",
    "eternal_recurrence_test": "이 상황을 영원히 반복하기를 원할 것인가 — 그것이 삶의 긍정인가"
  },
  "sartre_verdict": "사르트르 관점에서의 종합 평가 — 이 로그라인의 실존적 깊이 2~3문장",
  "authenticity_tip": "진정성을 높이기 위한 구체적 제안 1~2문장 — 주인공이 더 진정한 선택을 하게 하려면"
}`;

const EXPERT_PANEL_SYSTEM_PROMPT = `당신은 10명의 세계적 전문가들이 참여하는 서사 원탁 토론을 시뮬레이션합니다.
각 전문가는 자신의 이론 체계와 실제 학술 원전을 바탕으로 로그라인을 분석하고 서로의 의견에 반응합니다.

## 전문가 패널

### 1. 로버트 맥키 (id: mckee) — 시나리오 구조 전문가
이론 체계: 갈등의 3계층(내적/개인적/사회외적), 장면-시퀀스-행위 계층, 가치 전하(Value Charge)
핵심 원전:
  McKee, R. (1997). Story. HarperCollins.
  Field, S. (1982). Screenplay. Dell.
  Truby, J. (2007). The Anatomy of Story. FSG.
  Goldman, W. (1983). Adventures in the Screen Trade. Warner Books.
  Snyder, B. (2005). Save the Cat. Michael Wiese.
어투: 단호하고 구조적. "이 로그라인에서 갈등의 가치 전하는…"

### 2. 오토르 (id: auteur) — 한국 영화 감독 (박찬욱·봉준호·이창동 스타일 종합)
이론 체계: 도덕적 모호성, 장르 혼종, 한(恨)·정(情) 미학, 시각적 아이러니
핵심 원전:
  Bazin, A. (1967). What is Cinema? UC Press.
  Eisenstein, S. (1949). Film Form. Harcourt.
  Mulvey, L. (1975). Visual Pleasure and Narrative Cinema. Screen 16(3).
  이효인 (2003). 한국영화사 강의. 이론과실천.
어투: 감각적이고 직관적. "관객이 카메라 앞에 서는 순간…"

### 3. 칼 융 (id: jung) — 심층 심리학자
이론 체계: 집단 무의식(Collective Unconscious), 원형(Archetype: Hero·Shadow·Anima/Animus·Self), 개성화(Individuation), 페르소나
핵심 원전:
  Jung, C.G. (1969). The Archetypes and the Collective Unconscious. Princeton UP. [1934-54]
  Jung, C.G. (1971). Psychological Types. Princeton UP. [1921]
  Freud, S. (1900). The Interpretation of Dreams. (무의식과의 비교를 위해)
  Maslow, A. (1943). A Theory of Human Motivation. Psych. Review.
  Erikson, E. (1950). Childhood and Society. Norton.
  Vogler, C. (1992). The Writer's Journey. Michael Wiese.
어투: 심오하고 은유적. "이 주인공의 그림자(Shadow)는…"

### 4. 장-폴 사르트르 (id: sartre) — 실존주의 철학자
이론 체계: 실존은 본질에 앞선다, 자기기만(Mauvaise foi), 타자의 시선(Le regard), 자유와 책임, 부조리
핵심 원전:
  Sartre, J-P. (1943). L'Être et le Néant. Gallimard. [존재와 무]
  Sartre, J-P. (1946). L'Existentialisme est un humanisme. [실존주의는 휴머니즘이다]
  Camus, A. (1942). Le Mythe de Sisyphe. Gallimard. [시지프 신화]
  Nietzsche, F. (1883-85). Also sprach Zarathustra. [차라투스트라는 이렇게 말했다]
  Heidegger, M. (1927). Sein und Zeit. [존재와 시간] — 현존재(Dasein), 피투성(Geworfenheit)
  Kierkegaard, S. (1843). Enten-Eller. [이것이냐 저것이냐] — 심미적/윤리적/종교적 단계
어투: 논쟁적이고 날카롭다. "이 인물이 '자기기만'(mauvaise foi)에 빠진다면…"

### 5. 안톤 체호프 (id: chekhov) — 드라마투르그
이론 체계: 체호프의 총(극적 경제성), 하위텍스트(Subtext), 행동을 통한 성격 묘사, 일상 속의 비극
핵심 원전:
  Chekhov, A.P. Letters (1886-1904). [희곡 작법에 관한 편지들]
  Stanislavski, K. (1936). An Actor Prepares. Theatre Arts Books.
  Brecht, B. (1964). Brecht on Theatre. Hill and Wang. [서사극 이론, 소외 효과(Verfremdungseffekt)]
  Aristotle. Poetics (c.335 BCE). [미메시스, 하마르티아, 카타르시스]
어투: 소박하고 정밀하다. "무대 위에 불필요한 총은 없어야 합니다…"

### 6. 조셉 캠벨 (id: campbell) — 신화학자
이론 체계: 모노미스(Monomyth) 12단계, 원질 신화(ur-myth), 분리-입문-귀환, 신화의 기능(우주론적·사회적·심리적·교육적)
핵심 원전:
  Campbell, J. (1949). The Hero with a Thousand Faces. Pantheon.
  Campbell, J. (1988). The Power of Myth. Doubleday.
  Propp, V. (1928/1968). Morphology of the Folktale. Univ. of Texas Press.
  Lévi-Strauss, C. (1955). The Structural Study of Myth. J. American Folklore.
  Frazer, J.G. (1890). The Golden Bough. Macmillan.
어투: 열정적이고 범신화적. "이 로그라인에서 '모험의 부름'(Call to Adventure)은…"

### 7. 롤랑 바르트 (id: barthes) — 기호학자·문학이론가
이론 체계: 5가지 서사 코드(해석적Hermeneutic·행동적Proairetic·의미론적Semic·상징적Symbolic·문화적Cultural), 신화론(Mythologies), 작가의 죽음
핵심 원전:
  Barthes, R. (1970). S/Z. Seuil.
  Barthes, R. (1957). Mythologies. Seuil.
  Barthes, R. (1968). La mort de l'auteur. Manteia.
  Genette, G. (1972). Narrative Discourse. Cornell UP.
  Ricoeur, P. (1984). Temps et Récit. Seuil. [시간과 서사]
  Todorov, T. (1977). The Poetics of Prose. Cornell UP.
어투: 분석적이고 해체적. "이 로그라인의 해석적 코드(hermeneutic code)는…"

### 8. 피터 드러커 (id: drucker) — 경영·경제 전문가
이론 체계: 목표 관리(Management by Objectives), 고객 중심주의(Customer First), 지식 경제, 혁신과 기업가 정신, 성과 측정
핵심 원전:
  Drucker, P. (1954). The Practice of Management. Harper & Row.
  Drucker, P. (1985). Innovation and Entrepreneurship. HarperCollins.
  Drucker, P. (1999). Management Challenges for the 21st Century. HarperCollins.
  Vogel, H. (2014). Entertainment Industry Economics (9th ed.). Cambridge UP.
  De Vany, A. (2004). Hollywood Economics. Routledge.
어투: 실용적이고 예리하다. "이 콘텐츠가 해결하는 관객의 문제는 무엇인가? 고객(관객)은 왜 이 이야기에 시간과 돈을 지불할 것인가?"

### 9. 필립 코틀러 (id: kotler) — 마케팅 전문가
이론 체계: STP 전략(Segmentation·Targeting·Positioning), 소비자 행동, 브랜드 스토리텔링, 감성 마케팅 3.0, 공감 마케팅
핵심 원전:
  Kotler, P. & Keller, K. (2012). Marketing Management (14th ed.). Pearson.
  Kotler, P. & Scheff, J. (1997). Standing Room Only: Strategies for Marketing the Performing Arts. Harvard Business School Press.
  Kotler, P., Kartajaya, H. & Setiawan, I. (2010). Marketing 3.0. Wiley.
  Eliashberg, J., Elberse, A. & Leenders, M. (2006). The Motion Picture Industry. Marketing Science 25(6).
어투: 전략적이고 시장 지향적. "이 로그라인의 핵심 포지셔닝은? 어떤 감정적 가치 제안(Value Proposition)으로 관객의 마음을 선점하는가?"

### 10. 마이클 포터 (id: porter) — 경쟁전략 전문가
이론 체계: 5가지 경쟁력(Five Forces), 차별화 전략(Differentiation Strategy), 가치 사슬(Value Chain), 경쟁 우위(Competitive Advantage), 블루오션
핵심 원전:
  Porter, M.E. (1980). Competitive Strategy. Free Press.
  Porter, M.E. (1985). Competitive Advantage: Creating and Sustaining Superior Performance. Free Press.
  Porter, M.E. (1996). What Is Strategy? Harvard Business Review, Nov-Dec.
  Kim, W.C. & Mauborgne, R. (2005). Blue Ocean Strategy. Harvard Business School Press.
어투: 분석적이고 전략적. "이 이야기의 지속 가능한 차별화 요소는 무엇인가? 유사 작품들과 비교했을 때 이 로그라인만의 경쟁 우위는?"

## 토론 형식 지침

- 라운드1: 전체 10명이 각자의 이론으로 첫 분석 (각 2~3문장, 원전 인용 필수)
- 라운드2: 서사·심리·철학 전문가 7명(mckee, auteur, jung, sartre, chekhov, campbell, barthes)만 참여. 비즈니스 3명(drucker, kotler, porter)은 라운드1 발언으로 마무리 — 라운드2에 포함하지 마세요.
- 다른 전문가의 발언에 반응 — 동의(agree)/보완(extend)/반론(disagree) 중 하나 (각 2~3문장)
- 반드시 원전을 구체적으로 인용하세요 (예: "사르트르가 《존재와 무》에서 말한 '자기기만'은…")
- 전문가 특유의 어투를 유지하세요
- 로그라인의 구체적 요소(인물, 갈등, 결말 등)에 항상 연결하세요

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.

{
  "panel_title": "토론 제목 (한국어 20자 이내)",
  "round1": [
    {
      "expert_id": "mckee",
      "statement": "초기 분석 발언 (2~3문장, 원전 인용 포함)",
      "reference": "인용한 원전 (저자, 제목, 연도)"
    },
    {
      "expert_id": "auteur",
      "statement": "...",
      "reference": "..."
    },
    {
      "expert_id": "jung",
      "statement": "...",
      "reference": "..."
    },
    {
      "expert_id": "sartre",
      "statement": "...",
      "reference": "..."
    },
    {
      "expert_id": "chekhov",
      "statement": "...",
      "reference": "..."
    },
    {
      "expert_id": "campbell",
      "statement": "...",
      "reference": "..."
    },
    {
      "expert_id": "barthes",
      "statement": "...",
      "reference": "..."
    },
    {
      "expert_id": "drucker",
      "statement": "...",
      "reference": "..."
    },
    {
      "expert_id": "kotler",
      "statement": "...",
      "reference": "..."
    },
    {
      "expert_id": "porter",
      "statement": "...",
      "reference": "..."
    }
  ],
  "round2": [
    {
      "expert_id": "jung",
      "responding_to": "mckee",
      "stance": "extend",
      "statement": "상호 반응 발언 (2~3문장)"
    },
    {
      "expert_id": "sartre",
      "responding_to": "campbell",
      "stance": "disagree",
      "statement": "..."
    },
    {
      "expert_id": "chekhov",
      "responding_to": "barthes",
      "stance": "agree",
      "statement": "..."
    },
    {
      "expert_id": "mckee",
      "responding_to": "sartre",
      "stance": "extend",
      "statement": "..."
    },
    {
      "expert_id": "campbell",
      "responding_to": "jung",
      "stance": "agree",
      "statement": "..."
    }
  ],
  "synthesis": {
    "consensus": "전문가들의 핵심 합의점 (3~4문장, 복수 이론 종합)",
    "improvements": ["구체적 개선 제안 1 (이론 근거 포함)", "구체적 개선 제안 2", "구체적 개선 제안 3"],
    "strongest_element": "현재 로그라인의 가장 강력한 요소 (이론적 근거)",
    "critical_gap": "가장 시급한 보완 포인트 (이론적 근거)",
    "philosophical_core": "이 이야기의 철학적·신화적 핵심 (학술 개념으로 정의)"
  }
}`;

// ─────────────────────────────────────────────
// 비트 시트 프롬프트
// 참고 원전:
//   Snyder, B. (2005). Save the Cat. Michael Wiese. — 15비트, 페이지 배분
//   Truby, J. (2007). The Anatomy of Story. FSG. — 22단계, 씬 기능
//   Field, S. (1982). Screenplay. Dell. — 3막·플롯 포인트
//   McKee, R. (1997). Story. HarperCollins. — 가치 전하
//   Parker, P. (2005). The Art and Science of Screenwriting. Intellect.
// ─────────────────────────────────────────────
const BEAT_SHEET_SYSTEM_PROMPT = `당신은 시나리오 구조 전문가입니다. 제공된 로그라인·시놉시스·트리트먼트를 바탕으로 포맷에 맞는 비트 시트를 생성합니다.

참고 원전:
  Snyder, B. (2005). Save the Cat. Michael Wiese. — 15비트 시스템
  Truby, J. (2007). The Anatomy of Story. FSG. — 씬 기능, 도덕적 논증
  Field, S. (1982). Screenplay. Dell. — 3막 구조, 플롯 포인트 p.25·p.75·p.85
  McKee, R. (1997). Story. HarperCollins. — 가치 전하, 씬-시퀀스-액트 계층
  Parker, P. (2005). The Art and Science of Screenwriting. Intellect.

Snyder 15비트 (장편 110p 기준):
  1막 설정: ①오프닝 이미지(p.1) ②테마 제시(p.5) ③설정(p.1~10) ④촉발 사건(p.12) ⑤망설임(p.12~25) ⑥2막 돌입(p.25)
  2막 전반: ⑦B스토리(p.30) ⑧재미와 게임(p.30~55) ⑨미드포인트(p.55)
  2막 후반: ⑩악당의 반격(p.55~75) ⑪모든 것을 잃다(p.75) ⑫영혼의 어두운 밤(p.75~85) ⑬3막 돌입(p.85)
  3막 해결: ⑭피날레(p.85~110) ⑮최종 이미지(p.110)

포맷별 비트 수 조정 (입력된 포맷 기준):
  초단편 5분≈5p → 5~7비트로 압축
  숏폼 15분≈15p → 7~9비트
  단편영화 30분≈30p → 10~12비트
  웹드라마 파일럿 30분≈30p → 10~12비트 + 다음 화 훅 포함
  TV드라마 1화 55분≈55p → 13~15비트
  장편영화 110분≈110p → 15비트 (Snyder 원본)
  미니시리즈 에피소드당 → 12~15비트

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.

{
  "format_name": "Snyder 15비트 / 압축 비트시트 등",
  "total_pages": 총 페이지 수 정수,
  "beats": [
    {
      "id": 1,
      "name_kr": "오프닝 이미지",
      "name_en": "Opening Image",
      "act": "1막",
      "act_phase": "설정",
      "page_start": 1,
      "page_end": 1,
      "summary": "이 씬에서 구체적으로 일어나는 일 2~3문장. 현재형·시각적으로 서술",
      "dramatic_function": "이 비트가 수행하는 서사적 기능 1문장",
      "value_start": "씬 시작 시 지배적 가치/감정 상태",
      "value_end": "씬 종료 시 변화된 가치/감정 상태",
      "characters_present": ["등장 인물 이름들"],
      "location_hint": "장소 힌트",
      "tone": "씬의 톤·분위기",
      "key_elements": ["반드시 포함되어야 할 서사 요소"]
    }
  ],
  "structure_insight": "이 로그라인의 구조적 특이사항·강점·약점 2~3문장"
}`;

// ─────────────────────────────────────────────
// 씬 생성 프롬프트
// 참고 원전:
//   Stanislavski, K. (1936). An Actor Prepares. — 주어진 상황, 슈퍼-오브젝티브
//   McKee, R. (1997). Story. — 씬 가치 전하, 하위텍스트
//   Hauge, M. (1988). Writing Screenplays That Sell. — 외적 목표 vs 내적 욕구
//   Snyder, B. (2005). Save the Cat. — 씬 기능
// ─────────────────────────────────────────────
const SCENE_GEN_SYSTEM_PROMPT = `당신은 한국 시나리오 전문 작가입니다. 제공된 비트 정보를 바탕으로 완성도 높은 시나리오 씬을 한국어로 작성합니다.

참고 원전:
  Stanislavski, K. (1936). An Actor Prepares. — 주어진 상황, 슈퍼-오브젝티브, 인물 목소리
  McKee, R. (1997). Story. — 씬은 반드시 하나의 가치 전하를 가져야 함
  Hauge, M. (1988). Writing Screenplays That Sell. — 외적 행동 속에 내적 욕구 내포
  Snyder, B. (2005). Save the Cat. — 비트 기능 충족

작성 원칙:
  - 씬 헤더: "내부/외부. 장소명 — 낮/밤/황혼/새벽"
  - 액션 라인: 현재형·3인칭·눈에 보이는 것만 (감정은 행동으로만 표현)
  - 인물명: 대사 위 중앙, 대문자 한국어
  - 대사: 하위텍스트 포함, 말보다 행동이 많은 대사 지양
  - 씬 길이: 페이지 범위 준수 (1페이지 ≈ 55~65 단어)
  - 씬은 시작 가치와 다른 가치로 끝나야 함 (McKee)
  - 불필요한 대사 금지: 보여줄 수 있으면 대사 생략

순수 시나리오 텍스트만 출력하세요. JSON, 마크다운 없이 씬 텍스트만.`;

// ─────────────────────────────────────────────
// 캐릭터 디벨롭 프롬프트
// 참고 원전:
//   Egri, L. (1946). The Art of Dramatic Writing. Simon & Schuster.
//   Hauge, M. (1988). Writing Screenplays That Sell. HarperCollins.
//   Truby, J. (2007). The Anatomy of Story. FSG.
//   Vogler, C. (1992). The Writer's Journey. Michael Wiese.
//   Seger, L. (1990). Creating Unforgettable Characters. Holt.
//   Stanislavski, K. (1936). An Actor Prepares. Theatre Arts Books.
//   Maslow, A. (1943). A Theory of Human Motivation. Psychological Review.
//   Erikson, E. (1950). Childhood and Society. Norton.
//   Jung, C.G. (1969). The Archetypes and the Collective Unconscious. Princeton UP.
//   Snyder, B. (2005). Save the Cat. Michael Wiese.
//   McKee, R. (1997). Story. HarperCollins.
// ─────────────────────────────────────────────
const CHARACTER_DEV_SYSTEM_PROMPT = `당신은 캐릭터 심리학과 서사 이론에 정통한 캐릭터 디벨로퍼입니다.
로그라인에 잠재된 인물들을 학술 이론에 근거해 입체적으로 발굴하고 구조화합니다.

참고 원전 및 핵심 개념:
  Egri, L. (1946). The Art of Dramatic Writing. Simon & Schuster.
    — 캐릭터 3차원: 생리적(Physiological)·사회적(Sociological)·심리적(Psychological)
  Hauge, M. (1988). Writing Screenplays That Sell. HarperCollins.
    — Want(외적 동기) vs Need(내적 욕구), Identity(가면) vs Essence(본질), Wound(상처)·Fear(두려움)
  Truby, J. (2007). The Anatomy of Story. FSG.
    — Ghost(과거 상처가 현재를 지배), Desire vs Need, Self-revelation(자기 계시), Moral Argument
  Vogler, C. (1992). The Writer's Journey. Michael Wiese.
    — 8가지 원형: Hero·Shadow·Mentor·Herald·Threshold Guardian·Shapeshifter·Trickster·Ally
  Seger, L. (1990). Creating Unforgettable Characters. Holt.
    — 캐릭터 아크(긍정적/부정적/정적), 배경사(Backstory), 인물 관계망
  Stanislavski, K. (1936). An Actor Prepares. Theatre Arts Books.
    — 주어진 상황(Given Circumstances), 슈퍼-오브젝티브(Super-objective), 관통 행동
  Maslow, A. (1943). A Theory of Human Motivation. Psychological Review 50(4).
    — 욕구 위계(생리·안전·소속·존중·자아실현)
  Erikson, E. (1950). Childhood and Society. Norton.
    — 심리사회 발달 8단계 — 인물이 어느 단계에서 막혀 있는가
  Jung, C.G. (1969). The Archetypes and the Collective Unconscious. Princeton UP.
    — 그림자(Shadow), 아니마/아니무스, 페르소나 — 인물의 무의식 구조
  Snyder, B. (2005). Save the Cat. Michael Wiese.
    — "믿는 거짓(The Lie the Character Believes)" — 캐릭터 아크의 출발점
  McKee, R. (1997). Story. HarperCollins.
    — 진정한 성격(True Character)은 압박 속에서만 드러난다; 성격(Characterization) vs 캐릭터

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.

{
  "protagonist": {
    "name_suggestion": "이름 제안 (로그라인에 없으면 어울리는 이름 1개 제안, 한국 이름 우선)",
    "egri_dimensions": {
      "physiological": "생리적 차원 — 나이·외모·건강·에너지 수준 등 (Egri 1946)",
      "sociological": "사회적 차원 — 계층·직업·가족·교육·환경·사회적 역할 (Egri 1946)",
      "psychological": "심리적 차원 — 가치관·도덕관·컴플렉스·자아상·반응 패턴 (Egri 1946)"
    },
    "ghost": "과거 트라우마/상처 — 현재 행동을 지배하는 결정적 과거 사건 (Truby 2007: Ghost)",
    "want": "외적 목표 — 이야기에서 달성하려는 구체적이고 가시적인 것 (Hauge 1988: Want)",
    "need": "내적 욕구 — 성장을 위해 실제로 필요한 심리적 변화 (Hauge 1988: Need)",
    "wound": "상처 — Ghost가 남긴 심리적 흔적, 현재의 두려움·회피 행동의 근원 (Hauge 1988)",
    "fear": "핵심 두려움 — Want를 추구하지 못하게 막는 근원적 공포 (Hauge 1988)",
    "lie_they_believe": "믿는 거짓 — 자신이나 세계에 대해 오해하고 있는 핵심 신념 (Snyder 2005)",
    "truth_to_learn": "배워야 할 진실 — 결말에서 깨달아야 하는 반전 (Truby 2007: Self-revelation)",
    "identity_vs_essence": "Identity(공적 가면) vs Essence(내면 본질)의 충돌 설명 (Hauge 1988)",
    "super_objective": "슈퍼-오브젝티브 — 이야기 전체를 관통하는 단 하나의 욕망 (Stanislavski 1936)",
    "maslow_level": "현재 욕구 단계 — 어느 욕구층에서 막혀 있는가 (Maslow 1943): 생리/안전/소속/존중/자아실현",
    "erikson_stage": "어느 발달 단계에서 심리적으로 고착되었는가 (Erikson 1950)",
    "jungian_shadow": "억압된 그림자 — 인정하기 싫어하는 자신의 어두운 면 (Jung 1969)",
    "true_character_test": "McKee식 압박 테스트 — 극한 압박 상황에서 이 인물이 드러낼 진정한 성격은? (McKee 1997)",
    "arc_type": "캐릭터 아크 유형: 긍정적 변화 / 부정적 변화 / 정적 (Seger 1990)",
    "arc_journey": "아크 여정 — 시작 상태 → 전환점 → 종착 상태 (Seger 1990)",
    "voice_hint": "말투·언어 특성 힌트 — 이 인물만의 화법 (Stanislavski 1936: Given Circumstances)"
  },
  "supporting_characters": [
    {
      "role_name": "역할명 (적대자 / 조력자 / 멘토 / 사랑의 대상 등)",
      "vogler_archetype": "Vogler 8원형 중 해당하는 것 (Vogler 1992)",
      "narrative_function": "이야기에서 수행하는 서사적 기능",
      "protagonist_mirror": "주인공의 어느 면을 반영(Mirror)하거나 대조(Foil)하는가",
      "relationship_dynamic": "주인공과의 관계 역학 — 권력 구조, 감정 패턴, 갈등 축",
      "suggested_name": "어울리는 이름 제안"
    }
  ],
  "relationship_web": [
    {
      "pair": "인물A ↔ 인물B",
      "dynamic_type": "동맹 / 적대 / 경쟁 / 의존 / 트라우마 유발 중 해당하는 것",
      "dramatic_tension": "이 관계에서 발생하는 드라마틱 긴장과 그 기능"
    }
  ],
  "moral_argument": "이 이야기의 도덕적 논증 — 어떤 가치관이 충돌하고 무엇이 옳다고 말하는가 (Truby 2007: Moral Argument)",
  "missing_archetype": "Vogler 8원형 중 현재 로그라인에 빠진 원형과 그것이 필요한 이유 (없으면 null)",
  "character_development_tips": [
    "구체적 발전 제안 1 — 이론적 근거 포함",
    "구체적 발전 제안 2",
    "구체적 발전 제안 3"
  ]
}`;

// ─────────────────────────────────────────────
// 트리트먼트 생성 프롬프트
// 참고 원전:
//   Field, S. (1982). Screenplay: The Foundations of Screenwriting. Dell.
//   Seger, L. (1987). Making a Good Script Great. Dodd, Mead.
//   Hauge, M. (1988). Writing Screenplays That Sell. HarperCollins.
//   Snyder, B. (2005). Save the Cat. Michael Wiese Productions.
//   McKee, R. (1997). Story. HarperCollins.
//   Truby, J. (2007). The Anatomy of Story. FSG.
// ─────────────────────────────────────────────
const TREATMENT_SYSTEM_PROMPT = `당신은 전문 트리트먼트 작가입니다. 제공된 로그라인·시놉시스·캐릭터 정보를 바탕으로 완성도 높은 트리트먼트를 작성합니다.

참고 원전:
  Field, S. (1982). Screenplay. — 3막 구조, 플롯 포인트 1·2
  Seger, L. (1987). Making a Good Script Great. — 씬 구성, 인물 심화
  Hauge, M. (1988). Writing Screenplays That Sell. — 외적 동기 vs 내적 욕구
  Snyder, B. (2005). Save the Cat. — 비트 시트(15개 비트), 테마 스테이트먼트
  McKee, R. (1997). Story. — 가치 전하, 씬-시퀀스-액트 계층
  Truby, J. (2007). The Anatomy of Story. — 22단계 구조, 도덕적 논증

트리트먼트 작성 원칙:
  1. 현재형·능동태·시각적 언어로 작성 — "박민준은 문을 열었다" (×) → "박민준이 문을 연다" (○)
  2. 감정과 행동을 동시에 묘사 — 내면 상태를 행동으로 표현
  3. 대사는 극히 최소화 — 꼭 필요한 경우만 이탤릭 처리
  4. 각 씬은 드라마틱 기능(목적)이 명확해야 함
  5. 막 전환점(플롯 포인트)에서 가치가 완전히 뒤집혀야 함 (McKee)
  6. 주인공의 외적 목표(Want)와 내적 욕구(Need)가 충돌해야 함 (Hauge)

출력 형식:
반드시 아래 마크다운 구조로 작성하세요. JSON이 아닌 순수 마크다운 산문입니다.
코드블록(\`\`\`) 없이 마크다운 텍스트만 출력하세요.

---
# [제목]

**포맷** | **장르** | **분량**

---

## 테마 스테이트먼트

*한 줄 주제문 — 이 이야기가 말하고자 하는 것 (Snyder: "What is it about on a thematic level?")*

---

## 등장인물

### [주인공 이름] — [역할]
- **외적 목표(Want)**: 이야기에서 달성하려는 구체적 목표
- **내적 욕구(Need)**: 주인공이 깨달아야 할 진정한 결핍
- **핵심 결함**: 여정을 방해하는 심리적 상처나 약점
- **변화 호**: 시작 → 끝의 인물 변화 방향

### [주요 인물 이름] — [역할]
- 인물 설명 및 주인공과의 관계·기능

(추가 인물 반복)

---

## 1막 — 설정 (Setup) [전체의 약 25%]

[씬 단위 산문 서술. 각 씬은 1~2문단. 오프닝 이미지, 주제 제시, 주인공 소개, 촉발 사건, 1막 전환점 포함.]

**[플롯 포인트 1]** — *가치 전하: [시작 가치] → [반전 가치]*
[전환점 씬 상세 서술]

---

## 2막 전반 — 새로운 세계 (Fun & Games) [전체의 약 25%]

[씬 단위 산문 서술. 주인공이 새로운 규칙을 탐색하고 적응하는 과정.]

---

## 2막 후반 — 압박과 위기 (Pressure & Crisis) [전체의 약 25%]

[씬 단위 산문 서술. 미드포인트, 악당의 반격, 모든 것을 잃는 순간(Dark Night of the Soul) 포함.]

**[플롯 포인트 2 — 다크 나이트]** — *가치 전하: [가치] → [극단]*
[전환점 씬 상세 서술]

---

## 3막 — 결말 (Resolution) [전체의 약 25%]

[씬 단위 산문 서술. 클라이맥스, 주인공의 최종 선택, 결말 이미지 포함.]

**[클라이맥스]** — *가치 전하: [극단] → [최종 가치]*
[클라이맥스 씬 상세 서술]

---

## 핵심 씬 요약

| # | 씬 제목 | 드라마틱 기능 | 가치 변화 |
|---|---------|-------------|----------|
| 1 | 오프닝 이미지 | 세계관·주인공 소개 | - |
| 2 | ... | ... | ... |
(10~20개)

---

## 톤 & 시각적 레퍼런스

[이 작품의 미장센, 색채, 리듬, 참고 작품 1~2개 (한국 영화 우선)]
`;

// ─────────────────────────────────────────────
// 하위텍스트 탐지 (Chekhov·Stanislavski·Brecht)
// ─────────────────────────────────────────────
const SUBTEXT_SYSTEM_PROMPT = `당신은 드라마투르기와 연기 이론에 정통한 하위텍스트 분석가입니다.

참고 원전:
  Chekhov, A.P. Letters (1886-1904). — 체호프의 총(극적 경제성), 보여주되 말하지 말 것
  Stanislavski, K. (1936). An Actor Prepares. Theatre Arts Books. — 슈퍼-오브젝티브, 즉각적 목표, 주어진 상황
  Brecht, B. (1964). Brecht on Theatre. Hill and Wang. — 소외 효과(Verfremdungseffekt), 제스투스
  Pinter, H. (1960). The Birthday Party. — 위협적 침묵, 명시되지 않은 과거
  Mamet, D. (1986). Writing in Restaurants. — 대사 아래 흐르는 진짜 의미

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.
{
  "subtext_score": 0에서 100 사이 정수,
  "subtext_level": "없음 / 얕음 / 보통 / 깊음 / 심층",
  "surface_story": "표면적 이야기 — 관객이 눈으로 보는 것 1~2문장",
  "deeper_story": "하위텍스트 이야기 — 실제로 일어나는 것 1~2문장",
  "chekhovs_guns": [
    {
      "element": "도입된 요소",
      "function": "이 요소가 나중에 해소되어야 하는 방식",
      "is_loaded": true 또는 false
    }
  ],
  "dramatic_irony": {
    "present": true 또는 false,
    "description": "관객이 알고 인물이 모르는 것 (있으면 설명, 없으면 null)"
  },
  "unspoken_desires": [
    {
      "character": "인물명 또는 역할",
      "surface_want": "말하거나 표면적으로 원하는 것",
      "real_need": "실제로 원하거나 두려워하는 것 (Stanislavski: 진정한 목표)"
    }
  ],
  "silence_power": "침묵·공백·행동이 대사보다 강한 순간 또는 가능성 설명",
  "brecht_alienation": "브레히트 소외 효과 관점 — 이 이야기가 관객을 불편하게 만드는 방식",
  "subtext_weakness": "현재 로그라인에서 하위텍스트가 가장 약한 부분과 개선 방향",
  "chekhov_verdict": "체호프·스타니슬랍스키 관점 종합 평가 2~3문장"
}`;

// ─────────────────────────────────────────────
// 신화적 위치 매핑 (Campbell)
// ─────────────────────────────────────────────
const MYTH_MAP_SYSTEM_PROMPT = `당신은 비교신화학과 서사 원형에 정통한 분석가입니다.

참고 원전:
  Campbell, J. (1949). The Hero with a Thousand Faces. Pantheon Books.
    — 모노미스(Monomyth) 12단계: 소명·소명 거부·초자연적 조력·첫 관문 통과·시련의 길·지고의 시련·보상·귀환 길·부활·불사의 영약 귀환
  Campbell, J. (1988). The Power of Myth. Doubleday.
    — 신화의 4기능: 우주론·사회·심리·교육
  Propp, V. (1928/1968). Morphology of the Folktale. Univ. of Texas Press.
    — 31개 서사 기능, 7개 행위자(악당·기증자·조력자·공주·파견자·영웅·가짜 영웅)
  Frazer, J.G. (1890). The Golden Bough. Macmillan. — 죽음과 부활 신화
  Lévi-Strauss, C. (1955). The Structural Study of Myth. J. American Folklore.

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.
{
  "primary_stage": "로그라인이 주로 다루는 영웅의 여정 단계 (Campbell 12단계 중)",
  "stages_covered": ["다루는 단계들 목록"],
  "journey_phases": {
    "departure": "분리 단계 — 어떻게 일상 세계에서 떠나는가",
    "initiation": "입문 단계 — 어떤 시련과 변환을 겪는가",
    "return": "귀환 단계 — 어떤 선물을 가지고 어떻게 돌아오는가 (또는 왜 귀환이 불가능한가)"
  },
  "propp_functions": ["해당하는 Propp 서사 기능들 (31개 중 주요 것들)"],
  "archetype_roles": {
    "hero": "영웅 — 누가 어떤 여정을 걷는가",
    "shadow": "악당/그림자 — 영웅과 대립하는 힘",
    "mentor": "멘토 — 지혜와 도구를 주는 존재 (없으면 null)",
    "herald": "전령 — 변화를 알리는 존재",
    "threshold_guardian": "관문 수호자 — 첫 번째 장벽"
  },
  "universal_myth_parallel": "어떤 세계 신화·원형 이야기와 가장 강하게 공명하는가 (구체적 신화명 포함)",
  "myth_function": "이 이야기가 수행하는 신화의 4기능 중 어떤 것인가",
  "missing_journey_element": "영웅의 여정에서 현재 로그라인에 빠진 핵심 단계와 그 의미",
  "campbell_verdict": "캠벨 관점 종합 평가 2~3문장"
}`;

// ─────────────────────────────────────────────
// 바르트 5개 서사 코드 (Barthes S/Z)
// ─────────────────────────────────────────────
const BARTHES_CODE_SYSTEM_PROMPT = `당신은 기호학과 서사 이론에 정통한 분석가입니다.

참고 원전:
  Barthes, R. (1970). S/Z. Seuil. — 5개 서사 코드 체계
  Barthes, R. (1957). Mythologies. Seuil. — 신화(Myth)로서의 대중문화
  Barthes, R. (1968). La mort de l'auteur. Manteia. — 작가의 죽음, 독자의 탄생
  Genette, G. (1972). Narrative Discourse. Cornell UP.
  Ricoeur, P. (1984). Temps et Récit. Seuil.

5개 코드 정의:
  해석적 코드(Hermeneutic): 수수께끼·긴장·정보 격차 — "그래서 어떻게 되는가?"
  행동적 코드(Proairetic): 행동·플롯·인과 사슬 — 사건이 다음 사건을 어떻게 부르는가
  의미론적 코드(Semic): 인물·장소·분위기의 의미론적 특성 — 암시와 연상
  상징적 코드(Symbolic): 대립·역설·이항 구조 — 삶/죽음, 자연/문명, 남/여
  문화적 코드(Cultural/Referential): 사회·문화·지식 참조 — 어떤 문화적 전제를 공유하는가

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.
{
  "hermeneutic_code": {
    "score": 0에서 20 사이 정수,
    "central_enigma": "이 이야기의 중심 수수께끼",
    "information_gaps": ["핵심 정보 격차 1", "정보 격차 2"],
    "analysis": "해석적 코드 분석 1~2문장"
  },
  "proairetic_code": {
    "score": 0에서 20 사이 정수,
    "action_chain": "핵심 행동 인과 사슬 설명",
    "momentum": "서사 추진력의 강도 — 약/보통/강",
    "analysis": "행동적 코드 분석 1~2문장"
  },
  "semic_code": {
    "score": 0에서 20 사이 정수,
    "key_connotations": ["인물·공간·분위기의 핵심 의미 연상들"],
    "analysis": "의미론적 코드 분석 1~2문장"
  },
  "symbolic_code": {
    "score": 0에서 20 사이 정수,
    "binary_oppositions": ["핵심 이항 대립 1 (예: 삶↔죽음)", "이항 대립 2"],
    "symbolic_core": "이 이야기의 상징적 핵심 1문장",
    "analysis": "상징적 코드 분석 1~2문장"
  },
  "cultural_code": {
    "score": 0에서 20 사이 정수,
    "cultural_references": ["참조하는 문화적 지식·관습·시대 1", "참조 2"],
    "target_reader": "이 코드가 전제하는 이상적 독자/관객",
    "analysis": "문화적 코드 분석 1~2문장"
  },
  "total_activation": 0에서 100 사이 정수,
  "dominant_code": "가장 강하게 활성화된 코드",
  "weakest_code": "가장 약한 코드와 강화 방법",
  "barthes_verdict": "바르트 관점 종합 평가 2~3문장"
}`;

// ─────────────────────────────────────────────
// 한국 신화 공명 분석
// ─────────────────────────────────────────────
const KOREAN_MYTH_SYSTEM_PROMPT = `당신은 한국 미학·신화·무속 전통에 정통한 서사 분석가입니다.

참고 원전:
  최길성 (1978). 한국 무속의 이해. 예문서원. — 무속 신화, 본풀이
  조동일 (1994). 한국문학통사. 지식산업사. — 한국 서사 전통, 판소리, 민담
  이어령 (1982). 흙 속에 저 바람 속에. 문학사상. — 한(恨)·정(情) 미학
  김열규 (1997). 메멘토 모리, 한국인의 죽음관. 궁리. — 한국적 죽음과 한
  천이두 (1993). 한의 구조 연구. 문학과지성사. — 한의 구조
  박찬욱·봉준호·이창동 영화 — 현대 한국 영화의 신화적 계승
  단군신화, 주몽신화, 심청전, 춘향전, 홍길동전, 바리데기 신화

핵심 개념:
  한(恨): 억눌린 슬픔·원한·그리움의 복합 감정 — 해소(풀림)를 향하는 에너지
  정(情): 관계의 끈끈한 유대 — 이성적 판단을 넘어선 감정적 연결
  신명(神明): 신들림·도취·집단적 흥(興) — 한이 역전되는 순간의 에너지
  눈치: 말하지 않아도 아는 암묵적 이해
  체면(體面): 사회적 자아와 내면의 긴장

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.
{
  "han_resonance": {
    "score": 0에서 25 사이 정수,
    "source": "한의 원천 — 무엇이 억눌리고 쌓였는가",
    "resolution_potential": "한이 풀릴(해소될) 가능성 — 높음/중간/낮음/없음",
    "analysis": "한 분석 1~2문장"
  },
  "jeong_resonance": {
    "score": 0에서 25 사이 정수,
    "jeong_pairs": ["정이 얽힌 관계 쌍들"],
    "jeong_vs_reason": "정과 이성(도리) 사이의 갈등 구조",
    "analysis": "정 분석 1~2문장"
  },
  "sinmyeong_element": {
    "score": 0에서 25 사이 정수,
    "when": "신명이 터지는 순간 또는 가능성",
    "collective_aspect": "집단적 흥의 요소가 있는가",
    "analysis": "신명 분석 1문장"
  },
  "korean_archetypes": [
    {
      "archetype": "한국 원형 인물명 (예: 효녀, 의적, 무당, 빙의된 자)",
      "character": "이 원형에 해당하는 인물",
      "tradition": "연결되는 한국 신화·설화·문학 전통"
    }
  ],
  "myth_parallel": "가장 강하게 공명하는 한국 신화·설화·판소리 작품과 그 이유",
  "shamanic_structure": "무속 제의 구조(청신·오신·송신)와의 서사적 유사성 설명 또는 null",
  "confucian_tension": "유교적 가치(효·충·의·예)와 개인 욕망 사이의 갈등 구조",
  "modern_korean_film": "이 이야기가 계승하는 현대 한국 영화 전통 (박찬욱/봉준호/이창동 중 가장 가까운 감독과 그 이유)",
  "korean_myth_verdict": "한국 신화·미학 관점 종합 평가 2~3문장"
}`;

// ─────────────────────────────────────────────
// Script Coverage 프롬프트
// ─────────────────────────────────────────────
const SCRIPT_COVERAGE_SYSTEM_PROMPT = `당신은 할리우드 스튜디오와 한국 방송사의 Script Coverage 전문가입니다.

표준 Script Coverage 형식:
  Hollywood Script Coverage (WGA·CAA·ICM 기준)
  한국 방송사 드라마 기획서 평가 (KBS·MBC·tvN 형식 참조)

평가 기준:
  Premise(전제): 얼마나 강력하고 신선한 아이디어인가
  Story(이야기): 구조·플롯·페이싱의 완성도
  Character(인물): 입체성·공감성·아크 명확성
  Dialogue(대사): 개성·하위텍스트·적절성 (로그라인 단계에서는 잠재력 평가)
  Setting(세계관): 시공간 설정의 설득력과 독창성
  Marketability(시장성): 제작·배급 가능성, 타깃 관객 명확성

등급: RECOMMEND / CONSIDER / PASS / STRONG PASS (최우수)

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.
{
  "title_suggestion": "로그라인에서 추출한 가제 제안",
  "logline_summary": "한 줄 요약 (Coverage 상단 표기용)",
  "format": "장편/드라마/웹드라마 등",
  "genre": "장르",
  "scores": {
    "premise": {"score": 1에서 10, "grade": "A/B/C/D/F", "comment": "1~2문장"},
    "story": {"score": 1에서 10, "grade": "A/B/C/D/F", "comment": "1~2문장"},
    "character": {"score": 1에서 10, "grade": "A/B/C/D/F", "comment": "1~2문장"},
    "dialogue_potential": {"score": 1에서 10, "grade": "A/B/C/D/F", "comment": "1~2문장"},
    "setting": {"score": 1에서 10, "grade": "A/B/C/D/F", "comment": "1~2문장"},
    "marketability": {"score": 1에서 10, "grade": "A/B/C/D/F", "comment": "1~2문장"}
  },
  "overall_score": 1에서 10 정수,
  "recommendation": "STRONG PASS 또는 RECOMMEND 또는 CONSIDER 또는 PASS",
  "strengths": ["강점 1", "강점 2", "강점 3"],
  "weaknesses": ["약점 1", "약점 2"],
  "comparable_works": ["비교 가능한 작품 1 (한국 영화/드라마 우선)", "비교 작품 2"],
  "target_platform": "추천 플랫폼 (Netflix·tvN·극장·웹 등)",
  "reader_comment": "Coverage 리더의 총평 — 실제 Coverage 문서 어투로 3~4문장. 객관적이고 전문적으로."
}`;

// ─────────────────────────────────────────────
// 대사 디벨롭 프롬프트
// ─────────────────────────────────────────────
const DIALOGUE_DEV_SYSTEM_PROMPT = `당신은 시나리오 대사 전문가입니다. 인물별 고유한 목소리를 설계하고 하위텍스트 대사 기법을 적용합니다.

참고 원전:
  Stanislavski, K. (1936). An Actor Prepares. — 슈퍼-오브젝티브, 즉각적 목표, 주어진 상황
  Mamet, D. (1986). Writing in Restaurants. — 대사는 행동이다. 말하지 않는 것이 더 강하다.
  Pinter, H. (1960). The Birthday Party. — 위협적 침묵, 불완전한 문장의 힘
  McKee, R. (1997). Story. — On Dialogue: 하위텍스트, 행동 대사
  Truby, J. (2007). The Anatomy of Story. — Dialogue as Moral Argument
  Field, S. (1982). Screenplay. — Character Voice

핵심 원칙:
  1. 모든 대사는 행동이다 (Mamet): 인물이 대사로 무언가를 원한다
  2. 하위텍스트: 말하는 것 ≠ 의미하는 것
  3. 인물마다 다른 어휘·리듬·패턴
  4. 침묵과 말 끊김이 대사보다 강력할 수 있다

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 JSON만 출력하세요.
{
  "character_voices": [
    {
      "character": "인물명 또는 역할",
      "speech_pattern": "말투 패턴 — 문장 길이·리듬·특이한 어법",
      "vocabulary_level": "어휘 수준 — 고급/중간/구어체/방언 등",
      "what_they_never_say": "절대 직접적으로 말하지 않는 것 — 하위텍스트의 원천",
      "verbal_tic": "말버릇 또는 반복 패턴",
      "sample_line": "이 인물이 할 법한 대사 예시 1줄"
    }
  ],
  "subtext_techniques": [
    {
      "technique": "하위텍스트 기법명 (예: 화제 전환, 침묵, 부정으로 긍정, 과잉 친절)",
      "when_to_use": "어느 감정·상황에 효과적인가",
      "example": "이 로그라인에서 적용 예시"
    }
  ],
  "key_scene_dialogue": {
    "scene_context": "핵심 대결 또는 감정 절정 씬의 상황",
    "dialogue_draft": "해당 씬의 대사 초안 (5~10줄, 하위텍스트 포함)",
    "subtext_note": "이 대사에서 실제로 일어나는 것 설명"
  },
  "dialogue_pitfalls": ["이 이야기에서 피해야 할 대사 실수들"],
  "voice_consistency_tips": "인물별 목소리 일관성 유지 방법 1~2문장"
}`;

// ─────────────────────────────────────────────
// 평가 기준 가이드 (툴팁용)
// ─────────────────────────────────────────────
const CRITERIA_GUIDE = {
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
const GENRES = [
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

const EXAMPLE_LOGLINES = [
  "평생 거짓말을 밥 먹듯 하던 천재 변호사가, 아들의 생일 소원 때문에 24시간 동안 단 한마디의 거짓말도 할 수 없게 되면서, 가장 중요한 재판에서 진실만으로 승리해야 한다.",
  "기억을 지우는 시술을 받은 남자가 지워진 연인의 흔적을 되찾기 위해 자신의 무의식 속으로 여행한다.",
  "좀비 바이러스가 퍼진 서울행 KTX 안에서 한 아빠가 딸을 지키기 위해 사투를 벌인다.",
];

// ─────────────────────────────────────────────
// 한국어 레이블
// ─────────────────────────────────────────────
const LABELS_KR = {
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

// ─────────────────────────────────────────────
// 유틸리티
// ─────────────────────────────────────────────
function getGrade(score) {
  if (score >= 90) return { grade: "S", color: "#FFD700", label: "프로 수준" };
  if (score >= 80) return { grade: "A", color: "#4ECCA3", label: "우수" };
  if (score >= 70) return { grade: "B", color: "#45B7D1", label: "양호" };
  if (score >= 60) return { grade: "C", color: "#F7A072", label: "보통" };
  if (score >= 50) return { grade: "D", color: "#E85D75", label: "미흡" };
  return { grade: "F", color: "#C62828", label: "재작성 필요" };
}

function getInterestLevel(score) {
  if (score >= 85) return { label: "매우 흥미로움", emoji: "🔥", color: "#FFD700" };
  if (score >= 70) return { label: "흥미로움", emoji: "✨", color: "#4ECCA3" };
  if (score >= 55) return { label: "보통", emoji: "💡", color: "#F7A072" };
  if (score >= 40) return { label: "다소 부족", emoji: "😐", color: "#E85D75" };
  return { label: "흥미 유발 약함", emoji: "💤", color: "#C62828" };
}

function formatDate(iso) {
  const d = new Date(iso);
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${M}/${D} ${h}:${m}`;
}

function calcSectionTotal(result, section) {
  if (!result || !result[section]) return 0;
  return Object.values(result[section]).reduce((s, v) => s + (v.score || 0), 0);
}

async function callClaude(apiKey, systemPrompt, userMessage, maxTokens = 8000) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API 오류 (${response.status})`);
  }

  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";

  // 마크다운 코드블록 제거 후 JSON 시작/끝 추출
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);

  // ── JSON 강화 수정 ──
  // 1) 문자열 내부의 이스케이프되지 않은 따옴표를 룩어헤드로 감지
  // 2) 백슬래시 뒤 실제 제어문자 처리
  // 3) 추가 제어문자 전부 이스케이프
  let fixed = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    // 이전 문자가 백슬래시였을 때
    if (escaped) {
      if      (ch === "\n") { fixed += "n"; }
      else if (ch === "\r") { fixed += "r"; }
      else if (ch === "\t") { fixed += "t"; }
      else                  { fixed += ch; }
      escaped = false;
      continue;
    }

    // 문자열 내부 백슬래시
    if (ch === "\\" && inString) { fixed += ch; escaped = true; continue; }

    // 따옴표: 문자열 내부에서는 룩어헤드로 진짜 닫힘 여부 판단
    if (ch === '"') {
      if (inString) {
        // 다음 비공백 문자가 JSON 구조 문자이면 진짜 닫힘 따옴표
        let j = i + 1;
        while (j < cleaned.length && (cleaned[j] === " " || cleaned[j] === "\n" || cleaned[j] === "\r" || cleaned[j] === "\t")) j++;
        const nxt = cleaned[j];
        const isClose = nxt === ":" || nxt === "," || nxt === "}" || nxt === "]" || j >= cleaned.length;
        if (isClose) { inString = false; fixed += ch; }
        else          { fixed += '\\"'; }          // 내부 따옴표 → 이스케이프
      } else {
        inString = true;
        fixed += ch;
      }
      continue;
    }

    // 문자열 내부의 모든 제어문자 이스케이프
    if (inString) {
      if (ch === "\n") { fixed += "\\n"; continue; }
      if (ch === "\r") { fixed += "\\r"; continue; }
      if (ch === "\t") { fixed += "\\t"; continue; }
      if (ch === "\f") { fixed += "\\f"; continue; }
      if (ch === "\b") { fixed += "\\b"; continue; }
      const code = ch.charCodeAt(0);
      if (code < 0x20) { fixed += `\\u${code.toString(16).padStart(4, "0")}`; continue; }
    }

    fixed += ch;
  }

  return JSON.parse(fixed);
}

// ─────────────────────────────────────────────
// API KEY MODAL
// ─────────────────────────────────────────────
function ApiKeyModal({ initialKey = "", onSave, onCancel }) {
  const [key, setKey] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#13131f",
          border: "1px solid rgba(78,204,163,0.3)",
          borderRadius: 16,
          padding: 32,
          maxWidth: 440,
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#e8e8f0",
            marginBottom: 8,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          🔑 API 키 설정
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            marginBottom: 20,
            lineHeight: 1.7,
          }}
        >
          Anthropic API 키를 입력하세요.
          <br />
          키는 이 브라우저에만 저장되며 서버로 전송되지 않습니다.
        </div>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={showKey ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && key.trim() && onSave(key.trim())}
            placeholder="sk-ant-api03-..."
            style={{
              width: "100%",
              padding: "12px 44px 12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "#e8e8f0",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 14,
              padding: 0,
            }}
          >
            {showKey ? "🙈" : "👁"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => key.trim() && onSave(key.trim())}
            disabled={!key.trim()}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: "none",
              cursor: key.trim() ? "pointer" : "not-allowed",
              background: key.trim()
                ? "linear-gradient(135deg, #4ECCA3, #45B7D1)"
                : "rgba(255,255,255,0.06)",
              color: key.trim() ? "#0d0d1a" : "rgba(255,255,255,0.3)",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            저장
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: "11px 20px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              취소
            </button>
          )}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            lineHeight: 1.6,
          }}
        >
          키가 없으신가요? console.anthropic.com 에서 발급받으세요.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GUIDE TOOLTIP
// ─────────────────────────────────────────────
function GuideTooltip({ criterionKey }) {
  const [show, setShow] = useState(false);
  const guide = CRITERIA_GUIDE[criterionKey];
  if (!guide) return null;

  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 5 }}>
      <span
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: show ? "rgba(78,204,163,0.2)" : "rgba(255,255,255,0.08)",
          color: show ? "#4ECCA3" : "rgba(255,255,255,0.35)",
          fontSize: 9,
          cursor: "pointer",
          fontWeight: 700,
          verticalAlign: "middle",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        ?
      </span>
      {show && (
        <>
          <div
            onClick={() => setShow(false)}
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
          />
          <div
            style={{
              position: "absolute",
              left: 20,
              top: -4,
              zIndex: 100,
              width: 230,
              background: "#1a1a2e",
              border: "1px solid rgba(78,204,163,0.25)",
              borderRadius: 10,
              padding: "10px 13px",
              fontSize: 11,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.75)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            {guide}
          </div>
        </>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────
// 레이더 차트 SVG
// ─────────────────────────────────────────────
function RadarChart({ data, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = data.length;
  const angleStep = 360 / n;
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  function polarToCart(angle, radius) {
    const a = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }

  const points = data
    .map((d, i) => {
      const p = polarToCart(i * angleStep, r * d.value);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size }}>
      {gridLevels.map((lv, li) => (
        <polygon
          key={li}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={li === 4 ? 1.5 : 0.5}
          points={Array.from({ length: n }, (_, i) => {
            const p = polarToCart(i * angleStep, r * lv);
            return `${p.x},${p.y}`;
          }).join(" ")}
        />
      ))}
      {data.map((_, i) => {
        const p = polarToCart(i * angleStep, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
          />
        );
      })}
      <polygon
        points={points}
        fill="rgba(78,204,163,0.18)"
        stroke="#4ECCA3"
        strokeWidth={2}
      />
      {data.map((d, i) => {
        const p = polarToCart(i * angleStep, r * d.value);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="#4ECCA3"
            stroke="#1a1a2e"
            strokeWidth={1.5}
          />
        );
      })}
      {data.map((d, i) => {
        const p = polarToCart(i * angleStep, r + 22);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.65)"
            fontSize={10}
            fontFamily="'Noto Sans KR', sans-serif"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// 스코어 바
// ─────────────────────────────────────────────
function ScoreBar({ score, max, label, found, feedback, delay = 0, criterionKey }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColor =
    pct >= 80 ? "#4ECCA3" : pct >= 60 ? "#45B7D1" : pct >= 40 ? "#F7A072" : "#E85D75";
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        marginBottom: 12,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
          cursor: feedback ? "pointer" : "default",
        }}
        onClick={() => feedback && setExpanded(!expanded)}
      >
        <span
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.8)",
            fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {label}
          <GuideTooltip criterionKey={criterionKey} />
          {feedback && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: 3 }}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: barColor,
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          {score}/{max}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: show ? `${pct}%` : "0%",
            background: barColor,
            borderRadius: 3,
            transition: "width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        />
      </div>
      {found && (
        <div
          style={{
            fontSize: 11,
            color: "rgba(78,204,163,0.7)",
            marginTop: 3,
            fontStyle: "italic",
          }}
        >
          감지: &ldquo;{found}&rdquo;
        </div>
      )}
      {expanded && feedback && (
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            marginTop: 6,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            borderLeft: `2px solid ${barColor}`,
            lineHeight: 1.6,
          }}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 원형 점수 게이지
// ─────────────────────────────────────────────
function CircleGauge({ score, label, subLabel, size = 120 }) {
  const gradeInfo = label === "흥미도" ? getInterestLevel(score) : getGrade(score);
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = gradeInfo.color;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.25,0.46,0.45,0.94)" }}
        />
      </svg>
      <div
        style={{
          marginTop: -size + 10,
          height: size,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: size < 110 ? 22 : 28,
            fontWeight: 800,
            color,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{label}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginTop: 4 }}>
        {label === "흥미도"
          ? `${gradeInfo.emoji} ${gradeInfo.label}`
          : `${gradeInfo.grade}등급 · ${gradeInfo.label}`}
      </div>
      {subLabel && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
          {subLabel}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 점수 추이 차트 (SVG 라인 차트)
// ─────────────────────────────────────────────
function ScoreHistoryChart({ history }) {
  if (history.length < 2) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "36px 20px",
          color: "rgba(255,255,255,0.3)",
          fontSize: 13,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        분석 기록이 2개 이상이면 추이 그래프가 표시됩니다.
      </div>
    );
  }

  const W = 560;
  const H = 200;
  const PX = 36;
  const PY = 16;
  const plotW = W - PX * 2;
  const plotH = H - PY * 2;

  // 오래된 것부터 최신 순으로, 최근 10개
  const items = [...history].reverse().slice(-10);
  const n = items.length;

  function toX(i) {
    return PX + (i / (n - 1)) * plotW;
  }
  function toY(val) {
    return PY + plotH - (val / 100) * plotH;
  }

  const qualityPts = items.map((h, i) => `${toX(i)},${toY(h.qualityScore)}`).join(" ");
  const interestPts = items.map((h, i) => `${toX(i)},${toY(h.interestScore)}`).join(" ");

  const gridY = [0, 25, 50, 75, 100];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <div
            style={{
              width: 20,
              height: 2,
              background: "#4ECCA3",
              borderRadius: 1,
            }}
          />
          품질 점수
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <div
            style={{
              width: 20,
              height: 2,
              background: "#FFD700",
              borderRadius: 1,
            }}
          />
          흥미도
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
        {gridY.map((y) => (
          <g key={y}>
            <line
              x1={PX}
              y1={toY(y)}
              x2={W - PX}
              y2={toY(y)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
            <text
              x={PX - 6}
              y={toY(y)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.25)"
              fontSize={9}
            >
              {y}
            </text>
          </g>
        ))}
        {/* 품질 라인 */}
        <polyline
          points={qualityPts}
          fill="none"
          stroke="#4ECCA3"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 흥미도 라인 */}
        <polyline
          points={interestPts}
          fill="none"
          stroke="#FFD700"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 데이터 포인트 */}
        {items.map((h, i) => (
          <g key={i}>
            <circle
              cx={toX(i)}
              cy={toY(h.qualityScore)}
              r={4}
              fill="#4ECCA3"
              stroke="#0d0d1a"
              strokeWidth={1.5}
            />
            <circle
              cx={toX(i)}
              cy={toY(h.interestScore)}
              r={4}
              fill="#FFD700"
              stroke="#0d0d1a"
              strokeWidth={1.5}
            />
            <text
              x={toX(i)}
              y={H - 3}
              textAnchor="middle"
              fill="rgba(255,255,255,0.25)"
              fontSize={8}
            >
              {formatDate(h.date).split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// 분석 기록 패널
// ─────────────────────────────────────────────
function HistoryPanel({ history, onSelect, onDelete, onClear, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        background: "#0f0f1e",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: "20px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#e8e8f0",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          분석 기록 ({history.length})
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {history.length > 0 && (
            <button
              onClick={onClear}
              style={{
                background: "none",
                border: "none",
                color: "rgba(232,93,117,0.65)",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Noto Sans KR', sans-serif",
                padding: 0,
              }}
            >
              전체 삭제
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {history.length === 0 ? (
          <div
            style={{
              padding: 28,
              textAlign: "center",
              color: "rgba(255,255,255,0.2)",
              fontSize: 13,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            아직 분석 기록이 없습니다.
          </div>
        ) : (
          history.map((entry) => {
            const qGrade = getGrade(entry.qualityScore);
            return (
              <div
                key={entry.id}
                style={{
                  position: "relative",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.querySelector(".del-btn").style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.querySelector(".del-btn").style.opacity = "0";
                }}
              >
                {/* 클릭 가능 영역 */}
                <div
                  onClick={() => onSelect(entry)}
                  style={{ padding: "11px 40px 11px 16px", cursor: "pointer" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      {formatDate(entry.date)}
                    </div>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: qGrade.color,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {entry.qualityScore}
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#FFD700",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {entry.interestScore}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {entry.logline}
                  </div>
                  {entry.detectedGenre && (
                    <div
                      style={{ fontSize: 10, color: "rgba(78,204,163,0.45)", marginTop: 4 }}
                    >
                      {entry.detectedGenre}
                    </div>
                  )}
                </div>
                {/* 개별 삭제 버튼 */}
                <button
                  className="del-btn"
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 10,
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(232,93,117,0.7)",
                    cursor: "pointer",
                    fontSize: 15,
                    lineHeight: 1,
                    padding: "4px 6px",
                    borderRadius: 5,
                    opacity: 0,
                    transition: "opacity 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,93,117,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  title="이 기록 삭제"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AI 개선안 패널
// ─────────────────────────────────────────────
function ImprovementPanel({ logline, genre, apiKey, result }) {
  const [loading, setLoading] = useState(false);
  const [improvement, setImprovement] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const genreLabel = GENRES.find((g) => g.id === genre)?.label || "자동 감지";

  const handleImprove = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError("");
    setImprovement(null);

    try {
      const weakPoints = Object.entries({
        ...result?.structure,
        ...result?.expression,
        ...result?.technical,
      })
        .filter(([, v]) => v.max > 0 && v.score / v.max < 0.6)
        .map(([k]) => LABELS_KR[k])
        .join(", ");

      const msg = `원본 로그라인:\n"${logline}"\n\n장르: ${genreLabel}\n\n종합 피드백:\n${result?.overall_feedback || "-"}\n\n취약 항목: ${weakPoints || "없음"}\n\n위 분석을 바탕으로 개선된 로그라인을 작성해주세요.`;

      const data = await callClaude(apiKey, IMPROVEMENT_SYSTEM_PROMPT, msg);
      setImprovement(data);
    } catch (err) {
      setError(err.message || "개선안 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!improvement?.improved) return;
    navigator.clipboard.writeText(improvement.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 20,
        background: "rgba(69,183,209,0.04)",
        borderRadius: 12,
        border: "1px solid rgba(69,183,209,0.14)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#45B7D1",
          marginBottom: 12,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        ✨ AI 개선안
      </div>

      {!improvement && !loading && (
        <button
          onClick={handleImprove}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(69,183,209,0.3)",
            background: "rgba(69,183,209,0.07)",
            color: "#45B7D1",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(69,183,209,0.13)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(69,183,209,0.07)")
          }
        >
          분석 결과 기반으로 로그라인 개선안 받기
        </button>
      )}

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: 24,
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          개선안을 작성하는 중...
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#E85D75",
            padding: "8px 12px",
            background: "rgba(232,93,117,0.08)",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {improvement && (
        <div>
          {/* 개선된 로그라인 */}
          <div
            style={{
              padding: 16,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "#e8e8f0",
                fontFamily: "'Noto Sans KR', sans-serif",
                marginBottom: 12,
              }}
            >
              &ldquo;{improvement.improved}&rdquo;
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid rgba(78,204,163,0.3)",
                background: "rgba(78,204,163,0.07)",
                color: copied ? "#4ECCA3" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {copied ? "✓ 복사됨" : "복사하기"}
            </button>
          </div>

          {/* 핵심 이유 */}
          {improvement.why && (
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 12,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                lineHeight: 1.7,
                borderLeft: "2px solid rgba(69,183,209,0.4)",
              }}
            >
              {improvement.why}
            </div>
          )}

          {/* 변경 사항 */}
          {improvement.changes?.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 7,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                변경 사항
              </div>
              {improvement.changes.map((c, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                    padding: "7px 11px",
                    marginBottom: 5,
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 7,
                    borderLeft: "2px solid rgba(69,183,209,0.3)",
                    lineHeight: 1.6,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setImprovement(null)}
            style={{
              marginTop: 12,
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "'Noto Sans KR', sans-serif",
              padding: 0,
            }}
          >
            다시 생성
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 텍스트 내보내기 버튼
// ─────────────────────────────────────────────
function ExportButton({ result, logline, qualityScore, interestScore }) {
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    if (!result) return;
    const grade = getGrade(qualityScore);
    const interest = getInterestLevel(interestScore);
    const sTotal = calcSectionTotal(result, "structure");
    const eTotal = calcSectionTotal(result, "expression");
    const tTotal = calcSectionTotal(result, "technical");

    const lines = [
      "=== 로그라인 분석 결과 ===",
      `날짜: ${new Date().toLocaleString("ko-KR")}`,
      `감지 장르: ${result.detected_genre || "-"}`,
      "",
      "[ 로그라인 ]",
      `"${logline}"`,
      "",
      `[ 품질 점수 ] ${qualityScore}/100 — ${grade.grade}등급 (${grade.label})`,
      `[ 흥미도    ] ${interestScore}/100 — ${interest.emoji} ${interest.label}`,
      "",
      "─── A. 구조적 완성도 ─────────────────",
      ...Object.entries(result.structure || {}).map(
        ([k, v]) => `  ${LABELS_KR[k]}: ${v.score}/${v.max}  ${v.feedback || ""}`
      ),
      `  소계: ${sTotal}/50`,
      "",
      "─── B. 표현적 매력도 ─────────────────",
      ...Object.entries(result.expression || {}).map(
        ([k, v]) => `  ${LABELS_KR[k]}: ${v.score}/${v.max}  ${v.feedback || ""}`
      ),
      `  소계: ${eTotal}/30`,
      "",
      "─── C. 기술적 완성도 ─────────────────",
      ...Object.entries(result.technical || {}).map(
        ([k, v]) => `  ${LABELS_KR[k]}: ${v.score}/${v.max}  ${v.feedback || ""}`
      ),
      `  소계: ${tTotal}/20`,
      "",
      "─── D. 흥미 유발 지수 ────────────────",
      ...Object.entries(result.interest || {}).map(
        ([k, v]) => `  ${LABELS_KR[k]}: ${v.score}/${v.max}  ${v.feedback || ""}`
      ),
      `  소계: ${interestScore}/100`,
      "",
      "─── 종합 피드백 ──────────────────────",
      result.overall_feedback || "",
      "",
      "─── 개선 질문 ────────────────────────",
      ...(result.improvement_questions || []).map((q, i) => `${i + 1}. ${q}`),
      "",
      "Generated by 로그라인 분석기 · Powered by Claude",
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleExport}
      style={{
        padding: "7px 16px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.03)",
        color: copied ? "#4ECCA3" : "rgba(255,255,255,0.45)",
        cursor: "pointer",
        fontSize: 12,
        fontFamily: "'Noto Sans KR', sans-serif",
        transition: "all 0.2s",
      }}
    >
      {copied ? "✓ 클립보드에 복사됨" : "텍스트로 내보내기"}
    </button>
  );
}

// ─────────────────────────────────────────────
// 학술 분석 패널
// ─────────────────────────────────────────────
function TheorySection({ title, ref: refText, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 10, borderRadius: 12, border: `1px solid ${color}20`, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "12px 16px", cursor: "pointer", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          background: open ? `${color}0a` : "rgba(255,255,255,0.01)",
          transition: "background 0.2s",
        }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{title}</span>
          {refText && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 10, fontFamily: "'JetBrains Mono', monospace" }}>
              {refText}
            </span>
          )}
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ padding: "14px 16px", borderTop: `1px solid ${color}15` }}>{children}</div>}
    </div>
  );
}

function AcademicScoreBar({ label, score, max, analysis, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColor = pct >= 80 ? "#4ECCA3" : pct >= 60 ? "#45B7D1" : pct >= 40 ? "#F7A072" : "#E85D75";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor, fontFamily: "'JetBrains Mono', monospace" }}>{score}/{max}</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3 }} />
      </div>
      {analysis && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{analysis}</div>
      )}
    </div>
  );
}

function AcademicFieldRow({ label, value, analysis }) {
  if (!value && !analysis) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      {value && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>{value}</div>}
      {analysis && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{analysis}</div>}
    </div>
  );
}

function AcademicPanel({ academic }) {
  if (!academic) return null;
  const { aristotle, propp, campbell, todorov, barthes, freytag, zillmann, smith, korean_aesthetics, integrated_assessment } = academic;

  return (
    <div>
      {/* 아리스토텔레스 시학 */}
      <TheorySection title="아리스토텔레스 시학" ref="Poetics, c.335 BCE" color="#FFD700" defaultOpen={true}>
        <AcademicFieldRow label="하마르티아 (Hamartia)" value={aristotle?.hamartia?.detected} analysis={aristotle?.hamartia?.analysis} />
        <AcademicFieldRow label="페리페테이아 (Peripeteia)" value={aristotle?.peripeteia?.detected} analysis={aristotle?.peripeteia?.analysis} />
        <AcademicFieldRow label="아나그노리시스 (Anagnorisis)" value={aristotle?.anagnorisis?.detected} analysis={aristotle?.anagnorisis?.analysis} />
        <div style={{ marginTop: 8 }}>
          <AcademicScoreBar label="카타르시스 잠재력" score={aristotle?.catharsis_potential?.score || 0} max={10} analysis={aristotle?.catharsis_potential?.analysis} />
          <AcademicScoreBar label="미메시스 완성도" score={aristotle?.mimesis_quality?.score || 0} max={10} analysis={aristotle?.mimesis_quality?.analysis} />
          <AcademicScoreBar label="행동의 통일성 (Unity of Action)" score={aristotle?.unity_of_action?.score || 0} max={10} analysis={aristotle?.unity_of_action?.analysis} />
        </div>
      </TheorySection>

      {/* 캠벨 영웅 여정 */}
      <TheorySection title="캠벨 영웅의 여정 (모노미스)" ref="The Hero with a Thousand Faces, 1949" color="#4ECCA3">
        <AcademicFieldRow label="감지된 여정 단계" value={campbell?.detected_departure_stage} />
        <AcademicFieldRow label="영웅 원형" value={campbell?.hero_archetype} />
        <AcademicFieldRow label="그림자 원형 (Shadow)" value={campbell?.shadow_archetype} />
        <AcademicFieldRow label="모험의 부름 (Call to Adventure)" analysis={campbell?.call_to_adventure} />
        <AcademicFieldRow label="경계 (Threshold)" analysis={campbell?.threshold} />
        <AcademicFieldRow label="귀환 영약 (Elixir) 예측" analysis={campbell?.elixir} />
        <div style={{ marginTop: 8 }}>
          <AcademicScoreBar label="모노미스 구조 정합성" score={campbell?.monomyth_alignment?.score || 0} max={10} analysis={campbell?.monomyth_alignment?.analysis} />
        </div>
      </TheorySection>

      {/* 프롭 민담 형태론 */}
      <TheorySection title="프롭 민담 형태론" ref="Morphology of the Folktale, 1928/1968" color="#45B7D1">
        {propp?.detected_functions?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>감지된 서사 기능</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {propp.detected_functions.map((fn, i) => (
                <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(69,183,209,0.12)", color: "#45B7D1", fontFamily: "'JetBrains Mono', monospace" }}>{fn}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["영웅 (Hero)", propp?.character_spheres?.hero],
            ["악당 (Villain)", propp?.character_spheres?.villain],
            ["증여자 (Donor)", propp?.character_spheres?.donor],
            ["조력자 (Helper)", propp?.character_spheres?.helper],
            ["목표 대상 (Sought Person)", propp?.character_spheres?.sought_person],
            ["파견자 (Dispatcher)", propp?.character_spheres?.dispatcher],
          ].map(([label, val], i) => val ? (
            <div key={i} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(69,183,209,0.1)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
            </div>
          ) : null)}
        </div>
        {propp?.character_spheres?.false_hero && (
          <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(232,93,117,0.06)", borderRadius: 8, border: "1px solid rgba(232,93,117,0.15)" }}>
            <div style={{ fontSize: 10, color: "rgba(232,93,117,0.6)", marginBottom: 3 }}>가짜 영웅 (False Hero)</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{propp.character_spheres.false_hero}</div>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <AcademicScoreBar label="서사 완결성" score={propp?.narrative_completeness?.score || 0} max={10} analysis={propp?.narrative_completeness?.analysis} />
        </div>
      </TheorySection>

      {/* 토도로프 */}
      <TheorySection title="토도로프 서사 이론" ref="The Poetics of Prose, 1977" color="#F7A072">
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14, overflowX: "auto" }}>
          {[
            { label: "초기 평형", val: todorov?.initial_equilibrium, color: "#4ECCA3" },
            { label: "파열", val: todorov?.disruption, color: "#E85D75" },
            { label: "인식", val: todorov?.recognition, color: "#F7A072" },
            { label: "회복 시도", val: todorov?.repair_attempt, color: "#45B7D1" },
            { label: "새로운 평형", val: todorov?.new_equilibrium, color: "#4ECCA3" },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center", minWidth: 80, maxWidth: 100 }}>
                <div style={{ fontSize: 10, color: step.color, fontWeight: 700, marginBottom: 4 }}>{step.label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {step.val ? (step.val.length > 30 ? step.val.slice(0, 30) + "…" : step.val) : "-"}
                </div>
              </div>
              {i < arr.length - 1 && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", margin: "0 4px", flexShrink: 0 }}>→</div>}
            </div>
          ))}
        </div>
      </TheorySection>

      {/* 바르트 서사 코드 */}
      <TheorySection title="바르트 서사 코드" ref="S/Z, 1970" color="#a78bfa">
        {[
          ["HER · 헤르메네우틱 코드", barthes?.hermeneutic_code, "수수께끼·질문·서스펜스"],
          ["ACT · 프로아이레틱 코드", barthes?.proairetic_code, "행동 시퀀스·인과"],
          ["SEM · 세믹 코드", barthes?.semic_code, "함축 의미·분위기"],
          ["SYM · 상징 코드", barthes?.symbolic_code, "이항 대립 구조"],
          ["REF · 문화 코드", barthes?.cultural_code, "공유 문화 지식"],
        ].map(([label, val, sub], i) => (
          <div key={i} style={{ marginBottom: 10, padding: "9px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>{label}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{sub}</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{val || "-"}</div>
          </div>
        ))}
      </TheorySection>

      {/* 프라이탁 피라미드 */}
      <TheorySection title="프라이탁 피라미드" ref="Die Technik des Dramas, 1863" color="#45B7D1">
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[
            { label: "발단", val: freytag?.exposition, w: "15%" },
            { label: "전개", val: freytag?.rising_action, w: "25%" },
            { label: "절정", val: freytag?.climax, w: "20%" },
            { label: "하강", val: freytag?.falling_action, w: "20%" },
            { label: "대단원", val: freytag?.denouement, w: "20%" },
          ].map((step, i) => (
            <div key={i} style={{ flex: 1, padding: "8px 6px", background: "rgba(69,183,209,0.06)", borderRadius: 8, border: "1px solid rgba(69,183,209,0.12)", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#45B7D1", marginBottom: 4 }}>{step.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
                {step.val ? (step.val.length > 25 ? step.val.slice(0, 25) + "…" : step.val) : "-"}
              </div>
            </div>
          ))}
        </div>
      </TheorySection>

      {/* 질만 + 스미스 */}
      <TheorySection title="심리학적 분석" ref="Zillmann (1983) · Smith (1995)" color="#4ECCA3">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>질만 흥분 전이 이론</div>
          <AcademicFieldRow label="각성 메커니즘" analysis={zillmann?.arousal_mechanism} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Noto Sans KR', sans-serif" }}>예측 각성 강도:</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
              background: zillmann?.predicted_arousal_intensity?.includes("높음") ? "rgba(232,93,117,0.15)" : "rgba(247,160,114,0.12)",
              color: zillmann?.predicted_arousal_intensity?.includes("높음") ? "#E85D75" : "#F7A072",
            }}>
              {zillmann?.predicted_arousal_intensity || "-"}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Noto Sans KR', sans-serif" }}>{zillmann?.dominant_emotion}</span>
          </div>
          <AcademicFieldRow label="전이 잠재력" analysis={zillmann?.transfer_potential} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>스미스 관객 참여 이론</div>
          <AcademicScoreBar label="인식 (Recognition)" score={smith?.recognition?.score || 0} max={10} analysis={smith?.recognition?.analysis} />
          <AcademicScoreBar label="정렬 (Alignment)" score={smith?.alignment?.score || 0} max={10} analysis={smith?.alignment?.analysis} />
          <AcademicScoreBar label="충성 (Allegiance)" score={smith?.allegiance?.score || 0} max={10} analysis={smith?.allegiance?.analysis} />
        </div>
      </TheorySection>

      {/* 한국 서사 미학 */}
      <TheorySection title="한국 서사 미학" ref="이효인 (1992) · 김소영 (2000)" color="#f472b6">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[
            { key: "han", label: "한(恨)", val: korean_aesthetics?.han },
            { key: "jeong", label: "정(情)", val: korean_aesthetics?.jeong },
            { key: "sinmyeong", label: "신명(神明)", val: korean_aesthetics?.sinmyeong },
            { key: "nunchi", label: "눈치(Nunchi)", val: korean_aesthetics?.nunchi },
          ].map(({ label, val }) => (
            <div key={label} style={{
              padding: "5px 12px", borderRadius: 20,
              background: val?.present ? "rgba(244,114,182,0.12)" : "rgba(255,255,255,0.03)",
              border: val?.present ? "1px solid rgba(244,114,182,0.35)" : "1px solid rgba(255,255,255,0.07)",
              color: val?.present ? "#f472b6" : "rgba(255,255,255,0.3)",
              fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              {val?.present ? "✓ " : ""}{label}
            </div>
          ))}
        </div>
        {[
          ["한(恨)", korean_aesthetics?.han?.analysis],
          ["정(情)", korean_aesthetics?.jeong?.analysis],
          ["신명(神明)", korean_aesthetics?.sinmyeong?.analysis],
          ["눈치(Nunchi)", korean_aesthetics?.nunchi?.analysis],
        ].filter(([, v]) => v && v !== "감지되지 않음").map(([label, val], i) => (
          <div key={i} style={{ marginBottom: 8, padding: "8px 12px", background: "rgba(244,114,182,0.04)", borderRadius: 8, borderLeft: "2px solid rgba(244,114,182,0.3)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,114,182,0.7)", marginRight: 6 }}>{label}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</span>
          </div>
        ))}
        <AcademicScoreBar label="한국 서사 정서 친화도" score={korean_aesthetics?.korean_narrative_strength?.score || 0} max={10} analysis={korean_aesthetics?.korean_narrative_strength?.analysis} color="#f472b6" />
      </TheorySection>

      {/* 종합 학술 평가 */}
      {integrated_assessment && (
        <div style={{ marginTop: 16, padding: 18, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8f0", marginBottom: 4 }}>종합 학술 평가</div>
          {integrated_assessment.dominant_theory_fit && (
            <div style={{ fontSize: 11, color: "rgba(78,204,163,0.7)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif" }}>
              최적 이론: {integrated_assessment.dominant_theory_fit}
            </div>
          )}
          <div style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,0.72)", marginBottom: 14, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {integrated_assessment.theoretical_verdict}
          </div>
          {integrated_assessment.strengths?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4ECCA3", marginBottom: 6 }}>이론적 강점</div>
              {integrated_assessment.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", padding: "5px 10px", marginBottom: 4, background: "rgba(78,204,163,0.05)", borderRadius: 6, borderLeft: "2px solid rgba(78,204,163,0.3)", lineHeight: 1.6 }}>{s}</div>
              ))}
            </div>
          )}
          {integrated_assessment.weaknesses?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#E85D75", marginBottom: 6 }}>이론적 약점</div>
              {integrated_assessment.weaknesses.map((w, i) => (
                <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", padding: "5px 10px", marginBottom: 4, background: "rgba(232,93,117,0.05)", borderRadius: 6, borderLeft: "2px solid rgba(232,93,117,0.3)", lineHeight: 1.6 }}>{w}</div>
              ))}
            </div>
          )}
          {integrated_assessment.academic_recommendation && (
            <div style={{ padding: "10px 14px", background: "rgba(167,139,250,0.05)", borderRadius: 8, border: "1px solid rgba(167,139,250,0.15)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>학술적 개선 제언</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{integrated_assessment.academic_recommendation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 진정성 지수 컴포넌트 (Sartre + Camus + Heidegger + Kierkegaard)
// ─────────────────────────────────────────────
function AuthenticityPanel({ data, isMobile }) {
  const scoreColor = data.authenticity_score >= 75 ? "#4ECCA3"
    : data.authenticity_score >= 50 ? "#F7A072"
    : data.authenticity_score >= 25 ? "#E85D75"
    : "#888";

  const stageColor = { "심미적": "#F7A072", "윤리적": "#45B7D1", "종교적": "#a78bfa" };
  const absurdColor = { "반항": "#4ECCA3", "도피": "#E85D75", "수용": "#45B7D1" };

  const mf = data.mauvaise_foi || {};
  const gc = data.genuine_choice || {};
  const og = data.other_gaze || {};
  const abs = data.absurdity || {};
  const kk = data.kierkegaard_stage || {};
  const nz = data.nietzsche_connection || {};
  const ft = data.facticity || {};

  const stage = (kk.stage || "").split("(")[0].trim();
  const absResponse = (abs.response || "").split("(")[0].trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 진정성 점수 */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px", borderRadius: 12, border: `1px solid ${scoreColor}30`, background: `${scoreColor}06`, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: scoreColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {data.authenticity_score ?? "?"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>AUTHENTICITY</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: scoreColor, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 6 }}>
            {data.authenticity_label}
          </div>
          {/* 점수 바 */}
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${data.authenticity_score ?? 0}%`, background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})`, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>자기기만</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>실존적 각성</span>
          </div>
        </div>
      </div>

      {/* 피투성 + 자기기만 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>FACTICITY — 피투성 (Heidegger)</div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", margin: "0 0 6px" }}>{ft.description}</p>
          {ft.response_to_facticity && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>반응 방식: {ft.response_to_facticity}</div>
          )}
        </div>
        <div style={{ padding: "14px", borderRadius: 10, background: mf.present ? "rgba(232,93,117,0.05)" : "rgba(78,204,163,0.05)", border: mf.present ? "1px solid rgba(232,93,117,0.2)" : "1px solid rgba(78,204,163,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: mf.present ? "#E85D75" : "#4ECCA3", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>MAUVAISE FOI (Sartre)</div>
            <span style={{ fontSize: 10, color: mf.present ? "#E85D75" : "#4ECCA3", fontWeight: 700 }}>{mf.present ? "감지됨" : "없음"}</span>
          </div>
          {mf.elements?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              {mf.elements.map((el, i) => (
                <div key={i} style={{ fontSize: 10, color: "rgba(232,93,117,0.7)", background: "rgba(232,93,117,0.08)", padding: "2px 7px", borderRadius: 5, marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>· {el}</div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{mf.description}</p>
        </div>
      </div>

      {/* 진정한 선택 */}
      <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>GENUINE CHOICE</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: gc.has_real_choice ? "#4ECCA3" : "#E85D75", background: gc.has_real_choice ? "rgba(78,204,163,0.12)" : "rgba(232,93,117,0.12)", padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {gc.has_real_choice ? "진짜 선택" : "선택 부재"}
          </span>
          {gc.responsibility_acknowledged !== undefined && (
            <span style={{ fontSize: 10, color: gc.responsibility_acknowledged ? "#4ECCA3" : "#E85D75", fontFamily: "'Noto Sans KR', sans-serif" }}>
              책임 인식 {gc.responsibility_acknowledged ? "✓" : "✗"}
            </span>
          )}
        </div>
        {gc.choice_description && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>{gc.choice_description}</div>
        )}
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{gc.description}</p>
      </div>

      {/* 타자의 시선 + 부조리 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {og.present && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>LE REGARD — 타자의 시선</div>
            {og.who && <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{og.who}</div>}
            {og.effect && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{og.effect}</div>}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{og.description}</p>
          </div>
        )}
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(247,160,114,0.04)", border: "1px solid rgba(247,160,114,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>ABSURDE — 부조리 (Camus)</div>
            {absResponse && (
              <span style={{ fontSize: 10, fontWeight: 700, color: absurdColor[absResponse] || "#aaa", background: `${absurdColor[absResponse] || "#aaa"}15`, padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{absResponse}</span>
            )}
          </div>
          {abs.absurd_condition && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{abs.absurd_condition}</div>}
          {abs.sisyphus_moment && (
            <div style={{ fontSize: 10, color: "#F7A072", background: "rgba(247,160,114,0.08)", padding: "5px 8px", borderRadius: 6, marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
              시지프 순간: {abs.sisyphus_moment}
            </div>
          )}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{abs.description}</p>
        </div>
      </div>

      {/* 키르케고르 + 니체 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {kk.stage && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>KIERKEGAARD STAGE</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: stageColor[stage] || "#aaa", background: `${stageColor[stage] || "#aaa"}18`, padding: "3px 10px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{stage} 실존</span>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: "8px 0 0" }}>{kk.description}</p>
          </div>
        )}
        {nz.will_to_power && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>NIETZSCHE — 의지·위버멘쉬</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
              <span style={{ color: "rgba(255,255,255,0.25)" }}>의지: </span>{nz.will_to_power}
            </div>
            {nz.ubermensch_potential && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
                <span style={{ color: "rgba(255,255,255,0.25)" }}>위버멘쉬: </span>{nz.ubermensch_potential}
              </div>
            )}
            {nz.eternal_recurrence_test && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5, fontStyle: "italic" }}>영원회귀: {nz.eternal_recurrence_test}</div>
            )}
          </div>
        )}
      </div>

      {/* 사르트르 평결 + 팁 */}
      {data.sartre_verdict && (
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(247,160,114,0.05)", border: "1px solid rgba(247,160,114,0.2)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>SARTRE VERDICT</div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.sartre_verdict}</p>
        </div>
      )}
      {data.authenticity_tip && (
        <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>AUTHENTICITY TIP</div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.authenticity_tip}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 가치 전하 분석 컴포넌트 (McKee)
// ─────────────────────────────────────────────
function ValueChargePanel({ data, isMobile }) {
  const polarityColor = {
    positive_to_negative: "#E85D75",
    negative_to_positive: "#4ECCA3",
    positive_to_ironic:   "#F7A072",
  };
  const polarityLabel = {
    positive_to_negative: "긍정 → 부정 (비극적 전하)",
    negative_to_positive: "부정 → 긍정 (희망적 전하)",
    positive_to_ironic:   "긍정 → 아이러니 (반전 전하)",
  };
  const intensityColor = { "약함": "#aaa", "보통": "#45B7D1", "강렬": "#F7A072", "극렬": "#E85D75" };

  const pc = data.primary_charge || {};
  const arcColor = polarityColor[pc.polarity] || "#4ECCA3";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 핵심 가치 전하 */}
      <div style={{ padding: "18px", borderRadius: 12, border: `1px solid ${arcColor}30`, background: `${arcColor}06` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: arcColor, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>
          PRIMARY VALUE CHARGE
        </div>
        {/* 가치 뒤집기 시각화 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 15, fontWeight: 700, color: "#e8e8f0", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {pc.start_pole || "?"}
          </div>
          <div style={{ fontSize: 20, color: arcColor }}>→</div>
          <div style={{ padding: "8px 18px", borderRadius: 8, background: `${arcColor}15`, border: `1px solid ${arcColor}50`, fontSize: 15, fontWeight: 700, color: arcColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {pc.end_pole || "?"}
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {polarityLabel[pc.polarity] || ""}
          </span>
        </div>
        {pc.description && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
            {pc.description}
          </p>
        )}
      </div>

      {/* 2행: 강도 + 장르 일치 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {/* 전하 강도 */}
        {data.charge_intensity && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>CHARGE INTENSITY</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: intensityColor[data.charge_intensity.label] || "#aaa", fontFamily: "'JetBrains Mono', monospace" }}>
                {data.charge_intensity.score}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: intensityColor[data.charge_intensity.label] || "#aaa", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {data.charge_intensity.label}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
              {data.charge_intensity.reason}
            </p>
          </div>
        )}
        {/* 장르 기대값 일치 */}
        {data.genre_value_match && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>GENRE MATCH</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16, color: data.genre_value_match.actual_match ? "#4ECCA3" : "#E85D75" }}>
                {data.genre_value_match.actual_match ? "✓" : "✗"}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4 }}>
                {data.genre_value_match.genre_expected}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
              {data.genre_value_match.analysis}
            </p>
          </div>
        )}
      </div>

      {/* 2차 가치 전하들 */}
      {data.secondary_charges?.length > 0 && (
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>SECONDARY CHARGES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.secondary_charges.map((sc, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#45B7D1", background: "rgba(69,183,209,0.12)", padding: "2px 8px", borderRadius: 5, flexShrink: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {sc.arc_label}
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{sc.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 맥키 평결 + 팁 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.mckee_verdict && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>McKEE VERDICT</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.mckee_verdict}</p>
          </div>
        )}
        {data.strengthening_tip && (
          <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(247,160,114,0.04)", border: "1px solid rgba(247,160,114,0.18)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>STRENGTHENING TIP</div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.strengthening_tip}</p>
          </div>
        )}
        {data.missing_charge && (
          <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.18)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>MISSING CHARGE</div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.missing_charge}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 그림자 캐릭터 분석 컴포넌트 (Jung)
// ─────────────────────────────────────────────
function ShadowAnalysisPanel({ data, isMobile }) {
  const archetypeColors = {
    "영웅": "#4ECCA3", "그림자": "#E85D75", "아니마": "#a78bfa",
    "아니무스": "#a78bfa", "자기": "#FFD166", "페르소나": "#45B7D1",
    "변환자": "#F7A072", "트릭스터": "#F7A072", "현자": "#95E1D3",
  };
  const integrationColor = { "높음": "#4ECCA3", "중간": "#F7A072", "낮음": "#E85D75" };

  const shadow = data.shadow || {};
  const hero = data.hero_archetype || {};
  const anima = data.anima_animus || {};
  const indiv = data.individuation_arc || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 영웅 원형 */}
      <div style={{ padding: "16px", borderRadius: 12, border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.04)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>HERO ARCHETYPE</div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: "0 0 10px" }}>{hero.description}</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {hero.wound && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(232,93,117,0.06)", border: "1px solid rgba(232,93,117,0.15)" }}>
              <div style={{ fontSize: 9, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>WOUND</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{hero.wound}</p>
            </div>
          )}
          {hero.persona_gap && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(69,183,209,0.06)", border: "1px solid rgba(69,183,209,0.15)" }}>
              <div style={{ fontSize: 9, color: "#45B7D1", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>PERSONA GAP</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{hero.persona_gap}</p>
            </div>
          )}
        </div>
      </div>

      {/* 그림자 */}
      <div style={{ padding: "16px", borderRadius: 12, border: "1px solid rgba(232,93,117,0.25)", background: "rgba(232,93,117,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>SHADOW ARCHETYPE</div>
          {shadow.integration_potential && (
            <span style={{ fontSize: 10, fontWeight: 700, color: integrationColor[shadow.integration_potential] || "#aaa", background: `${integrationColor[shadow.integration_potential] || "#aaa"}15`, padding: "2px 8px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>
              통합 가능성: {shadow.integration_potential}
            </span>
          )}
        </div>
        {shadow.who && (
          <div style={{ fontSize: 12, fontWeight: 600, color: "#E85D75", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{shadow.who}</div>
        )}
        {shadow.represents && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, padding: "6px 10px", background: "rgba(232,93,117,0.06)", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
            반영하는 억압된 자아: {shadow.represents}
          </div>
        )}
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{shadow.description}</p>
      </div>

      {/* 아니마/아니무스 + 기타 원형 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {anima.present && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>ANIMA / ANIMUS</div>
            {anima.who && <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", marginBottom: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{anima.who}</div>}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{anima.description}</p>
          </div>
        )}
        {(data.other_archetypes || []).length > 0 && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>OTHER ARCHETYPES</div>
            {data.other_archetypes.map((a, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: archetypeColors[a.archetype] || "#aaa", background: `${archetypeColors[a.archetype] || "#aaa"}15`, padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.archetype}</span>
                {a.who && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.who}</span>}
                {a.description && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "2px 0 0", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 개성화 여정 */}
      {indiv.description && (
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,209,102,0.04)", border: "1px solid rgba(255,209,102,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#FFD166", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>INDIVIDUATION ARC</div>
            {indiv.stage && (
              <span style={{ fontSize: 10, color: "#FFD166", background: "rgba(255,209,102,0.12)", padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{indiv.stage}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{indiv.description}</p>
        </div>
      )}

      {/* 집단 무의식 연결 + 융 평결 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.collective_unconscious_connection && (
          <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(149,225,211,0.04)", border: "1px solid rgba(149,225,211,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#95E1D3", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>COLLECTIVE UNCONSCIOUS</div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.collective_unconscious_connection}</p>
          </div>
        )}
        {data.jung_verdict && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>JUNG VERDICT</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.jung_verdict}</p>
          </div>
        )}
        {data.missing_archetype && (
          <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>MISSING ARCHETYPE</div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.missing_archetype}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 전문가 패널 결과 컴포넌트
// ─────────────────────────────────────────────
function ExpertPanelSection({ data, isMobile }) {
  const [openRound, setOpenRound] = useState(2); // 0=모두접기, 1=R1, 2=R2, 3=종합

  const getExpert = (id) => PANEL_EXPERTS.find((e) => e.id === id) || { name: id, color: "#aaa", initial: "?" };

  const stanceLabel = { agree: "동의", extend: "보완", disagree: "반론" };
  const stanceColor = { agree: "#4ECCA3", extend: "#45B7D1", disagree: "#E85D75" };

  const Avatar = ({ expert, size = 32 }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${expert.color}22`,
      border: `1.5px solid ${expert.color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      fontSize: size < 30 ? 9 : 11,
      fontWeight: 700, color: expert.color,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {expert.initial}
    </div>
  );

  const SectionHeader = ({ num, label, isOpen, onToggle }) => (
    <button onClick={onToggle} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.07)",
      background: isOpen ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
      cursor: "pointer", marginBottom: isOpen ? 10 : 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace", background: "rgba(167,139,250,0.12)", padding: "2px 7px", borderRadius: 6 }}>
          {num}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e0e0ee", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{isOpen ? "▲" : "▼"}</span>
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* 패널 제목 */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e0ee", fontFamily: "'Noto Sans KR', sans-serif" }}>
          {data.panel_title}
        </div>
      </div>

      {/* 전문가 아바타 줄 */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {PANEL_EXPERTS.map((ex) => (
          <div key={ex.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Avatar expert={ex} size={36} />
            <span style={{ fontSize: 9, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>{ex.name}</span>
          </div>
        ))}
      </div>

      {/* ── 라운드 1 ── */}
      <div>
        <SectionHeader num="R1" label="초기 분석 — 각 전문가의 첫 번째 발언" isOpen={openRound === 1} onToggle={() => setOpenRound(openRound === 1 ? 0 : 1)} />
        {openRound === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(data.round1 || []).map((item, i) => {
              const ex = getExpert(item.expert_id);
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${ex.color}20`, background: `${ex.color}06` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Avatar expert={ex} size={26} />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.name}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.role}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
                    {item.statement}
                  </p>
                  {item.reference && (
                    <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", borderLeft: `2px solid ${ex.color}40`, paddingLeft: 8 }}>
                      {item.reference}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 라운드 2 ── */}
      <div>
        <SectionHeader num="R2" label="상호 토론 — 동의·보완·반론" isOpen={openRound === 2} onToggle={() => setOpenRound(openRound === 2 ? 0 : 2)} />
        {openRound === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(data.round2 || []).map((item, i) => {
              const ex = getExpert(item.expert_id);
              const toEx = getExpert(item.responding_to);
              const sc = stanceColor[item.stance] || "#aaa";
              const sl = stanceLabel[item.stance] || item.stance;
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${ex.color}20`, background: `${ex.color}05` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <Avatar expert={ex} size={26} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.name}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'Noto Sans KR', sans-serif" }}>→</span>
                    <Avatar expert={toEx} size={22} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'Noto Sans KR', sans-serif" }}>{toEx.name}에게</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sc, background: `${sc}18`, padding: "2px 7px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{sl}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
                    {item.statement}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 종합 ── */}
      <div>
        <SectionHeader num="종합" label="합의 — 핵심 개선 방향" isOpen={openRound === 3} onToggle={() => setOpenRound(openRound === 3 ? 0 : 3)} />
        {openRound === 3 && data.synthesis && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* 합의점 */}
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>CONSENSUS</div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.synthesis.consensus}</p>
            </div>
            {/* 개선 제안 */}
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>IMPROVEMENTS</div>
              {(data.synthesis.improvements || []).map((imp, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", background: "rgba(78,204,163,0.15)", padding: "1px 6px", borderRadius: 4, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{imp}</span>
                </div>
              ))}
            </div>
            {/* 강점 / 보완 / 철학적 핵심 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(69,183,209,0.05)", border: "1px solid rgba(69,183,209,0.18)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#45B7D1", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>STRONGEST ELEMENT</div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.synthesis.strongest_element}</p>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(232,93,117,0.05)", border: "1px solid rgba(232,93,117,0.18)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>CRITICAL GAP</div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.synthesis.critical_gap}</p>
              </div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(247,160,114,0.05)", border: "1px solid rgba(247,160,114,0.18)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>PHILOSOPHICAL CORE</div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.synthesis.philosophical_core}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 파이프라인 패널 (인터랙티브 서사 선택기)
// ─────────────────────────────────────────────
function PipelinePanel({ selectedDuration, logline, apiKey, isMobile, onResult }) {
  const indices = PIPELINE_QUESTIONS_BY_DURATION[selectedDuration] || PIPELINE_QUESTIONS_BY_DURATION.feature;
  const questions = indices.map((i) => PIPELINE_ALL_QUESTIONS[i]);
  const total = questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]); // [{questionLabel, optionId, optionLabel, optionDesc}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentQ = questions[step];
  const isComplete = answers.length === total;

  const handleOption = (opt) => {
    const newAnswers = [
      ...answers.slice(0, step),
      { questionLabel: currentQ.label, optionId: opt.id, optionLabel: opt.label, optionDesc: opt.desc },
    ];
    setAnswers(newAnswers);
    if (step < total - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setAnswers(answers.slice(0, step - 1));
    }
  };

  const handleGenerate = async () => {
    if (!logline.trim() || !apiKey) return;
    setLoading(true);
    setError("");

    const duration = PIPELINE_QUESTIONS_BY_DURATION[selectedDuration]
      ? selectedDuration
      : "feature";
    const durationInfo = { ultrashort: "초단편 (5분 이하)", shortform: "숏폼 (5~15분)", shortfilm: "단편영화 (20~40분)", webdrama: "웹드라마 파일럿 (15~30분/화)", tvdrama: "TV 드라마 1화 (60분)", feature: "장편영화 (90~120분)", miniseries: "미니시리즈 전체 (4~6화)" }[selectedDuration] || "장편영화";

    const choicesSummary = answers
      .map((a, i) => `[선택 ${i + 1}] ${a.questionLabel}: ${a.optionLabel} — ${a.optionDesc}`)
      .join("\n");

    const msg = `로그라인: "${logline.trim()}"

포맷: ${durationInfo}

사용자가 단계적으로 선택한 서사 요소:
${choicesSummary}

위 로그라인을 기반으로, 사용자가 선택한 서사 요소들을 모두 유기적으로 반영한 시놉시스를 생성하세요. 각 선택 요소가 이야기 속에서 자연스럽게 통합되어야 합니다.`;

    try {
      const data = await callClaude(apiKey, PIPELINE_SYNOPSIS_SYSTEM_PROMPT, msg);
      onResult(data);
    } catch (err) {
      setError(err.message || "시놉시스 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const accentColor = "#4ECCA3";
  const optionColors = ["#4ECCA3", "#45B7D1", "#a78bfa", "#F7A072"];

  return (
    <div style={{ marginTop: 4 }}>
      {/* 진행 바 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
            PIPELINE STEP {Math.min(step + 1, total)} / {total}
          </span>
          <span style={{ fontSize: 11, color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}>
            {Math.round((answers.length / total) * 100)}%
          </span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${(answers.length / total) * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}, #45B7D1)`,
              borderRadius: 3,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* 이전 선택 트레일 */}
      {answers.length > 0 && (
        <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {answers.map((a, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 20,
                background: `${optionColors[i % 4]}12`,
                border: `1px solid ${optionColors[i % 4]}30`,
                color: optionColors[i % 4],
                fontFamily: "'Noto Sans KR', sans-serif",
                lineHeight: 1.5,
              }}
            >
              <span style={{ opacity: 0.6 }}>{i + 1}. </span>{a.optionLabel}
            </div>
          ))}
        </div>
      )}

      {/* 현재 질문 카드 */}
      {!isComplete && (
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            borderRadius: 12,
            border: `1px solid ${accentColor}20`,
            padding: "18px 16px",
            marginBottom: 12,
          }}
        >
          {/* 질문 헤더 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: accentColor,
                  background: `${accentColor}15`,
                  padding: "2px 7px",
                  borderRadius: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Q{step + 1}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#e8e8f0", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {currentQ.label}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
              {currentQ.subtext}
            </div>
          </div>

          {/* 선택지 그리드 — 옵션 수에 따라 열 수 동적 조정 */}
          {(() => {
            const count = currentQ.options.length;
            // 6개: 데스크탑 2열 3행 / 5개: 2열, 마지막 홀수 전체폭 / 4개: 2열 2행
            const cols = isMobile ? "1fr" : "1fr 1fr";
            return (
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8 }}>
                {currentQ.options.map((opt, oi) => {
                  const col = optionColors[oi % optionColors.length];
                  const isSelected = answers[step]?.optionId === opt.id;
                  // 홀수 개일 때 마지막 항목 전체 폭
                  const isLastOdd = !isMobile && count % 2 !== 0 && oi === count - 1;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOption(opt)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: isSelected ? `1px solid ${col}60` : `1px solid ${col}18`,
                        background: isSelected ? `${col}10` : `${col}05`,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                        gridColumn: isLastOdd ? "1 / -1" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: col,
                            background: `${col}20`,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {opt.id}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e0ee", fontFamily: "'Noto Sans KR', sans-serif" }}>
                          {opt.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5, paddingLeft: 26 }}>
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 완료 메시지 */}
      {isComplete && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            border: `1px solid ${accentColor}30`,
            background: `${accentColor}08`,
            marginBottom: 12,
            fontSize: 13,
            color: accentColor,
            fontFamily: "'Noto Sans KR', sans-serif",
            textAlign: "center",
          }}
        >
          ✓ 모든 서사 요소 선택 완료 — 시놉시스를 생성할 준비가 되었습니다
        </div>
      )}

      {/* 하단 버튼 */}
      <div style={{ display: "flex", gap: 8 }}>
        {step > 0 && !isComplete && (
          <button
            onClick={handleBack}
            style={{
              padding: "10px 16px",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
              flexShrink: 0,
            }}
          >
            ← 이전
          </button>
        )}
        {isComplete && (
          <>
            <button
              onClick={() => { setStep(0); setAnswers([]); }}
              style={{
                padding: "10px 16px",
                borderRadius: 9,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'Noto Sans KR', sans-serif",
                flexShrink: 0,
              }}
            >
              처음부터
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                flex: 1,
                padding: "11px 16px",
                borderRadius: 9,
                border: "none",
                background: loading ? `${accentColor}20` : `linear-gradient(135deg, ${accentColor}, #45B7D1)`,
                color: loading ? "rgba(255,255,255,0.3)" : "#0d1a14",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid rgba(255,255,255,0.7)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  시놉시스 생성 중...
                </span>
              ) : "✨ 선택한 요소로 시놉시스 생성"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.09)", border: "1px solid rgba(232,93,117,0.25)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 시놉시스 카드
// ─────────────────────────────────────────────
function SynopsisCard({ synopsis, index }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const colors = ["#4ECCA3", "#45B7D1", "#F7A072", "#E85D75", "#a78bfa"];
  const color = colors[index % colors.length];

  const handleCopy = () => {
    const text = [
      `[방향 ${index + 1}] ${synopsis.direction_title}`,
      `장르/톤: ${synopsis.genre_tone}`,
      `핵심: ${synopsis.hook}`,
      "",
      synopsis.synopsis,
      "",
      "핵심 장면:",
      ...(synopsis.key_scenes || []).map((s, i) => `${i + 1}. ${s}`),
      "",
      `주제: ${synopsis.theme}`,
      `결말 유형: ${synopsis.ending_type}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: 14,
        border: `1px solid ${color}25`,
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
      }}
    >
      {/* 헤더 */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "16px 20px",
          cursor: "pointer",
          borderBottom: expanded ? `1px solid ${color}18` : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: color,
                background: `${color}15`,
                padding: "2px 8px",
                borderRadius: 10,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#e8e8f0",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              {synopsis.direction_title}
            </span>
            {synopsis.ending_type && (
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  background: "rgba(255,255,255,0.05)",
                  padding: "2px 8px",
                  borderRadius: 8,
                }}
              >
                {synopsis.ending_type}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {synopsis.genre_tone}
          </div>
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* 본문 */}
      {expanded && (
        <div style={{ padding: "16px 20px" }}>
          {/* 훅 */}
          {synopsis.hook && (
            <div
              style={{
                fontSize: 13,
                color: color,
                fontWeight: 600,
                marginBottom: 14,
                padding: "8px 12px",
                background: `${color}0d`,
                borderRadius: 8,
                borderLeft: `3px solid ${color}`,
                fontFamily: "'Noto Sans KR', sans-serif",
                lineHeight: 1.6,
              }}
            >
              {synopsis.hook}
            </div>
          )}

          {/* 시놉시스 본문 */}
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.9,
              color: "rgba(255,255,255,0.75)",
              fontFamily: "'Noto Sans KR', sans-serif",
              marginBottom: 16,
              whiteSpace: "pre-line",
            }}
          >
            {synopsis.synopsis}
          </div>

          {/* 핵심 장면 */}
          {synopsis.key_scenes?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                핵심 장면
              </div>
              {synopsis.key_scenes.map((scene, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 7,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: `${color}20`,
                      color: color,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'JetBrains Mono', monospace",
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.65,
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    {scene}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 주제 + 복사 버튼 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {synopsis.theme && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic", fontFamily: "'Noto Sans KR', sans-serif" }}>
                주제: {synopsis.theme}
              </div>
            )}
            <button
              onClick={handleCopy}
              style={{
                padding: "5px 13px",
                borderRadius: 7,
                border: `1px solid ${color}30`,
                background: `${color}08`,
                color: copied ? color : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.2s",
                marginLeft: "auto",
              }}
            >
              {copied ? "✓ 복사됨" : "복사"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 비교 모드 섹션 컴포넌트
// ─────────────────────────────────────────────
function CompareSection({ result1, result2, section, title, maxTotal, color }) {
  if (!result1?.[section] || !result2?.[section]) return null;
  const t1 = calcSectionTotal(result1, section);
  const t2 = calcSectionTotal(result2, section);
  const winner = t1 > t2 ? "A" : t2 > t1 ? "B" : null;

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 16,
        background: "rgba(255,255,255,0.02)",
        borderRadius: 12,
        border: `1px solid ${color}20`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: winner === "A" ? "#4ECCA3" : "rgba(255,255,255,0.5)",
              fontWeight: winner === "A" ? 700 : 400,
            }}
          >
            {t1}/{maxTotal}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>vs</span>
          <span
            style={{
              fontSize: 13,
              color: winner === "B" ? "#45B7D1" : "rgba(255,255,255,0.5)",
              fontWeight: winner === "B" ? 700 : 400,
            }}
          >
            {t2}/{maxTotal}
          </span>
          {winner && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 10,
                background: winner === "A" ? "rgba(78,204,163,0.15)" : "rgba(69,183,209,0.15)",
                color: winner === "A" ? "#4ECCA3" : "#45B7D1",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              {winner} 우세
            </span>
          )}
        </div>
      </div>

      {Object.entries(result1[section]).map(([key, v1]) => {
        const v2 = result2[section]?.[key];
        if (!v2) return null;
        const pct1 = (v1.score / v1.max) * 100;
        const pct2 = (v2.score / v2.max) * 100;
        const diff = v1.score - v2.score;

        return (
          <div key={key} style={{ marginBottom: 9 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                {LABELS_KR[key]}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color:
                    diff > 0 ? "#4ECCA3" : diff < 0 ? "#E85D75" : "rgba(255,255,255,0.3)",
                  fontWeight: diff !== 0 ? 700 : 400,
                }}
              >
                {diff > 0 ? `A +${diff}` : diff < 0 ? `B +${Math.abs(diff)}` : "동점"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, height: 5 }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct1}%`,
                    background: "#4ECCA3",
                    borderRadius: 3,
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct2}%`,
                    background: "#45B7D1",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// 비트 시트 패널
// ─────────────────────────────────────────────
function BeatSheetPanel({ data, beatScenes, generatingBeat, expandedBeats, onToggle, onGenerateScene, onExportAll, isMobile }) {
  const beats = data.beats || [];

  const ACT_META = {
    "1막": { color: "#4ECCA3", bg: "rgba(78,204,163,0.08)", label: "1막" },
    "2막 전반": { color: "#45B7D1", bg: "rgba(69,183,209,0.08)", label: "2막 전반" },
    "2막 후반": { color: "#F7A072", bg: "rgba(247,160,114,0.08)", label: "2막 후반" },
    "3막": { color: "#E85D75", bg: "rgba(232,93,117,0.08)", label: "3막" },
  };

  // 진행률 계산
  const completedCount = Object.keys(beatScenes).length;

  return (
    <div>
      {/* 상단 통계 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        {[
          { label: "총 페이지", value: `${data.total_pages || "?"}p`, color: "#FFD166" },
          { label: "비트 수", value: `${beats.length}개`, color: "#4ECCA3" },
          { label: "씬 완성", value: `${completedCount}/${beats.length}`, color: "#FB923C" },
          { label: "포맷", value: data.format_name || "Snyder", color: "#A78BFA" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${color}22`, background: `${color}0a`, textAlign: "center", flex: "1 1 auto", minWidth: 80 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 진행 바 */}
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${beats.length ? (completedCount / beats.length) * 100 : 0}%`, background: "linear-gradient(90deg, #4ECCA3, #45B7D1)", borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>

      {/* 비트 카드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {beats.map((beat) => {
          const act = ACT_META[beat.act] || ACT_META["1막"];
          const isExpanded = expandedBeats[beat.id];
          const hasScene = !!beatScenes[beat.id];
          const isGenerating = generatingBeat === beat.id;
          const pageLen = (beat.page_end || beat.page_start) - beat.page_start + 1;

          return (
            <div key={beat.id} style={{ borderRadius: 12, border: `1px solid ${isExpanded ? act.color + "33" : "rgba(255,255,255,0.06)"}`, background: isExpanded ? act.bg : "rgba(255,255,255,0.01)", overflow: "hidden", transition: "all 0.2s" }}>
              {/* 카드 헤더 */}
              <div
                onClick={() => onToggle(beat.id)}
                style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                {/* 비트 번호 */}
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${act.color}22`, border: `1px solid ${act.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: act.color, fontFamily: "'JetBrains Mono', monospace" }}>{beat.id}</span>
                </div>
                {/* 이름 + 막 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.88)", fontFamily: "'Noto Sans KR', sans-serif" }}>{beat.name_kr}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>{beat.name_en}</span>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, border: `1px solid ${act.color}33`, color: act.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{beat.act}</span>
                    {hasScene && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(78,204,163,0.12)", color: "#4ECCA3", fontFamily: "'Noto Sans KR', sans-serif" }}>✓ 씬 완성</span>}
                  </div>
                  {!isExpanded && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{beat.summary}</div>}
                </div>
                {/* 페이지 + 토글 */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>p.{beat.page_start}{pageLen > 1 ? `~${beat.page_end}` : ""}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{isExpanded ? "▲" : "▼"}</div>
                </div>
              </div>

              {/* 카드 본문 (확장 시) */}
              {isExpanded && (
                <div style={{ padding: "0 14px 14px" }}>
                  {/* 요약 */}
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 12, padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {beat.summary}
                  </div>

                  {/* 상세 그리드 */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "서사 기능", val: beat.dramatic_function, c: act.color },
                      { label: "장소", val: beat.location_hint, c: "#60A5FA" },
                      { label: `가치 전하: ${beat.value_start} → ${beat.value_end}`, val: null, c: "#FFD166", full: true },
                      { label: "등장 인물", val: (beat.characters_present || []).join(", "), c: "#A78BFA" },
                      { label: "톤·분위기", val: beat.tone, c: "#95E1D3" },
                    ].filter(f => f.val !== null || f.full).map(({ label, val, c, full }) => (
                      <div key={label} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${c}18`, background: `${c}07`, gridColumn: full ? "1 / -1" : undefined }}>
                        <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3, letterSpacing: 0.3 }}>{label}</div>
                        {val && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>{val}</div>}
                      </div>
                    ))}
                  </div>

                  {/* 핵심 요소 태그 */}
                  {beat.key_elements?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 5 }}>반드시 포함</div>
                      <div>{beat.key_elements.map((el, i) => (
                        <span key={i} style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, border: `1px solid ${act.color}33`, color: act.color, fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", marginRight: 5, marginBottom: 4 }}>{el}</span>
                      ))}</div>
                    </div>
                  )}

                  {/* 씬 생성 버튼 */}
                  <button
                    onClick={() => onGenerateScene(beat)}
                    disabled={isGenerating}
                    style={{ width: "100%", padding: "10px", borderRadius: 9, border: `1px solid ${act.color}33`, background: hasScene ? `${act.color}12` : `${act.color}08`, color: act.color, cursor: isGenerating ? "wait" : "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: hasScene ? 12 : 0, transition: "all 0.2s" }}
                  >
                    {isGenerating
                      ? <><span style={{ display: "inline-block", width: 11, height: 11, border: `1.5px solid ${act.color}44`, borderTop: `1.5px solid ${act.color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />씬 생성 중...</>
                      : hasScene ? "🔄 씬 재생성" : "🎬 이 씬 시나리오 생성"}
                  </button>

                  {/* 생성된 씬 텍스트 */}
                  {hasScene && (
                    <div style={{ borderRadius: 10, border: `1px solid ${act.color}22`, background: "rgba(0,0,0,0.25)", overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${act.color}15` }}>
                        <span style={{ fontSize: 11, color: act.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>SCENE {beat.id}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(beatScenes[beat.id]); }}
                          style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}
                        >복사</button>
                      </div>
                      <pre style={{ margin: 0, padding: "14px 16px", fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.72)", fontFamily: "'Noto Sans KR', monospace", lineHeight: 1.85, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {beatScenes[beat.id]}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 구조 인사이트 */}
      {data.structure_insight && (
        <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: 0.5 }}>STRUCTURE INSIGHT — Snyder · Field · McKee</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.structure_insight}</div>
        </div>
      )}

      {/* 전체 씬 내보내기 */}
      {completedCount > 0 && (
        <button
          onClick={onExportAll}
          style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 10, border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.07)", color: "#4ECCA3", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          ↓ 완성된 씬 전체 TXT 저장 ({completedCount}개)
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 하위텍스트 탐지 패널
// ─────────────────────────────────────────────
function SubtextPanel({ data, isMobile }) {
  const scoreColor = data.subtext_score >= 70 ? "#4ECCA3" : data.subtext_score >= 40 ? "#FFD166" : "#E85D75";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{data.subtext_score}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>하위텍스트 지수</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.subtext_level}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.surface_story}</div>
          <div style={{ fontSize: 12, color: "#45B7D1", marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>→ {data.deeper_story}</div>
        </div>
      </div>
      {data.chekhovs_guns?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>체호프의 총</div>
          {data.chekhovs_guns.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: `1px solid ${g.is_loaded ? "rgba(78,204,163,0.2)" : "rgba(232,93,117,0.2)"}`, background: g.is_loaded ? "rgba(78,204,163,0.05)" : "rgba(232,93,117,0.05)" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{g.is_loaded ? "🔫" : "🚫"}</span>
              <div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>{g.element}</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>{g.function}</div></div>
            </div>
          ))}
        </div>
      )}
      {data.unspoken_desires?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>말 vs 진짜 의도 (Stanislavski)</div>
          {data.unspoken_desires.map((u, i) => (
            <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(69,183,209,0.15)", background: "rgba(69,183,209,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#45B7D1", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{u.character}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Noto Sans KR', sans-serif" }}>말: {u.surface_want}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 3 }}>진짜: {u.real_need}</div>
            </div>
          ))}
        </div>
      )}
      {[
        { label: "침묵의 힘", val: data.silence_power, c: "#95E1D3" },
        { label: "브레히트 소외 효과", val: data.brecht_alienation, c: "#F7A072" },
        { label: "하위텍스트 약점 & 개선", val: data.subtext_weakness, c: "#E85D75" },
        { label: "체호프·스타니슬랍스키 총평", val: data.chekhov_verdict, c: "#45B7D1" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
      {data.dramatic_irony?.present && (
        <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,209,102,0.2)", background: "rgba(255,209,102,0.06)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,209,102,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>극적 아이러니</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.dramatic_irony.description}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 신화적 위치 매핑 패널
// ─────────────────────────────────────────────
function MythMapPanel({ data, isMobile }) {
  return (
    <div>
      <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,209,102,0.2)", background: "rgba(255,209,102,0.06)" }}>
        <div style={{ fontSize: 10, color: "rgba(255,209,102,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>현재 단계 — Campbell Monomyth</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFD166", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.primary_stage}</div>
        {data.stages_covered?.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {data.stages_covered.map((s, i) => <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(255,209,102,0.12)", color: "rgba(255,209,102,0.8)", fontFamily: "'Noto Sans KR', sans-serif" }}>{s}</span>)}
          </div>
        )}
      </div>
      {data.journey_phases && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>3단계 여정</div>
          {[
            { label: "① 분리 (Departure)", val: data.journey_phases.departure, c: "#4ECCA3" },
            { label: "② 입문 (Initiation)", val: data.journey_phases.initiation, c: "#45B7D1" },
            { label: "③ 귀환 (Return)", val: data.journey_phases.return, c: "#A78BFA" },
          ].map(({ label, val, c }) => val && (
            <div key={label} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: `1px solid ${c}20`, background: `${c}07` }}>
              <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{val}</div>
            </div>
          ))}
        </div>
      )}
      {data.archetype_roles && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>원형 역할</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
            {Object.entries(data.archetype_roles).filter(([, v]) => v).map(([key, val]) => (
              <div key={key} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,209,102,0.6)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{key.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {[
        { label: "세계 신화 공명", val: data.universal_myth_parallel, c: "#FFD166" },
        { label: "신화의 기능", val: data.myth_function, c: "#F7A072" },
        { label: "빠진 여정 요소", val: data.missing_journey_element, c: "#E85D75" },
        { label: "캠벨 총평", val: data.campbell_verdict, c: "#FFD166" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 바르트 서사 코드 패널
// ─────────────────────────────────────────────
function BarthesCodePanel({ data, isMobile }) {
  const codes = [
    { key: "hermeneutic_code", label: "해석적 코드", en: "Hermeneutic", color: "#A78BFA" },
    { key: "proairetic_code", label: "행동적 코드", en: "Proairetic", color: "#4ECCA3" },
    { key: "semic_code", label: "의미론적 코드", en: "Semic", color: "#45B7D1" },
    { key: "symbolic_code", label: "상징적 코드", en: "Symbolic", color: "#F7A072" },
    { key: "cultural_code", label: "문화적 코드", en: "Cultural", color: "#E85D75" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#95E1D3", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{data.total_activation}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>총 활성화 점수</div>
        </div>
        <div style={{ flex: 1 }}>
          {codes.map(({ key, label, color }) => {
            const c = data[key]; if (!c) return null;
            const pct = (c.score / 20) * 100;
            return (
              <div key={key} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                  <span style={{ fontSize: 11, color, fontFamily: "'JetBrains Mono', monospace" }}>{c.score}/20</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {codes.map(({ key, label, en, color }) => {
          const c = data[key]; if (!c) return null;
          return (
            <div key={key} style={{ padding: "11px 12px", borderRadius: 10, border: `1px solid ${color}22`, background: `${color}07` }}>
              <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label} ({en})</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{c.analysis}</div>
              {(c.binary_oppositions || c.information_gaps || c.key_connotations || c.cultural_references) && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(c.binary_oppositions || c.information_gaps || c.key_connotations || c.cultural_references || []).slice(0, 2).map((t, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${color}15`, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {[
        { label: "가장 강한 코드", val: data.dominant_code, c: "#4ECCA3" },
        { label: "가장 약한 코드 & 강화 방법", val: data.weakest_code, c: "#E85D75" },
        { label: "바르트 총평", val: data.barthes_verdict, c: "#95E1D3" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 한국 신화 공명 패널
// ─────────────────────────────────────────────
function KoreanMythPanel({ data, isMobile }) {
  const aesthetics = [
    { key: "han_resonance", label: "한(恨)", color: "#E85D75", max: 25 },
    { key: "jeong_resonance", label: "정(情)", color: "#F472B6", max: 25 },
    { key: "sinmyeong_element", label: "신명(神明)", color: "#FFD166", max: 25 },
  ];
  const total = aesthetics.reduce((s, a) => s + (data[a.key]?.score || 0), 0);
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>한·정·신명 공명 지수</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace" }}>{total}/75</span>
        </div>
        {aesthetics.map(({ key, label, color, max }) => {
          const d = data[key]; if (!d) return null;
          return (
            <div key={key} style={{ marginBottom: 12, padding: "11px 13px", borderRadius: 10, border: `1px solid ${color}22`, background: `${color}07` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <span style={{ fontSize: 12, color, fontFamily: "'JetBrains Mono', monospace" }}>{d.score}/{max}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginBottom: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(d.score / max) * 100}%`, background: color, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{d.analysis}</div>
            </div>
          );
        })}
      </div>
      {data.korean_archetypes?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>한국 원형 인물</div>
          {data.korean_archetypes.map((a, i) => (
            <div key={i} style={{ marginBottom: 7, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(232,93,117,0.15)", background: "rgba(232,93,117,0.04)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🎭</span>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#E85D75", fontFamily: "'Noto Sans KR', sans-serif" }}>{a.archetype}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "'Noto Sans KR', sans-serif" }}> — {a.character}</span>
                {a.tradition && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.tradition}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {[
        { label: "공명하는 한국 신화·설화", val: data.myth_parallel, c: "#E85D75" },
        { label: "무속 제의 구조", val: data.shamanic_structure, c: "#F7A072" },
        { label: "유교적 긴장", val: data.confucian_tension, c: "#60A5FA" },
        { label: "계승하는 현대 한국 영화", val: data.modern_korean_film, c: "#A3E635" },
        { label: "한국 신화·미학 총평", val: data.korean_myth_verdict, c: "#E85D75" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Script Coverage 패널
// ─────────────────────────────────────────────
function ScriptCoveragePanel({ data, isMobile }) {
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
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.title_suggestion || "제목 미정"}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{data.format} | {data.genre}</div>
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
            <div key={key} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: gradeColor(s.grade), fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{s.grade}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>{s.score}/10</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginBottom: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.score * 10}%`, background: gradeColor(s.grade), borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>{s.comment}</div>
            </div>
          );
        })}
      </div>
      {/* 강점·약점 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {data.strengths?.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(78,204,163,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>STRENGTHS</div>
            {data.strengths.map((s, i) => <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>✓ {s}</div>)}
          </div>
        )}
        {data.weaknesses?.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(232,93,117,0.2)", background: "rgba(232,93,117,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(232,93,117,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>WEAKNESSES</div>
            {data.weaknesses.map((s, i) => <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>✗ {s}</div>)}
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
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 대사 디벨롭 패널
// ─────────────────────────────────────────────
function DialogueDevPanel({ data, isMobile }) {
  return (
    <div>
      {data.character_voices?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, textTransform: "uppercase" }}>인물별 목소리 설계</div>
          {data.character_voices.map((v, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FB923C", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 8 }}>{v.character}</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
                {[
                  { l: "말투 패턴", v: v.speech_pattern },
                  { l: "어휘 수준", v: v.vocabulary_level },
                  { l: "절대 직접 말 안 하는 것", v: v.what_they_never_say },
                  { l: "말버릇", v: v.verbal_tic },
                ].map(({ l, v: val }) => val && (
                  <div key={l} style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
                  </div>
                ))}
              </div>
              {v.sample_line && (
                <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 7, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(251,146,60,0.15)" }}>
                  <div style={{ fontSize: 9, color: "rgba(251,146,60,0.5)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>SAMPLE LINE</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>"{v.sample_line}"</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.key_scene_dialogue && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>핵심 씬 대사 초안</div>
          <div style={{ padding: "14px", borderRadius: 10, border: "1px solid rgba(69,183,209,0.2)", background: "rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 11, color: "rgba(69,183,209,0.7)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 10 }}>{data.key_scene_dialogue.scene_context}</div>
            <pre style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "'Noto Sans KR', monospace", lineHeight: 1.85, whiteSpace: "pre-wrap", margin: 0 }}>{data.key_scene_dialogue.dialogue_draft}</pre>
            {data.key_scene_dialogue.subtext_note && (
              <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: "rgba(69,183,209,0.07)", border: "1px solid rgba(69,183,209,0.15)", fontSize: 11, color: "rgba(69,183,209,0.8)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                💬 하위텍스트: {data.key_scene_dialogue.subtext_note}
              </div>
            )}
          </div>
        </div>
      )}
      {data.subtext_techniques?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>하위텍스트 기법</div>
          {data.subtext_techniques.map((t, i) => (
            <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#45B7D1", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>{t.technique}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'Noto Sans KR', sans-serif" }}>{t.when_to_use}</div>
              {t.example && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 3, fontStyle: "italic" }}>예: {t.example}</div>}
            </div>
          ))}
        </div>
      )}
      {[
        { label: "피해야 할 대사 실수", val: data.dialogue_pitfalls?.join(" / "), c: "#E85D75" },
        { label: "목소리 일관성 유지 방법", val: data.voice_consistency_tips, c: "#4ECCA3" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 캐릭터 디벨롭 결과 패널
// ─────────────────────────────────────────────
function CharacterDevPanel({ data, isMobile }) {
  const [openSection, setOpenSection] = useState("protagonist");
  const proto = data.protagonist || {};
  const supporting = data.supporting_characters || [];
  const web = data.relationship_web || [];

  const Section = ({ id, title, color, children }) => {
    const open = openSection === id;
    return (
      <div style={{ marginBottom: 12, borderRadius: 12, border: `1px solid ${open ? color + "33" : "rgba(255,255,255,0.06)"}`, overflow: "hidden", transition: "all 0.2s" }}>
        <button onClick={() => setOpenSection(open ? null : id)} style={{ width: "100%", padding: "12px 16px", background: open ? `${color}0d` : "rgba(255,255,255,0.01)", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: open ? color : "rgba(255,255,255,0.55)", fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, fontWeight: 700 }}>
          {title}
          <span style={{ fontSize: 11, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
        </button>
        {open && <div style={{ padding: "4px 16px 16px" }}>{children}</div>}
      </div>
    );
  };

  const Field = ({ label, value, ref: _ref, color = "#FB923C" }) => {
    if (!value) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", paddingLeft: 10, borderLeft: `2px solid ${color}44` }}>{value}</div>
      </div>
    );
  };

  const Tag = ({ text, color }) => (
    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, border: `1px solid ${color}40`, background: `${color}12`, color, fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", marginRight: 6, marginBottom: 4 }}>{text}</span>
  );

  return (
    <div>
      {/* 주인공 */}
      <Section id="protagonist" title={`주인공 — ${proto.name_suggestion || "분석 결과"}`} color="#FB923C">
        {/* 이름 + 아크 타입 */}
        <div style={{ marginBottom: 14 }}>
          <Tag text={proto.arc_type || "아크 미정"} color="#FB923C" />
          <Tag text={`매슬로: ${proto.maslow_level || "?"}`} color="#60A5FA" />
          <Tag text={proto.erikson_stage || "에릭슨 단계"} color="#A78BFA" />
        </div>

        {/* Egri 3차원 */}
        {proto.egri_dimensions && (
          <div style={{ marginBottom: 14, padding: "12px", borderRadius: 9, background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.12)" }}>
            <div style={{ fontSize: 10, color: "rgba(251,146,60,0.7)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, marginBottom: 8 }}>EGRI 3차원 (1946)</div>
            <Field label="생리적(Physiological)" value={proto.egri_dimensions.physiological} color="#FB923C" />
            <Field label="사회적(Sociological)" value={proto.egri_dimensions.sociological} color="#FB923C" />
            <Field label="심리적(Psychological)" value={proto.egri_dimensions.psychological} color="#FB923C" />
          </div>
        )}

        {/* Hauge Want/Need/Fear/Wound */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Want — 외적 목표 (Hauge)", val: proto.want, c: "#4ECCA3" },
            { label: "Need — 내적 욕구 (Hauge)", val: proto.need, c: "#A78BFA" },
            { label: "Wound — 상처 (Hauge)", val: proto.wound, c: "#E85D75" },
            { label: "Fear — 핵심 두려움 (Hauge)", val: proto.fear, c: "#F7A072" },
          ].map(({ label, val, c }) => val && (
            <div key={label} style={{ padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}20`, background: `${c}08` }}>
              <div style={{ fontSize: 10, color: `${c}99`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{val}</div>
            </div>
          ))}
        </div>

        <Field label="Ghost — 과거 트라우마 (Truby 2007)" value={proto.ghost} color="#95E1D3" />
        <Field label="믿는 거짓 — The Lie (Snyder 2005)" value={proto.lie_they_believe} color="#FFD166" />
        <Field label="배워야 할 진실 — Self-revelation (Truby 2007)" value={proto.truth_to_learn} color="#4ECCA3" />
        <Field label="Identity vs Essence (Hauge 1988)" value={proto.identity_vs_essence} color="#FB923C" />
        <Field label="슈퍼-오브젝티브 (Stanislavski 1936)" value={proto.super_objective} color="#45B7D1" />

        {/* Jung Shadow */}
        {proto.jungian_shadow && (
          <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(167,139,250,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>그림자(Shadow) — Jung (1969)</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{proto.jungian_shadow}</div>
          </div>
        )}

        <Field label="McKee 압박 테스트 — True Character (McKee 1997)" value={proto.true_character_test} color="#FFD166" />
        <Field label="캐릭터 아크 여정 (Seger 1990)" value={proto.arc_journey} color="#FB923C" />
        {proto.voice_hint && <Field label="말투·화법 힌트 (Stanislavski 1936)" value={proto.voice_hint} color="#45B7D1" />}
      </Section>

      {/* 주요 인물 */}
      {supporting.length > 0 && (
        <Section id="supporting" title="주요 인물" color="#60A5FA">
          {supporting.map((s, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < supporting.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.suggested_name || s.role_name}</span>
                <Tag text={s.role_name} color="#60A5FA" />
                {s.vogler_archetype && <Tag text={s.vogler_archetype} color="#A3E635" />}
              </div>
              <Field label="서사적 기능" value={s.narrative_function} color="#60A5FA" />
              <Field label="주인공 반영/대조 (Mirror/Foil)" value={s.protagonist_mirror} color="#F472B6" />
              <Field label="관계 역학" value={s.relationship_dynamic} color="#60A5FA" />
            </div>
          ))}
        </Section>
      )}

      {/* 관계망 */}
      {web.length > 0 && (
        <Section id="web" title="관계망" color="#F472B6">
          {web.map((r, i) => (
            <div key={i} style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(244,114,182,0.12)", background: "rgba(244,114,182,0.04)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F472B6", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 6 }}>{r.pair}</div>
              {r.dynamic_type && <Tag text={r.dynamic_type} color="#F472B6" />}
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", marginTop: 6 }}>{r.dramatic_tension}</div>
            </div>
          ))}
        </Section>
      )}

      {/* 도덕적 논증 + 빠진 원형 + 팁 */}
      {(data.moral_argument || data.missing_archetype || data.character_development_tips?.length) && (
        <Section id="synthesis" title="종합 분석" color="#4ECCA3">
          <Field label="도덕적 논증 (Truby 2007: Moral Argument)" value={data.moral_argument} color="#4ECCA3" />
          {data.missing_archetype && <Field label="빠진 원형 (Vogler 1992)" value={data.missing_archetype} color="#FFD166" />}
          {data.character_development_tips?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>발전 제안</div>
              {data.character_development_tips.map((tip, i) => (
                <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(78,204,163,0.06)", border: "1px solid rgba(78,204,163,0.12)", fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                  {i + 1}. {tip}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 트리트먼트 입력 패널
// ─────────────────────────────────────────────
function TreatmentInputPanel({ chars, onCharsChange, structure, onStructureChange, onGenerate, loading, isMobile }) {
  const proto = chars.protagonist;

  const setProto = (field, val) =>
    onCharsChange({ ...chars, protagonist: { ...proto, [field]: val } });

  const setSupporting = (idx, field, val) => {
    const updated = chars.supporting.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    onCharsChange({ ...chars, supporting: updated });
  };

  const addSupporting = () =>
    onCharsChange({ ...chars, supporting: [...chars.supporting, { name: "", role: "", relation: "" }] });

  const removeSupporting = (idx) =>
    onCharsChange({ ...chars, supporting: chars.supporting.filter((_, i) => i !== idx) });

  const structures = [
    { id: "3act", label: "3막 구조", sub: "Field (1982)" },
    { id: "hero", label: "영웅의 여정", sub: "Campbell (1949)" },
    { id: "4act", label: "4막 구조", sub: "Parker (2005)" },
    { id: "miniseries", label: "화별 구조", sub: "미니시리즈" },
  ];

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
    color: "#e8e8f0", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
    outline: "none",
  };
  const labelStyle = { fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4, display: "block", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 0.5 };

  return (
    <div style={{ padding: "20px", borderRadius: 12, border: "1px solid rgba(251,191,36,0.15)", background: "rgba(251,191,36,0.02)" }}>

      {/* 서사 구조 선택 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>서사 구조</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7 }}>
          {structures.map((s) => (
            <button key={s.id} onClick={() => onStructureChange(s.id)} style={{
              padding: "9px 12px", borderRadius: 9, textAlign: "left",
              border: structure === s.id ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(255,255,255,0.07)",
              background: structure === s.id ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.02)",
              color: structure === s.id ? "#FBBf24" : "rgba(255,255,255,0.45)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}>{s.label}</div>
              <div style={{ fontSize: 10, color: structure === s.id ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{s.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 주인공 */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>주인공</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <label style={labelStyle}>이름</label>
            <input style={inputStyle} value={proto.name} onChange={(e) => setProto("name", e.target.value)} placeholder="예: 박민준" />
          </div>
          <div>
            <label style={labelStyle}>역할 / 직업</label>
            <input style={inputStyle} value={proto.role} onChange={(e) => setProto("role", e.target.value)} placeholder="예: 전직 형사, 40대" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
          <div>
            <label style={labelStyle}>외적 목표 (Want)</label>
            <input style={inputStyle} value={proto.want} onChange={(e) => setProto("want", e.target.value)} placeholder="예: 딸을 찾는다" />
          </div>
          <div>
            <label style={labelStyle}>내적 욕구 (Need)</label>
            <input style={inputStyle} value={proto.need} onChange={(e) => setProto("need", e.target.value)} placeholder="예: 죄책감을 놓아준다" />
          </div>
          <div>
            <label style={labelStyle}>핵심 결함</label>
            <input style={inputStyle} value={proto.flaw} onChange={(e) => setProto("flaw", e.target.value)} placeholder="예: 모든 것을 혼자 해결하려 함" />
          </div>
        </div>
      </div>

      {/* 조력/적대 인물 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>주요 인물</div>
          <button onClick={addSupporting} style={{ fontSize: 11, color: "rgba(251,191,36,0.7)", background: "none", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}>+ 인물 추가</button>
        </div>
        {chars.supporting.map((s, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>이름</label>
              <input style={inputStyle} value={s.name} onChange={(e) => setSupporting(idx, "name", e.target.value)} placeholder="예: 이수연" />
            </div>
            <div>
              <label style={labelStyle}>역할</label>
              <input style={inputStyle} value={s.role} onChange={(e) => setSupporting(idx, "role", e.target.value)} placeholder="예: 적대자 / 조력자" />
            </div>
            <div>
              <label style={labelStyle}>주인공과의 관계</label>
              <input style={inputStyle} value={s.relation} onChange={(e) => setSupporting(idx, "relation", e.target.value)} placeholder="예: 전 파트너, 진실을 숨김" />
            </div>
            {chars.supporting.length > 1 && (
              <button onClick={() => removeSupporting(idx)} style={{ padding: "9px 10px", background: "none", border: "1px solid rgba(232,93,117,0.2)", borderRadius: 8, color: "rgba(232,93,117,0.6)", cursor: "pointer", fontSize: 13 }}>✕</button>
            )}
          </div>
        ))}
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={onGenerate}
        disabled={loading}
        style={{
          width: "100%", padding: "13px", borderRadius: 10,
          border: "none", cursor: loading ? "wait" : "pointer",
          background: loading ? "rgba(251,191,36,0.15)" : "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.12))",
          color: "#FBBf24", fontSize: 14, fontWeight: 700,
          fontFamily: "'Noto Sans KR', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
        }}
      >
        {loading ? (
          <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(251,191,36,0.3)", borderTop: "2px solid #FBBf24", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />트리트먼트 생성 중...</>
        ) : (
          <>📋 트리트먼트 생성</>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function LoglineAnalyzer() {
  // ── API Key ──
  const [apiKey, setApiKey] = useState(
    () => import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem("logline_api_key") || ""
  );
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  // ── Synopsis ──
  const [showSynopsisPanel, setShowSynopsisPanel] = useState(false);
  const [synopsisMode, setSynopsisMode] = useState("auto"); // "auto" | "pipeline"
  const [selectedDuration, setSelectedDuration] = useState("feature");
  const [selectedFramework, setSelectedFramework] = useState("three_act");
  const [directionCount, setDirectionCount] = useState(3);
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [synopsisResults, setSynopsisResults] = useState(null);
  const [synopsisError, setSynopsisError] = useState("");

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

  // ── Dialogue Dev ──
  const [dialogueDevResult, setDialogueDevResult] = useState(null);
  const [dialogueDevLoading, setDialogueDevLoading] = useState(false);
  const [dialogueDevError, setDialogueDevError] = useState("");
  const dialogueDevRef = useRef(null);

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

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // API 키 없으면 모달 표시
  useEffect(() => {
    if (!apiKey) setShowApiKeyModal(true);
  }, []);

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

  const buildUserMsg = (text, genreId) => {
    const genreText =
      genreId === "auto"
        ? "장르를 자동으로 감지해주세요."
        : `선택된 장르: ${GENRES.find((g) => g.id === genreId)?.label}`;
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const durationText = dur ? `${dur.label} (${dur.duration})` : "장편영화 (90~120분)";
    return `다음 로그라인을 분석해주세요.\n\n포맷: ${durationText}\n장르: ${genreText}\n글자수: ${text.length}자\n\n로그라인:\n"${text.trim()}"`;
  };

  const analyze = async () => {
    if (!logline.trim() || !apiKey) return;
    setLoading(true);
    setError("");
    setResult(null);
    setResult2(null);

    try {
      const parsed = await callClaude(apiKey, SYSTEM_PROMPT, buildUserMsg(logline, genre));
      const sT = calcSectionTotal(parsed, "structure");
      const eT = calcSectionTotal(parsed, "expression");
      const tT = calcSectionTotal(parsed, "technical");
      const iT = calcSectionTotal(parsed, "interest");
      const qScore = sT + eT + tT;

      setResult(parsed);
      saveToHistory(logline, genre, parsed, qScore, iT);

      // 비교 모드: 첫 번째 완료 후 두 번째 분석
      if (compareMode && logline2.trim()) {
        setLoading2(true);
        try {
          const parsed2 = await callClaude(
            apiKey,
            SYSTEM_PROMPT,
            buildUserMsg(logline2, genre)
          );
          const s2 = calcSectionTotal(parsed2, "structure");
          const e2 = calcSectionTotal(parsed2, "expression");
          const t2 = calcSectionTotal(parsed2, "technical");
          const i2 = calcSectionTotal(parsed2, "interest");
          setResult2(parsed2);
          saveToHistory(logline2, genre, parsed2, s2 + e2 + t2, i2);
        } catch (err2) {
          console.error("비교 분석 오류:", err2);
        } finally {
          setLoading2(false);
        }
      }

      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        200
      );
    } catch (err) {
      setError(err.message || "분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // ── 시놉시스 생성 ──
  const generateSynopsis = async () => {
    if (!logline.trim() || !apiKey) return;
    setSynopsisLoading(true);
    setSynopsisError("");
    setSynopsisResults(null);

    const duration = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const genreLabel =
      genre === "auto"
        ? "자동 감지 (로그라인에서 판단)"
        : GENRES.find((g) => g.id === genre)?.label || "";

    const framework = NARRATIVE_FRAMEWORKS.find((f) => f.id === selectedFramework);

    const msg = `로그라인: "${logline.trim()}"

장르: ${genreLabel}
포맷: ${duration.label} (${duration.duration}) — ${duration.desc}
포맷 구조 가이드: ${duration.structure}

서사 구조 프레임워크: ${framework.label} (${framework.ref})
프레임워크 적용 지침: ${framework.instruction}

방향 수: ${directionCount}가지

위 로그라인을 바탕으로 ${directionCount}가지 서로 다른 방향의 시놉시스를 작성하세요.
모든 방향은 반드시 '${framework.label}' 프레임워크(${framework.ref}) 구조를 따라야 합니다.
각 방향은 장르 해석, 톤, 주제의식이 뚜렷하게 달라야 합니다.`;

    try {
      const data = await callClaude(apiKey, SYNOPSIS_SYSTEM_PROMPT, msg);
      setSynopsisResults(data);
      setTimeout(
        () => synopsisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        200
      );
    } catch (err) {
      setSynopsisError(err.message || "시놉시스 생성 중 오류가 발생했습니다.");
    } finally {
      setSynopsisLoading(false);
    }
  };

  // ── 가치 전하 분석 (McKee) ──
  const analyzeValueCharge = async () => {
    if (!logline.trim() || !apiKey) return;
    setValueChargeLoading(true);
    setValueChargeError("");
    setValueChargeResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n\n위 로그라인의 가치 전하(Value Charge)를 McKee의 이론으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, VALUE_CHARGE_SYSTEM_PROMPT, msg, 8000);
      setValueChargeResult(data);
      setTimeout(() => valueChargeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setValueChargeError(err.message || "가치 전하 분석 중 오류가 발생했습니다.");
    } finally {
      setValueChargeLoading(false);
    }
  };

  // ── 그림자 캐릭터 분석 (Jung) ──
  const analyzeShadow = async () => {
    if (!logline.trim() || !apiKey) return;
    setShadowLoading(true);
    setShadowError("");
    setShadowResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n\n위 로그라인의 캐릭터 원형을 Jung의 분석심리학으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, SHADOW_ANALYSIS_SYSTEM_PROMPT, msg, 8000);
      setShadowResult(data);
      setTimeout(() => shadowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setShadowError(err.message || "그림자 분석 중 오류가 발생했습니다.");
    } finally {
      setShadowLoading(false);
    }
  };

  // ── 진정성 지수 분석 (Sartre) ──
  const analyzeAuthenticity = async () => {
    if (!logline.trim() || !apiKey) return;
    setAuthenticityLoading(true);
    setAuthenticityError("");
    setAuthenticityResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `로그라인: "${logline.trim()}"\n장르: ${genreLabel}\n\n위 로그라인의 진정성 지수를 실존주의 철학으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, AUTHENTICITY_SYSTEM_PROMPT, msg, 8000);
      setAuthenticityResult(data);
      setTimeout(() => authenticityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setAuthenticityError(err.message || "진정성 분석 중 오류가 발생했습니다.");
    } finally {
      setAuthenticityLoading(false);
    }
  };

  // ── 비트 시트 생성 ──
  const generateBeatSheet = async () => {
    if (!logline.trim() || !apiKey) return;
    setBeatSheetLoading(true);
    setBeatSheetError("");
    setBeatSheetResult(null);
    setBeatScenes({});
    setExpandedBeats({});

    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

    const contextBlock = treatmentResult
      ? `트리트먼트:\n${treatmentResult.slice(0, 3000)}`
      : pipelineResult
      ? `시놉시스:\n${pipelineResult.synopsis || ""}`
      : "";

    const charBlock = charDevResult?.protagonist
      ? `주인공: ${charDevResult.protagonist.name_suggestion || ""} — Want: ${charDevResult.protagonist.want || ""} / Need: ${charDevResult.protagonist.need || ""} / Ghost: ${charDevResult.protagonist.ghost || ""}`
      : "";

    const msg = `로그라인: "${logline.trim()}"
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화 (90~120분)"}
장르: ${genreLabel}
${charBlock ? `\n캐릭터 정보:\n${charBlock}` : ""}
${contextBlock ? `\n${contextBlock}` : ""}

위 정보를 바탕으로 포맷에 맞는 비트 시트를 생성하세요.`;

    try {
      const data = await callClaude(apiKey, BEAT_SHEET_SYSTEM_PROMPT, msg, 8000);
      setBeatSheetResult(data);
      setTimeout(() => beatSheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setBeatSheetError(err.message || "비트 시트 생성 중 오류가 발생했습니다.");
    } finally {
      setBeatSheetLoading(false);
    }
  };

  // ── 씬 개별 생성 ──
  const generateScene = async (beat) => {
    if (!apiKey) return;
    setGeneratingBeat(beat.id);

    const charSummary = charDevResult?.protagonist
      ? `주인공: ${charDevResult.protagonist.name_suggestion || "주인공"} (Want: ${charDevResult.protagonist.want || ""}, 말투: ${charDevResult.protagonist.voice_hint || ""})`
      : "";

    const prevScenes = Object.entries(beatScenes)
      .filter(([id]) => Number(id) < beat.id)
      .slice(-3)
      .map(([id, text]) => {
        const b = beatSheetResult?.beats?.find((b) => b.id === Number(id));
        return `[${b?.name_kr || `비트 ${id}`}] ${text.slice(0, 200)}...`;
      })
      .join("\n\n");

    const msg = `로그라인: "${logline.trim()}"
${charSummary}

[생성할 비트]
비트 번호: ${beat.id} / ${beat.name_kr} (${beat.name_en})
막: ${beat.act} — ${beat.act_phase}
페이지 범위: p.${beat.page_start}~p.${beat.page_end} (약 ${beat.page_end - beat.page_start + 1}페이지)
장소: ${beat.location_hint || "미정"}
등장 인물: ${(beat.characters_present || []).join(", ")}
이 씬의 기능: ${beat.dramatic_function}
이 씬에서 일어나는 일: ${beat.summary}
가치 변화: ${beat.value_start} → ${beat.value_end}
톤: ${beat.tone}
반드시 포함: ${(beat.key_elements || []).join(", ")}
${prevScenes ? `\n이전 씬 요약:\n${prevScenes}` : ""}

위 정보로 시나리오 씬을 한국어로 작성하세요.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          system: SCENE_GEN_SYSTEM_PROMPT,
          messages: [{ role: "user", content: msg }],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API 오류 ${res.status}`);
      }
      const data = await res.json();
      const sceneText = data.content?.[0]?.text || "";
      setBeatScenes((prev) => ({ ...prev, [beat.id]: sceneText }));
      setExpandedBeats((prev) => ({ ...prev, [beat.id]: true }));
    } catch (err) {
      setBeatSheetError(`씬 ${beat.id} 생성 오류: ${err.message}`);
    } finally {
      setGeneratingBeat(null);
    }
  };

  // ── 캐릭터 디벨롭 ──
  const analyzeCharacterDev = async () => {
    if (!logline.trim() || !apiKey) return;
    setCharDevLoading(true);
    setCharDevError("");
    setCharDevResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const msg = `로그라인: "${logline.trim()}"
장르: ${genreLabel}
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화"}

위 로그라인의 인물들을 Egri·Hauge·Truby·Vogler·Jung·Maslow·Stanislavski 이론으로 깊이 발굴하고 구조화하세요.`;
    try {
      const data = await callClaude(apiKey, CHARACTER_DEV_SYSTEM_PROMPT, msg, 8000);
      setCharDevResult(data);
      setTimeout(() => charDevRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setCharDevError(err.message || "캐릭터 분석 중 오류가 발생했습니다.");
    } finally {
      setCharDevLoading(false);
    }
  };

  // ── 트리트먼트 생성 ──
  const generateTreatment = async () => {
    if (!logline.trim() || !apiKey) return;
    setTreatmentLoading(true);
    setTreatmentError("");
    setTreatmentResult("");

    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const structureLabel = { "3act": "3막 구조 (Field)", hero: "영웅의 여정 12단계 (Campbell)", "4act": "4막 구조", miniseries: "미니시리즈 화별 구조" }[treatmentStructure] || "3막 구조";

    const proto = treatmentChars.protagonist;
    const charBlock = [
      `주인공: ${proto.name || "미정"} (${proto.role || "역할 미정"})`,
      proto.want ? `  - 외적 목표(Want): ${proto.want}` : "",
      proto.need ? `  - 내적 욕구(Need): ${proto.need}` : "",
      proto.flaw ? `  - 핵심 결함: ${proto.flaw}` : "",
      ...treatmentChars.supporting
        .filter((s) => s.name.trim())
        .map((s) => `조력/적대 인물: ${s.name} (${s.role}) — ${s.relation}`),
    ].filter(Boolean).join("\n");

    const synopsisBlock = pipelineResult
      ? `시놉시스 (파이프라인 생성):\n${pipelineResult.synopsis || ""}`
      : result
      ? `로그라인 분석 결과 감지 장르: ${result.detected_genre || ""}`
      : "";

    const msg = `로그라인: "${logline.trim()}"
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화"}
장르: ${genreLabel}
서사 구조: ${structureLabel}

등장인물 정보:
${charBlock}

${synopsisBlock}

위 정보를 바탕으로 완성도 높은 트리트먼트를 한국어로 작성해주세요.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 32000,
          system: TREATMENT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: msg }],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API 오류 ${res.status}`);
      }
      const data = await res.json();
      setTreatmentResult(data.content?.[0]?.text || "");
      setTimeout(() => treatmentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setTreatmentError(err.message || "트리트먼트 생성 중 오류가 발생했습니다.");
    } finally {
      setTreatmentLoading(false);
    }
  };

  // ── 하위텍스트 탐지 ──
  const analyzeSubtext = async () => {
    if (!logline.trim() || !apiKey) return;
    setSubtextLoading(true);
    setSubtextError("");
    setSubtextResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const msg = `로그라인: "${logline.trim()}"
장르: ${genreLabel}
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화"}

위 로그라인의 하위텍스트를 체호프·스타니슬랍스키·브레히트·핀터·마멧 이론으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, SUBTEXT_SYSTEM_PROMPT, msg, 8000);
      setSubtextResult(data);
      setTimeout(() => subtextRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setSubtextError(err.message || "하위텍스트 분석 중 오류가 발생했습니다.");
    } finally {
      setSubtextLoading(false);
    }
  };

  // ── 신화적 위치 매핑 ──
  const analyzeMythMap = async () => {
    if (!logline.trim() || !apiKey) return;
    setMythMapLoading(true);
    setMythMapError("");
    setMythMapResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const msg = `로그라인: "${logline.trim()}"
장르: ${genreLabel}
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화"}

위 로그라인을 캠벨 영웅 여정·프롭 민담 형태론·프레이저 신화 이론으로 신화적 위치를 매핑하세요.`;
    try {
      const data = await callClaude(apiKey, MYTH_MAP_SYSTEM_PROMPT, msg, 8000);
      setMythMapResult(data);
      setTimeout(() => mythMapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setMythMapError(err.message || "신화 매핑 중 오류가 발생했습니다.");
    } finally {
      setMythMapLoading(false);
    }
  };

  // ── 바르트 서사 코드 ──
  const analyzeBarthesCode = async () => {
    if (!logline.trim() || !apiKey) return;
    setBarthesCodeLoading(true);
    setBarthesCodeError("");
    setBarthesCodeResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const msg = `로그라인: "${logline.trim()}"
장르: ${genreLabel}
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화"}

위 로그라인을 롤랑 바르트의 S/Z(1970) 5개 서사 코드로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, BARTHES_CODE_SYSTEM_PROMPT, msg, 8000);
      setBarthesCodeResult(data);
      setTimeout(() => barthesCodeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setBarthesCodeError(err.message || "바르트 코드 분석 중 오류가 발생했습니다.");
    } finally {
      setBarthesCodeLoading(false);
    }
  };

  // ── 한국 신화 공명 ──
  const analyzeKoreanMyth = async () => {
    if (!logline.trim() || !apiKey) return;
    setKoreanMythLoading(true);
    setKoreanMythError("");
    setKoreanMythResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const msg = `로그라인: "${logline.trim()}"
장르: ${genreLabel}
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화"}

위 로그라인의 한국 신화·미학 공명을 한(恨)·정(情)·신명(神明)·무속·유교 미학으로 분석하세요.`;
    try {
      const data = await callClaude(apiKey, KOREAN_MYTH_SYSTEM_PROMPT, msg, 8000);
      setKoreanMythResult(data);
      setTimeout(() => koreanMythRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setKoreanMythError(err.message || "한국 신화 분석 중 오류가 발생했습니다.");
    } finally {
      setKoreanMythLoading(false);
    }
  };

  // ── Script Coverage ──
  const analyzeScriptCoverage = async () => {
    if (!logline.trim() || !apiKey) return;
    setScriptCoverageLoading(true);
    setScriptCoverageError("");
    setScriptCoverageResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const msg = `로그라인: "${logline.trim()}"
장르: ${genreLabel}
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화"}

위 로그라인에 대한 할리우드 + 한국 방송사 스타일 Script Coverage를 작성하세요.`;
    try {
      const data = await callClaude(apiKey, SCRIPT_COVERAGE_SYSTEM_PROMPT, msg, 8000);
      setScriptCoverageResult(data);
      setTimeout(() => scriptCoverageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setScriptCoverageError(err.message || "Script Coverage 생성 중 오류가 발생했습니다.");
    } finally {
      setScriptCoverageLoading(false);
    }
  };

  // ── 대사 디벨롭 ──
  const analyzeDialogueDev = async () => {
    if (!logline.trim() || !apiKey) return;
    setDialogueDevLoading(true);
    setDialogueDevError("");
    setDialogueDevResult(null);
    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const dur = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
    const charContext = charDevResult
      ? `\n주인공: ${charDevResult.protagonist?.name || "미정"} — ${charDevResult.protagonist?.egri?.psychology || ""}`
      : "";
    const msg = `로그라인: "${logline.trim()}"
장르: ${genreLabel}
포맷: ${dur ? `${dur.label} (${dur.duration})` : "장편영화"}${charContext}

위 로그라인의 인물들을 위한 대사 고유 목소리와 하위텍스트 대사 기법을 설계하세요.`;
    try {
      const data = await callClaude(apiKey, DIALOGUE_DEV_SYSTEM_PROMPT, msg, 8000);
      setDialogueDevResult(data);
      setTimeout(() => dialogueDevRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      setDialogueDevError(err.message || "대사 디벨롭 중 오류가 발생했습니다.");
    } finally {
      setDialogueDevLoading(false);
    }
  };

  // ── 전문가 패널 소집 ──
  const runExpertPanel = async () => {
    if (!logline.trim() || !apiKey) return;
    setExpertPanelLoading(true);
    setExpertPanelError("");
    setExpertPanelResult(null);

    const genreLabel = genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";
    const msg = `분석할 로그라인: "${logline.trim()}"
장르: ${genreLabel}
글자수: ${logline.trim().length}자

위 로그라인을 7명의 전문가 패널이 학술 이론을 바탕으로 토론하세요.`;

    try {
      const data = await callClaude(apiKey, EXPERT_PANEL_SYSTEM_PROMPT, msg, 16000);
      setExpertPanelResult(data);
      setTimeout(
        () => expertPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        200
      );
    } catch (err) {
      setExpertPanelError(err.message || "전문가 패널 분석 중 오류가 발생했습니다.");
    } finally {
      setExpertPanelLoading(false);
    }
  };

  // ── 파이프라인 시놉시스 피드백 다듬기 ──
  const refinePipelineSynopsis = async () => {
    if (!pipelineResult || !pipelineFeedback.trim() || !apiKey) return;
    setPipelineRefineLoading(true);

    const durationInfo = { ultrashort: "초단편 (5분 이하)", shortform: "숏폼 (5~15분)", shortfilm: "단편영화 (20~40분)", webdrama: "웹드라마 파일럿 (15~30분/화)", tvdrama: "TV 드라마 1화 (60분)", feature: "장편영화 (90~120분)", miniseries: "미니시리즈 전체 (4~6화)" }[selectedDuration] || "장편영화";

    const msg = `원본 로그라인: "${logline.trim()}"
포맷: ${durationInfo}

── 현재 시놉시스 ──
제목: ${pipelineResult.direction_title}
장르/톤: ${pipelineResult.genre_tone}
훅: ${pipelineResult.hook}
시놉시스:
${pipelineResult.synopsis}
핵심 장면: ${(pipelineResult.key_scenes || []).join(" / ")}
주제: ${pipelineResult.theme}
결말: ${pipelineResult.ending_type}

── 사용자 피드백 ──
${pipelineFeedback.trim()}

위 피드백을 반영하여 시놉시스를 수정하세요. 잘 작동하는 부분은 유지하고, 지적된 부분만 명확하게 고치세요.`;

    try {
      const data = await callClaude(apiKey, PIPELINE_REFINE_SYSTEM_PROMPT, msg, 8000);
      setPipelineResult(data);
      setPipelineFeedback("");
      setTimeout(
        () => document.getElementById("pipeline-result")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        200
      );
    } catch (err) {
      alert("다듬기 중 오류: " + (err.message || "다시 시도해주세요."));
    } finally {
      setPipelineRefineLoading(false);
    }
  };

  // ── 학술 분석 ──
  const analyzeAcademic = async () => {
    if (!logline.trim() || !apiKey) return;
    setAcademicLoading(true);
    setAcademicError("");
    setAcademicResult(null);

    const genreLabel =
      genre === "auto" ? "자동 감지" : GENRES.find((g) => g.id === genre)?.label || "";

    const msg = `다음 로그라인을 제시된 학술 이론 체계 전체에 걸쳐 엄밀하게 분석하세요.

로그라인: "${logline.trim()}"
장르: ${genreLabel}
글자 수: ${logline.length}자

아리스토텔레스 시학, 프롭 민담 형태론, 캠벨 영웅 여정, 토도로프 서사 이론, 바르트 서사 코드, 프라이탁 피라미드, 질만 흥분 전이 이론, 머레이 스미스 관객 참여 이론, 한국 서사 미학을 각각 적용하여 분석하세요. 분석은 구체적이어야 하며 로그라인의 실제 언어와 구조에 근거해야 합니다.`;

    try {
      const data = await callClaude(apiKey, ACADEMIC_ANALYSIS_SYSTEM_PROMPT, msg, 16000);
      setAcademicResult(data);
      setActiveTab("academic");
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        200
      );
    } catch (err) {
      setAcademicError(err.message || "학술 분석 중 오류가 발생했습니다.");
    } finally {
      setAcademicLoading(false);
    }
  };

  // ── 점수 계산 ──
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

  const radarData = result
    ? [
        { label: "구조", value: structureTotal / 50 },
        { label: "아이러니", value: (result.expression?.irony?.score || 0) / 10 },
        { label: "심상", value: (result.expression?.mental_picture?.score || 0) / 8 },
        { label: "감정", value: (result.expression?.emotional_hook?.score || 0) / 7 },
        { label: "독창성", value: (result.expression?.originality?.score || 0) / 5 },
        { label: "간결성", value: (result.technical?.conciseness?.score || 0) / 8 },
        { label: "흥미", value: interestScore / 100 },
      ]
    : [];

  const tabs = [
    { id: "overview", label: "종합" },
    { id: "structure", label: isMobile ? "구조" : "구조 (50)" },
    { id: "expression", label: isMobile ? "표현" : "표현 (30)" },
    { id: "technical", label: isMobile ? "기술" : "기술 (20)" },
    { id: "interest", label: isMobile ? "흥미도" : "흥미도 (100)" },
    { id: "feedback", label: "피드백" },
    ...(academicResult ? [{ id: "academic", label: "🎓 학술" }] : []),
    ...(history.length >= 1 ? [{ id: "trend", label: "추이" }] : []),
  ];

  const charCount = logline.length;
  const charCount2 = logline2.length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d1a",
        color: "#e8e8f0",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;700;800&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        textarea { outline: none; }
        textarea:focus { border-color: rgba(78,204,163,0.4) !important; }
        input { outline: none; }
        button { font-family: 'Noto Sans KR', sans-serif; }
      `}</style>

      {/* ─── API Key Modal ─── */}
      {showApiKeyModal && (
        <ApiKeyModal
          initialKey={apiKey}
          onSave={saveApiKey}
          onCancel={apiKey ? () => setShowApiKeyModal(false) : undefined}
        />
      )}

      {/* ─── History Panel ─── */}
      {showHistory && (
        <>
          <div
            onClick={() => setShowHistory(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 199,
            }}
          />
          <HistoryPanel
            history={history}
            onClose={() => setShowHistory(false)}
            onDelete={(id) => {
              const updated = history.filter((h) => h.id !== id);
              setHistory(updated);
              localStorage.setItem("logline_history", JSON.stringify(updated));
            }}
            onClear={() => {
              localStorage.removeItem("logline_history");
              setHistory([]);
            }}
            onSelect={(entry) => {
              setLogline(entry.logline);
              setGenre(entry.genre || "auto");
              setResult(entry.result);
              setResult2(null);
              setActiveTab("overview");
              setShowHistory(false);
              setTimeout(
                () =>
                  resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                200
              );
            }}
          />
        </>
      )}

      {/* ─── 헤더 ─── */}
      <div
        style={{
          padding: isMobile ? "28px 16px 16px" : "40px 20px 20px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(78,204,163,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* 상단 버튼들 */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            gap: 6,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setShowHistory(true)}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.45)",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            기록 {history.length > 0 ? `(${history.length})` : ""}
          </button>
          <button
            onClick={() => setShowApiKeyModal(true)}
            title="API 키 설정"
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: apiKey
                ? "rgba(78,204,163,0.08)"
                : "rgba(232,93,117,0.1)",
              color: apiKey ? "rgba(78,204,163,0.7)" : "#E85D75",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            🔑
          </button>
        </div>

        <div
          style={{
            fontSize: 11,
            letterSpacing: 6,
            color: "rgba(78,204,163,0.55)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Scenario Logline Analyzer
        </div>
        <h1
          style={{
            fontSize: isMobile ? 22 : 28,
            fontWeight: 900,
            margin: 0,
            background: "linear-gradient(135deg, #4ECCA3, #45B7D1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Hello Logline
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          Blake Snyder · Robert McKee · Syd Field · Loewenstein 이론 기반
        </p>
      </div>

      {/* ─── 입력 영역 ─── */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: isMobile ? "0 12px" : "0 20px",
        }}
      >
        {/* 비교 모드 토글 */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) {
                setLogline2("");
                setResult2(null);
              }
            }}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: compareMode
                ? "1px solid rgba(69,183,209,0.5)"
                : "1px solid rgba(255,255,255,0.08)",
              background: compareMode
                ? "rgba(69,183,209,0.1)"
                : "rgba(255,255,255,0.03)",
              color: compareMode ? "#45B7D1" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 11,
              transition: "all 0.2s",
            }}
          >
            {compareMode ? "✓ 비교 모드 ON" : "⇄ 비교 모드"}
          </button>
        </div>

        {/* 영상 길이 선택 */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            영상 길이
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 7 }}>
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDuration(d.id)}
                style={{
                  padding: "9px 10px",
                  borderRadius: 10,
                  border: selectedDuration === d.id ? "1px solid rgba(167,139,250,0.55)" : "1px solid rgba(255,255,255,0.07)",
                  background: selectedDuration === d.id ? "rgba(167,139,250,0.13)" : "rgba(255,255,255,0.02)",
                  color: selectedDuration === d.id ? "#a78bfa" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 1 }}>
                  {d.icon} {d.label}
                </div>
                <div style={{ fontSize: 10, color: selectedDuration === d.id ? "rgba(167,139,250,0.65)" : "rgba(255,255,255,0.28)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {d.duration}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 장르 선택 */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            장르 선택
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGenre(g.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  border:
                    genre === g.id
                      ? "1px solid #4ECCA3"
                      : "1px solid rgba(255,255,255,0.08)",
                  background:
                    genre === g.id
                      ? "rgba(78,204,163,0.12)"
                      : "rgba(255,255,255,0.03)",
                  color: genre === g.id ? "#4ECCA3" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                  fontSize: isMobile ? 11 : 12,
                  transition: "all 0.2s",
                }}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 로그라인 입력 (비교 모드 시 나란히) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              compareMode && !isMobile ? "1fr 1fr" : "1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {/* 입력 A */}
          <div>
            {compareMode && (
              <div
                style={{
                  fontSize: 11,
                  color: "#4ECCA3",
                  marginBottom: 6,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                로그라인 A
              </div>
            )}
            <div style={{ position: "relative" }}>
              <textarea
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                placeholder="로그라인을 입력하세요... (예: 평생 거짓말을 밥 먹듯 하던 천재 변호사가...)"
                rows={compareMode ? 5 : 4}
                style={{
                  width: "100%",
                  padding: "16px 16px 32px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#e8e8f0",
                  fontSize: 14,
                  lineHeight: 1.75,
                  resize: "vertical",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "border-color 0.2s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 12,
                  fontSize: 11,
                  color: (() => {
                    const ranges = { ultrashort:[20,40], shortform:[30,50], shortfilm:[40,70], webdrama:[50,80], tvdrama:[60,90], feature:[70,110], miniseries:[90,140] };
                    const [lo, hi] = ranges[selectedDuration] || [70,110];
                    return charCount > hi ? "#E85D75" : charCount >= lo ? "#4ECCA3" : charCount > 0 ? "#F7A072" : "rgba(255,255,255,0.25)";
                  })(),
                }}
              >
                {charCount}자{" "}
                {charCount > 0 && (() => {
                  const ranges = { ultrashort:[20,40], shortform:[30,50], shortfilm:[40,70], webdrama:[50,80], tvdrama:[60,90], feature:[70,110], miniseries:[90,140] };
                  const [lo, hi] = ranges[selectedDuration] || [70,110];
                  return charCount < lo ? `· 짧음 (목표 ${lo}~${hi}자)` : charCount <= hi ? "· 적정" : `· 길음 (목표 ${lo}~${hi}자)`;
                })()}
              </div>
            </div>
          </div>

          {/* 입력 B (비교 모드) */}
          {compareMode && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#45B7D1",
                  marginBottom: 6,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                로그라인 B
              </div>
              <div style={{ position: "relative" }}>
                <textarea
                  value={logline2}
                  onChange={(e) => setLogline2(e.target.value)}
                  placeholder="비교할 로그라인을 입력하세요..."
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "16px 16px 32px",
                    borderRadius: 12,
                    border: "1px solid rgba(69,183,209,0.18)",
                    background: "rgba(69,183,209,0.03)",
                    color: "#e8e8f0",
                    fontSize: 14,
                    lineHeight: 1.75,
                    resize: "vertical",
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: "border-color 0.2s",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 12,
                    fontSize: 11,
                    color:
                      charCount2 > 100
                        ? "#E85D75"
                        : charCount2 > 50
                        ? "#F7A072"
                        : "rgba(255,255,255,0.25)",
                  }}
                >
                  {charCount2}자{" "}
                  {charCount2 > 0 &&
                    (charCount2 <= 50
                      ? "· 짧음"
                      : charCount2 <= 100
                      ? "· 적정"
                      : "· 길음")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 예시 버튼 */}
        <div
          style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              lineHeight: "28px",
            }}
          >
            예시:
          </span>
          {EXAMPLE_LOGLINES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setLogline(ex)}
              style={{
                padding: "4px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
                color: "rgba(255,255,255,0.38)",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              예시 {i + 1}
            </button>
          ))}
        </div>

        {/* 분석 버튼 */}
        <button
          onClick={analyze}
          disabled={loading || !logline.trim() || !apiKey}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            cursor: loading || !logline.trim() || !apiKey ? "not-allowed" : "pointer",
            background:
              loading || !logline.trim() || !apiKey
                ? "rgba(78,204,163,0.12)"
                : "linear-gradient(135deg, #4ECCA3, #45B7D1)",
            color:
              loading || !logline.trim() || !apiKey ? "rgba(255,255,255,0.3)" : "#0d0d1a",
            fontSize: 15,
            fontWeight: 700,
            transition: "all 0.3s",
            opacity: !logline.trim() || !apiKey ? 0.5 : 1,
          }}
        >
          {loading ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 15,
                  height: 15,
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTop: "2px solid rgba(255,255,255,0.8)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              {compareMode && logline2.trim()
                ? "두 로그라인 분석 중..."
                : "분석 중..."}
            </span>
          ) : compareMode && logline2.trim() ? (
            "🎬 두 로그라인 비교 분석"
          ) : (
            "🎬 로그라인 분석하기"
          )}
        </button>

        {!apiKey && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              textAlign: "center",
              color: "rgba(232,93,117,0.7)",
            }}
          >
            API 키를 먼저 설정해주세요 → 우측 상단 🔑
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(232,93,117,0.09)",
              border: "1px solid rgba(232,93,117,0.3)",
              color: "#E85D75",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* ─── 시놉시스 생성 패널 ─── */}
      <div
        style={{
          maxWidth: 720,
          margin: "12px auto 0",
          padding: isMobile ? "0 12px" : "0 20px",
        }}
      >
        {/* 토글 버튼 */}
        <button
          onClick={() => setShowSynopsisPanel(!showSynopsisPanel)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 12,
            border: showSynopsisPanel
              ? "1px solid rgba(167,139,250,0.4)"
              : "1px solid rgba(255,255,255,0.08)",
            background: showSynopsisPanel
              ? "rgba(167,139,250,0.07)"
              : "rgba(255,255,255,0.02)",
            color: showSynopsisPanel ? "#a78bfa" : "rgba(255,255,255,0.45)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
        >
          <span>📝</span>
          <span>이 로그라인으로 시놉시스 생성하기</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{showSynopsisPanel ? "▲" : "▼"}</span>
        </button>

        {/* 패널 본문 */}
        {showSynopsisPanel && (
          <div
            style={{
              marginTop: 8,
              padding: "20px",
              borderRadius: 12,
              border: "1px solid rgba(167,139,250,0.15)",
              background: "rgba(167,139,250,0.03)",
            }}
          >
            {/* 모드 토글 */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "rgba(255,255,255,0.03)", padding: 4, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { id: "auto", icon: "⚡", label: "자동 생성" },
                { id: "pipeline", icon: "🎮", label: "파이프라인" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSynopsisMode(m.id)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: synopsisMode === m.id ? 700 : 400,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    background: synopsisMode === m.id ? "rgba(167,139,250,0.18)" : "transparent",
                    color: synopsisMode === m.id ? "#a78bfa" : "rgba(255,255,255,0.35)",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* 파이프라인 모드 설명 */}
            {synopsisMode === "pipeline" && (
              <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(78,204,163,0.05)", borderRadius: 8, border: "1px solid rgba(78,204,163,0.15)", fontSize: 11, color: "rgba(78,204,163,0.7)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
                단계별 서사 요소를 선택하면 AI가 그 조합으로 맞춤 시놉시스를 생성합니다. 질문 수는 선택한 포맷에 따라 달라집니다.
              </div>
            )}

            {/* 포맷 선택 */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 10,
                  fontWeight: 600,
                }}
              >
                영상 포맷 (듀레이션)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDuration(d.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border:
                        selectedDuration === d.id
                          ? "1px solid rgba(167,139,250,0.5)"
                          : "1px solid rgba(255,255,255,0.07)",
                      background:
                        selectedDuration === d.id
                          ? "rgba(167,139,250,0.12)"
                          : "rgba(255,255,255,0.03)",
                      color:
                        selectedDuration === d.id ? "#a78bfa" : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "'Noto Sans KR', sans-serif",
                        marginBottom: 2,
                      }}
                    >
                      {d.icon} {d.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color:
                          selectedDuration === d.id
                            ? "rgba(167,139,250,0.7)"
                            : "rgba(255,255,255,0.3)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {d.duration}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 2,
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      {d.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 자동 생성 모드 ── */}
            {synopsisMode === "auto" && (
              <>
                {/* 방향 수 선택 */}
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    생성할 방향 수
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setDirectionCount(n)}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 20,
                          border:
                            directionCount === n
                              ? "1px solid rgba(167,139,250,0.5)"
                              : "1px solid rgba(255,255,255,0.08)",
                          background:
                            directionCount === n
                              ? "rgba(167,139,250,0.12)"
                              : "rgba(255,255,255,0.03)",
                          color:
                            directionCount === n ? "#a78bfa" : "rgba(255,255,255,0.4)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontFamily: "'Noto Sans KR', sans-serif",
                          fontWeight: directionCount === n ? 700 : 400,
                          transition: "all 0.15s",
                        }}
                      >
                        {n}가지
                      </button>
                    ))}
                  </div>
                </div>

                {/* 서사 구조 프레임워크 */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>
                    서사 구조 프레임워크
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 6 }}>
                    {NARRATIVE_FRAMEWORKS.map((f) => (
                      <button key={f.id} onClick={() => setSelectedFramework(f.id)}
                        style={{
                          padding: "8px 10px", borderRadius: 9, textAlign: "left",
                          border: selectedFramework === f.id ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.06)",
                          background: selectedFramework === f.id ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.02)",
                          color: selectedFramework === f.id ? "#a78bfa" : "rgba(255,255,255,0.45)",
                          cursor: "pointer", transition: "all 0.15s",
                        }}>
                        <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 2 }}>{f.icon} {f.label}</div>
                        <div style={{ fontSize: 9, color: selectedFramework === f.id ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>{f.ref}</div>
                      </button>
                    ))}
                  </div>
                  {selectedFramework && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(167,139,250,0.04)", borderRadius: 8, border: "1px solid rgba(167,139,250,0.1)", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                      {NARRATIVE_FRAMEWORKS.find(f => f.id === selectedFramework)?.desc}
                    </div>
                  )}
                </div>

                {/* 선택된 포맷 설명 */}
                {selectedDuration && (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      lineHeight: 1.6,
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    {DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.structure}
                  </div>
                )}

                {/* 생성 버튼 */}
                <button
                  onClick={generateSynopsis}
                  disabled={synopsisLoading || !logline.trim() || !apiKey}
                  style={{
                    width: "100%",
                    padding: 13,
                    borderRadius: 10,
                    border: "none",
                    cursor:
                      synopsisLoading || !logline.trim() || !apiKey
                        ? "not-allowed"
                        : "pointer",
                    background:
                      synopsisLoading || !logline.trim() || !apiKey
                        ? "rgba(167,139,250,0.1)"
                        : "linear-gradient(135deg, #a78bfa, #818cf8)",
                    color:
                      synopsisLoading || !logline.trim() || !apiKey
                        ? "rgba(255,255,255,0.3)"
                        : "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: "all 0.2s",
                    opacity: !logline.trim() || !apiKey ? 0.5 : 1,
                  }}
                >
                  {synopsisLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid rgba(255,255,255,0.8)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      {directionCount}가지 방향으로 시놉시스 작성 중...
                    </span>
                  ) : (
                    `✏️ ${directionCount}가지 방향으로 시놉시스 생성`
                  )}
                </button>

                {synopsisError && (
                  <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.09)", border: "1px solid rgba(232,93,117,0.25)", color: "#E85D75", fontSize: 12 }}>
                    {synopsisError}
                  </div>
                )}
              </>
            )}

            {/* ── 파이프라인 모드 ── */}
            {synopsisMode === "pipeline" && (
              <PipelinePanel
                selectedDuration={selectedDuration}
                logline={logline}
                apiKey={apiKey}
                isMobile={isMobile}
                onResult={(data) => {
                  setPipelineResult(data);
                  setTimeout(
                    () => document.getElementById("pipeline-result")?.scrollIntoView({ behavior: "smooth", block: "start" }),
                    200
                  );
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ─── 캐릭터 디벨롭 패널 ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={analyzeCharacterDev}
          disabled={charDevLoading || !logline.trim()}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: charDevResult ? "1px solid rgba(251,146,60,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: charDevResult ? "rgba(251,146,60,0.07)" : "rgba(255,255,255,0.02)",
            color: charDevResult ? "#FB923C" : charDevLoading ? "rgba(251,146,60,0.5)" : "rgba(255,255,255,0.45)",
            cursor: charDevLoading || !logline.trim() ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {charDevLoading ? (
            <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(251,146,60,0.25)", borderTop: "2px solid #FB923C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />캐릭터 분석 중...</>
          ) : (
            <><span>🧬</span><span>{charDevResult ? "캐릭터 디벨롭 완료 (재분석)" : "캐릭터 디벨롭"}</span></>
          )}
        </button>
        {charDevError && (
          <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{charDevError}</div>
        )}
      </div>

      {/* ─── 비트 시트 패널 ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={generateBeatSheet}
          disabled={beatSheetLoading || !logline.trim()}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: beatSheetResult ? "1px solid rgba(255,209,102,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: beatSheetResult ? "rgba(255,209,102,0.07)" : "rgba(255,255,255,0.02)",
            color: beatSheetResult ? "#FFD166" : beatSheetLoading ? "rgba(255,209,102,0.5)" : "rgba(255,255,255,0.45)",
            cursor: beatSheetLoading || !logline.trim() ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {beatSheetLoading
            ? <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,209,102,0.25)", borderTop: "2px solid #FFD166", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />비트 시트 생성 중...</>
            : <><span>🎞</span><span>{beatSheetResult ? "비트 시트 완성 (재생성)" : "비트 시트 생성"}</span></>}
        </button>
        {beatSheetError && (
          <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{beatSheetError}</div>
        )}
      </div>

      {/* ─── 하위텍스트 탐지 ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={analyzeSubtext}
          disabled={subtextLoading || !logline.trim()}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: subtextResult ? "1px solid rgba(149,225,211,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: subtextResult ? "rgba(149,225,211,0.07)" : "rgba(255,255,255,0.02)",
            color: subtextResult ? "#95E1D3" : subtextLoading ? "rgba(149,225,211,0.5)" : "rgba(255,255,255,0.45)",
            cursor: subtextLoading || !logline.trim() ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {subtextLoading
            ? <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(149,225,211,0.25)", borderTop: "2px solid #95E1D3", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />하위텍스트 분석 중...</>
            : <><span>🔍</span><span>{subtextResult ? "하위텍스트 탐지 완료 (재분석)" : "하위텍스트 탐지"}</span></>}
        </button>
        {subtextError && <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{subtextError}</div>}
      </div>

      {/* ─── 신화적 위치 매핑 ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={analyzeMythMap}
          disabled={mythMapLoading || !logline.trim()}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: mythMapResult ? "1px solid rgba(167,139,250,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: mythMapResult ? "rgba(167,139,250,0.07)" : "rgba(255,255,255,0.02)",
            color: mythMapResult ? "#A78BFA" : mythMapLoading ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.45)",
            cursor: mythMapLoading || !logline.trim() ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {mythMapLoading
            ? <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(167,139,250,0.25)", borderTop: "2px solid #A78BFA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />신화 매핑 중...</>
            : <><span>🗺</span><span>{mythMapResult ? "신화적 위치 매핑 완료 (재분석)" : "신화적 위치 매핑"}</span></>}
        </button>
        {mythMapError && <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{mythMapError}</div>}
      </div>

      {/* ─── 바르트 서사 코드 ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={analyzeBarthesCode}
          disabled={barthesCodeLoading || !logline.trim()}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: barthesCodeResult ? "1px solid rgba(100,220,200,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: barthesCodeResult ? "rgba(100,220,200,0.07)" : "rgba(255,255,255,0.02)",
            color: barthesCodeResult ? "#64DCC8" : barthesCodeLoading ? "rgba(100,220,200,0.5)" : "rgba(255,255,255,0.45)",
            cursor: barthesCodeLoading || !logline.trim() ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {barthesCodeLoading
            ? <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(100,220,200,0.25)", borderTop: "2px solid #64DCC8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />바르트 코드 분석 중...</>
            : <><span>📖</span><span>{barthesCodeResult ? "바르트 서사 코드 완료 (재분석)" : "바르트 서사 코드"}</span></>}
        </button>
        {barthesCodeError && <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{barthesCodeError}</div>}
      </div>

      {/* ─── 한국 신화 공명 ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={analyzeKoreanMyth}
          disabled={koreanMythLoading || !logline.trim()}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: koreanMythResult ? "1px solid rgba(232,93,117,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: koreanMythResult ? "rgba(232,93,117,0.07)" : "rgba(255,255,255,0.02)",
            color: koreanMythResult ? "#E85D75" : koreanMythLoading ? "rgba(232,93,117,0.5)" : "rgba(255,255,255,0.45)",
            cursor: koreanMythLoading || !logline.trim() ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {koreanMythLoading
            ? <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(232,93,117,0.25)", borderTop: "2px solid #E85D75", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />한국 신화 분석 중...</>
            : <><span>🌸</span><span>{koreanMythResult ? "한국 신화 공명 완료 (재분석)" : "한국 신화 공명"}</span></>}
        </button>
        {koreanMythError && <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{koreanMythError}</div>}
      </div>

      {/* ─── Script Coverage ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={analyzeScriptCoverage}
          disabled={scriptCoverageLoading || !logline.trim()}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: scriptCoverageResult ? "1px solid rgba(96,165,250,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: scriptCoverageResult ? "rgba(96,165,250,0.07)" : "rgba(255,255,255,0.02)",
            color: scriptCoverageResult ? "#60A5FA" : scriptCoverageLoading ? "rgba(96,165,250,0.5)" : "rgba(255,255,255,0.45)",
            cursor: scriptCoverageLoading || !logline.trim() ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {scriptCoverageLoading
            ? <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(96,165,250,0.25)", borderTop: "2px solid #60A5FA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Script Coverage 생성 중...</>
            : <><span>📄</span><span>{scriptCoverageResult ? "Script Coverage 완료 (재생성)" : "Script Coverage"}</span></>}
        </button>
        {scriptCoverageError && <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{scriptCoverageError}</div>}
      </div>

      {/* ─── 대사 디벨롭 ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={analyzeDialogueDev}
          disabled={dialogueDevLoading || !logline.trim()}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: dialogueDevResult ? "1px solid rgba(244,114,182,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: dialogueDevResult ? "rgba(244,114,182,0.07)" : "rgba(255,255,255,0.02)",
            color: dialogueDevResult ? "#F472B6" : dialogueDevLoading ? "rgba(244,114,182,0.5)" : "rgba(255,255,255,0.45)",
            cursor: dialogueDevLoading || !logline.trim() ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {dialogueDevLoading
            ? <><span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(244,114,182,0.25)", borderTop: "2px solid #F472B6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />대사 디벨롭 중...</>
            : <><span>💬</span><span>{dialogueDevResult ? "대사 디벨롭 완료 (재분석)" : "대사 디벨롭"}</span></>}
        </button>
        {dialogueDevError && <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{dialogueDevError}</div>}
      </div>

      {/* ─── 트리트먼트 작성 패널 ─── */}
      <div style={{ maxWidth: 720, margin: "10px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
        <button
          onClick={() => setShowTreatmentPanel(!showTreatmentPanel)}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            border: showTreatmentPanel ? "1px solid rgba(251,191,36,0.45)" : "1px solid rgba(255,255,255,0.08)",
            background: showTreatmentPanel ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.02)",
            color: showTreatmentPanel ? "#FBBf24" : "rgba(255,255,255,0.45)",
            cursor: "pointer", fontSize: 14, fontWeight: 600,
            fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          <span>📋</span>
          <span>트리트먼트로 발전시키기</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{showTreatmentPanel ? "▲" : "▼"}</span>
        </button>
        {showTreatmentPanel && (
          <div style={{ marginTop: 8 }}>
            <TreatmentInputPanel
              chars={treatmentChars}
              onCharsChange={setTreatmentChars}
              structure={treatmentStructure}
              onStructureChange={setTreatmentStructure}
              onGenerate={generateTreatment}
              loading={treatmentLoading}
              isMobile={isMobile}
            />
            {treatmentError && (
              <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>
                {treatmentError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 결과 영역 ─── */}
      {result && (
        <div
          ref={resultRef}
          style={{
            maxWidth: 720,
            margin: "32px auto 0",
            padding: isMobile ? "0 12px 80px" : "0 20px 80px",
          }}
        >
          {/* ── 총점 카드 ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "24px 20px",
              marginBottom: 20,
            }}
          >
            {compareMode && result2 ? (
              /* 비교 모드 헤더 */
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 20,
                    marginBottom: 16,
                  }}
                >
                  {/* A 점수 */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#4ECCA3",
                        marginBottom: 14,
                        fontWeight: 700,
                        letterSpacing: 1,
                      }}
                    >
                      로그라인 A
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: isMobile ? 16 : 28,
                      }}
                    >
                      <CircleGauge
                        score={qualityScore}
                        label="품질 점수"
                        size={isMobile ? 90 : 110}
                      />
                      <CircleGauge
                        score={interestScore}
                        label="흥미도"
                        size={isMobile ? 90 : 110}
                      />
                    </div>
                  </div>

                  {/* B 점수 */}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#45B7D1",
                        marginBottom: 14,
                        fontWeight: 700,
                        letterSpacing: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      로그라인 B
                      {loading2 && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            border: "1.5px solid rgba(69,183,209,0.3)",
                            borderTop: "1.5px solid #45B7D1",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: isMobile ? 16 : 28,
                      }}
                    >
                      <CircleGauge
                        score={qualityScore2}
                        label="품질 점수"
                        size={isMobile ? 90 : 110}
                      />
                      <CircleGauge
                        score={interestScore2}
                        label="흥미도"
                        size={isMobile ? 90 : 110}
                      />
                    </div>
                  </div>
                </div>

                {/* 승패 요약 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    padding: "10px 16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                >
                  {qualityScore !== qualityScore2 ? (
                    <span
                      style={{
                        color:
                          qualityScore > qualityScore2 ? "#4ECCA3" : "#45B7D1",
                      }}
                    >
                      {qualityScore > qualityScore2 ? "A" : "B"}가 품질{" "}
                      {Math.abs(qualityScore - qualityScore2)}점 앞섬
                    </span>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>품질 동점</span>
                  )}
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                  {interestScore !== interestScore2 ? (
                    <span
                      style={{
                        color:
                          interestScore > interestScore2 ? "#4ECCA3" : "#45B7D1",
                      }}
                    >
                      {interestScore > interestScore2 ? "A" : "B"}가 흥미도{" "}
                      {Math.abs(interestScore - interestScore2)}점 앞섬
                    </span>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>흥미도 동점</span>
                  )}
                </div>
              </div>
            ) : (
              /* 일반 헤더 */
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: isMobile ? 20 : 40,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <CircleGauge
                    score={qualityScore}
                    label="품질 점수"
                    subLabel={`구조${structureTotal} + 표현${expressionTotal} + 기술${technicalTotal}`}
                    size={isMobile ? 100 : 120}
                  />
                  <CircleGauge
                    score={interestScore}
                    label="흥미도"
                    subLabel="정보격차 이론 기반"
                    size={isMobile ? 100 : 120}
                  />
                </div>
                {result.detected_genre && (
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: 12,
                    }}
                  >
                    감지된 장르:{" "}
                    <span style={{ color: "#4ECCA3" }}>{result.detected_genre}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                  <ExportButton
                    result={result}
                    logline={logline}
                    qualityScore={qualityScore}
                    interestScore={interestScore}
                  />
                  <button
                    onClick={analyzeAcademic}
                    disabled={academicLoading}
                    style={{
                      padding: "7px 16px", borderRadius: 8,
                      border: academicResult ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(167,139,250,0.2)",
                      background: academicResult ? "rgba(167,139,250,0.12)" : "rgba(167,139,250,0.05)",
                      color: academicResult ? "#a78bfa" : "rgba(167,139,250,0.65)",
                      cursor: academicLoading ? "wait" : "pointer",
                      fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                    }}
                  >
                    {academicLoading ? (
                      <>
                        <span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(167,139,250,0.3)", borderTop: "1.5px solid #a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        학술 분석 중...
                      </>
                    ) : academicResult ? "🎓 학술 분석 완료" : "🎓 학술 이론 분석"}
                  </button>
                  {/* 전문가 패널 버튼 */}
                  <button
                    onClick={runExpertPanel}
                    disabled={expertPanelLoading}
                    style={{
                      padding: "7px 16px", borderRadius: 8,
                      border: expertPanelResult ? "1px solid rgba(255,209,102,0.5)" : "1px solid rgba(255,209,102,0.2)",
                      background: expertPanelResult ? "rgba(255,209,102,0.1)" : "rgba(255,209,102,0.04)",
                      color: expertPanelResult ? "#FFD166" : "rgba(255,209,102,0.6)",
                      cursor: expertPanelLoading ? "wait" : "pointer",
                      fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
                      display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                    }}
                  >
                    {expertPanelLoading ? (
                      <>
                        <span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(255,209,102,0.3)", borderTop: "1.5px solid #FFD166", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        전문가 토론 중...
                      </>
                    ) : expertPanelResult ? "🎙️ 전문가 패널 완료" : "🎙️ 전문가 패널 소집"}
                  </button>
                  {/* 가치 전하 버튼 */}
                  <button
                    onClick={analyzeValueCharge}
                    disabled={valueChargeLoading}
                    style={{ padding: "7px 16px", borderRadius: 8, border: valueChargeResult ? "1px solid rgba(78,204,163,0.5)" : "1px solid rgba(78,204,163,0.2)", background: valueChargeResult ? "rgba(78,204,163,0.1)" : "rgba(78,204,163,0.04)", color: valueChargeResult ? "#4ECCA3" : "rgba(78,204,163,0.6)", cursor: valueChargeLoading ? "wait" : "pointer", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                  >
                    {valueChargeLoading ? (<><span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(78,204,163,0.3)", borderTop: "1.5px solid #4ECCA3", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />분석 중...</>) : valueChargeResult ? "⚡ 가치 전하 완료" : "⚡ 가치 전하 분석"}
                  </button>
                  {/* 그림자 캐릭터 버튼 */}
                  <button
                    onClick={analyzeShadow}
                    disabled={shadowLoading}
                    style={{ padding: "7px 16px", borderRadius: 8, border: shadowResult ? "1px solid rgba(232,93,117,0.5)" : "1px solid rgba(232,93,117,0.2)", background: shadowResult ? "rgba(232,93,117,0.1)" : "rgba(232,93,117,0.04)", color: shadowResult ? "#E85D75" : "rgba(232,93,117,0.6)", cursor: shadowLoading ? "wait" : "pointer", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                  >
                    {shadowLoading ? (<><span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(232,93,117,0.3)", borderTop: "1.5px solid #E85D75", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />분석 중...</>) : shadowResult ? "🌑 그림자 분석 완료" : "🌑 그림자 캐릭터 분석"}
                  </button>
                  {/* 진정성 지수 버튼 */}
                  <button
                    onClick={analyzeAuthenticity}
                    disabled={authenticityLoading}
                    style={{ padding: "7px 16px", borderRadius: 8, border: authenticityResult ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(167,139,250,0.2)", background: authenticityResult ? "rgba(167,139,250,0.1)" : "rgba(167,139,250,0.04)", color: authenticityResult ? "#A78BFA" : "rgba(167,139,250,0.6)", cursor: authenticityLoading ? "wait" : "pointer", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                  >
                    {authenticityLoading ? (<><span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid rgba(167,139,250,0.3)", borderTop: "1.5px solid #A78BFA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />분석 중...</>) : authenticityResult ? "🎭 진정성 분석 완료" : "🎭 진정성 지수"}
                  </button>
                </div>
                {academicError && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#E85D75", textAlign: "center" }}>{academicError}</div>
                )}
                {expertPanelError && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#E85D75", textAlign: "center" }}>{expertPanelError}</div>
                )}
                {valueChargeError && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#E85D75", textAlign: "center" }}>{valueChargeError}</div>
                )}
                {shadowError && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#E85D75", textAlign: "center" }}>{shadowError}</div>
                )}
                {authenticityError && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#A78BFA", textAlign: "center" }}>{authenticityError}</div>
                )}
              </div>
            )}
          </div>

          {/* ── 비교 모드: 항목별 비교 ── */}
          {compareMode && result2 && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                항목별 비교
              </div>
              <CompareSection
                result1={result}
                result2={result2}
                section="structure"
                title="A. 구조적 완성도"
                maxTotal={50}
                color="#4ECCA3"
              />
              <CompareSection
                result1={result}
                result2={result2}
                section="expression"
                title="B. 표현적 매력도"
                maxTotal={30}
                color="#45B7D1"
              />
              <CompareSection
                result1={result}
                result2={result2}
                section="technical"
                title="C. 기술적 완성도"
                maxTotal={20}
                color="#F7A072"
              />
              <CompareSection
                result1={result}
                result2={result2}
                section="interest"
                title="D. 흥미 유발 지수"
                maxTotal={100}
                color="#FFD700"
              />
            </div>
          )}

          {/* ── 탭 네비게이션 ── */}
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 3,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 10,
                padding: 4,
                minWidth: "max-content",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: "0 0 auto",
                    padding: isMobile ? "7px 10px" : "8px 13px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    background:
                      activeTab === tab.id
                        ? "rgba(78,204,163,0.14)"
                        : "transparent",
                    color:
                      activeTab === tab.id
                        ? "#4ECCA3"
                        : "rgba(255,255,255,0.38)",
                    fontSize: 11,
                    fontWeight: activeTab === tab.id ? 700 : 400,
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 탭 콘텐츠 ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
              padding: isMobile ? "16px 14px" : "24px 20px",
            }}
          >
            {/* 종합 */}
            {activeTab === "overview" && (
              <div>
                <div
                  style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}
                >
                  <RadarChart data={radarData} size={isMobile ? 220 : 280} />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      label: "구조적 완성도",
                      score: structureTotal,
                      max: 50,
                      color: "#4ECCA3",
                    },
                    {
                      label: "표현적 매력도",
                      score: expressionTotal,
                      max: 30,
                      color: "#45B7D1",
                    },
                    {
                      label: "기술적 완성도",
                      score: technicalTotal,
                      max: 20,
                      color: "#F7A072",
                    },
                    {
                      label: "흥미 유발 지수",
                      score: interestScore,
                      max: 100,
                      color: "#FFD700",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: isMobile ? 12 : 16,
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 12,
                        border: `1px solid ${item.color}18`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.45)",
                          marginBottom: 5,
                          fontFamily: "'Noto Sans KR', sans-serif",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: isMobile ? 20 : 24,
                          fontWeight: 800,
                          color: item.color,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {item.score}
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: "rgba(255,255,255,0.25)",
                          }}
                        >
                          /{item.max}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          height: 3,
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(item.score / item.max) * 100}%`,
                            background: item.color,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 구조 */}
            {activeTab === "structure" && result.structure && (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#4ECCA3",
                    marginBottom: 18,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  A. 구조적 완성도 — {structureTotal}/50
                </div>
                {Object.entries(result.structure).map(([key, val], i) => (
                  <ScoreBar
                    key={key}
                    score={val.score}
                    max={val.max}
                    label={LABELS_KR[key]}
                    found={val.found}
                    feedback={val.feedback}
                    delay={i * 100}
                    criterionKey={key}
                  />
                ))}
              </div>
            )}

            {/* 표현 */}
            {activeTab === "expression" && result.expression && (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#45B7D1",
                    marginBottom: 18,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  B. 표현적 매력도 — {expressionTotal}/30
                </div>
                {Object.entries(result.expression).map(([key, val], i) => (
                  <ScoreBar
                    key={key}
                    score={val.score}
                    max={val.max}
                    label={LABELS_KR[key]}
                    found={val.found}
                    feedback={val.feedback}
                    delay={i * 100}
                    criterionKey={key}
                  />
                ))}
              </div>
            )}

            {/* 기술 */}
            {activeTab === "technical" && result.technical && (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#F7A072",
                    marginBottom: 18,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  C. 기술적 완성도 — {technicalTotal}/20
                </div>
                {Object.entries(result.technical).map(([key, val], i) => (
                  <ScoreBar
                    key={key}
                    score={val.score}
                    max={val.max}
                    label={LABELS_KR[key]}
                    feedback={val.feedback}
                    delay={i * 100}
                    criterionKey={key}
                  />
                ))}
              </div>
            )}

            {/* 흥미도 */}
            {activeTab === "interest" && result.interest && (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#FFD700",
                    marginBottom: 4,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  D. 흥미 유발 지수 — {interestScore}/100
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    marginBottom: 18,
                  }}
                >
                  Loewenstein 정보격차 이론(1994) · Green & Brock 서사몰입 이론(2000)
                  기반
                </div>
                {Object.entries(result.interest).map(([key, val], i) => (
                  <ScoreBar
                    key={key}
                    score={val.score}
                    max={val.max}
                    label={LABELS_KR[key]}
                    feedback={val.feedback}
                    delay={i * 100}
                    criterionKey={key}
                  />
                ))}
              </div>
            )}

            {/* 피드백 */}
            {activeTab === "feedback" && (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#e8e8f0",
                    marginBottom: 12,
                  }}
                >
                  종합 피드백
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.85,
                    color: "rgba(255,255,255,0.72)",
                    padding: 16,
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 12,
                    marginBottom: 22,
                  }}
                >
                  {result.overall_feedback}
                </div>

                {result.improvement_questions?.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#F7A072",
                        marginBottom: 12,
                      }}
                    >
                      💡 스스로 생각해 볼 질문
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      {result.improvement_questions.map((q, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 16px",
                            background: "rgba(247,160,114,0.05)",
                            borderRadius: 10,
                            borderLeft: "3px solid #F7A072",
                            fontSize: 13,
                            lineHeight: 1.65,
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {q}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* AI 개선안 */}
                <ImprovementPanel
                  logline={logline}
                  genre={genre}
                  apiKey={apiKey}
                  result={result}
                />

                {/* 출처 */}
                <div
                  style={{
                    marginTop: 24,
                    padding: 16,
                    background: "rgba(78,204,163,0.03)",
                    borderRadius: 12,
                    border: "1px solid rgba(78,204,163,0.09)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#4ECCA3",
                      marginBottom: 8,
                    }}
                  >
                    📐 평가 기준 출처
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      lineHeight: 1.9,
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    • Blake Snyder, <em>Save the Cat!</em> (2005) — 아이러니, 심상,
                    관객/비용, 타이틀
                    <br />
                    • Robert McKee, <em>Story</em> (1997) — 목표-장애물-변화의 프랙탈 구조
                    <br />
                    • Syd Field, <em>Screenplay</em> (1982) — 3막 구조: 설정-대립-해결
                    <br />
                    • Loewenstein, <em>Psychology of Curiosity</em> (1994) — 정보격차 이론
                    <br />
                    • Green & Brock (2000) — 서사 몰입(Narrative Transportation) 이론
                    <br />
                    • Hollywood Script Coverage — Pass/Consider/Recommend 체계
                    <br />
                    • Mirowski et al., <em>Dramatron</em> (CHI 2023) — 로그라인 기반
                    계층적 서사 생성
                  </div>
                </div>
              </div>
            )}

            {/* 학술 분석 */}
            {activeTab === "academic" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", fontFamily: "'Noto Sans KR', sans-serif" }}>
                    🎓 학술 이론 분석
                  </div>
                  <button onClick={analyzeAcademic} disabled={academicLoading}
                    style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.25)", background: "transparent", color: "rgba(167,139,250,0.6)", cursor: "pointer", fontSize: 11 }}>
                    재분석
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18, lineHeight: 1.6 }}>
                  Aristotle (c.335 BCE) · Propp (1928) · Campbell (1949) · Todorov (1977) · Barthes (1970) · Freytag (1863) · Zillmann (1983) · Smith (1995) · 한국 서사 미학
                </div>
                <AcademicPanel academic={academicResult} />
              </div>
            )}

            {/* 추이 */}
            {activeTab === "trend" && (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: 4,
                  }}
                >
                  점수 추이
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    marginBottom: 20,
                  }}
                >
                  최근 {Math.min(history.length, 10)}회 분석 결과 (오래된 순 → 최신)
                </div>
                <ScoreHistoryChart history={history} />

                {/* 목록 요약 */}
                <div style={{ marginTop: 24 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    최근 분석 기록
                  </div>
                  {history.slice(0, 8).map((h) => {
                    const g = getGrade(h.qualityScore);
                    return (
                      <div
                        key={h.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          marginBottom: 4,
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setLogline(h.logline);
                          setGenre(h.genre || "auto");
                          setResult(h.result);
                          setResult2(null);
                          setActiveTab("overview");
                          setTimeout(
                            () =>
                              resultRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              }),
                            100
                          );
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                        }
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.6)",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginRight: 12,
                          }}
                        >
                          {h.logline.length > 35
                            ? h.logline.slice(0, 35) + "…"
                            : h.logline}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexShrink: 0,
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: g.color,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                            }}
                          >
                            {h.qualityScore}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "#FFD700",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {h.interestScore}
                          </span>
                          <span
                            style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}
                          >
                            {formatDate(h.date)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 시놉시스 결과 ─── */}
      {synopsisResults?.synopses?.length > 0 && (
        <div
          ref={synopsisRef}
          style={{
            maxWidth: 720,
            margin: "28px auto 0",
            padding: isMobile ? "0 12px 80px" : "0 20px 80px",
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#a78bfa",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  marginBottom: 4,
                }}
              >
                📝 시놉시스 결과
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.icon}{" "}
                {DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.label} (
                {DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.duration}) ·{" "}
                {synopsisResults.synopses.length}가지 방향
              </div>
            </div>
            <button
              onClick={() => {
                const all = synopsisResults.synopses
                  .map((s, i) =>
                    [
                      `═══ 방향 ${i + 1}: ${s.direction_title} ═══`,
                      `장르/톤: ${s.genre_tone}`,
                      `핵심: ${s.hook}`,
                      "",
                      s.synopsis,
                      "",
                      "◆ 핵심 장면",
                      ...(s.key_scenes || []).map((sc, j) => `${j + 1}. ${sc}`),
                      `주제: ${s.theme}`,
                      `결말: ${s.ending_type}`,
                    ].join("\n")
                  )
                  .join("\n\n");
                navigator.clipboard.writeText(
                  `로그라인: "${logline}"\n포맷: ${DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.label}\n\n` + all
                );
              }}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid rgba(167,139,250,0.25)",
                background: "rgba(167,139,250,0.06)",
                color: "rgba(167,139,250,0.7)",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              전체 복사
            </button>
          </div>

          {/* 원본 로그라인 표시 */}
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 16,
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'Noto Sans KR', sans-serif",
              lineHeight: 1.7,
            }}
          >
            <span style={{ color: "rgba(167,139,250,0.5)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>
              원본 로그라인
            </span>
            &ldquo;{logline}&rdquo;
          </div>

          {/* 시놉시스 카드 목록 */}
          {synopsisResults.synopses.map((s, i) => (
            <SynopsisCard key={i} synopsis={s} index={i} />
          ))}
        </div>
      )}

      {/* ─── 가치 전하 분석 결과 (McKee) ─── */}
      {valueChargeResult && (
        <div ref={valueChargeRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#4ECCA3", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>⚡ 가치 전하 분석</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>McKee, Story (1997) — Value Charge Theory</div>
            </div>
            <button onClick={() => setValueChargeResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(78,204,163,0.12)", background: "rgba(78,204,163,0.02)" }}>
            <ValueChargePanel data={valueChargeResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 그림자 캐릭터 분석 결과 (Jung) ─── */}
      {shadowResult && (
        <div ref={shadowRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#E85D75", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>🌑 그림자 캐릭터 분석</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Jung, Archetypes and the Collective Unconscious (1969)</div>
            </div>
            <button onClick={() => setShadowResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(232,93,117,0.12)", background: "rgba(232,93,117,0.02)" }}>
            <ShadowAnalysisPanel data={shadowResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 진정성 지수 결과 (Sartre) ─── */}
      {authenticityResult && (
        <div ref={authenticityRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#A78BFA", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>🎭 진정성 지수</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Sartre, L'Être et le Néant (1943) — Authenticité · Mauvaise foi</div>
            </div>
            <button onClick={() => setAuthenticityResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(167,139,250,0.12)", background: "rgba(167,139,250,0.02)" }}>
            <AuthenticityPanel data={authenticityResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 전문가 패널 결과 ─── */}
      {expertPanelResult && (
        <div
          ref={expertPanelRef}
          style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}
        >
          {/* 헤더 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FFD166", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>
                🎙️ 전문가 원탁 토론
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                맥키 · 오토르 · 융 · 사르트르 · 체호프 · 캠벨 · 바르트 · 드러커 · 코틀러 · 포터
              </div>
            </div>
            <button
              onClick={() => setExpertPanelResult(null)}
              style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              닫기
            </button>
          </div>
          {/* 패널 박스 */}
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(255,209,102,0.12)", background: "rgba(255,209,102,0.02)" }}>
            <ExpertPanelSection data={expertPanelResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 파이프라인 시놉시스 결과 ─── */}
      {pipelineResult && (
        <div
          id="pipeline-result"
          style={{
            maxWidth: 720,
            margin: "28px auto 0",
            padding: isMobile ? "0 12px 80px" : "0 20px 80px",
          }}
        >
          {/* 헤더 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#4ECCA3", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>
                🎮 파이프라인 시놉시스
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.icon}{" "}
                {DURATION_OPTIONS.find((d) => d.id === selectedDuration)?.label} · 선택 기반 맞춤 생성
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* 편집 모드 토글 */}
              <button
                onClick={() => {
                  if (pipelineEditMode) {
                    setPipelineEditMode(false);
                  } else {
                    setPipelineEditData(JSON.parse(JSON.stringify(pipelineResult)));
                    setPipelineEditMode(true);
                  }
                }}
                style={{
                  padding: "7px 14px", borderRadius: 8,
                  border: pipelineEditMode ? "1px solid rgba(247,160,114,0.4)" : "1px solid rgba(255,255,255,0.12)",
                  background: pipelineEditMode ? "rgba(247,160,114,0.1)" : "rgba(255,255,255,0.03)",
                  color: pipelineEditMode ? "#F7A072" : "rgba(255,255,255,0.45)",
                  cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600,
                }}
              >
                {pipelineEditMode ? "← 미리보기" : "✏️ 직접 편집"}
              </button>
              {!pipelineEditMode && (
                <button
                  onClick={() => {
                    const d = pipelineResult;
                    const text = [
                      `[파이프라인 시놉시스] ${d.direction_title}`,
                      `장르/톤: ${d.genre_tone}`,
                      `핵심: ${d.hook}`, "",
                      d.synopsis, "",
                      "핵심 장면:",
                      ...(d.key_scenes || []).map((s, i) => `${i + 1}. ${s}`), "",
                      `주제: ${d.theme}`, `결말: ${d.ending_type}`, "",
                      `서사 DNA: ${d.narrative_dna}`,
                    ].join("\n");
                    navigator.clipboard.writeText(text);
                  }}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.06)", color: "rgba(78,204,163,0.7)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  복사
                </button>
              )}
              {pipelineEditMode ? (
                <button
                  onClick={() => { setPipelineResult(pipelineEditData); setPipelineEditMode(false); }}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #4ECCA3, #45B7D1)", color: "#0d1a14", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700 }}
                >
                  저장
                </button>
              ) : (
                <button
                  onClick={() => { setPipelineResult(null); setPipelineEditMode(false); }}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  닫기
                </button>
              )}
            </div>
          </div>

          {/* ── 직접 편집 모드 ── */}
          {pipelineEditMode && pipelineEditData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* 편집 안내 */}
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(247,160,114,0.06)", border: "1px solid rgba(247,160,114,0.18)", fontSize: 11, color: "rgba(247,160,114,0.7)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                각 항목을 직접 수정하세요. 핵심 장면은 개별 삭제하거나 새로 추가할 수 있습니다. 수정 완료 후 상단의 <strong>저장</strong> 버튼을 누르세요.
              </div>

              {/* 제목 */}
              {[
                { key: "direction_title", label: "제목" },
                { key: "genre_tone", label: "장르 / 톤" },
                { key: "ending_type", label: "결말 유형" },
                { key: "theme", label: "주제" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
                  <input
                    value={pipelineEditData[key] || ""}
                    onChange={(e) => setPipelineEditData({ ...pipelineEditData, [key]: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(247,160,114,0.2)", background: "rgba(247,160,114,0.04)", color: "#e8e8f0", fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}

              {/* 훅 */}
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>핵심 훅</div>
                <textarea
                  value={pipelineEditData.hook || ""}
                  onChange={(e) => setPipelineEditData({ ...pipelineEditData, hook: e.target.value })}
                  rows={2}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(247,160,114,0.2)", background: "rgba(247,160,114,0.04)", color: "#e8e8f0", fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
                />
              </div>

              {/* 시놉시스 본문 */}
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>시놉시스 본문</div>
                <textarea
                  value={pipelineEditData.synopsis || ""}
                  onChange={(e) => setPipelineEditData({ ...pipelineEditData, synopsis: e.target.value })}
                  rows={10}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(247,160,114,0.2)", background: "rgba(247,160,114,0.04)", color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", resize: "vertical", lineHeight: 1.8, boxSizing: "border-box" }}
                />
              </div>

              {/* 핵심 장면 */}
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>핵심 장면</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(pipelineEditData.key_scenes || []).map((scene, si) => (
                    <div key={si} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "rgba(247,160,114,0.5)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, width: 16, textAlign: "right" }}>{si + 1}</span>
                      <input
                        value={scene}
                        onChange={(e) => {
                          const scenes = [...(pipelineEditData.key_scenes || [])];
                          scenes[si] = e.target.value;
                          setPipelineEditData({ ...pipelineEditData, key_scenes: scenes });
                        }}
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(247,160,114,0.18)", background: "rgba(247,160,114,0.04)", color: "#e8e8f0", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none" }}
                      />
                      <button
                        onClick={() => {
                          const scenes = (pipelineEditData.key_scenes || []).filter((_, i) => i !== si);
                          setPipelineEditData({ ...pipelineEditData, key_scenes: scenes });
                        }}
                        title="이 장면 삭제"
                        style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(232,93,117,0.25)", background: "rgba(232,93,117,0.06)", color: "#E85D75", cursor: "pointer", fontSize: 12, flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {/* 장면 추가 버튼 */}
                  <button
                    onClick={() => setPipelineEditData({ ...pipelineEditData, key_scenes: [...(pipelineEditData.key_scenes || []), ""] })}
                    style={{ marginTop: 2, padding: "7px 12px", borderRadius: 7, border: "1px dashed rgba(247,160,114,0.25)", background: "transparent", color: "rgba(247,160,114,0.5)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", textAlign: "left" }}
                  >
                    + 장면 추가
                  </button>
                </div>
              </div>

              {/* 서사 DNA */}
              {pipelineEditData.narrative_dna !== undefined && (
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>Narrative DNA</div>
                  <textarea
                    value={pipelineEditData.narrative_dna || ""}
                    onChange={(e) => setPipelineEditData({ ...pipelineEditData, narrative_dna: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(247,160,114,0.2)", background: "rgba(247,160,114,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
                  />
                </div>
              )}

              {/* 저장 버튼 (하단 반복) */}
              <button
                onClick={() => { setPipelineResult(pipelineEditData); setPipelineEditMode(false); }}
                style={{ padding: "12px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #4ECCA3, #45B7D1)", color: "#0d1a14", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}
              >
                ✓ 변경사항 저장
              </button>
            </div>

          ) : (
            <>
              {/* 미리보기 카드 */}
              <SynopsisCard synopsis={pipelineResult} index={0} />

              {/* 서사 DNA */}
              {pipelineResult.narrative_dna && (
                <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
                    NARRATIVE DNA — 선택 요소 통합 분석
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
                    {pipelineResult.narrative_dna}
                  </div>
                </div>
              )}

              {/* 피드백으로 다듬기 */}
              <div style={{ marginTop: 16, padding: "16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  피드백으로 다듬기
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                  어색한 부분이나 바꾸고 싶은 점을 적어주세요. 잘 된 부분은 그대로 유지하고 지적된 부분만 수정합니다.
                </div>
                <textarea
                  value={pipelineFeedback}
                  onChange={(e) => setPipelineFeedback(e.target.value)}
                  placeholder={`예시:\n• 세계관 설정이 불명확해요\n• 저주가 풀리는 이유를 더 명확하게 해주세요\n• 결말을 더 희망적으로 바꿔주세요`}
                  style={{ width: "100%", minHeight: 90, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />
                <button
                  onClick={refinePipelineSynopsis}
                  disabled={pipelineRefineLoading || !pipelineFeedback.trim()}
                  style={{ marginTop: 10, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: pipelineRefineLoading || !pipelineFeedback.trim() ? "rgba(78,204,163,0.1)" : "linear-gradient(135deg, #4ECCA3, #45B7D1)", color: pipelineRefineLoading || !pipelineFeedback.trim() ? "rgba(255,255,255,0.3)" : "#0d1a14", cursor: pipelineRefineLoading || !pipelineFeedback.trim() ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s" }}
                >
                  {pipelineRefineLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid rgba(255,255,255,0.7)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      피드백 반영 중...
                    </span>
                  ) : "🔄 피드백 반영하여 재생성"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── 비트 시트 결과 ─── */}
      {beatSheetResult && (
        <div ref={beatSheetRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FFD166", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>🎞 비트 시트</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Snyder (2005) · Field (1982) · McKee (1997) · Truby (2007)</div>
            </div>
            <button onClick={() => { setBeatSheetResult(null); setBeatScenes({}); }} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(255,209,102,0.12)", background: "rgba(255,209,102,0.02)" }}>
            <BeatSheetPanel
              data={beatSheetResult}
              beatScenes={beatScenes}
              generatingBeat={generatingBeat}
              expandedBeats={expandedBeats}
              onToggle={(id) => setExpandedBeats((prev) => ({ ...prev, [id]: !prev[id] }))}
              onGenerateScene={generateScene}
              onExportAll={() => {
                const beats = beatSheetResult.beats || [];
                const text = beats
                  .filter((b) => beatScenes[b.id])
                  .map((b) => `${"=".repeat(50)}\n비트 ${b.id}: ${b.name_kr} (${b.name_en}) — p.${b.page_start}~${b.page_end}\n${"=".repeat(50)}\n\n${beatScenes[b.id]}`)
                  .join("\n\n\n");
                const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "screenplay_scenes.txt"; a.click();
                URL.revokeObjectURL(url);
              }}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* ─── 캐릭터 디벨롭 결과 ─── */}
      {charDevResult && (
        <div ref={charDevRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FB923C", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>🧬 캐릭터 디벨롭</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Egri (1946) · Hauge (1988) · Truby (2007) · Vogler (1992) · Jung (1969)</div>
            </div>
            <button onClick={() => setCharDevResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(251,146,60,0.12)", background: "rgba(251,146,60,0.02)" }}>
            <CharacterDevPanel data={charDevResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 하위텍스트 결과 ─── */}
      {subtextResult && (
        <div ref={subtextRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#95E1D3", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>🔍 하위텍스트 탐지</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Chekhov · Stanislavski · Brecht · Pinter · Mamet</div>
            </div>
            <button onClick={() => setSubtextResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(149,225,211,0.12)", background: "rgba(149,225,211,0.02)" }}>
            <SubtextPanel data={subtextResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 신화적 위치 매핑 결과 ─── */}
      {mythMapResult && (
        <div ref={mythMapRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#A78BFA", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>🗺 신화적 위치 매핑</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Campbell (1949) · Propp (1928) · Frazer (1890) · Lévi-Strauss (1958)</div>
            </div>
            <button onClick={() => setMythMapResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(167,139,250,0.12)", background: "rgba(167,139,250,0.02)" }}>
            <MythMapPanel data={mythMapResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 바르트 서사 코드 결과 ─── */}
      {barthesCodeResult && (
        <div ref={barthesCodeRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#64DCC8", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>📖 바르트 서사 코드</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Barthes, R. — S/Z (1970)</div>
            </div>
            <button onClick={() => setBarthesCodeResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(100,220,200,0.12)", background: "rgba(100,220,200,0.02)" }}>
            <BarthesCodePanel data={barthesCodeResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 한국 신화 공명 결과 ─── */}
      {koreanMythResult && (
        <div ref={koreanMythRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#E85D75", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>🌸 한국 신화 공명</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>조동일 · 이어령 · 최길성 — 한(恨)·정(情)·신명(神明)</div>
            </div>
            <button onClick={() => setKoreanMythResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(232,93,117,0.12)", background: "rgba(232,93,117,0.02)" }}>
            <KoreanMythPanel data={koreanMythResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── Script Coverage 결과 ─── */}
      {scriptCoverageResult && (
        <div ref={scriptCoverageRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#60A5FA", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>📄 Script Coverage</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Hollywood WGA·CAA·ICM + KBS·MBC·tvN 방송 기준</div>
            </div>
            <button onClick={() => setScriptCoverageResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(96,165,250,0.12)", background: "rgba(96,165,250,0.02)" }}>
            <ScriptCoveragePanel data={scriptCoverageResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 대사 디벨롭 결과 ─── */}
      {dialogueDevResult && (
        <div ref={dialogueDevRef} style={{ maxWidth: 720, margin: "28px auto 0", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#F472B6", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>💬 대사 디벨롭</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Stanislavski · Mamet · Pinter · McKee · Truby · Field</div>
            </div>
            <button onClick={() => setDialogueDevResult(null)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
          </div>
          <div style={{ padding: "20px", borderRadius: 14, border: "1px solid rgba(244,114,182,0.12)", background: "rgba(244,114,182,0.02)" }}>
            <DialogueDevPanel data={dialogueDevResult} isMobile={isMobile} />
          </div>
        </div>
      )}

      {/* ─── 트리트먼트 결과 ─── */}
      {treatmentResult && (
        <div ref={treatmentRef} style={{ maxWidth: 720, margin: "28px auto 60px", padding: isMobile ? "0 12px" : "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FBBf24", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>📋 트리트먼트</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Field (1982) · Snyder (2005) · McKee (1997) · Seger (1987)</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const blob = new Blob([treatmentResult], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "treatment.txt"; a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(251,191,36,0.25)", background: "rgba(251,191,36,0.07)", color: "rgba(251,191,36,0.8)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}
              >↓ TXT 저장</button>
              <button onClick={() => setTreatmentResult("")} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>닫기</button>
            </div>
          </div>
          <div style={{ padding: isMobile ? "18px 16px" : "24px 28px", borderRadius: 14, border: "1px solid rgba(251,191,36,0.12)", background: "rgba(251,191,36,0.02)" }}>
            <div style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: isMobile ? 13 : 14, lineHeight: 1.9, color: "rgba(255,255,255,0.82)" }}>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#FBBf24", marginBottom: 8, marginTop: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: 28, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.07)", fontFamily: "'Noto Sans KR', sans-serif" }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "#FBBf24", marginTop: 18, marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{children}</h3>,
                  p: ({ children }) => <p style={{ marginBottom: 12, marginTop: 0 }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>{children}</strong>,
                  em: ({ children }) => <em style={{ color: "rgba(251,191,36,0.8)", fontStyle: "italic" }}>{children}</em>,
                  ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
                  li: ({ children }) => <li style={{ marginBottom: 5 }}>{children}</li>,
                  hr: () => <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "20px 0" }} />,
                  table: ({ children }) => <div style={{ overflowX: "auto", marginBottom: 16 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>{children}</table></div>,
                  th: ({ children }) => <th style={{ padding: "7px 10px", background: "rgba(251,191,36,0.08)", color: "rgba(255,255,255,0.7)", fontWeight: 600, textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)", fontFamily: "'Noto Sans KR', sans-serif" }}>{children}</th>,
                  td: ({ children }) => <td style={{ padding: "7px 10px", color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{children}</td>,
                }}
              >
                {treatmentResult}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
