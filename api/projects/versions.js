/**
 * GET    /api/projects/versions?projectId=xxx  — 특정 프로젝트의 버전 목록 (최신순 10개)
 * POST   /api/projects/versions                 — 새 버전 스냅샷 저장 (오래된 버전 자동 정리)
 * DELETE /api/projects/versions?id=xxx          — 특정 버전 삭제
 *
 * Supabase 테이블 생성 SQL (SQL Editor에서 한 번 실행):
 * ──────────────────────────────────────────────────────────────
 *   CREATE TABLE hll_project_versions (
 *     id          bigserial   PRIMARY KEY,
 *     project_id  text        NOT NULL,
 *     user_email  text        NOT NULL,
 *     version_num integer     NOT NULL DEFAULT 1,
 *     title       text,
 *     logline     text,
 *     snapshot    jsonb       NOT NULL,
 *     created_at  timestamptz NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX hll_project_versions_lookup
 *     ON hll_project_versions (project_id, user_email, created_at DESC);
 * ──────────────────────────────────────────────────────────────
 */

import { verifyToken, getTokenFromRequest } from "../auth/_jwt.js";

const SUPA_URL = (process.env.SUPABASE_URL         || "").trim();
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const MAX_VERSIONS = 10;

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
  if (!supabaseEnabled()) {
    if (req.method === "GET")    return res.json({ versions: [] });
    if (req.method === "POST")   return res.json({ ok: true, synced: false });
    if (req.method === "DELETE") return res.json({ ok: true, synced: false });
    return res.status(405).end();
  }

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
    // ── GET: 버전 목록 또는 단일 버전 스냅샷 (복원용) ───────────────────
    if (req.method === "GET") {
      const { projectId, id } = req.query;

      // 단일 버전 스냅샷 — 복원에 사용
      if (id) {
        const rows = await supaFetch(
          `hll_project_versions?id=eq.${encodeURIComponent(id)}&user_email=eq.${encodeURIComponent(email)}&select=snapshot`
        );
        if (!rows?.length) return res.status(404).json({ error: "버전을 찾을 수 없습니다." });
        return res.json({ snapshot: rows[0].snapshot });
      }

      if (!projectId) return res.status(400).json({ error: "projectId가 필요합니다." });

      const rows = await supaFetch(
        `hll_project_versions?project_id=eq.${encodeURIComponent(projectId)}&user_email=eq.${encodeURIComponent(email)}&select=id,version_num,title,logline,created_at&order=created_at.desc&limit=${MAX_VERSIONS}`
      ) ?? [];

      return res.json({
        versions: rows.map(r => ({
          id:         r.id,
          versionNum: r.version_num,
          title:      r.title,
          logline:    r.logline,
          createdAt:  r.created_at,
        })),
      });
    }

    // ── POST: 새 버전 저장 ────────────────────────────────────────────
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { projectId, snapshot } = body;

      if (!projectId || !snapshot) return res.status(400).json({ error: "projectId와 snapshot이 필요합니다." });

      // 현재 최신 버전 번호 조회
      const existing = await supaFetch(
        `hll_project_versions?project_id=eq.${encodeURIComponent(projectId)}&user_email=eq.${encodeURIComponent(email)}&select=id,version_num&order=version_num.desc&limit=1`
      );
      const nextVersion = existing?.length ? existing[0].version_num + 1 : 1;

      // 새 버전 저장
      await supaFetch("hll_project_versions", {
        method: "POST",
        prefer: "return=minimal",
        body: {
          project_id:  projectId,
          user_email:  email,
          version_num: nextVersion,
          title:       snapshot.title || null,
          logline:     snapshot.logline || null,
          snapshot,
        },
      });

      // 오래된 버전 정리 (MAX_VERSIONS 초과분 삭제)
      const allVersions = await supaFetch(
        `hll_project_versions?project_id=eq.${encodeURIComponent(projectId)}&user_email=eq.${encodeURIComponent(email)}&select=id&order=created_at.desc`
      ) ?? [];

      if (allVersions.length > MAX_VERSIONS) {
        const toDelete = allVersions.slice(MAX_VERSIONS).map(v => v.id);
        await supaFetch(
          `hll_project_versions?id=in.(${toDelete.join(",")})&user_email=eq.${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
      }

      return res.json({ ok: true, versionNum: nextVersion });
    }

    // ── DELETE: 특정 버전 삭제 ─────────────────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id가 필요합니다." });

      // 단일 버전 — user_email 조건으로 소유권 확인
      const rows = await supaFetch(
        `hll_project_versions?id=eq.${encodeURIComponent(id)}&user_email=eq.${encodeURIComponent(email)}&select=snapshot`
      );
      if (!rows?.length) return res.status(404).json({ error: "버전을 찾을 수 없습니다." });

      await supaFetch(
        `hll_project_versions?id=eq.${encodeURIComponent(id)}&user_email=eq.${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      return res.json({ ok: true });
    }

    return res.status(405).end();

  } catch (err) {
    console.error("[/api/projects/versions]", err);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
