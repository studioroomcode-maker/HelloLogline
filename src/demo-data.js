/**
 * HelloLogline 데모 모드 샘플 데이터
 * 로그라인: "기억을 잃은 형사가 자신이 10년 전 연쇄살인마임을 알게 되어,
 *           자수할 것인지 증거를 은폐할 것인지 선택해야 한다."
 */

export const DEMO_LOGLINE = "기억을 잃은 형사가 자신이 10년 전 연쇄살인마임을 알게 되어, 자수할 것인지 증거를 은폐할 것인지 선택해야 한다.";
export const DEMO_GENRE = "thriller";

export const DEMO_RESULT = {
  detected_genre: "스릴러/범죄",
  structure: {
    protagonist: { score: 9, feedback: "명확한 주인공과 강렬한 내적 갈등. 기억상실이라는 설정이 캐릭터의 취약성을 극대화한다." },
    conflict: { score: 8, feedback: "내적 도덕 갈등(자수 vs 은폐)이 외적 수사 압박과 맞물려 이중 구조를 형성한다." },
    stakes: { score: 9, feedback: "자유, 정체성, 도덕적 구원이 모두 걸린 최고 수준의 스테이크." },
    resolution_hint: { score: 7, feedback: "결말 방향이 다양하게 열려있어 독자 상상력을 자극하나, 구체적 해소 방향이 부재하다." },
  },
  expression: {
    hook: { score: 9, feedback: "첫 문장만으로 즉각적 긴장감과 도덕적 딜레마를 동시에 제시한다." },
    specificity: { score: 8, feedback: "10년이라는 구체적 시간대, 형사라는 직업이 갈등의 아이러니를 강화한다." },
    genre_clarity: { score: 9, feedback: "스릴러 장르 코드(범죄, 기억, 추적)가 명확하게 드러난다." },
  },
  technical: {
    length: { score: 8, feedback: "적절한 길이. 핵심 갈등과 설정을 한 문장으로 압축했다." },
    grammar: { score: 9, feedback: "자연스러운 한국어 문장 구조." },
    originality: { score: 8, feedback: "기억상실 + 자신이 범인이라는 반전 설정이 신선하다. 다만 기억상실 모티프는 장르 클리셰에 가깝다." },
  },
  interest: {
    commercial: { score: 9, feedback: "OTT 시장에서 즉시 통할 수 있는 고강도 스릴러. 글로벌 플랫폼 어필 가능." },
    emotional: { score: 8, feedback: "자기 혐오와 구원의 욕구가 공존하는 복합 감정선." },
    curiosity: { score: 9, feedback: "주인공이 어떤 선택을 할 것인가에 대한 강렬한 궁금증 유발." },
  },
  overall_feedback: "로그라인의 핵심 요소를 모두 갖춘 수작입니다. 특히 '형사'와 '살인마'라는 정체성의 충돌이 이 이야기의 가장 강력한 엔진입니다. 기억상실 모티프를 클리셰로 전락시키지 않으려면, 기억 회복 방식과 시간 구조에서 차별점을 만들어야 합니다.",
};

export const DEMO_CHAR_DEV_RESULT = {
  protagonist: {
    name_suggestion: "강재현",
    name: "강재현",
    role: "서울지방경찰청 강력1팀 형사 (36세)",
    want: "10년 전 자신이 저지른 범행의 증거를 완전히 은폐하고 현재의 삶을 지키는 것",
    need: "자신의 과거를 직면하고 피해자들에게 진실을 돌려주는 것",
    ghost: "10년 전 기억 속의 자신 — 어떤 인간이었는지 알 수 없다는 공포",
    lie_they_believe: "지금의 나는 그때의 나와 다른 사람이다",
    flaw: "자기합리화 — 현재의 선함으로 과거의 악을 덮을 수 있다고 믿는다",
    arc_type: "부정에서 수용으로 (Corruption Arc의 역방향 — 구원 호)",
    moral_argument: "우리는 과거의 죄로 정의될 것인가, 아니면 현재의 선택으로 정의될 것인가",
  },
  supporting_characters: [
    {
      name: "이수진",
      role: "피해자 유족 / 사건 전담 검사",
      relation: "10년 전 피해자의 딸이자 지금 강재현의 동료. 그녀가 진실에 가장 가까이 있다.",
    },
    {
      name: "박종서",
      role: "강재현의 파트너 형사",
      relation: "강재현의 유일한 신뢰자. 그가 진실을 알게 될 때 이야기의 전환점이 온다.",
    },
  ],
  moral_argument: "진실을 외면한 정의는 또 다른 폭력이다. 강재현의 선택은 단순한 자수/도주가 아니라 '정의란 무엇인가'에 대한 물음이다.",
  thematic_core: "자아 정체성과 도덕적 책임",
};

export const DEMO_SHADOW_RESULT = {
  protagonist_archetype: "그림자 자아 (Shadow Self)",
  shadow_description: "강재현의 그림자는 '억압된 폭력성'이 아니라 '기억 속에 봉인된 또 다른 자아'다. 융의 관점에서 기억상실은 자아가 감당할 수 없는 그림자를 의식에서 분리한 방어기제다.",
  anima_animus: "이수진은 강재현의 아니마(Anima) — 그가 억압한 공감능력과 정의 감수성의 외재화. 그녀와의 관계가 깊어질수록 강재현의 그림자가 표면으로 떠오른다.",
  individuation_path: "그림자 통합(Integration) — 과거의 자신을 인정하고 '나는 그것이었다'를 받아들이는 것. 완전한 자아가 되려면 도피가 아닌 직면이 필요하다.",
  shadow_score: 87,
};

export const DEMO_AUTHENTICITY_RESULT = {
  authenticity_score: 82,
  existential_analysis: "강재현은 사르트르적 의미에서 '나쁜 믿음(Bad Faith)' 상태에 있다 — 자신의 자유와 책임을 기억상실이라는 조건으로 회피한다. 진정성 획득은 과거를 자신의 것으로 인정하는 순간에만 가능하다.",
  freedom_responsibility: "기억을 잃었다는 사실이 책임을 면제하는가? 이 질문이 이 작품의 실존주의적 핵심이다.",
  authenticity_barriers: ["기억상실을 면죄부로 사용하는 자기기만", "현재의 정체성으로 과거를 지우려는 욕망"],
};

export const DEMO_SYNOPSIS_RESULTS = {
  synopses: [
    {
      direction_title: "내면의 심판",
      synopsis: "서울 강력범죄수사팀의 형사 강재현(36)은 10년 전 교통사고 후 기억 일부를 잃은 채 살아왔다. 어느 날 미해결 연쇄살인 사건을 맡게 된 그는 수사 과정에서 범인의 DNA, 습관, 행동 패턴이 자신과 일치한다는 증거를 발견한다. 그는 자신이 기억 속에 가둬놓은 '그것'과 마주해야 한다. 파트너 박종서는 그를 신뢰하고, 피해자의 딸이자 검사인 이수진은 진실에 점점 다가온다. 강재현은 증거를 은폐하며 현재의 삶을 지킬 것인가, 아니면 자수하여 모든 것을 잃을 것인가. 그의 선택이 진정한 자신을 정의할 것이다.",
      theme: "정체성과 도덕적 책임 — 우리는 과거로 정의되는가, 현재의 선택으로 정의되는가",
      key_scenes: ["DNA 일치 장면", "이수진과의 대립", "최후의 선택"],
    },
  ],
};

export const DEMO_TREATMENT_RESULT = `# 트리트먼트: 기억의 심판

## 1막 (설정)
서울 강력1팀의 베테랑 형사 강재현(36)은 냉철하고 유능하다. 10년 전 교통사고로 인해 특정 기간의 기억이 없다는 사실을 동료에게도 숨기며 살아왔다.

새로운 미해결 연쇄살인 사건이 재개됩니다. 10년 전 5명의 피해자, 당시 미검거. 강재현이 수사 팀장을 맡는다.

## 2막 (갈등)
수사 중 강재현은 범인의 DNA 샘플, 특유의 매듭 방식, 피해자 선택 패턴이 자신의 무의식적 습관과 일치함을 깨닫는다. 그는 혼자 조용히 증거를 추적하기 시작한다.

피해자의 딸이자 특별검사로 부임한 이수진이 독자적으로 수사를 진행하며 강재현과 충돌한다. 강재현은 증거 일부를 은폐하지만, 이수진은 이상한 낌새를 느낀다.

## 3막 (해소)
파트너 박종서가 진실의 절반을 알게 된다. 강재현은 최후의 선택 앞에 선다. 자수하면 이수진에게 진실이 돌아가지만 자신은 모든 것을 잃는다. 은폐하면 살아남지만 진정한 자신을 영영 잃는다.

그는 새벽, 이수진의 사무실 앞에 선다.`;

export const DEMO_BEAT_SHEET_RESULT = {
  structure_type: "Blake Snyder Beat Sheet",
  total_pages: 110,
  beats: [
    { id: "opening_image", name_kr: "오프닝 이미지", page_start: 1, summary: "새벽 범죄 현장을 조사하는 강재현. 능숙하고 냉철한 형사의 모습.", key_elements: ["차가운 도시 새벽", "형사의 고독"] },
    { id: "theme_stated", name_kr: "테마 제시", page_start: 5, summary: "선임이 강재현에게 말한다: '네가 이 사건 맡아야 해. 네가 가장 오래 살아남은 형사니까.'", key_elements: ["생존", "과거의 무게"] },
    { id: "setup", name_kr: "설정", page_start: 1, summary: "강재현의 현재 삶 — 유능한 형사, 그러나 10년 전 기억의 공백.", key_elements: ["기억상실 설정", "현재의 정체성"] },
    { id: "catalyst", name_kr: "촉발 사건", page_start: 12, summary: "10년 전 미해결 연쇄살인 사건 재수사 명령. 강재현이 팀장을 맡는다.", key_elements: ["사건 파일 수령", "첫 번째 불안"] },
    { id: "debate", name_kr: "딜레마", page_start: 12, summary: "수사를 맡아야 하는가? 강재현은 이상한 두려움을 느끼지만 이유를 모른다.", key_elements: ["직감적 불안", "전진 결정"] },
    { id: "break_into_two", name_kr: "2막 진입", page_start: 25, summary: "DNA 분석 결과가 나온다. 미세하게 자신의 샘플과 겹친다. 강재현은 혼자 검증을 시작한다.", key_elements: ["반전의 시작", "비밀 수사"] },
    { id: "b_story", name_kr: "B 스토리", page_start: 30, summary: "이수진 검사 부임. 피해자의 딸로서 이 사건을 개인적으로 쫓아왔다.", key_elements: ["이수진 등장", "잠재적 충돌"] },
    { id: "fun_and_games", name_kr: "재미와 게임", page_start: 30, summary: "강재현이 자신을 수사한다. 기억을 복원하려는 시도와 증거 은폐의 이중 행동.", key_elements: ["자기 수사", "이중성의 긴장"] },
    { id: "midpoint", name_kr: "미드포인트", page_start: 55, summary: "강재현이 10년 전 자신의 일기를 발견한다. 그 안의 내용이 자신이 알던 자신이 아니다.", key_elements: ["일기 발견", "정체성 붕괴"] },
    { id: "bad_guys_close_in", name_kr: "적의 압박", page_start: 55, summary: "이수진이 용의자 윤곽을 좁혀온다. 박종서가 강재현의 이상 행동을 눈치챈다.", key_elements: ["이중 압박", "고립 심화"] },
    { id: "all_is_lost", name_kr: "모든 것을 잃다", page_start: 75, summary: "이수진이 강재현과 범인의 연결고리를 발견한다. 강재현은 증거를 없애려 했지만 실패한다.", key_elements: ["발각 위기", "도덕적 최저점"] },
    { id: "dark_night", name_kr: "어두운 밤", page_start: 75, summary: "강재현 혼자 빈 수사실에 앉아 10년 전 피해자 사진을 바라본다.", key_elements: ["내면 대면", "선택의 기로"] },
    { id: "break_into_three", name_kr: "3막 진입", page_start: 85, summary: "강재현, 결심한다. 박종서에게 전화를 건다: '나 할 말 있어.'", key_elements: ["결정", "행동 개시"] },
    { id: "finale", name_kr: "피날레", page_start: 85, summary: "강재현이 이수진의 사무실을 찾아간다. 문 앞에서 멈추는 강재현. 그의 손이 문손잡이를 잡는다.", key_elements: ["최후의 선택", "열린 결말"] },
    { id: "final_image", name_kr: "파이널 이미지", page_start: 110, summary: "문이 열린다.", key_elements: ["상징적 결말", "관객에게 맡긴 해석"] },
  ],
};

export const DEMO_SCRIPT_COVERAGE_RESULT = {
  overall_score: 84,
  recommendation: "추천 (Recommend)",
  logline_score: 9,
  strengths: [
    "도덕적 딜레마가 극도로 선명하여 관객을 능동적으로 참여시킨다",
    "형사/범인이라는 이중 정체성이 장르 클리셰를 뒤집는 신선한 구조",
    "OTT 플랫폼 시장성 우수 — 넷플릭스 한국 오리지널 포맷에 적합",
    "캐릭터의 내면 여정이 외부 스릴러 플롯과 정확히 맞물려 있음",
  ],
  weaknesses: [
    "기억상실 소재의 장르 클리셰 위험성 — 차별화 장치 필요",
    "2막 중반 피해자 묘사가 얕아 감정적 스테이크 약화 가능성",
    "결말의 모호성이 강점이자 위험 — 상업성과 예술성 사이 균형 필요",
  ],
  category_scores: {
    premise: 9,
    character: 8,
    structure: 8,
    dialogue: 7,
    originality: 8,
  },
  coverage_summary: "강렬한 도덕적 딜레마와 반전 설정으로 한국 OTT 시장에서 즉시 경쟁력을 갖춘 작품. 기억상실이라는 소재를 클리셰로 소비하지 않고 실존주의적 물음으로 끌어올릴 수 있다면 수준급 작품이 될 것이다.",
};

export const DEMO_VALUATION_RESULT = {
  market_value_score: 8.5,
  investment_grade: "A (투자 권장)",
  estimated_budget_range: "15~25억 원 (TV 미니시리즈 기준)",
  platform_fit: ["넷플릭스 한국 오리지널", "웨이브 오리지널", "Coupang Play"],
  comparable_works: ["나쁜 녀석들", "시그널", "비밀의 숲"],
  roi_potential: "높음 — 장르적 완성도와 글로벌 어필 가능성을 고려할 때 투자 대비 수익률 기대",
  risks: ["기억상실 소재 포화", "주연 캐스팅 의존도 높음"],
};

export const DEMO_STRUCTURE_RESULT = {
  act_structure: "3막 구조 (Field/McKee 혼합)",
  turning_points: [
    { act: "1막→2막", description: "DNA 일치 발견 — 수사자에서 피수사자로의 역전" },
    { act: "2막→3막", description: "이수진의 추적 성공 — 은폐 불가능한 순간" },
  ],
  structural_strength: 85,
  pacing_notes: "1막이 다소 느릴 수 있으나 2막 미드포인트 이후 급가속. 전체 페이스 균형 양호.",
};

export const DEMO_REWRITE_DIAG_RESULT = {
  overall_assessment: "구조적으로 탄탄하나 감정적 디테일과 조연 묘사를 강화하면 한층 높은 완성도에 도달할 수 있습니다.",
  priority_fixes: [
    { priority: 1, category: "캐릭터 디테일", location: "1막 전반", issue: "피해자들의 개별성이 부족하여 강재현의 죄책감이 추상적으로 느껴진다.", fix_direction: "피해자 중 한 명의 구체적 인물 묘사를 추가해 강재현과의 간접 연결을 만든다." },
    { priority: 2, category: "페이스", location: "2막 초반 (p.25-40)", issue: "자기 수사 시퀀스가 반복적으로 느껴질 수 있다.", fix_direction: "외부 압박(이수진의 수사 진척)과 강재현의 내부 발견을 교차 편집 방식으로 재구성한다." },
    { priority: 3, category: "결말 명확성", location: "3막 피날레", issue: "열린 결말이 강점이나, 관객에 따라 미완성으로 읽힐 수 있다.", fix_direction: "강재현의 표정 또는 이수진의 반응 중 하나에 작은 구체성을 부여해 해석 방향을 제시한다." },
  ],
  strengths: ["도덕적 딜레마의 선명도", "이중 정체성 구조의 긴장감", "미드포인트 반전의 충격"],
  rewrite_strategy: "전체 개고보다 타깃 수정이 효율적입니다. 피해자 묘사 강화(1막)와 교차편집 재구성(2막 초반)에 집중하세요.",
};
