import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { CRITERIA_GUIDE, LABELS_KR, GENRES, IMPROVEMENT_SYSTEM_PROMPT, WEAKNESS_FIX_SYSTEM_PROMPT, STORY_PIVOT_SYSTEM_PROMPT } from "./constants.js";
import { getGrade, getInterestLevel, formatDate, calcSectionTotal, callClaude } from "./utils.js";
import { ImprovementSchema, WeaknessFixSchema, StoryPivotSchema } from "./schemas.js";

export function ApiKeyModal({ initialKey = "", onSave, onCancel }) {
  const [key, setKey] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);
  const [remember, setRemember] = useState(!!localStorage.getItem("logline_api_key"));

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
            onKeyDown={(e) => e.key === "Enter" && key.trim() && onSave(key.trim(), remember)}
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
        {/* 기기에 저장 옵션 */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: "#4ECCA3", cursor: "pointer" }}
          />
          <span style={{ fontSize: 12, color: "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            이 기기에 저장 <span style={{ color: "var(--c-tx-25)", fontSize: 11 }}>(해제 시 탭 닫으면 초기화)</span>
          </span>
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => key.trim() && onSave(key.trim(), remember)}
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
              background: "var(--bg-tooltip)",
              border: "1px solid rgba(78,204,163,0.25)",
              borderRadius: 10,
              padding: "10px 13px",
              fontSize: 11,
              lineHeight: 1.7,
              color: "var(--text-tooltip)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
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
// 레이더 차트 SVG (13축, 섹션별 색상)
// ─────────────────────────────────────────────
const RADAR_SECTION_COLORS = {
  structure:  "#4ECCA3",
  expression: "#45B7D1",
  technical:  "#FB923C",
};

export function RadarChart({ data, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  const n = data.length;
  const angleStep = 360 / n;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  function polarToCart(angle, radius) {
    const a = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }

  const polyPoints = data.map((d, i) => {
    const p = polarToCart(i * angleStep, r * Math.max(0.04, d.value));
    return `${p.x},${p.y}`;
  }).join(" ");

  // 섹션별 부분 채우기 경로 (섹션이 있을 때)
  const hasSections = data.some(d => d.section);

  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size }}>
        {/* 그리드 */}
        {gridLevels.map((lv, li) => (
          <polygon key={li} fill="none" stroke="var(--c-bd-3)"
            strokeWidth={li === 3 ? 1.2 : 0.4}
            points={Array.from({ length: n }, (_, i) => {
              const p = polarToCart(i * angleStep, r * lv);
              return `${p.x},${p.y}`;
            }).join(" ")} />
        ))}
        {/* 축선 */}
        {data.map((d, i) => {
          const p = polarToCart(i * angleStep, r);
          const color = hasSections ? (RADAR_SECTION_COLORS[d.section] || "var(--c-bd-1)") : "var(--c-bd-1)";
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={color} strokeWidth={0.4} strokeOpacity={0.4} />;
        })}
        {/* 메인 폴리곤 */}
        <polygon points={polyPoints} fill="rgba(78,204,163,0.12)" stroke="#4ECCA3" strokeWidth={1.5} strokeOpacity={0.8} />
        {/* 데이터 점 + 스코어 레이블 */}
        {data.map((d, i) => {
          const p = polarToCart(i * angleStep, r * Math.max(0.04, d.value));
          const color = hasSections ? (RADAR_SECTION_COLORS[d.section] || "#4ECCA3") : "#4ECCA3";
          // 텍스트 앵커 방향 계산
          const angle = i * angleStep;
          const anchor = angle > 15 && angle < 165 ? "start" : angle > 195 && angle < 345 ? "end" : "middle";
          const scoreText = d.rawScore !== undefined ? `${d.rawScore}` : null;
          const scorePt = polarToCart(i * angleStep, r * Math.max(0.04, d.value) + (d.value > 0.7 ? -11 : 11));
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={3} fill={color} stroke="var(--bg-page)" strokeWidth={1} />
              {scoreText && (
                <text x={scorePt.x} y={scorePt.y} textAnchor={anchor} dominantBaseline="middle"
                  fontSize={7} fill={color} fontFamily="'JetBrains Mono', monospace"
                  style={{ userSelect: "none" }}>
                  {scoreText}
                </text>
              )}
            </g>
          );
        })}
        {/* 축 레이블 */}
        {data.map((d, i) => {
          const p = polarToCart(i * angleStep, r + (size < 240 ? 16 : 20));
          const color = hasSections ? (RADAR_SECTION_COLORS[d.section] || "var(--c-tx-55)") : "var(--c-tx-65)";
          const angle = i * angleStep;
          const anchor = angle > 15 && angle < 165 ? "start" : angle > 195 && angle < 345 ? "end" : "middle";
          return (
            <text key={i} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
              fill={color} fontSize={size < 240 ? 8 : 9} fontFamily="'Noto Sans KR', sans-serif"
              style={{ userSelect: "none" }}>
              {d.label}
            </text>
          );
        })}
      </svg>
      {/* 섹션 범례 */}
      {hasSections && (
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 4 }}>
          {[
            { key: "structure",  label: "구조" },
            { key: "expression", label: "표현" },
            { key: "technical",  label: "기술" },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: RADAR_SECTION_COLORS[key] }} />
              <span style={{ fontSize: 9, color: RADAR_SECTION_COLORS[key], fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
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
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--c-bd-2)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.2)",
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
export function ImprovementPanel({ logline, genre, apiKey, result, onReanalyze, onImprovementChange }) {
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
      onImprovementChange?.(data);
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
export function StoryDevPanel({ logline, genre, result, apiKey, onApply, onFixesChange, onPivotsChange }) {
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
      const newFixes = data.fixes || [];
      setFixes(newFixes);
      setFixState("done");
      onFixesChange?.(newFixes);
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
      const newPivots = data.pivots || [];
      setPivots(newPivots);
      setPivotState("done");
      onPivotsChange?.(newPivots);
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
            <button onClick={() => { setFixState("idle"); setFixes([]); onFixesChange?.([]); }} style={{ background: "none", border: "none", color: "var(--c-tx-25)", cursor: "pointer", fontSize: 11, marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>
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
            <button onClick={() => { setPivotState("idle"); setPivots([]); onPivotsChange?.([]); }} style={{ background: "none", border: "none", color: "var(--c-tx-25)", cursor: "pointer", fontSize: 11, marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>
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

// BeatSheetPanel — see panels/BeatSheetPanel.jsx (lazy-loaded by logline-analyzer)

// ─────────────────────────────────────────────
// 하위텍스트 탐지 패널
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
