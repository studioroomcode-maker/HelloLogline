/**
 * StageCommentThread.jsx
 * 스테이지별 피드백/댓글 쓰레드
 * - 각 스테이지 하단에 접이식으로 표시
 * - @멘션 자동완성 (팀원 이름 기준)
 * - 댓글 추가/삭제, 시간 표시
 * - stageComments[stageId] 로컬 저장 (프로젝트 스냅샷 포함)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLoglineCtx } from "../context/LoglineContext.jsx";

const STAGE_LABELS = {
  "1": "로그라인 분석",
  "2": "개념 분석",
  "3": "캐릭터",
  "4": "스토리 설계",
  "5": "트리트먼트",
  "6": "시나리오 초고",
  "7": "Script Coverage",
  "8": "고쳐쓰기",
};

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "방금";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return new Date(ts).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

function renderWithMentions(text, teamMembers) {
  if (!teamMembers.length) return text;
  const parts = [];
  let last = 0;
  const mentionRegex = /@([\w가-힣]+)/g;
  let m;
  while ((m = mentionRegex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const member = teamMembers.find(t => t.name === m[1]);
    if (member) {
      parts.push(
        <span key={m.index} style={{
          color: member.color, fontWeight: 700,
          padding: "0 2px", borderRadius: 3,
          background: member.color + "18",
        }}>@{m[1]}</span>
      );
    } else {
      parts.push(
        <span key={m.index} style={{ color: "var(--c-tx-55)", fontWeight: 600 }}>@{m[1]}</span>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

export default function StageCommentThread({ stageId }) {
  const { stageComments, setStageComments, teamMembers, user } = useLoglineCtx();
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [mentionQuery, setMentionQuery] = useState(null); // null | { text, startIdx }
  const [mentionIdx, setMentionIdx] = useState(0);
  const textareaRef = useRef(null);
  const mentionBoxRef = useRef(null);

  const comments = stageComments[stageId] || [];

  // 작성자 기본값: 로그인 사용자 이름 or 팀 첫 번째 or "나"
  useEffect(() => {
    if (!authorName) {
      setAuthorName(user?.name || teamMembers[0]?.name || "나");
    }
  }, [user, teamMembers]);

  // @멘션 필터
  const filteredMembers = mentionQuery
    ? teamMembers.filter(m =>
        m.name.toLowerCase().includes(mentionQuery.text.toLowerCase()) ||
        mentionQuery.text === ""
      )
    : [];

  // 텍스트 입력 핸들러 — @멘션 감지
  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setInputText(val);
    const cursorPos = e.target.selectionStart;
    // @ 이후 단어 찾기
    const before = val.slice(0, cursorPos);
    const atIdx = before.lastIndexOf("@");
    if (atIdx !== -1 && atIdx >= before.lastIndexOf(" ") + 1) {
      const query = before.slice(atIdx + 1);
      if (!/\s/.test(query)) {
        setMentionQuery({ text: query, startIdx: atIdx });
        setMentionIdx(0);
        return;
      }
    }
    setMentionQuery(null);
  }, []);

  // 멘션 선택
  const selectMention = useCallback((member) => {
    if (mentionQuery === null) return;
    const before = inputText.slice(0, mentionQuery.startIdx);
    const after = inputText.slice(mentionQuery.startIdx + 1 + mentionQuery.text.length);
    const newText = `${before}@${member.name} ${after}`;
    setInputText(newText);
    setMentionQuery(null);
    textareaRef.current?.focus();
  }, [inputText, mentionQuery]);

  // 키보드 처리 (멘션 드롭다운 내비게이션)
  const handleKeyDown = useCallback((e) => {
    if (mentionQuery && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, filteredMembers.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); selectMention(filteredMembers[mentionIdx]); return; }
      if (e.key === "Escape") { setMentionQuery(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey && !mentionQuery) {
      e.preventDefault();
      submitComment();
    }
  }, [mentionQuery, filteredMembers, mentionIdx, selectMention]);

  const submitComment = () => {
    const text = inputText.trim();
    if (!text) return;
    const name = authorName.trim() || "나";
    const authorMember = teamMembers.find(m => m.name === name);
    const newComment = {
      id: Date.now(),
      text,
      authorName: name,
      authorColor: authorMember?.color || "#C8A84B",
      timestamp: Date.now(),
    };
    setStageComments(prev => ({
      ...prev,
      [stageId]: [...(prev[stageId] || []), newComment],
    }));
    setInputText("");
  };

  const deleteComment = (id) => {
    setStageComments(prev => ({
      ...prev,
      [stageId]: (prev[stageId] || []).filter(c => c.id !== id),
    }));
  };

  const stageLabel = STAGE_LABELS[stageId] || `Stage ${stageId}`;
  const unread = comments.length;

  return (
    <div style={{ marginTop: 28, borderTop: "1px solid var(--c-bd-1)" }}>
      {/* 토글 헤더 */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "10px 4px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-35)" strokeWidth={2} strokeLinecap="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span style={{
          fontSize: 11, fontWeight: 700, color: "var(--c-tx-40)",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em",
        }}>
          피드백 · {stageLabel}
        </span>
        {unread > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
            background: "rgba(167,139,250,0.15)", color: "#A78BFA",
            border: "1px solid rgba(167,139,250,0.25)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>{unread}</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--c-tx-25)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ paddingBottom: 20 }}>
          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <div style={{
              padding: "16px 0", textAlign: "center",
              fontSize: 11, color: "var(--c-tx-25)",
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              아직 피드백이 없습니다. 첫 번째 코멘트를 남겨보세요.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {comments.map(c => (
                <div key={c.id} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "10px 12px", borderRadius: 10,
                  background: "var(--glass-nano)",
                  border: "1px solid var(--c-bd-1)",
                }}>
                  {/* 아바타 */}
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: c.authorColor + "22",
                    border: `1.5px solid ${c.authorColor}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: c.authorColor,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}>
                    {c.authorName.slice(0, 1)}
                  </div>
                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c.authorColor, fontFamily: "'Noto Sans KR', sans-serif" }}>
                        {c.authorName}
                      </span>
                      <span style={{ fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {timeAgo(c.timestamp)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--c-tx-65)", lineHeight: 1.65,
                      fontFamily: "'Noto Sans KR', sans-serif", wordBreak: "break-word",
                    }}>
                      {renderWithMentions(c.text, teamMembers)}
                    </div>
                  </div>
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => deleteComment(c.id)}
                    style={{
                      flexShrink: 0, background: "none", border: "none",
                      cursor: "pointer", color: "var(--c-tx-20)", fontSize: 12,
                      padding: "2px 4px", lineHeight: 1, opacity: 0.6,
                      transition: "opacity 0.15s",
                    }}
                    title="삭제"
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* 입력 영역 */}
          <div style={{ position: "relative" }}>
            {/* @멘션 드롭다운 */}
            {mentionQuery && filteredMembers.length > 0 && (
              <div
                ref={mentionBoxRef}
                style={{
                  position: "absolute", bottom: "100%", left: 0, zIndex: 100,
                  marginBottom: 4, minWidth: 160,
                  background: "var(--bg-page)", border: "1px solid var(--c-bd-2)",
                  borderRadius: 9, overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                }}
              >
                {filteredMembers.map((m, i) => (
                  <button
                    key={m.id}
                    onMouseDown={e => { e.preventDefault(); selectMention(m); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px",
                      background: i === mentionIdx ? m.color + "14" : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                      borderBottom: i < filteredMembers.length - 1 ? "1px solid var(--c-bd-1)" : "none",
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>{m.name}</span>
                    <span style={{ fontSize: 9, color: "var(--c-tx-35)", fontFamily: "'JetBrains Mono', monospace" }}>{m.role}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              {/* 작성자 선택 */}
              {teamMembers.length > 0 ? (
                <select
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  style={{
                    flexShrink: 0, padding: "7px 8px", borderRadius: 8,
                    border: "1px solid var(--c-bd-3)",
                    background: "var(--c-card-1)", color: "var(--text-main)",
                    fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif",
                    cursor: "pointer", outline: "none", maxWidth: 110,
                  }}
                >
                  {user?.name && <option value={user.name}>{user.name} (나)</option>}
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name} · {m.role}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="이름"
                  style={{
                    width: 80, flexShrink: 0, padding: "7px 9px", borderRadius: 8,
                    border: "1px solid var(--c-bd-3)",
                    background: "var(--c-card-1)", color: "var(--text-main)",
                    fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
                  }}
                />
              )}

              {/* 텍스트 입력 */}
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`피드백을 입력하세요. @이름으로 멘션 가능. Enter로 등록.`}
                  rows={2}
                  style={{
                    width: "100%", padding: "8px 10px",
                    borderRadius: 8, border: "1px solid var(--c-bd-3)",
                    background: "var(--c-card-1)", color: "var(--text-main)",
                    fontSize: 12, lineHeight: 1.55, resize: "none",
                    fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(167,139,250,0.4)"}
                  onBlur={e => e.target.style.borderColor = "var(--c-bd-3)"}
                />
              </div>

              {/* 등록 버튼 */}
              <button
                onClick={submitComment}
                disabled={!inputText.trim()}
                style={{
                  flexShrink: 0, padding: "8px 12px", borderRadius: 8,
                  border: `1px solid ${inputText.trim() ? "rgba(167,139,250,0.35)" : "var(--c-bd-3)"}`,
                  background: inputText.trim() ? "rgba(167,139,250,0.12)" : "transparent",
                  color: inputText.trim() ? "#A78BFA" : "var(--c-tx-25)",
                  fontSize: 11, fontWeight: 700, cursor: inputText.trim() ? "pointer" : "default",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  alignSelf: "stretch", display: "flex", alignItems: "center",
                  transition: "all 0.15s",
                }}
              >
                등록
              </button>
            </div>
            {teamMembers.length > 0 && (
              <div style={{ marginTop: 5, fontSize: 9, color: "var(--c-tx-22)", fontFamily: "'JetBrains Mono', monospace" }}>
                @이름 으로 팀원 멘션 · Shift+Enter 줄바꿈
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
