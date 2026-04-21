/**
 * GET    /api/teams           — 내가 속한 팀 목록
 * POST   /api/teams           — 팀 생성 (name, plan)
 * PATCH  /api/teams?id=xxx    — 팀 정보 수정 (name, credits_pool)
 * DELETE /api/teams?id=xxx    — 팀 삭제 (owner only)
 *
 * Supabase 테이블 생성 SQL:
 * ──────────────────────────────────────────────────────────────
 *   CREATE TABLE hll_teams (
 *     id            text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
 *     name          text        NOT NULL,
 *     owner_email   text        NOT NULL,
 *     plan          text        NOT NULL DEFAULT 'team5',   -- team5 | team10 | team20
 *     credits_pool  integer     NOT NULL DEFAULT 0,
 *     monthly_limit integer     NOT NULL DEFAULT 500,
 *     created_at    timestamptz NOT NULL DEFAULT now()
 *   );
 *
 *   CREATE TABLE hll_team_members (
 *     team_id    text        NOT NULL REFERENCES hll_teams(id) ON DELETE CASCADE,
 *     email      text        NOT NULL,
 *     role       text        NOT NULL DEFAULT 'member',    -- admin | member
 *     joined_at  timestamptz NOT NULL DEFAULT now(),
 *     PRIMARY KEY (team_id, email)
 *   );
 *   CREATE INDEX hll_team_members_email ON hll_team_members (email);
 * ──────────────────────────────────────────────────────────────
 */

import { verifyToken, getTokenFromRequest } from "../auth/_jwt.js";

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

export default async function handler(req, res) {
  if (!supabaseEnabled()) {
    if (req.method === "GET")    return res.json({ teams: [] });
    if (req.method === "POST")   return res.json({ ok: false, error: "Supabase 미연동" });
    if (req.method === "PATCH")  return res.json({ ok: false, error: "Supabase 미연동" });
    if (req.method === "DELETE") return res.json({ ok: false, error: "Supabase 미연동" });
    return res.status(405).end();
  }

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
    // ── GET: 내 팀 목록 (소유 + 멤버) ──────────────────────────────
    if (req.method === "GET") {
      const memberships = await supaFetch(
        `hll_team_members?email=eq.${encodeURIComponent(email)}&select=team_id,role`
      ) ?? [];
      if (!memberships.length) return res.json({ teams: [] });

      const ids = memberships.map(m => m.team_id).join(",");
      const teams = await supaFetch(
        `hll_teams?id=in.(${ids})&select=*`
      ) ?? [];

      const enriched = teams.map(t => ({
        ...t,
        myRole: memberships.find(m => m.team_id === t.id)?.role ?? "member",
      }));
      return res.json({ teams: enriched });
    }

    // ── POST: 팀 생성 ──────────────────────────────────────────────
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

      // 생성자를 자동으로 admin 멤버로 등록
      await supaFetch("hll_team_members", {
        method: "POST",
        prefer: "return=minimal",
        body: { team_id: teamId, email, role: "admin" },
      });

      return res.json({ ok: true, teamId });
    }

    // ── PATCH: 팀 정보 수정 (owner or admin만) ────────────────────
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

    // ── DELETE: 팀 삭제 (owner only) ──────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id가 필요합니다." });

      const team = await supaFetch(`hll_teams?id=eq.${encodeURIComponent(id)}&owner_email=eq.${encodeURIComponent(email)}&select=id`);
      if (!team?.length) return res.status(403).json({ error: "팀 소유자만 삭제할 수 있습니다." });

      await supaFetch(`hll_teams?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
      return res.json({ ok: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error("[/api/teams]", err);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
