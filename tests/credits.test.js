import { describe, it, expect, vi, beforeEach } from "vitest";

// Redis/DB 모듈 전체를 mock — 실제 네트워크 호출 없이 반환값만 제어
vi.mock("../api/_redis.js", () => ({
  rcall: vi.fn(),
  getCredits: vi.fn(),
  deductCredits: vi.fn(),
  addCreditsDb: vi.fn(),
  checkRateLimit: vi.fn(() => ({ ok: true, remaining: 20, reset: 60 })),
}));

import { getCredits, deductCredits, addCreditsDb } from "../api/_redis.js";

describe("크레딧 시스템", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── getCredits ────────────────────────────────────────────────
  describe("getCredits", () => {
    it("정상적으로 잔액을 반환한다", async () => {
      getCredits.mockResolvedValue(100);
      const result = await getCredits("user@test.com");
      expect(result).toBe(100);
    });

    it("잔액이 0인 경우 0을 반환한다", async () => {
      getCredits.mockResolvedValue(0);
      const result = await getCredits("user@test.com");
      expect(result).toBe(0);
    });

    it("DB/네트워크 오류 시 null을 반환한다", async () => {
      getCredits.mockResolvedValue(null);
      const result = await getCredits("user@test.com");
      expect(result).toBeNull();
    });

    it("이메일을 인자로 전달한다", async () => {
      getCredits.mockResolvedValue(50);
      await getCredits("specific@test.com");
      expect(getCredits).toHaveBeenCalledWith("specific@test.com");
    });
  });

  // ─── deductCredits ─────────────────────────────────────────────
  describe("deductCredits", () => {
    it("충분한 잔액에서 차감 성공 시 새 잔액을 반환한다", async () => {
      deductCredits.mockResolvedValue(95); // 100 - 5 = 95
      const result = await deductCredits("user@test.com", 5);
      expect(result).toBe(95);
    });

    it("잔액 부족 시 -1을 반환한다", async () => {
      deductCredits.mockResolvedValue(-1);
      const result = await deductCredits("user@test.com", 10);
      expect(result).toBe(-1);
    });

    it("잔액이 정확히 비용과 같으면 차감 성공한다 (경계값: 잔액==비용)", async () => {
      deductCredits.mockResolvedValue(0); // 5 - 5 = 0
      const result = await deductCredits("user@test.com", 5);
      expect(result).toBe(0);
    });

    it("잔액이 비용보다 1 부족하면 -1을 반환한다 (경계값: 잔액==비용-1)", async () => {
      deductCredits.mockResolvedValue(-1); // 잔액 4, 비용 5 → 실패
      const result = await deductCredits("user@test.com", 5);
      expect(result).toBe(-1);
    });

    it("비용이 0이면 차감 없이 현재 잔액을 반환한다", async () => {
      deductCredits.mockResolvedValue(100);
      const result = await deductCredits("user@test.com", 0);
      expect(result).toBe(100);
    });

    it("DB/네트워크 오류 시 null을 반환한다", async () => {
      deductCredits.mockResolvedValue(null);
      const result = await deductCredits("user@test.com", 1);
      expect(result).toBeNull();
    });

    it("이메일과 금액을 인자로 전달한다", async () => {
      deductCredits.mockResolvedValue(90);
      await deductCredits("user@test.com", 10);
      expect(deductCredits).toHaveBeenCalledWith("user@test.com", 10);
    });
  });

  // ─── addCreditsDb ──────────────────────────────────────────────
  describe("addCreditsDb", () => {
    it("크레딧 적립 후 새 잔액을 반환한다", async () => {
      addCreditsDb.mockResolvedValue(130); // 100 + 30 = 130
      const result = await addCreditsDb("user@test.com", 30);
      expect(result).toBe(130);
    });

    it("기존 잔액 0에 적립하면 적립 금액을 반환한다", async () => {
      addCreditsDb.mockResolvedValue(50);
      const result = await addCreditsDb("user@test.com", 50);
      expect(result).toBe(50);
    });

    it("DB/네트워크 오류 시 null을 반환한다", async () => {
      addCreditsDb.mockResolvedValue(null);
      const result = await addCreditsDb("user@test.com", 30);
      expect(result).toBeNull();
    });

    it("이메일과 금액을 인자로 전달한다", async () => {
      addCreditsDb.mockResolvedValue(130);
      await addCreditsDb("user@test.com", 30);
      expect(addCreditsDb).toHaveBeenCalledWith("user@test.com", 30);
    });
  });
});
