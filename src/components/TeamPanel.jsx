import { useState, useEffect, useCallback } from "react";
import { Spinner } from "../ui.jsx";

const PLAN_INFO = {
  team5:  { label: "팀 5인",  price: "99,000원/월",  credits: 500,  members: 5  },
  team10: { label: "팀 10인", price: "179,000원/월", credits: 1100, members: 10 },
  team20: { label: "팀 20인", price: "299,000원/월", credits: 2500, members: 20 },
};

function useTeamApi(token) {
  const headers = token ? { "Content-Type": "application/json", "x-auth-token": token } : { "Content-Type": "application/json" };

  const fetchTeams = useCallback(async () => {
    const res = await fetch("/api/teams", { headers: { "x-auth-token": token } });
    const { teams } = await res.json();
    return teams ?? [];
  }, [token]);

  const createTeam = useCallback(async (name, plan) => {
    const res = await fetch("/api/teams", { method: "POST", headers, body: JSON.stringify({ name, plan }) });
    return res.json();
  }, [token]);

  const fetchMembers = useCallback(async (teamId) => {
    const res = await fetch(`/api/teams/members?teamId=${encodeURIComponent(teamId)}`, { headers: { "x-auth-token": token } });
    return res.json();
  }, [token]);

  const createInvite = useCallback(async (teamId, invitedEmail) => {
    const res = await fetch("/api/teams/members", { method: "POST", headers, body: JSON.stringify({ teamId, invitedEmail }) });
    return res.json();
  }, [token]);

  const removeMember = useCallback(async (teamId, memberEmail) => {
    const res = await fetch(`/api/teams/members?teamId=${encodeURIComponent(teamId)}&memberEmail=${encodeURIComponent(memberEmail)}`, { method: "DELETE", headers: { "x-auth-token": token } });
    return res.json();
  }, [token]);

  return { fetchTeams, createTeam, fetchMembers, createInvite, removeMember };
}

function MembersView({ team, token, api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.fetchMembers(team.id).then(d => { setData(d); setLoading(false); });
  }, [team.id]);

  async function invite() {
    setInviting(true);
    const result = await api.createInvite(team.id, inviteEmail || undefined);
    if (result.inviteToken) {
      const link = `${window.location.origin}?invite=${result.inviteToken}`;
      setInviteLink(link);
    }
    setInviting(false);
    setInviteEmail("");
    api.fetchMembers(team.id).then(setData);
  }

  async function remove(memberEmail) {
    setRemoving(memberEmail);
    await api.removeMember(team.id, memberEmail);
    api.fetchMembers(team.id).then(setData);
    setRemoving(null);
  }

  const plan = PLAN_INFO[team.plan] ?? PLAN_INFO.team5;

  return (
    <div>
      {/* 팀 정보 */}
      <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(200,168,75,0.05)", border: "1px solid rgba(200,168,75,0.2)", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>{team.name}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "#C8A84B" }}>플랜: {plan.label}</span>
          <span style={{ fontSize: 10, color: "var(--c-tx-40)" }}>크레딧 풀: {team.credits_pool}cr</span>
          <span style={{ fontSize: 10, color: "var(--c-tx-40)" }}>정원: {data?.members?.length ?? "—"}/{plan.members}인</span>
        </div>
      </div>

      {/* 멤버 목록 */}
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}><Spinner size={18} color="#C8A84B" /></div>}

      {!loading && data?.members?.map(m => (
        <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)", marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-main)" }}>{m.email}</div>
            <div style={{ fontSize: 10, color: "var(--c-tx-35)" }}>{m.role === "admin" ? "관리자" : "멤버"} · 가입 {new Date(m.joined_at).toLocaleDateString("ko-KR")}</div>
          </div>
          {team.myRole === "admin" && m.email !== team.owner_email && (
            <button
              onClick={() => remove(m.email)}
              disabled={removing === m.email}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(232,93,117,0.25)", background: "rgba(232,93,117,0.07)", color: "#E85D75", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
            >
              {removing === m.email ? <Spinner size={9} color="#E85D75" /> : "제거"}
            </button>
          )}
        </div>
      ))}

      {/* 초대 */}
      {team.myRole === "admin" && (
        <div style={{ marginTop: 16, padding: "14px", borderRadius: 10, background: "rgba(78,204,163,0.04)", border: "1px solid rgba(78,204,163,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#4ECCA3", marginBottom: 10 }}>초대 링크 생성</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="초대할 이메일 (선택)"
              style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1px solid var(--c-bd-3)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: 11, fontFamily: "'Noto Sans KR', sans-serif" }}
            />
            <button
              onClick={invite}
              disabled={inviting}
              style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "#4ECCA3", color: "#0d0d1a", cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}
            >
              {inviting ? <Spinner size={11} color="#0d0d1a" /> : "링크 생성"}
            </button>
          </div>
          {inviteLink && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginBottom: 4 }}>아래 링크를 팀원에게 전달하세요 (7일 유효)</div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1, padding: "6px 10px", borderRadius: 6, background: "rgba(var(--tw),0.04)", border: "1px solid var(--c-bd-2)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "var(--c-tx-55)", wordBreak: "break-all" }}>
                  {inviteLink}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(78,204,163,0.3)", background: "rgba(78,204,163,0.08)", color: "#4ECCA3", cursor: "pointer", fontSize: 10 }}
                >복사</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 대기 중인 초대 */}
      {!loading && data?.invites?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>대기 중인 초대</div>
          {data.invites.map(inv => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, background: "rgba(var(--tw),0.02)", border: "1px solid var(--c-bd-1)", marginBottom: 4 }}>
              <span style={{ flex: 1, fontSize: 10, color: "var(--c-tx-40)" }}>{inv.invited_email || "누구나 사용 가능"}</span>
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "var(--c-tx-25)" }}>
                {new Date(inv.expires_at).toLocaleDateString("ko-KR")} 만료
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamPanel({ token, onClose }) {
  const api = useTeamApi(token);
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPlan, setNewPlan] = useState("team5");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list"); // "list" | "create" | "members"

  useEffect(() => {
    api.fetchTeams().then(t => { setTeams(t); setLoading(false); });
  }, []);

  async function createTeam() {
    if (!newName.trim()) return;
    setSaving(true);
    const result = await api.createTeam(newName.trim(), newPlan);
    setSaving(false);
    if (result.ok) {
      const updated = await api.fetchTeams();
      setTeams(updated);
      setView("list");
      setNewName("");
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 599 }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 600, width: "min(540px, 96vw)", maxHeight: "88vh",
        background: "var(--bg-surface)", border: "1px solid rgba(200,168,75,0.35)", borderRadius: 18,
        display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--c-bd-1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            {view !== "list" && (
              <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 11, marginBottom: 4, display: "block", padding: 0 }}>← 뒤로</button>
            )}
            <div style={{ fontSize: 16, fontWeight: 800, color: "#C8A84B" }}>
              {view === "list" ? "팀 플랜" : view === "create" ? "팀 만들기" : selectedTeam?.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-tx-40)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>

          {/* 팀 목록 */}
          {view === "list" && (
            <>
              {loading && <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}><Spinner size={22} color="#C8A84B" /></div>}

              {!loading && teams?.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 13, color: "var(--c-tx-40)", marginBottom: 16 }}>아직 속한 팀이 없습니다</div>
                </div>
              )}

              {!loading && teams?.map(team => (
                <div key={team.id} onClick={() => { setSelectedTeam(team); setView("members"); }} style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid var(--c-bd-2)", background: "rgba(var(--tw),0.02)", cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 3 }}>{team.name}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#C8A84B" }}>{PLAN_INFO[team.plan]?.label}</span>
                      <span style={{ fontSize: 10, color: "var(--c-tx-35)" }}>크레딧: {team.credits_pool}cr</span>
                      <span style={{ fontSize: 10, color: team.myRole === "admin" ? "#60A5FA" : "var(--c-tx-35)" }}>
                        {team.myRole === "admin" ? "관리자" : "멤버"}
                      </span>
                    </div>
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--c-tx-35)" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}

              {/* 플랜 소개 */}
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-tx-35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>팀 플랜 안내</div>
                {Object.entries(PLAN_INFO).map(([key, p]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--c-bd-1)", background: "rgba(var(--tw),0.02)", marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: "var(--c-tx-40)", marginTop: 2 }}>월 {p.credits}cr 풀 · 최대 {p.members}인</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#C8A84B" }}>{p.price}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setView("create")}
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#C8A84B", color: "#0d0d1a", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                팀 만들기
              </button>
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--c-tx-30)", textAlign: "center" }}>
                * 팀 생성 후 결제 팀(contact@hellologlines.com)에 문의하시면 구독이 활성화됩니다.
              </div>
            </>
          )}

          {/* 팀 생성 */}
          {view === "create" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: "var(--c-tx-40)", display: "block", marginBottom: 6 }}>팀 이름</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="예: Studio A 기획팀"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--c-bd-3)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: 13, fontFamily: "'Noto Sans KR', sans-serif", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, color: "var(--c-tx-40)", display: "block", marginBottom: 6 }}>플랜 선택</label>
                {Object.entries(PLAN_INFO).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setNewPlan(key)}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 9, border: `1.5px solid ${newPlan === key ? "#C8A84B" : "var(--c-bd-2)"}`, background: newPlan === key ? "rgba(200,168,75,0.08)" : "transparent", cursor: "pointer", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: "var(--c-tx-40)" }}>월 {p.credits}cr · 최대 {p.members}인</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#C8A84B" }}>{p.price}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={createTeam}
                disabled={!newName.trim() || saving}
                style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: newName.trim() ? "#C8A84B" : "var(--c-bd-3)", color: newName.trim() ? "#0d0d1a" : "var(--c-tx-30)", fontSize: 13, fontWeight: 800, cursor: newName.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {saving ? <Spinner size={14} color="#0d0d1a" /> : null}
                팀 생성하기
              </button>
            </div>
          )}

          {/* 멤버 관리 */}
          {view === "members" && selectedTeam && (
            <MembersView team={selectedTeam} token={token} api={api} />
          )}

        </div>
      </div>
    </>
  );
}
