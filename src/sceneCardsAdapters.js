/**
 * Scene Card 데이터 모델 + 변환 어댑터.
 *
 * sceneCard:
 *   {
 *     id, beatId,             // 출처 비트(있으면)
 *     order,                  // 정렬용
 *     title,                  // 씬 제목
 *     location,               // 슬러그라인 (예: "INT. 병원 복도 - 밤")
 *     characters,             // 등장인물 이름 배열
 *     purpose,                // 씬의 기능 (정보/갈등/반전/감정 전환)
 *     conflict,               // 씬 안의 핵심 갈등
 *     valueShift,             // 가치 변화 (예: "희망 → 절망")
 *     reveal,                 // 다음 씬으로 넘기는 폭로/질문
 *     subtext,                // 하위텍스트 한 줄
 *     status: "outline" | "drafted" | "revised",
 *     fountainText,           // Fountain 본문 (씬 단위)
 *     createdAt, updatedAt,
 *   }
 */

const FUNCTION_GUESS = (beat) => {
  const name = (beat?.name_kr || beat?.name || "").toLowerCase();
  if (/오프닝|opening|set.?up/.test(name)) return "정보";
  if (/촉발|catalyst|inciting/.test(name)) return "갈등";
  if (/midpoint|미드포인트/.test(name)) return "반전";
  if (/all.?is.?lost|모든.?것을.?잃/.test(name)) return "감정 전환";
  if (/finale|클라이맥스|피날레/.test(name)) return "갈등";
  return "정보";
};

const VALUE_SHIFT_GUESS = (beat) => {
  const name = (beat?.name_kr || beat?.name || "").toLowerCase();
  if (/오프닝/.test(name)) return "—";
  if (/촉발|catalyst/.test(name)) return "안정 → 불안";
  if (/midpoint/.test(name)) return "확신 → 의심";
  if (/all.?is.?lost|잃/.test(name)) return "희망 → 절망";
  if (/finale|피날레/.test(name)) return "절망 → 결단";
  return "변화 미정";
};

/**
 * beatSheetResult를 sceneCards로 변환.
 * 각 비트당 1개 씬 카드 (작가가 쪼개고 합치는 건 UI에서 처리).
 */
export function sceneCardsFromBeatSheet(beatSheetResult, charDevResult) {
  if (!beatSheetResult?.beats || !Array.isArray(beatSheetResult.beats)) return [];
  const protagonist = charDevResult?.protagonist?.name_suggestion || charDevResult?.protagonist?.name || "주인공";
  const supporting = (charDevResult?.supporting_characters || [])
    .slice(0, 2)
    .map(s => s.suggested_name || s.role_name || s.name)
    .filter(Boolean);

  return beatSheetResult.beats.map((beat, i) => ({
    id: `scene_from_beat_${beat.id || i}_${Date.now() + i}`,
    beatId: beat.id || null,
    order: i + 1,
    title: beat.name_kr || beat.name || `Beat ${i + 1}`,
    location: beat.location || "",
    characters: [protagonist, ...supporting],
    purpose: FUNCTION_GUESS(beat),
    conflict: beat.conflict || beat.summary || "",
    valueShift: VALUE_SHIFT_GUESS(beat),
    reveal: beat.reveal || beat.cliffhanger || "",
    subtext: "",
    status: "outline",
    fountainText: "",
    createdAt: Date.now() + i,
    updatedAt: Date.now() + i,
  }));
}
