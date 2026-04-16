/**
 * useProjectManager
 *
 * logline-analyzer.jsx에서 프로젝트 저장/불러오기/삭제 로직을 분리.
 * autoSave, openProjects, loadProjectById, deleteProjectById,
 * loadProjectState를 이 훅으로 통합 관리한다.
 *
 * 사용법:
 *   const pm = useProjectManager({ state, setState });
 *   pm.autoSave()
 *   pm.openProjects()
 *   pm.loadProjectById(proj)
 *   pm.deleteProjectById(id)
 */

import { useCallback } from "react";
import { buildProjectSnapshot } from "../utils.js";
import {
  saveProject, loadProject, loadProjects, deleteProject,
  syncProjectToCloud, loadProjectsFromCloud,
  loadProjectFromCloud, deleteProjectFromCloud,
  uploadLocalProjectsToCloud,
} from "../db.js";

/**
 * @param {Object} params
 * @param {Function} params.collectState   — 현재 state 객체를 반환하는 함수 (모든 결과 필드 포함)
 * @param {Function} params.applyState     — loadProjectState에 해당. 프로젝트 데이터를 state에 적용
 * @param {Function} params.setSaveStatus  — "saving" | "saved" | "" 저장 상태 표시
 * @param {Function} params.setSavedProjects
 * @param {Function} params.setShowProjects
 * @param {Function} params.setCurrentProjectId
 */
export function useProjectManager({
  collectState,
  applyState,
  setSaveStatus,
  setSavedProjects,
  setShowProjects,
  setCurrentProjectId,
}) {
  /** 로컬 IndexedDB 저장 + 백그라운드 클라우드 동기화 */
  const autoSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const state = collectState();
      const snapshot = buildProjectSnapshot(state);
      if (!state.currentProjectId) setCurrentProjectId(snapshot.id);
      await saveProject(snapshot);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
      const token = localStorage.getItem("hll_auth_token");
      if (token) syncProjectToCloud(snapshot, token).catch(() => {});
    } catch (e) {
      console.error("자동 저장 실패:", e);
      setSaveStatus("");
    }
  }, [collectState, setSaveStatus, setCurrentProjectId]);

  /** 프로젝트 목록 열기 (로그인 시 클라우드 우선) */
  const openProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem("hll_auth_token");
      let list;
      if (token) {
        const cloudList = await loadProjectsFromCloud(token);
        list = cloudList ?? (await loadProjects());
      } else {
        list = await loadProjects();
      }
      setSavedProjects(list);
      setShowProjects(true);
    } catch (e) {
      console.error("프로젝트 목록 로드 실패:", e);
    }
  }, [setSavedProjects, setShowProjects]);

  /** 개별 프로젝트 불러오기 (클라우드 우선 → 로컬 폴백) */
  const loadProjectById = useCallback(async (proj) => {
    const token = localStorage.getItem("hll_auth_token");
    if (token) {
      const full = await loadProjectFromCloud(proj.id, token).catch(() => null);
      if (full) { applyState(full); return; }
    }
    const local = await loadProject(proj.id).catch(() => null);
    applyState(local || proj);
  }, [applyState]);

  /** 프로젝트 삭제 (로컬 + 클라우드) */
  const deleteProjectById = useCallback(async (id) => {
    await deleteProject(id);
    const token = localStorage.getItem("hll_auth_token");
    if (token) deleteProjectFromCloud(id, token).catch(() => {});
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  }, [setSavedProjects]);

  /** 로그인 직후 로컬 작업물 클라우드 일괄 업로드 */
  const uploadLocalOnLogin = useCallback((token) => {
    if (token) uploadLocalProjectsToCloud(token).catch(() => {});
  }, []);

  return { autoSave, openProjects, loadProjectById, deleteProjectById, uploadLocalOnLogin };
}
