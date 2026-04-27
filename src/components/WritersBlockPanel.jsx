import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

const TYPE_LABEL = {
  situation: "1. 상황",
  inner: "2. 인물 내면",
  camera: "3. 카메라",
  options: "4. 선택지",
  necessity: "5. 존재 이유",
};

const TYPE_COLOR = {
  situation: "#C8A84B",
  inner: "#A78BFA",
  camera: "#60A5FA",
  options: "#4ECCA3",
  necessity: "#FB923C",
};

function QuestionBlock({ q, idx, session, onAnswerChange, onAskDeeper, deeperLoadingType, onDeeperAnswerChange }) {
  const color = TYPE_COLOR[q.type] || "#C8A84B";
  const answer = session.answers?.[q.type] || "";
  const deeper = session.deeperQuestions?.[q.type];
  const deeperLoading = deeperLoadingType === q.type;

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10, marginBottom: 10,
      background: "var(--glass-micro)",
      border: "1px solid var(--glass-bd-nano)",
      borderLeft: `3px solid ${color}`,
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
        {TYPE_LABEL[q.type] || `Q${idx + 1}`}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", lineHeight: 1.55, marginBottom: q.hint ? 4 : 8 }}>
        {q.q}
      </div>
      {q.hint && (
        <div style={{ fontSize: 10, color: "var(--c-tx-35)", lineHeight: 1.5, marginBottom: 8, fontStyle: "italic" }}>
          💡 {q.hint}
        </div>
      )}
      <textarea
        value={answer}
        onChange={(e) => onAnswerChange(q.type, e.target.value)}
        placeholder="이 질문에 대한 답을 적어보세요. 답이 잘 안 떠올라도 한 줄만 써보면 길이 열립니다."
        rows={3}
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 7,
          border: "1px solid var(--c-bd-3)", background: "var(--bg-page)",
          color: "var(--text-main)", fontSize: 12, lineHeight: 1.6,
          fontFamily: "'Noto Sans KR', sans-serif",
          resize: "vertical", boxSizing: "border-box",
        }}
      />
      {/* 더 좁은 후속 질문 */}
      {deeper && (
        <div style={{
          marginTop: 10, padding: "10px 12px", borderRadius: 8,
          background: `${color}08`, border: `1px solid ${color}30`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: 0.5, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            ↓ 더 좁은 질문
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)", lineHeight: 1.55, marginBottom: 4 }}>
            {deeper.q}
          </div>
          {deeper.hint && (
            <div style={{ fontSize: 10, color: "var(--c-tx-35)", lineHeight: 1.5, marginBottom: 6, fontStyle: "italic" }}>
              💡 {deeper.hint}
            </div>
          )}
          <textarea
            value={deeper.answer || ""}
            onChange={(e) => onDeeperAnswerChange(q.type, e.target.value)}
            rows={2}
            style={{
              width: "100%", padding: "7px 9px", borderRadius: 6,
              border: "1px solid var(--c-bd-3)", background: "var(--bg-page)",
              color: "var(--text-main)", fontSize: 11, lineHeight: 1.55,
              fontFamily: "'Noto Sans KR', sans-serif",
              resize: "vertical", boxSizing: "border-box",
            }}
          />
        </div>
      )}
      {answer.trim() && !deeper && (
        <button
          onClick={() => onAskDeeper(q.type)}
          disabled={deeperLoading}
          style={{
            marginTop: 6, fontSize: 10, padding: "4px 10px", borderRadius: 6,
            border: `1px solid ${color}40`, background: `${color}10`,
            color, cursor: deeperLoading ? "not-allowed" : "pointer", fontWeight: 700,
            fontFamily: "'Noto Sans KR', sans-serif",
            opacity: deeperLoading ? 0.6 : 1,
          }}
        >
          {deeperLoading ? "후속 질문 생성 중…" : "↓ 여전히 막혔다면 — 더 좁은 질문"}
        </button>
      )}
    </div>
  );
}

export default function WritersBlockPanel({ onClose }) {
  const {
    writersBlockSession, writersBlockLoading, writersBlockError,
    writersBlockDeeperLoadingType, apiKey,
    askWritersBlock, synthesizeWritersBlock, askDeeperWritersBlock,
    updateWritersBlockAnswer, updateWritersBlockDeeperAnswer,
    saveWritersBlockAsNote, resetWritersBlock,
  } = useLoglineCtx();
  const [situationDraft, setSituationDraft] = useState("");

  const session = writersBlockSession;
  const questions = session?.questionsResult?.questions || [];
  const synthesis = session?.synthesisResult;
  const allAnswered = questions.length > 0 && questions.every(q => session?.answers?.[q.type]?.trim());

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
        {/* Header */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🧠</span>
              막힘 풀기
            </div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 3, lineHeight: 1.55 }}>
              AI가 답을 주지 않습니다. 5개 좁은 질문에 답하다 보면 당신 안에 이미 있던 답이 보입니다.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 24px" }}>
          {/* 1. 상황 입력 (세션 없을 때) */}
          {!session && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-tx-50)", marginBottom: 8, letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>
                지금 어디서 막혀 있나요?
              </div>
              <textarea
                value={situationDraft}
                onChange={e => setSituationDraft(e.target.value)}
                placeholder={"예) 주인공이 아버지의 비밀을 알게 됐는데 다음 장면에서 어떻게 행동해야 할지 모르겠다.\n예) 미드포인트 비트를 어떻게 짜야 할지 떠오르지 않는다.\n예) 두 인물 대화가 평면적이고 진짜 갈등이 안 보인다."}
                rows={5}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "1px solid var(--c-bd-3)", background: "var(--bg-page)",
                  color: "var(--text-main)", fontSize: 12, lineHeight: 1.65,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  resize: "vertical", boxSizing: "border-box", marginBottom: 10,
                }}
              />
              {writersBlockError && (
                <div style={{ marginBottom: 8, fontSize: 11, color: "#E85D75" }}>{writersBlockError}</div>
              )}
              <button
                onClick={() => askWritersBlock(situationDraft)}
                disabled={writersBlockLoading || !situationDraft.trim() || !apiKey}
                style={{
                  fontSize: 12, padding: "8px 18px", borderRadius: 8,
                  border: "none",
                  background: situationDraft.trim() && apiKey ? "linear-gradient(135deg, #A78BFA, #818CF8)" : "var(--c-bd-3)",
                  color: situationDraft.trim() && apiKey ? "#fff" : "var(--c-tx-30)",
                  cursor: situationDraft.trim() && apiKey && !writersBlockLoading ? "pointer" : "not-allowed",
                  fontWeight: 800, fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                {writersBlockLoading ? "질문 생성 중…" : "5개 질문 받기"}
              </button>
              {!apiKey && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--c-tx-35)" }}>
                  API 키가 필요합니다.
                </div>
              )}
            </>
          )}

          {/* 2. 질문 5개 + 작가 답변 */}
          {session && questions.length > 0 && !synthesis && (
            <>
              <div style={{
                padding: "10px 12px", borderRadius: 8, marginBottom: 14,
                background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)",
                fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", letterSpacing: 0.6, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>막힘 상황</div>
                {session.situationText}
                {session.questionsResult?.context_acknowledgment && (
                  <div style={{ marginTop: 6, fontSize: 10, color: "var(--c-tx-40)", fontStyle: "italic" }}>
                    AI: {session.questionsResult.context_acknowledgment}
                  </div>
                )}
              </div>
              {questions.map((q, i) => (
                <QuestionBlock
                  key={q.type}
                  q={q}
                  idx={i}
                  session={session}
                  onAnswerChange={updateWritersBlockAnswer}
                  onAskDeeper={askDeeperWritersBlock}
                  deeperLoadingType={writersBlockDeeperLoadingType}
                  onDeeperAnswerChange={updateWritersBlockDeeperAnswer}
                />
              ))}
              {session.questionsResult?.closing_note && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, marginBottom: 12,
                  background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.25)",
                  fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.6,
                }}>
                  💡 {session.questionsResult.closing_note}
                </div>
              )}
              {writersBlockError && (
                <div style={{ marginBottom: 8, fontSize: 11, color: "#E85D75" }}>{writersBlockError}</div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={synthesizeWritersBlock}
                  disabled={!allAnswered || writersBlockLoading}
                  title={!allAnswered ? "5개 질문 모두 답해야 정리할 수 있습니다" : ""}
                  style={{
                    fontSize: 12, padding: "8px 18px", borderRadius: 8,
                    border: "none",
                    background: allAnswered ? "linear-gradient(135deg, #4ECCA3, #45B7D1)" : "var(--c-bd-3)",
                    color: allAnswered ? "#fff" : "var(--c-tx-30)",
                    cursor: allAnswered && !writersBlockLoading ? "pointer" : "not-allowed",
                    fontWeight: 800,
                  }}
                >
                  {writersBlockLoading ? "정리 중…" : "✓ 답변 정리하기"}
                </button>
                <button
                  onClick={resetWritersBlock}
                  style={{
                    fontSize: 11, padding: "8px 14px", borderRadius: 8,
                    border: "1px solid var(--c-bd-3)", background: "transparent",
                    color: "var(--c-tx-50)", cursor: "pointer", fontWeight: 700,
                  }}
                >
                  새로 시작
                </button>
              </div>
            </>
          )}

          {/* 3. 종합 */}
          {synthesis && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4ECCA3", marginBottom: 10, letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>
                ✓ 당신이 이미 알고 있던 것
              </div>
              <div style={{
                padding: "14px 16px", borderRadius: 10, marginBottom: 12,
                background: "rgba(78,204,163,0.06)", border: "1px solid rgba(78,204,163,0.25)",
                fontSize: 13, color: "var(--text-main)", lineHeight: 1.7,
              }}>
                {synthesis.what_writer_already_knows}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", marginBottom: 14, fontSize: 12, lineHeight: 1.65 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "var(--c-tx-30)", letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace", paddingTop: 2 }}>막힘 원인</div>
                <div style={{ color: "var(--c-tx-65)" }}>{synthesis.what_was_blocking}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#C8A84B", letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace", paddingTop: 2 }}>다음 5분</div>
                <div style={{ color: "var(--text-main)", fontWeight: 700 }}>{synthesis.next_small_action}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "var(--c-tx-30)", letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace", paddingTop: 2 }}>안 풀리면</div>
                <div style={{ color: "var(--c-tx-55)" }}>{synthesis.alternative_action}</div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={saveWritersBlockAsNote}
                  style={{
                    fontSize: 11, padding: "8px 14px", borderRadius: 8,
                    border: "1px solid rgba(200,168,75,0.4)",
                    background: "rgba(200,168,75,0.08)",
                    color: "#C8A84B", cursor: "pointer", fontWeight: 700,
                  }}
                >📝 수정 과제 보드에 저장</button>
                <button
                  onClick={resetWritersBlock}
                  style={{
                    fontSize: 11, padding: "8px 14px", borderRadius: 8,
                    border: "1px solid var(--c-bd-3)", background: "transparent",
                    color: "var(--c-tx-50)", cursor: "pointer", fontWeight: 700,
                  }}
                >다른 막힘 풀기</button>
                <button
                  onClick={onClose}
                  style={{
                    fontSize: 11, padding: "8px 14px", borderRadius: 8,
                    border: "none", background: "linear-gradient(135deg, #4ECCA3, #45B7D1)",
                    color: "#fff", cursor: "pointer", fontWeight: 800,
                  }}
                >글쓰러 가기 →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
