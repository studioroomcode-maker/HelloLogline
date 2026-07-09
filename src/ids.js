/**
 * 프로젝트 ID 생성.
 *
 * 타임스탬프만 쓰면 값이 추측 가능해 남의 프로젝트 id를 맞힐 수 있고,
 * 같은 밀리초에 생성된 두 프로젝트가 서로를 덮어쓴다.
 */
export function newProjectId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // crypto.randomUUID 미지원 브라우저(Safari < 15.4) 폴백
  const rand = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 65536).toString(16).padStart(4, "0")
  ).join("");
  return `${Date.now().toString(36)}-${rand}`;
}
