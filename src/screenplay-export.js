/**
 * HelloLogline 시나리오 출력 유틸리티
 * Fountain / Final Draft (.fdx) / PDF 시나리오 / PDF 방송 대본 출력 지원
 */

import { parseFountain } from "./editor/FountainParser.js";

// ────────────────────────────────────────────────────
// 1. 시나리오 텍스트 파싱 (FountainParser 위임)
// ────────────────────────────────────────────────────

/**
 * 시나리오 텍스트를 타입별 요소 배열로 파싱
 * FountainParser.js에 위임해 단일 파싱 소스를 유지합니다.
 * @param {string} text - Fountain 시나리오 원문
 * @returns {{ type: string, text: string }[]}
 */
export function parseScreenplay(text) {
  const tokens = parseFountain(text || "");
  // 토큰 → 요소 변환 (raw 제거, index 제거)
  const elements = tokens.map(t => ({ type: t.type, text: t.text }));

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
  return `<div class="hll-sp-root" style="background:#fff;color:#000;font-family:'Courier New',Courier,monospace;font-size:10pt;line-height:1.45;">
<style>
  .hll-sp-root * { margin: 0; padding: 0; box-sizing: border-box; }
  .hll-title-page {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 297mm; padding: 2cm; text-align: center; page-break-after: always;
  }
  .hll-title-page h1 { font-size: 15pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
  .hll-title-page .author { font-size: 12pt; margin-bottom: 10px; }
  .hll-title-page .logline { font-size: 10pt; font-style: italic; max-width: 420px; line-height: 1.6; margin: 20px auto 0; border-top: 1px solid #000; padding-top: 14px; }
  .hll-title-page .date { font-size: 9pt; margin-top: 40px; color: #555; }
  .hll-screenplay { padding: 2.54cm 2.54cm 2.54cm 3.81cm; max-width: 21.6cm; margin: 0 auto; }
  .hll-sp-root .blank  { height: 10pt; }
  .hll-sp-root .scene-heading { font-weight: bold; text-transform: uppercase; text-decoration: underline; margin-top: 10pt; }
  .hll-sp-root .act-marker { text-align: center; font-weight: bold; margin: 14pt 0; padding: 4pt 0; border-top: 1pt solid #000; border-bottom: 1pt solid #000; }
  .hll-sp-root .transition { text-align: right; }
  .hll-sp-root .character  { margin-left: 5.56cm; font-weight: bold; margin-top: 5pt; }
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
  return `<div class="hll-kr-root" style="background:#fff;color:#111;font-family:'Malgun Gothic',sans-serif;font-size:10pt;line-height:1.7;">
<style>
  .hll-kr-root * { margin: 0; padding: 0; box-sizing: border-box; }
  .hll-kr-title-page {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 297mm; padding: 2cm; text-align: center; page-break-after: always;
  }
  .hll-kr-title-page h1 { font-size: 16pt; font-weight: 700; margin-bottom: 14px; }
  .hll-kr-title-page .author { font-size: 12pt; margin-bottom: 8px; color: #333; }
  .hll-kr-title-page .logline { font-size: 10pt; max-width: 420px; line-height: 1.7; margin: 20px auto 0; border-top: 1px solid #333; padding-top: 14px; color: #555; }
  .hll-kr-title-page .date { font-size: 9pt; margin-top: 36px; color: #888; }
  .hll-script-body { padding: 2cm 2.5cm; max-width: 21cm; margin: 0 auto; }
  .hll-kr-root .act-marker { text-align: center; font-weight: 700; font-size: 11pt; margin: 22pt 0 12pt; padding: 5pt 0; border-top: 2pt solid #000; border-bottom: 2pt solid #000; letter-spacing: 4px; }
  .hll-kr-root .scene-block { margin-bottom: 22pt; page-break-inside: avoid; }
  .hll-kr-root .scene-heading { display: flex; align-items: baseline; gap: 10px; background: #f0f0f0; border-left: 4px solid #333; padding: 4pt 9pt; margin-bottom: 8pt; border-radius: 0 4px 4px 0; }
  .hll-kr-root .scene-num { font-weight: 700; font-size: 10pt; color: #555; min-width: 26px; }
  .hll-kr-root .scene-loc { font-weight: 700; font-size: 10pt; letter-spacing: 0.5px; }
  .hll-kr-root .direction { display: flex; gap: 9px; margin: 5pt 0; align-items: flex-start; }
  .hll-kr-root .dir-label { font-size: 8.5pt; color: #888; font-weight: 700; min-width: 26px; padding-top: 2px; letter-spacing: 0.5px; }
  .hll-kr-root .dir-text { font-size: 9.5pt; color: #444; flex: 1; line-height: 1.65; }
  .hll-kr-root .char-block { margin: 8pt 0; padding-left: 18pt; border-left: 2px solid #ddd; }
  .hll-kr-root .char-name { font-weight: 700; font-size: 10pt; color: #000; margin-bottom: 2pt; }
  .hll-kr-root .paren { font-weight: 400; font-size: 9pt; color: #666; }
  .hll-kr-root .char-dialogue { font-size: 10pt; color: #111; line-height: 1.7; padding-left: 7pt; }
  .hll-kr-root .transition { text-align: right; color: #777; font-size: 9pt; margin: 5pt 0; }
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
  const content = format === 'korean'
    ? buildKoreanScriptPDFHtml(elements, meta)
    : buildScreenplayPDFHtml(elements, meta);

  const safeTitle = (meta.title || '시나리오').replace(/[^\w가-힣\s]/g, '').trim() || '시나리오';
  const suffix = format === 'korean' ? '_방송대본' : '_시나리오';
  const filename = `${safeTitle}${suffix}`;
  const filenameJson = JSON.stringify(filename);

  const pageStyle = format === 'korean'
    ? '@page { size: A4 portrait; margin: 20mm 15mm 20mm 20mm; }'
    : '@page { size: A4 portrait; margin: 15mm 15mm 15mm 20mm; }';

  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${filename}</title>
<style>
  ${pageStyle}
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @media print { body { margin: 0; } }
</style>
<script>
  window.addEventListener('load', function() {
    document.title = ${filenameJson};
    setTimeout(function() { window.print(); }, 400);
  });
<\/script>
</head>
<body style="margin:0;padding:0;background:#fff;">
${content}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');

  if (!win || win.closed || typeof win.closed === 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setTimeout(() => URL.revokeObjectURL(url), 300000);
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
