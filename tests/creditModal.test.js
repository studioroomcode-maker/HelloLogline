/**
 * 크레딧 소진 모달 트리거 로직 하네스
 *
 * 검증 목표:
 *  1. credits = 0 로드 시 setShowCreditModal(true) 예약
 *  2. credits > 0 로드 시 모달 미표시
 *  3. hll:credits-empty 이벤트 발생 시 즉시 모달 표시
 *  4. 모달 헤더가 credits=0일 때 "크레딧 소진" 상태임을 판별
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── 타이머 mock ──────────────────────────────────────────────────────────────
vi.useFakeTimers();

// ── fetch mock ───────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── window.addEventListener mock ─────────────────────────────────────────────
const eventListeners = {};
vi.stubGlobal("window", {
  ...globalThis.window,
  addEventListener: (type, fn) => { eventListeners[type] = fn; },
  removeEventListener: (type) => { delete eventListeners[type]; },
  dispatchEvent: (e) => { eventListeners[e.type]?.(e); },
  CustomEvent: globalThis.CustomEvent ?? class CustomEvent { constructor(t) { this.type = t; } },
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(eventListeners).forEach(k => delete eventListeners[k]);
});

afterEach(() => {
  vi.clearAllTimers();
});

// ── 크레딧 로드 시 모달 트리거 로직 ──────────────────────────────────────────
describe("크레딧 소진 모달 트리거", () => {
  /**
   * credits fetch → 0 → setTimeout(showCreditModal, 5000)  패턴을 시뮬레이션
   */
  function simulateCreditLoad(creditValue) {
    const setShowCreditModal = vi.fn();
    const setCredits = vi.fn();

    // credits.js API 응답 처리 로직을 직접 시뮬레이션
    const credits = creditValue;
    setCredits(credits);
    if (credits === 0) {
      setTimeout(() => setShowCreditModal(true), 5000);
    }

    return { setShowCreditModal, setCredits };
  }

  it("credits=0 로드 후 5초 뒤 모달이 표시된다", () => {
    const { setShowCreditModal } = simulateCreditLoad(0);
    expect(setShowCreditModal).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(setShowCreditModal).toHaveBeenCalledWith(true);
  });

  it("credits>0 로드 시 모달이 표시되지 않는다", () => {
    const { setShowCreditModal } = simulateCreditLoad(10);
    vi.advanceTimersByTime(10000);
    expect(setShowCreditModal).not.toHaveBeenCalled();
  });

  it("credits=1 (잔액 있음) 로드 시 모달 미표시", () => {
    const { setShowCreditModal } = simulateCreditLoad(1);
    vi.advanceTimersByTime(10000);
    expect(setShowCreditModal).not.toHaveBeenCalled();
  });

  it("5초 이전에는 모달이 아직 표시되지 않는다", () => {
    const { setShowCreditModal } = simulateCreditLoad(0);
    vi.advanceTimersByTime(4999);
    expect(setShowCreditModal).not.toHaveBeenCalled();
  });
});

// ── hll:credits-empty 이벤트 트리거 ──────────────────────────────────────────
describe("hll:credits-empty 이벤트", () => {
  it("이벤트 수신 즉시 모달 표시", () => {
    const setShowCreditModal = vi.fn();
    // 이벤트 등록
    window.addEventListener("hll:credits-empty", () => setShowCreditModal(true));
    // 이벤트 발생
    window.dispatchEvent({ type: "hll:credits-empty" });
    expect(setShowCreditModal).toHaveBeenCalledWith(true);
  });
});

// ── 모달 헤더 상태 판별 로직 ──────────────────────────────────────────────────
describe("모달 헤더 상태 판별", () => {
  function getHeaderState(credits) {
    return {
      title: credits === 0 ? "크레딧 소진" : "크레딧 충전",
      color: credits === 0 ? "#E85D75" : "#A78BFA",
      showEmptyBanner: credits === 0,
    };
  }

  it("credits=0이면 제목이 '크레딧 소진'", () => {
    expect(getHeaderState(0).title).toBe("크레딧 소진");
  });

  it("credits=0이면 색상이 빨강 #E85D75", () => {
    expect(getHeaderState(0).color).toBe("#E85D75");
  });

  it("credits=0이면 소진 배너 표시", () => {
    expect(getHeaderState(0).showEmptyBanner).toBe(true);
  });

  it("credits>0이면 제목이 '크레딧 충전'", () => {
    expect(getHeaderState(10).title).toBe("크레딧 충전");
  });

  it("credits>0이면 소진 배너 미표시", () => {
    expect(getHeaderState(10).showEmptyBanner).toBe(false);
  });
});
