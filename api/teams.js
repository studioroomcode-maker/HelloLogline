/**
 * Consolidated teams endpoint. Dispatched by ?resource=xxx (default: teams):
 *   /api/teams                          — GET/POST/PATCH/DELETE — 팀 CRUD
 *   /api/teams?resource=members         — GET/POST/DELETE       — 멤버/초대 관리
 */
import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";

const SUPA_URL = (process.env.SUPABASE_URL         || "").trim();
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();

const PLAN_LIMITS = { team5: 5, team10: 10, team20: 20 };
const PLAN_CREDITS = { team5: 500, team10: 1100, team20: 2500 };

function supabaseEnabled() { return !!(SUPA_URL && SUPA_KEY); }

async function supaFetch(path, { method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers["Prefer"] = prefer;
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(`Supabase ${res.status}: ${t}`); }
  return res.json().catch(() => null);
}

async function assertAdmin(teamId, email) {
  const rows = await supaFetch(
    `hll_team_members?team_id=eq.${encodeURIComponent(teamId)}&email=eq.${encodeURIComponent(email)}&select=role`
  );
  if (!rows?.length || rows[0].role !== "admin") throw new Error("admin_required");
}

// ── resource: teams (default) ────────────────────────────────────────────
async function handleTeams(req, res, email) {
  if (!supabaseEnabled()) {
    if (req.method === "GET")  return res.json({ teams: [] });
    return res.json({ ok: false, error: "Supabase 미연동" });
  }

  if (req.method === "GET") {
    const memberships = await supaFetch(
      `hll_team_members?email=eq.${encodeURIComponent(email)}&select=team_id,role`
    ) ?? [];
    if (!memberships.length) return res.json({ teams: [] });

    const ids = memberships.map(m => m.team_id).join(",");
    const teams = await supaFetch(`hll_teams?id=in.(${ids})&select=*`) ?? [];

    const enriched = teams.map(t => ({
      ...t,
      myRole: memberships.find(m => m.team_id === t.id)?.role ?? "member",
    }));
    return res.json({ teams: enriched });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { name, plan = "team5" } = body;
    if (!name) return res.status(400).json({ error: "팀 이름이 필요합니다." });
    if (!PLAN_LIMITS[plan]) return res.status(400).json({ error: "유효하지 않은 플랜입니다." });

    const teamId = `team_${Date.now()}`;
    await supaFetch("hll_teams", {
      method: "POST",
      prefer: "return=minimal",
      body: { id: teamId, name, owner_email: email, plan, credits_pool: PLAN_CREDITS[plan], monthly_limit: PLAN_LIMITS[plan] * 100 },
    });
    await supaFetch("hll_team_members", {
      method: "POST",
      prefer: "return=minimal",
      body: { team_id: teamId, email, role: "admin" },
    });
    return res.json({ ok: true, teamId });
  }

  if (req.method === "PATCH") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id가 필요합니다." });

    const membership = await supaFetch(
      `hll_team_members?team_id=eq.${encodeURIComponent(id)}&email=eq.${encodeURIComponent(email)}&select=role`
    );
    if (!membership?.length || membership[0].role !== "admin") {
      return res.status(403).json({ error: "관리자 권한이 필요합니다." });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const allowed = {};
    if (body.name) allowed.name = body.name;
    if (typeof body.credits_pool === "number") allowed.credits_pool = body.credits_pool;

    await supaFetch(`hll_teams?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: allowed,
    });
    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id가 필요합니다." });

    const team = await supaFetch(`hll_teams?id=eq.${encodeURIComponent(id)}&owner_email=eq.${encodeURIComponent(email)}&select=id`);
    if (!team?.length) return res.status(403).json({ error: "팀 소유자만 삭제할 수 있습니다." });

    await supaFetch(`hll_teams?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return res.json({ ok: true });
  }

  return res.status(405).end();
}

// ── resource: members ────────────────────────────────────────────────────
async function handleMembers(req, res, email) {
  if (!supabaseEnabled()) {
    if (req.method === "GET") return res.json({ members: [], invites: [] });
    return res.json({ ok: false, error: "Supabase 미연동" });
  }

  if (req.method === "GET") {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: "teamId가 필요합니다." });

    const [members, invites] = await Promise.all([
      supaFetch(`hll_team_members?team_id=eq.${encodeURIComponent(teamId)}&select=email,role,joined_at`) ?? [],
      supaFetch(`hll_team_invites?team_id=eq.${encodeURIComponent(teamId)}&accepted_at=is.null&select=id,invited_email,token,expires_at&order=expires_at.desc`) ?? [],
    ]);
    return res.json({ members: members ?? [], invites: invites ?? [] });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { teamId, invitedEmail, action: memberAction } = body;
    if (!teamId) return res.status(400).json({ error: "teamId가 필요합니다." });

    if (memberAction === "accept") {
      const { inviteToken } = body;
      const invite = await supaFetch(
        `hll_team_invites?token=eq.${encodeURIComponent(inviteToken)}&accepted_at=is.null&select=*`
      );
      if (!invite?.length) return res.status(400).json({ error: "유효하지 않거나 만료된 초대입니다." });
      const inv = invite[0];
      if (new Date(inv.expires_at) < new Date()) return res.status(400).json({ error: "초대가 만료되었습니다." });

      const team = await supaFetch(`hll_teams?id=eq.${encodeURIComponent(inv.team_id)}&select=monthly_limit`);
      const memberCount = await supaFetch(`hll_team_members?team_id=eq.${encodeURIComponent(inv.team_id)}&select=email`);
      if (team?.[0] && memberCount && memberCount.length >= team[0].monthly_limit) {
        return res.status(400).json({ error: "팀 정원이 가득 찼습니다." });
      }

      await supaFetch("hll_team_members", {
        method: "POST",
        prefer: "resolution=ignore-duplicates,return=minimal",
        body: { team_id: inv.team_id, email, role: "member" },
      });
      await supaFetch(`hll_team_invites?token=eq.${encodeURIComponent(inviteToken)}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: { accepted_at: new Date().toISOString() },
      });
      return res.json({ ok: true, teamId: inv.team_id });
    }

    try { await assertAdmin(teamId, email); } catch { return res.status(403).json({ error: "관리자 권한이 필요합니다." }); }

    await supaFetch("hll_team_invites", {
      method: "POST",
      prefer: "return=minimal",
      body: { team_id: teamId, invited_email: invitedEmail || null, created_by: email },
    });

    const newInvite = await supaFetch(
      `hll_team_invites?team_id=eq.${encodeURIComponent(teamId)}&created_by=eq.${encodeURIComponent(email)}&order=expires_at.desc&limit=1&select=token`
    );
    return res.json({ ok: true, inviteToken: newInvite?.[0]?.token });
  }

  if (req.method === "DELETE") {
    const { teamId, memberEmail } = req.query;
    if (!teamId || !memberEmail) return res.status(400).json({ error: "teamId와 memberEmail이 필요합니다." });

    try { await assertAdmin(teamId, email); } catch { return res.status(403).json({ error: "관리자 권한이 필요합니다." }); }
    if (memberEmail === email) return res.status(400).json({ error: "자기 자신은 제거할 수 없습니다." });

    await supaFetch(
      `hll_team_members?team_id=eq.${encodeURIComponent(teamId)}&email=eq.${encodeURIComponent(memberEmail)}`,
      { method: "DELETE" }
    );
    return res.json({ ok: true });
  }

  return res.status(405).end();
}

// ── Main dispatcher ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "로그인이 필요합니다." });

  let email;
  try {
    const payload = verifyToken(token);
    email = payload.email;
    if (!email) throw new Error("no email");
  } catch {
    return res.status(401).json({ error: "인증 토큰이 유효하지 않습니다." });
  }

  try {
    const resource = req.query?.resource || "";
    if (resource === "members") return handleMembers(req, res, email);
    return handleTeams(req, res, email);
  } catch (err) {
    console.error("[/api/teams]", err);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
