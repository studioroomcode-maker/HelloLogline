import { useState, useMemo, useCallback } from "react";
import FountainEditor from "./FountainEditor.jsx";
import { extractSceneBodies, parseFountain } from "./FountainParser.js";

const STATUS_META = {
  outline: { label: "아웃라인", color: "#9CA3AF" },
  drafted: { label: "초안", color: "#FB923C" },
  revised: { label: "수정 완료", color: "#4ECCA3" },
};

/**
 * Stage 6의 "씬 카드 모드" 뷰.
 * sceneCards를 좌측 리스트로 보여주고, 선택된 카드의 fountainText만 편집기에서 편집.
 * 카드별 편집은 전체 scenarioDraftResult로 합쳐 저장.
 *
 * Props:
 *   sceneCards: 씬 카드 배열
 *   scenarioDraftResult: 전체 fountain 텍스트 (참조용)
 *   onCardChange(id, patch): 카드 업데이트
 *   onWholeTextChange(text): 전체 텍스트 갱신 (씬 카드 편집 시 합쳐서 저장)
 *   onRewriteScene(card): "이 씬만 다시 쓰기" AI 호출
 *   rewriteLoadingId: 현재 재작성 중인 카드 id
 *   isMobile: 모바일 여부
 *   isReadOnly: 읽기 전용
 *   apiKey: api 키
 *   onSeedFromDraft(): 전체 초고에서 씬 카드 fountainText 자동 분배
 *   beatSheetStaleIds: stale로 마킹된 카드 id 배열
 */
export default function SceneCardWorkView({
  sceneCards,
  scenarioDraftResult,
  onCardChange,
  onWholeTextChange,
  onRewriteScene,
  rewriteLoadingId,
  isMobile,
  isReadOnly,
  apiKey,
  onSeedFromDraft,
  beatSheetStaleIds = [],
}) {
  const sorted = useMemo(
    () => [...(sceneCards || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [sceneCards]
  );
  const [activeId, setActiveId] = useState(sorted[0]?.id || null);
  const activeCard = sorted.find(c => c.id === activeId) || sorted[0];

  // 전체 초고에서 씬별 본문 자동 매칭 (location 슬러그라인 기반)
  const draftSceneBodies = useMemo(() => extractSceneBodies(scenarioDraftResult || ""), [scenarioDraftResult]);

  // 씬 카드 편집 시 전체 텍스트도 갱신.
  // sceneCards 순서대로 fountainText를 합치되, 비어 있는 카드는 location만 출력.
  const handleCardEditorChange = useCallback((newText) => {
    if (!activeCard) return;
    onCardChange(activeCard.id, { fountainText: newText, status: activeCard.status === "outline" ? "drafted" : activeCard.status });
    // 전체 합쳐 onWholeTextChange로 흘림
    const next = sorted.map(c => {
      const body = c.id === activeCard.id ? newText : (c.fountainText || "");
      const slug = c.location?.trim();
      if (!slug && !body) return "";
      const heading = slug ? slug : `INT. ${c.title || "씬"}`;
      return body.trim().startsWith(heading) ? body : `${heading}\n\n${body}`.trim();
    }).filter(Boolean).join("\n\n");
    onWholeTextChange(next);
  }, [activeCard, sorted, onCardChange, onWholeTextChange]);

  // 전체 초고에서 fountainText를 비어있는 카드들로 자동 분배.
  // location 슬러그라인이 일치하는 씬을 찾아 fountainText에 붙임.
  const handleSeed = useCallback(() => {
    if (!scenarioDraftResult) return;
    const tokens = parseFountain(scenarioDraftResult);
    const sceneBlocks = []; // { heading, body }
    let cur = null;
    tokens.forEach(tok => {
      if (tok.type === "scene_heading") {
        if (cur) sceneBlocks.push(cur);
        cur = { heading: tok.text.trim(), body: tok.raw };
      } else if (cur) {
        cur.body += "\n" + tok.raw;
      }
    });
    if (cur) sceneBlocks.push(cur);

    // sceneCards 순서대로 sceneBlocks를 매칭. location이 일치하면 우선, 아니면 인덱스 순.
    sorted.forEach((card, i) => {
      let block = card.location?.trim()
        ? sceneBlocks.find(b => b.heading.toLowerCase() === card.location.toLowerCase().trim())
        : null;
      if (!block && sceneBlocks[i]) block = sceneBlocks[i];
      if (block) {
        onCardChange(card.id, {
          fountainText: block.body.trim(),
          location: card.location || block.heading,
          status: card.status === "outline" ? "drafted" : card.status,
        });
      }
    });
    onSeedFromDraft?.();
  }, [scenarioDraftResult, sorted, onCardChange, onSeedFromDraft]);

  const draftedCount = sorted.filter(c => c.status === "drafted").length;
  const revisedCount = sorted.filter(c => c.status === "revised").length;

  if (sorted.length === 0) {
    return (
      <div style={{
        padding: "32px 20px", textAlign: "center", borderRadius: 10,
        background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)",
        color: "var(--c-tx-35)", fontSize: 12, lineHeight: 1.7,
        fontFamily: "'Noto Sans KR', sans-serif", marginTop: 6,
      }}>
        씬 카드가 없습니다.
        <br />Stage 5에서 비트 시트를 만들고 씬 카드 보드에서 자동 시드하거나,
        <br />씬 카드 보드에서 직접 추가하세요.
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: isMobile ? "column" : "row",
      border: "1px solid var(--glass-bd-nano)", borderRadius: 10,
      overflow: "hidden", background: "var(--glass-nano)",
      marginTop: 6, minHeight: 500,
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      {/* 좌측 씬 카드 리스트 */}
      <div style={{
        width: isMobile ? "100%" : 220, flexShrink: 0,
        borderRight: isMobile ? "none" : "1px solid var(--glass-bd-nano)",
        borderBottom: isMobile ? "1px solid var(--glass-bd-nano)" : "none",
        background: "var(--glass-micro)",
        maxHeight: isMobile ? 220 : 680, overflowY: "auto",
      }}>
        <div style={{
          padding: "10px 12px 8px", borderBottom: "1px solid var(--glass-bd-nano)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
            씬 {sorted.length}개
          </span>
          <span style={{ fontSize: 9, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: "#FB923C" }}>{draftedCount}</span>·<span style={{ color: "#4ECCA3" }}>{revisedCount}</span>
          </span>
        </div>
        {/* 시드 버튼 */}
        {scenarioDraftResult && sorted.some(c => !c.fountainText) && (
          <button
            onClick={handleSeed}
            style={{
              width: "calc(100% - 16px)", margin: "8px",
              padding: "6px 10px", borderRadius: 7,
              border: "1px solid rgba(78,204,163,0.35)",
              background: "rgba(78,204,163,0.08)",
              color: "#4ECCA3", fontSize: 10, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
            }}
            title="전체 초고에서 씬별 본문을 자동으로 분배"
          >
            ↓ 초고에서 씬 본문 분배
          </button>
        )}
        <div style={{ padding: "4px 6px" }}>
          {sorted.map((c) => {
            const isActive = c.id === activeId;
            const status = STATUS_META[c.status] || STATUS_META.outline;
            const isStale = beatSheetStaleIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "8px 10px", marginBottom: 3,
                  borderRadius: 7,
                  border: isActive ? `1px solid ${status.color}50` : "1px solid transparent",
                  background: isActive ? `${status.color}10` : "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column", gap: 3,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--glass-nano)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: status.color,
                  }} />
                  <span style={{ fontSize: 9, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                    #{c.order}
                  </span>
                  {isStale && (
                    <span style={{
                      fontSize: 8, color: "#F7A072", fontWeight: 700,
                      padding: "1px 5px", borderRadius: 5,
                      border: "1px solid rgba(247,160,114,0.4)",
                      background: "rgba(247,160,114,0.1)",
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.3,
                    }} title="상위 단계(비트시트/트리트먼트/캐릭터)가 변경됐습니다">stale</span>
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? status.color : "var(--c-tx-65)", lineHeight: 1.35 }}>
                  {c.title || "(제목 없음)"}
                </div>
                {c.location && (
                  <div style={{ fontSize: 9, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>
                    {c.location.length > 30 ? c.location.slice(0, 28) + "…" : c.location}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 우측 활성 씬 편집 영역 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeCard && (
          <>
            {/* 씬 메타 헤더 */}
            <div style={{
              padding: "10px 14px", borderBottom: "1px solid var(--glass-bd-nano)",
              background: "var(--glass-micro)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>
                  씬 #{activeCard.order}
                </span>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => onCardChange(activeCard.id, { status: key })}
                    style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 5,
                      border: activeCard.status === key ? `1px solid ${meta.color}` : "1px solid var(--c-bd-2)",
                      background: activeCard.status === key ? `${meta.color}14` : "transparent",
                      color: activeCard.status === key ? meta.color : "var(--c-tx-30)",
                      cursor: "pointer", fontWeight: 700,
                    }}
                  >{meta.label}</button>
                ))}
                <div style={{ flex: 1 }} />
                {apiKey && (
                  <button
                    onClick={() => onRewriteScene?.(activeCard)}
                    disabled={!!rewriteLoadingId || isReadOnly}
                    style={{
                      fontSize: 10, padding: "4px 11px", borderRadius: 6,
                      border: "1px solid rgba(167,139,250,0.4)",
                      background: rewriteLoadingId === activeCard.id ? "rgba(167,139,250,0.2)" : "rgba(167,139,250,0.08)",
                      color: "#A78BFA", cursor: rewriteLoadingId || isReadOnly ? "not-allowed" : "pointer",
                      fontWeight: 700, opacity: rewriteLoadingId && rewriteLoadingId !== activeCard.id ? 0.5 : 1,
                    }}
                  >
                    {rewriteLoadingId === activeCard.id ? "재작성 중…" : "✨ 이 씬만 다시 쓰기"}
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", marginBottom: 3 }}>
                {activeCard.title || "(제목 없음)"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 10px", fontSize: 10 }}>
                {activeCard.location && (
                  <>
                    <div style={{ color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>장소</div>
                    <div style={{ color: "var(--c-tx-55)", fontFamily: "'JetBrains Mono', monospace" }}>{activeCard.location}</div>
                  </>
                )}
                {activeCard.purpose && (
                  <>
                    <div style={{ color: "var(--c-tx-30)" }}>기능</div>
                    <div style={{ color: "var(--c-tx-55)" }}>{activeCard.purpose}{activeCard.valueShift && activeCard.valueShift !== "—" ? ` · ${activeCard.valueShift}` : ""}</div>
                  </>
                )}
                {activeCard.conflict && (
                  <>
                    <div style={{ color: "var(--c-tx-30)" }}>갈등</div>
                    <div style={{ color: "var(--c-tx-55)" }}>{activeCard.conflict}</div>
                  </>
                )}
                {activeCard.reveal && (
                  <>
                    <div style={{ color: "var(--c-tx-30)" }}>폭로</div>
                    <div style={{ color: "var(--c-tx-55)" }}>{activeCard.reveal}</div>
                  </>
                )}
              </div>
            </div>

            {/* 본문 편집기 */}
            <div style={{ flex: 1, overflowY: "auto", maxHeight: isMobile ? 360 : 540 }}>
              <FountainEditor
                value={activeCard.fountainText || ""}
                onChange={handleCardEditorChange}
                minHeight={360}
                readOnly={isReadOnly}
              />
            </div>

            {/* 본문이 비어있을 때 가이드 */}
            {!activeCard.fountainText && (
              <div style={{
                padding: "12px 14px", borderTop: "1px solid var(--glass-bd-nano)",
                background: "var(--glass-micro)",
                fontSize: 11, color: "var(--c-tx-35)", lineHeight: 1.6,
              }}>
                이 씬은 아직 비어 있습니다.{" "}
                {scenarioDraftResult
                  ? "좌측 '↓ 초고에서 씬 본문 분배' 버튼으로 자동 채우거나, 직접 작성하세요."
                  : "직접 작성하거나 위의 'AI로 다시 쓰기' 버튼으로 생성하세요."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
