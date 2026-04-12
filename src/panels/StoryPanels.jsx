import { useState } from "react";
import { PIPELINE_ALL_QUESTIONS, PIPELINE_QUESTIONS_BY_DURATION, PIPELINE_SYNOPSIS_SYSTEM_PROMPT } from "../constants.js";
import { callClaude } from "../utils.js";

export function ValueChargePanel({ data, isMobile }) {
  const polarityColor = {
    positive_to_negative: "#E85D75",
    negative_to_positive: "#4ECCA3",
    positive_to_ironic:   "#F7A072",
  };
  const polarityLabel = {
    positive_to_negative: "긍정 → 부정 (비극적 전하)",
    negative_to_positive: "부정 → 긍정 (희망적 전하)",
    positive_to_ironic:   "긍정 → 아이러니 (반전 전하)",
  };
  const intensityColor = { "약함": "#aaa", "보통": "#45B7D1", "강렬": "#F7A072", "극렬": "#E85D75" };

  const pc = data.primary_charge || {};
  const arcColor = polarityColor[pc.polarity] || "#4ECCA3";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 핵심 가치 전하 */}
      <div style={{ padding: "18px", borderRadius: 12, border: `1px solid ${arcColor}30`, background: `${arcColor}06` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: arcColor, marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>
          PRIMARY VALUE CHARGE
        </div>
        {/* 가치 뒤집기 시각화 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 18px", borderRadius: 8, background: "var(--c-card-3)", border: "1px solid var(--c-bd-5)", fontSize: 15, fontWeight: 700, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {pc.start_pole || "?"}
          </div>
          <div style={{ fontSize: 20, color: arcColor }}>→</div>
          <div style={{ padding: "8px 18px", borderRadius: 8, background: `${arcColor}15`, border: `1px solid ${arcColor}50`, fontSize: 15, fontWeight: 700, color: arcColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {pc.end_pole || "?"}
          </div>
        </div>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {polarityLabel[pc.polarity] || ""}
          </span>
        </div>
        {pc.description && (
          <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
            {pc.description}
          </p>
        )}
      </div>

      {/* 2행: 강도 + 장르 일치 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {/* 전하 강도 */}
        {data.charge_intensity && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>CHARGE INTENSITY</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: intensityColor[data.charge_intensity.label] || "#aaa", fontFamily: "'JetBrains Mono', monospace" }}>
                {data.charge_intensity.score}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: intensityColor[data.charge_intensity.label] || "#aaa", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {data.charge_intensity.label}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--c-tx-40)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
              {data.charge_intensity.reason}
            </p>
          </div>
        )}
        {/* 장르 기대값 일치 */}
        {data.genre_value_match && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>GENRE MATCH</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16, color: data.genre_value_match.actual_match ? "#4ECCA3" : "#E85D75" }}>
                {data.genre_value_match.actual_match ? "✓" : "✗"}
              </span>
              <span style={{ fontSize: 11, color: "var(--c-tx-40)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4 }}>
                {data.genre_value_match.genre_expected}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--c-tx-40)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
              {data.genre_value_match.analysis}
            </p>
          </div>
        )}
      </div>

      {/* 2차 가치 전하들 */}
      {data.secondary_charges?.length > 0 && (
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>SECONDARY CHARGES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.secondary_charges.map((sc, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#45B7D1", background: "rgba(69,183,209,0.12)", padding: "2px 8px", borderRadius: 5, flexShrink: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {sc.arc_label}
                </span>
                <span style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{sc.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 맥키 평결 + 팁 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.mckee_verdict && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>McKEE VERDICT</div>
            <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.mckee_verdict}</p>
          </div>
        )}
        {data.strengthening_tip && (
          <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(247,160,114,0.04)", border: "1px solid rgba(247,160,114,0.18)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>STRENGTHENING TIP</div>
            <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.strengthening_tip}</p>
          </div>
        )}
        {data.missing_charge && (
          <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.18)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>MISSING CHARGE</div>
            <p style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.missing_charge}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 그림자 캐릭터 분석 컴포넌트 (Jung)
// ─────────────────────────────────────────────
export function PipelinePanel({ selectedDuration, logline, apiKey, isMobile, onResult, charHint }) {
  const indices = PIPELINE_QUESTIONS_BY_DURATION[selectedDuration] || PIPELINE_QUESTIONS_BY_DURATION.feature;
  const questions = indices.map((i) => PIPELINE_ALL_QUESTIONS[i]);
  const total = questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]); // [{questionLabel, optionId, optionLabel, optionDesc}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentQ = questions[step];
  const isComplete = answers.length === total;

  const handleOption = (opt) => {
    const newAnswers = [
      ...answers.slice(0, step),
      { questionLabel: currentQ.label, optionId: opt.id, optionLabel: opt.label, optionDesc: opt.desc },
    ];
    setAnswers(newAnswers);
    if (step < total - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setAnswers(answers.slice(0, step - 1));
    }
  };

  const handleGenerate = async () => {
    if (!logline.trim() || !apiKey) return;
    setLoading(true);
    setError("");

    const duration = PIPELINE_QUESTIONS_BY_DURATION[selectedDuration]
      ? selectedDuration
      : "feature";
    const durationInfo = { ultrashort: "초단편 (5분 이하)", shortform: "숏폼 (5~15분)", shortfilm: "단편영화 (20~40분)", webdrama: "웹드라마 파일럿 (15~30분/화)", tvdrama: "TV 드라마 1화 (60분)", feature: "장편영화 (90~120분)", miniseries: "미니시리즈 전체 (4~6화)" }[selectedDuration] || "장편영화";

    const choicesSummary = answers
      .map((a, i) => `[선택 ${i + 1}] ${a.questionLabel}: ${a.optionLabel} — ${a.optionDesc}`)
      .join("\n");

    const msg = `로그라인: "${logline.trim()}"

포맷: ${durationInfo}
${charHint ? `\n${charHint}\n` : ""}
사용자가 단계적으로 선택한 서사 요소:
${choicesSummary}

위 로그라인을 기반으로, 사용자가 선택한 서사 요소들을 모두 유기적으로 반영한 시놉시스를 생성하세요. 각 선택 요소가 이야기 속에서 자연스럽게 통합되어야 합니다.${charHint ? " 위 인물 직접 설정의 이름·역할·관계를 반드시 그대로 사용하세요." : ""}`;

    try {
      const data = await callClaude(apiKey, PIPELINE_SYNOPSIS_SYSTEM_PROMPT, msg);
      onResult(data);
    } catch (err) {
      setError(err.message || "시놉시스 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const accentColor = "#4ECCA3";
  const optionColors = ["#4ECCA3", "#45B7D1", "#a78bfa", "#F7A072"];

  return (
    <div style={{ marginTop: 4 }}>
      {/* 진행 바 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
            PIPELINE STEP {Math.min(step + 1, total)} / {total}
          </span>
          <span style={{ fontSize: 11, color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}>
            {Math.round((answers.length / total) * 100)}%
          </span>
        </div>
        <div style={{ height: 3, background: "var(--c-bd-1)", borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${(answers.length / total) * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}, #45B7D1)`,
              borderRadius: 3,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* 이전 선택 트레일 */}
      {answers.length > 0 && (
        <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {answers.map((a, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 20,
                background: `${optionColors[i % 4]}12`,
                border: `1px solid ${optionColors[i % 4]}30`,
                color: optionColors[i % 4],
                fontFamily: "'Noto Sans KR', sans-serif",
                lineHeight: 1.5,
              }}
            >
              <span style={{ opacity: 0.6 }}>{i + 1}. </span>{a.optionLabel}
            </div>
          ))}
        </div>
      )}

      {/* 현재 질문 카드 */}
      {!isComplete && (
        <div
          style={{
            background: "rgba(var(--tw),0.025)",
            borderRadius: 12,
            border: `1px solid ${accentColor}20`,
            padding: "18px 16px",
            marginBottom: 12,
          }}
        >
          {/* 질문 헤더 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: accentColor,
                  background: `${accentColor}15`,
                  padding: "2px 7px",
                  borderRadius: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Q{step + 1}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                {currentQ.label}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "var(--c-tx-28)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
              {currentQ.subtext}
            </div>
          </div>

          {/* 선택지 그리드 — 옵션 수에 따라 열 수 동적 조정 */}
          {(() => {
            const count = currentQ.options.length;
            // 6개: 데스크탑 2열 3행 / 5개: 2열, 마지막 홀수 전체폭 / 4개: 2열 2행
            const cols = isMobile ? "1fr" : "1fr 1fr";
            return (
              <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8 }}>
                {currentQ.options.map((opt, oi) => {
                  const col = optionColors[oi % optionColors.length];
                  const isSelected = answers[step]?.optionId === opt.id;
                  // 홀수 개일 때 마지막 항목 전체 폭
                  const isLastOdd = !isMobile && count % 2 !== 0 && oi === count - 1;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOption(opt)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: isSelected ? `1px solid ${col}60` : `1px solid ${col}18`,
                        background: isSelected ? `${col}10` : `${col}05`,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                        gridColumn: isLastOdd ? "1 / -1" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: col,
                            background: `${col}20`,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {opt.id}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                          {opt.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5, paddingLeft: 26 }}>
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 완료 메시지 */}
      {isComplete && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            border: `1px solid ${accentColor}30`,
            background: `${accentColor}08`,
            marginBottom: 12,
            fontSize: 13,
            color: accentColor,
            fontFamily: "'Noto Sans KR', sans-serif",
            textAlign: "center",
          }}
        >
          ✓ 모든 서사 요소 선택 완료 — 시놉시스를 생성할 준비가 되었습니다
        </div>
      )}

      {/* 하단 버튼 */}
      <div style={{ display: "flex", gap: 8 }}>
        {step > 0 && !isComplete && (
          <button
            onClick={handleBack}
            style={{
              padding: "10px 16px",
              borderRadius: 9,
              border: "1px solid var(--c-bd-4)",
              background: "var(--c-card-1)",
              color: "var(--c-tx-40)",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'Noto Sans KR', sans-serif",
              flexShrink: 0,
            }}
          >
            ← 이전
          </button>
        )}
        {isComplete && (
          <>
            <button
              onClick={() => { setStep(0); setAnswers([]); }}
              style={{
                padding: "10px 16px",
                borderRadius: 9,
                border: "1px solid var(--c-bd-4)",
                background: "var(--c-card-1)",
                color: "var(--c-tx-40)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'Noto Sans KR', sans-serif",
                flexShrink: 0,
              }}
            >
              처음부터
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                flex: 1,
                padding: "11px 16px",
                borderRadius: 9,
                border: "none",
                background: loading ? `${accentColor}20` : `linear-gradient(135deg, ${accentColor}, #45B7D1)`,
                color: loading ? "var(--c-tx-30)" : "#0d1a14",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid var(--c-tx-20)", borderTop: "2px solid var(--c-tx-70)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  시놉시스 생성 중...
                </span>
              ) : "✨ 선택한 요소로 시놉시스 생성"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.09)", border: "1px solid rgba(232,93,117,0.25)", color: "#E85D75", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 시놉시스 카드
// ─────────────────────────────────────────────
export function SynopsisCard({ synopsis, index, isSelected = false, onSelect }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const colors = ["#4ECCA3", "#45B7D1", "#F7A072", "#E85D75", "#a78bfa"];
  const color = colors[index % colors.length];

  const handleCopy = () => {
    const text = [
      `[방향 ${index + 1}] ${synopsis.direction_title}`,
      `장르/톤: ${synopsis.genre_tone}`,
      `핵심: ${synopsis.hook}`,
      "",
      synopsis.synopsis,
      "",
      "핵심 장면:",
      ...(synopsis.key_scenes || []).map((s, i) => `${i + 1}. ${s}`),
      "",
      `주제: ${synopsis.theme}`,
      `결말 유형: ${synopsis.ending_type}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: 14,
        border: isSelected ? `1px solid ${color}70` : `1px solid ${color}25`,
        background: isSelected ? `${color}06` : "rgba(var(--tw),0.02)",
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      {/* 헤더 */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "16px 20px",
          cursor: "pointer",
          borderBottom: expanded ? `1px solid ${color}18` : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: color,
                background: `${color}15`,
                padding: "2px 8px",
                borderRadius: 10,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-main)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              {synopsis.direction_title}
            </span>
            {isSelected && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: color,
                  background: `${color}20`,
                  padding: "2px 8px",
                  borderRadius: 8,
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                ✓ 확정됨
              </span>
            )}
            {synopsis.ending_type && (
              <span
                style={{
                  fontSize: 10,
                  color: "var(--c-tx-40)",
                  background: "var(--c-card-3)",
                  padding: "2px 8px",
                  borderRadius: 8,
                }}
              >
                {synopsis.ending_type}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {synopsis.genre_tone}
          </div>
        </div>
        <span style={{ color: "var(--c-tx-30)", fontSize: 14, flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* 본문 */}
      {expanded && (
        <div style={{ padding: "16px 20px" }}>
          {/* 훅 */}
          {synopsis.hook && (
            <div
              style={{
                fontSize: 13,
                color: color,
                fontWeight: 600,
                marginBottom: 14,
                padding: "8px 12px",
                background: `${color}0d`,
                borderRadius: 8,
                borderLeft: `3px solid ${color}`,
                fontFamily: "'Noto Sans KR', sans-serif",
                lineHeight: 1.6,
              }}
            >
              {synopsis.hook}
            </div>
          )}

          {/* 시놉시스 본문 */}
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.9,
              color: "var(--c-tx-75)",
              fontFamily: "'Noto Sans KR', sans-serif",
              marginBottom: 16,
              whiteSpace: "pre-line",
            }}
          >
            {synopsis.synopsis}
          </div>

          {/* 핵심 장면 */}
          {synopsis.key_scenes?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--c-tx-40)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                핵심 장면
              </div>
              {synopsis.key_scenes?.map((scene, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 7,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: `${color}20`,
                      color: color,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'JetBrains Mono', monospace",
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--c-tx-60)",
                      lineHeight: 1.65,
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    {scene}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 주제 + 복사 버튼 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              paddingTop: 12,
              borderTop: "1px solid var(--c-card-3)",
            }}
          >
            {synopsis.theme && (
              <div style={{ fontSize: 12, color: "var(--c-tx-40)", fontStyle: "italic", fontFamily: "'Noto Sans KR', sans-serif" }}>
                주제: {synopsis.theme}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              {onSelect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(); }}
                  style={{
                    padding: "5px 13px",
                    borderRadius: 7,
                    border: `1px solid ${isSelected ? color + "60" : color + "30"}`,
                    background: isSelected ? `${color}20` : `${color}08`,
                    color: isSelected ? color : "var(--c-tx-50)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 400,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  {isSelected ? "✓ 이 방향 확정됨" : "이 방향으로 결정"}
                </button>
              )}
              <button
                onClick={handleCopy}
                style={{
                  padding: "5px 13px",
                  borderRadius: 7,
                  border: `1px solid ${color}30`,
                  background: `${color}08`,
                  color: copied ? color : "var(--c-tx-40)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "✓ 복사됨" : "복사"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 비교 모드 섹션 컴포넌트
// ─────────────────────────────────────────────
export function StructureAnalysisPanel({ data, isMobile }) {
  const [activePoint, setActivePoint] = useState(null);

  if (!data) return null;

  const ACT_COLORS = ["#4ECCA3", "#C8A84B", "#E85D75"];
  const PP_COLORS = ["#64DCC8", "#C8A84B", "#45B7D1", "#E85D75", "#a78bfa", "#FB923C"];

  const maxIntensity = Math.max(...(data.emotional_arc || []).map(p => p.intensity || 0), 1);

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* Controlling Idea */}
      {data.moral_argument && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "rgba(200,168,75,0.7)", fontWeight: 700, marginBottom: 5, letterSpacing: 0.5 }}>도덕적 논증 (Truby)</div>
          <div style={{ fontSize: 13, color: "rgba(var(--tw),0.85)", lineHeight: 1.7 }}>{data.moral_argument}</div>
        </div>
      )}

      {/* Emotional Arc Visualization */}
      {data.emotional_arc && data.emotional_arc.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>감정 아크</div>
          <div style={{ position: "relative", height: 80, background: "rgba(var(--tw),0.02)", borderRadius: 10, border: "1px solid var(--c-card-3)", padding: "8px 12px", overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 100 64" preserveAspectRatio="none">
              <defs>
                <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4ECCA3" />
                  <stop offset="50%" stopColor="#C8A84B" />
                  <stop offset="100%" stopColor="#E85D75" />
                </linearGradient>
              </defs>
              <polyline
                points={data.emotional_arc.map(p => `${p.page_pct},${60 - (p.intensity / maxIntensity) * 52}`).join(" ")}
                fill="none" stroke="url(#arcGrad)" strokeWidth="1.5" strokeLinejoin="round"
              />
              {data.emotional_arc.map((p, i) => (
                <circle key={i} cx={p.page_pct} cy={60 - (p.intensity / maxIntensity) * 52} r="2" fill="#C8A84B" opacity="0.8" />
              ))}
            </svg>
            <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 12px" }}>
              {data.emotional_arc.map((p, i) => (
                <div key={i} style={{ fontSize: 8, color: "var(--c-tx-30)", textAlign: "center" }}>{p.label}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Acts */}
      {data.acts && data.acts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>막 구조</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${data.acts.length}, 1fr)`, gap: 8 }}>
            {data.acts.map((act, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: `${ACT_COLORS[i % ACT_COLORS.length]}08`, border: `1px solid ${ACT_COLORS[i % ACT_COLORS.length]}25` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ACT_COLORS[i % ACT_COLORS.length], marginBottom: 4 }}>{act.name}</div>
                <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>{act.page_range}</div>
                <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6, marginBottom: 6 }}>{act.function}</div>
                {act.protagonist_state && (
                  <div style={{ fontSize: 10, color: "rgba(200,168,75,0.7)", fontStyle: "italic" }}>"{act.protagonist_state}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plot Points */}
      {data.plot_points && data.plot_points.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>핵심 플롯 포인트</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.plot_points.map((pp, i) => {
              const color = PP_COLORS[i % PP_COLORS.length];
              const isActive = activePoint === i;
              return (
                <div key={i}>
                  <button onClick={() => setActivePoint(isActive ? null : i)} style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                    border: `1px solid ${color}${isActive ? "50" : "20"}`,
                    background: isActive ? `${color}0c` : "rgba(var(--tw),0.02)",
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  }}>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 9, color: color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>p.{pp.page}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: color }}>{pp.name}</div>
                      <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginTop: 1 }}>{pp.name_en}</div>
                    </div>
                    {pp.value_shift && (
                      <div style={{ fontSize: 10, color: "var(--c-tx-35)", flexShrink: 0 }}>{pp.value_shift}</div>
                    )}
                    <div style={{ fontSize: 10, color: "var(--c-tx-25)", flexShrink: 0 }}>{isActive ? "▲" : "▼"}</div>
                  </button>
                  {isActive && (
                    <div style={{ padding: "12px 14px", background: `${color}05`, border: `1px solid ${color}15`, borderTop: "none", borderRadius: "0 0 10px 10px", marginTop: -6 }}>
                      <div style={{ fontSize: 12, color: "var(--c-tx-75)", lineHeight: 1.7, marginBottom: 8 }}>{pp.description}</div>
                      {pp.protagonist_emotion && (
                        <div style={{ fontSize: 11, color: "rgba(200,168,75,0.8)", marginBottom: 4 }}>주인공 감정: <span style={{ color: "var(--c-tx-60)" }}>{pp.protagonist_emotion}</span></div>
                      )}
                      {pp.structural_function && (
                        <div style={{ fontSize: 11, color: "rgba(78,204,163,0.8)" }}>기능: <span style={{ color: "var(--c-tx-50)" }}>{pp.structural_function}</span></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Gaps */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {data.structural_strengths && data.structural_strengths.length > 0 && (
          <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.12)" }}>
            <div style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, marginBottom: 7, letterSpacing: 0.5 }}>구조적 강점</div>
            {data.structural_strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6, marginBottom: 4, display: "flex", gap: 6 }}>
                <span style={{ color: "#4ECCA3", flexShrink: 0 }}>+</span>{s}
              </div>
            ))}
          </div>
        )}
        {data.structural_gaps && data.structural_gaps.length > 0 && (
          <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.12)" }}>
            <div style={{ fontSize: 10, color: "#E85D75", fontWeight: 700, marginBottom: 7, letterSpacing: 0.5 }}>구조적 보완점</div>
            {data.structural_gaps.map((g, i) => (
              <div key={i} style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6, marginBottom: 4, display: "flex", gap: 6 }}>
                <span style={{ color: "#E85D75", flexShrink: 0 }}>!</span>{g}
              </div>
            ))}
          </div>
        )}
      </div>

      {data.recommended_next && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(200,168,75,0.04)", border: "1px solid rgba(200,168,75,0.15)", fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.7 }}>
          <span style={{ color: "#C8A84B", fontWeight: 700 }}>다음 단계 권고: </span>{data.recommended_next}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 테마/감정선 패널 (Theme Analysis)
// ─────────────────────────────────────────────
export function ComparableWorksPanel({ data, isMobile }) {
  const [expanded, setExpanded] = useState(null);
  if (!data) return null;

  const works = data.comparable_works || [];

  const simColor = (score) => {
    if (score >= 80) return "#E85D75";
    if (score >= 65) return "#FFD166";
    if (score >= 50) return "#4ECCA3";
    return "#60A5FA";
  };

  const simLabel = (score) => {
    if (score >= 80) return "매우 유사";
    if (score >= 65) return "상당히 유사";
    if (score >= 50) return "부분 유사";
    return "참고 수준";
  };

  return (
    <div>
      {/* 톤 레퍼런스 */}
      {data.tone_reference && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 8,
          background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#60A5FA", marginBottom: 4, letterSpacing: 0.5 }}>톤 레퍼런스</div>
          <div style={{ fontSize: 13, color: "rgba(var(--tw),0.8)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
            {data.tone_reference}
          </div>
        </div>
      )}

      {/* 유사 작품 리스트 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {works.map((w, i) => {
          const isOpen = expanded === i;
          const sc = simColor(w.similarity_score);
          return (
            <div key={i} style={{
              borderRadius: 10, border: `1px solid ${isOpen ? sc + "40" : "var(--c-bd-2)"}`,
              background: isOpen ? `${sc}06` : "rgba(var(--tw),0.02)",
              transition: "all 0.2s", overflow: "hidden",
            }}>
              {/* 헤더 클릭으로 펼치기 */}
              <button onClick={() => setExpanded(isOpen ? null : i)} style={{
                width: "100%", padding: "12px 14px", background: "none", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
              }}>
                {/* 유사도 게이지 */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: `conic-gradient(${sc} ${w.similarity_score * 3.6}deg, var(--c-bd-2) 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", background: "var(--bg-page-alt)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: sc, fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {w.similarity_score}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--tw),0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {w.title}
                    </span>
                    {w.year && (
                      <span style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {w.year}
                      </span>
                    )}
                    {w.country && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "var(--c-bd-1)", color: "var(--c-tx-40)" }}>
                        {w.country}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `${sc}18`, color: sc, fontWeight: 600 }}>
                      {simLabel(w.similarity_score)}
                    </span>
                    {(w.similarity_types || []).map((t, ti) => (
                      <span key={ti} style={{ fontSize: 10, color: "var(--c-tx-35)" }}>{t}</span>
                    ))}
                    {w.platform && (
                      <span style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {w.platform}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ color: isOpen ? sc : "var(--c-tx-20)", flexShrink: 0, fontSize: 12 }}>
                  {isOpen ? "▲" : "▼"}
                </div>
              </button>

              {/* 상세 내용 */}
              {isOpen && (
                <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {w.director_writer && (
                    <div style={{ fontSize: 11, color: "var(--c-tx-40)" }}>
                      감독/작가: {w.director_writer}
                    </div>
                  )}
                  <div style={{ background: "var(--c-card-1)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: sc, marginBottom: 5, letterSpacing: 0.5 }}>유사한 이유</div>
                    <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {w.why_comparable}
                    </div>
                  </div>
                  {w.key_difference && (
                    <div style={{ background: "var(--c-card-1)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-40)", marginBottom: 5, letterSpacing: 0.5 }}>차별점</div>
                      <div style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
                        {w.key_difference}
                      </div>
                    </div>
                  )}
                  <div style={{ background: `${sc}08`, borderRadius: 8, padding: "10px 12px", border: `1px solid ${sc}20` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: sc, marginBottom: 5, letterSpacing: 0.5 }}>참고할 점</div>
                    <div style={{ fontSize: 12, color: "var(--c-tx-75)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {w.what_to_learn}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 시장 포지셔닝 */}
      {data.market_positioning && (
        <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 9, background: "rgba(78,204,163,0.05)", border: "1px solid rgba(78,204,163,0.15)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", marginBottom: 6, letterSpacing: 0.5 }}>시장 포지셔닝</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.72)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {data.market_positioning}
          </div>
        </div>
      )}

      {/* 강점/리스크 */}
      {(data.positioning_strength || data.positioning_risk) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {data.positioning_strength && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", marginBottom: 5 }}>포지셔닝 강점</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.positioning_strength}</div>
            </div>
          )}
          {data.positioning_risk && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#E85D75", marginBottom: 5 }}>시장 리스크</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.positioning_risk}</div>
            </div>
          )}
        </div>
      )}

      {/* 타겟 */}
      {data.target_audience && (
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-40)", marginBottom: 6, letterSpacing: 0.5 }}>타겟 시청자</div>
          {data.target_audience.primary && (
            <div style={{ fontSize: 11, color: "var(--c-tx-65)", marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>
              <span style={{ color: "var(--c-tx-35)" }}>주: </span>{data.target_audience.primary}
            </div>
          )}
          {data.target_audience.secondary && (
            <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>
              <span style={{ color: "var(--c-tx-25)" }}>보조: </span>{data.target_audience.secondary}
            </div>
          )}
          {(data.target_audience.platform_fit || []).length > 0 && (
            <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
              {(data.target_audience.platform_fit || []).map((p, i) => (
                <span key={i} style={{ padding: "2px 8px", borderRadius: 5, background: "rgba(96,165,250,0.1)", color: "#60A5FA", fontSize: 10, fontWeight: 600 }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
