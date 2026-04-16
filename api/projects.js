/**
 * GET    /api/projects          — 내 프로젝트 목록 (메타데이터만, 최신순 50개)
 * GET    /api/projects?id=xxx   — 단일 프로젝트 전체 데이터
 * PUT    /api/projects          — 프로젝트 저장/업데이트 (upsert)
 * DELETE /api/projects?id=xxx   — 프로젝트 삭제
 *
 * Supabase 테이블 생성 SQL (Supabase SQL Editor에서 한 번 실행):
 * ──────────────────────────────────────────────────────────────
 *   CREATE TABLE hll_projects (
 *     id         text        NOT NULL,
 *     user_email text        NOT NULL REFERENCES hll_users(email) ON DELETE CASCADE,
 *     title      text,
 *     logline    text,
 *     genre      text,
 *     data       jsonb       NOT NULL DEFAULT '{}',
 *     created_at timestamptz NOT NULL DEFAULT now(),
 *     updated_at timestamptz NOT NULL DEFAULT now(),
 *     PRIMARY KEY (id, user_email)
 *   );
 *   CREATE INDEX hll_projects_user ON hll_projects (user_email, updated_at DESC);
 *
 *   -- updated_at 자동 갱신 트리거
 *   CREATE OR REPLACE FUNCTION set_updated_at()
 *   RETURNS TRIGGER LANGUAGE plpgsql AS $$
 *   BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
 *
 *   CREATE TRIGGER hll_projects_updated_at
 *     BEFORE UPDATE ON hll_projects
 *     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
 * ──────────────────────────────────────────────────────────────
 */

import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";

const SUPA_URL = (process.env.SUPABASE_URL          || "").trim();
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY  || "").trim();

function supabaseEnabled() {
  return !!(SUPA_URL && SUPA_KEY);
}

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
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

export default async function handler(req, res) {
  // Supabase 미설정 시 기능 비활성화 (에러 없이 빈 응답)
  if (!supabaseEnabled()) {
    if (req.method === "GET")    return res.json({ projects: [] });
    if (req.method === "PUT")    return res.json({ ok: true, synced: false });
    if (req.method === "DELETE") return res.json({ ok: true, synced: false });
    return res.status(405).end();
  }

  // 인증
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "로그인이 필요합니다." });

  let email;
  try {
    const payload = verifyToken(token);
    email = payload.email;
    if (!email) throw new Error("email claim missing");
  } catch {
    return res.status(401).json({ error: "인증 토큰이 유효하지 않습니다." });
  }

  try {
    // ── GET: 목록 또는 단일 조회 ─────────────────────────────────────
    if (req.method === "GET") {
      const { id } = req.query;

      if (id) {
        // 단일 프로젝트 전체 데이터
        const rows = await supaFetch(
          `hll_projects?id=eq.${encodeURIComponent(id)}&user_email=eq.${encodeURIComponent(email)}&select=*`
        );
        if (!rows || rows.length === 0) return res.status(404).json({ error: "Not found" });
        const row = rows[0];
        return res.json({ project: { ...row.data, id: row.id, updatedAt: row.updated_at } });
      }

      // 목록 — 메타데이터만 (data 제외, 빠른 응답)
      const rows = await supaFetch(
        `hll_projects?user_email=eq.${encodeURIComponent(email)}&select=id,title,logline,genre,updated_at&order=updated_at.desc&limit=50`
      ) ?? [];

      return res.json({
        projects: rows.map(r => ({
          id:        r.id,
          title:     r.title,
          logline:   r.logline,
          genre:     r.genre,
          updatedAt: r.updated_at,
        })),
      });
    }

    // ── PUT: upsert ──────────────────────────────────────────────────
    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, title, logline, genre, updatedAt, ...rest } = body;

      if (!id) return res.status(400).json({ error: "id가 필요합니다." });

      // data에 전체 스냅샷 보존 (id/email 제외)
      const data = { title, logline, genre, updatedAt, ...rest };

      await supaFetch("hll_projects", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: {
          id,
          user_email: email,
          title:      (title || "").slice(0, 200),
          logline:    (logline || "").slice(0, 500),
          genre:      (genre || ""),
          data,
          updated_at: updatedAt || new Date().toISOString(),
        },
      });

      return res.json({ ok: true });
    }

    // ── DELETE ────────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id가 필요합니다." });

      await supaFetch(
        `hll_projects?id=eq.${encodeURIComponent(id)}&user_email=eq.${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      return res.json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("[projects]", err.message);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
