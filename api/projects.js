/**
 * Consolidated projects endpoint. Dispatched by ?resource=xxx (default: projects):
 *   /api/projects                          — GET/PUT/DELETE       — 프로젝트 CRUD
 *   /api/projects?resource=versions        — GET/POST/DELETE       — 버전 관리
 */
import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";

const SUPA_URL = (process.env.SUPABASE_URL          || "").trim();
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY  || "").trim();
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

// ── resource: projects (default) ─────────────────────────────────────────
async function handleProjects(req, res, email) {
  if (!supabaseEnabled()) {
    if (req.method === "GET")    return res.json({ projects: [] });
    if (req.method === "PUT")    return res.json({ ok: true, synced: false });
    if (req.method === "DELETE") return res.json({ ok: true, synced: false });
    return res.status(405).end();
  }

  if (req.method === "GET") {
    const { id } = req.query;

    if (id) {
      const rows = await supaFetch(
        `hll_projects?id=eq.${encodeURIComponent(id)}&user_email=eq.${encodeURIComponent(email)}&select=*`
      );
      if (!rows || rows.length === 0) return res.status(404).json({ error: "Not found" });
      const row = rows[0];
      return res.json({ project: { ...row.data, id: row.id, updatedAt: row.updated_at } });
    }

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

  if (req.method === "PUT") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, title, logline, genre, updatedAt, ...rest } = body;

    if (!id) return res.status(400).json({ error: "id가 필요합니다." });

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
}

// ── resource: versions ───────────────────────────────────────────────────
async function handleVersions(req, res, email) {
  if (!supabaseEnabled()) {
    if (req.method === "GET")    return res.json({ versions: [] });
    if (req.method === "POST")   return res.json({ ok: true, synced: false });
    if (req.method === "DELETE") return res.json({ ok: true, synced: false });
    return res.status(405).end();
  }

  if (req.method === "GET") {
    const { projectId, id } = req.query;

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

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { projectId, snapshot } = body;

    if (!projectId || !snapshot) return res.status(400).json({ error: "projectId와 snapshot이 필요합니다." });

    const existing = await supaFetch(
      `hll_project_versions?project_id=eq.${encodeURIComponent(projectId)}&user_email=eq.${encodeURIComponent(email)}&select=id,version_num&order=version_num.desc&limit=1`
    );
    const nextVersion = existing?.length ? existing[0].version_num + 1 : 1;

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

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id가 필요합니다." });

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
}

// ── Main dispatcher ──────────────────────────────────────────────────────
export default async function handler(req, res) {
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
    const resource = req.query?.resource || "";
    if (resource === "versions") return handleVersions(req, res, email);
    return handleProjects(req, res, email);
  } catch (err) {
    console.error("[projects]", err.message);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
