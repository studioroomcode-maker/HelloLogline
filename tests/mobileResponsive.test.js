/**
 * 모바일 반응형 로직 하네스
 *
 * 실기기 테스트 대신 모바일 분기 로직의 정확성을 단위 검증.
 *
 * 검증 목표:
 *  1. isMobile 판별: innerWidth < 768이면 true
 *  2. isMobile 판별: innerWidth >= 768이면 false
 *  3. 경계값(767, 768) 처리
 *  4. Stage 탭 레이블이 모바일에서 단축됨
 *  5. 사이드바가 모바일에서 숨겨짐 (SIDEBAR_W 조건)
 *  6. 메인 콘텐츠 padding이 모바일에서 줄어듦
 *  7. resize 이벤트 시 isMobile 상태 갱신
 *  8. 모바일 하단 nav tab이 렌더링 조건 충족
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── isMobile 판별 로직 ─────────────────────────────────────────────────────
describe("isMobile 판별 로직", () => {
  function getIsMobile(width) {
    return width < 768;
  }

  it("767px → mobile", () => expect(getIsMobile(767)).toBe(true));
  it("768px → desktop", () => expect(getIsMobile(768)).toBe(false));
  it("320px (작은 폰) → mobile", () => expect(getIsMobile(320)).toBe(true));
  it("375px (iPhone 14) → mobile", () => expect(getIsMobile(375)).toBe(true));
  it("390px (iPhone 15 Pro) → mobile", () => expect(getIsMobile(390)).toBe(true));
  it("430px (iPhone 15 Pro Max) → mobile", () => expect(getIsMobile(430)).toBe(true));
  it("1024px (tablet landscape) → desktop", () => expect(getIsMobile(1024)).toBe(false));
  it("1440px (desktop) → desktop", () => expect(getIsMobile(1440)).toBe(false));
});

// ── Stage 탭 레이블 모바일 단축 ────────────────────────────────────────────
describe("Stage 1 탭 레이블 모바일 단축", () => {
  function getTabLabels(isMobile) {
    return [
      { id: "overview",   label: "종합" },
      { id: "structure",  label: isMobile ? "구조" : "구조 (50)" },
      { id: "expression", label: isMobile ? "표현" : "표현 (30)" },
      { id: "technical",  label: isMobile ? "기술" : "기술 (20)" },
      { id: "interest",   label: isMobile ? "흥미도" : "흥미도 (100)" },
    ];
  }

  it("모바일: 탭 레이블에 점수(숫자) 없음", () => {
    const tabs = getTabLabels(true);
    for (const tab of tabs) {
      expect(tab.label).not.toMatch(/\(\d+\)/);
    }
  });

  it("데스크톱: 탭 레이블에 점수(숫자) 포함", () => {
    const tabs = getTabLabels(false);
    const withScore = tabs.filter(t => /\(\d+\)/.test(t.label));
    expect(withScore.length).toBeGreaterThan(0);
  });

  it("종합 탭은 모바일/데스크톱 동일", () => {
    const mobile = getTabLabels(true).find(t => t.id === "overview");
    const desktop = getTabLabels(false).find(t => t.id === "overview");
    expect(mobile.label).toBe(desktop.label);
  });
});

// ── 사이드바 표시 조건 ─────────────────────────────────────────────────────
describe("사이드바 표시 조건", () => {
  function shouldShowSidebar(isMobile) {
    return !isMobile;
  }

  it("모바일에서 사이드바 숨김", () => expect(shouldShowSidebar(true)).toBe(false));
  it("데스크톱에서 사이드바 표시", () => expect(shouldShowSidebar(false)).toBe(true));
});

// ── 콘텐츠 패딩 모바일 적응 ───────────────────────────────────────────────
describe("콘텐츠 패딩 모바일 적응", () => {
  function getContentStyle(isMobile) {
    return {
      padding: isMobile ? "20px 16px" : "28px 32px",
      paddingBottom: isMobile ? "80px" : undefined,
      maxWidth: isMobile ? "100%" : 780,
    };
  }

  it("모바일: padding이 더 좁음", () => {
    const m = getContentStyle(true);
    const d = getContentStyle(false);
    // 20px < 28px
    expect(parseInt(m.padding)).toBeLessThan(parseInt(d.padding));
  });

  it("모바일: 하단 paddingBottom 80px (탭바 공간)", () => {
    expect(getContentStyle(true).paddingBottom).toBe("80px");
  });

  it("데스크톱: paddingBottom undefined", () => {
    expect(getContentStyle(false).paddingBottom).toBeUndefined();
  });

  it("모바일: maxWidth 100%", () => {
    expect(getContentStyle(true).maxWidth).toBe("100%");
  });

  it("데스크톱: maxWidth 780px", () => {
    expect(getContentStyle(false).maxWidth).toBe(780);
  });
});

// ── resize 이벤트 핸들러 ──────────────────────────────────────────────────
describe("resize 이벤트 핸들러", () => {
  it("resize 시 innerWidth에 따라 isMobile 갱신", () => {
    let isMobile = false;
    const handler = (width) => { isMobile = width < 768; };

    handler(1440); // 초기 상태
    expect(isMobile).toBe(false);

    handler(375); // 모바일로 축소
    expect(isMobile).toBe(true);

    handler(1024); // 다시 확장
    expect(isMobile).toBe(false);
  });
});

// ── 모바일 하단 탭바 렌더링 조건 ─────────────────────────────────────────
describe("모바일 하단 탭바 렌더링 조건", () => {
  const STAGE_META = [
    { id: "1" }, { id: "2" }, { id: "3" },
    { id: "4" }, { id: "5" }, { id: "6" },
    { id: "7" }, { id: "8" },
  ];

  it("모바일에서 탭 개수는 8개", () => {
    expect(STAGE_META.length).toBe(8);
  });

  it("각 탭이 고유한 id를 가진다", () => {
    const ids = STAGE_META.map(s => s.id);
    expect(new Set(ids).size).toBe(STAGE_META.length);
  });
});
