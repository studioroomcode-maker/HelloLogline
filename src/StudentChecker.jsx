// 학생용 로그라인 진단기 — HelloLoglines Stage 1 기능만 분리한 독립 툴.
// 로그인/크레딧 없이, 선생님이 공유한 공용 암호(passcode)로 /api/student-claude를 호출한다.
import { useState, useMemo } from "react";
import {
  SYSTEM_PROMPT, WEAKNESS_FIX_SYSTEM_PROMPT, DURATION_OPTIONS, GENRES,
  EXAMPLE_LOGLINES, CRITERIA_GUIDE, LABELS_KR,
} from "./constants.js";
import { calcSectionTotal, callClaude } from "./utils.js";
import { LoglineAnalysisSchema, WeaknessFixSchema } from "./schemas.js";
import { ScoreBar, CircleGauge, ImprovementPanel } from "./panels.jsx";

// 서버 프록시(.env 키)를 쓴다는 의미의 센티넬값 — 실제 키가 아니라 브라우저에 저장/전송하지 않는다.
const API_KEY = "__server__";
const STUDENT_ENDPOINT = "/api/student-claude";
const PASSCODE_STORAGE_KEY = "hll_student_passcode";

// 포맷별 권장 글자수 (HELLOLOGLINES_DOCS.md §11 기준, constants.js의 DURATION_OPTIONS.structure에는 숫자로 없어 여기서만 보조 표시용으로 둠)
const CHAR_RANGE = {
  ultrashort: [20, 40], shortform: [30, 50], shortfilm: [40, 70],
  webdrama: [50, 80], tvdrama: [60, 90], feature: [70, 110],
  miniseries: [90, 140], shortformseries: [60, 100],
};

const SECTION_LABELS = [
  { key: "structure", title: "구조적 완성도", max: 50, color: "#4ECCA3" },
  { key: "expression", title: "표현적 매력도", max: 30, color: "#45B7D1" },
  { key: "technical", title: "기술적 완성도", max: 20, color: "#FB923C" },
  { key: "interest", title: "흥미 유발 지수", max: 100, color: "#A78BFA" },
];

function label(text, sub) {
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", fontFamily: "'Noto Sans KR', sans-serif" }}>{text}</span>
      {sub && <span style={{ fontSize: 11, color: "var(--c-tx-30)", marginLeft: 8, fontFamily: "'Noto Sans KR', sans-serif" }}>{sub}</span>}
    </div>
  );
}

// ── 약점 집중 보완: 부족한 항목만 골라 채워 넣은 로그라인을 제안 ──
function WeaknessFixPanel({ logline, genre, result, weakItems, onApply, extraHeaders }) {
  const [state, setState] = useState("idle"); // idle|loading|done|error
  const [fixes, setFixes] = useState([]);
  const [error, setError] = useState("");

  const genreLabel = GENRES.find((g) => g.id === genre)?.label || "자동 감지";

  const handleFix = async () => {
    setState("loading");
    setError("");
    try {
      const weakText = weakItems.slice(0, 3).map((i) => `${i.label} (${Math.round(i.ratio * 100)}%)`).join(", ");
      const msg = `원본 로그라인: "${logline}"\n장르: ${genreLabel}\n\n⚠️ 핵심 전제 유지 필수: 위 로그라인의 인물·사건·배경은 바꾸지 말고 아래 취약점만 개선하세요.\n\n취약 항목 (점수 낮은 순): ${weakText || "없음"}\n\n종합 피드백: ${result?.overall_feedback || "-"}`;
      const data = await callClaude(API_KEY, WEAKNESS_FIX_SYSTEM_PROMPT, msg, 3000, "claude-sonnet-5", null, WeaknessFixSchema, "logline", STUDENT_ENDPOINT, extraHeaders);
      setFixes(data.fixes || []);
      setState("done");
    } catch (e) {
      setError(e.message || "약점 수정안 생성 중 오류가 발생했습니다.");
      setState("error");
    }
  };

  return (
    <div style={{ padding: 18, background: "rgba(248,113,113,0.05)", borderRadius: 12, border: "1px solid rgba(248,113,113,0.15)" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#F87171", marginBottom: 6 }}>🔧 부족한 부분만 채워서 보완하기</div>
      <div style={{ fontSize: 12, color: "var(--c-tx-40)", marginBottom: 14, lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif" }}>
        점수 낮은 항목 2~3개를 골라, 그 부분에 무엇을 추가하면 되는지 직접 고친 예시를 보여줍니다.
      </div>

      {state === "idle" && (
        <button
          onClick={handleFix}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.1)", color: "#F87171", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          부족한 부분 보완안 받기
        </button>
      )}
      {state === "loading" && (
        <div style={{ textAlign: "center", color: "var(--c-tx-40)", fontSize: 12, padding: "12px 0", fontFamily: "'Noto Sans KR', sans-serif" }}>분석 중…</div>
      )}
      {state === "error" && (
        <div style={{ fontSize: 12, color: "#F87171", fontFamily: "'Noto Sans KR', sans-serif" }}>{error}</div>
      )}
      {state === "done" && fixes.map((fix, i) => (
        <div key={i} style={{ padding: "14px 16px", background: "var(--c-card-1)", borderRadius: 10, marginBottom: 10, border: "1px solid var(--c-bd-2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#F87171", marginBottom: 4 }}>{fix.weakness}</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-40)", marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>{fix.score_issue}</div>
          <div style={{ fontSize: 13, color: "var(--text-main)", marginBottom: 10, lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>&ldquo;{fix.fixed_logline}&rdquo;</div>
          <div style={{ fontSize: 11, color: "var(--c-tx-35)", marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif" }}>→ {fix.key_change}</div>
          {onApply && (
            <button onClick={() => onApply(fix.fixed_logline)} style={{ padding: "5px 13px", borderRadius: 7, border: "1px solid #F8717155", background: "#F8717118", color: "#F87171", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}>
              ↻ 이걸로 다시 진단
            </button>
          )}
        </div>
      ))}
      {state === "done" && (
        <button onClick={() => { setState("idle"); setFixes([]); }} style={{ background: "none", border: "none", color: "var(--c-tx-25)", cursor: "pointer", fontSize: 11, marginTop: 4, fontFamily: "'Noto Sans KR', sans-serif" }}>
          다시 생성
        </button>
      )}
    </div>
  );
}

export default function StudentChecker() {
  const [logline, setLogline] = useState("");
  const [genre, setGenre] = useState("auto");
  const [selectedDuration, setSelectedDuration] = useState("feature");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passcode, setPasscode] = useState(() => localStorage.getItem(PASSCODE_STORAGE_KEY) || "");
  const [passcodeInput, setPasscodeInput] = useState("");

  const extraHeaders = { "x-student-passcode": passcode };

  const handleSavePasscode = () => {
    const trimmed = passcodeInput.trim();
    if (!trimmed) return;
    localStorage.setItem(PASSCODE_STORAGE_KEY, trimmed);
    setPasscode(trimmed);
  };

  const durOption = DURATION_OPTIONS.find((d) => d.id === selectedDuration);
  const charRange = CHAR_RANGE[selectedDuration];

  const buildUserMsg = (text) => {
    const genreText = genre === "auto" ? "장르를 자동으로 감지해주세요." : `선택된 장르: ${GENRES.find((g) => g.id === genre)?.label}`;
    return `다음 로그라인을 분석해주세요.\n\n포맷: ${durOption?.label} (${durOption?.duration})\n장르: ${genreText}\n글자수: ${text.length}자\n\n로그라인:\n"${text.trim()}"`;
  };

  const handleAnalyze = async (overrideText) => {
    const target = (overrideText ?? logline).trim();
    if (!target) return;
    setLoading(true);
    setError("");
    setResult(null);
    if (overrideText) setLogline(overrideText);
    try {
      const parsed = await callClaude(API_KEY, SYSTEM_PROMPT, buildUserMsg(target), 4500, "claude-sonnet-5", null, LoglineAnalysisSchema, "logline", STUDENT_ENDPOINT, extraHeaders);
      setResult(parsed);
    } catch (err) {
      if (err.message?.includes("암호")) {
        localStorage.removeItem(PASSCODE_STORAGE_KEY);
        setPasscode("");
      }
      setError(err.message || "진단 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 점수/만점 비율이 낮은 순으로 정렬 — "무엇이 부족한지" 목록
  const weakItems = useMemo(() => {
    if (!result) return [];
    return Object.entries({ ...result.structure, ...result.expression, ...result.technical })
      .filter(([, v]) => v?.max > 0)
      .map(([k, v]) => ({
        key: k,
        label: LABELS_KR[k] || k,
        score: v.score,
        max: v.max,
        ratio: v.max ? v.score / v.max : 0,
        feedback: v.feedback,
        guide: CRITERIA_GUIDE[k],
      }))
      .sort((a, b) => a.ratio - b.ratio);
  }, [result]);

  const shortfalls = weakItems.filter((i) => i.ratio < 0.7).slice(0, 5);
  const qualityScore = result ? calcSectionTotal(result, "structure") + calcSectionTotal(result, "expression") + calcSectionTotal(result, "technical") : 0;
  const interestScore = result ? calcSectionTotal(result, "interest") : 0;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", letterSpacing: -0.4, marginBottom: 6 }}>
          로그라인 진단기
        </div>
        <div style={{ fontSize: 13, color: "var(--c-tx-40)", fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
          로그라인을 쓰고 진단하면, 무엇이 부족하고 무엇을 더 넣어야 하는지 알려줍니다.
        </div>
      </div>

      {/* ── 접근 암호 (선생님이 공유한 값) ── */}
      {!passcode && (
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 10, border: "1px solid var(--c-bd-2)", background: "var(--c-card-1)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif" }}>
            🔒 선생님께 받은 암호를 입력하세요
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePasscode()}
              placeholder="암호 입력"
              style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid var(--c-bd-2)", background: "var(--bg-page)", color: "var(--text-main)", fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif" }}
            />
            <button onClick={handleSavePasscode} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#4ECCA3", color: "#08120e", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif" }}>
              확인
            </button>
          </div>
        </div>
      )}

      {/* ── 입력 ── */}
      <div style={{ marginBottom: 20, opacity: passcode ? 1 : 0.4, pointerEvents: passcode ? "auto" : "none" }}>
        <textarea
          value={logline}
          onChange={(e) => setLogline(e.target.value)}
          placeholder="예) 전직 형사가 딸을 납치한 조직을 쫓다가, 그 조직의 우두머리가 자신의 옛 파트너였다는 사실을 알게 된다."
          rows={4}
          style={{
            width: "100%", padding: 14, borderRadius: 10, border: "1px solid var(--c-bd-2)",
            background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 14, lineHeight: 1.7,
            fontFamily: "'Noto Sans KR', sans-serif", resize: "vertical",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {EXAMPLE_LOGLINES.map((ex, i) => (
              <button key={i} onClick={() => setLogline(ex)}
                style={{ fontSize: 10, padding: "4px 9px", borderRadius: 6, border: "1px solid var(--c-bd-2)", background: "var(--c-card-1)", color: "var(--c-tx-35)", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif" }}>
                예시 {i + 1}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: charRange && (logline.length < charRange[0] || logline.length > charRange[1]) ? "#E85D75" : "var(--c-tx-30)" }}>
            {logline.length}자{charRange ? ` (권장 ${charRange[0]}~${charRange[1]}자)` : ""}
          </span>
        </div>
      </div>

      {/* ── 포맷 / 장르 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, opacity: passcode ? 1 : 0.4, pointerEvents: passcode ? "auto" : "none" }}>
        <div>
          {label("영상 포맷")}
          <select value={selectedDuration} onChange={(e) => setSelectedDuration(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--c-bd-2)", background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {DURATION_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.icon} {d.label} ({d.duration})</option>
            ))}
          </select>
        </div>
        <div>
          {label("장르")}
          <select value={genre} onChange={(e) => setGenre(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--c-bd-2)", background: "var(--c-card-1)", color: "var(--text-main)", fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>{g.icon} {g.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => handleAnalyze()}
        disabled={!passcode || !logline.trim() || loading}
        style={{
          width: "100%", padding: 14, borderRadius: 10, border: "none",
          background: passcode && logline.trim() && !loading ? "#4ECCA3" : "var(--c-bd-2)",
          color: passcode && logline.trim() && !loading ? "#08120e" : "var(--c-tx-30)",
          fontSize: 15, fontWeight: 800, cursor: passcode && logline.trim() && !loading ? "pointer" : "not-allowed",
          fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 28,
        }}
      >
        {loading ? "진단하는 중…" : "진단하기"}
      </button>

      {error && (
        <div style={{ fontSize: 12, color: "#E85D75", padding: "10px 14px", background: "rgba(232,93,117,0.08)", borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          {/* ── 부족한 부분 요약 (가장 먼저 보여줄 핵심) ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
              📌 지금 가장 부족한 부분
            </div>
            <div style={{ fontSize: 12, color: "var(--c-tx-35)", fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 12 }}>
              점수가 낮은 순서대로, 무엇을 더 넣어야 하는지 알려줍니다.
            </div>
            {shortfalls.length === 0 ? (
              <div style={{ fontSize: 13, color: "#4ECCA3", padding: "12px 16px", background: "rgba(78,204,163,0.07)", borderRadius: 10, fontFamily: "'Noto Sans KR', sans-serif" }}>
                크게 부족한 항목이 없습니다. 균형 잡힌 로그라인이에요.
              </div>
            ) : shortfalls.map((item) => (
              <div key={item.key} style={{ padding: "14px 16px", marginBottom: 10, background: "rgba(232,93,117,0.05)", border: "1px solid rgba(232,93,117,0.15)", borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#E85D75", fontFamily: "'Noto Sans KR', sans-serif" }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#E85D75" }}>{item.score}/{item.max}</span>
                </div>
                {item.feedback && (
                  <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", marginBottom: item.guide ? 6 : 0 }}>
                    {item.feedback}
                  </div>
                )}
                {item.guide && (
                  <div style={{ fontSize: 11, color: "var(--c-tx-35)", lineHeight: 1.6, fontFamily: "'Noto Sans KR', sans-serif", paddingLeft: 10, borderLeft: "2px solid rgba(232,93,117,0.3)" }}>
                    💡 {item.guide}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── 스스로 생각해볼 질문 ── */}
          {result.improvement_questions?.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)", marginBottom: 10 }}>🤔 스스로 답해볼 질문</div>
              {result.improvement_questions.map((q, i) => (
                <div key={i} style={{ fontSize: 13, color: "var(--c-tx-55)", padding: "10px 14px", marginBottom: 6, background: "var(--c-card-1)", borderRadius: 8, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6 }}>
                  {q}
                </div>
              ))}
            </div>
          )}

          {/* ── 점수 게이지 ── */}
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 28 }}>
            <CircleGauge score={qualityScore} label="품질 점수" size={110} />
            <CircleGauge score={interestScore} label="흥미도" size={110} />
          </div>

          {/* ── 항목별 점수 ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)", marginBottom: 14 }}>세부 점수</div>
            {SECTION_LABELS.map((sec) => (
              <div key={sec.key} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: sec.color, marginBottom: 10 }}>
                  {sec.title} ({calcSectionTotal(result, sec.key)}/{sec.max})
                </div>
                {Object.entries(result[sec.key] || {}).map(([k, v]) => (
                  <ScoreBar key={k} score={v.score} max={v.max} label={LABELS_KR[k] || k} found={v.found} feedback={v.feedback} criterionKey={k} />
                ))}
              </div>
            ))}
          </div>

          {result.overall_feedback && (
            <div style={{ fontSize: 13, color: "var(--c-tx-55)", padding: "14px 16px", background: "var(--c-card-1)", borderRadius: 10, marginBottom: 28, lineHeight: 1.7, fontFamily: "'Noto Sans KR', sans-serif" }}>
              {result.overall_feedback}
            </div>
          )}

          {/* ── 보완 도구 ── */}
          <div style={{ marginBottom: 20 }}>
            <WeaknessFixPanel logline={logline} genre={genre} result={result} weakItems={weakItems} onApply={handleAnalyze} extraHeaders={extraHeaders} />
          </div>
          <ImprovementPanel logline={logline} genre={genre} apiKey={API_KEY} result={result} onReanalyze={handleAnalyze} endpoint={STUDENT_ENDPOINT} extraHeaders={extraHeaders} />
        </div>
      )}
    </div>
  );
}
