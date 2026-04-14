/**
 * NotificationPanel.jsx
 * 폴링 기반 변경 알림 패널 (Feature 4)
 * - 5초 interval로 미읽은 활동 체크
 * - activityLog를 타임라인으로 표시
 * - 읽음 처리 → localStorage lastSeen 업데이트
 */

import { useState, useEffect, useRef } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

const POLL_INTERVAL = 5000; // 5초

const TYPE_META = {
  comment:   { icon: "💬", label: "피드백", color: "#A78BFA" },
  assign:    { icon: "👤", label: "씬 배정", color: "#60A5FA" },
  scene_gen: { icon: "🎬", label: "씬 생성", color: "#4ECCA3" },
  beat_edit: { icon: "✏️", label: "비트 수정", color: "#FFD166" },
  generate:  { icon: "⚡", label: "AI 생성", color: "#FB923C" },
  import:    { icon: "📥", label: "가져오기", color: "#34D399" },
};

const STAGE_SHORT = { "1":"로그라인","2":"개념","3":"캐릭터","4":"스토리","5":"트리트먼트","6":"초고","7":"커버리지","8":"고쳐쓰기" };

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "방금";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return new Date(ts).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const LS_KEY = "hll_last_seen_activity";

export default function NotificationPanel() {
  const { activityLog } = useLoglineCtx();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [lastChecked, setLastChecked] = useState(() => {
    return parseInt(localStorage.getItem(LS_KEY) || "0");
  });
  const panelRef = useRef(null);

  // 5초 polling: unread 카운트 업데이트
  useEffect(() => {
    const check = () => {
      const ls = parseInt(localStorage.getItem(LS_KEY) || "0");
      const count = activityLog.filter(a => a.timestamp > ls).length;
      setUnread(count);
      setLastChecked(ls);
    };
    check(); // 즉시 1회
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [activityLog]);

  // 패널 열리면 모두 읽음 처리
  useEffect(() => {
    if (open && activityLog.length > 0) {
      const newest = Math.max(...activityLog.map(a => a.timestamp));
      localStorage.setItem(LS_KEY, String(newest));
      setUnread(0);
      setLastChecked(newest);
    }
  }, [open, activityLog]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      {/* 벨 버튼 */}
      <button
        onClick={() => setOpen(p => !p)}
        title="변경 알림"
        style={{
          position: "relative",
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "7px 10px", borderRadius: 8, cursor: "pointer",
          border: open
            ? "1px solid rgba(167,139,250,0.35)"
            : unread > 0
              ? "1px solid rgba(167,139,250,0.2)"
              : "1px solid transparent",
          background: open
            ? "rgba(167,139,250,0.1)"
            : unread > 0
              ? "rgba(167,139,250,0.05)"
              : "transparent",
          color: unread > 0 ? "#A78BFA" : "var(--c-tx-40)",
          fontSize: 11, fontWeight: unread > 0 ? 700 : 400,
          transition: "all 0.18s",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        {/* 벨 아이콘 */}
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        변경 알림
        {/* 뱃지 */}
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 4, left: 18,
            minWidth: 14, height: 14, borderRadius: 7,
            background: "#E85D75", color: "#fff",
            fontSize: 8, fontWeight: 800, display: "flex",
            alignItems: "center", justifyContent: "center",
            padding: "0 3px", fontFamily: "'JetBrains Mono', monospace",
            boxShadow: "0 1px 4px rgba(232,93,117,0.5)",
            animation: "pulse 2s ease-in-out infinite",
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 8, opacity: 0.4 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div style={{
          position: "absolute",
          left: "calc(100% + 8px)",
          top: 0,
          width: 300,
          maxHeight: 480,
          background: "var(--bg-page)",
          border: "1px solid var(--c-bd-2)",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          zIndex: 500,
        }}>
          {/* 헤더 */}
          <div style={{
            padding: "10px 14px 8px",
            borderBottom: "1px solid var(--c-bd-1)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth={2} strokeLinecap="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-main)", fontFamily: "'JetBrains Mono', monospace" }}>
                변경 내역
              </span>
              <span style={{ fontSize: 9, color: "var(--c-tx-30)", fontFamily: "'JetBrains Mono', monospace" }}>
                ({activityLog.length})
              </span>
            </div>
            <span style={{ fontSize: 8, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>
              5초 간격 확인
            </span>
          </div>

          {/* 활동 목록 */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {activityLog.length === 0 ? (
              <div style={{
                padding: "24px 16px", textAlign: "center",
                fontSize: 11, color: "var(--c-tx-25)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>
                아직 변경 내역이 없습니다.
                <br />
                <span style={{ fontSize: 9, marginTop: 4, display: "block", color: "var(--c-tx-20)" }}>
                  씬 생성, 배정, 피드백 작성 시 기록됩니다
                </span>
              </div>
            ) : (
              <div>
                {activityLog.map((a, i) => {
                  const meta = TYPE_META[a.type] || { icon: "·", label: a.type, color: "#C8A84B" };
                  const isNew = a.timestamp > lastChecked && i === 0 && unread === 0;
                  const wasUnread = a.timestamp > (parseInt(localStorage.getItem(LS_KEY) || "0") - 1000);
                  return (
                    <div
                      key={a.id}
                      style={{
                        display: "flex", gap: 10, alignItems: "flex-start",
                        padding: "9px 14px",
                        borderBottom: "1px solid var(--c-bd-1)",
                        background: "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* 타입 아이콘 */}
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                        background: `${meta.color}18`, border: `1px solid ${meta.color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11,
                      }}>{meta.icon}</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* 액터 + 스테이지 */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: a.actorColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
                            {a.actorName}
                          </span>
                          {a.stageId && (
                            <span style={{
                              fontSize: 8, padding: "1px 5px", borderRadius: 6,
                              background: `${meta.color}15`, color: meta.color,
                              border: `1px solid ${meta.color}25`,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>
                              S{a.stageId} {STAGE_SHORT[a.stageId] || ""}
                            </span>
                          )}
                          <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                            {timeAgo(a.timestamp)}
                          </span>
                        </div>
                        {/* 상세 */}
                        <div style={{
                          fontSize: 11, color: "var(--c-tx-55)",
                          fontFamily: "'Noto Sans KR', sans-serif",
                          lineHeight: 1.4, wordBreak: "break-word",
                        }}>
                          {a.detail}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 푸터: 전체 삭제 */}
          {activityLog.length > 0 && (
            <div style={{
              padding: "7px 14px", borderTop: "1px solid var(--c-bd-1)",
              display: "flex", justifyContent: "flex-end",
              flexShrink: 0,
            }}>
              <button
                onClick={() => {
                  // logline-analyzer의 setActivityLog는 context에 없으므로 별도 처리
                  localStorage.setItem(LS_KEY, String(Date.now()));
                  setUnread(0);
                  setOpen(false);
                }}
                style={{
                  fontSize: 9, color: "var(--c-tx-30)", background: "none",
                  border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                  padding: "2px 4px",
                }}
              >읽음 처리</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
