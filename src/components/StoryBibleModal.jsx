/**
 * StoryBibleModal — 스토리 바이블 모달
 * 지금까지 확정된 모든 요소의 통합 뷰
 */
export default function StoryBibleModal({
  onClose,
  showToast,
  isMobile,
  logline,
  result,
  pipelineResult,
  selectedSynopsisIndex,
  synopsisResults,
  charDevResult,
  structureResult,
  beatSheetResult,
  beatScenes,
  dialogueDevResult,
}) {
  const confirmedSynopsis =
    pipelineResult ||
    (selectedSynopsisIndex !== null
      ? synopsisResults?.synopses?.[selectedSynopsisIndex]
      : null);

  const handleCopy = () => {
    const sections = [];
    sections.push(`# 스토리 바이블\n`);
    sections.push(`## 로그라인\n${logline}\n`);
    if (confirmedSynopsis) {
      sections.push(
        `## 시놉시스 방향\n**${confirmedSynopsis.direction_title || ""}**\n${confirmedSynopsis.synopsis_text || confirmedSynopsis.synopsis || ""}\n`
      );
    }
    if (charDevResult?.protagonist) {
      const p = charDevResult.protagonist;
      sections.push(
        `## 주인공\n이름: ${p.name_suggestion || "—"}\nWant: ${p.want || "—"}\nNeed: ${p.need || "—"}\nGhost: ${p.ghost || "—"}\nArc: ${p.arc_type || "—"}\n`
      );
    }
    if (beatSheetResult?.beats?.length) {
      const beatLines = beatSheetResult.beats
        .map((b) => `- #${b.id} ${b.name_kr} (p.${b.page_start}): ${b.summary}`)
        .join("\n");
      sections.push(`## 비트 시트\n${beatLines}\n`);
    }
    navigator.clipboard
      .writeText(sections.join("\n---\n\n"))
      .then(() => showToast("success", "스토리 바이블이 클립보드에 복사되었습니다."));
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 399 }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 400,
          width: "min(780px, 96vw)",
          maxHeight: "88vh",
          background: "var(--bg-surface)",
          border: "1px solid var(--c-bd-4)",
          borderRadius: 18,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px 16px",
            borderBottom: "1px solid var(--c-bd-1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-main)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4ECCA3"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              스토리 바이블
            </div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 3 }}>
              지금까지 확정된 모든 요소의 통합 뷰
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid rgba(78,204,163,0.3)",
                background: "rgba(78,204,163,0.07)",
                color: "#4ECCA3",
                fontSize: 11,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              전체 복사
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--c-tx-40)",
                cursor: "pointer",
                fontSize: 20,
                lineHeight: 1,
                padding: "2px 6px",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px" }}>
          {/* Logline */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#C8A84B",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              로그라인
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "var(--text-main)",
                padding: "14px 16px",
                borderRadius: 10,
                background: "rgba(200,168,75,0.06)",
                border: "1px solid rgba(200,168,75,0.15)",
              }}
            >
              {logline}
            </div>
            {result?.scores && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(result.scores)
                  .slice(0, 6)
                  .map(([k, v]) => (
                    <span
                      key={k}
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "rgba(200,168,75,0.08)",
                        color: "#C8A84B",
                        border: "1px solid rgba(200,168,75,0.15)",
                      }}
                    >
                      {k}: {v}/5
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Synopsis */}
          {confirmedSynopsis && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#45B7D1",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                확정 시놉시스 방향
              </div>
              {confirmedSynopsis.direction_title && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-main)",
                    marginBottom: 6,
                  }}
                >
                  {confirmedSynopsis.direction_title}
                </div>
              )}
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: "var(--c-tx-65)",
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "rgba(69,183,209,0.05)",
                  border: "1px solid rgba(69,183,209,0.15)",
                }}
              >
                {confirmedSynopsis.synopsis_text || confirmedSynopsis.synopsis || ""}
              </div>
            </div>
          )}

          {/* Character */}
          {charDevResult?.protagonist && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#FB923C",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                주인공 프로필
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "rgba(251,146,60,0.05)",
                  border: "1px solid rgba(251,146,60,0.15)",
                }}
              >
                {(() => {
                  const p = charDevResult.protagonist;
                  const rows = [
                    ["이름/유형", p.name_suggestion || "—"],
                    ["외적 목표 (Want)", p.want || "—"],
                    ["내적 욕구 (Need)", p.need || "—"],
                    ["심리적 상처 (Ghost)", p.ghost || "—"],
                    ["믿는 거짓", p.lie_they_believe || "—"],
                    ["핵심 결함", p.flaw || "—"],
                    ["변화 호", p.arc_type || "—"],
                  ].filter(([, v]) => v && v !== "—");
                  return (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "auto 1fr",
                        gap: "6px 14px",
                      }}
                    >
                      {rows.map(([label, value]) => (
                        <>
                          <div
                            key={`l-${label}`}
                            style={{
                              fontSize: 11,
                              color: "rgba(251,146,60,0.7)",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {label}
                          </div>
                          <div
                            key={`v-${label}`}
                            style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.5 }}
                          >
                            {value}
                          </div>
                        </>
                      ))}
                    </div>
                  );
                })()}
                {charDevResult.supporting_characters?.length > 0 && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 10,
                      borderTop: "1px solid var(--c-bd-1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(251,146,60,0.6)",
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      조연 캐릭터
                    </div>
                    {charDevResult.supporting_characters.slice(0, 4).map((s, i) => (
                      <div
                        key={i}
                        style={{ fontSize: 11, color: "var(--c-tx-55)", marginBottom: 3 }}
                      >
                        <strong style={{ color: "var(--c-tx-70)" }}>
                          {s.suggested_name || s.role_name || "—"}
                        </strong>{" "}
                        — {s.relationship_dynamic || s.protagonist_mirror || ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Structure */}
          {structureResult?.plot_points?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#4ECCA3",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                구조 플롯 포인트
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(78,204,163,0.04)",
                  border: "1px solid rgba(78,204,163,0.12)",
                }}
              >
                {structureResult.plot_points.map((pt, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 6,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: "#4ECCA3",
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                        marginTop: 2,
                      }}
                    >
                      p.{pt.page}
                    </span>
                    <div>
                      <strong style={{ fontSize: 11, color: "var(--c-tx-70)" }}>
                        {pt.name}
                      </strong>
                      <span
                        style={{ fontSize: 11, color: "var(--c-tx-50)", marginLeft: 6 }}
                      >
                        {pt.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Beat Sheet summary */}
          {beatSheetResult?.beats?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#FFD166",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                비트 시트 ({beatSheetResult.beats.length}비트)
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(255,209,102,0.04)",
                  border: "1px solid rgba(255,209,102,0.12)",
                }}
              >
                {beatSheetResult.beats.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 5,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: "#FFD166",
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                        marginTop: 3,
                        minWidth: 32,
                      }}
                    >
                      p.{b.page_start}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 11, color: "var(--c-tx-70)" }}>
                        {b.name_kr}
                      </strong>
                      <span
                        style={{ fontSize: 10, color: "var(--c-tx-45)", marginLeft: 6 }}
                      >
                        {b.summary}
                      </span>
                    </div>
                    {beatScenes[b.id] && (
                      <span style={{ fontSize: 9, color: "#4ECCA3", flexShrink: 0 }}>
                        ✓ 집필
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dialogue voices */}
          {dialogueDevResult?.character_voices?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#F472B6",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                대사 목소리 프로필
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(244,114,182,0.04)",
                  border: "1px solid rgba(244,114,182,0.12)",
                }}
              >
                {dialogueDevResult.character_voices.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 10,
                      paddingBottom: 10,
                      borderBottom:
                        i < dialogueDevResult.character_voices.length - 1
                          ? "1px solid var(--c-bd-1)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--c-tx-75)",
                        marginBottom: 3,
                      }}
                    >
                      {v.character}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.5 }}
                    >
                      {v.speech_pattern}
                    </div>
                    {v.verbal_tic && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(244,114,182,0.65)",
                          marginTop: 2,
                        }}
                      >
                        말버릇: {v.verbal_tic}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!charDevResult && !synopsisResults && !structureResult && (
            <div
              style={{
                textAlign: "center",
                color: "var(--c-tx-30)",
                fontSize: 13,
                padding: "30px 0",
              }}
            >
              Stage 3 이후 분석을 진행하면 여기에 통합 뷰가 채워집니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
