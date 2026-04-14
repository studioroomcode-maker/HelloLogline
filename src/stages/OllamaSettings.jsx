import { useState, useEffect, useCallback } from "react";

const LS_ENABLED = "hll_ollama_enabled";
const LS_URL     = "hll_ollama_url";
const LS_MODEL   = "hll_ollama_model";

const DEFAULT_URL   = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.1";

export default function OllamaSettings() {
  const [open, setOpen]           = useState(false);
  const [enabled, setEnabled]     = useState(() => localStorage.getItem(LS_ENABLED) === "true");
  const [url, setUrl]             = useState(() => localStorage.getItem(LS_URL) || DEFAULT_URL);
  const [model, setModel]         = useState(() => localStorage.getItem(LS_MODEL) || DEFAULT_MODEL);
  const [models, setModels]       = useState([]);          // 사용 가능한 모델 목록
  const [testing, setTesting]     = useState(false);
  const [testStatus, setTestStatus] = useState(null);     // null | "ok" | "error"
  const [testMsg, setTestMsg]     = useState("");

  // 설정값 자동 저장
  useEffect(() => { localStorage.setItem(LS_ENABLED, enabled); }, [enabled]);
  useEffect(() => { localStorage.setItem(LS_URL,     url);     }, [url]);
  useEffect(() => { localStorage.setItem(LS_MODEL,   model);   }, [model]);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setTestStatus(null);
    setModels([]);
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/api/tags`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = (data.models || []).map(m => m.name || m.model || m).filter(Boolean);
      setModels(list);
      setTestStatus("ok");
      setTestMsg(list.length > 0 ? `${list.length}개 모델 확인됨` : "연결 성공 (모델 없음)");
      // 현재 모델이 목록에 없으면 첫 번째로 교체
      if (list.length > 0 && !list.includes(model)) {
        setModel(list[0]);
      }
    } catch (e) {
      setTestStatus("error");
      setTestMsg(e.name === "TimeoutError" ? "연결 시간 초과 (6s)" : e.message);
    } finally {
      setTesting(false);
    }
  }, [url, model]);

  return (
    <div style={{ padding: "6px 10px 0" }}>
      {/* 헤더 토글 */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 7,
          padding: "7px 8px", borderRadius: 8, cursor: "pointer",
          border: enabled
            ? "1px solid rgba(78,204,163,0.3)"
            : "1px solid rgba(255,255,255,0.06)",
          background: enabled
            ? "rgba(78,204,163,0.06)"
            : "transparent",
          color: enabled ? "#4ECCA3" : "var(--c-tx-35)",
          fontSize: 11, fontWeight: 700, transition: "all 0.18s",
          fontFamily: "'Noto Sans KR', sans-serif",
          textAlign: "left",
        }}
      >
        {/* 로컬 AI 아이콘 */}
        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span style={{ flex: 1 }}>로컬 AI (Ollama)</span>
        {enabled && (
          <span style={{
            fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
            background: "rgba(78,204,163,0.15)", color: "#4ECCA3",
            fontFamily: "'JetBrains Mono', monospace",
          }}>ON</span>
        )}
        {/* 펼침 화살표 */}
        <svg
          width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={2.5} strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* 펼쳐진 설정 영역 */}
      {open && (
        <div style={{
          marginTop: 6, padding: "10px 10px 8px",
          borderRadius: 8, border: "1px solid var(--glass-bd-micro)",
          background: "var(--glass-nano)",
        }}>
          {/* 활성화 토글 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: "var(--c-tx-50)", fontFamily: "'Noto Sans KR', sans-serif" }}>
              오프라인 시 Ollama 사용
            </span>
            <button
              onClick={() => setEnabled(v => !v)}
              style={{
                width: 30, height: 16, borderRadius: 8, border: "none",
                background: enabled ? "#4ECCA3" : "var(--c-bd-2)",
                position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: enabled ? 16 : 2,
                width: 12, height: 12, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", display: "block",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {/* URL 입력 */}
          <div style={{ marginBottom: 7 }}>
            <label style={{ display: "block", fontSize: 9, color: "var(--c-tx-30)", marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>
              서버 URL
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={DEFAULT_URL}
              style={{
                width: "100%", padding: "5px 8px", borderRadius: 6, boxSizing: "border-box",
                border: "1px solid var(--c-bd-3)",
                background: "var(--glass-micro)",
                color: "var(--text-main)", fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace", outline: "none",
              }}
            />
          </div>

          {/* 모델 입력 (또는 드롭다운) */}
          <div style={{ marginBottom: 9 }}>
            <label style={{ display: "block", fontSize: 9, color: "var(--c-tx-30)", marginBottom: 3, fontFamily: "'JetBrains Mono', monospace" }}>
              모델
            </label>
            {models.length > 0 ? (
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                style={{
                  width: "100%", padding: "5px 8px", borderRadius: 6, boxSizing: "border-box",
                  border: "1px solid var(--c-bd-3)",
                  background: "var(--glass-micro)",
                  color: "var(--text-main)", fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace", outline: "none", cursor: "pointer",
                }}
              >
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder={DEFAULT_MODEL}
                style={{
                  width: "100%", padding: "5px 8px", borderRadius: 6, boxSizing: "border-box",
                  border: "1px solid var(--c-bd-3)",
                  background: "var(--glass-micro)",
                  color: "var(--text-main)", fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace", outline: "none",
                }}
              />
            )}
          </div>

          {/* 연결 테스트 버튼 */}
          <button
            onClick={testConnection}
            disabled={testing}
            style={{
              width: "100%", padding: "6px 10px", borderRadius: 7,
              border: "1px solid rgba(69,183,209,0.3)",
              background: testing ? "rgba(69,183,209,0.04)" : "rgba(69,183,209,0.08)",
              color: testing ? "rgba(69,183,209,0.4)" : "#45B7D1",
              fontSize: 10, fontWeight: 700, cursor: testing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontFamily: "'Noto Sans KR', sans-serif", transition: "all 0.18s",
            }}
          >
            {testing ? (
              <>
                <span style={{
                  display: "inline-block", width: 8, height: 8,
                  border: "1.5px solid rgba(69,183,209,0.3)", borderTop: "1.5px solid #45B7D1",
                  borderRadius: "50%", animation: "spin 0.8s linear infinite",
                }} />
                연결 중...
              </>
            ) : (
              <>
                <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.07 1.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                연결 테스트
              </>
            )}
          </button>

          {/* 테스트 결과 */}
          {testStatus && (
            <div style={{
              marginTop: 6, padding: "5px 8px", borderRadius: 6,
              background: testStatus === "ok" ? "rgba(78,204,163,0.07)" : "rgba(232,93,117,0.07)",
              border: `1px solid ${testStatus === "ok" ? "rgba(78,204,163,0.2)" : "rgba(232,93,117,0.2)"}`,
              fontSize: 9, color: testStatus === "ok" ? "#4ECCA3" : "#E85D75",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {testStatus === "ok" ? "✓ " : "✗ "}{testMsg}
            </div>
          )}

          {/* 사용 가능한 모델 목록 (연결 성공 시) */}
          {testStatus === "ok" && models.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 8, color: "var(--c-tx-25)", marginBottom: 3, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
                사용 가능한 모델
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {models.map(m => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    style={{
                      padding: "2px 6px", borderRadius: 4, fontSize: 8, cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                      border: model === m ? "1px solid rgba(78,204,163,0.5)" : "1px solid var(--c-bd-2)",
                      background: model === m ? "rgba(78,204,163,0.12)" : "transparent",
                      color: model === m ? "#4ECCA3" : "var(--c-tx-35)",
                      transition: "all 0.15s",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 도움말 */}
          <div style={{ marginTop: 8, fontSize: 8.5, color: "var(--c-tx-25)", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {enabled
              ? "오프라인 상태에서 AI 기능 사용 시 Ollama가 자동으로 사용됩니다."
              : "활성화하면 오프라인 시 Claude API 대신 Ollama를 사용합니다."}
            {!enabled && (
              <span style={{ display: "block", marginTop: 2, color: "var(--c-tx-20)" }}>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8 }}>ollama run llama3.1</code> 으로 먼저 모델을 시작하세요.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
