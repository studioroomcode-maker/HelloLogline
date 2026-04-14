// ─────────────────────────────────────────────
// 비트 시트 패널 (lazy-loaded)
// ─────────────────────────────────────────────

import { useState } from "react";

const MEMBER_COLORS = ["#4ECCA3", "#A78BFA", "#FB923C", "#60A5FA", "#F472B6", "#FBBF24", "#34D399", "#F87171"];
const MEMBER_ROLES = ["메인작가", "보조작가", "작가실장"];

function TeamManager({ teamMembers, onUpdateTeam }) {
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState("보조작가");

  const addMember = () => {
    const name = nameInput.trim();
    if (!name || teamMembers.length >= 8) return;
    const color = MEMBER_COLORS[teamMembers.length % MEMBER_COLORS.length];
    const id = `m${Date.now()}`;
    onUpdateTeam([...teamMembers, { id, name, role: roleInput, color }]);
    setNameInput("");
  };

  const removeMember = (id) => {
    onUpdateTeam(teamMembers.filter(m => m.id !== id));
  };

  return (
    <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.04)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>
        팀 구성원 ({teamMembers.length}/8)
      </div>

      {/* 구성원 목록 */}
      {teamMembers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {teamMembers.map(m => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 8px 4px 6px", borderRadius: 20,
              border: `1px solid ${m.color}40`, background: `${m.color}10`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: m.color, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}>{m.name}</span>
              <span style={{ fontSize: 9, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace" }}>{m.role}</span>
              <button onClick={() => removeMember(m.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--c-tx-30)", fontSize: 11, padding: "0 2px", lineHeight: 1,
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* 추가 폼 */}
      {teamMembers.length < 8 && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addMember()}
            placeholder="이름 입력"
            style={{
              flex: "1 1 80px", minWidth: 70, padding: "5px 9px",
              borderRadius: 7, border: "1px solid var(--c-bd-3)",
              background: "var(--c-card-1)", color: "var(--text-main)",
              fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
            }}
          />
          <select
            value={roleInput}
            onChange={e => setRoleInput(e.target.value)}
            style={{
              padding: "5px 8px", borderRadius: 7, border: "1px solid var(--c-bd-3)",
              background: "var(--c-card-1)", color: "var(--text-main)",
              fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", cursor: "pointer", outline: "none",
            }}
          >
            {MEMBER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={addMember}
            disabled={!nameInput.trim()}
            style={{
              padding: "5px 11px", borderRadius: 7,
              border: "1px solid rgba(167,139,250,0.3)",
              background: nameInput.trim() ? "rgba(167,139,250,0.12)" : "transparent",
              color: nameInput.trim() ? "#A78BFA" : "var(--c-tx-25)",
              fontSize: 11, fontWeight: 600, cursor: nameInput.trim() ? "pointer" : "default",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >+ 추가</button>
        </div>
      )}
    </div>
  );
}

export default function BeatSheetPanel({ data, beatScenes, generatingBeat, expandedBeats, onToggle, onGenerateScene, onExportAll, isMobile, editingBeats, beatEditDrafts, onEditBeat, onSaveBeat, onCancelBeat, teamMembers = [], sceneAssignments = {}, onAssignScene, onUpdateTeam }) {
  const [showTeamManager, setShowTeamManager] = useState(false);
  const beats = data.beats || [];

  const ACT_META = {
    "1막": { color: "#4ECCA3", bg: "rgba(78,204,163,0.08)", label: "1막" },
    "2막 전반": { color: "#45B7D1", bg: "rgba(69,183,209,0.08)", label: "2막 전반" },
    "2막 후반": { color: "#F7A072", bg: "rgba(247,160,114,0.08)", label: "2막 후반" },
    "3막": { color: "#E85D75", bg: "rgba(232,93,117,0.08)", label: "3막" },
  };

  // 진행률 계산
  const completedCount = Object.keys(beatScenes).length;

  // 감정 강도 매핑 (−5 ~ +5)
  const BEAT_EMOTION = {
    "Opening Image":          -2,
    "Theme Stated":            0,
    "Set-Up":                 -1,
    "Catalyst":               +2,
    "Debate":                 -2,
    "Break Into Two":         +2,
    "B Story":                +1,
    "Fun and Games":          +3,
    "Midpoint":               +2,
    "Bad Guys Close In":      -2,
    "All Is Lost":            -5,
    "Dark Night of the Soul": -4,
    "Break Into Three":       +2,
    "Finale":                 +4,
    "Final Image":            +3,
  };

  const BEAT_WRITER_ACTIONS = {
    "Opening Image":    "첫 이미지는 마지막 이미지와 정확히 대비되어야 합니다. 주인공의 변화 전 세계를 한 컷으로 보여주세요. 대사 없이 톤이 전달되어야 합니다.",
    "Theme Stated":     "아직 이해하지 못할 조언이 여기서 나옵니다. 주인공이 결말에서 깨달을 진실을 지금은 흘려듣게 하세요.",
    "Set-Up":           "이후 페이아웃될 모든 캐릭터·소품·관계를 소개하세요. 3막에서 쓸 '체호프의 총'을 여기서 걸어두세요.",
    "Catalyst":         "주인공의 삶을 영원히 바꾸는 사건. '만약 이것이 없었더라면'이 되는 순간. 능동적이고 구체적으로 쓰세요.",
    "Debate":           "주인공이 망설이는 내면의 소리가 드러나는 구간. 결핍(Ghost)이 자연스럽게 보여야 합니다.",
    "Break Into Two":   "주인공이 능동적으로 새 세계에 발을 내딛는 순간. 밀려가는 것이 아니라 스스로 선택해야 합니다.",
    "B Story":          "메인 플롯의 감정적 반대편. 이 인물을 통해 테마가 처음 제대로 탐구됩니다. 보통 로맨스·멘토 관계.",
    "Fun and Games":    "관객이 이 이야기를 선택한 이유가 여기 있습니다. 장르의 약속을 최대한 이행하세요. 가장 재미있는 구간.",
    "Midpoint":         "거짓 승리 또는 거짓 패배. 스테이크를 높이고 B스토리와 A스토리가 처음 교차하게 만드세요.",
    "Bad Guys Close In":"내외부 압박이 동시에 최고조. 팀이 있다면 여기서 균열이 시작됩니다. 주인공을 코너로 몰아세요.",
    "All Is Lost":      "주인공의 가장 낮은 순간. '죽음의 냄새'가 있어야 합니다 — 반드시 물리적 죽음일 필요는 없어요.",
    "Dark Night of the Soul": "주인공이 홀로 남아 진짜 자신과 마주하는 순간. 여기서 내면의 변화(Need 발견)가 일어납니다.",
    "Break Into Three": "해결책이 떠오르는 순간. A스토리와 B스토리가 하나로 통합됩니다.",
    "Finale":           "주인공이 변화된 모습으로 세상을 바꿉니다. 1막의 결핍이 여기서 해결됩니다. 변화를 행동으로 보여주세요.",
    "Final Image":      "오프닝 이미지와 정확히 대비되어야 합니다. 변화를 말하지 말고 보여주세요.",
  };

  // Generic hints by act_phase if name_en not found
  const ACT_PHASE_HINTS = {
    "설정":       "캐릭터의 결핍과 일상 세계를 시각적으로 보여주세요. 대사보다 행동과 환경으로 말하세요.",
    "전환":       "주인공이 한 세계에서 다른 세계로 넘어가는 순간. 선택의 무게를 느끼게 하세요.",
    "갈등 고조":  "압박을 점진적으로 높이세요. 각 씬은 이전 씬보다 더 위험해야 합니다.",
    "위기":       "최악의 순간. 여기서 주인공의 진짜 선택이 드러납니다.",
    "해결":       "변화를 말하지 말고 행동으로 보여주세요. 관객이 예측하지 못한 방식으로 마무리하세요.",
  };

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
      <div style={{ height: 4, borderRadius: 2, background: "var(--c-bd-1)", marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${beats.length ? (completedCount / beats.length) * 100 : 0}%`, background: "linear-gradient(90deg, #4ECCA3, #45B7D1)", borderRadius: 2, transition: "width 0.5s ease" }} />
      </div>

      {/* 팀 관리 토글 버튼 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showTeamManager ? 6 : 14 }}>
        <button
          onClick={() => setShowTeamManager(p => !p)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 10px", borderRadius: 7,
            border: `1px solid ${teamMembers.length > 0 ? "rgba(167,139,250,0.35)" : "var(--c-bd-3)"}`,
            background: teamMembers.length > 0 ? "rgba(167,139,250,0.08)" : "transparent",
            color: teamMembers.length > 0 ? "#A78BFA" : "var(--c-tx-35)",
            fontSize: 10, fontWeight: 600, cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
            <path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/>
          </svg>
          팀 구성원 {teamMembers.length > 0 ? `(${teamMembers.length})` : "설정"}
          <span style={{ fontSize: 8 }}>{showTeamManager ? "▲" : "▼"}</span>
        </button>
        {teamMembers.length > 0 && (
          <div style={{ display: "flex", gap: 4 }}>
            {teamMembers.map(m => (
              <div key={m.id} title={`${m.name} · ${m.role}`} style={{
                width: 22, height: 22, borderRadius: "50%",
                background: `${m.color}22`, border: `1.5px solid ${m.color}66`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: m.color,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>
                {m.name.slice(0, 1)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 팀 관리 패널 */}
      {showTeamManager && onUpdateTeam && (
        <TeamManager teamMembers={teamMembers} onUpdateTeam={onUpdateTeam} />
      )}

      {/* ── 페이지 타임라인 ── */}
      {beats.length >= 2 && data.total_pages > 0 && (() => {
        const total = data.total_pages;
        // 막 경계 계산
        const actBoundaries = [];
        let curAct = null;
        beats.forEach((b, i) => {
          if (b.act !== curAct) { actBoundaries.push({ act: b.act, beatIdx: i }); curAct = b.act; }
        });
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--c-tx-30)", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Page Timeline · {total}p</div>
            <div style={{ position: "relative", height: 30, borderRadius: 7, background: "var(--c-bd-1)", overflow: "hidden" }}>
              {beats.map((b) => {
                const act = ACT_META[b.act] || ACT_META["1막"];
                const left = ((b.page_start || 1) / total) * 100;
                const end = b.page_end || b.page_start || 1;
                const width = Math.max(0.5, ((end - (b.page_start || 1) + 1) / total) * 100);
                return (
                  <div key={b.id} title={`${b.name_kr} (p.${b.page_start}~${end})`}
                    style={{ position: "absolute", left: `${left}%`, width: `${width}%`, height: "100%", background: act.color, opacity: 0.55, borderRight: "1px solid rgba(0,0,0,0.25)" }} />
                );
              })}
              {/* 막 레이블 */}
              {actBoundaries.map(({ act, beatIdx }) => {
                const meta = ACT_META[act] || ACT_META["1막"];
                const b = beats[beatIdx];
                const left = ((b.page_start || 1) / total) * 100;
                return (
                  <div key={act} style={{ position: "absolute", left: `${left + 0.5}%`, top: "50%", transform: "translateY(-50%)", fontSize: 8, color: "rgba(0,0,0,0.65)", fontWeight: 800, fontFamily: "'Noto Sans KR', sans-serif", pointerEvents: "none", whiteSpace: "nowrap", letterSpacing: 0.3 }}>
                    {meta.label}
                  </div>
                );
              })}
            </div>
            {/* 페이지 눈금 */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              {[0, 0.25, 0.5, 0.75, 1].map(r => (
                <span key={r} style={{ fontSize: 8, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(r * total)}p</span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── 감정 아크 그래프 ── */}
      {beats.length >= 3 && (() => {
        const W = 560, H = 130, PX = 28, PY = 18;
        const innerW = W - PX * 2, innerH = H - PY * 2 - 16; // 하단 레이블 공간 확보
        const points = beats.map((b, i) => {
          const emo = BEAT_EMOTION[b.name_en] ?? 0;
          const x = PX + (i / (beats.length - 1)) * innerW;
          const y = PY + ((5 - emo) / 10) * innerH;
          return { x, y, emo, beat: b };
        });

        // 부드러운 bezier 경로
        const pathD = points.reduce((acc, pt, i) => {
          if (i === 0) return `M ${pt.x} ${pt.y}`;
          const prev = points[i - 1];
          const cpX = (prev.x + pt.x) / 2;
          return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
        }, "");
        const zeroY = PY + (5 / 10) * innerH;
        const fillD = `${pathD} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;

        // 막별 배경 구역 계산
        const actZones = [];
        let curAct = null, zoneStart = PX;
        beats.forEach((b, i) => {
          const x = PX + (i / (beats.length - 1)) * innerW;
          if (b.act !== curAct) {
            if (curAct !== null) actZones.push({ act: curAct, x1: zoneStart, x2: x });
            curAct = b.act; zoneStart = x;
          }
          if (i === beats.length - 1) actZones.push({ act: curAct, x1: zoneStart, x2: x });
        });

        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>Emotional Arc</div>
            <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: 10, border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.01)", padding: "0 0 2px" }}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="emo-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ECCA3" stopOpacity="0.18" />
                    <stop offset="50%" stopColor="#4ECCA3" stopOpacity="0.04" />
                    <stop offset="100%" stopColor="#E85D75" stopOpacity="0.18" />
                  </linearGradient>
                  <linearGradient id="emo-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#45B7D1" />
                    <stop offset="50%" stopColor="#4ECCA3" />
                    <stop offset="100%" stopColor="#C8A84B" />
                  </linearGradient>
                </defs>

                {/* 막별 배경 구역 */}
                {actZones.map((z, zi) => {
                  const meta = ACT_META[z.act] || ACT_META["1막"];
                  return (
                    <g key={zi}>
                      <rect x={z.x1} y={PY} width={z.x2 - z.x1} height={innerH} fill={meta.color} fillOpacity={0.05} />
                      {zi > 0 && <line x1={z.x1} y1={PY} x2={z.x1} y2={PY + innerH} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3 2" />}
                      <text x={(z.x1 + z.x2) / 2} y={PY + 9} textAnchor="middle" fontSize={7} fill={meta.color} fillOpacity={0.7} fontFamily="monospace" style={{ userSelect: "none" }}>{meta.label}</text>
                    </g>
                  );
                })}

                {/* 기준선 (감정 0) */}
                <line x1={PX} y1={zeroY} x2={W - PX} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 3" />

                {/* y축 레이블 */}
                {[5, 0, -5].map(v => {
                  const ly = PY + ((5 - v) / 10) * innerH;
                  return <text key={v} x={PX - 4} y={ly + 3.5} fontSize={7} textAnchor="end" fill="rgba(255,255,255,0.2)" fontFamily="monospace">{v > 0 ? `+${v}` : v}</text>;
                })}

                {/* 채우기 + 라인 */}
                <path d={fillD} fill="url(#emo-fill)" />
                <path d={pathD} fill="none" stroke="url(#emo-line)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

                {/* 비트 점 + 레이블 */}
                {points.map((pt, i) => {
                  const labelY = i % 2 === 0 ? H - 5 : H - 13;
                  const valText = pt.beat.value_start && pt.beat.value_end ? `${pt.beat.value_start}→${pt.beat.value_end}` : null;
                  return (
                    <g key={i}>
                      {valText && <title>{`${pt.beat.name_kr}\n${valText}`}</title>}
                      <circle cx={pt.x} cy={pt.y} r={4} fill={pt.emo < -2 ? "#E85D75" : pt.emo > 2 ? "#4ECCA3" : pt.emo > 0 ? "#45B7D1" : "#F7A072"} stroke="var(--bg-page)" strokeWidth={1.5} />
                      <text x={pt.x} y={labelY} fontSize={5.5} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontFamily="monospace" style={{ userSelect: "none" }}>
                        {pt.beat.name_en?.split(" ").pop() || (i + 1)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            {/* 범례 */}
            <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
              {[
                { color: "#E85D75", label: "극저 (All Is Lost)" },
                { color: "#F7A072", label: "저" },
                { color: "#45B7D1", label: "중" },
                { color: "#4ECCA3", label: "고 (Finale)" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: 9, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
                    {(() => {
                      const assignedId = sceneAssignments[beat.id];
                      const assignedMember = assignedId ? teamMembers.find(m => m.id === assignedId) : null;
                      if (!assignedMember) return null;
                      return (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 9, padding: "1px 6px 1px 4px", borderRadius: 20,
                          border: `1px solid ${assignedMember.color}40`,
                          background: `${assignedMember.color}12`,
                          color: assignedMember.color,
                          fontFamily: "'Noto Sans KR', sans-serif",
                          fontWeight: 600,
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: assignedMember.color }} />
                          {assignedMember.name}
                        </span>
                      );
                    })()}
                  </div>
                  {!isExpanded && <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {beatEditDrafts?.[beat.id] || beat.summary}
                    {beatEditDrafts?.[beat.id] && beatEditDrafts[beat.id] !== beat.summary && <span style={{ fontSize: 9, color: "#4ECCA3", marginLeft: 6 }}>✏</span>}
                  </div>}
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
                  {editingBeats?.[beat.id] ? (
                    <div style={{ marginBottom: 12 }}>
                      <textarea
                        value={beatEditDrafts?.[beat.id] ?? beat.summary}
                        onChange={e => onEditBeat(beat.id, e.target.value)}
                        rows={3}
                        style={{
                          width: "100%", padding: "8px 10px",
                          background: "rgba(var(--tw),0.04)", border: "1px solid rgba(255,209,102,0.25)",
                          borderRadius: 8, color: "var(--text-main)", fontSize: 12, lineHeight: 1.6,
                          fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical",
                          boxSizing: "border-box", outline: "none", marginTop: 6,
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button onClick={() => onCancelBeat(beat.id)}
                          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--c-bd-3)", background: "none", color: "var(--c-tx-45)", fontSize: 10, cursor: "pointer" }}>취소</button>
                        <button onClick={() => onSaveBeat(beat.id)}
                          style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(255,209,102,0.4)", background: "rgba(255,209,102,0.1)", color: "#FFD166", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>저장</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: "var(--c-tx-70)", lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif", flex: 1, padding: "10px 12px", borderRadius: 9, background: "var(--c-card-1)", border: "1px solid var(--c-bd-1)" }}>
                        {beatEditDrafts?.[beat.id] || beat.summary}
                        {beatEditDrafts?.[beat.id] && beatEditDrafts[beat.id] !== beat.summary &&
                          <span style={{ fontSize: 9, color: "#4ECCA3", marginLeft: 6 }}>✏</span>
                        }
                      </div>
                      <button
                        onClick={() => onEditBeat(beat.id, null)}
                        style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--c-tx-25)", fontSize: 10, padding: "2px 4px", opacity: 0.6 }}
                        title="편집"
                      >✏</button>
                    </div>
                  )}

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

                  {/* 작가 액션 힌트 */}
                  {(() => {
                    const hint = BEAT_WRITER_ACTIONS[beat.name_en] || ACT_PHASE_HINTS[beat.act_phase] || null;
                    if (!hint) return null;
                    return (
                      <div style={{
                        marginBottom: 10, padding: "9px 12px", borderRadius: 8,
                        background: `${act.color}06`,
                        border: `1px dashed ${act.color}30`,
                      }}>
                        <div style={{ fontSize: 9, color: `${act.color}70`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>✍ 작가 할 일</div>
                        <div style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65, fontFamily: "'Noto Sans KR', sans-serif" }}>{hint}</div>
                      </div>
                    );
                  })()}

                  {/* 담당자 배정 (팀원이 있을 때만) */}
                  {teamMembers.length > 0 && onAssignScene && (
                    <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>담당자</span>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {/* 미배정 버튼 */}
                        <button
                          onClick={() => onAssignScene(beat.id, null)}
                          style={{
                            padding: "3px 8px", borderRadius: 20, fontSize: 10,
                            border: `1px solid ${!sceneAssignments[beat.id] ? "rgba(255,255,255,0.3)" : "var(--c-bd-3)"}`,
                            background: !sceneAssignments[beat.id] ? "rgba(255,255,255,0.1)" : "transparent",
                            color: !sceneAssignments[beat.id] ? "var(--text-main)" : "var(--c-tx-30)",
                            cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
                          }}
                        >미배정</button>
                        {teamMembers.map(m => {
                          const isAssigned = sceneAssignments[beat.id] === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => onAssignScene(beat.id, m.id)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "3px 8px 3px 5px", borderRadius: 20, fontSize: 10,
                                border: `1px solid ${isAssigned ? m.color + "66" : m.color + "25"}`,
                                background: isAssigned ? m.color + "20" : "transparent",
                                color: isAssigned ? m.color : "var(--c-tx-40)",
                                cursor: "pointer", fontWeight: isAssigned ? 700 : 400,
                                fontFamily: "'Noto Sans KR', sans-serif",
                                transition: "all 0.15s",
                              }}
                            >
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, opacity: isAssigned ? 1 : 0.5 }} />
                              {m.name}
                            </button>
                          );
                        })}
                      </div>
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
                    <div style={{ borderRadius: 10, border: `1px solid ${act.color}22`, background: "var(--bg-page)", overflow: "hidden" }}>
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
                            return <div key={idx} style={{ fontWeight: 800, color: "var(--text-main)", letterSpacing: 0.5, marginTop: idx > 0 ? 10 : 0, textTransform: "uppercase" }}>{line}</div>;
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
