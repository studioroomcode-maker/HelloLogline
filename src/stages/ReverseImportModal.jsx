/**
 * ReverseImportModal.jsx
 * 중간 주입 온보딩 — 기존 글을 바탕으로 파이프라인 진입
 *
 * 탭 구성:
 *   로그라인  → Stage 1 직행
 *   시놉시스  → Claude 로그라인 추출 → Stage 4 진입
 *   트리트먼트 → Claude 로그라인 추출 → Stage 5 진입
 *   초고      → Claude 로그라인+장르 추출 → Stage 6 진입
 */

import { useState, useCallback } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";
import { callClaudeText } from "../utils.js";

const TABS = [
  { id: "logline",   icon: "✏️", label: "로그라인",    stage: "1", color: "#C8A84B", hint: "개발할 스토리의 핵심을 한 줄로 입력하세요." },
  { id: "synopsis",  icon: "📄", label: "시놉시스",     stage: "4", color: "#4ECCA3", hint: "2~5페이지 분량의 시놉시스를 붙여 넣으세요. AI가 로그라인을 추출하고 Stage 4부터 시작합니다." },
  { id: "treatment", icon: "📋", label: "트리트먼트",   stage: "5", color: "#A78BFA", hint: "씬별 트리트먼트 원고를 붙여 넣으세요. AI가 로그라인을 추출하고 Stage 5부터 시작합니다." },
  { id: "draft",     icon: "📝", label: "시나리오 초고", stage: "6", color: "#60A5FA", hint: "Fountain 포맷 또는 일반 텍스트 초고를 붙여 넣으세요. AI가 로그라인·장르를 추출하고 Stage 6부터 시작합니다." },
];

const GENRES = [
  { id: "auto", label: "자동 감지" },
  { id: "drama", label: "드라마" },
  { id: "romance", label: "로맨스" },
  { id: "thriller", label: "스릴러/액션" },
  { id: "comedy", label: "코미디" },
  { id: "horror", label: "호러" },
  { id: "sf", label: "SF/판타지" },
  { id: "crime", label: "범죄/느와르" },
  { id: "animation", label: "애니메이션" },
];

const EXTRACT_SYSTEM = `당신은 시나리오 전문가입니다. 주어진 텍스트(시놉시스/트리트먼트/시나리오 초고)에서 핵심 정보를 추출하세요.

반드시 JSON 형식으로만 응답하세요:
{
  "logline": "한 줄 로그라인 (60자 이내, 주인공+목표+장애물 포함)",
  "genre": "drama|romance|thriller|comedy|horror|sf|crime|animation|auto 중 하나",
  "title": "작품 제목 (있으면, 없으면 빈 문자열)"
}`;

export default function ReverseImportModal({ onClose }) {
  const { apiKey, onReverseImport, showToast, isMobile } = useLoglineCtx();

  const [activeTab, setActiveTab] = useState("logline");
  const [textValues, setTextValues] = useState({ logline: "", synopsis: "", treatment: "", draft: "" });
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null); // { logline, genre, title }
  const [editLogline, setEditLogline] = useState("");
  const [editGenre, setEditGenre] = useState("auto");
  const [showExtracted, setShowExtracted] = useState(false);

  const tab = TABS.find(t => t.id === activeTab);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setExtracted(null);
    setShowExtracted(false);
  };

  const handleTextChange = (val) => {
    setTextValues(prev => ({ ...prev, [activeTab]: val }));
    setExtracted(null);
    setShowExtracted(false);
  };

  // ── 로그라인 탭: 직접 시작 ──────────────────────────
  const handleLoglineStart = () => {
    const text = textValues.logline.trim();
    if (!text) return;
    onReverseImport({ type: "logline", text, loglineText: text, genreId: "auto" });
    onClose();
  };

  // ── 시놉시스/트리트먼트/초고: AI 추출 → 확인 → 주입 ──
  const handleExtract = useCallback(async () => {
    const text = textValues[activeTab].trim();
    if (!text || !apiKey) return;

    setExtracting(true);
    setExtracted(null);
    setShowExtracted(false);

    try {
      const raw = await callClaudeText(
        apiKey,
        EXTRACT_SYSTEM,
        `다음 텍스트에서 핵심 정보를 추출하세요:\n\n${text.slice(0, 4000)}`,
        400,
        "claude-haiku-4-5-20251001",
        undefined,
        "reverse_extract"
      );

      // JSON 파싱 (백틱 코드블록 포함 처리)
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      const result = {
        logline: parsed.logline || "",
        genre: parsed.genre || "auto",
        title: parsed.title || "",
      };
      setExtracted(result);
      setEditLogline(result.logline);
      setEditGenre(result.genre);
      setShowExtracted(true);
    } catch (e) {
      console.error("역추출 오류:", e);
      // 추출 실패해도 진행 가능: 로그라인 없이 주입
      setExtracted({ logline: "", genre: "auto", title: "" });
      setEditLogline("");
      setEditGenre("auto");
      setShowExtracted(true);
      showToast("warn", "로그라인 자동 추출에 실패했습니다. 직접 입력해주세요.");
    } finally {
      setExtracting(false);
    }
  }, [activeTab, textValues, apiKey, showToast]);

  const handleInject = () => {
    const text = textValues[activeTab].trim();
    if (!text) return;
    onReverseImport({
      type: activeTab,
      text,
      loglineText: editLogline.trim(),
      genreId: editGenre || "auto",
    });
    onClose();
  };

  const currentText = textValues[activeTab];
  const hasText = currentText.trim().length > 10;
  const canExtract = hasText && !!apiKey && !extracting;
  const charCount = currentText.length;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile ? 8 : 20,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 580,
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        borderRadius: 16,
        background: "var(--glass-modal, rgba(14,14,30,0.96))",
        border: "1px solid var(--glass-bd-base)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 var(--glass-bd-top)",
        backdropFilter: "var(--blur-base)",
        WebkitBackdropFilter: "var(--blur-base)",
        overflow: "hidden",
      }}>

        {/* ── 헤더 ── */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid var(--glass-bd-nano)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
                color: "var(--c-tx-30)", textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 5,
              }}>
                REVERSE IMPORT
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", lineHeight: 1.3 }}>
                기존 글로 시작하기
              </div>
              <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginTop: 3 }}>
                로그라인이 없어도 괜찮습니다 — 어느 단계에서든 시작하세요
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--c-tx-35)", padding: 4, lineHeight: 1,
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 탭 */}
          <div style={{ display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 20,
                  border: activeTab === t.id ? `1px solid ${t.color}50` : "1px solid var(--glass-bd-nano)",
                  background: activeTab === t.id ? `${t.color}14` : "none",
                  color: activeTab === t.id ? t.color : "var(--c-tx-40)",
                  fontSize: 11, fontWeight: activeTab === t.id ? 700 : 400,
                  cursor: "pointer", transition: "all 0.15s",
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                <span style={{ fontSize: 13 }}>{t.icon}</span>
                {t.label}
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: "0.05em",
                  color: activeTab === t.id ? t.color : "var(--c-tx-25)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  → S{t.stage}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 본문 ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px" }}>

          {/* 탭 설명 */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "9px 12px", borderRadius: 9,
            background: `${tab.color}0A`,
            border: `1px solid ${tab.color}22`,
            marginBottom: 12,
          }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={tab.color} strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            <span style={{ fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
              {tab.hint}
            </span>
          </div>

          {/* 텍스트 입력 */}
          {activeTab === "logline" ? (
            <textarea
              value={textValues.logline}
              onChange={e => handleTextChange(e.target.value)}
              placeholder="예: 지방 소도시 형사가 연쇄 실종 사건을 수사하다 자신의 딸이 다음 타깃임을 알게 된다."
              rows={4}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1px solid var(--glass-bd-base)",
                background: "var(--glass-nano)",
                color: "var(--text-main)", fontSize: 13,
                resize: "vertical", fontFamily: "'Noto Sans KR', sans-serif",
                lineHeight: 1.7, boxSizing: "border-box", outline: "none",
              }}
            />
          ) : (
            <textarea
              value={textValues[activeTab]}
              onChange={e => handleTextChange(e.target.value)}
              placeholder={
                activeTab === "synopsis" ? "시놉시스를 여기에 붙여 넣으세요..." :
                activeTab === "treatment" ? "트리트먼트 원고를 여기에 붙여 넣으세요..." :
                "시나리오 초고를 여기에 붙여 넣으세요 (Fountain 포맷 또는 일반 텍스트)..."
              }
              rows={isMobile ? 7 : 10}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1px solid var(--glass-bd-base)",
                background: "var(--glass-nano)",
                color: "var(--text-main)", fontSize: 12,
                resize: "vertical", fontFamily: "'Courier New', 'Noto Sans KR', monospace",
                lineHeight: 1.7, boxSizing: "border-box", outline: "none",
              }}
            />
          )}

          {/* 글자 수 */}
          {activeTab !== "logline" && charCount > 0 && (
            <div style={{ fontSize: 10, color: "var(--c-tx-30)", textAlign: "right", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              {charCount.toLocaleString()}자
            </div>
          )}

          {/* ── 추출 결과 확인 패널 ── */}
          {showExtracted && extracted && activeTab !== "logline" && (
            <div style={{
              marginTop: 14, padding: "14px 16px",
              borderRadius: 12,
              background: `${tab.color}08`,
              border: `1px solid ${tab.color}30`,
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                color: tab.color, textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 10,
              }}>
                AI 추출 결과 확인
              </div>

              {/* 로그라인 편집 */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginBottom: 5, fontWeight: 600 }}>
                  로그라인 <span style={{ opacity: 0.6, fontWeight: 400 }}>(수정 가능)</span>
                </div>
                <textarea
                  value={editLogline}
                  onChange={e => setEditLogline(e.target.value)}
                  rows={2}
                  placeholder="자동 추출된 로그라인이 없습니다. 직접 입력하거나 비워두어도 됩니다."
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    border: "1px solid var(--glass-bd-base)",
                    background: "var(--glass-micro)",
                    color: "var(--text-main)", fontSize: 12,
                    resize: "vertical", fontFamily: "'Noto Sans KR', sans-serif",
                    lineHeight: 1.6, boxSizing: "border-box", outline: "none",
                  }}
                />
              </div>

              {/* 장르 선택 */}
              <div>
                <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginBottom: 5, fontWeight: 600 }}>
                  장르
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {GENRES.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setEditGenre(g.id)}
                      style={{
                        padding: "4px 10px", borderRadius: 14, fontSize: 10, fontWeight: 600,
                        border: editGenre === g.id ? `1px solid ${tab.color}60` : "1px solid var(--glass-bd-nano)",
                        background: editGenre === g.id ? `${tab.color}15` : "none",
                        color: editGenre === g.id ? tab.color : "var(--c-tx-40)",
                        cursor: "pointer", transition: "all 0.1s",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 푸터 버튼 ── */}
        <div style={{
          padding: "12px 20px 16px",
          borderTop: "1px solid var(--glass-bd-nano)",
          flexShrink: 0,
          display: "flex", gap: 8, justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px", borderRadius: 9, fontSize: 12,
              border: "1px solid var(--glass-bd-base)",
              background: "none", color: "var(--c-tx-40)",
              cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            취소
          </button>

          {activeTab === "logline" ? (
            // 로그라인: 직접 시작
            <button
              onClick={handleLoglineStart}
              disabled={!textValues.logline.trim()}
              style={{
                padding: "9px 20px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                border: "none",
                background: textValues.logline.trim() ? tab.color : "var(--glass-bd-base)",
                color: textValues.logline.trim() ? "#0c0c1c" : "var(--c-tx-30)",
                cursor: textValues.logline.trim() ? "pointer" : "not-allowed",
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.15s",
              }}
            >
              Stage 1 시작하기 →
            </button>
          ) : showExtracted ? (
            // 추출 완료: 주입 버튼
            <button
              onClick={handleInject}
              disabled={!hasText}
              style={{
                padding: "9px 20px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                border: "none",
                background: hasText ? tab.color : "var(--glass-bd-base)",
                color: hasText ? "#0c0c1c" : "var(--c-tx-30)",
                cursor: hasText ? "pointer" : "not-allowed",
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.15s",
              }}
            >
              Stage {tab.stage} 진입하기 →
            </button>
          ) : (
            // 미추출: AI 분석 버튼
            <button
              onClick={handleExtract}
              disabled={!canExtract}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                border: "none",
                background: canExtract ? tab.color : "var(--glass-bd-base)",
                color: canExtract ? "#0c0c1c" : "var(--c-tx-30)",
                cursor: canExtract ? "pointer" : "not-allowed",
                fontFamily: "'Noto Sans KR', sans-serif",
                transition: "all 0.15s",
                opacity: !apiKey && hasText ? 0.6 : 1,
              }}
            >
              {extracting ? (
                <>
                  <span style={{
                    display: "inline-block", width: 12, height: 12,
                    border: "2px solid rgba(0,0,0,0.25)", borderTop: "2px solid #0c0c1c",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  분석 중...
                </>
              ) : (
                <>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  AI로 분석하기
                </>
              )}
            </button>
          )}
        </div>

        {!apiKey && activeTab !== "logline" && (
          <div style={{
            padding: "8px 20px 12px",
            textAlign: "center",
            fontSize: 10, color: "var(--c-tx-30)",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>
            * API 키가 없으면 AI 분석 없이 텍스트만 주입됩니다.
            {!showExtracted && hasText && (
              <button
                onClick={() => {
                  setExtracted({ logline: "", genre: "auto", title: "" });
                  setEditLogline("");
                  setEditGenre("auto");
                  setShowExtracted(true);
                }}
                style={{
                  marginLeft: 8, background: "none", border: "none",
                  color: tab.color, fontSize: 10, cursor: "pointer",
                  textDecoration: "underline", fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                그냥 진행하기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
