/**
 * FountainParser.js
 * Fountain 시나리오 포맷(https://fountain.io) 파서
 * 외부 라이브러리 없이 순수 JS로 구현
 *
 * 반환 토큰 타입:
 *   scene_heading | action | character | parenthetical
 *   dialogue | transition | page_break | note | lyrics
 *   centered | blank | boneyard
 */

const SCENE_HEADING_RE = /^(int|ext|est|int\.\/ext|int\/ext|i\/e)[\.\s]/i;
const TRANSITION_RE = /^(FADE (IN|OUT|TO)|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT|JUMP CUT|WIPE TO|IRIS (IN|OUT)|INTERCUT)[\s:]?.*:?\s*$/;
const CENTERED_RE = /^>\s*(.*?)\s*<$/;
const PAGE_BREAK_RE = /^={3,}$/;
const NOTE_RE = /^\[\[(.+?)\]\]$/;
const BONEYARD_RE = /^\/\*([\s\S]*?)\*\/$/;
const LYRICS_RE = /^~(.+)$/;

// 강제 지정 접두어
const FORCED = {
  scene:      '.',   // .FORCED SCENE HEADING
  action:     '!',   // !forced action
  character:  '@',   // @forced character
  transition: '>',   // >transition (without <)
  lyrics:     '~',
};

/**
 * 텍스트를 라인 배열로 파싱해 토큰 배열 반환
 * @param {string} text  Fountain 원문
 * @returns {Array<{type: string, text: string, raw: string, index: number}>}
 */
export function parseFountain(text) {
  if (!text) return [];

  const rawLines = text.split('\n');
  const tokens = [];

  let inDialogueBlock = false; // 캐릭터 다음 대사 블록 여부
  let prevNonBlank = null;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const line = raw.trimEnd();

    // ── 빈 줄 ──
    if (line.trim() === '') {
      tokens.push({ type: 'blank', text: '', raw, index: i });
      inDialogueBlock = false;
      prevNonBlank = null;
      continue;
    }

    // ── 페이지 구분선 ===  ──
    if (PAGE_BREAK_RE.test(line.trim())) {
      tokens.push({ type: 'page_break', text: '', raw, index: i });
      inDialogueBlock = false;
      continue;
    }

    // ── 노트 [[ ]] ──
    const noteM = line.trim().match(NOTE_RE);
    if (noteM) {
      tokens.push({ type: 'note', text: noteM[1], raw, index: i });
      continue;
    }

    // ── 강제 씬 헤딩 . ──
    if (line.startsWith('.') && !line.startsWith('..')) {
      tokens.push({ type: 'scene_heading', text: line.slice(1).trim(), raw, index: i });
      inDialogueBlock = false;
      continue;
    }

    // ── 강제 액션 ! ──
    if (line.startsWith('!')) {
      tokens.push({ type: 'action', text: line.slice(1), raw, index: i });
      inDialogueBlock = false;
      continue;
    }

    // ── 강제 캐릭터 @ ──
    if (line.startsWith('@')) {
      tokens.push({ type: 'character', text: line.slice(1).trim(), raw, index: i });
      inDialogueBlock = true;
      continue;
    }

    // ── 가사 ~ ──
    const lyricsM = line.match(LYRICS_RE);
    if (lyricsM) {
      tokens.push({ type: 'lyrics', text: lyricsM[1], raw, index: i });
      continue;
    }

    // ── 센터 정렬 > ... < ──
    const centeredM = line.match(CENTERED_RE);
    if (centeredM) {
      tokens.push({ type: 'centered', text: centeredM[1], raw, index: i });
      continue;
    }

    // ── 전환 > (< 없이 끝) ──
    if (line.startsWith('>') && !line.endsWith('<')) {
      tokens.push({ type: 'transition', text: line.slice(1).trim(), raw, index: i });
      inDialogueBlock = false;
      continue;
    }

    // ── 씬 헤딩 INT./EXT. ──
    if (SCENE_HEADING_RE.test(line.trim())) {
      tokens.push({ type: 'scene_heading', text: line.trim(), raw, index: i });
      inDialogueBlock = false;
      prevNonBlank = 'scene_heading';
      continue;
    }

    // ── 전환 (FADE OUT. 등) — 모두 대문자 + TO: 패턴 ──
    if (TRANSITION_RE.test(line.trim())) {
      tokens.push({ type: 'transition', text: line.trim(), raw, index: i });
      inDialogueBlock = false;
      continue;
    }

    // ── 지문 ( ) — 대화 블록 안에서 ──
    if (inDialogueBlock && /^\s*\(.*\)\s*$/.test(line)) {
      tokens.push({ type: 'parenthetical', text: line.trim(), raw, index: i });
      continue;
    }

    // ── 캐릭터 — 대문자 전용 + 이전이 빈 줄 + 다음 줄 존재 ──
    const trimmed = line.trim();
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-ZÀ-Ü가-힣]/.test(trimmed);
    const nextLine = rawLines[i + 1];
    const nextIsContent = nextLine !== undefined && nextLine.trim() !== '';

    if (
      isAllCaps &&
      nextIsContent &&
      prevNonBlank === null &&      // 직전이 빈 줄(블록 시작)
      !SCENE_HEADING_RE.test(trimmed) &&
      !TRANSITION_RE.test(trimmed) &&
      !PAGE_BREAK_RE.test(trimmed)
    ) {
      // V.O. / O.S. / CONT'D 제거 후 이름 정리
      const charName = trimmed.replace(/\s*\(.*?\)\s*$/, '').trim();
      tokens.push({ type: 'character', text: charName, raw, index: i });
      inDialogueBlock = true;
      prevNonBlank = 'character';
      continue;
    }

    // ── 대사 — 캐릭터/지문 다음에 오는 텍스트 ──
    if (inDialogueBlock) {
      tokens.push({ type: 'dialogue', text: line, raw, index: i });
      prevNonBlank = 'dialogue';
      continue;
    }

    // ── 액션 (기본값) ──
    tokens.push({ type: 'action', text: line, raw, index: i });
    inDialogueBlock = false;
    prevNonBlank = 'action';
  }

  return tokens;
}

/**
 * 토큰 배열에서 씬 목록만 추출
 * @param {Array} tokens  parseFountain() 결과
 * @returns {Array<{number: number, text: string, tokenIndex: number}>}
 */
export function extractScenes(tokens) {
  const scenes = [];
  let sceneNum = 1;
  tokens.forEach((tok, idx) => {
    if (tok.type === 'scene_heading') {
      scenes.push({ number: sceneNum++, text: tok.text, tokenIndex: idx });
    }
  });
  return scenes;
}

/**
 * 토큰에서 통계 계산
 * 업계 표준: 1페이지 ≈ 53~56 타이핑 라인 (Courier New 12pt, 표준 여백)
 * 간략화: 씬 헤딩 2줄, 대사 블록 평균 4줄, 액션 1줄로 환산
 */
export function calcStats(tokens) {
  let lineCount = 0;
  let wordCount = 0;
  let charCount = 0;
  let dialogueCount = 0;
  let sceneCount = 0;

  tokens.forEach(tok => {
    if (tok.type === 'blank' || tok.type === 'page_break') return;
    if (tok.type === 'scene_heading') { lineCount += 2; sceneCount++; }
    else if (tok.type === 'dialogue') { lineCount += Math.ceil((tok.text.length || 1) / 35); dialogueCount++; }
    else if (tok.type === 'character') lineCount += 1;
    else if (tok.type === 'parenthetical') lineCount += 1;
    else if (tok.type === 'action') lineCount += Math.ceil((tok.text.length || 1) / 60);
    else lineCount += 1;

    wordCount += tok.text.trim().split(/\s+/).filter(Boolean).length;
    charCount += tok.text.length;
  });

  const pages = Math.max(1, Math.round(lineCount / 54));
  const runningMinutes = pages; // 1페이지 ≈ 1분

  return { pages, runningMinutes, sceneCount, wordCount, charCount };
}

/**
 * Fountain 토큰을 다시 순수 텍스트로 직렬화
 */
export function serializeFountain(tokens) {
  return tokens.map(t => t.raw).join('\n');
}

/**
 * Final Draft 스타일 개정본 컬러 시스템
 * id: 1-based 개정 번호
 */
export const REVISION_COLORS = [
  { id: 1, name: "1차 개정", shortName: "1차", color: "#60A5FA" }, // Blue
  { id: 2, name: "2차 개정", shortName: "2차", color: "#F472B6" }, // Pink
  { id: 3, name: "3차 개정", shortName: "3차", color: "#FBBF24" }, // Yellow
  { id: 4, name: "4차 개정", shortName: "4차", color: "#34D399" }, // Green
  { id: 5, name: "5차 개정", shortName: "5차", color: "#F97316" }, // Goldenrod
  { id: 6, name: "6차 개정", shortName: "6차", color: "#FCA5A5" }, // Salmon
  { id: 7, name: "7차 개정", shortName: "7차", color: "#F87171" }, // Cherry
  { id: 8, name: "8차 개정", shortName: "8차", color: "#C084FC" }, // Purple
];

/**
 * Fountain 텍스트에서 씬별 본문을 추출
 * @param {string} text  Fountain 원문
 * @returns {Object} { sceneHeadingText: bodyText, ... }
 */
export function extractSceneBodies(text) {
  if (!text) return {};
  const tokens = parseFountain(text);
  const result = {};
  let currentKey = null;
  let bodyLines = [];

  tokens.forEach(tok => {
    if (tok.type === 'scene_heading') {
      if (currentKey !== null) {
        result[currentKey] = bodyLines.join('\n').trim();
      }
      currentKey = tok.text.trim();
      bodyLines = [];
    } else if (currentKey !== null) {
      bodyLines.push(tok.raw);
    }
  });
  if (currentKey !== null) {
    result[currentKey] = bodyLines.join('\n').trim();
  }
  return result;
}
