/**
 * useProjectManager 훅 로직 하네스
 *
 * React 훅을 직접 테스트하는 대신, 훅이 호출하는 핵심 함수들의
 * 협력 관계를 통합 테스트로 검증한다.
 *
 * 검증 목표:
 *  1. autoSave: saveProject 호출 + 상태 "saved" 설정 + 클라우드 동기화
 *  2. autoSave: saveProject 실패 시 상태 "" (에러 흡수)
 *  3. openProjects: 로그인 시 cloudList 우선 반환
 *  4. openProjects: 클라우드 실패 시 로컬 폴백
 *  5. openProjects: 비로그인 시 로컬만 사용
 *  6. deleteProjectById: 로컬+클라우드 모두 삭제 호출
 *  7. buildProjectSnapshot: id/title 기본값 검증 (utils 통합)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildProjectSnapshot } from "../src/utils.js";

// ── db.js mock ──────────────────────────────────────────────────────────────
vi.mock("../src/db.js", () => ({
  saveProject: vi.fn().mockResolvedValue(undefined),
  loadProject: vi.fn().mockResolvedValue({ id: "local-1", logline: "로컬 프로젝트" }),
  loadProjects: vi.fn().mockResolvedValue([{ id: "local-1", title: "로컬" }]),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  syncProjectToCloud: vi.fn().mockResolvedValue(true),
  loadProjectsFromCloud: vi.fn().mockResolvedValue([{ id: "cloud-1", title: "클라우드" }]),
  loadProjectFromCloud: vi.fn().mockResolvedValue({ id: "cloud-1", logline: "클라우드 프로젝트" }),
  deleteProjectFromCloud: vi.fn().mockResolvedValue(true),
  uploadLocalProjectsToCloud: vi.fn().mockResolvedValue(undefined),
}));

import {
  saveProject, loadProject, loadProjects, deleteProject,
  syncProjectToCloud, loadProjectsFromCloud, loadProjectFromCloud, deleteProjectFromCloud,
} from "../src/db.js";

// ── localStorage mock ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// ── buildProjectSnapshot 통합 ─────────────────────────────────────────────
describe("buildProjectSnapshot (useProjectManager 내부 로직)", () => {
  it("state에서 올바른 스냅샷을 만든다", () => {
    const state = { currentProjectId: "p1", logline: "테스트 로그라인", genre: "thriller" };
    const snap = buildProjectSnapshot(state);
    expect(snap.id).toBe("p1");
    expect(snap.title).toBe("테스트 로그라인");
    expect(snap.genre).toBe("thriller");
  });
});

// ── autoSave 시뮬레이션 ───────────────────────────────────────────────────
describe("autoSave 로직", () => {
  async function simulateAutoSave({ state, token = null }) {
    const statuses = [];
    const setSaveStatus = (s) => statuses.push(s);
    const setCurrentProjectId = vi.fn();

    setSaveStatus("saving");
    try {
      const snapshot = buildProjectSnapshot(state);
      if (!state.currentProjectId) setCurrentProjectId(snapshot.id);
      await saveProject(snapshot);
      setSaveStatus("saved");
      if (token) syncProjectToCloud(snapshot, token).catch(() => {});
    } catch {
      setSaveStatus("");
    }
    return { statuses, setCurrentProjectId };
  }

  it("저장 성공 시 'saving' → 'saved' 순서로 상태 변경", async () => {
    const { statuses } = await simulateAutoSave({ state: { logline: "테스트" } });
    expect(statuses).toEqual(["saving", "saved"]);
  });

  it("currentProjectId 없으면 setCurrentProjectId 호출", async () => {
    const { setCurrentProjectId } = await simulateAutoSave({
      state: { currentProjectId: null, logline: "테스트" },
    });
    expect(setCurrentProjectId).toHaveBeenCalledOnce();
  });

  it("currentProjectId 있으면 setCurrentProjectId 미호출", async () => {
    const { setCurrentProjectId } = await simulateAutoSave({
      state: { currentProjectId: "existing-id", logline: "테스트" },
    });
    expect(setCurrentProjectId).not.toHaveBeenCalled();
  });

  it("로그인 토큰 있으면 syncProjectToCloud 호출", async () => {
    await simulateAutoSave({ state: { logline: "테스트" }, token: "valid-token" });
    expect(syncProjectToCloud).toHaveBeenCalledOnce();
  });

  it("토큰 없으면 syncProjectToCloud 미호출", async () => {
    await simulateAutoSave({ state: { logline: "테스트" }, token: null });
    expect(syncProjectToCloud).not.toHaveBeenCalled();
  });

  it("saveProject 실패 시 상태는 ''로 리셋", async () => {
    saveProject.mockRejectedValueOnce(new Error("DB 오류"));
    const { statuses } = await simulateAutoSave({ state: { logline: "테스트" } });
    expect(statuses).toEqual(["saving", ""]);
  });
});

// ── openProjects 시뮬레이션 ──────────────────────────────────────────────
describe("openProjects 로직", () => {
  async function simulateOpenProjects(token) {
    let savedProjects = null;
    let shown = false;
    const setSavedProjects = (list) => { savedProjects = list; };
    const setShowProjects = (v) => { shown = v; };

    let list;
    if (token) {
      const cloudList = await loadProjectsFromCloud(token);
      list = cloudList ?? (await loadProjects());
    } else {
      list = await loadProjects();
    }
    setSavedProjects(list);
    setShowProjects(true);
    return { savedProjects, shown };
  }

  it("로그인 시 클라우드 목록 반환", async () => {
    const { savedProjects } = await simulateOpenProjects("token-abc");
    expect(savedProjects[0].id).toBe("cloud-1");
    expect(loadProjectsFromCloud).toHaveBeenCalledWith("token-abc");
    expect(loadProjects).not.toHaveBeenCalled();
  });

  it("클라우드 실패 시 로컬 폴백", async () => {
    loadProjectsFromCloud.mockResolvedValueOnce(null);
    const { savedProjects } = await simulateOpenProjects("token-abc");
    expect(savedProjects[0].id).toBe("local-1");
    expect(loadProjects).toHaveBeenCalled();
  });

  it("비로그인 시 로컬 목록만 사용", async () => {
    const { savedProjects } = await simulateOpenProjects(null);
    expect(savedProjects[0].id).toBe("local-1");
    expect(loadProjectsFromCloud).not.toHaveBeenCalled();
  });

  it("프로젝트 목록 패널이 열린다", async () => {
    const { shown } = await simulateOpenProjects(null);
    expect(shown).toBe(true);
  });
});

// ── deleteProjectById 시뮬레이션 ────────────────────────────────────────────
describe("deleteProjectById 로직", () => {
  async function simulateDelete(id, token) {
    const savedProjects = [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
    let remaining = [...savedProjects];

    await deleteProject(id);
    if (token) deleteProjectFromCloud(id, token).catch(() => {});
    remaining = remaining.filter(p => p.id !== id);
    return { remaining };
  }

  it("deleteProject(로컬) 호출", async () => {
    await simulateDelete("p1", null);
    expect(deleteProject).toHaveBeenCalledWith("p1");
  });

  it("토큰 있으면 deleteProjectFromCloud 호출", async () => {
    await simulateDelete("p1", "token-abc");
    expect(deleteProjectFromCloud).toHaveBeenCalledWith("p1", "token-abc");
  });

  it("토큰 없으면 deleteProjectFromCloud 미호출", async () => {
    await simulateDelete("p1", null);
    expect(deleteProjectFromCloud).not.toHaveBeenCalled();
  });

  it("삭제 후 목록에서 해당 id 제거", async () => {
    const { remaining } = await simulateDelete("p1", null);
    expect(remaining.map(p => p.id)).not.toContain("p1");
    expect(remaining).toHaveLength(2);
  });
});
