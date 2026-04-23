/**
 * ClassCompareAnalysis.jsx — 교육 모드 전용 '단체 로그라인 비교 분석'
 *
 * 학생들의 로그라인을 여러 개 동시에 입력해 장점/단점/개선점 및 점수·순위를
 * 한 번에 받을 수 있는 패널. 처음엔 2개만 입력 가능하며 + 버튼으로 추가한다.
 * 엑셀용 CSV 템플릿 다운로드와 파일 업로드로 일괄 입력도 지원한다.
 */

import { useRef, useState } from "react";
import { callClaude } from "../utils.js";
import { Spinner } from "../ui.jsx";

const EDU_COLOR = "#A78BFA";
const OK_COLOR = "#4ECCA3";
const WARN_COLOR = "#F7A072";
const DANGER_COLOR = "#E85D75";

// ── 엑셀용 CSV 유틸 ──────────────────────────────────
// UTF-8 BOM을 붙이면 Excel에서 한글이 깨지지 않는다.
const CSV_BOM = "﻿";

function csvEscape(v) {
  const s = (v ?? "").toString();
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildTemplateCsv() {
  const rows = [
    ["이름", "로그라인"],
    ["예) 김학생", "평범한 고등학생이 학교 지하실에서 30년 전 사라진 선배의 일기를 발견하면서 학교의 숨겨진 비밀을 파헤치기 시작한다."],
    ["예) 이학생", "은퇴한 복싱 챔피언이 10년 만에 링에 복귀해 자신을 은퇴시킨 선수와 마지막 한 판을 벌인다."],
    ["", ""],
    ["", ""],
  ];
  return CSV_BOM + rows.map(r => r.map(csvEscape).join(",")).join("\r\n");
}

function parseCsv(text) {
  // 간단한 CSV 파서 — 큰따옴표 이스케이프 처리
  const cleaned = text.replace(/^﻿/, "");
  const rows = [];
  let field = "";
  let row = [];
  let inQuote = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inQuote) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') { field += '"'; i++; }
        else { inQuote = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); field = ""; row = []; }
      else if (ch === "\r") { /* skip */ }
      else { field += ch; }
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function nextId() {
  return `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function newEntry() {
  return { id: nextId(), name: "", logline: "" };
}

// ── 점수 색 ─────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return OK_COLOR;
  if (s >= 60) return "#60A5FA";
  if (s >= 40) return WARN_COLOR;
  return DANGER_COLOR;
}

// ── AI 호출 ─────────────────────────────────────
const SYSTEM_PROMPT = `당신은 한국의 베테랑 시나리오 교수입니다. 학생들이 제출한 로그라인들을 비교 분석해 각각의 장점·단점·개선점을 짚어주고, 100점 만점 점수와 순위를 매깁니다.

평가 기준 (총 100점):
- 구조 (50점): 주인공(10)·촉발사건(10)·목표(10)·갈등(10)·스테이크(10)
- 표현 (30점): 아이러니(10)·심상(8)·감정공명(7)·독창성(5)
- 기술 (20점): 간결성(8)·능동언어(5)·금기사항(3)·장르톤(4)

반드시 아래 JSON 스키마만 반환하세요 (마크다운·설명문·코드블록 금지):
{
  "items": [
    {
      "id": "학생 id",
      "name": "학생 이름",
      "score": 0-100 정수,
      "rank": 1부터 시작하는 정수,
      "grade": "S|A|B|C|D|F",
      "strengths": ["장점 1", "장점 2", "장점 3"],
      "weaknesses": ["단점 1", "단점 2", "단점 3"],
      "improvements": ["개선점 1", "개선점 2", "개선점 3"],
      "headline": "한 줄 총평 (40자 이내)"
    }
  ],
  "class_feedback": "반 전체를 대상으로 한 총평 (2~3문장, 공통 약점/강점 중심)"
}

규칙:
- 이름이 비어있으면 "학생N"으로 표기.
- 각 strengths/weaknesses/improvements는 구체적이고 실행 가능한 지적으로 2~4개.
- 순위는 점수 내림차순. 동점이면 rank 같게.
- 학생 id는 입력에서 준 id를 그대로 사용.
- 반드시 items는 입력과 같은 개수.`;

function buildUserMessage(entries, genre, selectedDuration) {
  const meta = [];
  if (genre) meta.push(`장르: ${genre}`);
  if (selectedDuration) meta.push(`포맷: ${selectedDuration}`);
  const header = meta.length ? `(컨텍스트 — ${meta.join(" / ")})\n\n` : "";

  const body = entries
    .map((e, i) => {
      const name = e.name.trim() || `학생${i + 1}`;
      return `[${e.id}] ${name}\n로그라인: ${e.logline.trim()}`;
    })
    .join("\n\n");

  return `${header}다음 ${entries.length}개 로그라인을 비교 분석해 JSON으로 반환하세요.\n\n${body}`;
}

export default function ClassCompareAnalysis({ apiKey, genre, selectedDuration }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(() => [newEntry(), newEntry()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const updateEntry = (id, patch) =>
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));

  const addEntry = () => setEntries(prev => [...prev, newEntry()]);

  const removeEntry = (id) =>
    setEntries(prev => (prev.length <= 2 ? prev : prev.filter(e => e.id !== id)));

  const clearAll = () => {
    setEntries([newEntry(), newEntry()]);
    setResult(null);
    setError("");
  };

  // ── 템플릿 다운로드 ──
  const downloadTemplate = () => {
    const blob = new Blob([buildTemplateCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "로그라인_단체분석_양식.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── 파일 업로드 ──
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("파일 크기는 2MB 이하만 지원합니다."); return; }

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { setError("CSV에서 내용을 찾을 수 없습니다."); return; }

      // 첫 행이 헤더인지 감지
      const first = (rows[0][0] || "").trim();
      const headerLike = /이름|name/i.test(first);
      const data = headerLike ? rows.slice(1) : rows;

      const parsed = data
        .map(r => ({
          id: nextId(),
          name: (r[0] || "").trim(),
          logline: (r[1] || "").trim(),
        }))
        // 예시 행 제거 (예) 로 시작)
        .filter(r => !(r.name.startsWith("예)") || r.logline.startsWith("예)")))
        .filter(r => r.name || r.logline);

      if (parsed.length === 0) { setError("파일에 실제 데이터가 없습니다. 예시 행을 지우고 학생 정보를 입력한 뒤 다시 올려주세요."); return; }

      // 최소 2개 보장
      while (parsed.length < 2) parsed.push(newEntry());

      setEntries(parsed);
      setResult(null);
      setError("");
    } catch (err) {
      setError(`파일을 읽는 중 오류: ${err.message}`);
    }
  };

  // ── 분석 실행 ──
  const analyze = async () => {
    const valid = entries.filter(e => e.logline.trim().length > 0);
    if (valid.length < 2) { setError("최소 2개 이상의 로그라인이 필요합니다."); return; }
    if (!apiKey) { setError("API 키가 먼저 설정되어야 합니다."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const userMessage = buildUserMessage(valid, genre, selectedDuration);
      const out = await callClaude(
        apiKey,
        SYSTEM_PROMPT,
        userMessage,
        Math.min(8000, 1500 + valid.length * 400),
        "claude-haiku-4-5-20251001",
        null,
        null,
        "logline"
      );

      if (!out || !Array.isArray(out.items)) {
        throw new Error("분석 결과 형식이 올바르지 않습니다.");
      }

      // id 매핑
      const byId = new Map(valid.map(e => [e.id, e]));
      const items = out.items
        .map(it => {
          const src = byId.get(it.id) || valid.find(e => e.name && e.name === it.name);
          return {
            ...it,
            id: src?.id || it.id,
            name: it.name || src?.name || "",
            logline: src?.logline || "",
          };
        })
        .sort((a, b) => (a.rank || 999) - (b.rank || 999));

      setResult({ items, class_feedback: out.class_feedback || "" });
    } catch (err) {
      setError(err.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const readyCount = entries.filter(e => e.logline.trim()).length;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* 헤더 토글 */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: open ? "10px 10px 0 0" : 10,
          border: `1px solid ${EDU_COLOR}${open ? "55" : "30"}`,
          background: open ? `${EDU_COLOR}10` : `${EDU_COLOR}06`,
          cursor: "pointer", transition: "all 0.15s",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={EDU_COLOR} strokeWidth={2} strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx={9} cy={7} r={4}/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: EDU_COLOR }}>
            단체 로그라인 비교 분석
          </span>
          <span style={{ fontSize: 10, color: `${EDU_COLOR}a0`, background: `${EDU_COLOR}14`, padding: "1px 7px", borderRadius: 10 }}>
            교육 모드 전용
          </span>
          {result && (
            <span style={{ fontSize: 10, color: OK_COLOR, background: `${OK_COLOR}1a`, padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>
              분석 완료 · {result.items.length}명
            </span>
          )}
        </div>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={EDU_COLOR} strokeWidth={2.5} strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {!open && (
        <div style={{ marginTop: 0 }} />
      )}

      {/* 본문 */}
      {open && (
        <div style={{
          padding: "14px 16px 16px",
          border: `1px solid ${EDU_COLOR}55`, borderTop: "none",
          borderRadius: "0 0 10px 10px",
          background: `${EDU_COLOR}04`,
        }}>
          <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.65, marginBottom: 12 }}>
            학생들의 로그라인을 한 번에 비교 분석합니다. 각 로그라인의{" "}
            <strong style={{ color: EDU_COLOR }}>장점·단점·개선점</strong>과{" "}
            <strong style={{ color: EDU_COLOR }}>100점 만점 점수·순위</strong>를 매겨줍니다.
            <span style={{ display: "block", marginTop: 4, fontSize: 10, color: "var(--c-tx-30)" }}>
              처음엔 2개부터 시작하며 + 버튼으로 학생을 추가할 수 있고, 엑셀용 양식(CSV)으로 일괄 업로드도 가능합니다.
            </span>
          </div>

          {/* 툴바: 다운로드 / 업로드 / 초기화 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <button
              onClick={downloadTemplate}
              style={toolBtnStyle(EDU_COLOR)}
              title="이름·로그라인 칸이 있는 엑셀용 CSV 양식"
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1={12} y1={15} x2={12} y2={3}/>
              </svg>
              엑셀 양식 다운로드
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              style={{ display: "none" }}
              onChange={handleFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={toolBtnStyle(OK_COLOR)}
              title="작성한 CSV 업로드"
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1={12} y1={3} x2={12} y2={15}/>
              </svg>
              파일 업로드
            </button>
            <div style={{ flex: 1 }} />
            {(result || entries.some(e => e.name || e.logline)) && (
              <button
                onClick={clearAll}
                style={toolBtnStyle(DANGER_COLOR)}
                title="입력·결과 모두 초기화"
              >
                초기화
              </button>
            )}
          </div>

          {/* 학생 입력 리스트 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px minmax(110px, 160px) 1fr auto",
                  gap: 8, alignItems: "flex-start",
                  padding: "10px 12px",
                  borderRadius: 9,
                  border: "1px solid var(--c-bd-2)",
                  background: "var(--c-card-2, rgba(var(--tw),0.02))",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: `${EDU_COLOR}15`, color: EDU_COLOR,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 4,
                }}>
                  {idx + 1}
                </div>
                <input
                  value={entry.name}
                  onChange={e => updateEntry(entry.id, { name: e.target.value })}
                  placeholder="이름 (예: 김학생)"
                  style={{
                    boxSizing: "border-box", width: "100%",
                    padding: "8px 10px", borderRadius: 7,
                    border: "1px solid var(--c-bd-3)",
                    background: "var(--c-card-2)", color: "var(--text-main)",
                    fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
                  }}
                />
                <textarea
                  value={entry.logline}
                  onChange={e => updateEntry(entry.id, { logline: e.target.value })}
                  placeholder="로그라인 내용을 입력하세요..."
                  rows={2}
                  style={{
                    boxSizing: "border-box", width: "100%",
                    padding: "8px 10px", borderRadius: 7,
                    border: "1px solid var(--c-bd-3)",
                    background: "var(--c-card-2)", color: "var(--text-main)",
                    fontSize: 12, lineHeight: 1.6, resize: "vertical",
                    fontFamily: "'Noto Sans KR', sans-serif", outline: "none",
                    minHeight: 38,
                  }}
                />
                <button
                  onClick={() => removeEntry(entry.id)}
                  disabled={entries.length <= 2}
                  title={entries.length <= 2 ? "최소 2개는 유지되어야 합니다" : "이 학생 제거"}
                  style={{
                    width: 28, height: 28, marginTop: 4,
                    borderRadius: 7,
                    border: `1px solid ${entries.length <= 2 ? "var(--c-bd-2)" : `${DANGER_COLOR}40`}`,
                    background: entries.length <= 2 ? "transparent" : `${DANGER_COLOR}10`,
                    color: entries.length <= 2 ? "var(--c-tx-25)" : DANGER_COLOR,
                    cursor: entries.length <= 2 ? "not-allowed" : "pointer",
                    fontSize: 14, fontWeight: 700, lineHeight: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  −
                </button>
              </div>
            ))}
          </div>

          {/* + 추가 버튼 */}
          <button
            onClick={addEntry}
            style={{
              width: "100%", padding: "9px", borderRadius: 8,
              border: `1px dashed ${EDU_COLOR}55`,
              background: `${EDU_COLOR}05`, color: EDU_COLOR,
              cursor: "pointer", fontSize: 12, fontWeight: 700,
              fontFamily: "'Noto Sans KR', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> 학생 추가
          </button>

          {/* 분석 버튼 */}
          <button
            onClick={analyze}
            disabled={loading || readyCount < 2 || !apiKey}
            style={{
              width: "100%", height: 42, borderRadius: 10,
              border: `1px solid ${EDU_COLOR}60`,
              background: loading || readyCount < 2 || !apiKey
                ? `${EDU_COLOR}08`
                : `linear-gradient(135deg, ${EDU_COLOR}25, ${EDU_COLOR}12)`,
              color: EDU_COLOR,
              cursor: loading || readyCount < 2 || !apiKey ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Noto Sans KR', sans-serif",
              opacity: readyCount < 2 || !apiKey ? 0.55 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <><Spinner size={13} color={EDU_COLOR} /> 단체 분석 중…</>
            ) : readyCount < 2 ? (
              `로그라인 입력 중 (${readyCount}/2 이상 필요)`
            ) : (
              `${readyCount}명의 로그라인 비교 분석 시작`
            )}
          </button>

          {error && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 7,
              background: `${DANGER_COLOR}10`, border: `1px solid ${DANGER_COLOR}30`,
              color: DANGER_COLOR, fontSize: 12,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── 결과 ── */}
          {result && result.items?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {/* 반 전체 총평 */}
              {result.class_feedback && (
                <div style={{
                  marginBottom: 14, padding: "12px 14px", borderRadius: 10,
                  background: `${EDU_COLOR}0a`, borderLeft: `3px solid ${EDU_COLOR}`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: EDU_COLOR, letterSpacing: 0.5, marginBottom: 5, textTransform: "uppercase" }}>
                    반 전체 총평
                  </div>
                  <div style={{ fontSize: 12, color: "var(--c-tx-70)", lineHeight: 1.75 }}>
                    {result.class_feedback}
                  </div>
                </div>
              )}

              {/* 순위표 */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-40)", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                  순위표
                </div>
                <div style={{
                  border: "1px solid var(--c-bd-2)", borderRadius: 9, overflow: "hidden",
                  background: "var(--c-card-2, rgba(var(--tw),0.02))",
                }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "56px 1fr 80px 64px",
                    padding: "8px 12px", gap: 8,
                    background: "rgba(var(--tw),0.04)",
                    borderBottom: "1px solid var(--c-bd-2)",
                    fontSize: 10, fontWeight: 700, color: "var(--c-tx-40)",
                    letterSpacing: 0.5, textTransform: "uppercase",
                  }}>
                    <div>순위</div>
                    <div>이름 / 한 줄 총평</div>
                    <div style={{ textAlign: "right" }}>점수</div>
                    <div style={{ textAlign: "center" }}>등급</div>
                  </div>
                  {result.items.map((it, i) => {
                    const c = scoreColor(it.score || 0);
                    const medal = it.rank === 1 ? "🥇" : it.rank === 2 ? "🥈" : it.rank === 3 ? "🥉" : null;
                    return (
                      <div key={it.id || i} style={{
                        display: "grid", gridTemplateColumns: "56px 1fr 80px 64px",
                        padding: "10px 12px", gap: 8, alignItems: "center",
                        borderBottom: i < result.items.length - 1 ? "1px solid var(--c-bd-1)" : "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 800, color: c, fontFamily: "'JetBrains Mono', monospace" }}>
                          {medal && <span style={{ fontSize: 15 }}>{medal}</span>}
                          <span>{it.rank}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-tx-80)", marginBottom: 2 }}>
                            {it.name || `학생${i + 1}`}
                          </div>
                          {it.headline && (
                            <div style={{ fontSize: 11, color: "var(--c-tx-45)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {it.headline}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: c, fontFamily: "'JetBrains Mono', monospace" }}>
                          {it.score ?? 0}
                          <span style={{ fontSize: 9, color: "var(--c-tx-25)", fontWeight: 400 }}> /100</span>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <span style={{
                            display: "inline-block",
                            minWidth: 22, padding: "2px 6px", borderRadius: 6,
                            background: `${c}15`, color: c,
                            fontSize: 11, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                          }}>{it.grade || "-"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 학생별 상세 카드 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.items.map((it, i) => {
                  const c = scoreColor(it.score || 0);
                  return (
                    <div key={(it.id || i) + "-card"} style={{
                      padding: "12px 14px", borderRadius: 10,
                      border: `1px solid ${c}30`,
                      background: `${c}06`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 6,
                          background: `${c}20`, color: c,
                          fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                        }}>#{it.rank}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-tx-80)" }}>
                          {it.name || `학생${i + 1}`}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: c, fontFamily: "'JetBrains Mono', monospace", marginLeft: "auto" }}>
                          {it.score ?? 0}<span style={{ fontSize: 9, color: "var(--c-tx-25)", fontWeight: 400 }}>/100</span>
                        </span>
                      </div>

                      {it.logline && (
                        <div style={{
                          fontSize: 11, color: "var(--c-tx-55)", lineHeight: 1.65,
                          padding: "8px 10px", borderRadius: 7,
                          background: "rgba(var(--tw),0.03)", border: "1px solid var(--c-bd-1)",
                          marginBottom: 10,
                        }}>
                          {it.logline}
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                        <DetailList
                          label="장점"
                          color={OK_COLOR}
                          items={it.strengths}
                        />
                        <DetailList
                          label="단점"
                          color={DANGER_COLOR}
                          items={it.weaknesses}
                        />
                        <DetailList
                          label="개선점"
                          color={WARN_COLOR}
                          items={it.improvements}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailList({ label, color, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div style={{
      padding: "8px 10px", borderRadius: 7,
      background: `${color}08`, border: `1px solid ${color}22`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>
        {label}
      </div>
      {items.map((t, i) => (
        <div key={i} style={{ fontSize: 11, color: "var(--c-tx-65)", lineHeight: 1.7, paddingLeft: 10, position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: `${color}99` }}>·</span>
          {t}
        </div>
      ))}
    </div>
  );
}

function toolBtnStyle(color) {
  return {
    padding: "7px 11px", borderRadius: 7,
    border: `1px solid ${color}40`,
    background: `${color}0c`, color,
    cursor: "pointer", fontSize: 11, fontWeight: 700,
    fontFamily: "'Noto Sans KR', sans-serif",
    display: "flex", alignItems: "center", gap: 5,
  };
}
