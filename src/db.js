/**
 * IndexedDB wrapper for HelloLoglines project persistence.
 * Projects are stored with all analysis state so work survives browser refreshes.
 */

const DB_NAME = "hellologlines_v1";
const DB_VERSION = 1;
const STORE = "projects";

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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({
      ...project,
      updatedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load all projects, newest first (max 50). */
export async function loadProjects() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).index("updatedAt").getAll();
    req.onsuccess = () => resolve(req.result.reverse().slice(0, 50));
    req.onerror = () => reject(req.error);
  });
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
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
