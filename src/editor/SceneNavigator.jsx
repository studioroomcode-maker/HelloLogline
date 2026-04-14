/**
 * SceneNavigator.jsx
 * Fountain 씬 목록 사이드바
 * - 씬 번호 + 씬 헤딩 텍스트 표시
 * - 클릭 시 에디터 내 해당 씬으로 스크롤
 * - 현재 활성 씬 하이라이팅
 */

import { useState, useEffect, useCallback } from "react";
import { extractScenes } from "./FountainParser.js";

export default function SceneNavigator({ tokens, editorContainerRef, isMobile, sceneAssignments = {}, teamMembers = [] }) {
  const scenes = extractScenes(tokens);
  const [activeScene, setActiveScene] = useState(0);

  // ── 스크롤 중 활성 씬 감지 ──────────────────────────
  useEffect(() => {
    const container = editorContainerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      const sceneEls = container.querySelectorAll('[data-type="scene_heading"]');
      let current = 0;
      sceneEls.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top - containerRect.top <= 80) current = i;
      });
      setActiveScene(current);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [editorContainerRef, tokens]);

  // ── 씬 클릭 → 에디터 스크롤 ──────────────────────────
  const handleSceneClick = useCallback((scene) => {
    const container = editorContainerRef?.current;
    if (!container) return;
    const sceneEls = container.querySelectorAll('[data-type="scene_heading"]');
    const target = sceneEls[scene.number - 1];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveScene(scene.number - 1);
    }
  }, [editorContainerRef]);

  if (scenes.length === 0) return null;

  return (
    <div style={{
      width: isMobile ? "100%" : 200,
      flexShrink: 0,
      borderRight: isMobile ? "none" : "1px solid var(--glass-bd-nano)",
      borderBottom: isMobile ? "1px solid var(--glass-bd-nano)" : "none",
      background: "var(--glass-nano)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* 헤더 */}
      <div style={{
        padding: "10px 14px 8px",
        borderBottom: "1px solid var(--glass-bd-nano)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-35)" strokeWidth={2} strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
          color: "var(--c-tx-30)", textTransform: "uppercase",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          씬 목록 ({scenes.length})
        </span>
      </div>

      {/* 씬 리스트 */}
      <div style={{
        overflowY: "auto", overflowX: "hidden",
        flex: 1,
        padding: "6px 0",
        maxHeight: isMobile ? 120 : "100%",
        // 가로 모드(모바일): 수평 스크롤
        ...(isMobile ? { display: "flex", flexDirection: "row", flexWrap: "nowrap", maxHeight: "none", overflowX: "auto", overflowY: "hidden", padding: "6px 10px", gap: 4 } : {}),
      }}>
        {scenes.map((scene, idx) => {
          const isActive = activeScene === idx;
          // 씬 헤딩 텍스트를 짧게 자름
          const label = scene.text.length > 22
            ? scene.text.slice(0, 22) + '…'
            : scene.text;

          // 씬 인덱스로 beatId 근사 매핑 (beat ID는 1-based)
          const approxBeatId = scene.number;
          const assignedMemberId = sceneAssignments[approxBeatId];
          const assignedMember = assignedMemberId ? teamMembers.find(m => m.id === assignedMemberId) : null;

          return (
            <button
              key={idx}
              onClick={() => handleSceneClick(scene)}
              title={scene.text + (assignedMember ? ` · ${assignedMember.name}` : "")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: isMobile ? "auto" : "100%",
                flexShrink: isMobile ? 0 : undefined,
                padding: isMobile ? "4px 10px" : "5px 14px",
                background: isActive ? "rgba(167,139,250,0.10)" : "none",
                border: isActive
                  ? "1px solid rgba(167,139,250,0.25)"
                  : "1px solid transparent",
                borderRadius: isMobile ? 20 : 0,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s, border-color 0.15s",
                marginBottom: isMobile ? 0 : 1,
              }}
            >
              {/* 씬 번호 배지 */}
              <span style={{
                fontSize: 8, fontWeight: 700, flexShrink: 0,
                width: 18, height: 18, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? "rgba(167,139,250,0.2)" : "var(--glass-micro)",
                border: `1px solid ${isActive ? "rgba(167,139,250,0.4)" : "var(--glass-bd-nano)"}`,
                color: isActive ? "#A78BFA" : "var(--c-tx-35)",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {scene.number}
              </span>
              {/* 씬 텍스트 */}
              <span style={{
                fontSize: 9,
                color: isActive ? "#A78BFA" : "var(--c-tx-40)",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: isActive ? 700 : 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.3,
                flex: 1,
              }}>
                {label}
              </span>
              {/* 담당자 색상 점 */}
              {assignedMember && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: assignedMember.color,
                  flexShrink: 0,
                  border: "1px solid rgba(0,0,0,0.2)",
                }} title={assignedMember.name} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
