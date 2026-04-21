import { useEffect, useState } from "react";
import { SvgIcon, ICON, Spinner } from "./ui.jsx";

const TIER_COLOR = { admin: "#C8A84B", pro: "#60A5FA", basic: "var(--c-tx-35)", blocked: "#E85D75" };

function AuditLogSection() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const token = localStorage.getItem("hll_auth_token");
    fetch("/api/admin/audit?limit=50", { headers: { "x-auth-token": token || "" } })
      .then(r => r.json())
      .then(d => setLogs(Array.isArray(d.logs) ? d.logs : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1 }}>
          감사 로그 (최근 50건)
        </div>
        <button
          onClick={load}
          aria-label="감사 로그 새로고침"
          style={{ fontSize: 10, color: "var(--c-tx-35)", background: "transparent", border: "1px solid var(--c-bd-3)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
        >
          새로고침
        </button>
      </div>

      {loading && <Spinner size={14} color="#C8A84B" />}

      {!loading && logs && logs.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--c-tx-30)", padding: "10px 12px", background: "rgba(var(--tw),0.02)", borderRadius: 8 }}>
          기록이 없거나 hll_audit_logs 테이블이 생성되지 않았습니다.
        </div>
      )}

      {!loading && logs && logs.length > 0 && (
        <div style={{ border: "1px solid var(--c-bd-2)", borderRadius: 10, overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-surface)" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "7px 10px", color: "var(--c-tx-35)", fontWeight: 700, borderBottom: "1px solid var(--c-bd-2)" }}>시각</th>
                <th style={{ textAlign: "left", padding: "7px 10px", color: "var(--c-tx-35)", fontWeight: 700, borderBottom: "1px solid var(--c-bd-2)" }}>액터</th>
                <th style={{ textAlign: "left", padding: "7px 10px", color: "var(--c-tx-35)", fontWeight: 700, borderBottom: "1px solid var(--c-bd-2)" }}>액션</th>
                <th style={{ textAlign: "left", padding: "7px 10px", color: "var(--c-tx-35)", fontWeight: 700, borderBottom: "1px solid var(--c-bd-2)" }}>대상</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={l.id || i} style={{ borderBottom: "1px solid var(--c-bd-1)" }}>
                  <td style={{ padding: "6px 10px", color: "var(--c-tx-45)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                    {l.created_at ? new Date(Number(l.created_at)).toLocaleString("ko-KR", { hour12: false }) : "-"}
                  </td>
                  <td style={{ padding: "6px 10px", color: "var(--c-tx-55)", wordBreak: "break-all" }}>{l.actor || "-"}</td>
                  <td style={{ padding: "6px 10px", color: "#C8A84B", fontFamily: "'JetBrains Mono', monospace" }}>{l.action || "-"}</td>
                  <td style={{ padding: "6px 10px", color: "var(--c-tx-55)", wordBreak: "break-all" }}>{l.target || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel({
  isMobile, user,
  adminUsers, adminUsersLoading, adminRedisOk,
  setAdminUsers, setAdminUsersLoading, setAdminRedisOk,
  tierSaving, handleSetTier,
  onClose,
}) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 12 : 24 }} onClick={onClose} role="presentation">
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="관리자 패널" style={{ maxWidth: 620, width: "100%", background: "var(--bg-surface)", border: "1px solid rgba(200,168,75,0.35)", borderRadius: 20, overflowY: "auto", maxHeight: "90vh", fontFamily: "'Noto Sans KR', sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid var(--c-bd-2)", flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#C8A84B" }}>관리자 패널</div>
          <button onClick={onClose} aria-label="관리자 패널 닫기" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--c-tx-35)", padding: 4 }}>
            <SvgIcon d={ICON.close} size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>

          {/* 사용자 목록 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1 }}>
                로그인 사용자 목록
              </div>
              <button
                onClick={() => {
                  setAdminUsersLoading(true);
                  const token = localStorage.getItem("hll_auth_token");
                  fetch("/api/admin/users", { headers: { "x-auth-token": token || "" } })
                    .then(r => r.json())
                    .then(d => { setAdminRedisOk(d.configured !== false); setAdminUsers(d.users || []); })
                    .catch(() => setAdminUsers([]))
                    .finally(() => setAdminUsersLoading(false));
                }}
                style={{ fontSize: 10, color: "var(--c-tx-35)", background: "transparent", border: "1px solid var(--c-bd-3)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
              >
                새로고침
              </button>
            </div>

            {/* DB 미설정 안내 */}
            {!adminRedisOk && !adminUsersLoading && (
              <div style={{ background: "rgba(200,168,75,0.06)", border: "1px solid rgba(200,168,75,0.2)", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B", marginBottom: 10 }}>DB 연동 필요</div>
                <div style={{ fontSize: 12, color: "var(--c-tx-55)", lineHeight: 1.8, marginBottom: 12 }}>
                  사용자 목록을 보려면 Supabase 또는 Upstash Redis 중 하나를 연동해야 합니다.
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4ECCA3", marginBottom: 6 }}>▸ Supabase (권장 · 무료)</div>
                  <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 6, lineHeight: 1.7 }}>
                    1. <strong style={{ color: "var(--c-tx-70)" }}>supabase.com</strong>에서 프로젝트 생성<br/>
                    2. SQL Editor에서 실행:
                  </div>
                  <div style={{ background: "var(--bg-code)", borderRadius: 7, padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4ECCA3", marginBottom: 6 }}>
                    {`CREATE TABLE hll_users (\n  email text PRIMARY KEY,\n  name text, provider text, avatar text,\n  last_seen bigint DEFAULT 0,\n  tier text DEFAULT 'basic'\n);`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--c-tx-50)", marginBottom: 4 }}>
                    3. Project Settings → API → 아래 값을 Vercel 환경변수에 추가:
                  </div>
                  <div style={{ background: "var(--bg-code-alt)", borderRadius: 7, padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--c-tx-65)" }}>
                    <div>SUPABASE_URL=https://xxxx.supabase.co</div>
                    <div>SUPABASE_SERVICE_KEY=eyJhbGci...</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", marginBottom: 6 }}>▸ Upstash Redis (대안)</div>
                  <div style={{ background: "var(--bg-code-alt)", borderRadius: 7, padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--c-tx-65)" }}>
                    <div>UPSTASH_REDIS_REST_URL=https://xxx.upstash.io</div>
                    <div>UPSTASH_REDIS_REST_TOKEN=your_token</div>
                  </div>
                </div>
              </div>
            )}

            {/* 로딩 */}
            {adminUsersLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0", color: "var(--c-tx-35)", fontSize: 13 }}>
                <Spinner size={14} /> 사용자 목록 불러오는 중...
              </div>
            )}

            {/* 사용자 없음 */}
            {!adminUsersLoading && adminRedisOk && adminUsers.length === 0 && (
              <div style={{ padding: "20px 0", color: "var(--c-tx-30)", fontSize: 13, textAlign: "center" }}>
                아직 로그인한 사용자가 없습니다.
              </div>
            )}

            {/* 사용자 목록 */}
            {!adminUsersLoading && adminUsers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {adminUsers.map(u => {
                  const uTier = u.tier || "basic";
                  const uColor = TIER_COLOR[uTier] || "var(--c-tx-35)";
                  const isSelf = u.email === user?.email;
                  return (
                    <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: isSelf ? "rgba(200,168,75,0.05)" : "rgba(var(--tw),0.02)", border: `1px solid ${isSelf ? "rgba(200,168,75,0.2)" : "var(--c-bd-2)"}` }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(96,165,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#60A5FA", flexShrink: 0 }}>
                          {u.name?.[0] || "?"}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.name || u.email}
                          {isSelf && <span style={{ marginLeft: 6, fontSize: 9, color: "#C8A84B", fontWeight: 700 }}>나</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--c-tx-40)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.email}
                          {u.provider && <span style={{ marginLeft: 6, fontSize: 9, color: "var(--c-tx-25)", fontFamily: "'JetBrains Mono', monospace" }}>{u.provider}</span>}
                        </div>
                      </div>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {tierSaving[u.email] ? (
                          <Spinner size={14} color={uColor} />
                        ) : (
                          <select
                            value={uTier}
                            disabled={isSelf}
                            onChange={e => handleSetTier(u.email, e.target.value)}
                            style={{
                              appearance: "none", WebkitAppearance: "none",
                              padding: "4px 24px 4px 10px",
                              borderRadius: 8, border: `1px solid ${uColor}55`,
                              background: `${uColor}11`,
                              color: uColor,
                              fontSize: 11, fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              opacity: isSelf ? 0.5 : 1,
                            }}
                          >
                            <option value="basic">기본</option>
                            <option value="pro">프리미엄</option>
                            <option value="admin">관리자</option>
                            <option value="blocked">차단</option>
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 감사 로그 */}
          <AuditLogSection />

          {/* 등급 안내 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>등급 체계</div>
            {[
              { t: "admin", label: "관리자", color: "#C8A84B", desc: "모든 기능 무제한, 서버 API 키 사용" },
              { t: "pro", label: "프리미엄", color: "#60A5FA", desc: "전체 8단계 기능 사용 가능" },
              { t: "basic", label: "기본", color: "var(--c-tx-35)", desc: "Stage 1만 또는 자기 API 키로 전체 이용" },
              { t: "blocked", label: "차단", color: "#E85D75", desc: "API 접근 완전 차단" },
            ].map(({ t, label, color, desc }) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 7, background: "rgba(var(--tw),0.02)", marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", minWidth: 44 }}>{label}</span>
                <span style={{ fontSize: 11, color: "var(--c-tx-45)" }}>{desc}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "var(--c-tx-28)", lineHeight: 1.7 }}>
            * 등급 변경은 즉시 저장됩니다. 대상자가 재로그인 시 반영됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
