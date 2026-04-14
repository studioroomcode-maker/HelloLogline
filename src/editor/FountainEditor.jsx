/**
 * FountainEditor.jsx
 * Fountain 포맷 시나리오 에디터
 * - contentEditable 기반 (외부 에디터 라이브러리 불필요)
 * - 라인별 구문 하이라이팅 (씬헤딩/캐릭터/대사/액션/지문)
 * - 커서 위치 보존
 * - 변경 시 onChange 콜백
 */

import { useRef, useEffect, useCallback, useMemo } from "react";
import { parseFountain } from "./FountainParser.js";

// ── 토큰 타입별 스타일 ──────────────────────────────
const TOKEN_STYLES = {
  scene_heading: {
    color: "var(--text-main)",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginTop: "1.8em",
    marginBottom: "0.3em",
    fontFamily: "'Courier New', 'Noto Sans KR', monospace",
    fontSize: "0.9em",
    borderLeft: "3px solid #A78BFA",
    paddingLeft: "10px",
  },
  action: {
    color: "var(--c-tx-75)",
    fontFamily: "'Courier New', 'Noto Sans KR', monospace",
    fontSize: "0.9em",
    lineHeight: "1.7",
    marginBottom: "0.2em",
  },
  character: {
    color: "#C8A84B",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: "1em",
    marginBottom: "0",
    fontFamily: "'Courier New', 'Noto Sans KR', monospace",
    fontSize: "0.9em",
    letterSpacing: "0.05em",
  },
  parenthetical: {
    color: "var(--c-tx-45)",
    fontStyle: "italic",
    marginLeft: "0",
    marginBottom: "0",
    fontFamily: "'Courier New', 'Noto Sans KR', monospace",
    fontSize: "0.88em",
  },
  dialogue: {
    color: "var(--c-tx-70)",
    marginBottom: "0",
    fontFamily: "'Courier New', 'Noto Sans KR', monospace",
    fontSize: "0.9em",
    lineHeight: "1.65",
  },
  transition: {
    color: "#60A5FA",
    textAlign: "right",
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: "1.2em",
    marginBottom: "0.6em",
    fontFamily: "'Courier New', monospace",
    fontSize: "0.85em",
  },
  lyrics: {
    color: "#F472B6",
    fontStyle: "italic",
    fontFamily: "'Courier New', 'Noto Sans KR', monospace",
    fontSize: "0.9em",
  },
  centered: {
    textAlign: "center",
    color: "var(--c-tx-55)",
    fontFamily: "'Courier New', 'Noto Sans KR', monospace",
    fontSize: "0.9em",
  },
  note: {
    color: "var(--c-tx-30)",
    fontStyle: "italic",
    fontSize: "0.8em",
    fontFamily: "'Courier New', monospace",
  },
  page_break: {
    borderTop: "1px dashed var(--glass-bd-base)",
    margin: "1.5em 0",
    height: "0",
  },
  blank: {
    height: "0.6em",
  },
};

// ── 커서 위치 유틸 ──────────────────────────────────
function saveCaret(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function restoreCaret(el, offset) {
  if (offset === null || offset === undefined) return;
  const walk = (node, remaining) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent.length;
      if (remaining <= len) return { node, offset: remaining };
      return { node: null, offset: remaining - len };
    }
    for (const child of node.childNodes) {
      const r = walk(child, remaining);
      if (r.node) return r;
      remaining = r.offset;
    }
    return { node: null, offset: remaining };
  };
  try {
    const { node, offset: off } = walk(el, offset);
    if (!node) return;
    const range = document.createRange();
    range.setStart(node, off);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (_) {}
}

// ── 메인 컴포넌트 ────────────────────────────────────
export default function FountainEditor({ value, onChange, readOnly = false, minHeight = 400, sceneRevisionMap = {} }) {
  const editorRef = useRef(null);
  const isComposing = useRef(false); // IME 조합 중 여부 (한글 입력)
  const lastValue = useRef(value);
  const lastRevMap = useRef(sceneRevisionMap);

  // 토큰 파싱 — value가 변할 때만 재계산
  const tokens = useMemo(() => parseFountain(value || ""), [value]);

  // ── 에디터 HTML 렌더링 ──────────────────────────────
  const renderHTML = useCallback((tokens) => {
    return tokens.map((tok, i) => {
      // 씬 헤딩의 개정 정보 확인
      const revInfo = tok.type === 'scene_heading'
        ? (sceneRevisionMap[tok.text.trim()] || null)
        : null;

      // 개정 색상으로 borderLeft 오버라이드
      const baseStyle = TOKEN_STYLES[tok.type] || TOKEN_STYLES.action;
      const st = revInfo
        ? { ...baseStyle, borderLeft: `3px solid ${revInfo.color}` }
        : baseStyle;

      const styleStr = Object.entries(st)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
        .join(';');

      if (tok.type === 'blank') {
        return `<div data-i="${i}" data-type="blank" style="${styleStr}">\u200B</div>`;
      }
      if (tok.type === 'page_break') {
        return `<div data-i="${i}" data-type="page_break" style="${styleStr}"></div>`;
      }
      // 텍스트 이스케이프 (XSS 방지)
      const safe = tok.raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // 씬 헤딩에 개정 배지 추가 (contentEditable="false"로 편집 불가)
      if (revInfo) {
        const badge = `<span data-rev-badge="true" contenteditable="false" style="float:right;color:${revInfo.color};font-size:9px;font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:0.05em;opacity:0.9;user-select:none;pointer-events:none;margin-left:10px;">* ${revInfo.shortName}</span>`;
        return `<div data-i="${i}" data-type="${tok.type}" style="${styleStr}">${badge}${safe || '\u200B'}</div>`;
      }

      return `<div data-i="${i}" data-type="${tok.type}" style="${styleStr}">${safe || '\u200B'}</div>`;
    }).join('');
  }, [sceneRevisionMap]);

  // ── 외부 value 또는 sceneRevisionMap 변경 시 DOM 업데이트 ──────────────────
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    // 자체 편집(handleInput)에 의한 value 변경은 무시
    // sceneRevisionMap 변경은 항상 반영
    const valueUnchanged = value === lastValue.current;
    const revMapUnchanged = sceneRevisionMap === lastRevMap.current;
    if (valueUnchanged && revMapUnchanged) return;
    lastValue.current = value;
    lastRevMap.current = sceneRevisionMap;
    const caret = saveCaret(el);
    el.innerHTML = renderHTML(parseFountain(value || ""));
    restoreCaret(el, caret);
  }, [value, sceneRevisionMap, renderHTML]);

  // ── 초기 렌더링 ──────────────────────────────────────
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = renderHTML(tokens);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 입력 핸들러 ──────────────────────────────────────
  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const el = editorRef.current;
    if (!el) return;
    // DOM → 순수 텍스트 추출 (개정 배지 스팬 제외)
    const raw = Array.from(el.children)
      .map(div => {
        let text = '';
        for (const node of div.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE && !node.getAttribute('data-rev-badge')) {
            text += node.textContent;
          }
        }
        const clean = text.replace('\u200B', '');
        return clean === '' ? '' : clean;
      })
      .join('\n');
    lastValue.current = raw;
    onChange?.(raw);
  }, [onChange]);

  // ── Tab 키: 다음 요소 유형 전환 ──────────────────────
  const handleKeyDown = useCallback((e) => {
    // Tab → 들여쓰기 삽입 방지 (Fountain은 들여쓰기 없음)
    if (e.key === 'Tab') {
      e.preventDefault();
      return;
    }
    // Enter → 기본 동작 유지 (새 줄)
  }, []);

  return (
    <div
      ref={editorRef}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => { isComposing.current = true; }}
      onCompositionEnd={() => {
        isComposing.current = false;
        handleInput();
      }}
      spellCheck={false}
      data-fountain-editor="true"
      style={{
        outline: "none",
        minHeight,
        padding: "24px 28px",
        fontFamily: "'Courier New', 'Noto Sans KR', monospace",
        fontSize: 14,
        lineHeight: 1.7,
        color: "var(--c-tx-75)",
        background: "transparent",
        caretColor: "#A78BFA",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
        cursor: readOnly ? "default" : "text",
      }}
    />
  );
}
