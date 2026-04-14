/**
 * InlineAI.jsx
 * Fountain 에디터 인라인 AI 어시스턴트
 *
 * 동작 방식:
 * 1. 에디터에서 텍스트를 드래그 선택
 * 2. 플로팅 툴바 노출 (다시 쓰기 / 대사 개선 / 씬 확장 / 삭제)
 * 3. Claude API 호출 → 선택 구간 인플레이스 교체
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { callClaudeText } from "../utils.js";

const INLINE_SYSTEM = `당신은 한국 시나리오 전문 편집자입니다.
주어진 시나리오 텍스트를 Fountain 포맷을 유지하면서 지시에 따라 수정합니다.

규칙:
- 반드시 Fountain 포맷 유지 (INT./EXT. 씬헤더, 대문자 캐릭터 큐, 들여쓰기 없음)
- 원본의 인물명·장소명·시제를 그대로 사용
- 수정된 텍스트만 출력, 설명·주석 없음
- 원본보다 현저히 길거나 짧지 않게`;

const ACTIONS = [
  {
    id: "rewrite",
    label: "다시 쓰기",
    icon: "✨",
    color: "#A78BFA",
    prompt: (sel) => `다음 시나리오 구간을 더 강렬하고 시각적으로 다시 써주세요:\n\n${sel}`,
  },
  {
    id: "dialogue",
    label: "대사 개선",
    icon: "💬",
    color: "#60A5FA",
    prompt: (sel) => `다음 구간의 대사를 더 자연스럽고 하위텍스트 있게 수정해주세요:\n\n${sel}`,
  },
  {
    id: "expand",
    label: "씬 확장",
    icon: "📖",
    color: "#4ECCA3",
    prompt: (sel) => `다음 씬을 더 풍부한 액션 라인과 세부 묘사로 확장해주세요:\n\n${sel}`,
  },
  {
    id: "tighten",
    label: "압축",
    icon: "⚡",
    color: "#C8A84B",
    prompt: (sel) => `다음 구간을 핵심만 남기고 간결하게 압축해주세요:\n\n${sel}`,
  },
];

export default function InlineAI({ editorContainerRef, apiKey, onReplace }) {
  const [toolbar, setToolbar] = useState(null); // { x, y, selectedText, range }
  const [loading, setLoading] = useState(null); // action id
  const [preview, setPreview] = useState(null); // { text, action }
  const toolbarRef = useRef(null);

  // ── 선택 감지 → 툴바 위치 계산 ──────────────────────
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      // 클릭으로 선택 해제 시 툴바 닫기 (툴바 자체 클릭 제외)
      setTimeout(() => {
        if (toolbarRef.current?.contains(document.activeElement)) return;
        const s = window.getSelection();
        if (!s || s.isCollapsed) setToolbar(null);
      }, 100);
      return;
    }

    const selectedText = sel.toString().trim();
    if (selectedText.length < 5) { setToolbar(null); return; }

    // 에디터 내부 선택인지 확인
    const container = editorContainerRef?.current;
    if (!container) return;
    const range = sel.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) { setToolbar(null); return; }

    // 툴바 위치 계산 (선택 영역 위)
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setToolbar({
      x: Math.max(0, rect.left - containerRect.left + rect.width / 2),
      y: rect.top - containerRect.top - 8,
      selectedText,
    });
    setPreview(null);
  }, [editorContainerRef]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  // ── AI 호출 ──────────────────────────────────────────
  const runAction = useCallback(async (action) => {
    if (!toolbar || !apiKey || loading) return;
    setLoading(action.id);
    try {
      const result = await callClaudeText(
        apiKey,
        INLINE_SYSTEM,
        action.prompt(toolbar.selectedText),
        1500,
        "claude-haiku-4-5-20251001",
        undefined,
        "inline_ai"
      );
      setPreview({ text: result.trim(), action });
    } catch (e) {
      console.error("InlineAI error:", e);
    } finally {
      setLoading(null);
    }
  }, [toolbar, apiKey, loading]);

  // ── 미리보기 적용 ────────────────────────────────────
  const applyPreview = useCallback(() => {
    if (!preview || !toolbar) return;
    onReplace?.(toolbar.selectedText, preview.text);
    setToolbar(null);
    setPreview(null);
    window.getSelection()?.removeAllRanges();
  }, [preview, toolbar, onReplace]);

  if (!toolbar) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "absolute",
        left: Math.max(8, toolbar.x - 120),
        top: toolbar.y - (preview ? 140 : 44),
        zIndex: 500,
        width: 240,
        pointerEvents: "auto",
      }}
    >
      {/* ── 미리보기 패널 ── */}
      {preview && (
        <div style={{
          marginBottom: 6, padding: "10px 12px",
          borderRadius: 10, background: "var(--glass-modal)",
          border: "1px solid var(--glass-bd-base)",
          backdropFilter: "var(--blur-base)", WebkitBackdropFilter: "var(--blur-base)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}>
          <div style={{ fontSize: 9, color: preview.action.color, fontWeight: 700, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            {preview.action.icon} {preview.action.label} 결과 미리보기
          </div>
          <div style={{
            fontSize: 10, color: "var(--c-tx-65)", lineHeight: 1.6,
            fontFamily: "'Courier New', monospace",
            maxHeight: 100, overflowY: "auto",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {preview.text.slice(0, 300)}{preview.text.length > 300 ? "…" : ""}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              onClick={applyPreview}
              style={{
                flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 10, fontWeight: 700,
                border: "none", background: preview.action.color, color: "#0c0c1c",
                cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              적용
            </button>
            <button
              onClick={() => setPreview(null)}
              style={{
                padding: "5px 10px", borderRadius: 6, fontSize: 10,
                border: "1px solid var(--glass-bd-base)", background: "var(--glass-nano)",
                color: "var(--c-tx-40)", cursor: "pointer",
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* ── 액션 툴바 ── */}
      <div style={{
        display: "flex", gap: 4, padding: "6px 8px",
        borderRadius: 10, background: "var(--glass-modal)",
        border: "1px solid var(--glass-bd-base)",
        backdropFilter: "var(--blur-base)", WebkitBackdropFilter: "var(--blur-base)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        flexWrap: "wrap",
      }}>
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => runAction(action)}
            disabled={!!loading}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
              border: `1px solid ${action.color}30`,
              background: loading === action.id ? `${action.color}20` : "var(--glass-nano)",
              color: loading === action.id ? action.color : "var(--c-tx-55)",
              cursor: loading ? "wait" : "pointer",
              fontFamily: "'Noto Sans KR', sans-serif",
              transition: "all 0.15s",
            }}
          >
            {loading === action.id ? (
              <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : action.icon}
            {action.label}
          </button>
        ))}
        <button
          onClick={() => { setToolbar(null); setPreview(null); window.getSelection()?.removeAllRanges(); }}
          style={{
            padding: "5px 6px", borderRadius: 6, fontSize: 10,
            border: "1px solid var(--glass-bd-nano)", background: "none",
            color: "var(--c-tx-30)", cursor: "pointer", marginLeft: "auto",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
