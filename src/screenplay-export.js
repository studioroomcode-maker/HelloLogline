/**
 * HelloLogline 시나리오 출력 유틸리티
 * Fountain / Final Draft (.fdx) / PDF 시나리오 / PDF 방송 대본 출력 지원
 */

// ────────────────────────────────────────────────────
// 1. 시나리오 텍스트 파싱
// ────────────────────────────────────────────────────

/**
 * 시나리오 텍스트를 타입별 요소 배열로 파싱
 * @param {string} text - 시나리오 원문
 * @returns {{ type: string, text: string }[]}
 */
export function parseScreenplay(text) {
  const lines = text.split('\n');
  const elements = [];
  let prevType = 'blank';

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const leadingSpaces = rawLine.length - rawLine.trimStart().length;

    if (!trimmed) {
      // 연속 blank 는 하나만
      if (elements.length && elements[elements.length - 1].type !== 'blank') {
        elements.push({ type: 'blank', text: '' });
      }
      prevType = 'blank';
      continue;
    }

    // 씬 헤더 (INT. / EXT. / INT/EXT.)
    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(trimmed)) {
      elements.push({ type: 'scene_heading', text: trimmed.toUpperCase() });
      prevType = 'scene_heading';
      continue;
    }

    // 막 구분 (1막, 2막, 3막)
    if (/^[1-9]막\s*[—–-]/.test(trimmed) || /^─{4,}/.test(trimmed)) {
      elements.push({ type: 'act_marker', text: trimmed });
      prevType = 'act_marker';
      continue;
    }

    // 전환 지문
    if (/^(FADE OUT|FADE IN|CUT TO:|DISSOLVE TO:|SMASH CUT:|MATCH CUT:|페이드 아웃|페이드 인)/i.test(trimmed)) {
      elements.push({ type: 'transition', text: trimmed });
      prevType = 'transition';
      continue;
    }

    // 괄호 지문
    if (/^\(.+\)$/.test(trimmed) && (prevType === 'character' || prevType === 'parenthetical')) {
      elements.push({ type: 'parenthetical', text: trimmed });
      prevType = 'parenthetical';
      continue;
    }

    // 인물 큐: 많은 들여쓰기 + 짧은 이름 + 이전이 blank/action/scene_heading
    if (
      leadingSpaces >= 10 &&
      trimmed.length <= 50 &&
      !/[.。,、]$/.test(trimmed) &&
      prevType !== 'dialogue' &&
      prevType !== 'parenthetical'
    ) {
      elements.push({ type: 'character', text: trimmed });
      prevType = 'character';
      continue;
    }

    // 대사: 인물/괄호/대사 다음 + 어느 정도 들여쓰기
    if ((prevType === 'character' || prevType === 'parenthetical' || prevType === 'dialogue') && leadingSpaces >= 4) {
      elements.push({ type: 'dialogue', text: trimmed });
      prevType = 'dialogue';
      continue;
    }

    // 기본: 액션 라인
    elements.push({ type: 'action', text: trimmed });
    prevType = 'action';
  }

  // 앞뒤 blank 제거
  while (elements.length && elements[0].type === 'blank') elements.shift();
  while (elements.length && elements[elements.length - 1].type === 'blank') elements.pop();

  return elements;
}

// ────────────────────────────────────────────────────
// 2. Fountain (.fountain) 형식
// ────────────────────────────────────────────────────

/**
 * 파싱된 요소 배열 → Fountain 텍스트
 * Fountain spec: https://fountain.io/syntax
 */
export function toFountain(elements, { title = '제목 미설정', author = '', logline = '' } = {}) {
  const today = new Date().toLocaleDateString('ko-KR');
  const header = [
    `Title: ${title}`,
    author ? `Author: ${author}` : '',
    `Date: ${today}`,
    logline ? `\nNote: ${logline}` : '',
  ].filter(Boolean).join('\n');

  const body = elements.map(el => {
    switch (el.type) {
      case 'blank':        return '';
      case 'scene_heading': return el.text;          // INT./EXT. → Fountain 자동 인식
      case 'act_marker':   return `= ${el.text}`;   // Section 구분
      case 'transition':   return `> ${el.text}`;
      case 'character':    return `@${el.text}`;    // @ → 한국어 이름 강제 인식
      case 'parenthetical': return el.text;
      case 'dialogue':     return el.text;
      case 'action':       return el.text;
      default:             return el.text;
    }
  }).join('\n');

  return `${header}\n\n${body}`;
}

// ────────────────────────────────────────────────────
// 3. Final Draft (.fdx) XML 형식
// ────────────────────────────────────────────────────

/**
 * 파싱된 요소 배열 → Final Draft FDX XML 문자열
 */
export function toFDX(elements, { title = '제목 미설정', author = '' } = {}) {
  const esc = s => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const fdxType = {
    scene_heading: 'Scene Heading',
    action:        'Action',
    act_marker:    'Action',
    character:     'Character',
    parenthetical: 'Parenthetical',
    dialogue:      'Dialogue',
    transition:    'Transition',
    blank:         null,
  };

  const paragraphs = elements
    .filter(el => fdxType[el.type])
    .map(el => {
      const t = fdxType[el.type];
      return `    <Paragraph Type="${t}">\n      <Text>${esc(el.text)}</Text>\n    </Paragraph>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="2">
  <Content>
${paragraphs}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Alignment="Center" Type="Action">
        <Text>${esc(title)}</Text>
      </Paragraph>
      ${author ? `<Paragraph Alignment="Center" Type="Action"><Text>작: ${esc(author)}</Text></Paragraph>` : ''}
    </Content>
  </TitlePage>
  <PageLayout BackgroundColor="FFFFFF" BottomMargin="72" BreakDialogueAndActionAtSentences="Yes"
    DocumentLeading="Normal" FooterMargin="36" ForegroundColor="000000"
    HeaderMargin="36" TopMargin="72" />
</FinalDraft>`;
}

// ────────────────────────────────────────────────────
// 4. PDF — 서양 시나리오 포맷 HTML
// ────────────────────────────────────────────────────

/**
 * 서양 표준 시나리오 포맷 (Courier, 마진 기반 들여쓰기)으로 HTML 생성
 */
export function buildScreenplayPDFHtml(elements, { title = '제목 미설정', author = '', logline = '' } = {}) {
  const today = new Date().toLocaleDateString('ko-KR');

  const bodyLines = elements.map(el => {
    switch (el.type) {
      case 'blank':
        return '<div class="blank"></div>';
      case 'scene_heading':
        return `<div class="scene-heading">${escHtml(el.text)}</div>`;
      case 'act_marker':
        return `<div class="act-marker">${escHtml(el.text)}</div>`;
      case 'transition':
        return `<div class="transition">${escHtml(el.text)}</div>`;
      case 'character':
        return `<div class="character">${escHtml(el.text)}</div>`;
      case 'parenthetical':
        return `<div class="parenthetical">${escHtml(el.text)}</div>`;
      case 'dialogue':
        return `<div class="dialogue">${escHtml(el.text)}</div>`;
      case 'action':
        return `<div class="action">${escHtml(el.text)}</div>`;
      default:
        return `<div>${escHtml(el.text)}</div>`;
    }
  }).join('\n');

  // style은 wrapper div 안에 포함 — innerHTML 파싱 시 head/style 유실 방지
  return `<div class="hll-sp-root" style="background:#fff;color:#000;font-family:'Courier New',Courier,monospace;font-size:12pt;line-height:1.5;">
<style>
  .hll-sp-root * { margin: 0; padding: 0; box-sizing: border-box; }
  .hll-title-page {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 297mm; padding: 2cm; text-align: center; page-break-after: always;
  }
  .hll-title-page h1 { font-size: 18pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
  .hll-title-page .author { font-size: 14pt; margin-bottom: 12px; }
  .hll-title-page .logline { font-size: 11pt; font-style: italic; max-width: 420px; line-height: 1.6; margin: 24px auto 0; border-top: 1px solid #000; padding-top: 16px; }
  .hll-title-page .date { font-size: 10pt; margin-top: 48px; color: #555; }
  .hll-screenplay { padding: 2.54cm 2.54cm 2.54cm 3.81cm; max-width: 21.6cm; margin: 0 auto; }
  .hll-sp-root .blank  { height: 12pt; }
  .hll-sp-root .scene-heading { font-weight: bold; text-transform: uppercase; text-decoration: underline; margin-top: 12pt; }
  .hll-sp-root .act-marker { text-align: center; font-weight: bold; margin: 18pt 0; padding: 4pt 0; border-top: 1pt solid #000; border-bottom: 1pt solid #000; }
  .hll-sp-root .transition { text-align: right; }
  .hll-sp-root .character  { margin-left: 5.56cm; font-weight: bold; margin-top: 6pt; }
  .hll-sp-root .parenthetical { margin-left: 4.05cm; margin-right: 6.35cm; }
  .hll-sp-root .dialogue   { margin-left: 2.54cm; margin-right: 3.81cm; }
  .hll-sp-root .action     { margin-top: 0; }
</style>

<div class="hll-title-page">
  <h1>${escHtml(title)}</h1>
  ${author ? `<div class="author">작: ${escHtml(author)}</div>` : ''}
  ${logline ? `<div class="logline">${escHtml(logline)}</div>` : ''}
  <div class="date">Generated: ${today} · HelloLogline</div>
</div>

<div class="hll-screenplay">
${bodyLines}
</div>

</div>`;
}

// ────────────────────────────────────────────────────
// 5. PDF — 한국 방송 대본 / 드라마 대본 포맷 HTML
// ────────────────────────────────────────────────────

/**
 * 한국 방송 대본 (드라마 스크립트) 스타일로 HTML 생성
 */
export function buildKoreanScriptPDFHtml(elements, { title = '제목 미설정', author = '', logline = '' } = {}) {
  const today = new Date().toLocaleDateString('ko-KR');
  let sceneNum = 0;

  const rows = [];
  let i = 0;

  while (i < elements.length) {
    const el = elements[i];

    if (el.type === 'blank') { i++; continue; }

    if (el.type === 'act_marker') {
      rows.push(`<div class="act-marker">${escHtml(el.text)}</div>`);
      i++;
      continue;
    }

    if (el.type === 'scene_heading') {
      sceneNum++;
      rows.push(`
        <div class="scene-block">
          <div class="scene-heading">
            <span class="scene-num">#${sceneNum}</span>
            <span class="scene-loc">${escHtml(el.text)}</span>
          </div>`);

      i++;
      // 씬 내부 요소들 수집
      while (i < elements.length && elements[i].type !== 'scene_heading' && elements[i].type !== 'act_marker') {
        const inner = elements[i];

        if (inner.type === 'blank') { i++; continue; }

        if (inner.type === 'action') {
          rows.push(`<div class="direction"><span class="dir-label">지문</span><span class="dir-text">${escHtml(inner.text)}</span></div>`);
          i++;
          continue;
        }

        if (inner.type === 'character') {
          const charName = inner.text;
          let j = i + 1;
          const parts = [];
          while (j < elements.length && (elements[j].type === 'parenthetical' || elements[j].type === 'dialogue')) {
            parts.push(elements[j]);
            j++;
          }
          const parens = parts.filter(p => p.type === 'parenthetical').map(p => `<span class="paren">${escHtml(p.text)}</span>`).join(' ');
          const dlg = parts.filter(p => p.type === 'dialogue').map(p => escHtml(p.text)).join('<br>');
          rows.push(`
            <div class="char-block">
              <div class="char-name">${escHtml(charName)}${parens ? ' ' + parens : ''}</div>
              <div class="char-dialogue">${dlg}</div>
            </div>`);
          i = j;
          continue;
        }

        if (inner.type === 'transition') {
          rows.push(`<div class="transition">${escHtml(inner.text)}</div>`);
          i++;
          continue;
        }

        i++;
      }
      rows.push(`</div>`); // close scene-block
      continue;
    }

    // 씬 헤더 없이 시작하는 요소들 (타이틀 페이지 이전 등)
    if (el.type === 'action') {
      rows.push(`<div class="direction"><span class="dir-label">지문</span><span class="dir-text">${escHtml(el.text)}</span></div>`);
    }
    i++;
  }

  // style은 wrapper div 안에 포함 — innerHTML 파싱 시 head/style 유실 방지
  return `<div class="hll-kr-root" style="background:#fff;color:#111;font-family:'Malgun Gothic',sans-serif;font-size:11pt;line-height:1.8;">
<style>
  .hll-kr-root * { margin: 0; padding: 0; box-sizing: border-box; }
  .hll-kr-title-page {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 297mm; padding: 2cm; text-align: center; page-break-after: always;
  }
  .hll-kr-title-page h1 { font-size: 20pt; font-weight: 700; margin-bottom: 16px; }
  .hll-kr-title-page .author { font-size: 13pt; margin-bottom: 8px; color: #333; }
  .hll-kr-title-page .logline { font-size: 11pt; max-width: 420px; line-height: 1.7; margin: 24px auto 0; border-top: 1px solid #333; padding-top: 16px; color: #555; }
  .hll-kr-title-page .date { font-size: 9pt; margin-top: 40px; color: #888; }
  .hll-script-body { padding: 2cm 2.5cm; max-width: 21cm; margin: 0 auto; }
  .hll-kr-root .act-marker { text-align: center; font-weight: 700; font-size: 13pt; margin: 28pt 0 16pt; padding: 6pt 0; border-top: 2pt solid #000; border-bottom: 2pt solid #000; letter-spacing: 4px; }
  .hll-kr-root .scene-block { margin-bottom: 28pt; page-break-inside: avoid; }
  .hll-kr-root .scene-heading { display: flex; align-items: baseline; gap: 12px; background: #f0f0f0; border-left: 4px solid #333; padding: 5pt 10pt; margin-bottom: 10pt; border-radius: 0 4px 4px 0; }
  .hll-kr-root .scene-num { font-weight: 700; font-size: 11pt; color: #555; min-width: 28px; }
  .hll-kr-root .scene-loc { font-weight: 700; font-size: 11pt; letter-spacing: 0.5px; }
  .hll-kr-root .direction { display: flex; gap: 10px; margin: 6pt 0; align-items: flex-start; }
  .hll-kr-root .dir-label { font-size: 9pt; color: #888; font-weight: 700; min-width: 28px; padding-top: 2px; letter-spacing: 0.5px; }
  .hll-kr-root .dir-text { font-size: 10.5pt; color: #444; flex: 1; line-height: 1.7; }
  .hll-kr-root .char-block { margin: 10pt 0; padding-left: 20pt; border-left: 2px solid #ddd; }
  .hll-kr-root .char-name { font-weight: 700; font-size: 11pt; color: #000; margin-bottom: 2pt; }
  .hll-kr-root .paren { font-weight: 400; font-size: 10pt; color: #666; }
  .hll-kr-root .char-dialogue { font-size: 11pt; color: #111; line-height: 1.8; padding-left: 8pt; }
  .hll-kr-root .transition { text-align: right; color: #777; font-size: 10pt; margin: 6pt 0; }
</style>

<div class="hll-kr-title-page">
  <h1>${escHtml(title)}</h1>
  ${author ? `<div class="author">작: ${escHtml(author)}</div>` : ''}
  ${logline ? `<div class="logline">${escHtml(logline)}</div>` : ''}
  <div class="date">생성: ${today} · HelloLogline</div>
</div>

<div class="hll-script-body">
${rows.join('\n')}
</div>

</div>`;
}

// ────────────────────────────────────────────────────
// 6. PDF 내보내기 (html2pdf.js 사용)
// ────────────────────────────────────────────────────

/**
 * @param {'screenplay'|'korean'} format
 */
export async function exportScreenplayAsPDF(elements, meta, format = 'screenplay') {
  const html2pdf = (await import('html2pdf.js')).default;
  const html = format === 'korean'
    ? buildKoreanScriptPDFHtml(elements, meta)
    : buildScreenplayPDFHtml(elements, meta);

  const safeTitle = (meta.title || '시나리오').replace(/[^\w가-힣\s]/g, '').trim() || '시나리오';
  const suffix = format === 'korean' ? '_방송대본' : '_시나리오';

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;';
  document.body.appendChild(container);
  // innerHTML 설정 후 firstElementChild = hll-*-root wrapper div (style 포함)
  container.innerHTML = html;
  const rootEl = container.firstElementChild;

  const opt = {
    margin: 0,
    filename: `${safeTitle}${suffix}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css'] },
  };

  try {
    await html2pdf().set(opt).from(rootEl).save();
  } finally {
    document.body.removeChild(container);
  }
}

// ────────────────────────────────────────────────────
// 7. 파일 다운로드 헬퍼
// ────────────────────────────────────────────────────

export function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────────
// 내부 헬퍼
// ────────────────────────────────────────────────────

function escHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
