/**
 * 전제 단계 미완료 시 경고 토스트 헬퍼.
 *
 * 정책:
 * - 진입 잠금은 없음 (작가 워크플로우는 비선형).
 * - "큰 의존성"인 경우에만 토스트 발사 — 시놉시스 없이 트리트먼트, 초고 없이 Coverage 등.
 * - 같은 (target → prereq) 조합은 세션당 1회만 토스트 (피로함 방지).
 *
 * 부드러운 의존성(1→2, 2→3, 3→4, 4→9 등)은 silent.
 */

const STAGE_PREREQUISITES = {
  "2": "1", "3": "2", "4": "3",
  "5": "4", "6": "5", "7": "6", "8": "7",
  "9": "1",
};

// 전제 단계 미완료 시 작가에게 정말 알려야 하는 큰 의존성만.
// 키는 `${target}→${prereq}` 조합.
const STRONG_DEPENDENCIES = new Set([
  "5→4", // 트리트먼트는 시놉시스 없이 거의 의미 없음
  "6→5", // 초고는 비트시트/트리트먼트 없이 5축만으로는 약함
  "7→6", // Coverage는 초고 없이 무의미
  "8→7", // 고쳐쓰기는 진단(Coverage)이 우선
]);

const STAGE_LABEL = {
  "1": "로그라인",
  "2": "핵심 설계",
  "3": "캐릭터",
  "4": "시놉시스",
  "5": "트리트먼트",
  "6": "초고",
  "7": "Coverage",
  "8": "고쳐쓰기",
  "9": "Deep Analysis",
};

export { STAGE_PREREQUISITES };

/**
 * 진입 시점에 호출. 잠금 안 함, 큰 의존성에 한해 1회 토스트.
 * @param {string} targetStageId
 * @param {(stageId: string) => "done"|"active"|"idle"} getStageStatus
 * @param {(level: string, msg: string) => void} showToast
 */
export function maybeWarnPrereq(targetStageId, getStageStatus, showToast) {
  if (!targetStageId) return;
  const prereqId = STAGE_PREREQUISITES[targetStageId];
  if (!prereqId) return;
  if (getStageStatus(prereqId) === "done") return;

  const key = `${targetStageId}→${prereqId}`;
  if (!STRONG_DEPENDENCIES.has(key)) return; // 부드러운 의존성은 silent

  const sessionKey = `hll_prereq_warn_${key}`;
  let alreadyShown = false;
  try { alreadyShown = sessionStorage.getItem(sessionKey) === "1"; } catch {}
  if (alreadyShown) return;

  const targetLabel = STAGE_LABEL[targetStageId] || `Stage ${targetStageId}`;
  const prereqLabel = STAGE_LABEL[prereqId] || `Stage ${prereqId}`;
  showToast?.(
    "info",
    `${targetLabel} 단계는 ${prereqLabel} 결과를 강하게 참고합니다. ${prereqLabel} 없이 진행해도 되지만 정확도가 낮아질 수 있습니다.`
  );
  try { sessionStorage.setItem(sessionKey, "1"); } catch {}
}
