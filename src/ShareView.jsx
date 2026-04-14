import { useState, useEffect } from "react";

export default function ShareView({ shareId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/share?id=${shareId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError("불러오기 실패");
        setLoading(false);
      });
  }, [shareId]);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-base, #0f0f13)",
        }}
      >
        <div style={{ color: "#C8A84B", fontSize: 14 }}>불러오는 중...</div>
      </div>
    );

  if (error)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-base, #0f0f13)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
          <div style={{ color: "#E85D75", fontSize: 14 }}>{error}</div>
          <a
            href="/"
            style={{
              display: "block",
              marginTop: 20,
              color: "#C8A84B",
              fontSize: 13,
            }}
          >
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    );

  const { logline, genre, data: results, created_at } = data;
  const result = results?.result;
  const coverage = results?.scriptCoverageResult;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base, #0f0f13)",
        fontFamily: "'Noto Sans KR', sans-serif",
        color: "var(--text-main, #e8e8e8)",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          borderBottom: "1px solid rgba(200,168,75,0.15)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#C8A84B",
            letterSpacing: 0.5,
          }}
        >
          HelloLogline
        </div>
        <div style={{ fontSize: 11, color: "var(--c-tx-30, #555)" }}>
          공유된 분석 결과 · {new Date(created_at).toLocaleDateString("ko-KR")}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        {/* 로그라인 */}
        <div
          style={{
            marginBottom: 28,
            padding: "20px 24px",
            borderRadius: 14,
            background: "rgba(200,168,75,0.06)",
            border: "1px solid rgba(200,168,75,0.2)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1.5,
              color: "rgba(200,168,75,0.6)",
              fontWeight: 700,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Logline
          </div>
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.75,
              color: "var(--text-main, #e8e8e8)",
              fontWeight: 500,
            }}
          >
            {logline}
          </div>
          {genre && genre !== "auto" && (
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: "rgba(200,168,75,0.6)",
              }}
            >
              장르: {genre}
            </div>
          )}
        </div>

        {/* 점수 */}
        {result && (
          <div
            style={{
              marginBottom: 20,
              padding: "16px 20px",
              borderRadius: 12,
              background: "var(--glass-nano)",
              border: "1px solid var(--glass-bd-nano)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.2,
                color: "rgba(200,168,75,0.5)",
                fontWeight: 700,
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              로그라인 분석
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {result.structure && (
                <ScoreChip
                  label="구조"
                  score={Object.values(result.structure).reduce(
                    (s, v) => s + (v?.score || 0),
                    0
                  )}
                  max={50}
                  color="#C8A84B"
                />
              )}
              {result.expression && (
                <ScoreChip
                  label="표현"
                  score={Object.values(result.expression).reduce(
                    (s, v) => s + (v?.score || 0),
                    0
                  )}
                  max={30}
                  color="#4ECCA3"
                />
              )}
              {result.technique && (
                <ScoreChip
                  label="기술"
                  score={Object.values(result.technique).reduce(
                    (s, v) => s + (v?.score || 0),
                    0
                  )}
                  max={20}
                  color="#60A5FA"
                />
              )}
            </div>
            {result.overall_feedback && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: "var(--c-tx-35)",
                  lineHeight: 1.7,
                }}
              >
                {result.overall_feedback}
              </div>
            )}
          </div>
        )}

        {/* Coverage */}
        {coverage && (
          <div
            style={{
              marginBottom: 20,
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(96,165,250,0.04)",
              border: "1px solid rgba(96,165,250,0.15)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1.2,
                color: "rgba(96,165,250,0.6)",
                fontWeight: 700,
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              Script Coverage
            </div>
            {coverage.recommendation && (
              <div
                style={{
                  display: "inline-block",
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "6px 16px",
                  borderRadius: 20,
                  background:
                    coverage.recommendation === "RECOMMEND"
                      ? "rgba(78,204,163,0.15)"
                      : coverage.recommendation === "PASS"
                      ? "rgba(232,93,117,0.15)"
                      : "rgba(255,209,102,0.15)",
                  color:
                    coverage.recommendation === "RECOMMEND"
                      ? "#4ECCA3"
                      : coverage.recommendation === "PASS"
                      ? "#E85D75"
                      : "#FFD166",
                  border: `1px solid ${
                    coverage.recommendation === "RECOMMEND"
                      ? "rgba(78,204,163,0.3)"
                      : coverage.recommendation === "PASS"
                      ? "rgba(232,93,117,0.3)"
                      : "rgba(255,209,102,0.3)"
                  }`,
                  marginBottom: 10,
                }}
              >
                {coverage.recommendation}
              </div>
            )}
            {coverage.summary && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--c-tx-35)",
                  lineHeight: 1.7,
                }}
              >
                {coverage.summary}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            padding: "24px",
            borderRadius: 14,
            background: "rgba(200,168,75,0.04)",
            border: "1px solid rgba(200,168,75,0.12)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-main, #e8e8e8)",
              marginBottom: 8,
            }}
          >
            나의 로그라인도 분석해보세요
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--c-tx-30)",
              marginBottom: 16,
            }}
          >
            18개 항목 점수 · 캐릭터 설계 · Script Coverage · 완성 시나리오까지
          </div>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #C8A84B, #E8C86A)",
              color: "#1a1a1a",
              fontSize: 13,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            무료로 시작하기 →
          </a>
        </div>
      </div>
    </div>
  );
}

function ScoreChip({ label, score, max, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {Math.round(score)}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
        {label} /{max}
      </div>
    </div>
  );
}
