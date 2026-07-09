/**
 * 결제 크레딧 이중 적립 방지 테스트
 *
 * 예전 구조:
 *   api/credits.js 가 credits_added=0 으로 이벤트를 먼저 기록 → 적립 → 다시 기록.
 *   그 사이에 토스 웹훅이 도착하면 !existing?.credits_added 가 참이라 또 적립했다.
 *
 * 지금 구조:
 *   apply_payment_credits RPC 가 payment_key 잠금 안에서
 *   "이벤트 기록 + 적립"을 한 번에 처리한다. 두 번째 호출은 applied=false 를 받는다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/** apply_payment_credits 의 잠금 의미론을 흉내내는 인메모리 페이크 */
function makeLedger() {
  const events = new Map();   // payment_key → { credits_added }
  const balances = new Map(); // email → credits
  return {
    events, balances,
    apply({ paymentKey, email, credits }) {
      const prior = events.get(paymentKey);
      if (prior && prior.credits_added > 0) {
        return { applied: false, balance: balances.get(email) ?? 0 };
      }
      events.set(paymentKey, { credits_added: credits });
      const next = (balances.get(email) ?? 0) + credits;
      balances.set(email, next);
      return { applied: true, balance: next };
    },
  };
}

const ledger = makeLedger();

vi.mock("../api/_redis.js", () => ({
  getCredits: vi.fn(async (email) => ledger.balances.get(email) ?? 0),
  applyPaymentCredits: vi.fn(async (args) => ledger.apply(args)),
  getPaymentEvent: vi.fn(async (k) => ledger.events.get(k) ?? null),
  savePaymentEvent: vi.fn(async () => ({})),
  writeAuditLog: vi.fn(async () => null),
  getSubscription: vi.fn(async () => null),
  upsertSubscription: vi.fn(async () => null),
}));
vi.mock("../api/_sentry.js", () => ({ captureServerException: vi.fn() }));

process.env.TOSS_SECRET_KEY = "test_sk";
process.env.SUPABASE_URL = "https://t.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "k";

const { applyPaymentCredits } = await import("../api/_redis.js");
const { issueToken } = await import("../api/auth/_jwt.js");
const { default: creditsHandler } = await import("../api/credits.js");
const { default: webhookHandler } = await import("../api/webhooks/toss.js");

const EMAIL = "buyer@test.com";
const PAYMENT_KEY = "pk_test_001";
const ORDER_ID = "hll-c30-1751000000000"; // c30 → 30크레딧 / 3000원

function makeRes() {
  return {
    statusCode: 200, payload: undefined,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
  };
}

/** 토스 API 응답 흉내 (confirm / 조회 둘 다) */
function mockToss() {
  global.fetch = vi.fn((url) => {
    if (String(url).includes("/confirm")) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ status: "DONE", orderId: ORDER_ID, totalAmount: 3000 }) });
    }
    // GET /v1/payments/{paymentKey}
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ status: "DONE", orderId: ORDER_ID, totalAmount: 3000, customerEmail: EMAIL }) });
  });
}

const creditsReq = () => ({
  method: "POST",
  headers: { "x-auth-token": issueToken({ id: "google_1", email: EMAIL, provider: "google" }) },
  query: {},
  body: { paymentKey: PAYMENT_KEY, orderId: ORDER_ID, amount: 3000 },
});

const webhookReq = () => ({
  method: "POST",
  headers: {},
  body: { eventType: "PAYMENT_STATUS_CHANGED", data: { paymentKey: PAYMENT_KEY, orderId: ORDER_ID } },
});

describe("결제 이중 적립 방지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ledger.events.clear();
    ledger.balances.clear();
    mockToss();
  });

  it("결제 확인 1회 → 크레딧 30 적립", async () => {
    const res = makeRes();
    await creditsHandler(creditsReq(), res);

    expect(res.statusCode).toBe(200);
    expect(ledger.balances.get(EMAIL)).toBe(30);
  });

  it("결제 확인 후 웹훅이 도착해도 크레딧은 30 그대로", async () => {
    await creditsHandler(creditsReq(), makeRes());
    expect(ledger.balances.get(EMAIL)).toBe(30);

    const wres = makeRes();
    await webhookHandler(webhookReq(), wres);

    expect(wres.statusCode).toBe(200);
    expect(ledger.balances.get(EMAIL)).toBe(30); // ← 예전에는 60 이 됐다
  });

  it("웹훅이 먼저 도착하고 결제 확인이 뒤따라도 크레딧은 30", async () => {
    await webhookHandler(webhookReq(), makeRes());
    expect(ledger.balances.get(EMAIL)).toBe(30);

    const cres = makeRes();
    await creditsHandler(creditsReq(), cres);

    expect(cres.statusCode).toBe(200);
    expect(cres.payload.idempotent).toBe(true);
    expect(ledger.balances.get(EMAIL)).toBe(30);
  });

  it("웹훅이 여러 번 재시도해도 크레딧은 30", async () => {
    for (let i = 0; i < 5; i++) await webhookHandler(webhookReq(), makeRes());
    expect(ledger.balances.get(EMAIL)).toBe(30);
  });

  it("웹훅은 credits_added 를 0 으로 되돌리지 않는다", async () => {
    await creditsHandler(creditsReq(), makeRes());
    await webhookHandler(webhookReq(), makeRes());

    expect(ledger.events.get(PAYMENT_KEY).credits_added).toBe(30);
  });

  it("RPC 가 실패하면 웹훅은 500 을 반환해 토스가 재시도하게 한다", async () => {
    applyPaymentCredits.mockResolvedValueOnce(null);
    const res = makeRes();
    await webhookHandler(webhookReq(), res);

    expect(res.statusCode).toBe(500);
    expect(ledger.balances.get(EMAIL)).toBeUndefined();
  });

  it("RPC 가 실패하면 결제 확인은 자동 환불을 시도하고 500", async () => {
    applyPaymentCredits.mockResolvedValueOnce(null);
    const res = makeRes();
    await creditsHandler(creditsReq(), res);

    expect(res.statusCode).toBe(500);
    // /cancel 호출이 있었는지
    const cancelled = global.fetch.mock.calls.some(c => String(c[0]).includes("/cancel"));
    expect(cancelled).toBe(true);
    expect(ledger.balances.get(EMAIL)).toBeUndefined();
  });

  it("결제 금액이 패키지 가격과 다르면 적립하지 않는다", async () => {
    const res = makeRes();
    const req = creditsReq();
    req.body.amount = 100; // c30 은 3000원
    await creditsHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(ledger.balances.get(EMAIL)).toBeUndefined();
  });
});
