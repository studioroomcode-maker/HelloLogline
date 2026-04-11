import { useRef, useEffect, Suspense, useState } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import SidebarNavItem from "./SidebarNavItem.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";

function DashboardIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

// 각 스테이지 설정
const STAGE_META = [
  { id: "1", title: "로그라인", sub: "한 줄 입력 → 분석", color: "#C8A84B" },
  { id: "2", title: "개념 분석", sub: "테마 · 신화구조", color: "#45B7D1" },
  { id: "3", title: "캐릭터", sub: "심리 · 욕구 · 아크", color: "#FB923C" },
  { id: "4", title: "스토리 설계", sub: "구조 · 시놉시스", color: "#4ECCA3" },
  { id: "5", title: "트리트먼트", sub: "씬 구성 · 비트시트", color: "#C8A84B" },
  { id: "6", title: "시나리오 초고", sub: "자동 초고 생성", color: "#A78BFA" },
  { id: "7", title: "Script Coverage", sub: "심사 · 시장 가치", color: "#60A5FA" },
  { id: "8", title: "고쳐쓰기", sub: "진단 → 수정 → 개고", color: "#FB923C" },
];

const STAGE_ICONS = ["📝","🎭","👤","📖","📋","✍️","📊","🔧"];

function MobileNavTab({ id, icon, label, active, color, status, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 2, padding: "6px 10px", minWidth: 52, flexShrink: 0,
      background: "none", border: "none", cursor: "pointer",
      borderTop: `2px solid ${active ? color : "transparent"}`,
      transition: "all 0.15s", fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 8, fontWeight: active ? 700 : 400, color: active ? color : "var(--c-tx-35)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      {status === "done" && !active && (
        <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#4ECCA3", marginTop: 1 }} />
      )}
    </button>
  );
}

export default function SidebarLayout({ stageProps, isMobile }) {
  const { currentStage, setCurrentStage, logline, genre, shareSnapshot, showToast, getStageStatus } = useLoglineCtx();
  const mainPanelRef = useRef(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);

  async function handleShare() {
    if (!logline) {
      showToast?.("로그라인을 먼저 입력하세요.", "warn");
      return;
    }
    setShareLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logline, genre, data: shareSnapshot || {} }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast?.(json.error || "공유 링크 생성 실패", "error");
        return;
      }
      const url = `${window.location.origin}/share/${json.id}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        showToast?.("공유 링크가 클립보드에 복사됐습니다.", "success");
      } catch {
        showToast?.(`공유 링크: ${url}`, "info");
      }
    } catch {
      showToast?.("공유 링크 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setShareLoading(false);
    }
  }

  // 스테이지 전환 시 메인 패널 상단으로 스크롤
  useEffect(() => {
    mainPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStage]);

  // 사이드바 너비
  const SIDEBAR_W = 210;

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {/* ── 사이드바 ── */}
      {!isMobile && (
        <aside style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          position: "sticky",
          top: 56, // 헤더 높이
          height: "calc(100vh - 56px)",
          overflowY: "auto",
          borderRight: "1px solid var(--c-bd-1)",
          paddingTop: 16,
          paddingBottom: 24,
        }}>
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
                  ? "rgba(200,168,75,0.08)"
                  : "transparent",
                color: currentStage === "dashboard" ? "#C8A84B" : "var(--c-tx-40)",
                fontSize: 11, fontWeight: 700, transition: "all 0.18s",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              <DashboardIcon />
              대시보드
            </button>
          </div>

          <div style={{ paddingLeft: 16, paddingBottom: 8, paddingTop: 4 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: "var(--c-tx-25)", fontWeight: 700, textTransform: "uppercase" }}>워크플로우</div>
          </div>
          {STAGE_META.map(s => (
            <SidebarNavItem key={s.id} id={s.id} title={s.title} sub={s.sub} accentColor={s.color} />
          ))}

          {/* 공유 버튼 */}
          <div style={{ padding: "16px 12px 0", borderTop: "1px solid var(--c-bd-1)", marginTop: 12 }}>
            <button
              onClick={handleShare}
              disabled={shareLoading || !logline}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid rgba(200,168,75,0.3)",
                background: shareLoading ? "rgba(200,168,75,0.04)" : "rgba(200,168,75,0.08)",
                color: !logline ? "rgba(200,168,75,0.3)" : "#C8A84B",
                fontSize: 11,
                fontWeight: 700,
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
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
              {shareLoading ? "생성 중..." : "공유 링크"}
            </button>
            {shareUrl && (
              <div
                title={shareUrl}
                style={{
                  marginTop: 6,
                  fontSize: 9,
                  color: "rgba(200,168,75,0.5)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
                onClick={() => navigator.clipboard.writeText(shareUrl).catch(() => {})}
              >
                {shareUrl}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── 모바일 하단 내비게이션 ── */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
          background: "var(--bg-page)", borderTop: "1px solid var(--c-bd-2)",
          display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", paddingBottom: "env(safe-area-inset-bottom)",
        }}>
          <MobileNavTab id="dashboard" icon="⊞" label="대시" active={currentStage === "dashboard"} color="#C8A84B" onClick={() => setCurrentStage("dashboard")} />
          {STAGE_META.map((s, i) => (
            <MobileNavTab key={s.id} id={s.id} icon={STAGE_ICONS[i]} label={s.title.slice(0,4)} active={currentStage === s.id} color={s.color} status={getStageStatus(s.id)} onClick={() => setCurrentStage(s.id)} />
          ))}
        </div>
      )}

      {/* ── 메인 패널 래퍼 (가운데 정렬) ── */}
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
          <ErrorBoundary>
            <Suspense fallback={<div style={{ padding: 20, color: "var(--c-tx-30)", fontSize: 12 }}>로딩 중...</div>}>
              {/* stageProps에서 현재 스테이지 콘텐츠를 렌더링 */}
              {stageProps.renderStage(currentStage)}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
