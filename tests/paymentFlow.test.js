/**
 * 결제→크레딧 통합 플로우 하네스
 *
 * 검증 목표:
 *  1. 인증 없음 → 401
 *  2. 유효 결제 → TossPayments 확인 → 크레딧 적립 → 새 잔액 반환
 *  3. 금액 불일치 → 400 (변조 방어)
 *  4. 잘못된 packageKey → 400
 *  5. TossPayments API 오류 → 402
 *  6. TossPayments 네트워크 장애 → 500 (크레딧 미적립 보장)
 *  7. GET 잔액 조회 → 현재 크레딧 반환
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { issueToken } from "../api/auth/_jwt.js";

// ── Redis mock ──────────────────────────────────────────────────────────────
vi.mock("../api/_redis.js", () => ({
  rcall: vi.fn(),
  getCredits: vi.fn().mockResolvedValue(50),
  addCreditsDb: vi.fn().mockResolvedValue(80), // 50 + 30 = 80
  deductCredits: vi.fn(),
  checkRateLimit: vi.fn(() => ({ ok: true, remaining: 20, reset: 60 })),
  grantInitialCredits: vi.fn(),
  redisConfigured: vi.fn().mockReturnValue(true),
  getPaymentEvent: vi.fn().mockResolvedValue(null),
  savePaymentEvent: vi.fn().mockResolvedValue(null),
  writeAuditLog: vi.fn().mockResolvedValue(null),
}));

import { getCredits, addCreditsDb } from "../api/_redis.js";

// ── TossPayments fetch mock ─────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { default: handler } = await import("../api/credits.js");

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
const USER_EMAIL = "writer@hello.com";

function makeToken() {
  return issueToken({ email: USER_EMAIL });
}

function makeReq({ method = "POST", body = {}, token = makeToken() } = {}) {
  return {
    method,
    headers: { "x-auth-token": token },
    query: {},
    body,
  };
}

function makeRes() {
  const res = {
    _status: 200, _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
    end() { return this; },
  };
  return res;
}

function tossOk() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: "DONE", orderId: "hll-c30-123", totalAmount: 3000 }),
  });
}

function tossError(message = "결제 실패") {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message }),
  });
}

function tossNetworkFail() {
  mockFetch.mockRejectedValueOnce(new Error("Network error"));
}

beforeEach(() => {
  vi.clearAllMocks();
  getCredits.mockResolvedValue(50);
  addCreditsDb.mockResolvedValue(80);
});

describe("결제→크레딧 플로우", () => {
  // ── 인증 ───────────────────────────────────────────────────────────────────
  describe("인증", () => {
    it("토큰 없음 → 401", async () => {
      const req = makeReq({ token: null });
      req.headers = {};
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(401);
    });

    it("잘못된 토큰 → 401", async () => {
      const req = makeReq({ token: "invalid.token.here" });
      const res = makeRes();
      await handler(req, res);
      expect(res._status).toBe(401);
    });
  });

  // ── GET: 잔액 조회 ──────────────────────────────────────────────────────────
  describe("GET /api/credits", () => {
    it("잔액을 반환한다", async () => {
      getCredits.mockResolvedValueOnce(42);
      const res = makeRes();
      await handler(makeReq({ method: "GET" }), res);
      expect(res._status).toBe(200);
      expect(res._body?.credits).toBe(42);
    });

    it("DB 오류 시 0을 반환한다 (null → 0)", async () => {
      getCredits.mockResolvedValueOnce(null);
      const res = makeRes();
      await handler(makeReq({ method: "GET" }), res);
      expect(res._body?.credits).toBe(0);
    });
  });

  // ── POST: 결제 확인 ─────────────────────────────────────────────────────────
  describe("POST /api/credits — 정상 결제", () => {
    it("c30 패키지(3000원) → TossPayments 확인 → 30크레딧 적립", async () => {
      tossOk();
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c30-1700000000", amount: 3000 },
      }), res);
      expect(res._status).toBe(200);
      expect(res._body?.success).toBe(true);
      expect(res._body?.credits_added).toBe(30);
      expect(addCreditsDb).toHaveBeenCalledWith(USER_EMAIL, 30);
    });

    it("c70 패키지(7000원) → 70크레딧 적립", async () => {
      tossOk();
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c70-1700000000", amount: 7000 },
      }), res);
      expect(res._body?.credits_added).toBe(70);
      expect(addCreditsDb).toHaveBeenCalledWith(USER_EMAIL, 70);
    });

    it("c230 패키지(20000원) → 230크레딧 적립", async () => {
      tossOk();
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c230-1700000000", amount: 20000 },
      }), res);
      expect(res._body?.credits_added).toBe(230);
    });

    it("c400 패키지(35000원) → 400크레딧 적립", async () => {
      tossOk();
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c400-1700000000", amount: 35000 },
      }), res);
      expect(res._body?.credits_added).toBe(400);
    });

    it("적립 후 new_balance를 반환한다", async () => {
      tossOk();
      addCreditsDb.mockResolvedValueOnce(80);
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c30-1700000000", amount: 3000 },
      }), res);
      expect(res._body?.new_balance).toBe(80);
    });
  });

  // ── 변조 방어 ───────────────────────────────────────────────────────────────
  describe("변조 방어", () => {
    it("금액 변조(3000원짜리를 1원으로) → 400", async () => {
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c30-123", amount: 1 },
      }), res);
      expect(res._status).toBe(400);
      expect(addCreditsDb).not.toHaveBeenCalled();
    });

    it("잘못된 packageKey → 400", async () => {
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c999-123", amount: 9999 },
      }), res);
      expect(res._status).toBe(400);
      expect(addCreditsDb).not.toHaveBeenCalled();
    });

    it("필수 파라미터 누락 → 400", async () => {
      const res = makeRes();
      await handler(makeReq({ body: { paymentKey: "pk_test_123" } }), res);
      expect(res._status).toBe(400);
    });
  });

  // ── TossPayments 장애 ────────────────────────────────────────────────────────
  describe("TossPayments 장애", () => {
    it("TossPayments API 오류 응답 → 402, 크레딧 미적립", async () => {
      tossError("카드 한도 초과");
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c30-123", amount: 3000 },
      }), res);
      expect(res._status).toBe(402);
      expect(addCreditsDb).not.toHaveBeenCalled();
    });

    it("TossPayments 네트워크 장애 → 500, 크레딧 미적립", async () => {
      tossNetworkFail();
      const res = makeRes();
      await handler(makeReq({
        body: { paymentKey: "pk_test_123", orderId: "hll-c30-123", amount: 3000 },
      }), res);
      expect(res._status).toBe(500);
      expect(addCreditsDb).not.toHaveBeenCalled();
    });
  });
});
