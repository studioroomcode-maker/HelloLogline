/**
 * 작가 멘탈 모델에 맞춘 작업 모드 정의.
 * 내부 Stage 시스템(1~9)은 그대로 유지하되 UI에서는 모드로 묶어 보여준다.
 *
 * DashboardView, SidebarLayout, MobileBottomNav, StagePageHeader가 공유.
 */

export const WORK_MODES = [
  {
    id: "discover",
    name: "발견하기",
    desc: "아이디어·로그라인·방향 탐색",
    color: "#C8A84B",
    stageIds: ["1"],
  },
  {
    id: "design",
    name: "설계하기",
    desc: "이야기 엔진·인물·구조 확정",
    color: "#A78BFA",
    stageIds: ["2", "3", "4"],
  },
  {
    id: "write",
    name: "쓰기",
    desc: "트리트먼트·비트시트·초고",
    color: "#4ECCA3",
    stageIds: ["5", "6"],
  },
  {
    id: "rewrite",
    name: "고치기",
    desc: "Coverage·진단·개고",
    color: "#FB923C",
    stageIds: ["7", "8"],
  },
  {
    id: "insight",
    name: "심화 분석",
    desc: "이론·신화·전문가 (선택)",
    color: "#45B7D1",
    stageIds: ["9"],
    optional: true,
  },
];

/**
 * 주어진 stageId가 속한 모드 객체를 반환. 없으면 null.
 */
export function findModeForStage(stageId) {
  if (!stageId) return null;
  return WORK_MODES.find((m) => m.stageIds.includes(String(stageId))) || null;
}
