/**
 * EduModePanel.jsx — 교육 모드 전용 컴포넌트
 *
 * 포함:
 * - SelfAssessPanel   : 분석 전 자가 채점 (18개 항목)
 * - ScoreCriteriaModal: 항목별 평가 기준 모달
 * - ComparePanel      : 자가 채점 vs AI 점수 비교
 * - ReflectionBox     : 반성 일지 (분석 후)
 * - EduHintChecklist  : 분석 전 체크리스트 힌트
 *
 * 이론적 근거:
 * - 자가 예측 후 피드백: "Testing Effect" (Roediger & Karpicke, 2006)
 * - 메타인지 훈련: Flavell(1979) 메타인지 모델
 * - 서사 분석 기준: Blake Snyder(2005), Loewenstein(1994), Green & Brock(2000)
 */

import { useState, useEffect } from "react";
import { CRITERIA_GUIDE, LABELS_KR } from "../constants.js";

// ── 색상 팔레트 ──────────────────────────────────
const EDU_COLOR = "#A78BFA"; // 보라 (교육 모드 메인)
const SELF_COLOR = "#60A5FA"; // 파랑 (자가 채점)
const AI_COLOR = "#4ECCA3";  // 초록 (AI 점수)

// ── 항목별 학문적 근거 (CRITERIA_GUIDE 확장) ──────
const ACADEMIC_BASIS = {
  protagonist:         "McKee(1997) 『Story』 — 캐릭터의 구체성이 관객 동일시를 결정한다.",
  inciting_incident:   "Aristotle『시학』 — 사건의 발단(Protasis)이 플롯의 필연성을 만든다.",
  goal:               "Truby(2007) 『The Anatomy of Story』 — 명확한 욕구(Desire)가 드라마를 추진한다.",
  conflict:           "Hegel의 변증법 — 갈등(Antithesis)이 없으면 드라마가 존재하지 않는다.",
  stakes:             "Field(1979) 『Screenplay』 — 스테이크(Stakes)가 높을수록 관객의 감정적 투자가 깊어진다.",
  irony:              "Blake Snyder(2005) 『Save the Cat』 — 아이러니는 로그라인의 생명이자 관객을 사로잡는 첫 번째 훅이다.",
  mental_picture:     "Linda Seger(1994) — 좋은 로그라인은 그 자체로 영화 한 편을 머릿속에 재생시킨다.",
  emotional_hook:     "Damasio(1994) 『Descartes' Error』 — 감정 반응 없이는 합리적 결정도 없다. 이야기도 마찬가지.",
  originality:        "Csikszentmihalyi(1996) 창의성 이론 — 신선한 조합이 기억에 남는 작품을 만든다.",
  conciseness:        "Miller(1956) 매직 넘버 7 이론 — 인간의 작업 기억 용량 한계가 로그라인 길이를 규정한다.",
  active_language:    "Strunk & White『The Elements of Style』 — 능동태와 구체적 동사가 독자를 깨운다.",
  no_violations:      "업계 관습 — 에이전트·프로듀서가 첫 읽기에서 즉시 거부하는 패턴들.",
  genre_tone:         "Altman(1984) 장르 이론 — 장르는 관객과의 계약이다. 어긋나면 신뢰가 깨진다.",
  information_gap:    "Loewenstein(1994) 정보 격차 이론 — '알고 싶지만 모르는 상태'가 강렬한 호기심과 동기를 만든다.",
  cognitive_dissonance:"Festinger(1957) 인지 부조화 이론 — 모순된 두 요소의 충돌이 뇌를 깨우고 기억에 남긴다.",
  narrative_transportation:"Green & Brock(2000) 서사 전달 이론 — 이야기 속으로 들어가는 경험이 설득력과 몰입을 만든다.",
  universal_relatability:"Campbell(1949) 영웅 여정 — 인류 공통의 원초적 경험(사랑·생존·정체성)이 보편적 공감을 만든다.",
  unpredictability:   "Zillmann(1996) 서스펜스 이론 — 결말의 불확실성이 긴장감과 지속적 주의를 유발한다.",
};

// 섹션별 항목 구조
const SCORE_SECTIONS = {
  structure: {
    label: "구조", color: "#60A5FA", max: 50,
    items: [
      { key: "protagonist", max: 10 },
      { key: "inciting_incident", max: 10 },
      { key: "goal", max: 10 },
      { key: "conflict", max: 10 },
      { key: "stakes", max: 10 },
    ],
  },
  expression: {
    label: "표현", color: "#4ECCA3", max: 30,
    items: [
      { key: "irony", max: 10 },
      { key: "mental_picture", max: 8 },
      { key: "emotional_hook", max: 7 },
      { key: "originality", max: 5 },
    ],
  },
  technical: {
    label: "기술", color: "#F7A072", max: 20,
    items: [
      { key: "conciseness", max: 8 },
      { key: "active_language", max: 5 },
      { key: "no_violations", max: 3 },
      { key: "genre_tone", max: 4 },
    ],
  },
  interest: {
    label: "흥미도", color: "#A78BFA", max: 100,
    items: [
      { key: "information_gap", max: 25 },
      { key: "cognitive_dissonance", max: 25 },
      { key: "narrative_transportation", max: 25 },
      { key: "universal_relatability", max: 25 },
    ],
  },
};

// ── 점수 기준 모달 ────────────────────────────────
export function ScoreCriteriaModal({ itemKey, onClose }) {
  if (!itemKey) return null;
  const label = LABELS_KR[itemKey] || itemKey;
  const guide = CRITERIA_GUIDE[itemKey] || "";
  const academic = ACADEMIC_BASIS[itemKey] || "";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 440, width: "100%", background: "var(--bg-surface, #1a1a2e)", border: `1px solid ${EDU_COLOR}40`, borderRadius: 16, padding: "22px 24px", fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: EDU_COLOR, fontWeight: 700, marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>평가 기준</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-main, #e8e8e8)" }}>{label}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-tx-40)", padding: 4, fontSize: 18 }}>✕</button>
        </div>

        {/* 기준 설명 */}
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: `${EDU_COLOR}0a`, border: `1px solid ${EDU_COLOR}20` }}>
          <div style={{ fontSize: 10, color: EDU_COLOR, fontWeight: 700, marginBottom: 6 }}>채점 기준</div>
          <div style={{ fontSize: 13, color: "var(--c-tx-65, #aaa)", lineHeight: 1.75 }}>{guide}</div>
        </div>

        {/* 학문적 근거 */}
        {academic && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)" }}>
            <div style={{ fontSize: 10, color: "#C8A84B", fontWeight: 700, marginBottom: 5 }}>학문적 근거</div>
            <div style={{ fontSize: 12, color: "var(--c-tx-50, #999)", lineHeight: 1.65, fontStyle: "italic" }}>{academic}</div>
          </div>
        )}

        <button onClick={onClose} style={{ marginTop: 16, width: "100%", padding: "10px", borderRadius: 9, border: `1px solid ${EDU_COLOR}30`, background: `${EDU_COLOR}10`, color: EDU_COLOR, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          닫기
        </button>
      </div>
    </div>
  );
}

// ── 자가 채점 슬라이더 ────────────────────────────
function SelfScoreSlider({ itemKey, max, value, onChange, onInfoClick }) {
  const label = LABELS_KR[itemKey] || itemKey;
  const pct = max > 0 ? (value / max) * 100 : 0;
  const barColor = pct >= 80 ? "#4ECCA3" : pct >= 60 ? "#60A5FA" : pct >= 40 ? "#F7A072" : "#E85D75";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "var(--c-tx-65)" }}>{label}</span>
          <button
            onClick={() => onInfoClick(itemKey)}
            style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${EDU_COLOR}40`, background: `${EDU_COLOR}10`, color: EDU_COLOR, fontSize: 9, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}
            title="평가 기준 보기"
          >?</button>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor, fontFamily: "'JetBrains Mono', monospace" }}>
          {value} <span style={{ fontSize: 9, color: "var(--c-tx-30)" }}>/ {max}</span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="range" min={0} max={max} value={value}
          onChange={e => onChange(itemKey, Number(e.target.value))}
          style={{ flex: 1, accentColor: SELF_COLOR, height: 4, cursor: "pointer" }}
        />
      </div>
      <div style={{ height: 3, borderRadius: 2, background: "var(--c-bd-1)", marginTop: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ── 분석 전 체크리스트 힌트 ──────────────────────
const HINT_CHECKLIST = {
  structure: [
    { key: "protagonist", text: "주인공이 '누구'인지 구체적으로 알 수 있나요? (직업·특성·결핍)" },
    { key: "inciting_incident", text: "주인공의 일상을 깨뜨리는 구체적 사건이 있나요?" },
    { key: "goal", text: "주인공이 이야기 내내 원하는 것이 한 문장으로 분명한가요?" },
    { key: "conflict", text: "목표를 방해하는 힘(적대자·환경·내면)이 보이나요?" },
    { key: "stakes", text: "실패하면 무엇을 잃는지 암시되어 있나요?" },
  ],
  expression: [
    { key: "irony", text: "가장 그럴 것 같지 않은 사람이 그 일을 해야 하는 역설이 있나요?" },
    { key: "mental_picture", text: "읽었을 때 장면이 머릿속에 그려지나요?" },
    { key: "emotional_hook", text: "즉각적으로 감정 반응(기대·공포·웃음)이 오나요?" },
    { key: "originality", text: "비슷한 작품이 너무 많이 떠오르지는 않나요?" },
  ],
  technical: [
    { key: "conciseness", text: "50~100자 내외로 딱 필요한 정보만 있나요?" },
    { key: "active_language", text: "능동적이고 구체적인 동사를 사용했나요?" },
    { key: "no_violations", text: "결말 노출·질문형·클리셰 문구가 없나요?" },
    { key: "genre_tone", text: "장르에 맞는 분위기와 언어를 사용했나요?" },
  ],
  interest: [
    { key: "information_gap", text: "'그래서 어떻게 되는 거지?'라는 질문이 자연스럽게 드나요?" },
    { key: "cognitive_dissonance", text: "서로 어울리지 않는 두 요소가 충돌하고 있나요?" },
    { key: "narrative_transportation", text: "장면이 생생하게 머릿속에 재생되나요?" },
    { key: "universal_relatability", text: "누구나 공감할 수 있는 원초적 경험에 닿나요?" },
  ],
};

export function EduHintChecklist({ onStartAnalysis, loading }) {
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState({ structure: true, expression: false, technical: false, interest: false });
  const total = Object.values(HINT_CHECKLIST).flat().length;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleSection = (sec) => setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));

  return (
    <div style={{ marginBottom: 18, padding: "16px 18px", borderRadius: 12, border: `1px solid ${EDU_COLOR}25`, background: `${EDU_COLOR}06` }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: EDU_COLOR }}>분석 전 자가 진단</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2 }}>
            각 항목을 직접 확인해보세요. AI 분석 전에 먼저 생각하는 것이 학습 효과를 높입니다.
            <span style={{ fontSize: 9, color: "var(--c-tx-30)", display: "block", marginTop: 2 }}>
              * Roediger & Karpicke(2006) Testing Effect — 예측 후 피드백이 단순 읽기보다 장기 기억을 2~3배 향상
            </span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: EDU_COLOR, fontFamily: "'JetBrains Mono', monospace" }}>{checkedCount}</div>
          <div style={{ fontSize: 9, color: "var(--c-tx-30)" }}>/ {total}</div>
        </div>
      </div>

      {/* 체크리스트 섹션 */}
      {Object.entries(HINT_CHECKLIST).map(([sec, items]) => {
        const secMeta = SCORE_SECTIONS[sec];
        const secChecked = items.filter(i => checked[i.key]).length;
        return (
          <div key={sec} style={{ marginBottom: 8 }}>
            <button
              onClick={() => toggleSection(sec)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 8, border: `1px solid ${secMeta.color}22`, background: `${secMeta.color}08`, cursor: "pointer" }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: secMeta.color }}>{secMeta.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "var(--c-tx-40)", fontFamily: "'JetBrains Mono', monospace" }}>{secChecked}/{items.length}</span>
                <span style={{ fontSize: 10, color: "var(--c-tx-35)" }}>{expanded[sec] ? "▲" : "▼"}</span>
              </div>
            </button>
            {expanded[sec] && (
              <div style={{ padding: "8px 4px 0" }}>
                {items.map(({ key, text }) => (
                  <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7, cursor: "pointer" }}>
                    <input
                      type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)}
                      style={{ marginTop: 2, accentColor: secMeta.color, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 11, color: checked[key] ? "var(--c-tx-45)" : "var(--c-tx-65)", lineHeight: 1.6, textDecoration: checked[key] ? "line-through" : "none", transition: "all 0.2s" }}>
                      {text}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* AI 분석 버튼 */}
      <button
        onClick={onStartAnalysis}
        disabled={loading}
        style={{
          marginTop: 12, width: "100%", padding: "11px", borderRadius: 10,
          border: `1px solid ${checkedCount >= total * 0.6 ? AI_COLOR : EDU_COLOR}50`,
          background: checkedCount >= total * 0.6 ? `${AI_COLOR}12` : `${EDU_COLOR}08`,
          color: checkedCount >= total * 0.6 ? AI_COLOR : EDU_COLOR,
          fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer",
          fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s",
        }}
      >
        {loading ? "AI 분석 중..." : checkedCount >= total * 0.6 ? "✓ 준비 완료 — AI 분석 시작" : `AI 분석 시작 (${checkedCount}/${total} 확인됨)`}
      </button>
    </div>
  );
}

// ── 자가 채점 패널 ────────────────────────────────
export function SelfAssessPanel({ onConfirm, onInfoClick }) {
  const [scores, setScores] = useState(() => {
    const init = {};
    Object.values(SCORE_SECTIONS).forEach(sec => {
      sec.items.forEach(({ key, max }) => { init[key] = Math.round(max / 2); });
    });
    return init;
  });

  const handleChange = (key, val) => setScores(prev => ({ ...prev, [key]: val }));

  const totals = {
    structure: SCORE_SECTIONS.structure.items.reduce((s, { key }) => s + (scores[key] || 0), 0),
    expression: SCORE_SECTIONS.expression.items.reduce((s, { key }) => s + (scores[key] || 0), 0),
    technical: SCORE_SECTIONS.technical.items.reduce((s, { key }) => s + (scores[key] || 0), 0),
    interest: SCORE_SECTIONS.interest.items.reduce((s, { key }) => s + (scores[key] || 0), 0),
  };
  const quality = totals.structure + totals.expression + totals.technical;

  return (
    <div style={{ marginBottom: 18, padding: "16px 18px", borderRadius: 12, border: `1px solid ${SELF_COLOR}25`, background: `${SELF_COLOR}05` }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: SELF_COLOR }}>내 예상 점수 채점</div>
        <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2 }}>
          AI 분석 결과를 보기 전에 먼저 직접 채점해보세요. 예측과 실제의 차이가 학습 포인트입니다.
        </div>
      </div>

      {/* 섹션별 채점 */}
      {Object.entries(SCORE_SECTIONS).map(([sec, { label, color, max, items }]) => (
        <div key={sec} style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, border: `1px solid ${color}18`, background: `${color}04` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{totals[sec]} / {max}</span>
          </div>
          {items.map(({ key, max: itemMax }) => (
            <SelfScoreSlider
              key={key} itemKey={key} max={itemMax}
              value={scores[key] || 0}
              onChange={handleChange}
              onInfoClick={onInfoClick}
            />
          ))}
        </div>
      ))}

      {/* 종합 요약 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { label: "품질 점수", value: `${quality}/100`, color: SELF_COLOR },
          { label: "흥미도", value: `${totals.interest}/100`, color: "#A78BFA" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, minWidth: 100, padding: "8px 12px", borderRadius: 8, border: `1px solid ${color}22`, background: `${color}08`, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
            <div style={{ fontSize: 9, color: "var(--c-tx-30)", marginTop: 2 }}>{label} (내 예상)</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onConfirm(scores)}
        style={{ width: "100%", padding: "11px", borderRadius: 10, border: `1px solid ${SELF_COLOR}40`, background: `${SELF_COLOR}12`, color: SELF_COLOR, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        채점 완료 — AI 분석 결과 보기
      </button>
    </div>
  );
}

// ── AI vs 자가 채점 비교 패널 ────────────────────
export function ComparePanel({ selfScores, aiResult }) {
  if (!selfScores || !aiResult) return null;

  const getAiScore = (section, key) => aiResult[section]?.[key]?.score ?? 0;

  const allItems = Object.values(SCORE_SECTIONS).flatMap(({ items }) => items);
  const section = (key) => Object.entries(SCORE_SECTIONS).find(([, s]) => s.items.some(i => i.key === key))?.[0];

  const diffs = allItems.map(({ key, max }) => {
    const self = selfScores[key] || 0;
    const ai = getAiScore(section(key), key);
    return { key, self, ai, max, diff: ai - self, pct: max ? ((ai - self) / max) * 100 : 0 };
  });

  const bigGaps = diffs.filter(d => Math.abs(d.diff) >= 2).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5);

  return (
    <div style={{ marginBottom: 18, padding: "16px 18px", borderRadius: 12, border: "1px solid rgba(200,168,75,0.25)", background: "rgba(200,168,75,0.04)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B", marginBottom: 4 }}>예상 vs AI 비교</div>
      <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 14 }}>
        차이가 큰 항목이 핵심 학습 포인트입니다.
      </div>

      {/* 주요 격차 항목 */}
      {bigGaps.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#C8A84B", fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>주요 격차 항목</div>
          {bigGaps.map(({ key, self, ai, max, diff }) => {
            const label = LABELS_KR[key] || key;
            const overEst = diff < 0;
            const c = overEst ? "#E85D75" : "#4ECCA3";
            return (
              <div key={key} style={{ marginBottom: 8, padding: "9px 12px", borderRadius: 9, border: `1px solid ${c}20`, background: `${c}05` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-tx-70)" }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace" }}>
                    {overEst ? "▼" : "▲"} {Math.abs(diff)}점
                  </span>
                </div>
                {/* 내 점수 바 */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--c-tx-35)", marginBottom: 2 }}>
                    <span>내 예상</span><span>{self}/{max}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(self / max) * 100}%`, background: SELF_COLOR, borderRadius: 2 }} />
                  </div>
                </div>
                {/* AI 점수 바 */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--c-tx-35)", marginBottom: 2 }}>
                    <span>AI 분석</span><span>{ai}/{max}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(ai / max) * 100}%`, background: AI_COLOR, borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginTop: 6, lineHeight: 1.5 }}>
                  {CRITERIA_GUIDE[key]?.slice(0, 80)}...
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bigGaps.length === 0 && (
        <div style={{ padding: "12px", borderRadius: 9, background: "rgba(78,204,163,0.08)", border: "1px solid rgba(78,204,163,0.2)", fontSize: 12, color: "#4ECCA3", textAlign: "center" }}>
          모든 항목에서 예상이 정확했습니다! 탁월한 자가 인식입니다.
        </div>
      )}

      {/* 범례 */}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        {[{ color: SELF_COLOR, label: "내 예상" }, { color: AI_COLOR, label: "AI 분석" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 3, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 10, color: "var(--c-tx-35)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 반성 일지 ────────────────────────────────────
export function ReflectionBox() {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem("hll_reflection_" + new Date().toDateString()) || ""; } catch { return ""; }
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    try {
      localStorage.setItem("hll_reflection_" + new Date().toDateString(), text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div style={{ marginTop: 20, padding: "16px 18px", borderRadius: 12, border: `1px solid ${EDU_COLOR}22`, background: `${EDU_COLOR}05` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: EDU_COLOR, marginBottom: 4 }}>반성 일지</div>
      <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 10, lineHeight: 1.6 }}>
        이 분석을 통해 무엇을 배웠나요? 예상과 달랐던 점, 개선할 방향을 자유롭게 적어보세요.
        <span style={{ fontSize: 9, color: "var(--c-tx-25)", display: "block", marginTop: 2 }}>
          * Flavell(1979) 메타인지 이론 — 자신의 사고 과정을 의식적으로 반성할 때 학습이 심화됩니다.
        </span>
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false); }}
        placeholder={"예상했던 점수와 AI 점수의 차이가 있었나요?\n어떤 부분이 약점이었고, 어떻게 고쳐볼 수 있을까요?\n다음 로그라인 작성 시 무엇을 달리 해볼 것인가요?"}
        style={{
          width: "100%", boxSizing: "border-box", minHeight: 100,
          padding: "10px 12px", borderRadius: 9,
          border: `1px solid ${EDU_COLOR}25`, background: "var(--bg-page, #0f0f13)",
          color: "var(--text-main, #e8e8e8)", fontSize: 12, lineHeight: 1.7,
          fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical", outline: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          onClick={save}
          style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${EDU_COLOR}35`, background: saved ? `${AI_COLOR}15` : `${EDU_COLOR}10`, color: saved ? AI_COLOR : EDU_COLOR, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.2s" }}
        >
          {saved ? "✓ 저장됨" : "저장"}
        </button>
      </div>
    </div>
  );
}
