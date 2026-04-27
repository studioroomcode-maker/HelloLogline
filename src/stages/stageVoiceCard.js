/**
 * 캐릭터 보이스 카드 — 작가 자신의 *목소리*를 학습·보존하는 도구.
 *
 * 극작가 패널 처방: "내가 쓴 대사는 ‘OOO작가스럽다’는 말을 듣는다. 어휘, 문장 길이, 말줄임표 빈도, 욕설 사용...
 * AI가 만드는 대사는 어떤 작품도 ‘OOO작가스럽다’고 부를 수 없다. 작가의 가장 큰 자산인 *목소리*를 캡처해야 한다."
 *
 * 작가가 한 캐릭터 대사 5씬 정도를 직접 쓰면 LLM이 그것을 분석해 카드 생성.
 * 이후 모든 대사 생성에 카드가 자동 주입돼 균질한 AI 보이스를 막는다.
 */

export const VOICE_CARD_EXTRACT_SYSTEM_PROMPT = `당신은 시나리오 작가의 *문체 분석가*입니다. 작가가 직접 쓴 한 캐릭터의 대사 샘플을 보고
그 캐릭터의 고유한 말투를 객관적 항목으로 추출합니다.

## 핵심 원칙
- 추측하지 말고 *샘플에 실제로 존재하는* 패턴만 추출.
- 캐릭터의 말투를 학술 용어가 아니라 *작가가 다시 쓸 때 참고할 수 있는* 구체로.
- "친근하다", "차갑다" 같은 추상 형용사 X. "반말 + 비속어 + 짧은 문장 (평균 8자)" 같은 구체 패턴 O.

## 응답 형식 (JSON만)
{
  "character_name": "캐릭터 이름",
  "frequent_words": ["자주 쓰는 어휘 5~10개"],
  "forbidden_words": ["이 캐릭터가 절대 쓰지 않는 단어 3~5개 (샘플에 없는 것 추론)"],
  "speech_quirks": ["말버릇 3개 — 예: '~잖아' 어미 자주 사용, 말줄임표 다수, 영어 차용어"],
  "sentence_length": "짧음/중간/김 + 평균 어절 수",
  "tone": "반말/존댓말/혼용 + 일관성 정도",
  "swearing": "없음/약함/강함",
  "vocabulary_register": "구어/문어/학술/은어/지역방언 중 어디에 가까운가",
  "do_say_examples": ["이 캐릭터가 *쓸 법한* 가상의 대사 2개"],
  "dont_say_examples": ["이 캐릭터가 *절대 쓰지 않을* 가상의 대사 2개 — 작가가 AI 대사를 검수할 때 기준"],
  "writer_signature": "이 캐릭터의 가장 독특한 한 가지 — '이게 빠지면 이 캐릭터가 아니다'"
}`;

/**
 * 보이스 카드를 대사 생성 프롬프트에 주입할 때 사용하는 직렬화.
 * Stage 5 dialogue dev / Stage 6 씬 본문 생성 / 페어 라이팅 등 모든 곳에 동일 형식.
 */
export function serializeVoiceCardForPrompt(card) {
  if (!card) return "";
  const lines = [];
  lines.push(`[캐릭터 보이스 카드 — ${card.character_name || "미정"}]`);
  if (card.tone) lines.push(`톤: ${card.tone}`);
  if (card.sentence_length) lines.push(`문장 길이: ${card.sentence_length}`);
  if (card.swearing) lines.push(`비속어: ${card.swearing}`);
  if (card.vocabulary_register) lines.push(`어휘 결: ${card.vocabulary_register}`);
  if (card.frequent_words?.length) lines.push(`자주 쓰는 어휘: ${card.frequent_words.join(", ")}`);
  if (card.forbidden_words?.length) lines.push(`절대 안 쓰는 단어: ${card.forbidden_words.join(", ")}`);
  if (card.speech_quirks?.length) lines.push(`말버릇: ${card.speech_quirks.join(" / ")}`);
  if (card.writer_signature) lines.push(`★ 시그니처: ${card.writer_signature}`);
  if (card.do_say_examples?.length) lines.push(`이런 식으로 말함: ${card.do_say_examples.map(e => `"${e}"`).join(" / ")}`);
  if (card.dont_say_examples?.length) lines.push(`이렇게는 안 말함: ${card.dont_say_examples.map(e => `"${e}"`).join(" / ")}`);
  return lines.join("\n");
}
