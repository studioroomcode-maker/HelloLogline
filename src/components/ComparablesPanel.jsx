import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

const PRESET_KINDS = [
  { id: "logline", label: "로그라인" },
  { id: "premise", label: "핵심 설계 (Want·Need·적대자·테마)" },
  { id: "scene", label: "씬" },
  { id: "beat", label: "비트 / 미드포인트" },
  { id: "freeform", label: "직접 입력" },
];

export default function ComparablesPanel({ onClose }) {
  const {
    comparablesResult, comparablesLoading, comparablesError, comparablesContext,
    askComparables, setComparablesResult,
    logline, coreDesignResult, sceneCards, beatSheetResult,
    apiKey,
  } = useLoglineCtx();

  const [kind, setKind] = useState(comparablesContext?.kind || "logline");
  const [freeContent, setFreeContent] = useState("");

  const buildContent = () => {
    switch (kind) {
      case "logline":
        return logline?.trim() || "";
      case "premise":
        if (!coreDesignResult) return "";
        const cd = coreDesignResult;
        return [
          cd.one_line && `한 줄: ${cd.one_line}`,
          cd.want?.summary && `Want: ${cd.want.summary}`,
          cd.need?.summary && `Need: ${cd.need.summary}`,
          cd.antagonist?.who && `적대자: ${cd.antagonist.who}`,
          cd.theme?.controlling_idea && `테마: ${cd.theme.controlling_idea}`,
        ].filter(Boolean).join("\n");
      case "scene":
        const c = sceneCards?.[0];
        if (!c) return "";
        return [
          c.title && `제목: ${c.title}`,
          c.location && `장소: ${c.location}`,
          c.purpose && `기능: ${c.purpose}`,
          c.conflict && `갈등: ${c.conflict}`,
          c.valueShift && c.valueShift !== "—" && `가치 변화: ${c.valueShift}`,
        ].filter(Boolean).join("\n");
      case "beat":
        const beats = beatSheetResult?.beats || [];
        const mid = beats.find(b => /midpoint|미드포인트/i.test(b.name_kr || b.name || "")) || beats[Math.floor(beats.length / 2)];
        if (!mid) return "";
        return `[${mid.name_kr || mid.name}] ${mid.summary || ""}`;
      case "freeform":
        return freeContent.trim();
      default:
        return "";
    }
  };

  const handleSubmit = () => {
    const content = buildContent();
    if (!content) return;
    const label = PRESET_KINDS.find(k => k.id === kind)?.label || "내용";
    askComparables(kind, label, content);
  };

  const previewContent = buildContent();

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 399 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 400, width: "min(720px, 96vw)", maxHeight: "92vh",
        background: "var(--bg-surface)", border: "1px solid var(--c-bd-4)",
        borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🎬</span>
              비교 작품 라이브러리
            </div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 3, lineHeight: 1.55 }}>
              당신 작품의 어느 부분과 *기능적으로* 유사한 실제 한국·할리우드 작품을 찾아 비교합니다.
              추상 점수보다 구체 사례가 100배 강한 피드백입니다.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-tx-50)", marginBottom: 8, letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>
            무엇과 비교할까요?
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {PRESET_KINDS.map(k => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                style={{
                  fontSize: 11, padding: "6px 12px", borderRadius: 7,
                  border: kind === k.id ? "1px solid #45B7D1" : "1px solid var(--c-bd-2)",
                  background: kind === k.id ? "rgba(69,183,209,0.10)" : "transparent",
                  color: kind === k.id ? "#45B7D1" : "var(--c-tx-45)",
                  cursor: "pointer", fontWeight: 700,
                }}
              >{k.label}</button>
            ))}
          </div>

          {kind === "freeform" ? (
            <textarea
              value={freeContent}
              onChange={e => setFreeContent(e.target.value)}
              placeholder="비교하고 싶은 내용을 자유롭게 입력. 예) '주인공이 마지막에 자기 정체를 들키는 씬'"
              rows={4}
              style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 12, lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
            />
          ) : previewContent ? (
            <div style={{
              padding: "10px 12px", borderRadius: 8, marginBottom: 10,
              background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)",
              fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>
              {previewContent}
            </div>
          ) : (
            <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(232,93,117,0.05)", border: "1px solid rgba(232,93,117,0.25)", fontSize: 11, color: "#E85D75" }}>
              이 카테고리에 데이터가 없습니다. 다른 카테고리를 선택하거나 직접 입력 모드를 사용하세요.
            </div>
          )}

          {comparablesError && (
            <div style={{ marginBottom: 8, fontSize: 11, color: "#E85D75" }}>{comparablesError}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!apiKey || !previewContent || comparablesLoading}
            style={{
              fontSize: 12, padding: "8px 18px", borderRadius: 8,
              border: "none",
              background: apiKey && previewContent ? "linear-gradient(135deg, #45B7D1, #60A5FA)" : "var(--c-bd-3)",
              color: apiKey && previewContent ? "#fff" : "var(--c-tx-30)",
              cursor: apiKey && previewContent && !comparablesLoading ? "pointer" : "not-allowed",
              fontWeight: 800, marginBottom: 16,
            }}
          >
            {comparablesLoading ? "유사 작품 매칭 중…" : "🔎 유사 작품 3건 찾기"}
          </button>

          {/* 결과 */}
          {comparablesResult && (
            <>
              {comparablesResult.summary && (
                <div style={{
                  padding: "10px 12px", borderRadius: 8, marginBottom: 12,
                  background: "rgba(69,183,209,0.06)", border: "1px solid rgba(69,183,209,0.25)",
                  fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.55,
                }}>
                  <span style={{ fontWeight: 700, color: "#45B7D1" }}>요약: </span>{comparablesResult.summary}
                </div>
              )}
              {(comparablesResult.comparables || []).map((c, i) => (
                <div key={i} style={{
                  padding: "12px 14px", borderRadius: 10, marginBottom: 10,
                  background: "var(--glass-micro)", border: "1px solid var(--glass-bd-nano)",
                  borderLeft: "3px solid #45B7D1",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{c.title}</div>
                    {c.year && <span style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>{c.year}</span>}
                    {c.country && <span style={{ fontSize: 10, color: "var(--c-tx-30)" }}>· {c.country}</span>}
                    {c.writer_director && <span style={{ fontSize: 10, color: "var(--c-tx-40)" }}>· {c.writer_director}</span>}
                  </div>
                  {c.similarity && (
                    <div style={{ fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.55, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: "#45B7D1" }}>유사점: </span>{c.similarity}
                    </div>
                  )}
                  {c.how_they_solved && (
                    <div style={{ fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.55, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: "#C8A84B" }}>그 작품의 처리: </span>{c.how_they_solved}
                    </div>
                  )}
                  {c.differentiation_hint && (
                    <div style={{ fontSize: 11, color: "var(--text-main)", lineHeight: 1.55, padding: "6px 8px", borderRadius: 6, background: "rgba(78,204,163,0.06)", border: "1px solid rgba(78,204,163,0.2)", marginTop: 6 }}>
                      <span style={{ fontWeight: 700, color: "#4ECCA3" }}>당신의 차별화: </span>{c.differentiation_hint}
                    </div>
                  )}
                </div>
              ))}
              {comparablesResult.comparables?.length > 0 && (
                <button
                  onClick={() => setComparablesResult(null)}
                  style={{ fontSize: 10, padding: "5px 11px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "transparent", color: "var(--c-tx-40)", cursor: "pointer", fontWeight: 700 }}
                >다른 항목 비교하기</button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
