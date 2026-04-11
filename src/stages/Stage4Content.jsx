import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, SvgIcon, ICON, Spinner, DocButton } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import {
  StructureAnalysisPanel, ValueChargePanel, ComparableWorksPanel,
  PipelinePanel, SynopsisCard,
} from "../panels/StoryPanels.jsx";

/* ─── Local Tooltip (not exported from ui.jsx) ─── */
function Tooltip({ text, children, maxWidth = 300, align = "center" }) {
  const [visible, setVisible] = useState(false);
  const posStyle = align === "left"
    ? { left: 0 }
    : align === "right"
    ? { right: 0 }
    : { left: "50%", transform: "translateX(-50%)" };
  const arrowStyle = align === "left"
    ? { left: 20 }
    : align === "right"
    ? { right: 20 }
    : { left: "50%", transform: "translateX(-50%)" };
  return (
    <div
      style={{ position: "relative", display: "block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 10px)",
          ...posStyle,
          background: "var(--bg-tooltip)",
          border: "1px solid var(--border-tooltip)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 12,
          color: "var(--text-tooltip)",
          lineHeight: 1.75,
          maxWidth,
          width: "max-content",
          zIndex: 400,
          pointerEvents: "none",
          boxShadow: "0 10px 32px rgba(0,0,0,0.6)",
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 400,
          whiteSpace: "pre-wrap",
          wordBreak: "keep-all",
        }}>
          <div style={{
            position: "absolute", top: "100%",
            ...arrowStyle,
            width: 0, height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "7px solid var(--bg-tooltip)",
          }} />
          {text}
        </div>
      )}
    </div>
  );
}

export default function Stage4Content({
  result,
  structureResult, setStructureResult, structureLoading, structureError,
  valueChargeResult, setValueChargeResult, valueChargeLoading, valueChargeError,
  analyzeStructureAll, structureAllLoading, structureAllDone,
  comparableResult, setComparableResult, comparableLoading, comparableError, analyzeComparableWorks,
  academicResult,
  mythMapResult,
  koreanMythResult,
  expertPanelResult,
  barthesCodeResult,
  shadowResult,
  authenticityResult,
  charDevResult,
  subtextResult,
  themeResult,
  synopsisMode, setSynopsisMode,
  NARRATIVE_FRAMEWORKS,
  selectedFramework, setSelectedFramework,
  frameworkInfoId, setFrameworkInfoId,
  directionCount, setDirectionCount,
  generateSynopsis, synopsisLoading, synopsisError,
  synopsisResults, setSelectedSynopsisIndex, selectedSynopsisIndex,
  selectedDuration,
  treatmentChars,
  pipelineResult, setPipelineResult, pipelineHistory, setPipelineHistory,
  editingSynopsis, setEditingSynopsis,
  synopsisEditDraft, setSynopsisEditDraft,
  writerEdits, setWriterEdit, clearWriterEdit,
  treatmentResult, setTreatmentStale,
  beatSheetResult, setBeatSheetStale,
  scenarioDraftResult, setScenarioDraftStale,
  pipelineFeedback, setPipelineFeedback,
  refinePipelineSynopsis, pipelineRefineLoading,
  undoHistory,
  episodeDesignResult, episodeDesignLoading, episodeDesignError, generateEpisodeDesign,
}) {
  const { logline, isMobile, cc, getStageStatus, advanceToStage, showToast, apiKey, openApplicationDoc } = useLoglineCtx();

  return (
    <ErrorBoundary><div>

    {/* ── 단계 안내 ── */}
    <div style={{ marginBottom: charDevResult ? 12 : 18, padding: "12px 16px", borderRadius: 10, background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.15)", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🗺️</span>
      <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
        <strong style={{ color: "rgba(78,204,163,0.9)" }}>이야기의 뼈대와 방향을 확정하는 단계입니다.</strong>{" "}
        먼저 3막 구조를 분석해 플롯 포인트를 잡고, 이야기가 담을 테마를 정합니다. 여러 방향의 시놉시스를 생성한 뒤 하나를 선택하면 이후 단계의 기준이 됩니다.
      </div>
    </div>

    {/* ── 캐릭터 컨텍스트 반영 배너 ── */}
    {charDevResult && (
      <div style={{
        marginBottom: 18, padding: "10px 14px", borderRadius: 9,
        background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.2)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth={2} strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 11, color: "#FB923C", fontWeight: 700 }}>캐릭터 컨텍스트 반영됨</span>
          <span style={{ fontSize: 11, color: "var(--c-tx-45)", marginLeft: 8 }}>
            {charDevResult.protagonist?.name_suggestion && (
              <>{charDevResult.protagonist.name_suggestion}의 Want·Need·Arc가 시놉시스 파이프라인에 포함됩니다.</>
            )}
            {!charDevResult.protagonist?.name_suggestion && "Stage 3 캐릭터 데이터가 시놉시스 생성에 자동 반영됩니다."}
          </span>
        </div>
        {charDevResult.supporting_characters?.length > 0 && (
          <span style={{ fontSize: 10, color: "rgba(251,146,60,0.5)", whiteSpace: "nowrap" }}>
            +조연 {charDevResult.supporting_characters.length}명
          </span>
        )}
      </div>
    )}

    {!logline.trim() && (
      <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.15)", fontSize: 11, color: "var(--c-tx-40)", display: "flex", alignItems: "center", gap: 7 }}>
        <span>💡</span>
        <span>Stage 1에서 로그라인을 먼저 입력하세요. 더 정확한 분석 결과를 얻을 수 있습니다.</span>
      </div>
    )}

    {/* ── 구조 & 감정 아크 (통합 버튼) ── */}
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "var(--c-tx-40)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>1순위 — 구조 & 감정 아크</div>
      <ToolButton icon={<SvgIcon d={ICON.film} size={16} />} label="구조 & 감정 아크" sub="Field · Snyder · McKee 3막 구조 + 가치 전하" done={structureAllDone} loading={structureAllLoading} color="#4ECCA3" onClick={analyzeStructureAll} disabled={!logline.trim()}
        tooltip={"이야기의 뼈대와 감정 흐름을 설계합니다.\n\n• 3막 구조 — Field·Snyder·McKee·Hauge·Truby의 핵심 플롯 포인트 배치\n  (1막 설정 → 촉발 사건 → 2막 대립 → 절정 → 3막 해소)\n\n• 가치 전하 (McKee) — 장면마다 긍정↔부정으로 뒤바뀌는 감정 가치를 추적합니다.\n  감정 기복이 없는 이야기는 관객을 잃습니다."}
        creditCost={cc(2)} />
      <ErrorMsg msg={structureError || valueChargeError} />
      {(structureLoading || valueChargeLoading) && (
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          {[
            { label: "3막 구조", loading: structureLoading, done: !!structureResult },
            { label: "가치 전하", loading: valueChargeLoading, done: !!valueChargeResult },
          ].map((item, i) => (
            <span key={i} style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: item.done ? "#4ECCA3" : item.loading ? "#4ECCA3" : "var(--c-tx-25)", display: "flex", alignItems: "center", gap: 4 }}>
              {item.done ? "✓" : item.loading ? <Spinner size={9} color="#4ECCA3" /> : "○"} {item.label}
            </span>
          ))}
        </div>
      )}
      {structureAllDone && (
        <ResultCard
          title="구조 & 감정 아크"
          onClose={() => { setStructureResult(null); setValueChargeResult(null); }}
          color="rgba(78,204,163,0.15)"
        >
          {structureResult && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(78,204,163,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>3막 구조 (Field · Snyder · McKee · Hauge · Truby)</div>
              <ErrorBoundary><StructureAnalysisPanel data={structureResult} isMobile={isMobile} /></ErrorBoundary>
            </div>
          )}
          {valueChargeResult && (
            <div>
              {structureResult && <div style={{ margin: "20px 0", height: 1, background: "var(--c-bd-1)" }} />}
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(78,204,163,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>가치 전하 & 감정 아크 (McKee)</div>
              <ValueChargePanel data={valueChargeResult} isMobile={isMobile} />
            </div>
          )}
        </ResultCard>
      )}
    </div>

    {/* ── 유사 작품 비교 ── */}
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "var(--c-tx-40)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>시장 포지셔닝</div>
      <ToolButton
        icon={<SvgIcon d={ICON.film} size={16} />}
        label="유사 작품 비교 분석"
        sub="한국·해외 참고 작품 + 시장 포지셔닝"
        done={!!comparableResult}
        loading={comparableLoading}
        color="#F472B6"
        onClick={analyzeComparableWorks}
        disabled={!logline.trim()}
        tooltip={"이 이야기와 유사한 국내외 레퍼런스 작품을 찾아 시장 맥락을 파악합니다.\n\n• 유사 작품 — 장르·톤·주제 기준 비교 분석\n• 배울 점 — 각 레퍼런스에서 참고할 전략\n• 시장 포지셔닝 — OTT·극장·방송 채널 적합성\n• 타깃 관객 — 연령·성별·취향 프로파일\n\n투자 제안서와 방송사 기획안에 필수로 포함되는 섹션입니다."}
        creditCost={cc(1)}
      />
      <ErrorMsg msg={comparableError} />
      {comparableResult && (
        <ResultCard title="유사 작품 비교" onClose={() => setComparableResult(null)} color="rgba(244,114,182,0.15)">
          <ErrorBoundary><ComparableWorksPanel data={comparableResult} isMobile={isMobile} /></ErrorBoundary>
        </ResultCard>
      )}
    </div>

    {/* ── 이전 분석 반영 표시 ── */}
    {(() => {
      const badges = [
        academicResult && { label: "학술", color: "#45B7D1" },
        mythMapResult && { label: "신화매핑", color: "#a78bfa" },
        koreanMythResult && { label: "한국신화", color: "#E85D75" },
        expertPanelResult && { label: "전문가패널", color: "#FFD166" },
        barthesCodeResult && { label: "바르트코드", color: "#64DCC8" },
        shadowResult && { label: "Jung원형", color: "#E85D75" },
        authenticityResult && { label: "진정성", color: "#a78bfa" },
        charDevResult && { label: "캐릭터", color: "#FB923C" },
        valueChargeResult && { label: "가치전하", color: "#4ECCA3" },
        subtextResult && { label: "하위텍스트", color: "#95E1D3" },
        structureResult && { label: "구조분석", color: "#4ECCA3" },
        themeResult && { label: "테마", color: "#F472B6" },
      ].filter(Boolean);
      if (badges.length === 0) return (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--c-card-3)", background: "rgba(var(--tw),0.02)", fontSize: 11, color: "var(--c-tx-30)" }}>
          개념 분석·캐릭터·가치전하·하위텍스트를 먼저 실행하면 그 결과가 시놉시스 생성에 자동으로 반영됩니다.
        </div>
      );
      return (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(200,168,75,0.15)", background: "rgba(200,168,75,0.04)" }}>
          <div style={{ fontSize: 10, color: "rgba(200,168,75,0.7)", marginBottom: 7, fontWeight: 700, letterSpacing: 0.5 }}>시놉시스에 반영되는 분석</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {badges.map((b) => (
              <span key={b.label} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, border: `1px solid ${b.color}40`, background: `${b.color}0f`, color: b.color }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
      );
    })()}

    {/* Synopsis mode toggle */}
    <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "var(--c-card-1)", padding: 4, borderRadius: 10, border: "1px solid var(--c-bd-1)" }}>
      {[
        { id: "auto", label: "자동 생성", align: "left", tip: "로그라인과 이전 분석 결과를 바탕으로 원하는 서사 구조와 방향 수를 선택해 여러 시놉시스를 한 번에 생성합니다.\n\n생성된 시놉시스 중 마음에 드는 방향을 '확정'하면, 이후 트리트먼트·비트시트가 그 방향을 기반으로 작성됩니다." },
        { id: "pipeline", label: "파이프라인", align: "right", tip: "AI가 일련의 질문(주제·갈등·해결 등)을 순서대로 던지며 이야기를 함께 구체화하는 인터뷰 방식입니다.\n\n아직 이야기 방향이 불확실하거나, 처음부터 AI와 함께 발전시키고 싶을 때 유용합니다." },
      ].map((m) => (
        <Tooltip key={m.id} text={m.tip} align={m.align}>
          <button onClick={() => setSynopsisMode(m.id)} style={{
            padding: "8px 12px", borderRadius: 7, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: synopsisMode === m.id ? 700 : 400,
            background: synopsisMode === m.id ? "rgba(200,168,75,0.15)" : "transparent",
            color: synopsisMode === m.id ? "#C8A84B" : "var(--c-tx-35)",
            transition: "all 0.15s", width: "100%",
          }}>{m.label}</button>
        </Tooltip>
      ))}
    </div>

    {/* Auto mode */}
    {synopsisMode === "auto" && (
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>서사 구조</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 6 }}>
            {NARRATIVE_FRAMEWORKS.map((f) => (
              <button
                key={f.id}
                onClick={() => { setSelectedFramework(f.id); setFrameworkInfoId(frameworkInfoId === f.id ? null : f.id); }}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 9, textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                  border: selectedFramework === f.id ? "1px solid rgba(200,168,75,0.5)" : "1px solid var(--c-bd-1)",
                  background: selectedFramework === f.id ? "rgba(200,168,75,0.08)" : "rgba(var(--tw),0.02)",
                  color: selectedFramework === f.id ? "#C8A84B" : "var(--c-tx-45)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.4 }}>{f.ref}</div>
              </button>
            ))}
          </div>
          {/* 서사 구조 설명 팝업 */}
          {frameworkInfoId && (() => {
            const fi = NARRATIVE_FRAMEWORKS.find(f => f.id === frameworkInfoId);
            if (!fi) return null;
            return (
              <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B" }}>{fi.icon} {fi.label}</span>
                  <button onClick={() => setFrameworkInfoId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-tx-30)", fontSize: 14, padding: 0 }}>✕</button>
                </div>
                <div style={{ fontSize: 12, color: "var(--c-tx-60)", marginBottom: 6, fontWeight: 500 }}>{fi.desc}</div>
                <div style={{ fontSize: 11, color: "rgba(var(--tw),0.38)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{fi.instruction}</div>
              </div>
            );
          })()}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--c-tx-40)" }}>방향 수:</span>
          {[2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setDirectionCount(n)} style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              border: directionCount === n ? "1px solid rgba(200,168,75,0.5)" : "1px solid var(--c-bd-3)",
              background: directionCount === n ? "rgba(200,168,75,0.1)" : "var(--c-card-1)",
              color: directionCount === n ? "#C8A84B" : "var(--c-tx-40)",
              fontWeight: directionCount === n ? 700 : 400,
            }}>{n}가지</button>
          ))}
        </div>
        <button onClick={generateSynopsis} disabled={synopsisLoading || !logline.trim() || !apiKey} style={{
          width: "100%", padding: 13, borderRadius: 10, border: "1px solid rgba(200,168,75,0.3)",
          background: synopsisLoading ? "rgba(200,168,75,0.05)" : "rgba(200,168,75,0.1)",
          color: "#C8A84B", cursor: synopsisLoading || !logline.trim() ? "not-allowed" : "pointer",
          fontSize: 14, fontWeight: 700, transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {synopsisLoading ? (<><Spinner size={14} color="#C8A84B" />{directionCount}가지 시놉시스 작성 중...</>) : `${directionCount}가지 방향으로 시놉시스 생성`}
        </button>
        <ErrorMsg msg={synopsisError} onRetry={synopsisError ? generateSynopsis : undefined} />
        {synopsisResults?.synopses && (
          <div style={{ marginTop: 16 }}>
            {selectedSynopsisIndex !== null && (
              <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 8, background: "rgba(78,204,163,0.08)", border: "1px solid rgba(78,204,163,0.25)", fontSize: 12, color: "#4ECCA3", fontFamily: "'Noto Sans KR', sans-serif" }}>
                ✓ 방향 {selectedSynopsisIndex + 1} 확정 — 이후 모든 단계가 이 시놉시스를 기반으로 생성됩니다
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 7, background: "rgba(200,168,75,0.07)", border: "1px solid rgba(200,168,75,0.2)", fontSize: 11, color: "var(--c-tx-45)", marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>✏️</span> AI가 생성한 구조 초안입니다. 이 위에 작가만의 목소리와 디테일을 더해주세요.
            </div>
            {synopsisResults.synopses.map((s, i) => (
              <SynopsisCard
                key={i}
                synopsis={s}
                index={i}
                isSelected={selectedSynopsisIndex === i}
                onSelect={() => setSelectedSynopsisIndex(i === selectedSynopsisIndex ? null : i)}
              />
            ))}
          </div>
        )}
      </div>
    )}

    {/* Pipeline mode */}
    {synopsisMode === "pipeline" && (
      <div style={{ marginBottom: 20 }}>
        <PipelinePanel selectedDuration={selectedDuration} logline={logline} apiKey={apiKey} isMobile={isMobile} onResult={(data) => setPipelineResult(data)} charHint={(() => {
          const p = treatmentChars.protagonist;
          const lines = [];
          if (p.name) lines.push(`주인공 이름: ${p.name}${p.role ? ` (${p.role})` : ""}`);
          if (p.want) lines.push(`외적 목표(Want): ${p.want}`);
          if (p.need) lines.push(`내적 욕구(Need): ${p.need}`);
          if (p.flaw) lines.push(`핵심 결함: ${p.flaw}`);
          treatmentChars.supporting.filter(s => s.name.trim()).forEach(s => {
            let line = `조연: ${s.name}${s.role ? ` (${s.role})` : ""}${s.relation ? ` — ${s.relation}` : ""}${s.mbti ? ` [MBTI: ${s.mbti}]` : ""}`;
            if (s.description) line += `\n  설명: ${s.description}`;
            lines.push(line);
          });
          return lines.length > 0 ? `[작가 직접 설정 — 반드시 이 인물 이름·설정·관계를 그대로 사용할 것]\n${lines.join("\n")}` : "";
        })()} />
        {pipelineResult && (
          <ResultCard title={pipelineResult.direction_title} onClose={() => { setPipelineResult(null); setPipelineHistory([]); }} onUndo={() => undoHistory(setPipelineHistory, setPipelineResult, pipelineHistory)} historyCount={pipelineHistory.length} color="rgba(78,204,163,0.15)">
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 7, background: "rgba(200,168,75,0.07)", border: "1px solid rgba(200,168,75,0.2)", fontSize: 11, color: "var(--c-tx-45)", marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>✏️</span> AI가 생성한 구조 초안입니다. 이 위에 작가만의 목소리와 디테일을 더해주세요.
            </div>
            <SynopsisCard synopsis={pipelineResult} index={0} />
            {/* 시놉시스 직접 편집 */}
            {editingSynopsis ? (
              <div style={{ marginTop: 12 }}>
                <textarea
                  value={synopsisEditDraft}
                  onChange={e => setSynopsisEditDraft(e.target.value)}
                  rows={6}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: "1px solid rgba(78,204,163,0.3)",
                    background: "rgba(var(--tw),0.03)",
                    color: "var(--text-main)", fontSize: 13, lineHeight: 1.8,
                    fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setEditingSynopsis(false)}
                    style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-45)", fontSize: 11, cursor: "pointer" }}>취소</button>
                  <button onClick={() => {
                    setPipelineResult(prev => ({ ...prev, synopsis: synopsisEditDraft }));
                    setWriterEdit("synopsis", synopsisEditDraft);
                    setEditingSynopsis(false);
                    if (treatmentResult) setTreatmentStale(true);
                    if (beatSheetResult) setBeatSheetStale(true);
                    if (scenarioDraftResult) setScenarioDraftStale(true);
                  }}
                    style={{ padding: "6px 16px", borderRadius: 7, border: "1px solid rgba(78,204,163,0.4)", background: "rgba(78,204,163,0.1)", color: "#4ECCA3", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>저장</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  onClick={() => { setSynopsisEditDraft(pipelineResult.synopsis || ""); setEditingSynopsis(true); }}
                  style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.05)", color: "#4ECCA3", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >✏ 시놉시스 직접 편집</button>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <textarea value={pipelineFeedback} onChange={(e) => setPipelineFeedback(e.target.value)} placeholder="피드백을 입력하여 시놉시스를 다듬으세요..." rows={3} style={{
                width: "100%", padding: 12, borderRadius: 10,
                border: "1px solid var(--c-bd-3)", background: "rgba(var(--tw),0.025)",
                color: "var(--text-main)", fontSize: 13, resize: "vertical", fontFamily: "'Noto Sans KR', sans-serif",
              }} />
              <button onClick={refinePipelineSynopsis} disabled={pipelineRefineLoading || !pipelineFeedback.trim()} style={{
                marginTop: 8, padding: "10px 20px", borderRadius: 9,
                border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.07)",
                color: "#4ECCA3", cursor: pipelineRefineLoading ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 600,
              }}>
                {pipelineRefineLoading ? "다듬는 중..." : "피드백 반영하여 다듬기"}
              </button>
            </div>
          </ResultCard>
        )}
      </div>
    )}

    {/* ── 기획서 PDF ── */}
    {(synopsisResults || pipelineResult) && (
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <DocButton label="시놉시스 PDF" sub="A4 한 장 시놉시스 문서" onClick={() => openApplicationDoc("synopsis")} />
      </div>
    )}

    {/* ── 에피소드 시리즈 설계 ── */}
    {(pipelineResult || synopsisResults) && (
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>에피소드 시리즈 설계</div>
            <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2 }}>
              시놉시스를 N부작 시리즈로 구성 — 각 에피소드 갈등·클리프행어 설계
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[4, 6, 8, 12, 16].map(n => (
              <button key={n} onClick={() => generateEpisodeDesign(n)} disabled={episodeDesignLoading}
                style={{
                  padding: "6px 12px", borderRadius: 8, cursor: episodeDesignLoading ? "wait" : "pointer",
                  border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.07)",
                  color: "#4ECCA3", fontSize: 11, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                {episodeDesignLoading ? "생성 중..." : `${n}부작`}
              </button>
            ))}
          </div>
        </div>
        {episodeDesignError && <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(232,93,117,0.08)", border: "1px solid rgba(232,93,117,0.2)", fontSize: 11, color: "#E85D75" }}>{episodeDesignError}</div>}
        {episodeDesignResult && (
          <div>
            {/* 헤더 */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { label: "포맷", value: episodeDesignResult.series_type || "—", color: "#4ECCA3" },
                { label: "회차", value: `${episodeDesignResult.episode_count || episodeDesignResult.episodes?.length || "?"}부작`, color: "#45B7D1" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${color}22`, background: `${color}0a` }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                  <div style={{ fontSize: 9, color: "var(--c-tx-30)", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            {episodeDesignResult.season_logline && (
              <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.04)", fontSize: 13, color: "var(--c-tx-65)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>
                {episodeDesignResult.season_logline}
              </div>
            )}
            {/* 에피소드 카드 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(episodeDesignResult.episodes || []).map((ep, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.01)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(78,204,163,0.15)", border: "1px solid rgba(78,204,163,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#4ECCA3", fontFamily: "'JetBrains Mono', monospace" }}>{ep.number || i + 1}</span>
                    </div>
                    {ep.title && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{ep.title}</span>}
                  </div>
                  {ep.logline && <div style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.65, marginBottom: ep.cliffhanger ? 6 : 0 }}>{ep.logline}</div>}
                  {ep.key_scene && <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 4, fontStyle: "italic" }}>씬: {ep.key_scene}</div>}
                  {ep.cliffhanger && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "#F7A072", padding: "4px 8px", borderRadius: 5, background: "rgba(247,160,114,0.07)", border: "1px solid rgba(247,160,114,0.2)", display: "inline-block" }}>
                      🔗 {ep.cliffhanger}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* 시즌 아크 */}
            {episodeDesignResult.series_arc && (
              <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(69,183,209,0.2)", background: "rgba(69,183,209,0.04)" }}>
                <div style={{ fontSize: 10, color: "rgba(69,183,209,0.7)", fontWeight: 700, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>시즌 아크</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "시즌 목표", value: episodeDesignResult.series_arc.season_want },
                    { label: "중반 반전", value: episodeDesignResult.series_arc.midpoint },
                    { label: "피날레", value: episodeDesignResult.series_arc.finale },
                  ].filter(f => f.value).map(({ label, value }) => (
                    <div key={label} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(69,183,209,0.15)", background: "rgba(69,183,209,0.05)" }}>
                      <div style={{ fontSize: 9, color: "rgba(69,183,209,0.6)", marginBottom: 4, fontWeight: 700 }}>{label}</div>
                      <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )}
    {getStageStatus("4") === "done" && (() => {
      const hasSynopsis = !!(synopsisResults?.synopses?.length || pipelineResult);
      const isConfirmed = !!(pipelineResult || selectedSynopsisIndex !== null);
      const confirmedTitle = pipelineResult?.direction_title
        || (selectedSynopsisIndex !== null ? synopsisResults?.synopses?.[selectedSynopsisIndex]?.direction_title : null);
      return (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--c-bd-1)" }}>
          {hasSynopsis && !isConfirmed && (
            <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(247,160,114,0.08)", border: "1px solid rgba(247,160,114,0.3)", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F7A072", marginBottom: 3 }}>시놉시스 방향이 확정되지 않았습니다</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6 }}>
                  위 시놉시스 중 하나를 선택해야 트리트먼트·비트 시트·시나리오가 그 방향으로 생성됩니다.<br />
                  선택하지 않고 넘어가면 이후 단계가 시놉시스 없이 로그라인만 참고해서 진행됩니다.
                </div>
              </div>
            </div>
          )}
          {isConfirmed && confirmedTitle && (
            <div style={{ marginBottom: 14, padding: "10px 16px", borderRadius: 10, background: "rgba(78,204,163,0.07)", border: "1px solid rgba(78,204,163,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13 }}>✅</span>
              <div style={{ fontSize: 12, color: "#4ECCA3" }}>
                <span style={{ fontWeight: 700 }}>확정:</span> {confirmedTitle} — 이후 모든 단계가 이 시놉시스를 기반으로 생성됩니다
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => advanceToStage("5")}
              style={{
                padding: "11px 24px", borderRadius: 10, cursor: "pointer",
                border: isConfirmed ? "1px solid rgba(78,204,163,0.4)" : "1px solid rgba(200,168,75,0.4)",
                background: isConfirmed ? "rgba(78,204,163,0.1)" : "rgba(200,168,75,0.1)",
                color: isConfirmed ? "#4ECCA3" : "#C8A84B",
                fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
              }}
            >
              {isConfirmed ? "✓ 시놉시스 확정 — 다음 단계: 트리트먼트 & 비트" : "다음 단계: 트리트먼트 & 비트 (시놉시스 미확정)"}
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      );
    })()}
    </div></ErrorBoundary>
  );
}
