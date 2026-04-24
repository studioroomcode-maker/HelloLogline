import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { exportStagePdf } from "../utils-pdf.js";

/**
 * 각 Stage 상단에 두는 PDF 저장 버튼.
 * - "이전 단계 포함" 체크박스 제공
 * - 클릭 시 A4 세로 레이아웃의 브라우저 인쇄 대화상자를 연다.
 *
 * @param {Object} props
 * @param {"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"} props.stageId
 */
export default function StagePdfButton({ stageId }) {
  const ctx = useLoglineCtx();
  const [includePrevious, setIncludePrevious] = useState(stageId !== "1");
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = ctx.getStagePdfData ? ctx.getStagePdfData() : {};
      await exportStagePdf({
        stageId,
        includePrevious: stageId === "1" ? false : includePrevious,
        logline: ctx.logline,
        genre: ctx.genre,
        data,
      });
    } catch (err) {
      console.error("[StagePdfButton] export failed", err);
      ctx.showToast?.("error", "PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const canIncludePrevious = stageId !== "1";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 12,
        padding: "8px 12px",
        borderRadius: 10,
        background: "var(--glass-nano)",
        border: "1px solid var(--glass-bd-nano)",
      }}
    >
      {canIncludePrevious && (
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--c-tx-50)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={includePrevious}
            onChange={(e) => setIncludePrevious(e.target.checked)}
            style={{ cursor: "pointer", accentColor: "#C8A84B" }}
          />
          이전 단계 포함
        </label>
      )}
      <button
        type="button"
        onClick={handleExport}
        disabled={busy}
        title="A4 세로 용지로 인쇄 · PDF로 저장할 수 있습니다"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          borderRadius: 8,
          border: "1px solid rgba(200,168,75,0.4)",
          background: busy ? "rgba(200,168,75,0.06)" : "rgba(200,168,75,0.1)",
          color: busy ? "var(--c-tx-30)" : "#C8A84B",
          fontSize: 11,
          fontWeight: 700,
          cursor: busy ? "not-allowed" : "pointer",
          fontFamily: "'Noto Sans KR', sans-serif",
          transition: "background 0.2s",
        }}
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M12 18v-6M9 15l3 3 3-3" />
        </svg>
        {busy ? "생성 중..." : "PDF 저장 (A4)"}
      </button>
    </div>
  );
}
