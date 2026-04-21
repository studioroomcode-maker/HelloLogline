/**
 * IndexedDB wrapper for HelloLoglines project persistence.
 * Projects are stored with all analysis state so work survives browser refreshes.
 *
 * localStorage backup: a minimal snapshot {id, name, logline, genre, updatedAt}
 * is kept under "hll_bk_<id>" so data is recoverable after browser storage clears.
 */

const DB_NAME = "hellologlines_v1";
const DB_VERSION = 1;
const STORE = "projects";

// ─── localStorage backup helpers ────────────────────────────────────────────

const LS_PREFIX = "hll_bk_";

function lsBackupKey(id) { return LS_PREFIX + id; }

/** Write a minimal snapshot to localStorage (safe, ignores quota errors). */
function lsWrite(project) {
  try {
    const snap = {
      id: project.id,
      name: project.name || "",
      logline: project.logline || "",
      genre: project.genre || "",
      updatedAt: project.updatedAt || new Date().toISOString(),
      _fromBackup: true,
    };
    localStorage.setItem(lsBackupKey(project.id), JSON.stringify(snap));
  } catch { /* quota exceeded — silent */ }
}

/** Remove backup entry for a deleted project. */
function lsRemove(id) {
  try { localStorage.removeItem(lsBackupKey(id)); } catch { /* ignore */ }
}

/** Return all localStorage backup entries (used when IndexedDB is empty). */
function lsReadAll() {
  try {
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LS_PREFIX)) {
        try { results.push(JSON.parse(localStorage.getItem(key))); } catch { /* corrupt entry */ }
      }
    }
    return results.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1)).slice(0, 50);
  } catch { return []; }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save or update a project snapshot. */
export async function saveProject(project) {
  const saved = { ...project, updatedAt: new Date().toISOString() };
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(saved);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  lsWrite(saved);
}

/** Load all projects, newest first (max 50).
 *  Falls back to localStorage backup entries when IndexedDB returns nothing.
 */
export async function loadProjects() {
  try {
    const db = await openDB();
    const rows = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).index("updatedAt").getAll();
      req.onsuccess = () => resolve(req.result.reverse().slice(0, 50));
      req.onerror = () => reject(req.error);
    });
    if (rows.length > 0) return rows;
    // IndexedDB is empty — try localStorage backups
    return lsReadAll();
  } catch {
    return lsReadAll();
  }
}

/** Load a single project by id. */
export async function loadProject(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Delete a project by id. */
export async function deleteProject(id) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  lsRemove(id);
}

// ─────────────────────────────────────────────────────────────
// 클라우드 동기화 (Supabase, 로그인 시에만 동작)
// ─────────────────────────────────────────────────────────────

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { "x-auth-token": token } : {}),
  };
}

/**
 * 프로젝트를 서버에 저장합니다 (백그라운드).
 * 실패해도 에러를 throw하지 않습니다 — 로컬 저장이 우선입니다.
 */
export async function syncProjectToCloud(project, token) {
  if (!token) return false;
  try {
    const res = await fetch("/api/projects", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(project),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 서버에서 프로젝트 목록(메타데이터)을 가져옵니다.
 * 실패 시 null 반환 → 호출자가 로컬 목록으로 폴백합니다.
 */
export async function loadProjectsFromCloud(token) {
  if (!token) return null;
  try {
    const res = await fetch("/api/projects", { headers: authHeaders(token) });
    if (!res.ok) return null;
    const { projects } = await res.json();
    return Array.isArray(projects) ? projects : null;
  } catch {
    return null;
  }
}

/**
 * 서버에서 단일 프로젝트 전체 데이터를 가져옵니다.
 */
export async function loadProjectFromCloud(id, token) {
  if (!token || !id) return null;
  try {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return null;
    const { project } = await res.json();
    return project || null;
  } catch {
    return null;
  }
}

/**
 * 서버에서 프로젝트를 삭제합니다.
 */
export async function deleteProjectFromCloud(id, token) {
  if (!token || !id) return false;
  try {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Fork (branch) ───────────────────────────────────────────────────────────

/**
 * 기존 프로젝트를 분기(fork)합니다.
 * 분기된 프로젝트는 parentId 필드로 원본을 참조합니다.
 */
export async function forkProject(original) {
  const forked = {
    ...original,
    id: Date.now().toString(),
    parentId: original.id,
    title: `[분기] ${original.title || "프로젝트"}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveProject(forked);
  return forked;
}

// ─── Version History ─────────────────────────────────────────────────────────

/**
 * 현재 프로젝트 스냅샷을 버전 히스토리에 저장합니다.
 * Supabase 미연동 시 아무것도 하지 않고 false를 반환합니다.
 */
export async function saveProjectVersion(projectId, snapshot, token) {
  if (!token || !projectId) return false;
  try {
    const res = await fetch("/api/projects/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-auth-token": token },
      body: JSON.stringify({ projectId, snapshot }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 특정 프로젝트의 저장된 버전 목록을 가져옵니다.
 */
export async function loadProjectVersions(projectId, token) {
  if (!token || !projectId) return [];
  try {
    const res = await fetch(`/api/projects/versions?projectId=${encodeURIComponent(projectId)}`, {
      headers: { "x-auth-token": token },
    });
    if (!res.ok) return [];
    const { versions } = await res.json();
    return Array.isArray(versions) ? versions : [];
  } catch {
    return [];
  }
}

/**
 * 특정 버전 ID의 전체 스냅샷(복원 데이터)을 서버에서 가져옵니다.
 */
export async function fetchVersionSnapshot(versionId, token) {
  if (!token || !versionId) return null;
  try {
    const res = await fetch(`/api/projects/versions?id=${encodeURIComponent(versionId)}`, {
      headers: { "x-auth-token": token },
    });
    if (!res.ok) return null;
    const { snapshot } = await res.json();
    return snapshot || null;
  } catch {
    return null;
  }
}

/**
 * 로컬 IndexedDB 프로젝트들을 서버에 일괄 업로드합니다.
 * 로그인 직후 한 번 호출 — 로컬 작업물을 클라우드에 보존합니다.
 */
export async function uploadLocalProjectsToCloud(token) {
  if (!token) return;
  try {
    const local = await loadProjects();
    if (!local.length) return;
    // 병렬 업로드 (최대 5개씩)
    for (let i = 0; i < local.length; i += 5) {
      await Promise.allSettled(
        local.slice(i, i + 5).map(p => syncProjectToCloud(p, token))
      );
    }
  } catch {
    // 무시 — 백그라운드 작업
  }
}
