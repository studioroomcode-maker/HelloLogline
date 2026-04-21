/**
 * GET    /api/teams/members?teamId=xxx          — 팀 멤버 목록
 * POST   /api/teams/members                     — 초대 링크 생성 / 직접 추가
 * DELETE /api/teams/members?teamId=xxx&email=xxx — 멤버 제거
 *
 * Supabase 초대 테이블 DDL:
 * ──────────────────────────────────────────────────────────────
 *   CREATE TABLE hll_team_invites (
 *     id            text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
 *     team_id       text        NOT NULL REFERENCES hll_teams(id) ON DELETE CASCADE,
 *     invited_email text,
 *     token         text        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
 *     created_by    text        NOT NULL,
 *     expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
 *     accepted_at   timestamptz
 *   );
 * ──────────────────────────────────────────────────────────────
 */

import { verifyToken, getTokenFromRequest } from "../auth/_jwt.js";

const SUPA_URL = (process.env.SUPABASE_URL         || "").trim();
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();

function supabaseEnabled() { return !!(SUPA_URL && SUPA_KEY); }

async function supaFetch(path, { method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers["Prefer"] = prefer;
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
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

export default async function handler(req, res) {
  if (!supabaseEnabled()) {
    if (req.method === "GET")    return res.json({ members: [], invites: [] });
    return res.json({ ok: false, error: "Supabase 미연동" });
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
    // ── GET: 팀 멤버 + 초대 목록 ────────────────────────────────────
    if (req.method === "GET") {
      const { teamId } = req.query;
      if (!teamId) return res.status(400).json({ error: "teamId가 필요합니다." });

      const [members, invites] = await Promise.all([
        supaFetch(`hll_team_members?team_id=eq.${encodeURIComponent(teamId)}&select=email,role,joined_at`) ?? [],
        supaFetch(`hll_team_invites?team_id=eq.${encodeURIComponent(teamId)}&accepted_at=is.null&select=id,invited_email,token,expires_at&order=expires_at.desc`) ?? [],
      ]);
      return res.json({ members: members ?? [], invites: invites ?? [] });
    }

    // ── POST: 초대 링크 생성 ────────────────────────────────────────
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { teamId, invitedEmail, action } = body;
      if (!teamId) return res.status(400).json({ error: "teamId가 필요합니다." });

      // 초대 수락 처리 (action: "accept", token: invite token)
      if (action === "accept") {
        const { inviteToken } = body;
        const invite = await supaFetch(
          `hll_team_invites?token=eq.${encodeURIComponent(inviteToken)}&accepted_at=is.null&select=*`
        );
        if (!invite?.length) return res.status(400).json({ error: "유효하지 않거나 만료된 초대입니다." });
        const inv = invite[0];
        if (new Date(inv.expires_at) < new Date()) return res.status(400).json({ error: "초대가 만료되었습니다." });

        // 팀 정원 확인
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

      // 초대 링크 생성 (admin 전용)
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

    // ── DELETE: 멤버 제거 ────────────────────────────────────────────
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
  } catch (err) {
    console.error("[/api/teams/members]", err);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
