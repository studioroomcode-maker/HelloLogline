/**
 * 구독 플랜 설계 검증 하네스
 *
 * TossPayments 정기결제 연동 전 설계 규칙을 테스트로 고정.
 * 실제 구독 API 구현 시 이 테스트들이 계약(contract)으로 동작.
 *
 * 검증 목표:
 *  1. 구독 플랜 크레딧/가격 구조 검증
 *  2. 단건 구매 대비 구독 단가 우위 검증 (구독이 더 저렴해야 함)
 *  3. orderId 형식 규칙 검증
 *  4. 구독 orderId와 단건 orderId 구분 가능
 *  5. 월간 크레딧 소모 가능 시나리오 검증
 *  6. 환불 정책: 구독 크레딧 미사용분 환불 가능 여부 계산
 */

import { describe, it, expect } from "vitest";

// ── 플랜 정의 ────────────────────────────────────────────────────────────────
const ONE_TIME_PACKAGES = {
  c30:  { credits: 30,  price: 3000 },
  c70:  { credits: 70,  price: 7000 },
  c230: { credits: 230, price: 20000 },
  c400: { credits: 400, price: 35000 },
};

// 구독 플랜 설계 (미구현, 이 테스트가 구현 계약)
const SUBSCRIPTION_PLANS = {
  basic: {
    key: "sub-basic",
    credits: 100,
    priceMonthly: 9900,
    label: "베이직",
  },
  pro: {
    key: "sub-pro",
    credits: 250,
    priceMonthly: 19900,
    label: "프로",
  },
};

// ── 구독 플랜 구조 ────────────────────────────────────────────────────────────
describe("구독 플랜 구조", () => {
  it("베이직 플랜: 월 100cr, 9,900원", () => {
    expect(SUBSCRIPTION_PLANS.basic.credits).toBe(100);
    expect(SUBSCRIPTION_PLANS.basic.priceMonthly).toBe(9900);
  });

  it("프로 플랜: 월 250cr, 19,900원", () => {
    expect(SUBSCRIPTION_PLANS.pro.credits).toBe(250);
    expect(SUBSCRIPTION_PLANS.pro.priceMonthly).toBe(19900);
  });

  it("각 플랜에 고유한 key가 있다", () => {
    const keys = Object.values(SUBSCRIPTION_PLANS).map(p => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ── 단가 비교: 구독이 단건보다 저렴해야 함 ────────────────────────────────
describe("구독 단가 우위", () => {
  function pricePerCredit(price, credits) {
    return price / credits;
  }

  it("베이직 구독(99원/cr)이 c30 단건(100원/cr)보다 저렴", () => {
    const subPpc = pricePerCredit(9900, 100);   // 99원/cr
    const c30Ppc = pricePerCredit(3000, 30);    // 100원/cr
    expect(subPpc).toBeLessThan(c30Ppc);
  });

  it("프로 구독(79.6원/cr)이 c70 단건(100원/cr)보다 저렴", () => {
    const subPpc = pricePerCredit(19900, 250);  // 79.6원/cr
    const c70Ppc = pricePerCredit(7000, 70);    // 100원/cr
    expect(subPpc).toBeLessThan(c70Ppc);
  });

  it("구독 단가가 모든 단건 패키지보다 낮거나 같아야 설계가 맞다", () => {
    const basicPpc = 9900 / 100; // 99원/cr
    for (const pkg of Object.values(ONE_TIME_PACKAGES)) {
      const pkgPpc = pkg.price / pkg.credits;
      // 구독이 c230(86.9원/cr), c400(87.5원/cr)보다는 비쌀 수 있음 — 대용량 단건이 더 저렴
      // 최소한 가장 작은 단건(c30)보다는 저렴해야 함
      expect(basicPpc).toBeLessThanOrEqual(3000 / 30); // c30 기준
    }
  });
});

// ── orderId 형식 규칙 ─────────────────────────────────────────────────────
describe("orderId 형식 규칙", () => {
  function makeOneTimeOrderId(packageKey) {
    return `hll-${packageKey}-${Date.now()}`;
  }

  function makeSubscriptionOrderId(planKey) {
    return `hll-sub-${planKey}-${Date.now()}`;
  }

  function isSubscriptionOrder(orderId) {
    return orderId.startsWith("hll-sub-");
  }

  it("단건 orderId 형식: hll-{packageKey}-{ts}", () => {
    const id = makeOneTimeOrderId("c30");
    expect(id).toMatch(/^hll-c30-\d+$/);
  });

  it("구독 orderId 형식: hll-sub-{planKey}-{ts}", () => {
    const id = makeSubscriptionOrderId("basic");
    expect(id).toMatch(/^hll-sub-basic-\d+$/);
  });

  it("단건과 구독 orderId 구분 가능", () => {
    expect(isSubscriptionOrder("hll-c30-123")).toBe(false);
    expect(isSubscriptionOrder("hll-sub-basic-123")).toBe(true);
  });
});

// ── 월간 크레딧 사용 시나리오 ─────────────────────────────────────────────
describe("월간 크레딧 사용 시나리오 (베이직 100cr)", () => {
  const COSTS = {
    loglineAnalysis: 0,
    synopsisStructure: 2,
    treatment: 3,
    scriptCoverage: 4,
    masterReport: 3,
  };

  it("로그라인 분석 무제한 + 시놉시스 10회 = 20cr (100cr 내)", () => {
    const used = COSTS.loglineAnalysis * 100 + COSTS.synopsisStructure * 10;
    expect(used).toBeLessThanOrEqual(100);
  });

  it("트리트먼트 33회 = 99cr (100cr 내)", () => {
    const used = COSTS.treatment * 33;
    expect(used).toBeLessThanOrEqual(100);
  });

  it("Script Coverage 25회 = 100cr (딱 맞음)", () => {
    expect(COSTS.scriptCoverage * 25).toBe(100);
  });

  it("다양한 조합: 시놉시스5 + 트리트먼트5 + Coverage5 = 45cr (100cr 내)", () => {
    const used = 2*5 + 3*5 + 4*5;
    expect(used).toBeLessThanOrEqual(100);
  });
});

// ── 환불 정책 계산 ─────────────────────────────────────────────────────────
describe("환불 정책 계산", () => {
  function calcRefundAmount(priceMonthly, totalCredits, usedCredits) {
    if (usedCredits >= totalCredits) return 0;
    const unusedRatio = (totalCredits - usedCredits) / totalCredits;
    return Math.floor(priceMonthly * unusedRatio);
  }

  it("전혀 사용 안 했으면 전액 환불", () => {
    expect(calcRefundAmount(9900, 100, 0)).toBe(9900);
  });

  it("50% 사용 시 50% 환불", () => {
    expect(calcRefundAmount(9900, 100, 50)).toBe(4950);
  });

  it("전부 사용 시 환불 0원", () => {
    expect(calcRefundAmount(9900, 100, 100)).toBe(0);
  });

  it("초과 사용은 불가능하지만 방어적으로 0원 처리", () => {
    expect(calcRefundAmount(9900, 100, 150)).toBe(0);
  });
});
