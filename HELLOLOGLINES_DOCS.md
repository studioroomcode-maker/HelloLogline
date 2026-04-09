# HelloLoglines — 기능 구조 전체 문서

> 시나리오 로그라인 AI 개발 워크스테이션
> React 18 SPA + Express 프록시 + Claude API

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 & 배포](#2-기술-스택--배포)
3. [6 Stage 워크플로우 전체 구조](#3-6-stage-워크플로우-전체-구조)
4. [스코어링 시스템](#4-스코어링-시스템)
5. [Claude API 호출 구조](#5-claude-api-호출-구조)
6. [PDF 기획서 생성](#6-pdf-기획서-생성)
7. [프로젝트 자동 저장](#7-프로젝트-자동-저장)
8. [서버 & 배포 구조](#8-서버--배포-구조)
9. [컴포넌트 목록 (panels.jsx)](#9-컴포넌트-목록-panelsjsx)
10. [상수 & 프롬프트 목록 (constants.js)](#10-상수--프롬프트-목록-constantsjs)
11. [포맷별 로그라인 글자 수 기준](#11-포맷별-로그라인-글자-수-기준)
12. [상태 관리 변수 전체 목록](#12-상태-관리-변수-전체-목록)

---

## 1. 프로젝트 개요

HelloLoglines은 시나리오 로그라인을 입력하면 학술 이론 기반으로 분석하고, 단계별 시나리오 개발 도구(시놉시스 → 트리트먼트 → 비트시트 → 커버리지)를 제공하는 AI 워크스테이션이다.

### 파일 구조

```
HelloLoglines/
├── src/
│   ├── logline-analyzer.jsx   # 메인 컴포넌트 — 6 Stage UI 및 모든 상태 관리 (~2,200줄)
│   ├── panels.jsx             # 40+ 분석 패널 컴포넌트 export (~4,500줄)
│   ├── constants.js           # 모든 Claude 시스템 프롬프트 + 설정 상수 (~1,950줄)
│   ├── utils.js               # Claude API 호출 함수, 점수 계산 유틸 (~200줄)
│   ├── db.js                  # IndexedDB 프로젝트 저장/로드 (~70줄)
│   ├── ErrorBoundary.jsx      # React 에러 바운더리
│   └── main.jsx               # React 진입점
├── api/
│   └── claude.js              # Vercel 서버리스 함수 (프로덕션용 프록시)
├── scripts/
│   └── kill-port.mjs          # predev: 포트 3001 선점 프로세스 자동 종료
├── public/
│   └── company-logo.png
├── server.js                  # Express 프록시 서버 (로컬 개발용)
├── vite.config.js             # Vite 개발 서버 설정 (proxy: /api → 3001)
├── vercel.json                # Vercel 빌드 & 라우팅 설정
├── package.json               # 스크립트 & 의존성
└── .env                       # ANTHROPIC_API_KEY (gitignore됨)
```

---

## 2. 기술 스택 & 배포

### 의존성

| 패키지 | 버전 | 역할 |
|--------|------|------|
| react | 18.3.1 | UI 프레임워크 |
| react-dom | 18.3.1 | DOM 렌더링 |
| react-markdown | 10.1.0 | Markdown 렌더링 (트리트먼트/씬리스트) |
| express | 4.21.2 | 로컬 API 프록시 서버 |
| cors | 2.8.5 | CORS 헤더 처리 |
| vite | 5.4.8 | 빌드 도구 |
| @vitejs/plugin-react | 4.3.1 | Vite React 플러그인 |
| concurrently | 9.1.2 | server.js + vite 동시 실행 |

### npm 스크립트

```json
{
  "predev":  "node scripts/kill-port.mjs 3001",
  "dev":     "concurrently \"node server.js\" \"vite\"",
  "server":  "node server.js",
  "client":  "vite",
  "build":   "vite build",
  "preview": "vite preview"
}
```

### 배포

| 환경 | 방식 | URL |
|------|------|-----|
| 로컬 개발 | `npm run dev` (Vite + Express) | http://localhost:5173 |
| 프로덕션 | Vercel (GitHub 자동 배포) | https://vercel.com/sungkyuns-projects-a94dfe97/hellogrant |

**Vercel 설정 (vercel.json):**
```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

**환경변수 (Vercel Dashboard에서 설정):**
- `ANTHROPIC_API_KEY` — 없으면 사용자가 브라우저에서 직접 입력

---

## 3. 6 Stage 워크플로우 전체 구조

각 Stage는 왼쪽 사이드바에서 선택하며, 이전 Stage의 분석 결과가 자동으로 다음 Stage에 반영된다.

---

### Stage 1 — 로그라인

**설명:** 로그라인 입력 및 기본 분석, 개선

**입력:**
- 로그라인 텍스트 (자유 입력)
- 영상 포맷 선택 (8종)
- 장르 선택 (9종 + 자동 감지)
- 비교 모드 (A/B 로그라인 동시 분석)
- 예시 로그라인 빠른 로드 버튼

**분석 함수:** `analyze(overrideLogline?)`
- **프롬프트:** `SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6
- **max_tokens:** 4,000
- **응답 형식:** JSON (구조/표현/기술/흥미 섹션별 점수)

**결과 탭:**
| 탭 | 내용 |
|----|------|
| 개요 | 원형 게이지 2개 + 레이더차트 + 개선 질문 |
| 구조 | 구조적 완성도 ScoreBar 5개 |
| 표현 | 표현적 매력도 ScoreBar 4개 |
| 기술 | 기술적 완성도 ScoreBar 4개 |
| 흥미 | 흥미 유발 지수 ScoreBar 5개 |
| 피드백 | overall_feedback 원문 |
| 학술 | AcademicPanel (Stage 2 학술 분석 결과) |
| 추이 | ScoreHistoryChart (이전 분석 점수 변화) |

**이야기 발전 패널 (StoryDevPanel):**
- 🔧 **약점 집중 수정** — 점수 낮은 항목 2~3개를 특정, 각각 직접 개선한 로그라인 제안
  - 프롬프트: `WEAKNESS_FIX_SYSTEM_PROMPT`
  - 각 카드에 "↻ 이걸로 분석" 버튼
- 🔀 **방향 전환** — 같은 전제로 완전히 다른 각도 3가지 탐색
  - 프롬프트: `STORY_PIVOT_SYSTEM_PROMPT`
  - 각 카드에 "↻ 이걸로 분석" 버튼

**AI 개선안 (ImprovementPanel):**
- 취약 항목 기반 개선된 로그라인 생성
- 프롬프트: `IMPROVEMENT_SYSTEM_PROMPT`
- "↻ 개선안으로 다시 분석" 버튼

**PDF 생성:** "기초 기획서 PDF" (`docType: "logline"`)

---

### Stage 2 — 개념 분석

**설명:** 학술 이론 + 신화 + 전문가 패널 + 서사 코드 분석

#### 2-1. 학술 분석
- **함수:** `analyzeAcademic()`
- **프롬프트:** `ACADEMIC_ANALYSIS_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / max_tokens: 6,000
- **이론 12개:** 아리스토텔레스 시학, 프롭 민담형태론, 캠벨 영웅여정, 토도로프 서사론, 롤랑 바르트 S/Z, 프라이탁 피라미드, 질만 흥분전이이론, 머레이스미스 관객참여, 한국 서사미학, 헤겔 변증법, 베르토프 키노글라즈, 브레히트 소격효과
- **패널:** `AcademicPanel`

#### 2-2. 신화 매핑
- **함수:** `analyzeMythMap()`
- **프롬프트:** `MYTH_MAP_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **이론:** 캠벨 영웅여정, 프롭 민담, 프레이저 황금가지
- **패널:** `MythMapPanel`

#### 2-3. 한국 신화
- **함수:** `analyzeKoreanMyth()`
- **프롬프트:** `KOREAN_MYTH_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **이론:** 한(恨), 정(情), 신명(神明), 무속, 유교 미학
- **패널:** `KoreanMythPanel`

#### 2-4. 전문가 패널
- **함수:** `runExpertPanel()`
- **프롬프트:** `EXPERT_PANEL_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / max_tokens: 8,000
- **전문가 7명:** 할리우드 제작자, 한국 방송 PD, 독립영화 감독, 문학 평론가, 시청자 대표, 마케터, 국제 바이어
- **패널:** `ExpertPanelSection`

#### 2-5. 바르트 서사 코드
- **함수:** `analyzeBarthesCode()`
- **프롬프트:** `BARTHES_CODE_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **5개 코드:** HER(수수께끼), ACT(행동), SEM(함축), SYM(이항대립), REF(문화)
- **패널:** `BarthesCodePanel`

#### 2-6. 테마 & 감정선
- **함수:** `analyzeTheme()`
- **프롬프트:** `THEME_ANALYSIS_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / max_tokens: 6,000
- **이론:** Egri 도덕적 전제, McKee 컨트롤링 아이디어, Truby 도덕 논증
- **응답:** `controlling_idea`, `moral_premise`, `thematic_question`, `protagonist_inner_journey`, `emotional_arc`, `thematic_layers[]`
- **패널:** `ThemeAnalysisPanel`

---

### Stage 3 — 캐릭터

**설명:** 심리 원형 + 실존 분석 + 다차원 캐릭터 개발

#### 3-1. 그림자 분석
- **함수:** `analyzeShadow()`
- **프롬프트:** `SHADOW_ANALYSIS_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **이론:** Carl Jung — Shadow, Anima/Animus, Persona, 개성화(Individuation)
- **패널:** `ShadowAnalysisPanel`

#### 3-2. 진정성 지수
- **함수:** `analyzeAuthenticity()`
- **프롬프트:** `AUTHENTICITY_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **이론:** Sartre(자기기만/나쁜 믿음), Heidegger(현존재/죽음을향한존재), Camus(부조리), Kierkegaard(3단계)
- **레벨:** 심각한 자기기만 → 부분적 자기기만 → 불완전한 진정성 → 진정성있는 실존 → 실존적 각성
- **패널:** `AuthenticityPanel`

#### 3-3. 캐릭터 디벨롭
- **함수:** `analyzeCharacterDev()`
- **프롬프트:** `CHARACTER_DEV_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **이론 6개:** Egri(3차원), Hauge(Want vs Need, Identity vs Essence), Truby(Ghost/Self-revelation), Vogler(8원형), Jung(무의식), Maslow(욕구위계), Stanislavski(슈퍼오브젝티브), McKee(압박테스트)
- **응답 구조:**
  ```json
  {
    "protagonist": {
      "name_suggestion", "egri_dimensions", "ghost", "want", "need",
      "wound", "fear", "lie_they_believe", "truth_to_learn",
      "identity_vs_essence", "super_objective", "maslow_level",
      "erikson_stage", "jungian_shadow", "true_character_test",
      "arc_type", "arc_journey", "voice_hint"
    },
    "supporting_characters": [...],
    "relationship_web": [...],
    "moral_argument",
    "missing_archetype",
    "character_development_tips": [...]
  }
  ```
- **패널:** `CharacterDevPanel`

---

### Stage 4 — 시놉시스

**설명:** 구조 설계 + 시놉시스 다방향 생성

#### 4-1. 구조 분석
- **함수:** `analyzeStructure()`
- **프롬프트:** `STRUCTURE_ANALYSIS_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / max_tokens: 6,000
- **이론:** Field 3막, Snyder 15비트, McKee 가치전하, Hauge 5전환점, Truby 22단계
- **응답:** `acts[]`, `plot_points{}`, `emotional_arc[]`, `structural_strengths[]`, `structural_gaps[]`
- **패널:** `StructureAnalysisPanel` (SVG 감정선 그래프, 플롯포인트 아코디언)

#### 4-2. 가치 전하
- **함수:** `analyzeValueCharge()`
- **프롬프트:** `VALUE_CHARGE_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **이론:** Robert McKee — 시작가치 → 클라이맥스 전하 (love/hate, life/death, freedom/slavery 등)
- **패널:** `ValueChargePanel`

#### 4-3. 하위텍스트
- **함수:** `analyzeSubtext()`
- **프롬프트:** `SUBTEXT_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **이론:** Chekhov, Stanislavski, Brecht, Pinter, Mamet
- **패널:** `SubtextPanel`

#### 4-4. 시놉시스 생성
- **함수:** `generateSynopsis()`
- **프롬프트:** `SYNOPSIS_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / max_tokens: 8,000
- **서사 프레임워크 선택:**
  - 3막 구조 (Syd Field)
  - 영웅의 여정 (Joseph Campbell)
  - 보드/콜 (Save the Cat 변형)
  - 세 행동 기둥
  - 7점 구조
- **이전 분석 자동 통합:** 학술/신화/캐릭터/가치전하/하위텍스트 결과를 컨텍스트로 전달
- **응답:** 방향별 시놉시스 2~5개
  ```json
  {
    "synopses": [{
      "direction_title", "genre_tone", "hook",
      "synopsis", "key_scenes[]", "theme", "ending_type"
    }]
  }
  ```
- **파이프라인 모드:** 인터랙티브 질문 응답 방식 (`PipelinePanel`)

**PDF 생성:** "기획서 PDF" (`docType: "synopsis"`)

---

### Stage 5 — 트리트먼트 비트

**설명:** 트리트먼트 + 씬 리스트 + 비트시트 + 대사 개발

#### 5-1. 트리트먼트
- **함수:** `generateTreatment()`
- **프롬프트:** `TREATMENT_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / **max_tokens: 32,000** (최대치)
- **입력 폼 (TreatmentInputPanel):**
  - 주인공 이름, 역할, 핵심 특성, 내적 갈등
  - 조력/적대 인물 최대 3명
  - 구조 선택 (3막 / 영웅의여정 / 4막 / 미니시리즈)
- **응답:** Markdown 형식 완성 트리트먼트
- **기능:** MD 파일 다운로드, ReactMarkdown 렌더링

**PDF 생성:** "상세 기획서 PDF" (`docType: "treatment"`)

#### 5-2. 씬 리스트 (스텝 아웃라인)
- **함수:** `generateSceneList()`
- **프롬프트:** `SCENE_LIST_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / max_tokens: 12,000
- **포맷별 씬 수:**
  - 초단편: 3~5씬 / 숏폼: 5~8씬 / 단편: 10~15씬
  - 웹드라마: 8~12씬 / TV드라마: 15~25씬
  - 장편: 25~40씬 / 미니시리즈: 에피소드당 15~20씬
- **이전 분석 통합:** 시놉시스/트리트먼트/구조분석/캐릭터 컨텍스트 포함
- **씬 정보:** INT/EXT, 시간대, 등장인물, 목표, 갈등, 결과, 서사 기능
- **패널:** `SceneListPanel` (ReactMarkdown, 복사/MD 다운로드)

#### 5-3. 비트 시트
- **함수:** `generateBeatSheet()`
- **프롬프트:** `BEAT_SHEET_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / max_tokens: 8,000
- **이론:** Blake Snyder Save the Cat — 15비트 시스템
  1. Opening Image, 2. Theme Stated, 3. Set-up, 4. Catalyst, 5. Debate, 6. Break into Two, 7. B Story, 8. Fun and Games, 9. Midpoint, 10. Bad Guys Close In, 11. All is Lost, 12. Dark Night of the Soul, 13. Break into Three, 14. Finale, 15. Final Image
- **각 비트 응답:** `id`, `name_kr`, `name_en`, `act`, `page_range`, `location`, `characters[]`, `function`, `summary`, `tone`, `key_element`
- **패널:** `BeatSheetPanel`
- **씬 생성 기능:** 각 비트별 `generateScene(beatId)` — Claude로 실제 씬 스크립트 생성
  - 프롬프트: `SCENE_GEN_SYSTEM_PROMPT`
  - 모델: claude-sonnet-4-6 / max_tokens: 4,000
  - 결과: 씬별 저장(beatScenes 딕셔너리), 펼침/접힘 토글

#### 5-4. 대사 디벨롭
- **함수:** `analyzeDialogueDev()`
- **프롬프트:** `DIALOGUE_DEV_SYSTEM_PROMPT`
- **모델:** claude-haiku-4-5-20251001 / max_tokens: 8,000
- **이론:** Mamet(사실적 대화), Pinter(침묵/공백), Stanislavski(하위텍스트 목소리)
- **패널:** `DialogueDevPanel`

---

### Stage 6 — Script Coverage

**설명:** 최종 Script Coverage 판정

- **함수:** `analyzeScriptCoverage()`
- **프롬프트:** `SCRIPT_COVERAGE_SYSTEM_PROMPT`
- **모델:** claude-sonnet-4-6 / max_tokens: 6,000
- **형식:** 할리우드 스튜디오 + 한국 방송사 Coverage 혼합
- **판정:** RECOMMEND / CONSIDER / PASS
- **항목:** 전제, 구조, 캐릭터, 대화, 시장성, 독창성, 위험요소, 최종의견
- **패널:** `ScriptCoveragePanel`

**PDF 생성:** "투자·지원 제안서 PDF" (`docType: "final"`)

---

## 4. 스코어링 시스템

### A. 구조적 완성도 (만점 50)

| 항목 | 만점 | 이론 근거 |
|------|------|----------|
| protagonist (주인공) | 12 | 형용사+유형, 결핍/특성이 드러나는가 |
| inciting_incident (촉발사건) | 10 | 일상을 깨뜨리는 구체적 사건 존재 |
| goal (목표) | 10 | 원초적이고 구체적인 목표 명시 |
| conflict (갈등) | 10 | 목표를 방해하는 힘이 드러나는가 |
| stakes (이해관계) | 8 | 실패 시 잃는 것이 암시되는가 |

### B. 표현적 매력도 (만점 30)

| 항목 | 만점 | 이론 근거 |
|------|------|----------|
| irony (아이러니) | 10 | Blake Snyder: "로그라인의 생명" — 역설·모순 |
| mental_picture (심상) | 8 | 영화 전체가 머릿속에 떠오르는가 |
| emotional_hook (감정적 공명) | 7 | 읽었을 때 즉시 감정 반응 유발 |
| originality (독창성) | 5 | 신선한 조합, 기존 작품 차별점 |

### C. 기술적 완성도 (만점 20)

| 항목 | 만점 | 이론 근거 |
|------|------|----------|
| conciseness (간결성) | 8 | 포맷별 적정 글자 수 범위 준수 |
| active_language (능동적 언어) | 5 | 시각적·구체적 언어 비율 |
| no_violations (금기 위반) | 4 | 고유명사 남용·질문형·결말 노출 없음 |
| genre_tone (장르 톤) | 3 | 장르 분위기 암시의 적합성 |

### D. 흥미 유발 지수 (만점 100 — 독립 축)

| 항목 | 만점 | 이론 근거 |
|------|------|----------|
| information_gap (정보격차) | 25 | Loewenstein(1994) 정보격차이론 |
| cognitive_dissonance (인지부조화) | 25 | 모순·대비·역설이 뇌를 자극 |
| narrative_transportation (서사몰입) | 20 | Green & Brock(2000) 서사이동이론 |
| universal_relatability (보편적 공감) | 15 | 원초적 인간 경험에 닿는가 |
| unpredictability (예측불가성) | 15 | 클리셰 탈피, 결말 예측 불가 |

### 등급 기준

```
품질 점수 (100점) = 구조(50) + 표현(30) + 기술(20)

S — ≥90점 (프로 수준, 금색 #FFD700)
A — ≥80점 (우수, 초록색 #4ECCA3)
B — ≥70점 (양호, 파랑색 #45B7D1)
C — ≥60점 (보통, 주황색 #F7A072)
D — ≥50점 (미흡, 빨강색 #E85D75)
F — <50점  (재작성 필요, 진홍색 #C62828)

흥미도 레벨 (100점)
매우 흥미로움 — ≥85 (🔥 금색)
흥미로움      — ≥70 (✨ 초록색)
보통          — ≥55 (💡 주황색)
다소 부족     — ≥40 (😐 빨강색)
흥미 유발 약함 — <40 (💤 진홍색)
```

---

## 5. Claude API 호출 구조

### API 호출 흐름

```
브라우저 (Vite :5173)
  └─ fetch("/api/claude")
       └─ Vite proxy → localhost:3001  [로컬]
       └─ Vercel serverless api/claude.js  [프로덕션]
            └─ fetch("https://api.anthropic.com/v1/messages")
```

### 두 가지 호출 함수 (utils.js)

#### `callClaude()` — JSON 응답

```javascript
callClaude(apiKey, systemPrompt, userMessage, maxTokens, model, signal)
// 반환: 파싱된 JSON 객체
```

**내부 JSON 복구 로직 (4단계):**
1. 마크다운 코드블록 제거, `{...}` 범위 추출
2. 문자열 내 제어문자 이스케이프 (개행→`\n`, 탭→`\t`)
3. 배열 요소 간 누락 쉼표 자동 보완 (regex)
4. 파싱 실패 시 마지막 유효한 `}` 위치까지 잘라 재시도

**사용 Stage:** 1, 2, 3, 4, 5(비트시트), 6

#### `callClaudeText()` — 텍스트 응답

```javascript
callClaudeText(apiKey, systemPrompt, userMessage, maxTokens, model, signal)
// 반환: 원문 텍스트 문자열 (Markdown)
```

**사용 Stage:** 5 (트리트먼트, 씬 리스트, 씬 생성)

### 모델별 사용 전략

| 작업 | 모델 | max_tokens |
|------|------|-----------|
| 기본 분석, 시놉시스, 학술분석 | claude-sonnet-4-6 | 4,000~8,000 |
| 구조분석, 테마, Script Coverage | claude-sonnet-4-6 | 6,000 |
| 비트시트, 씬 생성 | claude-sonnet-4-6 | 4,000~8,000 |
| **트리트먼트** | claude-sonnet-4-6 | **32,000** |
| 씬 리스트 | claude-sonnet-4-6 | 12,000 |
| 가치전하, 진정성, 그림자, 하위텍스트 | claude-haiku-4-5-20251001 | 8,000 |
| 캐릭터 디벨롭, 신화, 바르트, 대사 | claude-haiku-4-5-20251001 | 8,000 |

### AbortController 패턴

```javascript
// makeController(key) / clearController(key)
const ctrl = makeController("analyze");
try {
  const data = await callClaude(..., ctrl.signal);
} catch (err) {
  if (err.name !== "AbortError") setError(err.message);
} finally {
  clearController("analyze");
}
```

각 분석 함수마다 고유 키로 AbortController를 관리해 특정 작업만 취소 가능하다.

---

## 6. PDF 기획서 생성

### `openApplicationDoc(docType)` 함수

브라우저 `window.print()` + A4 CSS를 활용, 외부 라이브러리 없이 PDF 생성.

| docType | 문서명 | 배지 | 포함 내용 |
|---------|--------|------|----------|
| `"logline"` | 기초 기획서 | STEP 1 | 프로젝트 개요, 로그라인, 분석 점수, 장르/포맷 |
| `"synopsis"` | 기획서 | STEP 2 | +시놉시스, 핵심 장면, 캐릭터 개요 |
| `"treatment"` | 상세 기획서 | STEP 3 | +캐릭터 상세, 구조 분석, 트리트먼트, 비트 요약 |
| `"final"` | 투자·지원 제안서 | FINAL | +Script Coverage, 최종 판정, 투자 포인트 |

**스타일:** Malgun Gothic / 나눔명조, A4 페이지, 섹션별 컬러 배지, 자동 인쇄 실행

### PDF 버튼 위치

| 버튼 | Stage | 위치 |
|------|-------|------|
| 기초 기획서 PDF | Stage 1 | 로그라인 분석 결과 하단 |
| 기획서 PDF | Stage 4 | 시놉시스 생성 결과 하단 |
| 상세 기획서 PDF | Stage 5 | 트리트먼트 결과 하단 |
| 투자·지원 제안서 PDF | Stage 6 | Script Coverage 결과 하단 |

---

## 7. 프로젝트 자동 저장

### IndexedDB (db.js)

```
DB: hellologlines_v1
Store: projects (keyPath: id)
Index: updatedAt (최신순)
```

### 저장 시점

각 분석 함수 완료 후 `autoSave()` 자동 호출 → 최대 50개 프로젝트 보관

### 저장 데이터

```javascript
{
  id,           // UUID
  title,        // 로그라인 앞 60자
  logline, genre, selectedDuration,
  result, result2,                          // Stage 1
  academicResult, mythMapResult,             // Stage 2
  koreanMythResult, expertPanelResult,
  barthesCodeResult, themeResult,
  shadowResult, authenticityResult,          // Stage 3
  charDevResult,
  valueChargeResult, subtextResult,          // Stage 4
  synopsisResults, pipelineResult,
  treatmentResult, beatSheetResult,          // Stage 5
  beatScenes, dialogueDevResult,
  sceneListResult,
  structureResult,
  scriptCoverageResult,                      // Stage 6
  updatedAt                                  // ISO timestamp
}
```

### 로드/삭제

- 사이드바 "프로젝트" 버튼 → `HistoryPanel` (기록 목록)
- 항목 클릭 → 전체 상태 복구 (Stage 위치는 Stage 1로 리셋)
- 항목별 삭제, 전체 삭제

---

## 8. 서버 & 배포 구조

### 로컬 개발 (server.js)

```
포트: 3001 (점유 시 3002, 3003... 자동 증가)
CORS: localhost:5173, 5174, 5175, 4173, 127.0.0.1:5173, 5174

GET  /health      → {"status":"ok"}
POST /api/claude  → Anthropic API 중계
```

**API 키 우선순위:** `.env`의 `ANTHROPIC_API_KEY` > 클라이언트 `x-client-api-key` 헤더

**클라이언트 연결 끊김 처리:**
```javascript
req.socket.on("close", () => {
  if (!res.headersSent) controller.abort();
});
```
(req.on("close")는 바디 파싱 직후 발화하므로 socket 이벤트 사용)

### 포트 충돌 자동 해결 (scripts/kill-port.mjs)

`npm run dev` 실행 전 `predev`로 자동 실행:
1. 포트 3001 가용 여부 확인
2. 점유 중이면 PowerShell `Get-NetTCPConnection` + `Stop-Process -Force`로 종료
3. 최대 3초 대기 후 해제 확인

### 프로덕션 (api/claude.js — Vercel 서버리스)

```javascript
export default async function handler(req, res) {
  // POST만 허용
  // ANTHROPIC_API_KEY (Vercel 환경변수) 또는 x-client-api-key 헤더 사용
  // Anthropic API 중계 후 응답 그대로 반환
}
```

---

## 9. 컴포넌트 목록 (panels.jsx)

| 컴포넌트 | Stage | 역할 |
|---------|-------|------|
| `ApiKeyModal` | 전체 | API 키 입력/저장 모달 |
| `GuideTooltip` | 1 | 채점 항목별 기준 설명 툴팁 |
| `RadarChart` | 1 | 7축 레이더 차트 (구조/표현/기술/흥미 시각화) |
| `ScoreBar` | 1 | 항목별 점수 바 + 피드백 텍스트 |
| `CircleGauge` | 1 | 원형 게이지 (품질 점수 / 흥미도) |
| `ScoreHistoryChart` | 1 | 분석 히스토리 점수 추이 그래프 |
| `HistoryPanel` | 전체 | 저장된 분석 기록 목록/삭제/로드 |
| `StoryDevPanel` | 1 | 약점 집중 수정 + 방향 전환 (이야기 발전) |
| `ImprovementPanel` | 1 | AI 개선안 생성 + 재분석 버튼 |
| `ExportButton` | 1 | 분석 결과 텍스트 다운로드 |
| `AcademicPanel` | 2 | 12개 학술 이론 분석 전체 렌더링 |
| `ExpertPanelSection` | 2 | 7명 전문가 패널 토론 결과 |
| `BarthesCodePanel` | 2 | 바르트 S/Z 5개 서사코드 분석 |
| `MythMapPanel` | 2 | 신화 매핑 (Campbell/Propp/Frazer) |
| `KoreanMythPanel` | 2 | 한국 신화/미학 분석 |
| `ThemeAnalysisPanel` | 2 | 테마·도덕전제·감정선·내적여정 |
| `ShadowAnalysisPanel` | 3 | Jung 그림자 캐릭터 분석 |
| `AuthenticityPanel` | 3 | Sartre 진정성 지수 분석 |
| `CharacterDevPanel` | 3 | 주인공+조력인물 다차원 심리 프로필 |
| `StructureAnalysisPanel` | 4 | 3막 구조·플롯포인트·감정아크 (SVG 시각화) |
| `ValueChargePanel` | 4 | McKee 가치전하 감정아크 |
| `SubtextPanel` | 4 | 하위텍스트 분석 (표면 vs 심층) |
| `SynopsisCard` | 4 | 단일 시놉시스 카드 (방향별) |
| `PipelinePanel` | 4 | 인터랙티브 질문식 시놉시스 파이프라인 |
| `TreatmentInputPanel` | 5 | 캐릭터 입력 폼 + 구조 선택 |
| `SceneListPanel` | 5 | 씬 리스트 Markdown 렌더링 + 내보내기 |
| `BeatSheetPanel` | 5 | 15비트 카드 + 씬 생성 버튼 |
| `DialogueDevPanel` | 5 | 대사 고유 목소리 설계 |
| `ScriptCoveragePanel` | 6 | Script Coverage 판정 전체 렌더링 |

---

## 10. 상수 & 프롬프트 목록 (constants.js)

### 시스템 프롬프트 (25개)

| 상수명 | Stage | 모델 |
|--------|-------|------|
| `SYSTEM_PROMPT` | 1 기본 분석 | sonnet |
| `IMPROVEMENT_SYSTEM_PROMPT` | 1 개선안 | sonnet |
| `WEAKNESS_FIX_SYSTEM_PROMPT` | 1 약점수정 | sonnet |
| `STORY_PIVOT_SYSTEM_PROMPT` | 1 방향전환 | sonnet |
| `ACADEMIC_ANALYSIS_SYSTEM_PROMPT` | 2 학술 | sonnet |
| `MYTH_MAP_SYSTEM_PROMPT` | 2 신화매핑 | haiku |
| `KOREAN_MYTH_SYSTEM_PROMPT` | 2 한국신화 | haiku |
| `EXPERT_PANEL_SYSTEM_PROMPT` | 2 전문가 | sonnet |
| `BARTHES_CODE_SYSTEM_PROMPT` | 2 바르트 | haiku |
| `THEME_ANALYSIS_SYSTEM_PROMPT` | 2 테마 | sonnet |
| `SHADOW_ANALYSIS_SYSTEM_PROMPT` | 3 그림자 | haiku |
| `AUTHENTICITY_SYSTEM_PROMPT` | 3 진정성 | haiku |
| `CHARACTER_DEV_SYSTEM_PROMPT` | 3 캐릭터 | haiku |
| `STRUCTURE_ANALYSIS_SYSTEM_PROMPT` | 4 구조 | sonnet |
| `VALUE_CHARGE_SYSTEM_PROMPT` | 4 가치전하 | haiku |
| `SUBTEXT_SYSTEM_PROMPT` | 4 하위텍스트 | haiku |
| `SYNOPSIS_SYSTEM_PROMPT` | 4 시놉시스 | sonnet |
| `PIPELINE_SYNOPSIS_SYSTEM_PROMPT` | 4 파이프라인 | sonnet |
| `PIPELINE_REFINE_SYSTEM_PROMPT` | 4 파이프라인수정 | sonnet |
| `TREATMENT_SYSTEM_PROMPT` | 5 트리트먼트 | sonnet |
| `SCENE_LIST_SYSTEM_PROMPT` | 5 씬리스트 | sonnet |
| `BEAT_SHEET_SYSTEM_PROMPT` | 5 비트시트 | sonnet |
| `SCENE_GEN_SYSTEM_PROMPT` | 5 씬생성 | sonnet |
| `DIALOGUE_DEV_SYSTEM_PROMPT` | 5 대사 | haiku |
| `SCRIPT_COVERAGE_SYSTEM_PROMPT` | 6 커버리지 | sonnet |

### 설정 상수

| 상수명 | 내용 |
|--------|------|
| `DURATION_OPTIONS` | 8개 영상 포맷 (id, label, duration, 글자수 범위, 페이지 수) |
| `NARRATIVE_FRAMEWORKS` | 7개 서사 프레임워크 |
| `GENRES` | 9개 장르 (자동 감지 포함) |
| `EXAMPLE_LOGLINES` | 3개 예시 로그라인 |
| `LABELS_KR` | 18개 채점 항목 한국어 레이블 |
| `CRITERIA_GUIDE` | 항목별 채점 기준 상세 설명 |
| `PANEL_EXPERTS` | 7명 전문가 정의 객체 |
| `PIPELINE_ALL_QUESTIONS` | 인터랙티브 파이프라인 전체 질문 풀 |
| `PIPELINE_QUESTIONS_BY_DURATION` | 포맷별 맞춤 질문 |

---

## 11. 포맷별 로그라인 글자 수 기준

| 포맷 | 시간 | 최소 | 최대 | 씬 수 |
|------|------|------|------|-------|
| 초단편 | 5분 이하 | 20자 | 40자 | 3~5 |
| 숏폼 | 5~15분 | 30자 | 50자 | 5~8 |
| 단편영화 | 20~40분 | 40자 | 70자 | 10~15 |
| 웹드라마 파일럿 | 15~30분/화 | 50자 | 80자 | 8~12 |
| TV 드라마 1화 | 60분/화 | 60자 | 90자 | 15~25 |
| 장편영화 | 90~120분 | 70자 | 110자 | 25~40 |
| 미니시리즈 전체 | 4~6화 × 45분 | 90자 | 140자 | 15~20 / 화 |
| 숏폼 시리즈 | 10~20화 × 5~15분 | 60자 | 100자 | 5~8 / 화 |

---

## 12. 상태 관리 변수 전체 목록

### logline-analyzer.jsx 주요 State

| 범주 | 변수 | 기본값 |
|------|------|-------|
| **API** | `apiKey` | localStorage |
| **입력** | `logline`, `genre`, `selectedDuration` | `""`, `"auto"`, `"feature"` |
| **비교** | `compareMode`, `logline2`, `result2`, `loading2` | `false` |
| **Stage 1 결과** | `result`, `loading`, `error`, `activeTab` | `null` |
| **히스토리** | `history`, `showHistory` | `[]`, `false` |
| **Stage 2** | `academicResult`, `mythMapResult`, `koreanMythResult`, `expertPanelResult`, `barthesCodeResult`, `themeResult` | `null` |
| **Stage 3** | `shadowResult`, `authenticityResult`, `charDevResult` | `null` |
| **Stage 4** | `structureResult`, `valueChargeResult`, `subtextResult`, `synopsisResults`, `pipelineResult` | `null` |
| **Stage 5** | `treatmentResult`, `beatSheetResult`, `beatScenes`, `dialogueDevResult`, `sceneListResult` | `""` / `null` / `{}` |
| **Stage 6** | `scriptCoverageResult` | `null` |
| **UI** | `currentStage`, `isMobile`, `showProjects`, `savedProjects`, `currentProjectId` | `"1"` |
| **취소** | `abortControllersRef` | `{}` |

---

*최종 업데이트: 2026-04-09*
*Claude Sonnet 4.6 기반 자동 생성*
