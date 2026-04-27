import { useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { ToolButton, ResultCard, ErrorMsg, SvgIcon, ICON, FeedbackBox } from "../ui.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import StagePdfButton from "../components/StagePdfButton.jsx";
import StageNotesBanner from "../components/StageNotesBanner.jsx";

const ACCENT = "#A78BFA";

function SectionHeader({ title, badge, color = ACCENT }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 4 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{title}</span>
        {badge && (
          <span style={{
            marginLeft: 8, fontSize: 9, fontWeight: 700,
            padding: "2px 7px", borderRadius: 10,
            background: `${color}14`, border: `1px solid ${color}28`,
            color, fontFamily: "'JetBrains Mono', monospace",
          }}>{badge}</span>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, hint, accent = ACCENT }) {
  if (!value) return null;
  return (
    <div style={{
      padding: "10px 12px", borderRadius: 8, marginBottom: 8,
      background: "var(--glass-nano)",
      border: "1px solid var(--glass-bd-nano)",
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: 1,
        color: accent, textTransform: "uppercase",
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: 4,
      }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--text-main)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
        {value}
      </div>
      {hint && (
        <div style={{ marginTop: 4, fontSize: 10, color: "var(--c-tx-35)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function CoreBlock({ title, color, items }) {
  if (!items || items.every(([, v]) => !v)) return null;
  return (
    <ResultCard title={title} color={`${color}1F`}>
      {items.map(([label, value, hint]) => (
        <Field key={label} label={label} value={value} hint={hint} accent={color} />
      ))}
    </ResultCard>
  );
}

export default function Stage2Content({
  coreDesignResult,
  coreDesignLoading,
  coreDesignError,
  analyzeCoreDesign,
  coreDesignFeedback, setCoreDesignFeedback,
  coreDesignRefineLoading,
  refineCoreDesign,
  result, // Stage 1 logline analysis (for weakness hint display)
}) {
  const { logline, isMobile, cc, advanceToStage, isDemoMode, learningMode, coreDesignLearningResult } = useLoglineCtx();

  const disabled = !logline.trim();
  const cd = coreDesignResult;
  const learn = coreDesignLearningResult;

  return (
    <ErrorBoundary><div>
      <StagePdfButton stageId="2" />
      <StageNotesBanner stageId="2" />

      {/* ── 단계 안내 ── */}
      <div style={{ marginBottom: 22, padding: "12px 14px", borderRadius: 10, background: `${ACCENT}0d`, borderLeft: `2px solid ${ACCENT}66` }}>
        <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65 }}>
          <strong style={{ color: ACCENT }}>이야기 엔진을 확정하는 단계입니다.</strong>{" "}
          Want(외적 욕망)·Need(내적 결핍)·적대자·스테이크·테마 — 다음 단계로 가기 전에 이 다섯 가지를 단정적으로 정해두세요. 이후 단계가 단단해집니다.
        </div>
      </div>

      {disabled && (
        <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(200,168,75,0.06)", borderLeft: "2px solid rgba(200,168,75,0.4)", fontSize: 11, color: "var(--c-tx-40)" }}>
          Stage 1에서 로그라인을 먼저 입력하세요.
        </div>
      )}

      {/* ── 분석 실행 ── */}
      <div style={{
        padding: "16px 16px 14px", borderRadius: 12, marginBottom: 14,
        background: "var(--glass-micro)", border: "1px solid var(--glass-bd-nano)",
        boxShadow: "inset 0 1px 0 var(--glass-bd-nano)",
      }}>
        <SectionHeader title="핵심 설계 생성" badge={cd ? "완료" : "필수"} color={ACCENT} />

        <ToolButton
          icon={<SvgIcon d={ICON.users} size={16} />}
          label={cd ? "핵심 설계 다시 생성" : "핵심 설계 생성"}
          sub="Want · Need · 적대자 · 스테이크 · 테마 — 한 번에 5축 확정"
          done={!!cd}
          loading={coreDesignLoading}
          color={ACCENT}
          onClick={analyzeCoreDesign}
          disabled={disabled}
          tooltip={
            "이 작품의 '이야기 엔진'을 한 페이지로 확정합니다.\n\n" +
            "• Want — 주인공이 의식적으로 추구하는 외적 목표\n" +
            "• Need — 무의식의 결핍, 마지막에 깨달아야 할 것\n" +
            "• 적대자 — 주인공의 거울 또는 약점을 정확히 찌르는 존재\n" +
            "• 스테이크 — 실패 시 잃는 외적·내적인 것\n" +
            "• 테마 — Controlling Idea + 장르 약속\n\n" +
            "확정한 5축은 Stage 3 캐릭터, Stage 4 시놉시스에서 자동으로 참조됩니다."
          }
          creditCost={cc(1)}
        />
        <ErrorMsg msg={coreDesignError} />
      </div>

      {/* ── 학습 모드 결과 — 답 대신 질문 ── */}
      {learningMode && learn && (
        <div style={{
          marginBottom: 14, padding: "14px 16px", borderRadius: 12,
          background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.25)",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>📚</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#4ECCA3", letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>학습 모드 — 답 대신 질문</span>
          </div>
          {learn.intro && (
            <div style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.6, marginBottom: 12 }}>
              {learn.intro}
            </div>
          )}
          {[
            { key: "want_questions", label: "Want — 외적 욕망", color: "#C8A84B" },
            { key: "need_questions", label: "Need — 내적 결핍", color: "#4ECCA3" },
            { key: "antagonist_questions", label: "Antagonist — 적대자", color: "#E85D75" },
            { key: "stakes_questions", label: "Stakes — 이해관계", color: "#FB923C" },
            { key: "theme_questions", label: "Theme — 테마", color: "#60A5FA" },
          ].map(g => {
            const qs = learn[g.key] || [];
            if (qs.length === 0) return null;
            return (
              <div key={g.key} style={{
                marginBottom: 8, padding: "10px 12px", borderRadius: 8,
                background: "var(--glass-nano)", border: "1px solid var(--glass-bd-nano)",
                borderLeft: `3px solid ${g.color}`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: g.color, letterSpacing: 0.5, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                  {g.label}
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--text-main)", lineHeight: 1.65 }}>
                  {qs.map((q, i) => <li key={i} style={{ marginBottom: 3 }}>{q}</li>)}
                </ul>
              </div>
            );
          })}
          {learn.after_you_answer && (
            <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 7, background: "rgba(78,204,163,0.08)", border: "1px solid rgba(78,204,163,0.2)", fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.55 }}>
              💡 {learn.after_you_answer}
            </div>
          )}
        </div>
      )}

      {/* ── 결과 ── */}
      {cd && (
        <>
          {cd.one_line && (
            <div style={{
              padding: "14px 16px", borderRadius: 12, marginBottom: 14,
              background: `linear-gradient(135deg, ${ACCENT}14, ${ACCENT}06)`,
              border: `1px solid ${ACCENT}40`,
              boxShadow: `inset 0 1px 0 ${ACCENT}1a`,
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: ACCENT, textTransform: "uppercase", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace" }}>
                이야기 엔진 한 줄
              </div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "var(--text-main)", lineHeight: 1.55, fontFamily: "'Noto Sans KR', sans-serif" }}>
                {cd.one_line}
              </div>
            </div>
          )}

          <CoreBlock
            title="① Want — 외적 욕망"
            color="#C8A84B"
            items={[
              ["Summary", cd.want?.summary],
              ["External Goal", cd.want?.external_goal, "관객이 영상으로 확인할 수 있는 구체적 목표"],
              ["Visible Proof", cd.want?.visible_proof, "‘아 이걸 원하는구나’를 관객이 알게 되는 결정적 장면"],
            ]}
          />

          <CoreBlock
            title="② Need — 내적 결핍"
            color="#4ECCA3"
            items={[
              ["Summary", cd.need?.summary],
              ["Inner Lack", cd.need?.inner_lack, "주인공이 인식 못하는 거짓 신념 / 빈자리"],
              ["Moment of Truth", cd.need?.moment_of_truth, "Need를 직면하는 결정적 순간"],
            ]}
          />

          <CoreBlock
            title="③ Antagonist — 적대자"
            color="#E85D75"
            items={[
              ["Who", cd.antagonist?.who],
              ["Method", cd.antagonist?.method, "주인공을 막는 구체적 방식"],
              ["Mirror to Protagonist", cd.antagonist?.mirror_to_protagonist, "주인공의 그림자/거울 관계"],
            ]}
          />

          <CoreBlock
            title="④ Stakes — 이해관계"
            color="#FB923C"
            items={[
              ["External", cd.stakes?.external, "실패 시 잃는 외적인 것 (직업·관계·생명·재산)"],
              ["Internal", cd.stakes?.internal, "실패 시 잃는 내적인 것 (정체성·자존감·믿음)"],
              ["Worst Case", cd.stakes?.worst_case, "최악의 시나리오"],
            ]}
          />

          <CoreBlock
            title="⑤ Theme — 테마/장르 약속"
            color="#60A5FA"
            items={[
              ["Controlling Idea", cd.theme?.controlling_idea, "McKee식 한 줄 명제"],
              ["Thematic Question", cd.theme?.thematic_question, "관객이 떠나며 곱씹게 될 질문"],
              ["Genre Promise", cd.theme?.genre_promise, "장르가 약속하는 정서적 페이오프"],
            ]}
          />

          {cd.risk_check?.length > 0 && (
            <ResultCard title="⚠ Risk Check — 이 설계의 위험 신호" color="rgba(232,93,117,0.15)">
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-main)", fontSize: 12, lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
                {cd.risk_check.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
              </ul>
            </ResultCard>
          )}

          {/* ── 다듬기(Refine) ── */}
          <div style={{
            padding: "14px 16px", borderRadius: 12, marginTop: 14, marginBottom: 8,
            background: "var(--glass-micro)", border: "1px solid var(--glass-bd-nano)",
          }}>
            <SectionHeader title="작가 피드백으로 다듬기" badge="선택" color="#C8A84B" />
            <FeedbackBox
              value={coreDesignFeedback}
              onChange={setCoreDesignFeedback}
              placeholder="예) 적대자가 너무 부드럽다 — 만수가 민혁의 콘티를 찢어버리는 결정적 장면을 넣어줘. / Want가 추상적이다 — '7월 말 단편영화제 마감'이라는 구체적 데드라인으로 바꿔줘."
            />
            <ToolButton
              icon={<SvgIcon d={ICON.edit} size={16} />}
              label="피드백 반영해 다시 생성"
              sub="현재 핵심 설계를 작가 의견에 맞게 정교화합니다 (변경하지 않은 필드는 유지)"
              loading={coreDesignRefineLoading}
              color="#C8A84B"
              onClick={refineCoreDesign}
              disabled={disabled || !coreDesignFeedback?.trim()}
              creditCost={cc(1)}
            />
          </div>
        </>
      )}
    </div></ErrorBoundary>
  );
}
