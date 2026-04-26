import { useRef, useEffect, Suspense, useState, lazy } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import SidebarNavItem from "./SidebarNavItem.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import NotificationPanel from "./NotificationPanel.jsx";
import OllamaSettings from "./OllamaSettings.jsx";
import { WORK_MODES, findModeForStage } from "../workModes.js";

const StageCommentThread = lazy(() => import("./StageCommentThread.jsx"));

function DashboardIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

// 스테이지 메타
const STAGE_META = [
  { id: "1", title: "로그라인",       sub: "한 줄 입력 → 분석",        color: "#C8A84B" },
  { id: "2", title: "핵심 설계",      sub: "Want·Need·적대자·테마",   color: "#A78BFA", optional: false },
  { id: "3", title: "캐릭터",         sub: "심리 · 욕구 · 아크",       color: "#FB923C" },
  { id: "4", title: "스토리 설계",    sub: "구조 · 시놉시스",          color: "#4ECCA3" },
  { id: "5", title: "트리트먼트",     sub: "씬 구성 · 비트시트",       color: "#C8A84B" },
  { id: "6", title: "시나리오 초고",  sub: "자동 초고 생성",           color: "#A78BFA" },
  { id: "7", title: "Script Coverage", sub: "심사 · 시장 가치",        color: "#60A5FA" },
  { id: "8", title: "고쳐쓰기",       sub: "진단 → 수정 → 개고",      color: "#FB923C" },
  { id: "9", title: "Deep Analysis", sub: "신화·학술·전문가 (선택)",  color: "#45B7D1", optional: true },
];

// 스테이지별 핵심 안내 (1줄)
const STAGE_GUIDE = {
  "1": "로그라인을 입력하고 18개 기준으로 점수를 확인하세요.",
  "2": "Want·Need·적대자·스테이크·테마 — 이야기 엔진 5축을 확정하세요.",
  "3": "주인공의 심리·욕구·내적 갈등을 AI로 설계합니다.",
  "4": "3막 구조와 시놉시스를 생성하고 방향을 확정합니다.",
  "5": "씬별 트리트먼트와 15비트 구조를 구체화합니다.",
  "6": "확정된 트리트먼트로 시나리오 초고를 생성합니다.",
  "7": "작품을 심사하고 시장 가치와 배급 가능성을 평가합니다.",
  "8": "문제를 진단하고 부분 또는 전체 개고를 진행합니다.",
  "9": "선택 단계 — 신화구조·학술·전문가 패널로 이론적 기반을 점검합니다.",
};

/* ─── 사이드바 WORK_MODES 그룹 (접기/펴기) ─── */
function SidebarModeGroups({ currentStage, stageComments, getStageStatus }) {
  // 현재 stage가 속한 모드는 자동 펼침. 나머지는 접힘.
  const currentMode = findModeForStage(currentStage);
  const [openIds, setOpenIds] = useState(() => {
    const initial = new Set();
    if (currentMode) initial.add(currentMode.id);
    return initial;
  });

  // 현재 stage가 바뀌어 다른 모드로 이동하면 그 모드를 자동으로 펼침.
  useEffect(() => {
    if (currentMode && !openIds.has(currentMode.id)) {
      setOpenIds(prev => new Set(prev).add(currentMode.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode?.id]);

  const toggle = (modeId) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(modeId)) next.delete(modeId);
      else next.add(modeId);
      return next;
    });
  };

  return (
    <>
      {WORK_MODES.map((mode, modeIdx) => {
        const stagesInMode = mode.stageIds
          .map(id => STAGE_META.find(s => s.id === id))
          .filter(Boolean);
        if (stagesInMode.length === 0) return null;
        const isOpen = openIds.has(mode.id);
        const doneInMode = stagesInMode.filter(s => getStageStatus(s.id) === "done").length;
        const hasOptionalDivider = mode.optional && modeIdx > 0;
        const isCurrentMode = currentMode?.id === mode.id;

        return (
          <div key={mode.id} style={{
            marginTop: hasOptionalDivider ? 8 : 0,
            paddingTop: hasOptionalDivider ? 8 : 0,
            borderTop: hasOptionalDivider ? "1px solid var(--c-bd-1)" : undefined,
          }}>
            <button
              onClick={() => toggle(mode.id)}
              style={{
                width: "calc(100% - 20px)", margin: "2px 10px",
                padding: "6px 10px", borderRadius: 7,
                display: "flex", alignItems: "center", gap: 8,
                border: isCurrentMode ? `1px solid ${mode.color}40` : "1px solid transparent",
                background: isCurrentMode ? `${mode.color}10` : "transparent",
                cursor: "pointer", textAlign: "left",
                transition: "background 0.15s",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
              onMouseEnter={e => { if (!isCurrentMode) e.currentTarget.style.background = "var(--glass-nano)"; }}
              onMouseLeave={e => { if (!isCurrentMode) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{
                fontSize: 9, color: isOpen ? mode.color : "var(--c-tx-30)",
                fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                transition: "transform 0.15s",
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                display: "inline-block",
              }}>▶</span>
              <span style={{
                fontSize: 10, fontWeight: 800, color: mode.color,
                letterSpacing: 0.5, flex: 1,
              }}>
                {mode.name}
              </span>
              {mode.optional ? (
                <span style={{ fontSize: 8, color: mode.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                  선택
                </span>
              ) : (
                <span style={{
                  fontSize: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  color: doneInMode === stagesInMode.length && doneInMode > 0 ? "#4ECCA3" : "var(--c-tx-25)",
                }}>
                  {doneInMode}/{stagesInMode.length}
                </span>
              )}
            </button>
            {isOpen && (
              <div style={{ marginLeft: 10, paddingLeft: 4, borderLeft: `1px solid ${mode.color}26` }}>
                {stagesInMode.map(s => (
                  <SidebarNavItem
                    key={s.id}
                    id={s.id}
                    title={s.title}
                    sub={s.sub}
                    accentColor={s.color}
                    commentCount={(stageComments?.[s.id] || []).length}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ─── 다음 단계 CTA ─── */
function StageNextCTA({ currentStage, isMobile }) {
  const { setCurrentStage, getStageStatus, isDemoMode } = useLoglineCtx();

  if (!currentStage || currentStage === "dashboard") return null;

  const currentIdx = STAGE_META.findIndex(s => s.id === currentStage);
  if (currentIdx < 0) return null;

  const currentMeta = STAGE_META[currentIdx];
  // 메인 파이프라인은 1→8이 끝. Stage 9 (Deep Analysis)는 선택형이라 "다음 단계 CTA"에서 자동 추천 안 함.
  // Stage 9 자체에서는 다음 단계가 없음.
  const isOptional = currentMeta.optional;
  const mainStages = STAGE_META.filter(s => !s.optional);
  const mainIdx = mainStages.findIndex(s => s.id === currentStage);
  const nextMeta = isOptional
    ? null
    : (mainIdx >= 0 && mainIdx < mainStages.length - 1 ? mainStages[mainIdx + 1] : null);
  const currentStatus = getStageStatus(currentStage);
  const isDone = currentStatus === "done";

  // 메인 마지막 단계 (Stage 8) 또는 선택형 (Stage 9)
  if (!nextMeta) {
    return isDone ? (
      <div style={{
        marginTop: 40, padding: "20px 24px", borderRadius: 14,
        background: "linear-gradient(135deg, rgba(78,204,163,0.08), rgba(69,183,209,0.06))",
        border: "1px solid rgba(78,204,163,0.3)",
        textAlign: "center",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2} strokeLinecap="round" style={{ display: "inline-block" }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#4ECCA3", marginBottom: 6 }}>
          8단계 완료
        </div>
        <div style={{ fontSize: 12, color: "var(--c-tx-45)", lineHeight: 1.6 }}>
          로그라인부터 고쳐쓰기까지 전 과정을 완료했습니다.
        </div>
      </div>
    ) : null;
  }

  const shouldPulse = isDemoMode && isDone;

  return (
    <div style={{
      marginTop: 40,
      padding: 2,
      borderRadius: 14,
      background: isDone
        ? `linear-gradient(135deg, ${nextMeta.color}12, ${nextMeta.color}06)`
        : "var(--glass-nano)",
      border: isDone
        ? `1px solid ${nextMeta.color}35`
        : "1px solid var(--c-bd-2)",
      transition: "all 0.3s",
      animation: shouldPulse ? `hll-next-cta-pulse 1.6s ease-in-out infinite` : undefined,
    }}>
    <style>{`
      @keyframes hll-next-cta-pulse {
        0%, 100% { box-shadow: 0 0 0 0 ${nextMeta.color}00; }
        50% { box-shadow: 0 0 0 6px ${nextMeta.color}40; }
      }
    `}</style>
      <div style={{
        padding: "16px 20px", borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          {/* 다음 단계 번호 배지 */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: isDone ? `${nextMeta.color}18` : "var(--c-card-1)",
            border: `1.5px solid ${isDone ? nextMeta.color + "40" : "var(--c-bd-3)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 11, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: isDone ? nextMeta.color : "var(--c-tx-35)",
            }}>
              {String(nextMeta.id).padStart(2, "0")}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "var(--c-tx-30)", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              다음 단계
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: isDone ? "var(--text-main)" : "var(--c-tx-45)", fontFamily: "'Noto Sans KR', sans-serif" }}>
              {nextMeta.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif", marginTop: 1 }}>
              {STAGE_GUIDE[nextMeta.id]}
            </div>
          </div>
        </div>

        <button
          onClick={() => setCurrentStage(nextMeta.id)}
          style={{
            flexShrink: 0,
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            border: isDone ? "none" : `1px solid ${nextMeta.color}40`,
            background: isDone
              ? `linear-gradient(135deg, ${nextMeta.color}, ${nextMeta.color}cc)`
              : `${nextMeta.color}10`,
            color: isDone ? "#fff" : nextMeta.color,
            fontSize: 12, fontWeight: 800, cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "'Noto Sans KR', sans-serif",
            boxShadow: isDone ? `0 4px 16px ${nextMeta.color}40` : "none",
          }}
        >
          {isDone ? (
            <>
              {nextMeta.title}로 이동
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </>
          ) : (
            <>
              건너뛰기
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── 스테이지 페이지 헤더 ─── */
function StagePageHeader({ stageId, isMobile, status }) {
  if (!stageId || stageId === "dashboard") return null;
  const meta = STAGE_META.find(s => s.id === stageId);
  if (!meta) return null;
  // 현재 stage가 속한 모드 — 사용자가 어느 모드 안에 있는지 항상 인지하도록 caption 표시.
  const mode = findModeForStage(stageId);

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      marginBottom: 28,
      paddingBottom: 20,
      borderBottom: "1px solid var(--c-bd-2)",
    }}>
      {/* 단계 번호 배지 */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `${meta.color}15`,
        border: `1.5px solid ${meta.color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: 13, fontWeight: 800,
          fontFamily: "'JetBrains Mono', monospace",
          color: meta.color,
          lineHeight: 1,
        }}>
          {String(meta.id).padStart(2, "0")}
        </span>
      </div>

      {/* 제목 + 가이드 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 모드 컨텍스트 caption — "지금 어느 모드 안에 있는가?" */}
        {mode && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 9, fontWeight: 800, letterSpacing: 1,
            color: mode.color, textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: mode.color }} />
            {mode.name} 모드
            {mode.optional && (
              <span style={{ fontSize: 8, opacity: 0.65, marginLeft: 4 }}>(선택)</span>
            )}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? 17 : 20,
            fontWeight: 800,
            color: "var(--text-main)",
            fontFamily: "'Noto Sans KR', sans-serif",
            lineHeight: 1.2,
          }}>
            {meta.title}
          </h2>
          {status === "done" && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              padding: "2px 8px", borderRadius: 20,
              background: "rgba(78,204,163,0.1)",
              border: "1px solid rgba(78,204,163,0.3)",
              color: "#4ECCA3",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 0.5,
            }}>
              완료
            </span>
          )}
        </div>
        <p style={{
          margin: 0, marginTop: 5,
          fontSize: 12,
          color: "var(--c-tx-40)",
          fontFamily: "'Noto Sans KR', sans-serif",
          lineHeight: 1.55,
        }}>
          {STAGE_GUIDE[stageId]}
        </p>
      </div>
    </div>
  );
}

/* ─── 모바일 스테이지 드롭다운 (전체 스테이지 직접 이동) ─── */
function StageDropdown({ currentStage, setCurrentStage, getStageStatus, onClose }) {
  // WORK_MODES 헤더 + 안에 stages, 위에 대시보드 단독 항목.
  const items = [
    { id: "dashboard", title: "대시보드", color: "#C8A84B" },
  ];
  WORK_MODES.forEach((mode) => {
    const stagesInMode = mode.stageIds
      .map(id => STAGE_META.find(s => s.id === id))
      .filter(Boolean);
    if (stagesInMode.length === 0) return;
    items.push({ id: `__mode_${mode.id}`, title: mode.name, color: mode.color, modeHeader: true, optional: mode.optional, total: stagesInMode.length });
    stagesInMode.forEach(s => items.push(s));
  });
  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1200,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        }}
      />
      {/* 시트 */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1201,
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--c-bd-2)",
        borderRadius: "18px 18px 0 0",
        padding: "16px 16px calc(16px + env(safe-area-inset-bottom))",
        fontFamily: "'Noto Sans KR', sans-serif",
        maxHeight: "75vh", overflowY: "auto",
        animation: "fadeSlideUp 0.22s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-tx-40)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>
            스테이지 이동
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-tx-35)", padding: 4 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map(s => {
            if (s.modeHeader) {
              return (
                <div key={s.id} style={{
                  margin: "10px 6px 2px",
                  paddingTop: s.optional ? 10 : 4,
                  borderTop: s.optional ? "1px solid var(--c-bd-1)" : undefined,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: s.color, flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 9, letterSpacing: 1, color: s.color,
                    fontWeight: 800, textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{s.title}</span>
                  {s.optional && (
                    <span style={{ fontSize: 8, color: s.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, opacity: 0.65 }}>선택</span>
                  )}
                </div>
              );
            }
            const isActive = currentStage === s.id;
            const isDone = s.id !== "dashboard" && getStageStatus(s.id) === "done";
            return (
              <button
                key={s.id}
                onClick={() => { setCurrentStage(s.id); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12, border: "none",
                  background: isActive ? `${s.color}15` : "transparent",
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.15s",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${s.color}20`, border: `1px solid ${s.color}35`,
                  fontSize: 9, fontWeight: 800, color: s.color,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {s.id === "dashboard" ? (
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  ) : String(s.id).padStart(2, "0")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isActive ? 800 : 600, color: isActive ? s.color : "var(--text-main)" }}>
                    {s.title}
                  </div>
                  {s.sub && (
                    <div style={{ fontSize: 10, color: "var(--c-tx-35)", marginTop: 1 }}>{s.sub}</div>
                  )}
                </div>
                {isDone && (
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                )}
                {isActive && !isDone && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─── 모바일 하단 네비게이션 (prev/current/next + 드롭다운) ─── */
function MobileBottomNav({ currentStage, setCurrentStage, getStageStatus }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const isDashboard = currentStage === "dashboard";
  const currentIdx = isDashboard ? -1 : STAGE_META.findIndex(s => s.id === currentStage);
  const currentMeta = currentIdx >= 0 ? STAGE_META[currentIdx] : null;
  // prev/next는 메인 워크플로우(1~8)만 순환. 심화 도구(9)에서는 prev/next를 표시하지 않음.
  const mainStages = STAGE_META.filter(s => !s.optional);
  const isOptionalCurrent = currentMeta?.optional;
  const mainIdx = currentMeta && !isOptionalCurrent ? mainStages.findIndex(s => s.id === currentMeta.id) : -1;
  const prevMeta = !isOptionalCurrent && mainIdx > 0 ? mainStages[mainIdx - 1] : null;
  const nextMeta = !isOptionalCurrent && mainIdx >= 0 && mainIdx < mainStages.length - 1 ? mainStages[mainIdx + 1] : null;

  return (
    <>
      {showDropdown && (
        <StageDropdown
          currentStage={currentStage}
          setCurrentStage={setCurrentStage}
          getStageStatus={getStageStatus}
          onClose={() => setShowDropdown(false)}
        />
      )}
      <div style={{
        display: "flex", alignItems: "center",
        height: 56,
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: 8, paddingRight: 8,
        gap: 4,
      }}>
        {/* 대시보드 버튼 */}
        <button
          onClick={() => setCurrentStage("dashboard")}
          title="대시보드"
          style={{
            width: 40, height: 40, flexShrink: 0, borderRadius: 10, border: "none",
            background: isDashboard ? "rgba(200,168,75,0.15)" : "transparent",
            color: isDashboard ? "#C8A84B" : "var(--c-tx-35)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>

        {/* 이전 단계 버튼 */}
        <button
          onClick={() => prevMeta && setCurrentStage(prevMeta.id)}
          disabled={!prevMeta && !isDashboard}
          style={{
            width: 36, height: 40, flexShrink: 0, borderRadius: 8,
            border: prevMeta ? `1px solid ${prevMeta.color}30` : "1px solid transparent",
            background: "transparent",
            color: prevMeta ? prevMeta.color : "var(--c-tx-20)",
            cursor: prevMeta ? "pointer" : "default",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            opacity: prevMeta ? 0.75 : 0.2, transition: "all 0.15s",
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {prevMeta && (
            <span style={{ fontSize: 7, fontFamily: "'JetBrains Mono', monospace", color: prevMeta.color, fontWeight: 700 }}>
              {String(prevMeta.id).padStart(2, "0")}
            </span>
          )}
        </button>

        {/* 현재 스테이지 표시 (중앙 — 탭하면 드롭다운) */}
        <button
          onClick={() => setShowDropdown(true)}
          style={{
            flex: 1, height: 40, borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", padding: 0, position: "relative",
          }}
        >
          {isDashboard ? (
            <div style={{
              height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.3)",
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#C8A84B", fontFamily: "'Noto Sans KR', sans-serif" }}>
                대시보드
              </span>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#C8A84B" strokeWidth={2.5} strokeLinecap="round" style={{ marginLeft: 5, opacity: 0.7 }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          ) : currentMeta ? (
            <div style={{
              height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingLeft: 12, paddingRight: 10,
              background: `${currentMeta.color}12`,
              border: `1px solid ${currentMeta.color}35`,
              borderRadius: 10,
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: currentMeta.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, marginBottom: 3 }}>
                  {currentMeta.optional
                    ? "심화 도구"
                    : `${String(currentMeta.id).padStart(2, "0")} / ${String(mainStages.length).padStart(2, "0")}`}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1 }}>
                  {currentMeta.title}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {getStageStatus(currentMeta.id) === "done" && (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                )}
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={currentMeta.color} strokeWidth={2.5} strokeLinecap="round" style={{ opacity: 0.7 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          ) : null}
        </button>

        {/* 다음 단계 버튼 */}
        <button
          onClick={() => nextMeta && setCurrentStage(nextMeta.id)}
          disabled={!nextMeta}
          style={{
            width: 36, height: 40, flexShrink: 0, borderRadius: 8,
            border: nextMeta ? `1px solid ${nextMeta.color}30` : "1px solid transparent",
            background: nextMeta && getStageStatus(currentStage) === "done"
              ? `${nextMeta.color}15` : "transparent",
            color: nextMeta ? nextMeta.color : "var(--c-tx-20)",
            cursor: nextMeta ? "pointer" : "default",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            opacity: nextMeta ? 1 : 0.2, transition: "all 0.15s",
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          {nextMeta && (
            <span style={{ fontSize: 7, fontFamily: "'JetBrains Mono', monospace", color: nextMeta.color, fontWeight: 700 }}>
              {String(nextMeta.id).padStart(2, "0")}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

export default function SidebarLayout({ stageProps, isMobile }) {
  const {
    currentStage, setCurrentStage,
    logline, genre,
    shareSnapshot, showToast,
    getStageStatus,
    referenceScenarioEnabled, referenceScenarioSummary,
    showStoryDoctor, setShowStoryDoctor,
    apiKey, isDemoMode,
    stageComments, teamMembers,
    currentWorkingAs, setCurrentWorkingAs,
    currentWorkingMember,
    isReadOnly, isOwner, isOnline,
  } = useLoglineCtx();

  const mainPanelRef = useRef(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);

  async function handleShare() {
    if (!logline) { showToast?.("warn", "로그라인을 먼저 입력하세요."); return; }
    setShareLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logline, genre, data: shareSnapshot || {} }),
      });
      const json = await res.json();
      if (!res.ok) { showToast?.("error", json.error || "공유 링크 생성 실패"); return; }
      const url = `${window.location.origin}/share/${json.id}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        showToast?.("success", "공유 링크가 클립보드에 복사됐습니다.");
      } catch {
        showToast?.("info", `공유 링크: ${url}`);
      }
    } catch {
      showToast?.("error", "공유 링크 생성 중 오류가 발생했습니다.");
    } finally {
      setShareLoading(false);
    }
  }

  // 스테이지 전환 시 메인 패널 상단으로 스크롤
  useEffect(() => {
    mainPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStage]);

  const SIDEBAR_W = 210;
  const currentStatus = getStageStatus(currentStage);

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>

      {/* ── 데스크탑 사이드바 ── */}
      {!isMobile && (
        <aside style={{
          width: SIDEBAR_W, flexShrink: 0,
          position: "sticky", top: 56,
          height: "calc(100vh - 56px)",
          overflowY: "auto",
          borderRight: "1px solid var(--glass-bd-micro)",
          background: "var(--glass-nano)",
          display: "flex", flexDirection: "column",
        }}>

          {/* 상단 영역: 대시보드 + 진행률 + 스테이지 목록 */}
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 14, paddingBottom: 8 }}>

            {/* 대시보드 버튼 */}
            <div style={{ paddingLeft: 10, paddingRight: 10, paddingBottom: 8 }}>
              <button
                onClick={() => setCurrentStage("dashboard")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                  border: currentStage === "dashboard"
                    ? "1px solid rgba(200,168,75,0.35)"
                    : "1px solid transparent",
                  background: currentStage === "dashboard"
                    ? "linear-gradient(135deg, rgba(200,168,75,0.12), rgba(200,168,75,0.04))"
                    : "transparent",
                  boxShadow: currentStage === "dashboard"
                    ? "inset 0 1px 0 rgba(200,168,75,0.15)"
                    : "none",
                  color: currentStage === "dashboard" ? "#C8A84B" : "var(--c-tx-40)",
                  fontSize: 11, fontWeight: 700, transition: "all 0.18s",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                <DashboardIcon />
                대시보드
              </button>
            </div>

            {/* 진행률 바 — 메인 워크플로우 1~8 기준 */}
            {(() => {
              const mainStages = STAGE_META.filter(s => !s.optional);
              const doneCount = mainStages.filter(s => getStageStatus(s.id) === "done").length;
              const pct = Math.round((doneCount / mainStages.length) * 100);
              return (
                <div style={{ padding: "2px 14px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--c-tx-25)", fontWeight: 700, textTransform: "uppercase" }}>메인 워크플로우</div>
                    <div style={{ fontSize: 9, color: doneCount > 0 ? "#4ECCA3" : "var(--c-tx-25)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      {doneCount}/{mainStages.length}
                    </div>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "var(--c-bd-2)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      width: `${pct}%`,
                      background: doneCount === mainStages.length
                        ? "linear-gradient(90deg,#4ECCA3,#45B7D1)"
                        : "#4ECCA3",
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              );
            })()}

            {/* WORK_MODES 그룹 — 발견/설계/쓰기/고치기/심화 */}
            <SidebarModeGroups
              currentStage={currentStage}
              stageComments={stageComments}
              getStageStatus={getStageStatus}
            />

            {/* 작업 모드 (팀원이 있을 때만) */}
            {teamMembers.length > 0 && (
              <div style={{ padding: "8px 12px 0", marginTop: 6, borderTop: "1px solid var(--c-bd-1)" }}>
                <div style={{ fontSize: 9, color: "var(--c-tx-25)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                  작업 모드
                </div>
                <select
                  value={currentWorkingAs || ""}
                  onChange={e => setCurrentWorkingAs(e.target.value || null)}
                  style={{
                    width: "100%", padding: "6px 8px", borderRadius: 7,
                    border: currentWorkingAs
                      ? `1px solid ${currentWorkingMember?.color || "#A78BFA"}44`
                      : "1px solid var(--c-bd-3)",
                    background: currentWorkingAs
                      ? `${currentWorkingMember?.color || "#A78BFA"}0d`
                      : "var(--glass-nano)",
                    color: currentWorkingAs ? (currentWorkingMember?.color || "#A78BFA") : "var(--c-tx-50)",
                    fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif",
                    cursor: "pointer", outline: "none", fontWeight: currentWorkingAs ? 700 : 400,
                  }}
                >
                  <option value="">나 (전체 권한)</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} · {m.role}</option>
                  ))}
                </select>
                {currentWorkingAs && (
                  <div style={{
                    marginTop: 5, padding: "5px 8px", borderRadius: 6,
                    background: isReadOnly ? "rgba(232,93,117,0.08)" : "rgba(78,204,163,0.06)",
                    border: isReadOnly ? "1px solid rgba(232,93,117,0.2)" : "1px solid rgba(78,204,163,0.2)",
                    fontSize: 9, lineHeight: 1.5,
                    color: isReadOnly ? "#E85D75" : "#4ECCA3",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>
                    {isReadOnly
                      ? "읽기 전용 · 댓글만 가능"
                      : currentWorkingMember?.role === "보조작가"
                        ? "배정된 씬만 편집 가능"
                        : "전체 편집 가능"}
                  </div>
                )}
                {isOwner && !currentWorkingAs && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 9, color: "var(--c-tx-25)", marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>팀원 초대 링크</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {teamMembers.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            const url = `${window.location.origin}${window.location.pathname}?as=${m.id}`;
                            navigator.clipboard.writeText(url).then(() => {
                              showToast?.("success", `${m.name}용 링크가 복사됐습니다.`);
                            }).catch(() => {
                              showToast?.("info", `링크: ?as=${m.id}`);
                            });
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "4px 7px", borderRadius: 6, textAlign: "left",
                            border: `1px solid ${m.color}25`,
                            background: `${m.color}08`,
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 9, color: m.color, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", flex: 1 }}>{m.name}</span>
                          <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth={2} strokeLinecap="round">
                            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 시나리오 참고 중 배지 */}
            {referenceScenarioEnabled && (
              <div
                onClick={() => setCurrentStage("1")}
                title="기존 시나리오가 모든 단계 분석에 반영됩니다. 클릭하여 설정 변경"
                style={{
                  margin: "8px 10px 0", padding: "6px 10px", borderRadius: 7,
                  border: "1px solid rgba(78,204,163,0.3)",
                  background: "rgba(78,204,163,0.07)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#4ECCA3" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span style={{ fontSize: 10, color: "#4ECCA3", fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  시나리오 참고 중{referenceScenarioSummary ? " · 요약" : ""}
                </span>
              </div>
            )}
          </div>

          {/* 하단 고정 영역 */}
          <div style={{ borderTop: "1px solid var(--c-bd-1)", padding: "10px 10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>

            {/* 스토리 닥터 */}
            <button
              onClick={() => setShowStoryDoctor(true)}
              disabled={!logline || !apiKey}
              title="막힌 곳, 어색한 곳을 AI에게 물어보세요"
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px", borderRadius: 8,
                cursor: !logline || !apiKey ? "not-allowed" : "pointer",
                border: showStoryDoctor ? "1px solid rgba(167,139,250,0.45)" : "1px solid rgba(167,139,250,0.18)",
                background: showStoryDoctor
                  ? "linear-gradient(135deg, rgba(167,139,250,0.14), rgba(167,139,250,0.06))"
                  : "rgba(167,139,250,0.04)",
                color: !logline || !apiKey ? "rgba(167,139,250,0.3)" : "#A78BFA",
                fontSize: 11, fontWeight: 700, transition: "all 0.18s",
                fontFamily: "'Noto Sans KR', sans-serif",
                opacity: !logline || !apiKey ? 0.5 : 1,
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              스토리 닥터
            </button>

            {/* 공유 + 도구 버튼 행 */}
            <div style={{ display: "flex", gap: 6 }}>
              {/* 공유 */}
              <button
                onClick={handleShare}
                disabled={shareLoading || !logline}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "7px 10px", borderRadius: 8,
                  border: "1px solid rgba(200,168,75,0.3)",
                  background: "rgba(200,168,75,0.07)",
                  color: !logline ? "rgba(200,168,75,0.3)" : "#C8A84B",
                  fontSize: 11, fontWeight: 700,
                  cursor: shareLoading || !logline ? "not-allowed" : "pointer",
                  opacity: !logline ? 0.5 : 1,
                  transition: "all 0.2s",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                {shareLoading ? (
                  <span style={{
                    display: "inline-block", width: 10, height: 10,
                    border: "2px solid rgba(200,168,75,0.3)", borderTop: "2px solid #C8A84B",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                ) : (
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                )}
                공유
              </button>

              {/* 도구 (알림 + Ollama) 접기/펼치기 */}
              <button
                onClick={() => setToolsOpen(v => !v)}
                title="알림 및 로컬 AI 설정"
                style={{
                  width: 34, display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "7px 8px", borderRadius: 8,
                  border: toolsOpen ? "1px solid var(--c-bd-4)" : "1px solid var(--c-bd-2)",
                  background: toolsOpen ? "var(--glass-nano)" : "transparent",
                  color: toolsOpen ? "var(--c-tx-55)" : "var(--c-tx-30)",
                  cursor: "pointer", transition: "all 0.18s",
                }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
              </button>
            </div>

            {/* 공유 URL 미리보기 */}
            {shareUrl && (
              <div
                title={shareUrl}
                style={{
                  fontSize: 9, color: "rgba(200,168,75,0.5)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  cursor: "pointer", padding: "2px 4px",
                }}
                onClick={() => navigator.clipboard.writeText(shareUrl).catch(() => {})}
              >
                {shareUrl}
              </div>
            )}

            {/* 접힌 도구 영역: 알림 + Ollama */}
            {toolsOpen && (
              <div style={{
                borderTop: "1px solid var(--c-bd-1)",
                paddingTop: 8,
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <NotificationPanel />
                <OllamaSettings />
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── 모바일 하단 내비게이션 ── */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
          background: "var(--bg-page)",
          borderTop: "1px solid var(--c-bd-2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <MobileBottomNav
            currentStage={currentStage}
            setCurrentStage={setCurrentStage}
            getStageStatus={getStageStatus}
          />
        </div>
      )}

      {/* ── 메인 패널 래퍼 ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
        <main
          ref={mainPanelRef}
          style={{
            width: "100%",
            padding: isMobile ? "20px 16px" : "28px 32px",
            paddingBottom: isMobile ? "80px" : undefined,
            maxWidth: isMobile ? "100%" : 780,
          }}
        >
          {/* 스테이지 페이지 헤더 */}
          <StagePageHeader
            stageId={currentStage}
            isMobile={isMobile}
            status={currentStatus}
          />

          {/* 오프라인 배너 */}
          {!isOnline && (
            <div style={{
              marginBottom: 16, padding: "10px 16px", borderRadius: 10,
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.3)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <circle cx="12" cy="20" r="1"/>
              </svg>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#FBBF24", fontFamily: "'Noto Sans KR', sans-serif" }}>
                  오프라인 모드
                </span>
                <span style={{ fontSize: 11, color: "var(--c-tx-45)", marginLeft: 8, fontFamily: "'Noto Sans KR', sans-serif" }}>
                  AI 생성 기능은 인터넷 연결 후 사용 가능합니다.
                </span>
              </div>
              <span style={{ fontSize: 9, color: "var(--c-tx-30)", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                편집 · 저장 · 내보내기 사용 가능
              </span>
            </div>
          )}

          <ErrorBoundary key={currentStage}>
            <Suspense fallback={
              <div style={{
                padding: "40px 20px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "2px solid var(--c-bd-3)",
                  borderTop: "2px solid #4ECCA3",
                  animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ fontSize: 12, color: "var(--c-tx-30)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                  불러오는 중...
                </span>
              </div>
            }>
              {stageProps.renderStage(currentStage)}
              {/* 다음 단계 CTA */}
              <StageNextCTA currentStage={currentStage} isMobile={isMobile} />
              {currentStage !== "dashboard" && (
                <StageCommentThread stageId={currentStage} />
              )}
            </Suspense>
          </ErrorBoundary>

          {/* 데모 게이팅 배너 (Stage 3+) */}
          {isDemoMode && parseInt(currentStage) >= 3 && (
            <div style={{
              marginTop: 32, padding: 2, borderRadius: 16,
              background: "var(--glass-nano)",
              border: "1px solid rgba(200,168,75,0.22)",
            }}>
              <div style={{
                padding: "20px 22px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(200,168,75,0.08) 0%, var(--glass-micro) 70%)",
                border: "1px solid rgba(200,168,75,0.15)",
                boxShadow: "inset 0 1px 0 rgba(200,168,75,0.12)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 16, flexWrap: "wrap",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#C8A84B", marginBottom: 4 }}>
                    지금 로그인하면 분석 결과가 저장됩니다
                  </div>
                  <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.5 }}>
                    데모 세션이 종료되면 진행 내용이 사라집니다. 로그인 후 계속 작업하세요.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <a href="/api/auth/kakao" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 8,
                    background: "#FEE500", color: "#1a1a1a",
                    fontSize: 11, fontWeight: 800, textDecoration: "none",
                    boxShadow: "0 2px 10px rgba(254,229,0,0.3)",
                    transition: "transform 0.18s var(--ease-spring)",
                  }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="#1a1a1a">
                      <path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.91 1.74 5.48 4.38 7.07L5.25 21l3.88-2.14A11.4 11.4 0 0 0 12 19.5c5.52 0 10-3.69 10-8.25S17.52 3 12 3z"/>
                    </svg>
                    카카오 로그인
                  </a>
                  <a href="/api/auth/google" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 8,
                    border: "1px solid var(--glass-bd-base)", background: "var(--glass-nano)",
                    color: "var(--text-main)", fontSize: 11, fontWeight: 700,
                    textDecoration: "none",
                    transition: "transform 0.18s var(--ease-spring)",
                  }}>
                    Google
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
