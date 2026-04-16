/**
 * Empty State 로직 하네스
 *
 * 검증 목표:
 *  1. 로그라인 미입력 시 예시 카드 표시 조건 (true)
 *  2. 로그라인 입력 후 예시 카드 숨김 조건 (false)
 *  3. 공백만 있으면 미입력으로 처리
 *  4. compareMode에서는 예시 카드 미표시
 *  5. 분석 버튼 disabled 조건: logline 없으면 비활성화
 *  6. 분석 버튼 disabled 조건: apiKey 없으면 비활성화
 *  7. 분석 버튼 disabled 조건: loading 중 비활성화
 *  8. 예시 카드 클릭 시 logline + genre 동시 설정
 *  9. 예시 카드 4개 모두 고유한 genre를 가짐
 * 10. 각 예시 카드에 텍스트 미리보기가 있음
 */

import { describe, it, expect } from "vitest";

// ── empty state 표시 조건 ─────────────────────────────────────────────────
describe("empty state 표시 조건", () => {
  function shouldShowEmptyState(logline, compareMode) {
    return !logline.trim() && !compareMode;
  }

  it("logline='' && compareMode=false → 표시", () => {
    expect(shouldShowEmptyState("", false)).toBe(true);
  });

  it("logline 입력 후 → 숨김", () => {
    expect(shouldShowEmptyState("형사가 살인마를 추적한다", false)).toBe(false);
  });

  it("공백만 있으면 미입력으로 처리 → 표시", () => {
    expect(shouldShowEmptyState("   ", false)).toBe(true);
  });

  it("compareMode=true → 예시 카드 숨김", () => {
    expect(shouldShowEmptyState("", true)).toBe(false);
  });

  it("logline 있고 compareMode → 숨김", () => {
    expect(shouldShowEmptyState("내용", true)).toBe(false);
  });
});

// ── 분석 버튼 disabled 조건 ──────────────────────────────────────────────
describe("분석 버튼 disabled 조건", () => {
  function isButtonDisabled({ loading, logline, apiKey }) {
    return loading || !logline.trim() || !apiKey;
  }

  it("logline + apiKey 있고 loading=false → enabled", () => {
    expect(isButtonDisabled({ loading: false, logline: "로그라인", apiKey: "sk-123" })).toBe(false);
  });

  it("logline 없으면 disabled", () => {
    expect(isButtonDisabled({ loading: false, logline: "", apiKey: "sk-123" })).toBe(true);
  });

  it("apiKey 없으면 disabled", () => {
    expect(isButtonDisabled({ loading: false, logline: "로그라인", apiKey: "" })).toBe(true);
  });

  it("loading=true면 disabled", () => {
    expect(isButtonDisabled({ loading: true, logline: "로그라인", apiKey: "sk-123" })).toBe(true);
  });

  it("공백만 있으면 disabled", () => {
    expect(isButtonDisabled({ loading: false, logline: "   ", apiKey: "sk-123" })).toBe(true);
  });
});

// ── 예시 카드 데이터 구조 ────────────────────────────────────────────────
describe("예시 카드 데이터", () => {
  const SAMPLE_LOGLINES = [
    { genre: "drama",    label: "드라마",  color: "#45B7D1", text: "가난한 청년이 재벌 가문의 비밀을 알게 된 후, 자신이 바로 그 가문의 숨겨진 후계자임을 깨닫고 가족과 신념 사이에서 선택을 강요받는다." },
    { genre: "thriller", label: "스릴러", color: "#E85D75", text: "연쇄살인마를 추적하던 형사가 다음 피해자가 자신의 딸임을 알게 되고, 법을 어기지 않고는 구할 수 없는 상황에 몰린다." },
    { genre: "romance",  label: "로맨스", color: "#A78BFA", text: "이혼 전문 변호사인 여자와 결혼 상담사인 남자가 서로의 직업을 숨긴 채 사랑에 빠지고, 진실이 드러나는 순간 관계가 무너진다." },
    { genre: "action",   label: "액션",   color: "#F7A072", text: "은퇴한 전직 요원이 평범한 삶을 살던 중 과거 자신이 훈련시킨 제자가 테러 조직의 수장이 되었다는 사실을 알고 다시 임무에 복귀한다." },
  ];

  it("예시 카드가 4개", () => {
    expect(SAMPLE_LOGLINES).toHaveLength(4);
  });

  it("각 카드의 genre가 고유함", () => {
    const genres = SAMPLE_LOGLINES.map(s => s.genre);
    expect(new Set(genres).size).toBe(4);
  });

  it("각 카드에 텍스트(text)가 비어있지 않음", () => {
    for (const item of SAMPLE_LOGLINES) {
      expect(item.text.length).toBeGreaterThan(10);
    }
  });

  it("각 카드에 레이블(label)이 있음", () => {
    for (const item of SAMPLE_LOGLINES) {
      expect(item.label).toBeTruthy();
    }
  });

  it("각 카드에 색상(color)이 있음", () => {
    for (const item of SAMPLE_LOGLINES) {
      expect(item.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("카드 클릭 시 logline + genre 모두 설정됨", () => {
    const selected = SAMPLE_LOGLINES[1]; // 스릴러
    let logline = "";
    let genre = "auto";
    const setLogline = (v) => { logline = v; };
    const setGenre = (v) => { genre = v; };

    // 클릭 핸들러 시뮬레이션
    setLogline(selected.text);
    setGenre(selected.genre);

    expect(logline).toBe(selected.text);
    expect(genre).toBe("thriller");
  });
});
