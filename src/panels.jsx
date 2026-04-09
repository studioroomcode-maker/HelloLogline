import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { CRITERIA_GUIDE, LABELS_KR, PANEL_EXPERTS, NARRATIVE_FRAMEWORKS, PIPELINE_ALL_QUESTIONS, PIPELINE_QUESTIONS_BY_DURATION, PIPELINE_SYNOPSIS_SYSTEM_PROMPT, PIPELINE_REFINE_SYSTEM_PROMPT, GENRES, DURATION_OPTIONS, EXAMPLE_LOGLINES, IMPROVEMENT_SYSTEM_PROMPT, WEAKNESS_FIX_SYSTEM_PROMPT, STORY_PIVOT_SYSTEM_PROMPT } from "./constants.js";
import { getGrade, getInterestLevel, formatDate, calcSectionTotal, callClaude } from "./utils.js";
import { ImprovementSchema, WeaknessFixSchema, StoryPivotSchema, SynopsisSchema } from "./schemas.js";

export function ApiKeyModal({ initialKey = "", onSave, onCancel }) {
  const [key, setKey] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid rgba(78,204,163,0.3)",
          borderRadius: 16,
          padding: 32,
          maxWidth: 440,
          width: "100%",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-main)",
            marginBottom: 8,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          🔑 API 키 설정
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--c-tx-50)",
            marginBottom: 20,
            lineHeight: 1.7,
          }}
        >
          Anthropic API 키를 입력하세요.
          <br />
          키는 로컬 프록시 서버를 통해 Anthropic에 전달되며,
          브라우저 밖으로 직접 노출되지 않습니다.
        </div>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            type={showKey ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && key.trim() && onSave(key.trim())}
            placeholder="sk-ant-api03-..."
            style={{
              width: "100%",
              padding: "12px 44px 12px 14px",
              borderRadius: 10,
              border: "1px solid var(--c-bd-5)",
              background: "var(--c-card-2)",
              color: "var(--text-main)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "var(--c-tx-40)",
              cursor: "pointer",
              fontSize: 14,
              padding: 0,
            }}
          >
            {showKey ? "🙈" : "👁"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => key.trim() && onSave(key.trim())}
            disabled={!key.trim()}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: "none",
              cursor: key.trim() ? "pointer" : "not-allowed",
              background: key.trim()
                ? "linear-gradient(135deg, #4ECCA3, #45B7D1)"
                : "var(--c-bd-1)",
              color: key.trim() ? "#0d0d1a" : "var(--c-tx-30)",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            저장
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: "11px 20px",
                borderRadius: 10,
                border: "1px solid var(--c-bd-4)",
                background: "transparent",
                color: "var(--c-tx-50)",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              취소
            </button>
          )}
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "var(--c-tx-20)",
            lineHeight: 1.6,
          }}
        >
          키가 없으신가요? console.anthropic.com 에서 발급받으세요.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GUIDE TOOLTIP
// ─────────────────────────────────────────────
export function GuideTooltip({ criterionKey }) {
  const [show, setShow] = useState(false);
  const guide = CRITERIA_GUIDE[criterionKey];
  if (!guide) return null;

  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 5 }}>
      <span
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: show ? "rgba(78,204,163,0.2)" : "var(--c-bd-3)",
          color: show ? "#4ECCA3" : "var(--c-tx-35)",
          fontSize: 9,
          cursor: "pointer",
          fontWeight: 700,
          verticalAlign: "middle",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        ?
      </span>
      {show && (
        <>
          <div
            onClick={() => setShow(false)}
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
          />
          <div
            style={{
              position: "absolute",
              left: 20,
              top: -4,
              zIndex: 100,
              width: 230,
              background: "#1a1a2e",
              border: "1px solid rgba(78,204,163,0.25)",
              borderRadius: 10,
              padding: "10px 13px",
              fontSize: 11,
              lineHeight: 1.7,
              color: "var(--c-tx-75)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            {guide}
          </div>
        </>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────
// 레이더 차트 SVG
// ─────────────────────────────────────────────
export function RadarChart({ data, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = data.length;
  const angleStep = 360 / n;
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  function polarToCart(angle, radius) {
    const a = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }

  const points = data
    .map((d, i) => {
      const p = polarToCart(i * angleStep, r * d.value);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size }}>
      {gridLevels.map((lv, li) => (
        <polygon
          key={li}
          fill="none"
          stroke="var(--c-bd-3)"
          strokeWidth={li === 4 ? 1.5 : 0.5}
          points={Array.from({ length: n }, (_, i) => {
            const p = polarToCart(i * angleStep, r * lv);
            return `${p.x},${p.y}`;
          }).join(" ")}
        />
      ))}
      {data.map((_, i) => {
        const p = polarToCart(i * angleStep, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--c-bd-1)"
            strokeWidth={0.5}
          />
        );
      })}
      <polygon
        points={points}
        fill="rgba(78,204,163,0.18)"
        stroke="#4ECCA3"
        strokeWidth={2}
      />
      {data.map((d, i) => {
        const p = polarToCart(i * angleStep, r * d.value);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3.5}
            fill="#4ECCA3"
            stroke="#1a1a2e"
            strokeWidth={1.5}
          />
        );
      })}
      {data.map((d, i) => {
        const p = polarToCart(i * angleStep, r + 22);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--c-tx-65)"
            fontSize={10}
            fontFamily="'Noto Sans KR', sans-serif"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// 스코어 바
// ─────────────────────────────────────────────
export function ScoreBar({ score, max, label, found, feedback, delay = 0, criterionKey }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColor =
    pct >= 80 ? "#4ECCA3" : pct >= 60 ? "#45B7D1" : pct >= 40 ? "#F7A072" : "#E85D75";
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        marginBottom: 12,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
          cursor: feedback ? "pointer" : "default",
        }}
        onClick={() => feedback && setExpanded(!expanded)}
      >
        <span
          style={{
            fontSize: 13,
            color: "rgba(var(--tw),0.8)",
            fontFamily: "'Noto Sans KR', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {label}
          <GuideTooltip criterionKey={criterionKey} />
          {feedback && (
            <span style={{ fontSize: 10, color: "var(--c-tx-35)", marginLeft: 3 }}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: barColor,
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          {score}/{max}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--c-bd-1)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: show ? `${pct}%` : "0%",
            background: barColor,
            borderRadius: 3,
            transition: "width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        />
      </div>
      {found && (
        <div
          style={{
            fontSize: 11,
            color: "rgba(78,204,163,0.7)",
            marginTop: 3,
            fontStyle: "italic",
          }}
        >
          감지: &ldquo;{found}&rdquo;
        </div>
      )}
      {expanded && feedback && (
        <div
          style={{
            fontSize: 12,
            color: "var(--c-tx-60)",
            marginTop: 6,
            padding: "8px 12px",
            background: "var(--c-card-1)",
            borderRadius: 8,
            borderLeft: `2px solid ${barColor}`,
            lineHeight: 1.6,
          }}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 원형 점수 게이지
// ─────────────────────────────────────────────
export function CircleGauge({ score, label, subLabel, size = 120 }) {
  const gradeInfo = label === "흥미도" ? getInterestLevel(score) : getGrade(score);
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = gradeInfo.color;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--c-bd-1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.25,0.46,0.45,0.94)" }}
        />
      </svg>
      <div
        style={{
          marginTop: -size + 10,
          height: size,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: size < 110 ? 22 : 28,
            fontWeight: 800,
            color,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 10, color: "var(--c-tx-50)", marginTop: 2 }}>{label}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginTop: 4 }}>
        {label === "흥미도"
          ? `${gradeInfo.emoji} ${gradeInfo.label}`
          : `${gradeInfo.grade}등급 · ${gradeInfo.label}`}
      </div>
      {subLabel && (
        <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginTop: 2 }}>
          {subLabel}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 점수 추이 차트 (SVG 라인 차트)
// ─────────────────────────────────────────────
export function ScoreHistoryChart({ history }) {
  if (history.length < 2) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "36px 20px",
          color: "var(--c-tx-30)",
          fontSize: 13,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        분석 기록이 2개 이상이면 추이 그래프가 표시됩니다.
      </div>
    );
  }

  const W = 560;
  const H = 200;
  const PX = 36;
  const PY = 16;
  const plotW = W - PX * 2;
  const plotH = H - PY * 2;

  // 오래된 것부터 최신 순으로, 최근 10개
  const items = [...history].reverse().slice(-10);
  const n = items.length;

  function toX(i) {
    return PX + (i / (n - 1)) * plotW;
  }
  function toY(val) {
    return PY + plotH - (val / 100) * plotH;
  }

  const qualityPts = items.map((h, i) => `${toX(i)},${toY(h.qualityScore)}`).join(" ");
  const interestPts = items.map((h, i) => `${toX(i)},${toY(h.interestScore)}`).join(" ");

  const gridY = [0, 25, 50, 75, 100];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--c-tx-55)",
          }}
        >
          <div
            style={{
              width: 20,
              height: 2,
              background: "#4ECCA3",
              borderRadius: 1,
            }}
          />
          품질 점수
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--c-tx-55)",
          }}
        >
          <div
            style={{
              width: 20,
              height: 2,
              background: "#FFD700",
              borderRadius: 1,
            }}
          />
          흥미도
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
        {gridY.map((y) => (
          <g key={y}>
            <line
              x1={PX}
              y1={toY(y)}
              x2={W - PX}
              y2={toY(y)}
              stroke="var(--c-card-3)"
              strokeWidth={1}
            />
            <text
              x={PX - 6}
              y={toY(y)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--c-tx-25)"
              fontSize={9}
            >
              {y}
            </text>
          </g>
        ))}
        {/* 품질 라인 */}
        <polyline
          points={qualityPts}
          fill="none"
          stroke="#4ECCA3"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 흥미도 라인 */}
        <polyline
          points={interestPts}
          fill="none"
          stroke="#FFD700"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 데이터 포인트 */}
        {items.map((h, i) => (
          <g key={i}>
            <circle
              cx={toX(i)}
              cy={toY(h.qualityScore)}
              r={4}
              fill="#4ECCA3"
              stroke="#0d0d1a"
              strokeWidth={1.5}
            />
            <circle
              cx={toX(i)}
              cy={toY(h.interestScore)}
              r={4}
              fill="#FFD700"
              stroke="#0d0d1a"
              strokeWidth={1.5}
            />
            <text
              x={toX(i)}
              y={H - 3}
              textAnchor="middle"
              fill="var(--c-tx-25)"
              fontSize={8}
            >
              {formatDate(h.date).split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// 분석 기록 패널
// ─────────────────────────────────────────────
export function HistoryPanel({ history, onSelect, onDelete, onClear, onClose }) {
  const handleExportJson = () => {
    if (!history.length) return;
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logline-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        background: "#0f0f1e",
        borderLeft: "1px solid var(--c-bd-1)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: "20px 20px 14px",
          borderBottom: "1px solid var(--c-bd-1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-main)",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          분석 기록 ({history.length})
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {history.length > 0 && (
            <>
              <button
                onClick={handleExportJson}
                title="JSON으로 내보내기"
                style={{
                  background: "none",
                  border: "1px solid rgba(78,204,163,0.3)",
                  color: "rgba(78,204,163,0.8)",
                  cursor: "pointer",
                  fontSize: 10,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  padding: "3px 8px",
                  borderRadius: 5,
                }}
              >
                JSON 내보내기
              </button>
              <button
                onClick={onClear}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(232,93,117,0.65)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  padding: 0,
                }}
              >
                전체 삭제
              </button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--c-tx-40)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {history.length === 0 ? (
          <div
            style={{
              padding: 28,
              textAlign: "center",
              color: "var(--c-tx-20)",
              fontSize: 13,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            아직 분석 기록이 없습니다.
          </div>
        ) : (
          history.map((entry) => {
            const qGrade = getGrade(entry.qualityScore);
            return (
              <div
                key={entry.id}
                style={{
                  position: "relative",
                  borderBottom: "1px solid var(--c-card-1)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--c-card-1)";
                  e.currentTarget.querySelector(".del-btn").style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.querySelector(".del-btn").style.opacity = "0";
                }}
              >
                {/* 클릭 가능 영역 */}
                <div
                  onClick={() => onSelect(entry)}
                  style={{ padding: "11px 40px 11px 16px", cursor: "pointer" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--c-tx-30)",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      {formatDate(entry.date)}
                    </div>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: qGrade.color,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {entry.qualityScore}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--c-tx-20)" }}>·</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#FFD700",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {entry.interestScore}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--c-tx-60)",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {entry.logline}
                  </div>
                  {entry.detectedGenre && (
                    <div
                      style={{ fontSize: 10, color: "rgba(78,204,163,0.45)", marginTop: 4 }}
                    >
                      {entry.detectedGenre}
                    </div>
                  )}
                </div>
                {/* 개별 삭제 버튼 */}
                <button
                  className="del-btn"
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: 10,
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(232,93,117,0.7)",
                    cursor: "pointer",
                    fontSize: 15,
                    lineHeight: 1,
                    padding: "4px 6px",
                    borderRadius: 5,
                    opacity: 0,
                    transition: "opacity 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,93,117,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  title="이 기록 삭제"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AI 개선안 패널
// ─────────────────────────────────────────────
export function ImprovementPanel({ logline, genre, apiKey, result, onReanalyze }) {
  const [loading, setLoading] = useState(false);
  const [improvement, setImprovement] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const genreLabel = GENRES.find((g) => g.id === genre)?.label || "자동 감지";

  const handleImprove = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError("");
    setImprovement(null);

    try {
      const weakPoints = Object.entries({
        ...result?.structure,
        ...result?.expression,
        ...result?.technical,
      })
        .filter(([, v]) => v.max > 0 && v.score / v.max < 0.6)
        .map(([k]) => LABELS_KR[k])
        .join(", ");

      const msg = `원본 로그라인:\n"${logline}"\n\n장르: ${genreLabel}\n\n⚠️ 핵심 전제 유지 필수: 위 로그라인의 인물·사건·배경은 바꾸지 말고, 아래 분석을 바탕으로 표현만 강화하세요.\n\n종합 피드백:\n${result?.overall_feedback || "-"}\n\n취약 항목: ${weakPoints || "없음"}\n\n위 분석을 바탕으로 개선된 로그라인을 작성해주세요.`;

      const data = await callClaude(apiKey, IMPROVEMENT_SYSTEM_PROMPT, msg, 5000, "claude-sonnet-4-6", null, ImprovementSchema);
      setImprovement(data);
    } catch (err) {
      setError(err.message || "개선안 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!improvement?.improved) return;
    navigator.clipboard.writeText(improvement.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 20,
        background: "rgba(69,183,209,0.04)",
        borderRadius: 12,
        border: "1px solid rgba(69,183,209,0.14)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#45B7D1",
          marginBottom: 12,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        ✨ AI 개선안
      </div>

      {!improvement && !loading && (
        <button
          onClick={handleImprove}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(69,183,209,0.3)",
            background: "rgba(69,183,209,0.07)",
            color: "#45B7D1",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(69,183,209,0.13)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(69,183,209,0.07)")
          }
        >
          분석 결과 기반으로 로그라인 개선안 받기
        </button>
      )}

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: 24,
            color: "var(--c-tx-35)",
            fontSize: 13,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          개선안을 작성하는 중...
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#E85D75",
            padding: "8px 12px",
            background: "rgba(232,93,117,0.08)",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {improvement && (
        <div>
          {/* 개선된 로그라인 */}
          <div
            style={{
              padding: 16,
              background: "var(--c-card-2)",
              borderRadius: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "var(--text-main)",
                fontFamily: "'Noto Sans KR', sans-serif",
                marginBottom: 12,
              }}
            >
              &ldquo;{improvement.improved}&rdquo;
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(78,204,163,0.3)",
                  background: "rgba(78,204,163,0.07)",
                  color: copied ? "#4ECCA3" : "var(--c-tx-60)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "✓ 복사됨" : "복사하기"}
              </button>
              {onReanalyze && improvement?.improved && (
                <button
                  onClick={() => onReanalyze(improvement.improved)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(251,146,60,0.4)",
                    background: "rgba(251,146,60,0.12)",
                    color: "#FB923C",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  ↻ 개선안으로 다시 분석
                </button>
              )}
            </div>
          </div>

          {/* 핵심 이유 */}
          {improvement.why && (
            <div
              style={{
                fontSize: 12,
                color: "var(--c-tx-50)",
                marginBottom: 12,
                padding: "10px 14px",
                background: "rgba(var(--tw),0.02)",
                borderRadius: 8,
                lineHeight: 1.7,
                borderLeft: "2px solid rgba(69,183,209,0.4)",
              }}
            >
              {improvement.why}
            </div>
          )}

          {/* 변경 사항 */}
          {improvement.changes?.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--c-tx-40)",
                  marginBottom: 7,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                변경 사항
              </div>
              {improvement.changes.map((c, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "var(--c-tx-60)",
                    padding: "7px 11px",
                    marginBottom: 5,
                    background: "rgba(var(--tw),0.02)",
                    borderRadius: 7,
                    borderLeft: "2px solid rgba(69,183,209,0.3)",
                    lineHeight: 1.6,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setImprovement(null)}
            style={{
              marginTop: 12,
              background: "none",
              border: "none",
              color: "var(--c-tx-30)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "'Noto Sans KR', sans-serif",
              padding: 0,
            }}
          >
            다시 생성
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 이야기 발전 패널 (약점 수정 + 방향 전환)
// ─────────────────────────────────────────────
export function StoryDevPanel({ logline, genre, result, apiKey, onApply }) {
  const [fixState, setFixState] = useState("idle"); // idle|loading|done|error
  const [fixes, setFixes] = useState([]);
  const [fixError, setFixError] = useState("");
  const [pivotState, setPivotState] = useState("idle");
  const [pivots, setPivots] = useState([]);
  const [pivotError, setPivotError] = useState("");

  const genreLabel = GENRES.find((g) => g.id === genre)?.label || "자동 감지";

  // 약점 항목 추출 (점수 낮은 순 상위 3개)
  const weakItems = Object.entries({
    ...(result?.structure || {}),
    ...(result?.expression || {}),
    ...(result?.technical || {}),
  })
    .filter(([, v]) => v?.max > 0)
    .map(([k, v]) => ({ key: k, label: LABELS_KR[k] || k, ratio: v.score / v.max }))
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3)
    .map((i) => `${i.label} (${Math.round(i.ratio * 100)}%)`)
    .join(", ");

  const handleFix = async () => {
    setFixState("loading");
    setFixError("");
    try {
      const msg = `원본 로그라인: "${logline}"\n장르: ${genreLabel}\n\n⚠️ 핵심 전제 유지 필수: 위 로그라인의 인물·사건·배경은 바꾸지 말고 아래 취약점만 개선하세요.\n\n취약 항목 (점수 낮은 순): ${weakItems}\n\n종합 피드백: ${result?.overall_feedback || "-"}`;
      const data = await callClaude(apiKey, WEAKNESS_FIX_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", null, WeaknessFixSchema);
      setFixes(data.fixes || []);
      setFixState("done");
    } catch (e) {
      setFixError(e.message);
      setFixState("error");
    }
  };

  const handlePivot = async () => {
    setPivotState("loading");
    setPivotError("");
    try {
      const msg = `원본 로그라인: "${logline}"\n장르: ${genreLabel}\n\n⚠️ 핵심 전제 유지 필수: 위 로그라인의 핵심 상황(인물·사건·배경)은 그대로 두고, 장르·톤·관점만 바꿔서 3가지 버전을 제시하세요.\n\n현재 분석 요약:\n- 종합 피드백: ${result?.overall_feedback || "-"}\n- 주요 강점: ${result?.strengths?.join(", ") || "-"}\n- 주요 약점: ${result?.weaknesses?.join(", ") || "-"}`;
      const data = await callClaude(apiKey, STORY_PIVOT_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-4-6", null, StoryPivotSchema);
      setPivots(data.pivots || []);
      setPivotState("done");
    } catch (e) {
      setPivotError(e.message);
      setPivotState("error");
    }
  };

  const cardStyle = {
    padding: "14px 16px",
    background: "var(--c-card-1)",
    borderRadius: 10,
    marginBottom: 10,
    border: "1px solid var(--c-bd-2)",
  };

  const applyBtnStyle = (color) => ({
    padding: "5px 13px",
    borderRadius: 7,
    border: `1px solid ${color}55`,
    background: `${color}18`,
    color: color,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'Noto Sans KR', sans-serif",
  });

  return (
    <div style={{ marginTop: 24 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)", letterSpacing: -0.3 }}>
          이야기 발전시키기
        </div>
        <div style={{ fontSize: 11, color: "var(--c-tx-30)", fontFamily: "'Noto Sans KR', sans-serif" }}>
          분석 결과를 바탕으로 개발 방향을 선택하세요
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* ── 약점 집중 수정 ── */}
        <div style={{ padding: 18, background: "rgba(248,113,113,0.05)", borderRadius: 12, border: "1px solid rgba(248,113,113,0.15)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F87171", marginBottom: 6 }}>🔧 약점 집중 수정</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 14, lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
            점수 낮은 항목만 골라 그 문제를 직접 고친 버전 제안
          </div>

          {fixState === "idle" && (
            <button
              onClick={handleFix}
              disabled={!apiKey || !result}
              style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.1)", color: "#F87171", cursor: apiKey && result ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif", opacity: apiKey && result ? 1 : 0.4 }}
            >
              약점 수정안 생성
            </button>
          )}
          {fixState === "loading" && (
            <div style={{ textAlign: "center", color: "var(--c-tx-40)", fontSize: 12, padding: "12px 0", fontFamily: "'Noto Sans KR', sans-serif" }}>분석 중…</div>
          )}
          {fixState === "error" && (
            <div style={{ fontSize: 11, color: "#F87171", fontFamily: "'Noto Sans KR', sans-serif" }}>{fixError}</div>
          )}
          {fixState === "done" && fixes.map((fix, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F87171", marginBottom: 4 }}>
                {fix.weakness}
              </div>
              <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
                {fix.score_issue}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-main)", marginBottom: 10, lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
                "{fix.fixed_logline}"
              </div>
              <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif" }}>
                → {fix.key_change}
              </div>
              {onApply && (
                <button onClick={() => onApply(fix.fixed_logline)} style={applyBtnStyle("#F87171")}>
                  ↻ 이걸로 분석
                </button>
              )}
            </div>
          ))}
          {fixState === "done" && (
            <button onClick={() => setFixState("idle")} style={{ background: "none", border: "none", color: "var(--c-tx-25)", cursor: "pointer", fontSize: 11, marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>
              다시 생성
            </button>
          )}
        </div>

        {/* ── 방향 전환 ── */}
        <div style={{ padding: 18, background: "rgba(139,92,246,0.05)", borderRadius: 12, border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA", marginBottom: 6 }}>🔀 방향 전환</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 14, lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
            같은 전제로 완전히 다른 각도 3가지 탐색
          </div>

          {pivotState === "idle" && (
            <button
              onClick={handlePivot}
              disabled={!apiKey || !result}
              style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: "1px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.1)", color: "#A78BFA", cursor: apiKey && result ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif", opacity: apiKey && result ? 1 : 0.4 }}
            >
              방향 전환안 생성
            </button>
          )}
          {pivotState === "loading" && (
            <div style={{ textAlign: "center", color: "var(--c-tx-40)", fontSize: 12, padding: "12px 0", fontFamily: "'Noto Sans KR', sans-serif" }}>탐색 중…</div>
          )}
          {pivotState === "error" && (
            <div style={{ fontSize: 11, color: "#A78BFA", fontFamily: "'Noto Sans KR', sans-serif" }}>{pivotError}</div>
          )}
          {pivotState === "done" && pivots.map((pivot, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", marginBottom: 6 }}>
                {pivot.label}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-main)", marginBottom: 8, lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
                "{pivot.pivot_logline}"
              </div>
              <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
                {pivot.why_interesting}
              </div>
              {onApply && (
                <button onClick={() => onApply(pivot.pivot_logline)} style={applyBtnStyle("#A78BFA")}>
                  ↻ 이걸로 분석
                </button>
              )}
            </div>
          ))}
          {pivotState === "done" && (
            <button onClick={() => setPivotState("idle")} style={{ background: "none", border: "none", color: "var(--c-tx-25)", cursor: "pointer", fontSize: 11, marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>
              다시 생성
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 텍스트 내보내기 버튼
// ─────────────────────────────────────────────
export function ExportButton({ result, logline, qualityScore, interestScore }) {
  const [copied, setCopied] = useState(false);

  const buildLines = () => {
    const grade = getGrade(qualityScore);
    const interest = getInterestLevel(interestScore);
    const sTotal = calcSectionTotal(result, "structure");
    const eTotal = calcSectionTotal(result, "expression");
    const tTotal = calcSectionTotal(result, "technical");
    return [
      "=== 로그라인 분석 결과 ===",
      `날짜: ${new Date().toLocaleString("ko-KR")}`,
      `감지 장르: ${result.detected_genre || "-"}`,
      "",
      "[ 로그라인 ]",
      `"${logline}"`,
      "",
      `[ 품질 점수 ] ${qualityScore}/100 — ${grade.grade}등급 (${grade.label})`,
      `[ 흥미도    ] ${interestScore}/100 — ${interest.label}`,
      "",
      "─── A. 구조적 완성도 ─────────────────",
      ...Object.entries(result.structure || {}).map(([k, v]) => `  ${LABELS_KR[k]}: ${v.score}/${v.max}  ${v.feedback || ""}`),
      `  소계: ${sTotal}/50`,
      "",
      "─── B. 표현적 매력도 ─────────────────",
      ...Object.entries(result.expression || {}).map(([k, v]) => `  ${LABELS_KR[k]}: ${v.score}/${v.max}  ${v.feedback || ""}`),
      `  소계: ${eTotal}/30`,
      "",
      "─── C. 기술적 완성도 ─────────────────",
      ...Object.entries(result.technical || {}).map(([k, v]) => `  ${LABELS_KR[k]}: ${v.score}/${v.max}  ${v.feedback || ""}`),
      `  소계: ${tTotal}/20`,
      "",
      "─── D. 흥미 유발 지수 ────────────────",
      ...Object.entries(result.interest || {}).map(([k, v]) => `  ${LABELS_KR[k]}: ${v.score}/${v.max}  ${v.feedback || ""}`),
      `  소계: ${interestScore}/100`,
      "",
      "─── 종합 피드백 ──────────────────────",
      result.overall_feedback || "",
      "",
      "─── 개선 질문 ────────────────────────",
      ...(result.improvement_questions || []).map((q, i) => `${i + 1}. ${q}`),
      "",
      "Generated by 로그라인 분석기 · Powered by Claude",
    ];
  };

  const handleExport = () => {
    if (!result) return;
    navigator.clipboard.writeText(buildLines().join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePdf = () => {
    if (!result) return;
    const grade = getGrade(qualityScore);
    const interest = getInterestLevel(interestScore);
    const sTotal = calcSectionTotal(result, "structure");
    const eTotal = calcSectionTotal(result, "expression");
    const tTotal = calcSectionTotal(result, "technical");
    const date = new Date().toLocaleString("ko-KR");

    const scoreBar = (score, max, color) => {
      const pct = Math.round((score / max) * 100);
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <div style="flex:1;height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:3px"></div>
        </div>
        <span style="font-size:11px;color:#374151;min-width:40px;text-align:right">${score}/${max}</span>
      </div>`;
    };

    const sectionRows = (obj) => Object.entries(obj || {}).map(([k, v]) =>
      `<tr>
        <td style="padding:6px 10px;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6">${LABELS_KR[k] || k}</td>
        <td style="padding:6px 10px;text-align:center;font-size:12px;font-weight:700;color:#1f2937;border-bottom:1px solid #f3f4f6">${v.score}/${v.max}</td>
        <td style="padding:6px 10px;font-size:11px;color:#6b7280;border-bottom:1px solid #f3f4f6">${v.feedback || ""}</td>
      </tr>`
    ).join("");

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>로그라인 분석 결과 — ${date}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; background: #fff; color: #111; padding: 36px 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: 700; color: #374151; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #f3f4f6; }
  .meta { font-size: 11px; color: #9ca3af; margin-bottom: 20px; }
  .logline-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px; font-size: 14px; line-height: 1.7; color: #1f2937; margin-bottom: 20px; }
  .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .score-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; text-align: center; }
  .score-num { font-size: 32px; font-weight: 900; color: #111827; }
  .score-label { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .score-grade { font-size: 13px; font-weight: 700; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th { padding: 7px 10px; background: #f3f4f6; font-size: 11px; color: #6b7280; text-align: left; border-bottom: 1px solid #e5e7eb; }
  .feedback-box { background: #f9fafb; border-left: 3px solid #c8a84b; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 13px; line-height: 1.7; color: #374151; margin-bottom: 16px; }
  .question-item { font-size: 12px; color: #374151; padding: 7px 0; border-bottom: 1px solid #f3f4f6; }
  .footer { margin-top: 32px; font-size: 10px; color: #d1d5db; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>로그라인 분석 결과</h1>
  <div class="meta">${date} &nbsp;|&nbsp; 감지 장르: ${result.detected_genre || "-"}</div>

  <div class="logline-box">"${logline}"</div>

  <div class="score-grid">
    <div class="score-card">
      <div class="score-num" style="color:${grade.color}">${qualityScore}</div>
      <div class="score-label">품질 점수 / 100</div>
      <div class="score-grade" style="color:${grade.color}">${grade.grade}등급 · ${grade.label}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:4px">구조${sTotal} + 표현${eTotal} + 기술${tTotal}</div>
    </div>
    <div class="score-card">
      <div class="score-num" style="color:#45B7D1">${interestScore}</div>
      <div class="score-label">흥미도 / 100</div>
      <div class="score-grade" style="color:#45B7D1">${interest.label}</div>
      <div style="font-size:11px;color:#9ca3af;margin-top:4px">정보격차 이론 기반</div>
    </div>
  </div>

  <h2>A. 구조적 완성도 &nbsp;<span style="font-weight:400;color:#9ca3af">${sTotal}/50</span></h2>
  <table><thead><tr><th>항목</th><th style="text-align:center;width:60px">점수</th><th>피드백</th></tr></thead><tbody>${sectionRows(result.structure)}</tbody></table>

  <h2>B. 표현적 매력도 &nbsp;<span style="font-weight:400;color:#9ca3af">${eTotal}/30</span></h2>
  <table><thead><tr><th>항목</th><th style="text-align:center;width:60px">점수</th><th>피드백</th></tr></thead><tbody>${sectionRows(result.expression)}</tbody></table>

  <h2>C. 기술적 완성도 &nbsp;<span style="font-weight:400;color:#9ca3af">${tTotal}/20</span></h2>
  <table><thead><tr><th>항목</th><th style="text-align:center;width:60px">점수</th><th>피드백</th></tr></thead><tbody>${sectionRows(result.technical)}</tbody></table>

  <h2>D. 흥미 유발 지수 &nbsp;<span style="font-weight:400;color:#9ca3af">${interestScore}/100</span></h2>
  <table><thead><tr><th>항목</th><th style="text-align:center;width:60px">점수</th><th>피드백</th></tr></thead><tbody>${sectionRows(result.interest)}</tbody></table>

  <h2>종합 피드백</h2>
  <div class="feedback-box">${result.overall_feedback || ""}</div>

  <h2>개선 질문</h2>
  ${(result.improvement_questions || []).map((q, i) => `<div class="question-item">${i + 1}. ${q}</div>`).join("")}

  <div class="footer">Generated by 로그라인 분석기 &nbsp;·&nbsp; Powered by Claude AI (Anthropic)</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
      <button
        onClick={handleExport}
        style={{
          padding: "7px 16px", borderRadius: 8,
          border: "1px solid var(--c-bd-4)",
          background: "var(--c-card-1)",
          color: copied ? "#4ECCA3" : "var(--c-tx-45)",
          cursor: "pointer", fontSize: 12,
          fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s",
        }}
      >
        {copied ? "✓ 클립보드에 복사됨" : "텍스트로 내보내기"}
      </button>
      <button
        onClick={handlePdf}
        style={{
          padding: "7px 16px", borderRadius: 8,
          border: "1px solid rgba(200,168,75,0.3)",
          background: "rgba(200,168,75,0.06)",
          color: "rgba(200,168,75,0.8)",
          cursor: "pointer", fontSize: 12,
          fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s",
        }}
      >
        PDF로 내보내기
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 학술 분석 패널
// ─────────────────────────────────────────────
export function TheorySection({ title, ref: refText, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 10, borderRadius: 12, border: `1px solid ${color}20`, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "12px 16px", cursor: "pointer", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          background: open ? `${color}0a` : "rgba(var(--tw),0.01)",
          transition: "background 0.2s",
        }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{title}</span>
          {refText && (
            <span style={{ fontSize: 10, color: "var(--c-tx-30)", marginLeft: 10, fontFamily: "'JetBrains Mono', monospace" }}>
              {refText}
            </span>
          )}
        </div>
        <span style={{ color: "var(--c-tx-30)", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ padding: "14px 16px", borderTop: `1px solid ${color}15` }}>{children}</div>}
    </div>
  );
}

export function AcademicScoreBar({ label, score, max, analysis, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColor = pct >= 80 ? "#4ECCA3" : pct >= 60 ? "#45B7D1" : pct >= 40 ? "#F7A072" : "#E85D75";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor, fontFamily: "'JetBrains Mono', monospace" }}>{score}/{max}</span>
      </div>
      <div style={{ height: 5, background: "var(--c-bd-1)", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3 }} />
      </div>
      {analysis && (
        <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{analysis}</div>
      )}
    </div>
  );
}

export function AcademicFieldRow({ label, value, analysis }) {
  if (!value && !analysis) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-40)", display: "block", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      {value && <div style={{ fontSize: 12, color: "var(--c-tx-75)", marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>{value}</div>}
      {analysis && <div style={{ fontSize: 12, color: "var(--c-tx-50)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{analysis}</div>}
    </div>
  );
}

export function AcademicPanel({ academic }) {
  if (!academic) return null;
  const { aristotle, propp, campbell, todorov, barthes, freytag, zillmann, smith, korean_aesthetics, integrated_assessment } = academic;

  return (
    <div>
      {/* 아리스토텔레스 시학 */}
      <TheorySection title="아리스토텔레스 시학" ref="Poetics, c.335 BCE" color="#FFD700" defaultOpen={true}>
        <AcademicFieldRow label="하마르티아 (Hamartia)" value={aristotle?.hamartia?.detected} analysis={aristotle?.hamartia?.analysis} />
        <AcademicFieldRow label="페리페테이아 (Peripeteia)" value={aristotle?.peripeteia?.detected} analysis={aristotle?.peripeteia?.analysis} />
        <AcademicFieldRow label="아나그노리시스 (Anagnorisis)" value={aristotle?.anagnorisis?.detected} analysis={aristotle?.anagnorisis?.analysis} />
        <div style={{ marginTop: 8 }}>
          <AcademicScoreBar label="카타르시스 잠재력" score={aristotle?.catharsis_potential?.score || 0} max={10} analysis={aristotle?.catharsis_potential?.analysis} />
          <AcademicScoreBar label="미메시스 완성도" score={aristotle?.mimesis_quality?.score || 0} max={10} analysis={aristotle?.mimesis_quality?.analysis} />
          <AcademicScoreBar label="행동의 통일성 (Unity of Action)" score={aristotle?.unity_of_action?.score || 0} max={10} analysis={aristotle?.unity_of_action?.analysis} />
        </div>
      </TheorySection>

      {/* 캠벨 영웅 여정 */}
      <TheorySection title="캠벨 영웅의 여정 (모노미스)" ref="The Hero with a Thousand Faces, 1949" color="#4ECCA3">
        <AcademicFieldRow label="감지된 여정 단계" value={campbell?.detected_departure_stage} />
        <AcademicFieldRow label="영웅 원형" value={campbell?.hero_archetype} />
        <AcademicFieldRow label="그림자 원형 (Shadow)" value={campbell?.shadow_archetype} />
        <AcademicFieldRow label="모험의 부름 (Call to Adventure)" analysis={campbell?.call_to_adventure} />
        <AcademicFieldRow label="경계 (Threshold)" analysis={campbell?.threshold} />
        <AcademicFieldRow label="귀환 영약 (Elixir) 예측" analysis={campbell?.elixir} />
        <div style={{ marginTop: 8 }}>
          <AcademicScoreBar label="모노미스 구조 정합성" score={campbell?.monomyth_alignment?.score || 0} max={10} analysis={campbell?.monomyth_alignment?.analysis} />
        </div>
      </TheorySection>

      {/* 프롭 민담 형태론 */}
      <TheorySection title="프롭 민담 형태론" ref="Morphology of the Folktale, 1928/1968" color="#45B7D1">
        {propp?.detected_functions?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-40)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>감지된 서사 기능</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {propp.detected_functions.map((fn, i) => (
                <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(69,183,209,0.12)", color: "#45B7D1", fontFamily: "'JetBrains Mono', monospace" }}>{fn}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["영웅 (Hero)", propp?.character_spheres?.hero],
            ["악당 (Villain)", propp?.character_spheres?.villain],
            ["증여자 (Donor)", propp?.character_spheres?.donor],
            ["조력자 (Helper)", propp?.character_spheres?.helper],
            ["목표 대상 (Sought Person)", propp?.character_spheres?.sought_person],
            ["파견자 (Dispatcher)", propp?.character_spheres?.dispatcher],
          ].map(([label, val], i) => val ? (
            <div key={i} style={{ padding: "8px 10px", background: "rgba(var(--tw),0.02)", borderRadius: 8, border: "1px solid rgba(69,183,209,0.1)" }}>
              <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
            </div>
          ) : null)}
        </div>
        {propp?.character_spheres?.false_hero && (
          <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(232,93,117,0.06)", borderRadius: 8, border: "1px solid rgba(232,93,117,0.15)" }}>
            <div style={{ fontSize: 10, color: "rgba(232,93,117,0.6)", marginBottom: 3 }}>가짜 영웅 (False Hero)</div>
            <div style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.5 }}>{propp.character_spheres.false_hero}</div>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <AcademicScoreBar label="서사 완결성" score={propp?.narrative_completeness?.score || 0} max={10} analysis={propp?.narrative_completeness?.analysis} />
        </div>
      </TheorySection>

      {/* 토도로프 */}
      <TheorySection title="토도로프 서사 이론" ref="The Poetics of Prose, 1977" color="#F7A072">
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 14, overflowX: "auto" }}>
          {[
            { label: "초기 평형", val: todorov?.initial_equilibrium, color: "#4ECCA3" },
            { label: "파열", val: todorov?.disruption, color: "#E85D75" },
            { label: "인식", val: todorov?.recognition, color: "#F7A072" },
            { label: "회복 시도", val: todorov?.repair_attempt, color: "#45B7D1" },
            { label: "새로운 평형", val: todorov?.new_equilibrium, color: "#4ECCA3" },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center", minWidth: 80, maxWidth: 100 }}>
                <div style={{ fontSize: 10, color: step.color, fontWeight: 700, marginBottom: 4 }}>{step.label}</div>
                <div style={{ fontSize: 10, color: "var(--c-tx-50)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {step.val ? (step.val.length > 30 ? step.val.slice(0, 30) + "…" : step.val) : "-"}
                </div>
              </div>
              {i < arr.length - 1 && <div style={{ fontSize: 14, color: "var(--c-tx-20)", margin: "0 4px", flexShrink: 0 }}>→</div>}
            </div>
          ))}
        </div>
      </TheorySection>

      {/* 바르트 서사 코드 */}
      <TheorySection title="바르트 서사 코드" ref="S/Z, 1970" color="#a78bfa">
        {[
          ["HER · 헤르메네우틱 코드", barthes?.hermeneutic_code, "수수께끼·질문·서스펜스"],
          ["ACT · 프로아이레틱 코드", barthes?.proairetic_code, "행동 시퀀스·인과"],
          ["SEM · 세믹 코드", barthes?.semic_code, "함축 의미·분위기"],
          ["SYM · 상징 코드", barthes?.symbolic_code, "이항 대립 구조"],
          ["REF · 문화 코드", barthes?.cultural_code, "공유 문화 지식"],
        ].map(([label, val, sub], i) => (
          <div key={i} style={{ marginBottom: 10, padding: "9px 12px", background: "rgba(var(--tw),0.02)", borderRadius: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>{label}</span>
              <span style={{ fontSize: 10, color: "var(--c-tx-25)" }}>{sub}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{val || "-"}</div>
          </div>
        ))}
      </TheorySection>

      {/* 프라이탁 피라미드 */}
      <TheorySection title="프라이탁 피라미드" ref="Die Technik des Dramas, 1863" color="#45B7D1">
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[
            { label: "발단", val: freytag?.exposition, w: "15%" },
            { label: "전개", val: freytag?.rising_action, w: "25%" },
            { label: "절정", val: freytag?.climax, w: "20%" },
            { label: "하강", val: freytag?.falling_action, w: "20%" },
            { label: "대단원", val: freytag?.denouement, w: "20%" },
          ].map((step, i) => (
            <div key={i} style={{ flex: 1, padding: "8px 6px", background: "rgba(69,183,209,0.06)", borderRadius: 8, border: "1px solid rgba(69,183,209,0.12)", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#45B7D1", marginBottom: 4 }}>{step.label}</div>
              <div style={{ fontSize: 10, color: "var(--c-tx-50)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
                {step.val ? (step.val.length > 25 ? step.val.slice(0, 25) + "…" : step.val) : "-"}
              </div>
            </div>
          ))}
        </div>
      </TheorySection>

      {/* 질만 + 스미스 */}
      <TheorySection title="심리학적 분석" ref="Zillmann (1983) · Smith (1995)" color="#4ECCA3">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-40)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>질만 흥분 전이 이론</div>
          <AcademicFieldRow label="각성 메커니즘" analysis={zillmann?.arousal_mechanism} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>예측 각성 강도:</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
              background: zillmann?.predicted_arousal_intensity?.includes("높음") ? "rgba(232,93,117,0.15)" : "rgba(247,160,114,0.12)",
              color: zillmann?.predicted_arousal_intensity?.includes("높음") ? "#E85D75" : "#F7A072",
            }}>
              {zillmann?.predicted_arousal_intensity || "-"}
            </span>
            <span style={{ fontSize: 11, color: "var(--c-tx-40)", fontFamily: "'Noto Sans KR', sans-serif" }}>{zillmann?.dominant_emotion}</span>
          </div>
          <AcademicFieldRow label="전이 잠재력" analysis={zillmann?.transfer_potential} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-40)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>스미스 관객 참여 이론</div>
          <AcademicScoreBar label="인식 (Recognition)" score={smith?.recognition?.score || 0} max={10} analysis={smith?.recognition?.analysis} />
          <AcademicScoreBar label="정렬 (Alignment)" score={smith?.alignment?.score || 0} max={10} analysis={smith?.alignment?.analysis} />
          <AcademicScoreBar label="충성 (Allegiance)" score={smith?.allegiance?.score || 0} max={10} analysis={smith?.allegiance?.analysis} />
        </div>
      </TheorySection>

      {/* 한국 서사 미학 */}
      <TheorySection title="한국 서사 미학" ref="이효인 (1992) · 김소영 (2000)" color="#f472b6">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[
            { key: "han", label: "한(恨)", val: korean_aesthetics?.han },
            { key: "jeong", label: "정(情)", val: korean_aesthetics?.jeong },
            { key: "sinmyeong", label: "신명(神明)", val: korean_aesthetics?.sinmyeong },
            { key: "nunchi", label: "눈치(Nunchi)", val: korean_aesthetics?.nunchi },
          ].map(({ label, val }) => (
            <div key={label} style={{
              padding: "5px 12px", borderRadius: 20,
              background: val?.present ? "rgba(244,114,182,0.12)" : "var(--c-card-1)",
              border: val?.present ? "1px solid rgba(244,114,182,0.35)" : "1px solid var(--c-bd-2)",
              color: val?.present ? "#f472b6" : "var(--c-tx-30)",
              fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              {val?.present ? "✓ " : ""}{label}
            </div>
          ))}
        </div>
        {[
          ["한(恨)", korean_aesthetics?.han?.analysis],
          ["정(情)", korean_aesthetics?.jeong?.analysis],
          ["신명(神明)", korean_aesthetics?.sinmyeong?.analysis],
          ["눈치(Nunchi)", korean_aesthetics?.nunchi?.analysis],
        ].filter(([, v]) => v && v !== "감지되지 않음").map(([label, val], i) => (
          <div key={i} style={{ marginBottom: 8, padding: "8px 12px", background: "rgba(244,114,182,0.04)", borderRadius: 8, borderLeft: "2px solid rgba(244,114,182,0.3)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(244,114,182,0.7)", marginRight: 6 }}>{label}</span>
            <span style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</span>
          </div>
        ))}
        <AcademicScoreBar label="한국 서사 정서 친화도" score={korean_aesthetics?.korean_narrative_strength?.score || 0} max={10} analysis={korean_aesthetics?.korean_narrative_strength?.analysis} color="#f472b6" />
      </TheorySection>

      {/* 종합 학술 평가 */}
      {integrated_assessment && (
        <div style={{ marginTop: 16, padding: 18, background: "rgba(var(--tw),0.02)", borderRadius: 12, border: "1px solid var(--c-bd-2)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>종합 학술 평가</div>
          {integrated_assessment.dominant_theory_fit && (
            <div style={{ fontSize: 11, color: "rgba(78,204,163,0.7)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif" }}>
              최적 이론: {integrated_assessment.dominant_theory_fit}
            </div>
          )}
          <div style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(var(--tw),0.72)", marginBottom: 14, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {integrated_assessment.theoretical_verdict}
          </div>
          {integrated_assessment.strengths?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4ECCA3", marginBottom: 6 }}>이론적 강점</div>
              {integrated_assessment.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--c-tx-60)", padding: "5px 10px", marginBottom: 4, background: "rgba(78,204,163,0.05)", borderRadius: 6, borderLeft: "2px solid rgba(78,204,163,0.3)", lineHeight: 1.6 }}>{s}</div>
              ))}
            </div>
          )}
          {integrated_assessment.weaknesses?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#E85D75", marginBottom: 6 }}>이론적 약점</div>
              {integrated_assessment.weaknesses.map((w, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--c-tx-60)", padding: "5px 10px", marginBottom: 4, background: "rgba(232,93,117,0.05)", borderRadius: 6, borderLeft: "2px solid rgba(232,93,117,0.3)", lineHeight: 1.6 }}>{w}</div>
              ))}
            </div>
          )}
          {integrated_assessment.academic_recommendation && (
            <div style={{ padding: "10px 14px", background: "rgba(167,139,250,0.05)", borderRadius: 8, border: "1px solid rgba(167,139,250,0.15)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>학술적 개선 제언</div>
              <div style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{integrated_assessment.academic_recommendation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 진정성 지수 컴포넌트 (Sartre + Camus + Heidegger + Kierkegaard)
// ─────────────────────────────────────────────
export function AuthenticityPanel({ data, isMobile }) {
  const scoreColor = data.authenticity_score >= 75 ? "#4ECCA3"
    : data.authenticity_score >= 50 ? "#F7A072"
    : data.authenticity_score >= 25 ? "#E85D75"
    : "#888";

  const stageColor = { "심미적": "#F7A072", "윤리적": "#45B7D1", "종교적": "#a78bfa" };
  const absurdColor = { "반항": "#4ECCA3", "도피": "#E85D75", "수용": "#45B7D1" };

  const mf = data.mauvaise_foi || {};
  const gc = data.genuine_choice || {};
  const og = data.other_gaze || {};
  const abs = data.absurdity || {};
  const kk = data.kierkegaard_stage || {};
  const nz = data.nietzsche_connection || {};
  const ft = data.facticity || {};

  const stage = (kk.stage || "").split("(")[0].trim();
  const absResponse = (abs.response || "").split("(")[0].trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 진정성 점수 */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px", borderRadius: 12, border: `1px solid ${scoreColor}30`, background: `${scoreColor}06`, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: scoreColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
            {data.authenticity_score ?? "?"}
          </div>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>AUTHENTICITY</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: scoreColor, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 6 }}>
            {data.authenticity_label}
          </div>
          {/* 점수 바 */}
          <div style={{ height: 4, background: "var(--c-bd-1)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${data.authenticity_score ?? 0}%`, background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})`, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ fontSize: 9, color: "var(--c-tx-20)", fontFamily: "'JetBrains Mono', monospace" }}>자기기만</span>
            <span style={{ fontSize: 9, color: "var(--c-tx-20)", fontFamily: "'JetBrains Mono', monospace" }}>실존적 각성</span>
          </div>
        </div>
      </div>

      {/* 피투성 + 자기기만 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-3)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>FACTICITY — 피투성 (Heidegger)</div>
          <p style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", margin: "0 0 6px" }}>{ft.description}</p>
          {ft.response_to_facticity && (
            <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>반응 방식: {ft.response_to_facticity}</div>
          )}
        </div>
        <div style={{ padding: "14px", borderRadius: 10, background: mf.present ? "rgba(232,93,117,0.05)" : "rgba(78,204,163,0.05)", border: mf.present ? "1px solid rgba(232,93,117,0.2)" : "1px solid rgba(78,204,163,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: mf.present ? "#E85D75" : "#4ECCA3", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>MAUVAISE FOI (Sartre)</div>
            <span style={{ fontSize: 10, color: mf.present ? "#E85D75" : "#4ECCA3", fontWeight: 700 }}>{mf.present ? "감지됨" : "없음"}</span>
          </div>
          {mf.elements?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              {mf.elements.map((el, i) => (
                <div key={i} style={{ fontSize: 10, color: "rgba(232,93,117,0.7)", background: "rgba(232,93,117,0.08)", padding: "2px 7px", borderRadius: 5, marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>· {el}</div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{mf.description}</p>
        </div>
      </div>

      {/* 진정한 선택 */}
      <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>GENUINE CHOICE</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: gc.has_real_choice ? "#4ECCA3" : "#E85D75", background: gc.has_real_choice ? "rgba(78,204,163,0.12)" : "rgba(232,93,117,0.12)", padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {gc.has_real_choice ? "진짜 선택" : "선택 부재"}
          </span>
          {gc.responsibility_acknowledged !== undefined && (
            <span style={{ fontSize: 10, color: gc.responsibility_acknowledged ? "#4ECCA3" : "#E85D75", fontFamily: "'Noto Sans KR', sans-serif" }}>
              책임 인식 {gc.responsibility_acknowledged ? "✓" : "✗"}
            </span>
          )}
        </div>
        {gc.choice_description && (
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>{gc.choice_description}</div>
        )}
        <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{gc.description}</p>
      </div>

      {/* 타자의 시선 + 부조리 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {og.present && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>LE REGARD — 타자의 시선</div>
            {og.who && <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{og.who}</div>}
            {og.effect && <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{og.effect}</div>}
            <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{og.description}</p>
          </div>
        )}
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(247,160,114,0.04)", border: "1px solid rgba(247,160,114,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>ABSURDE — 부조리 (Camus)</div>
            {absResponse && (
              <span style={{ fontSize: 10, fontWeight: 700, color: absurdColor[absResponse] || "#aaa", background: `${absurdColor[absResponse] || "#aaa"}15`, padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{absResponse}</span>
            )}
          </div>
          {abs.absurd_condition && <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{abs.absurd_condition}</div>}
          {abs.sisyphus_moment && (
            <div style={{ fontSize: 10, color: "#F7A072", background: "rgba(247,160,114,0.08)", padding: "5px 8px", borderRadius: 6, marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
              시지프 순간: {abs.sisyphus_moment}
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{abs.description}</p>
        </div>
      </div>

      {/* 키르케고르 + 니체 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {kk.stage && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>KIERKEGAARD STAGE</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: stageColor[stage] || "#aaa", background: `${stageColor[stage] || "#aaa"}18`, padding: "3px 10px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{stage} 실존</span>
            <p style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: "8px 0 0" }}>{kk.description}</p>
          </div>
        )}
        {nz.will_to_power && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>NIETZSCHE — 의지·위버멘쉬</div>
            <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
              <span style={{ color: "var(--c-tx-25)" }}>의지: </span>{nz.will_to_power}
            </div>
            {nz.ubermensch_potential && (
              <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
                <span style={{ color: "var(--c-tx-25)" }}>위버멘쉬: </span>{nz.ubermensch_potential}
              </div>
            )}
            {nz.eternal_recurrence_test && (
              <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5, fontStyle: "italic" }}>영원회귀: {nz.eternal_recurrence_test}</div>
            )}
          </div>
        )}
      </div>

      {/* 사르트르 평결 + 팁 */}
      {data.sartre_verdict && (
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(247,160,114,0.05)", border: "1px solid rgba(247,160,114,0.2)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>SARTRE VERDICT</div>
          <p style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.sartre_verdict}</p>
        </div>
      )}
      {data.authenticity_tip && (
        <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>AUTHENTICITY TIP</div>
          <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.authenticity_tip}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 가치 전하 분석 컴포넌트 (McKee)
// ─────────────────────────────────────────────
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
export function ShadowAnalysisPanel({ data, isMobile }) {
  const archetypeColors = {
    "영웅": "#4ECCA3", "그림자": "#E85D75", "아니마": "#a78bfa",
    "아니무스": "#a78bfa", "자기": "#FFD166", "페르소나": "#45B7D1",
    "변환자": "#F7A072", "트릭스터": "#F7A072", "현자": "#95E1D3",
  };
  const integrationColor = { "높음": "#4ECCA3", "중간": "#F7A072", "낮음": "#E85D75" };

  const shadow = data.shadow || {};
  const hero = data.hero_archetype || {};
  const anima = data.anima_animus || {};
  const indiv = data.individuation_arc || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 영웅 원형 */}
      <div style={{ padding: "16px", borderRadius: 12, border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.04)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#4ECCA3", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>HERO ARCHETYPE</div>
        <p style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: "0 0 10px" }}>{hero.description}</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {hero.wound && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(232,93,117,0.06)", border: "1px solid rgba(232,93,117,0.15)" }}>
              <div style={{ fontSize: 9, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>WOUND</div>
              <p style={{ fontSize: 11, color: "var(--c-tx-50)", margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{hero.wound}</p>
            </div>
          )}
          {hero.persona_gap && (
            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(69,183,209,0.06)", border: "1px solid rgba(69,183,209,0.15)" }}>
              <div style={{ fontSize: 9, color: "#45B7D1", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>PERSONA GAP</div>
              <p style={{ fontSize: 11, color: "var(--c-tx-50)", margin: 0, lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{hero.persona_gap}</p>
            </div>
          )}
        </div>
      </div>

      {/* 그림자 */}
      <div style={{ padding: "16px", borderRadius: 12, border: "1px solid rgba(232,93,117,0.25)", background: "rgba(232,93,117,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>SHADOW ARCHETYPE</div>
          {shadow.integration_potential && (
            <span style={{ fontSize: 10, fontWeight: 700, color: integrationColor[shadow.integration_potential] || "#aaa", background: `${integrationColor[shadow.integration_potential] || "#aaa"}15`, padding: "2px 8px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>
              통합 가능성: {shadow.integration_potential}
            </span>
          )}
        </div>
        {shadow.who && (
          <div style={{ fontSize: 12, fontWeight: 600, color: "#E85D75", marginBottom: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{shadow.who}</div>
        )}
        {shadow.represents && (
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 8, padding: "6px 10px", background: "rgba(232,93,117,0.06)", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
            반영하는 억압된 자아: {shadow.represents}
          </div>
        )}
        <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{shadow.description}</p>
      </div>

      {/* 아니마/아니무스 + 기타 원형 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {anima.present && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>ANIMA / ANIMUS</div>
            {anima.who && <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa", marginBottom: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{anima.who}</div>}
            <p style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{anima.description}</p>
          </div>
        )}
        {(data.other_archetypes || []).length > 0 && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>OTHER ARCHETYPES</div>
            {data.other_archetypes.map((a, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: archetypeColors[a.archetype] || "#aaa", background: `${archetypeColors[a.archetype] || "#aaa"}15`, padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.archetype}</span>
                {a.who && <span style={{ fontSize: 11, color: "var(--c-tx-40)", marginLeft: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.who}</span>}
                {a.description && <p style={{ fontSize: 10, color: "var(--c-tx-30)", margin: "2px 0 0", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 개성화 여정 */}
      {indiv.description && (
        <div style={{ padding: "14px", borderRadius: 10, background: "rgba(255,209,102,0.04)", border: "1px solid rgba(255,209,102,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#FFD166", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>INDIVIDUATION ARC</div>
            {indiv.stage && (
              <span style={{ fontSize: 10, color: "#FFD166", background: "rgba(255,209,102,0.12)", padding: "1px 7px", borderRadius: 5, fontFamily: "'Noto Sans KR', sans-serif" }}>{indiv.stage}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{indiv.description}</p>
        </div>
      )}

      {/* 집단 무의식 연결 + 융 평결 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.collective_unconscious_connection && (
          <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(149,225,211,0.04)", border: "1px solid rgba(149,225,211,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#95E1D3", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>COLLECTIVE UNCONSCIOUS</div>
            <p style={{ fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.collective_unconscious_connection}</p>
          </div>
        )}
        {data.jung_verdict && (
          <div style={{ padding: "14px", borderRadius: 10, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>JUNG VERDICT</div>
            <p style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.jung_verdict}</p>
          </div>
        )}
        {data.missing_archetype && (
          <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.15)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase" }}>MISSING ARCHETYPE</div>
            <p style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.missing_archetype}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 전문가 패널 결과 컴포넌트
// ─────────────────────────────────────────────
export function ExpertPanelSection({ data, isMobile }) {
  const [openRound, setOpenRound] = useState(2); // 0=모두접기, 1=R1, 2=R2, 3=종합

  const getExpert = (id) => PANEL_EXPERTS.find((e) => e.id === id) || { name: id, color: "#aaa", initial: "?" };

  const stanceLabel = { agree: "동의", extend: "보완", disagree: "반론" };
  const stanceColor = { agree: "#4ECCA3", extend: "#45B7D1", disagree: "#E85D75" };

  const Avatar = ({ expert, size = 32 }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${expert.color}22`,
      border: `1.5px solid ${expert.color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      fontSize: size < 30 ? 9 : 11,
      fontWeight: 700, color: expert.color,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {expert.initial}
    </div>
  );

  const SectionHeader = ({ num, label, isOpen, onToggle }) => (
    <button onClick={onToggle} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: 10,
      border: "1px solid var(--c-bd-2)",
      background: isOpen ? "var(--c-card-2)" : "rgba(var(--tw),0.02)",
      cursor: "pointer", marginBottom: isOpen ? 10 : 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace", background: "rgba(167,139,250,0.12)", padding: "2px 7px", borderRadius: 6 }}>
          {num}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e0e0ee", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: "var(--c-tx-30)" }}>{isOpen ? "▲" : "▼"}</span>
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* 패널 제목 */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e0ee", fontFamily: "'Noto Sans KR', sans-serif" }}>
          {data.panel_title}
        </div>
      </div>

      {/* 전문가 아바타 줄 */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", paddingBottom: 10, borderBottom: "1px solid var(--c-bd-1)" }}>
        {PANEL_EXPERTS.map((ex) => (
          <div key={ex.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <Avatar expert={ex} size={36} />
            <span style={{ fontSize: 9, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>{ex.name}</span>
          </div>
        ))}
      </div>

      {/* ── 라운드 1 ── */}
      <div>
        <SectionHeader num="R1" label="초기 분석 — 각 전문가의 첫 번째 발언" isOpen={openRound === 1} onToggle={() => setOpenRound(openRound === 1 ? 0 : 1)} />
        {openRound === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(data.round1 || []).map((item, i) => {
              const ex = getExpert(item.expert_id);
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${ex.color}20`, background: `${ex.color}06` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Avatar expert={ex} size={26} />
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.name}</span>
                      <span style={{ fontSize: 10, color: "var(--c-tx-30)", marginLeft: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.role}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
                    {item.statement}
                  </p>
                  {item.reference && (
                    <div style={{ marginTop: 8, fontSize: 10, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", borderLeft: `2px solid ${ex.color}40`, paddingLeft: 8 }}>
                      {item.reference}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 라운드 2 ── */}
      <div>
        <SectionHeader num="R2" label="상호 토론 — 동의·보완·반론" isOpen={openRound === 2} onToggle={() => setOpenRound(openRound === 2 ? 0 : 2)} />
        {openRound === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(data.round2 || []).map((item, i) => {
              const ex = getExpert(item.expert_id);
              const toEx = getExpert(item.responding_to);
              const sc = stanceColor[item.stance] || "#aaa";
              const sl = stanceLabel[item.stance] || item.stance;
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, border: `1px solid ${ex.color}20`, background: `${ex.color}05` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <Avatar expert={ex} size={26} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: ex.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{ex.name}</span>
                    <span style={{ fontSize: 10, color: "var(--c-tx-25)", fontFamily: "'Noto Sans KR', sans-serif" }}>→</span>
                    <Avatar expert={toEx} size={22} />
                    <span style={{ fontSize: 10, color: "var(--c-tx-40)", fontFamily: "'Noto Sans KR', sans-serif" }}>{toEx.name}에게</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sc, background: `${sc}18`, padding: "2px 7px", borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif" }}>{sl}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>
                    {item.statement}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 종합 ── */}
      <div>
        <SectionHeader num="종합" label="합의 — 핵심 개선 방향" isOpen={openRound === 3} onToggle={() => setOpenRound(openRound === 3 ? 0 : 3)} />
        {openRound === 3 && data.synthesis && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* 합의점 */}
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>CONSENSUS</div>
              <p style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.75, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.synthesis.consensus}</p>
            </div>
            {/* 개선 제안 */}
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>IMPROVEMENTS</div>
              {(data.synthesis.improvements || []).map((imp, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", background: "rgba(78,204,163,0.15)", padding: "1px 6px", borderRadius: 4, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: "var(--c-tx-60)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{imp}</span>
                </div>
              ))}
            </div>
            {/* 강점 / 보완 / 철학적 핵심 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(69,183,209,0.05)", border: "1px solid rgba(69,183,209,0.18)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#45B7D1", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>STRONGEST ELEMENT</div>
                <p style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.synthesis.strongest_element}</p>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(232,93,117,0.05)", border: "1px solid rgba(232,93,117,0.18)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#E85D75", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>CRITICAL GAP</div>
                <p style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.synthesis.critical_gap}</p>
              </div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 9, background: "rgba(247,160,114,0.05)", border: "1px solid rgba(247,160,114,0.18)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#F7A072", marginBottom: 5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>PHILOSOPHICAL CORE</div>
              <p style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", margin: 0 }}>{data.synthesis.philosophical_core}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 파이프라인 패널 (인터랙티브 서사 선택기)
// ─────────────────────────────────────────────
export function PipelinePanel({ selectedDuration, logline, apiKey, isMobile, onResult }) {
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

사용자가 단계적으로 선택한 서사 요소:
${choicesSummary}

위 로그라인을 기반으로, 사용자가 선택한 서사 요소들을 모두 유기적으로 반영한 시놉시스를 생성하세요. 각 선택 요소가 이야기 속에서 자연스럽게 통합되어야 합니다.`;

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
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e0ee", fontFamily: "'Noto Sans KR', sans-serif" }}>
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
              {synopsis.key_scenes.map((scene, i) => (
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
export function CompareSection({ result1, result2, section, title, maxTotal, color }) {
  if (!result1?.[section] || !result2?.[section]) return null;
  const t1 = calcSectionTotal(result1, section);
  const t2 = calcSectionTotal(result2, section);
  const winner = t1 > t2 ? "A" : t2 > t1 ? "B" : null;

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 16,
        background: "rgba(var(--tw),0.02)",
        borderRadius: 12,
        border: `1px solid ${color}20`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: winner === "A" ? "#4ECCA3" : "var(--c-tx-50)",
              fontWeight: winner === "A" ? 700 : 400,
            }}
          >
            {t1}/{maxTotal}
          </span>
          <span style={{ fontSize: 11, color: "var(--c-tx-20)" }}>vs</span>
          <span
            style={{
              fontSize: 13,
              color: winner === "B" ? "#45B7D1" : "var(--c-tx-50)",
              fontWeight: winner === "B" ? 700 : 400,
            }}
          >
            {t2}/{maxTotal}
          </span>
          {winner && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 10,
                background: winner === "A" ? "rgba(78,204,163,0.15)" : "rgba(69,183,209,0.15)",
                color: winner === "A" ? "#4ECCA3" : "#45B7D1",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              {winner} 우세
            </span>
          )}
        </div>
      </div>

      {Object.entries(result1[section]).map(([key, v1]) => {
        const v2 = result2[section]?.[key];
        if (!v2) return null;
        const pct1 = (v1.score / v1.max) * 100;
        const pct2 = (v2.score / v2.max) * 100;
        const diff = v1.score - v2.score;

        return (
          <div key={key} style={{ marginBottom: 9 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "var(--c-tx-55)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                {LABELS_KR[key]}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color:
                    diff > 0 ? "#4ECCA3" : diff < 0 ? "#E85D75" : "var(--c-tx-30)",
                  fontWeight: diff !== 0 ? 700 : 400,
                }}
              >
                {diff > 0 ? `A +${diff}` : diff < 0 ? `B +${Math.abs(diff)}` : "동점"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, height: 5 }}>
              <div
                style={{
                  flex: 1,
                  background: "var(--c-card-3)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct1}%`,
                    background: "#4ECCA3",
                    borderRadius: 3,
                  }}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  background: "var(--c-card-3)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct2}%`,
                    background: "#45B7D1",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// 비트 시트 패널
// ─────────────────────────────────────────────
export function BeatSheetPanel({ data, beatScenes, generatingBeat, expandedBeats, onToggle, onGenerateScene, onExportAll, isMobile }) {
  const beats = data.beats || [];

  const ACT_META = {
    "1막": { color: "#4ECCA3", bg: "rgba(78,204,163,0.08)", label: "1막" },
    "2막 전반": { color: "#45B7D1", bg: "rgba(69,183,209,0.08)", label: "2막 전반" },
    "2막 후반": { color: "#F7A072", bg: "rgba(247,160,114,0.08)", label: "2막 후반" },
    "3막": { color: "#E85D75", bg: "rgba(232,93,117,0.08)", label: "3막" },
  };

  // 진행률 계산
  const completedCount = Object.keys(beatScenes).length;

  return (
    <div>
      {/* 상단 통계 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        {[
          { label: "총 페이지", value: `${data.total_pages || "?"}p`, color: "#FFD166" },
          { label: "비트 수", value: `${beats.length}개`, color: "#4ECCA3" },
          { label: "씬 완성", value: `${completedCount}/${beats.length}`, color: "#FB923C" },
          { label: "포맷", value: data.format_name || "Snyder", color: "#A78BFA" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${color}22`, background: `${color}0a`, textAlign: "center", flex: "1 1 auto", minWidth: 80 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
            <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 진행 바 */}
      <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${beats.length ? (completedCount / beats.length) * 100 : 0}%`, background: "linear-gradient(90deg, #4ECCA3, #45B7D1)", borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>

      {/* 비트 카드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {beats.map((beat) => {
          const act = ACT_META[beat.act] || ACT_META["1막"];
          const isExpanded = expandedBeats[beat.id];
          const hasScene = !!beatScenes[beat.id];
          const isGenerating = generatingBeat === beat.id;
          const pageLen = (beat.page_end || beat.page_start) - beat.page_start + 1;

          return (
            <div key={beat.id} style={{ borderRadius: 12, border: `1px solid ${isExpanded ? act.color + "33" : "var(--c-bd-1)"}`, background: isExpanded ? act.bg : "rgba(var(--tw),0.01)", overflow: "hidden", transition: "all 0.2s" }}>
              {/* 카드 헤더 */}
              <div
                onClick={() => onToggle(beat.id)}
                style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                {/* 비트 번호 */}
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${act.color}22`, border: `1px solid ${act.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: act.color, fontFamily: "'JetBrains Mono', monospace" }}>{beat.id}</span>
                </div>
                {/* 이름 + 막 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--tw),0.88)", fontFamily: "'Noto Sans KR', sans-serif" }}>{beat.name_kr}</span>
                    <span style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>{beat.name_en}</span>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, border: `1px solid ${act.color}33`, color: act.color, fontFamily: "'Noto Sans KR', sans-serif" }}>{beat.act}</span>
                    {hasScene && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(78,204,163,0.12)", color: "#4ECCA3", fontFamily: "'Noto Sans KR', sans-serif" }}>✓ 씬 완성</span>}
                  </div>
                  {!isExpanded && <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{beat.summary}</div>}
                </div>
                {/* 페이지 + 토글 */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--c-tx-40)", fontFamily: "'JetBrains Mono', monospace" }}>p.{beat.page_start}{pageLen > 1 ? `~${beat.page_end}` : ""}</div>
                  <div style={{ fontSize: 10, color: "var(--c-tx-25)", marginTop: 2 }}>{isExpanded ? "▲" : "▼"}</div>
                </div>
              </div>

              {/* 카드 본문 (확장 시) */}
              {isExpanded && (
                <div style={{ padding: "0 14px 14px" }}>
                  {/* 요약 */}
                  <div style={{ fontSize: 13, color: "var(--c-tx-70)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 12, padding: "10px 12px", borderRadius: 9, background: "var(--c-card-1)", border: "1px solid var(--c-bd-1)" }}>
                    {beat.summary}
                  </div>

                  {/* 상세 그리드 */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "서사 기능", val: beat.dramatic_function, c: act.color },
                      { label: "장소", val: beat.location_hint, c: "#60A5FA" },
                      { label: `가치 전하: ${beat.value_start} → ${beat.value_end}`, val: null, c: "#FFD166", full: true },
                      { label: "등장 인물", val: (beat.characters_present || []).join(", "), c: "#A78BFA" },
                      { label: "톤·분위기", val: beat.tone, c: "#95E1D3" },
                    ].filter(f => f.val !== null || f.full).map(({ label, val, c, full }) => (
                      <div key={label} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${c}18`, background: `${c}07`, gridColumn: full ? "1 / -1" : undefined }}>
                        <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3, letterSpacing: 0.3 }}>{label}</div>
                        {val && <div style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>{val}</div>}
                      </div>
                    ))}
                  </div>

                  {/* 핵심 요소 태그 */}
                  {beat.key_elements?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 5 }}>반드시 포함</div>
                      <div>{beat.key_elements.map((el, i) => (
                        <span key={i} style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, border: `1px solid ${act.color}33`, color: act.color, fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", marginRight: 5, marginBottom: 4 }}>{el}</span>
                      ))}</div>
                    </div>
                  )}

                  {/* 씬 생성 버튼 */}
                  <button
                    onClick={() => onGenerateScene(beat)}
                    disabled={isGenerating}
                    style={{ width: "100%", padding: "10px", borderRadius: 9, border: `1px solid ${act.color}33`, background: hasScene ? `${act.color}12` : `${act.color}08`, color: act.color, cursor: isGenerating ? "wait" : "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: hasScene ? 12 : 0, transition: "all 0.2s" }}
                  >
                    {isGenerating
                      ? <><span style={{ display: "inline-block", width: 11, height: 11, border: `1.5px solid ${act.color}44`, borderTop: `1.5px solid ${act.color}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />씬 생성 중...</>
                      : hasScene ? "🔄 씬 재생성" : "🎬 이 씬 시나리오 생성"}
                  </button>

                  {/* 생성된 씬 텍스트 — 파이널 드래프트 스타일 */}
                  {hasScene && (
                    <div style={{ borderRadius: 10, border: `1px solid ${act.color}22`, background: "rgba(0,0,0,0.3)", overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${act.color}15` }}>
                        <span style={{ fontSize: 11, color: act.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>SCENE {beat.id}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(beatScenes[beat.id]); }}
                          style={{ fontSize: 10, color: "var(--c-tx-35)", background: "none", border: "1px solid var(--c-bd-4)", borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}
                        >복사</button>
                      </div>
                      {/* 스크립트 포맷 렌더러 */}
                      <div style={{ padding: "16px 20px", fontFamily: "'Courier New', 'Courier', monospace", fontSize: isMobile ? 11 : 12, lineHeight: 2, color: "rgba(var(--tw),0.82)" }}>
                        {beatScenes[beat.id].split("\n").map((line, idx) => {
                          const trimmed = line.trim();
                          // 씬 헤더: INT. / EXT. / INT./EXT.
                          if (/^(INT\.|EXT\.|INT\.\/EXT\.)/.test(trimmed)) {
                            return <div key={idx} style={{ fontWeight: 800, color: "#ffffff", letterSpacing: 0.5, marginTop: idx > 0 ? 10 : 0, textTransform: "uppercase" }}>{line}</div>;
                          }
                          // 캐릭터 큐: 짧고 대문자인 줄 (대사 앞)
                          if (trimmed.length > 0 && trimmed.length <= 30 && trimmed === trimmed.toUpperCase() && !/[.!?]$/.test(trimmed) && !/^[(\[]/.test(trimmed)) {
                            return <div key={idx} style={{ textAlign: "center", fontWeight: 700, color: "#FFD166", marginTop: 8 }}>{line}</div>;
                          }
                          // 지문: (괄호)로 시작
                          if (/^\s*\(/.test(line)) {
                            return <div key={idx} style={{ textAlign: "center", color: "var(--c-tx-50)", fontStyle: "italic", fontSize: (isMobile ? 11 : 12) - 1 }}>{line}</div>;
                          }
                          // 전환: CUT TO / FADE / SMASH CUT
                          if (/^(CUT TO:|FADE|SMASH CUT|DISSOLVE)/.test(trimmed)) {
                            return <div key={idx} style={{ textAlign: "right", color: "var(--c-tx-40)", fontStyle: "italic", marginTop: 6 }}>{line}</div>;
                          }
                          // 빈 줄
                          if (trimmed === "") return <div key={idx} style={{ height: "0.5em" }} />;
                          // 일반 액션 라인
                          return <div key={idx} style={{ color: "var(--c-tx-75)" }}>{line}</div>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 구조 인사이트 */}
      {data.structure_insight && (
        <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.02)" }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, letterSpacing: 0.5 }}>STRUCTURE INSIGHT — Snyder · Field · McKee</div>
          <div style={{ fontSize: 13, color: "var(--c-tx-60)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.structure_insight}</div>
        </div>
      )}

      {/* 전체 씬 내보내기 */}
      {completedCount > 0 && (
        <button
          onClick={onExportAll}
          style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 10, border: "1px solid rgba(78,204,163,0.25)", background: "rgba(78,204,163,0.07)", color: "#4ECCA3", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          ↓ 완성된 씬 전체 TXT 저장 ({completedCount}개)
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 하위텍스트 탐지 패널
// ─────────────────────────────────────────────
export function SubtextPanel({ data, isMobile }) {
  const scoreColor = data.subtext_score >= 70 ? "#4ECCA3" : data.subtext_score >= 40 ? "#FFD166" : "#E85D75";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{data.subtext_score}</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginTop: 2 }}>하위텍스트 지수</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.subtext_level}</div>
          <div style={{ fontSize: 12, color: "var(--c-tx-50)", marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{data.surface_story}</div>
          <div style={{ fontSize: 12, color: "#45B7D1", marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>→ {data.deeper_story}</div>
        </div>
      </div>
      {data.chekhovs_guns?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>체호프의 총</div>
          {data.chekhovs_guns.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: `1px solid ${g.is_loaded ? "rgba(78,204,163,0.2)" : "rgba(232,93,117,0.2)"}`, background: g.is_loaded ? "rgba(78,204,163,0.05)" : "rgba(232,93,117,0.05)" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{g.is_loaded ? "🔫" : "🚫"}</span>
              <div><div style={{ fontSize: 12, color: "var(--c-tx-75)", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>{g.element}</div><div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>{g.function}</div></div>
            </div>
          ))}
        </div>
      )}
      {data.unspoken_desires?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>말 vs 진짜 의도 (Stanislavski)</div>
          {data.unspoken_desires.map((u, i) => (
            <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(69,183,209,0.15)", background: "rgba(69,183,209,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#45B7D1", marginBottom: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>{u.character}</div>
              <div style={{ fontSize: 12, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>말: {u.surface_want}</div>
              <div style={{ fontSize: 12, color: "var(--c-tx-75)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 3 }}>진짜: {u.real_need}</div>
            </div>
          ))}
        </div>
      )}
      {[
        { label: "침묵의 힘", val: data.silence_power, c: "#95E1D3" },
        { label: "브레히트 소외 효과", val: data.brecht_alienation, c: "#F7A072" },
        { label: "하위텍스트 약점 & 개선", val: data.subtext_weakness, c: "#E85D75" },
        { label: "체호프·스타니슬랍스키 총평", val: data.chekhov_verdict, c: "#45B7D1" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
      {data.dramatic_irony?.present && (
        <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(255,209,102,0.2)", background: "rgba(255,209,102,0.06)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,209,102,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>극적 아이러니</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.dramatic_irony.description}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 신화적 위치 매핑 패널
// ─────────────────────────────────────────────
export function MythMapPanel({ data, isMobile }) {
  return (
    <div>
      <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,209,102,0.2)", background: "rgba(255,209,102,0.06)" }}>
        <div style={{ fontSize: 10, color: "rgba(255,209,102,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>현재 단계 — Campbell Monomyth</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFD166", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.primary_stage}</div>
        {data.stages_covered?.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {data.stages_covered.map((s, i) => <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(255,209,102,0.12)", color: "rgba(255,209,102,0.8)", fontFamily: "'Noto Sans KR', sans-serif" }}>{s}</span>)}
          </div>
        )}
      </div>
      {data.journey_phases && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>3단계 여정</div>
          {[
            { label: "① 분리 (Departure)", val: data.journey_phases.departure, c: "#4ECCA3" },
            { label: "② 입문 (Initiation)", val: data.journey_phases.initiation, c: "#45B7D1" },
            { label: "③ 귀환 (Return)", val: data.journey_phases.return, c: "#A78BFA" },
          ].map(({ label, val, c }) => val && (
            <div key={label} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: `1px solid ${c}20`, background: `${c}07` }}>
              <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{val}</div>
            </div>
          ))}
        </div>
      )}
      {data.archetype_roles && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>원형 역할</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
            {Object.entries(data.archetype_roles).filter(([, v]) => v).map(([key, val]) => (
              <div key={key} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.02)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,209,102,0.6)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{key.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {[
        { label: "세계 신화 공명", val: data.universal_myth_parallel, c: "#FFD166" },
        { label: "신화의 기능", val: data.myth_function, c: "#F7A072" },
        { label: "빠진 여정 요소", val: data.missing_journey_element, c: "#E85D75" },
        { label: "캠벨 총평", val: data.campbell_verdict, c: "#FFD166" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 바르트 서사 코드 패널
// ─────────────────────────────────────────────
export function BarthesCodePanel({ data, isMobile }) {
  const codes = [
    { key: "hermeneutic_code", label: "해석적 코드", en: "Hermeneutic", color: "#A78BFA" },
    { key: "proairetic_code", label: "행동적 코드", en: "Proairetic", color: "#4ECCA3" },
    { key: "semic_code", label: "의미론적 코드", en: "Semic", color: "#45B7D1" },
    { key: "symbolic_code", label: "상징적 코드", en: "Symbolic", color: "#F7A072" },
    { key: "cultural_code", label: "문화적 코드", en: "Cultural", color: "#E85D75" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#95E1D3", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{data.total_activation}</div>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginTop: 2 }}>총 활성화 점수</div>
        </div>
        <div style={{ flex: 1 }}>
          {codes.map(({ key, label, color }) => {
            const c = data[key]; if (!c) return null;
            const pct = (c.score / 20) * 100;
            return (
              <div key={key} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                  <span style={{ fontSize: 11, color, fontFamily: "'JetBrains Mono', monospace" }}>{c.score}/20</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {codes.map(({ key, label, en, color }) => {
          const c = data[key]; if (!c) return null;
          return (
            <div key={key} style={{ padding: "11px 12px", borderRadius: 10, border: `1px solid ${color}22`, background: `${color}07` }}>
              <div style={{ fontSize: 10, color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label} ({en})</div>
              <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{c.analysis}</div>
              {(c.binary_oppositions || c.information_gaps || c.key_connotations || c.cultural_references) && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(c.binary_oppositions || c.information_gaps || c.key_connotations || c.cultural_references || []).slice(0, 2).map((t, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${color}15`, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {[
        { label: "가장 강한 코드", val: data.dominant_code, c: "#4ECCA3" },
        { label: "가장 약한 코드 & 강화 방법", val: data.weakest_code, c: "#E85D75" },
        { label: "바르트 총평", val: data.barthes_verdict, c: "#95E1D3" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 한국 신화 공명 패널
// ─────────────────────────────────────────────
export function KoreanMythPanel({ data, isMobile }) {
  const aesthetics = [
    { key: "han_resonance", label: "한(恨)", color: "#E85D75", max: 25 },
    { key: "jeong_resonance", label: "정(情)", color: "#F472B6", max: 25 },
    { key: "sinmyeong_element", label: "신명(神明)", color: "#FFD166", max: 25 },
  ];
  const total = aesthetics.reduce((s, a) => s + (data[a.key]?.score || 0), 0);
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "var(--c-tx-40)", fontFamily: "'JetBrains Mono', monospace" }}>한·정·신명 공명 지수</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#E85D75", fontFamily: "'JetBrains Mono', monospace" }}>{total}/75</span>
        </div>
        {aesthetics.map(({ key, label, color, max }) => {
          const d = data[key]; if (!d) return null;
          return (
            <div key={key} style={{ marginBottom: 12, padding: "11px 13px", borderRadius: 10, border: `1px solid ${color}22`, background: `${color}07` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <span style={{ fontSize: 12, color, fontFamily: "'JetBrains Mono', monospace" }}>{d.score}/{max}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", marginBottom: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(d.score / max) * 100}%`, background: color, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{d.analysis}</div>
            </div>
          );
        })}
      </div>
      {data.korean_archetypes?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>한국 원형 인물</div>
          {data.korean_archetypes.map((a, i) => (
            <div key={i} style={{ marginBottom: 7, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(232,93,117,0.15)", background: "rgba(232,93,117,0.04)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>🎭</span>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#E85D75", fontFamily: "'Noto Sans KR', sans-serif" }}>{a.archetype}</span>
                <span style={{ fontSize: 11, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}> — {a.character}</span>
                {a.tradition && <div style={{ fontSize: 11, color: "var(--c-tx-30)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>{a.tradition}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {[
        { label: "공명하는 한국 신화·설화", val: data.myth_parallel, c: "#E85D75" },
        { label: "무속 제의 구조", val: data.shamanic_structure, c: "#F7A072" },
        { label: "유교적 긴장", val: data.confucian_tension, c: "#60A5FA" },
        { label: "계승하는 현대 한국 영화", val: data.modern_korean_film, c: "#A3E635" },
        { label: "한국 신화·미학 총평", val: data.korean_myth_verdict, c: "#E85D75" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Script Coverage 패널
// ─────────────────────────────────────────────
export function ScriptCoveragePanel({ data, isMobile }) {
  const REC_COLOR = { "STRONG PASS": "#4ECCA3", "RECOMMEND": "#60A5FA", "CONSIDER": "#FFD166", "PASS": "#E85D75" };
  const recColor = REC_COLOR[data.recommendation] || "#aaa";
  const gradeColor = (g) => ({ A: "#4ECCA3", B: "#60A5FA", C: "#FFD166", D: "#F7A072", F: "#E85D75" }[g] || "#aaa");
  const scoreKeys = [
    { key: "premise", label: "전제 (Premise)" },
    { key: "story", label: "이야기 (Story)" },
    { key: "character", label: "인물 (Character)" },
    { key: "dialogue_potential", label: "대사 잠재력" },
    { key: "setting", label: "세계관 (Setting)" },
    { key: "marketability", label: "시장성 (Marketability)" },
  ];
  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(var(--tw),0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>{data.title_suggestion || "제목 미정"}</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{data.format} | {data.genre}</div>
        </div>
        <div style={{ textAlign: "center", padding: "8px 18px", borderRadius: 10, border: `2px solid ${recColor}`, background: `${recColor}12` }}>
          <div style={{ fontSize: 11, color: recColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{data.recommendation}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: recColor, fontFamily: "'JetBrains Mono', monospace" }}>{data.overall_score}/10</div>
        </div>
      </div>
      {/* 항목별 점수 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {scoreKeys.map(({ key, label }) => {
          const s = data.scores?.[key]; if (!s) return null;
          return (
            <div key={key} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: gradeColor(s.grade), fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{s.grade}</span>
                  <span style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace" }}>{s.score}/10</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "var(--c-bd-1)", marginBottom: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.score * 10}%`, background: gradeColor(s.grade), borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>{s.comment}</div>
            </div>
          );
        })}
      </div>
      {/* 강점·약점 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {data.strengths?.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(78,204,163,0.2)", background: "rgba(78,204,163,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(78,204,163,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>STRENGTHS</div>
            {data.strengths.map((s, i) => <div key={i} style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>✓ {s}</div>)}
          </div>
        )}
        {data.weaknesses?.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(232,93,117,0.2)", background: "rgba(232,93,117,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(232,93,117,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>WEAKNESSES</div>
            {data.weaknesses.map((s, i) => <div key={i} style={{ fontSize: 12, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>✗ {s}</div>)}
          </div>
        )}
      </div>
      {[
        { label: "비교 작품", val: data.comparable_works?.join(" / "), c: "#A78BFA" },
        { label: "추천 플랫폼", val: data.target_platform, c: "#60A5FA" },
        { label: "리더 총평", val: data.reader_comment, c: "#FFD166" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 대사 디벨롭 패널
// ─────────────────────────────────────────────
export function DialogueDevPanel({ data, isMobile }) {
  return (
    <div>
      {data.character_voices?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, textTransform: "uppercase" }}>인물별 목소리 설계</div>
          {data.character_voices.map((v, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(251,146,60,0.2)", background: "rgba(251,146,60,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FB923C", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 8 }}>{v.character}</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
                {[
                  { l: "말투 패턴", v: v.speech_pattern },
                  { l: "어휘 수준", v: v.vocabulary_level },
                  { l: "절대 직접 말 안 하는 것", v: v.what_they_never_say },
                  { l: "말버릇", v: v.verbal_tic },
                ].map(({ l, v: val }) => val && (
                  <div key={l} style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.02)" }}>
                    <div style={{ fontSize: 9, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 11, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
                  </div>
                ))}
              </div>
              {v.sample_line && (
                <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 7, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(251,146,60,0.15)" }}>
                  <div style={{ fontSize: 9, color: "rgba(251,146,60,0.5)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>SAMPLE LINE</div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-75)", fontFamily: "'Noto Sans KR', sans-serif", fontStyle: "italic" }}>"{v.sample_line}"</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.key_scene_dialogue && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>핵심 씬 대사 초안</div>
          <div style={{ padding: "14px", borderRadius: 10, border: "1px solid rgba(69,183,209,0.2)", background: "rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 11, color: "rgba(69,183,209,0.7)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 10 }}>{data.key_scene_dialogue.scene_context}</div>
            <pre style={{ fontSize: 12, color: "var(--c-tx-75)", fontFamily: "'Noto Sans KR', monospace", lineHeight: 1.85, whiteSpace: "pre-wrap", margin: 0 }}>{data.key_scene_dialogue.dialogue_draft}</pre>
            {data.key_scene_dialogue.subtext_note && (
              <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: "rgba(69,183,209,0.07)", border: "1px solid rgba(69,183,209,0.15)", fontSize: 11, color: "rgba(69,183,209,0.8)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                💬 하위텍스트: {data.key_scene_dialogue.subtext_note}
              </div>
            )}
          </div>
        </div>
      )}
      {data.subtext_techniques?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, textTransform: "uppercase" }}>하위텍스트 기법</div>
          {data.subtext_techniques.map((t, i) => (
            <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.02)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#45B7D1", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>{t.technique}</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>{t.when_to_use}</div>
              {t.example && <div style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 3, fontStyle: "italic" }}>예: {t.example}</div>}
            </div>
          ))}
        </div>
      )}
      {[
        { label: "피해야 할 대사 실수", val: data.dialogue_pitfalls?.join(" / "), c: "#E85D75" },
        { label: "목소리 일관성 유지 방법", val: data.voice_consistency_tips, c: "#4ECCA3" },
      ].map(({ label, val, c }) => val && (
        <div key={label} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}18`, background: `${c}07` }}>
          <div style={{ fontSize: 10, color: `${c}88`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 캐릭터 디벨롭 결과 패널
// ─────────────────────────────────────────────
export function CharacterDevPanel({ data, isMobile }) {
  const [openSection, setOpenSection] = useState("protagonist");
  const proto = data.protagonist || {};
  const supporting = data.supporting_characters || [];
  const web = data.relationship_web || [];

  const Section = ({ id, title, color, children }) => {
    const open = openSection === id;
    return (
      <div style={{ marginBottom: 12, borderRadius: 12, border: `1px solid ${open ? color + "33" : "var(--c-bd-1)"}`, overflow: "hidden", transition: "all 0.2s" }}>
        <button onClick={() => setOpenSection(open ? null : id)} style={{ width: "100%", padding: "12px 16px", background: open ? `${color}0d` : "rgba(var(--tw),0.01)", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: open ? color : "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, fontWeight: 700 }}>
          {title}
          <span style={{ fontSize: 11, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
        </button>
        {open && <div style={{ padding: "4px 16px 16px" }}>{children}</div>}
      </div>
    );
  };

  const Field = ({ label, value, ref: _ref, color = "#FB923C" }) => {
    if (!value) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--c-tx-75)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif", paddingLeft: 10, borderLeft: `2px solid ${color}44` }}>{value}</div>
      </div>
    );
  };

  const Tag = ({ text, color }) => (
    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 20, border: `1px solid ${color}40`, background: `${color}12`, color, fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", marginRight: 6, marginBottom: 4 }}>{text}</span>
  );

  return (
    <div>
      {/* 주인공 */}
      <Section id="protagonist" title={`주인공 — ${proto.name_suggestion || "분석 결과"}`} color="#FB923C">
        {/* 이름 + 아크 타입 */}
        <div style={{ marginBottom: 14 }}>
          <Tag text={proto.arc_type || "아크 미정"} color="#FB923C" />
          <Tag text={`매슬로: ${proto.maslow_level || "?"}`} color="#60A5FA" />
          <Tag text={proto.erikson_stage || "에릭슨 단계"} color="#A78BFA" />
        </div>

        {/* Egri 3차원 */}
        {proto.egri_dimensions && (
          <div style={{ marginBottom: 14, padding: "12px", borderRadius: 9, background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.12)" }}>
            <div style={{ fontSize: 10, color: "rgba(251,146,60,0.7)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, marginBottom: 8 }}>EGRI 3차원 (1946)</div>
            <Field label="생리적(Physiological)" value={proto.egri_dimensions.physiological} color="#FB923C" />
            <Field label="사회적(Sociological)" value={proto.egri_dimensions.sociological} color="#FB923C" />
            <Field label="심리적(Psychological)" value={proto.egri_dimensions.psychological} color="#FB923C" />
          </div>
        )}

        {/* Hauge Want/Need/Fear/Wound */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "Want — 외적 목표 (Hauge)", val: proto.want, c: "#4ECCA3" },
            { label: "Need — 내적 욕구 (Hauge)", val: proto.need, c: "#A78BFA" },
            { label: "Wound — 상처 (Hauge)", val: proto.wound, c: "#E85D75" },
            { label: "Fear — 핵심 두려움 (Hauge)", val: proto.fear, c: "#F7A072" },
          ].map(({ label, val, c }) => val && (
            <div key={label} style={{ padding: "10px 12px", borderRadius: 9, border: `1px solid ${c}20`, background: `${c}08` }}>
              <div style={{ fontSize: 10, color: `${c}99`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{val}</div>
            </div>
          ))}
        </div>

        <Field label="Ghost — 과거 트라우마 (Truby 2007)" value={proto.ghost} color="#95E1D3" />
        <Field label="믿는 거짓 — The Lie (Snyder 2005)" value={proto.lie_they_believe} color="#FFD166" />
        <Field label="배워야 할 진실 — Self-revelation (Truby 2007)" value={proto.truth_to_learn} color="#4ECCA3" />
        <Field label="Identity vs Essence (Hauge 1988)" value={proto.identity_vs_essence} color="#FB923C" />
        <Field label="슈퍼-오브젝티브 (Stanislavski 1936)" value={proto.super_objective} color="#45B7D1" />

        {/* Jung Shadow */}
        {proto.jungian_shadow && (
          <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.05)" }}>
            <div style={{ fontSize: 10, color: "rgba(167,139,250,0.7)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>그림자(Shadow) — Jung (1969)</div>
            <div style={{ fontSize: 12, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>{proto.jungian_shadow}</div>
          </div>
        )}

        <Field label="McKee 압박 테스트 — True Character (McKee 1997)" value={proto.true_character_test} color="#FFD166" />
        <Field label="캐릭터 아크 여정 (Seger 1990)" value={proto.arc_journey} color="#FB923C" />
        {proto.voice_hint && <Field label="말투·화법 힌트 (Stanislavski 1936)" value={proto.voice_hint} color="#45B7D1" />}
      </Section>

      {/* 주요 인물 */}
      {supporting.length > 0 && (
        <Section id="supporting" title="주요 인물" color="#60A5FA">
          {supporting.map((s, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < supporting.length - 1 ? "1px solid var(--c-card-3)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(var(--tw),0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.suggested_name || s.role_name}</span>
                <Tag text={s.role_name} color="#60A5FA" />
                {s.vogler_archetype && <Tag text={s.vogler_archetype} color="#A3E635" />}
              </div>
              <Field label="서사적 기능" value={s.narrative_function} color="#60A5FA" />
              <Field label="주인공 반영/대조 (Mirror/Foil)" value={s.protagonist_mirror} color="#F472B6" />
              <Field label="관계 역학" value={s.relationship_dynamic} color="#60A5FA" />
            </div>
          ))}
        </Section>
      )}

      {/* 관계망 */}
      {web.length > 0 && (
        <Section id="web" title="관계망" color="#F472B6">
          {web.map((r, i) => (
            <div key={i} style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(244,114,182,0.12)", background: "rgba(244,114,182,0.04)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F472B6", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 6 }}>{r.pair}</div>
              {r.dynamic_type && <Tag text={r.dynamic_type} color="#F472B6" />}
              <div style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", marginTop: 6 }}>{r.dramatic_tension}</div>
            </div>
          ))}
        </Section>
      )}

      {/* 도덕적 논증 + 빠진 원형 + 팁 */}
      {(data.moral_argument || data.missing_archetype || data.character_development_tips?.length) && (
        <Section id="synthesis" title="종합 분석" color="#4ECCA3">
          <Field label="도덕적 논증 (Truby 2007: Moral Argument)" value={data.moral_argument} color="#4ECCA3" />
          {data.missing_archetype && <Field label="빠진 원형 (Vogler 1992)" value={data.missing_archetype} color="#FFD166" />}
          {data.character_development_tips?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>발전 제안</div>
              {data.character_development_tips.map((tip, i) => (
                <div key={i} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 8, background: "rgba(78,204,163,0.06)", border: "1px solid rgba(78,204,163,0.12)", fontSize: 12, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                  {i + 1}. {tip}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 트리트먼트 입력 패널
// ─────────────────────────────────────────────
export function TreatmentInputPanel({ chars, onCharsChange, structure, onStructureChange, onGenerate, loading, isMobile, charDevResult }) {
  const proto = chars.protagonist;

  const setProto = (field, val) =>
    onCharsChange({ ...chars, protagonist: { ...proto, [field]: val } });

  const setSupporting = (idx, field, val) => {
    const updated = chars.supporting.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    onCharsChange({ ...chars, supporting: updated });
  };

  const addSupporting = () =>
    onCharsChange({ ...chars, supporting: [...chars.supporting, { name: "", role: "", relation: "" }] });

  const removeSupporting = (idx) =>
    onCharsChange({ ...chars, supporting: chars.supporting.filter((_, i) => i !== idx) });

  const structures = [
    { id: "3act", label: "3막 구조", sub: "Field (1982)" },
    { id: "hero", label: "영웅의 여정", sub: "Campbell (1949)" },
    { id: "4act", label: "4막 구조", sub: "Parker (2005)" },
    { id: "miniseries", label: "화별 구조", sub: "미니시리즈" },
  ];

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1px solid var(--c-bd-3)", background: "var(--c-card-1)",
    color: "var(--text-main)", fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif",
    outline: "none",
  };
  const labelStyle = { fontSize: 10, color: "var(--c-tx-35)", marginBottom: 4, display: "block", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 0.5 };

  return (
    <div style={{ padding: "20px", borderRadius: 12, border: "1px solid rgba(251,191,36,0.15)", background: "rgba(251,191,36,0.02)" }}>

      {/* 서사 구조 선택 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>서사 구조</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7 }}>
          {structures.map((s) => (
            <button key={s.id} onClick={() => onStructureChange(s.id)} style={{
              padding: "9px 12px", borderRadius: 9, textAlign: "left",
              border: structure === s.id ? "1px solid rgba(251,191,36,0.5)" : "1px solid var(--c-bd-2)",
              background: structure === s.id ? "rgba(251,191,36,0.1)" : "rgba(var(--tw),0.02)",
              color: structure === s.id ? "#FBBf24" : "var(--c-tx-45)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}>{s.label}</div>
              <div style={{ fontSize: 10, color: structure === s.id ? "rgba(251,191,36,0.6)" : "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{s.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 인물 정보: Stage 3 캐릭터 분석 결과가 있으면 자동 반영 카드, 없으면 직접 입력 폼 */}
      {charDevResult?.protagonist ? (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>인물 정보</div>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--c-card-1)", border: "1px solid var(--c-bd-2)" }}>
            <div style={{ fontSize: 10, color: "var(--c-tx-28)", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
              ✓ 캐릭터 분석(3단계) 결과 자동 반영
            </div>
            {/* 주인공 요약 */}
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{charDevResult.protagonist.name_suggestion || "주인공"}</span>
              {charDevResult.protagonist.egri_dimensions?.sociological && (
                <span style={{ fontSize: 11, color: "rgba(var(--tw),0.38)", marginLeft: 8 }}>
                  {charDevResult.protagonist.egri_dimensions.sociological.slice(0, 50)}{charDevResult.protagonist.egri_dimensions.sociological.length > 50 ? "…" : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: charDevResult.supporting_characters?.length ? 10 : 0 }}>
              {charDevResult.protagonist.want && (
                <span style={{ fontSize: 10, color: "var(--c-tx-50)", background: "var(--c-card-3)", padding: "3px 8px", borderRadius: 6 }}>
                  Want: {charDevResult.protagonist.want}
                </span>
              )}
              {charDevResult.protagonist.need && (
                <span style={{ fontSize: 10, color: "var(--c-tx-50)", background: "var(--c-card-3)", padding: "3px 8px", borderRadius: 6 }}>
                  Need: {charDevResult.protagonist.need}
                </span>
              )}
              {charDevResult.protagonist.ghost && (
                <span style={{ fontSize: 10, color: "var(--c-tx-50)", background: "var(--c-card-3)", padding: "3px 8px", borderRadius: 6 }}>
                  Ghost: {charDevResult.protagonist.ghost.slice(0, 30)}{charDevResult.protagonist.ghost.length > 30 ? "…" : ""}
                </span>
              )}
            </div>
            {/* 주요 인물 */}
            {charDevResult.supporting_characters?.filter((s) => s.suggested_name || s.role_name).length > 0 && (
              <div style={{ borderTop: "1px solid var(--c-bd-1)", paddingTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {charDevResult.supporting_characters.filter((s) => s.suggested_name || s.role_name).slice(0, 5).map((s, i) => (
                  <span key={i} style={{ fontSize: 10, color: "rgba(var(--tw),0.38)", background: "var(--c-card-2)", padding: "2px 8px", borderRadius: 10, border: "1px solid var(--c-bd-1)" }}>
                    {s.suggested_name || ""}{s.role_name ? ` (${s.role_name})` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 주인공 — 직접 입력 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>주인공</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={labelStyle}>이름</label>
                <input style={inputStyle} value={proto.name} onChange={(e) => setProto("name", e.target.value)} placeholder="예: 박민준" />
              </div>
              <div>
                <label style={labelStyle}>역할 / 직업</label>
                <input style={inputStyle} value={proto.role} onChange={(e) => setProto("role", e.target.value)} placeholder="예: 전직 형사, 40대" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label style={labelStyle}>외적 목표 (Want)</label>
                <input style={inputStyle} value={proto.want} onChange={(e) => setProto("want", e.target.value)} placeholder="예: 딸을 찾는다" />
              </div>
              <div>
                <label style={labelStyle}>내적 욕구 (Need)</label>
                <input style={inputStyle} value={proto.need} onChange={(e) => setProto("need", e.target.value)} placeholder="예: 죄책감을 놓아준다" />
              </div>
              <div>
                <label style={labelStyle}>핵심 결함</label>
                <input style={inputStyle} value={proto.flaw} onChange={(e) => setProto("flaw", e.target.value)} placeholder="예: 모든 것을 혼자 해결하려 함" />
              </div>
            </div>
          </div>

          {/* 조력/적대 인물 — 직접 입력 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--c-tx-40)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>주요 인물</div>
              <button onClick={addSupporting} style={{ fontSize: 11, color: "rgba(251,191,36,0.7)", background: "none", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}>+ 인물 추가</button>
            </div>
            {chars.supporting.map((s, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "end" }}>
                <div>
                  <label style={labelStyle}>이름</label>
                  <input style={inputStyle} value={s.name} onChange={(e) => setSupporting(idx, "name", e.target.value)} placeholder="예: 이수연" />
                </div>
                <div>
                  <label style={labelStyle}>역할</label>
                  <input style={inputStyle} value={s.role} onChange={(e) => setSupporting(idx, "role", e.target.value)} placeholder="예: 적대자 / 조력자" />
                </div>
                <div>
                  <label style={labelStyle}>주인공과의 관계</label>
                  <input style={inputStyle} value={s.relation} onChange={(e) => setSupporting(idx, "relation", e.target.value)} placeholder="예: 전 파트너, 진실을 숨김" />
                </div>
                {chars.supporting.length > 1 && (
                  <button onClick={() => removeSupporting(idx)} style={{ padding: "9px 10px", background: "none", border: "1px solid rgba(232,93,117,0.2)", borderRadius: 8, color: "rgba(232,93,117,0.6)", cursor: "pointer", fontSize: 13 }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 생성 버튼 */}
      <button
        onClick={onGenerate}
        disabled={loading}
        style={{
          width: "100%", padding: "13px", borderRadius: 10,
          border: "none", cursor: loading ? "wait" : "pointer",
          background: loading ? "rgba(251,191,36,0.15)" : "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.12))",
          color: "#FBBf24", fontSize: 14, fontWeight: 700,
          fontFamily: "'Noto Sans KR', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
        }}
      >
        {loading ? (
          <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(251,191,36,0.3)", borderTop: "2px solid #FBBf24", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />트리트먼트 생성 중...</>
        ) : (
          <>📋 트리트먼트 생성</>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 구조 분석 패널 (Structure Analysis)
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
export function ThemeAnalysisPanel({ data, isMobile }) {
  const [openSection, setOpenSection] = useState("premise");

  if (!data) return null;

  const Section = ({ id, title, color, children }) => {
    const isOpen = openSection === id;
    return (
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setOpenSection(isOpen ? null : id)} style={{
          width: "100%", padding: "10px 14px", borderRadius: isOpen ? "10px 10px 0 0" : 10, cursor: "pointer",
          border: `1px solid ${color}${isOpen ? "40" : "20"}`,
          background: isOpen ? `${color}0a` : "rgba(var(--tw),0.02)",
          display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: isOpen ? color : "var(--c-tx-60)" }}>{title}</div>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)" }}>{isOpen ? "▲" : "▼"}</div>
        </button>
        {isOpen && (
          <div style={{ padding: "14px 16px", background: `${color}05`, border: `1px solid ${color}15`, borderTop: "none", borderRadius: "0 0 10px 10px" }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* Controlling Idea */}
      {data.controlling_idea && (
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(200,168,75,0.07)", border: "1px solid rgba(200,168,75,0.25)", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "rgba(200,168,75,0.7)", fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>컨트롤링 아이디어 (McKee)</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", lineHeight: 1.7 }}>{data.controlling_idea}</div>
        </div>
      )}

      <Section id="premise" title="도덕적 전제 (Egri)" color="#4ECCA3">
        {data.moral_premise && (
          <div>
            <div style={{ fontSize: 13, color: "rgba(var(--tw),0.8)", lineHeight: 1.7, marginBottom: 12, fontStyle: "italic" }}>"{data.moral_premise.statement}"</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "긍정하는 덕목", value: data.moral_premise.virtue, color: "#4ECCA3" },
                { label: "경고하는 결함", value: data.moral_premise.vice, color: "#E85D75" },
                { label: "덕목의 보상", value: data.moral_premise.consequence_positive, color: "#4ECCA3" },
                { label: "결함의 대가", value: data.moral_premise.consequence_negative, color: "#E85D75" },
              ].map((item) => (
                <div key={item.label} style={{ padding: "8px 10px", borderRadius: 8, background: `${item.color}06`, border: `1px solid ${item.color}15` }}>
                  <div style={{ fontSize: 9, color: `${item.color}90`, fontWeight: 700, marginBottom: 3, letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.5 }}>{item.value || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section id="question" title="테마 질문 & 진술" color="#45B7D1">
        {data.thematic_question && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "rgba(69,183,209,0.7)", fontWeight: 700, marginBottom: 4 }}>핵심 질문</div>
            <div style={{ fontSize: 13, color: "rgba(var(--tw),0.8)", lineHeight: 1.7, fontStyle: "italic" }}>"{data.thematic_question}"</div>
          </div>
        )}
        {data.theme_statement && (
          <div>
            <div style={{ fontSize: 10, color: "rgba(69,183,209,0.7)", fontWeight: 700, marginBottom: 4, marginTop: 10 }}>주제 진술</div>
            <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.7 }}>{data.theme_statement}</div>
          </div>
        )}
      </Section>

      <Section id="journey" title="주인공 내면 여정" color="#FB923C">
        {data.protagonist_inner_journey && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "핵심 결함", value: data.protagonist_inner_journey.starting_flaw, icon: "⚡" },
              { label: "잘못된 믿음", value: data.protagonist_inner_journey.false_belief, icon: "✗" },
              { label: "진짜 필요", value: data.protagonist_inner_journey.true_need, icon: "◎" },
              { label: "과거의 상처 (Ghost)", value: data.protagonist_inner_journey.ghost, icon: "👻" },
              { label: "변화", value: data.protagonist_inner_journey.transformation, icon: "→" },
              { label: "배움", value: data.protagonist_inner_journey.lesson, icon: "💡" },
            ].filter(item => item.value).map(item => (
              <div key={item.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, flexShrink: 0, width: 18, textAlign: "center" }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(251,146,60,0.7)", fontWeight: 700, marginBottom: 2, letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.6 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="arc" title="감정선 (Emotional Arc)" color="#C8A84B">
        {data.emotional_arc && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "1막 (시작)", value: data.emotional_arc.act1, color: "#4ECCA3" },
              { label: "미드포인트 전환", value: data.emotional_arc.midpoint, color: "#C8A84B" },
              { label: "어두운 밤 (최저점)", value: data.emotional_arc.dark_night, color: "#E85D75" },
              { label: "결말 카타르시스", value: data.emotional_arc.resolution, color: "#45B7D1" },
            ].filter(item => item.value).map((item, i) => (
              <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: `${item.color}06`, border: `1px solid ${item.color}18`, display: "flex", gap: 10 }}>
                <div style={{ width: 3, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, color: `${item.color}90`, fontWeight: 700, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.6 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="layers" title="이야기 레이어" color="#a78bfa">
        {data.thematic_layers && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.thematic_layers.map((layer, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)" }}>
                <div style={{ fontSize: 10, color: "rgba(167,139,250,0.8)", fontWeight: 700, marginBottom: 4 }}>{layer.layer}</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.6 }}>{layer.description}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Genre Conventions */}
      {data.genre_theme_conventions && (
        <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 10, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-40)", fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>장르 테마 컨벤션</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(78,204,163,0.7)", fontWeight: 700, marginBottom: 3 }}>관객 기대</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6 }}>{data.genre_theme_conventions.expected}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(200,168,75,0.7)", fontWeight: 700, marginBottom: 3 }}>이 작품의 접근</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6 }}>{data.genre_theme_conventions.subversion}</div>
            </div>
          </div>
        </div>
      )}

      {/* Weakness & Recommendation */}
      {(data.thematic_weakness || data.thematic_recommendation) && (
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {data.thematic_weakness && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.12)" }}>
              <div style={{ fontSize: 9, color: "#E85D75", fontWeight: 700, marginBottom: 4 }}>테마 약점</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6 }}>{data.thematic_weakness}</div>
            </div>
          )}
          {data.thematic_recommendation && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.12)" }}>
              <div style={{ fontSize: 9, color: "#4ECCA3", fontWeight: 700, marginBottom: 4 }}>강화 권고</div>
              <div style={{ fontSize: 11, color: "var(--c-tx-60)", lineHeight: 1.6 }}>{data.thematic_recommendation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 씬 리스트 패널 (Scene List / Step Outline)
// ─────────────────────────────────────────────
export function SceneListPanel({ text, isMobile }) {
  const [copied, setCopied] = useState(false);

  if (!text) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scene_list_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={handleCopy} style={{
          padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(78,204,163,0.3)",
          background: "rgba(78,204,163,0.06)", color: "#4ECCA3", cursor: "pointer", fontSize: 11,
        }}>
          {copied ? "복사됨!" : "클립보드 복사"}
        </button>
        <button onClick={handleExport} style={{
          padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(200,168,75,0.3)",
          background: "rgba(200,168,75,0.06)", color: "#C8A84B", cursor: "pointer", fontSize: 11,
        }}>
          MD 내보내기
        </button>
      </div>
      <div style={{ fontSize: isMobile ? 12 : 13, lineHeight: 1.9, color: "rgba(var(--tw),0.78)" }}>
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "#C8A84B", marginBottom: 8, marginTop: 0, paddingBottom: 8, borderBottom: "1px solid rgba(200,168,75,0.2)" }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: "#4ECCA3", marginTop: 24, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid rgba(78,204,163,0.15)" }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "rgba(var(--tw),0.85)", marginTop: 16, marginBottom: 6 }}>{children}</h3>,
            p: ({ children }) => <p style={{ marginBottom: 8, marginTop: 0 }}>{children}</p>,
            strong: ({ children }) => <strong style={{ color: "rgba(var(--tw),0.92)", fontWeight: 700 }}>{children}</strong>,
            em: ({ children }) => <em style={{ color: "rgba(200,168,75,0.75)", fontStyle: "italic" }}>{children}</em>,
            ul: ({ children }) => <ul style={{ paddingLeft: 18, marginBottom: 10, marginTop: 4 }}>{children}</ul>,
            li: ({ children }) => <li style={{ marginBottom: 4, color: "rgba(var(--tw),0.68)" }}>{children}</li>,
            hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--c-card-3)", margin: "16px 0" }} />,
          }}
        >{text}</ReactMarkdown>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPARABLE WORKS PANEL
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
// VALUATION PANEL
// ─────────────────────────────────────────────
export function ValuationPanel({ data, isMobile }) {
  if (!data) return null;

  const scoreColor = (score) => {
    if (score >= 80) return "#4ECCA3";
    if (score >= 65) return "#60A5FA";
    if (score >= 50) return "#FFD166";
    if (score >= 35) return "#F7A072";
    return "#E85D75";
  };

  const fmt = (n) => {
    if (!n && n !== 0) return "미정";
    if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억원`;
    if (n >= 10000000) return `${(n / 10000000).toFixed(0)}천만원`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(0)}백만원`;
    return `${n.toLocaleString()}원`;
  };

  const fmtUsd = (n) => {
    if (!n && n !== 0) return "미정";
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const sc = scoreColor(data.completion_score);
  const bd = data.completion_breakdown || {};
  const breakdownKeys = [
    { key: "premise_originality", label: "전제 독창성", max: 30 },
    { key: "structural_potential", label: "구조 완성 가능성", max: 25 },
    { key: "character_depth_potential", label: "캐릭터 심리 깊이", max: 25 },
    { key: "market_potential", label: "시장성 잠재력", max: 20 },
  ];

  const km = data.korean_market || {};
  const um = data.us_market || {};

  return (
    <div>
      {/* 완성도 점수 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 20, marginBottom: 20,
        padding: "16px 18px", borderRadius: 12,
        background: `${sc}08`, border: `1px solid ${sc}30`,
      }}>
        {/* 원형 점수 */}
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={36} cy={36} r={30} fill="none" stroke="var(--c-bd-1)" strokeWidth={6} />
            <circle cx={36} cy={36} r={30} fill="none" stroke={sc} strokeWidth={6}
              strokeDasharray={`${2 * Math.PI * 30 * data.completion_score / 100} ${2 * Math.PI * 30}`}
              strokeLinecap="round" />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: sc, lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
              {data.completion_score}
            </div>
            <div style={{ fontSize: 8, color: "var(--c-tx-40)", marginTop: 1 }}>/ 100</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: sc, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 4 }}>
            {data.completion_label}
          </div>
          <div style={{ fontSize: 11, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {data.market_tier}
          </div>
        </div>
      </div>

      {/* 세부 점수 */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-40)", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>완성도 세부 평가</div>
        {breakdownKeys.map(({ key, label, max }) => {
          const item = bd[key] || {};
          const score = item.score ?? 0;
          const pct = Math.round(score / max * 100);
          const c = scoreColor(pct);
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--c-tx-65)", fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{score}/{max}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", overflow: "hidden", marginBottom: 4 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 2, transition: "width 0.6s ease" }} />
              </div>
              {item.comment && (
                <div style={{ fontSize: 10, color: "var(--c-tx-40)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{item.comment}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 한국 시장 가격 */}
      <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(255,209,102,0.05)", border: "1px solid rgba(255,209,102,0.2)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#FFD166", letterSpacing: 0.5, marginBottom: 10 }}>한국 시장 예상 가격</div>
        {km.format_assumed && (
          <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif" }}>
            기준 포맷: {km.format_assumed}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {km.option_price && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif" }}>옵션 계약 (개발 단계)</div>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", marginTop: 1, fontFamily: "'Noto Sans KR', sans-serif" }}>{km.option_price.basis}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFD166", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>
                {fmt(km.option_price.min_krw)} ~ {fmt(km.option_price.max_krw)}
              </div>
            </div>
          )}
          {km.full_price_rookie && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 6, borderTop: "1px solid var(--c-card-3)" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif" }}>신인 작가 기준</div>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", marginTop: 1, fontFamily: "'Noto Sans KR', sans-serif" }}>{km.full_price_rookie.basis}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,209,102,0.7)", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>
                {fmt(km.full_price_rookie.min_krw)} ~ {fmt(km.full_price_rookie.max_krw)}
              </div>
            </div>
          )}
          {km.full_price_experienced && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 6, borderTop: "1px solid var(--c-card-3)" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--c-tx-55)", fontFamily: "'Noto Sans KR', sans-serif" }}>경력 작가 기준</div>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", marginTop: 1, fontFamily: "'Noto Sans KR', sans-serif" }}>{km.full_price_experienced.basis}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFD166", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>
                {fmt(km.full_price_experienced.min_krw)} ~ {fmt(km.full_price_experienced.max_krw)}
              </div>
            </div>
          )}
        </div>
        {km.recommended_buyers && km.recommended_buyers.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--c-card-3)" }}>
            <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginBottom: 5 }}>추천 바이어</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {km.recommended_buyers.map((b, i) => (
                <span key={i} style={{ padding: "2px 8px", borderRadius: 5, background: "rgba(255,209,102,0.1)", color: "#FFD166", fontSize: 10, fontWeight: 600 }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
        {km.price_rationale && (
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--c-tx-50)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {km.price_rationale}
          </div>
        )}
      </div>

      {/* 미국 시장 */}
      {(um.wga_minimum || um.spec_market_estimate) && (
        <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.15)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: 0.5, marginBottom: 10 }}>미국 시장 참고 (USD)</div>
          {um.format_assumed && (
            <div style={{ fontSize: 10, color: "var(--c-tx-30)", marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif" }}>기준: {um.format_assumed}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {um.wga_minimum && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>WGA 최저 기준</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtUsd(um.wga_minimum.min_usd)} ~ {fmtUsd(um.wga_minimum.max_usd)}
                </div>
              </div>
            )}
            {um.spec_market_estimate && (
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid var(--c-card-3)" }}>
                <div style={{ fontSize: 11, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>스펙 시장 추정가</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtUsd(um.spec_market_estimate.min_usd)} ~ {fmtUsd(um.spec_market_estimate.max_usd)}
                </div>
              </div>
            )}
          </div>
          {um.us_market_feasibility && (
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
              {um.us_market_feasibility}
            </div>
          )}
        </div>
      )}

      {/* 가치 요인 */}
      {(data.factors_boosting_value?.length > 0 || data.factors_reducing_value?.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {data.factors_boosting_value?.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#4ECCA3", marginBottom: 7 }}>가치 상승 요인</div>
              {data.factors_boosting_value.map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--c-tx-60)", marginBottom: 4, lineHeight: 1.4, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  + {f}
                </div>
              ))}
            </div>
          )}
          {data.factors_reducing_value?.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(232,93,117,0.04)", border: "1px solid rgba(232,93,117,0.12)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#E85D75", marginBottom: 7 }}>가치 하락 요인</div>
              {data.factors_reducing_value.map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--c-tx-60)", marginBottom: 4, lineHeight: 1.4, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  - {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 개발 권고 */}
      {data.development_recommendation && (
        <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 9, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#a78bfa", marginBottom: 6, letterSpacing: 0.5 }}>가치를 높이려면</div>
          <div style={{ fontSize: 12, color: "rgba(var(--tw),0.68)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {data.development_recommendation}
          </div>
        </div>
      )}

      {/* 비교 거래 사례 */}
      {data.comparable_deals?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-30)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>비교 거래 사례</div>
          {data.comparable_deals.map((deal, i) => (
            <div key={i} style={{ marginBottom: 6, padding: "9px 12px", borderRadius: 7, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-tx-70)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 3 }}>
                {deal.title}
              </div>
              <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                {deal.deal_info}
              </div>
              {deal.relevance && (
                <div style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {deal.relevance}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 면책 */}
      {data.disclaimer && (
        <div style={{ padding: "8px 12px", borderRadius: 7, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-card-3)" }}>
          <div style={{ fontSize: 10, color: "var(--c-tx-30)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
            ⚠ {data.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
