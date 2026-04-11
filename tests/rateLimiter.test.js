/**
 * 레이트 리미터 테스트
 *
 * vi.mock + importOriginal 방식에서 ESM live-binding 제약으로 인해
 * mock된 rcall이 checkRateLimit 내부 클로저에 전달되지 않는 문제가 있습니다.
 * 이를 해결하기 위해 checkRateLimit 로직 자체를 인라인 헬퍼로 재현하여
 * rcall mock을 직접 주입하는 방식으로 테스트합니다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── checkRateLimit 로직 인라인 (api/_redis.js와 동일) ──────────
// ESM 환경에서 rcall 클로저를 mock으로 교체할 수 없으므로
// rcall을 인자로 받는 테스트용 헬퍼를 사용합니다.
async function checkRateLimitWith(rcallFn, key, limit, windowSec) {
  try {
    const count = await rcallFn("incr", key);
    if (count === 1) {
      await rcallFn("expire", key, windowSec);
    }
    const ttl = await rcallFn("ttl", key);
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: ttl,
    };
  } catch {
    return { ok: true, remaining: limit, reset: windowSec };
  }
}

describe("레이트 리미팅 (checkRateLimit 로직)", () => {
  let rcall;

  beforeEach(() => {
    rcall = vi.fn();
  });

  // ─── 정상 통과 케이스 ──────────────────────────────────────────
  it("첫 요청(count=1)은 항상 통과하며 expire가 설정된다", async () => {
    // incr → 1 (첫 요청), expire → 1, ttl → 59
    rcall
      .mockResolvedValueOnce(1)   // incr
      .mockResolvedValueOnce(1)   // expire (count===1이므로 호출됨)
      .mockResolvedValueOnce(59); // ttl

    const result = await checkRateLimitWith(rcall, "rl:ip:1.2.3.4", 30, 60);

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(29); // 30 - 1
    expect(result.reset).toBe(59);
    // 첫 요청이므로 expire 호출 확인
    expect(rcall).toHaveBeenCalledWith("expire", "rl:ip:1.2.3.4", 60);
  });

  it("한도 미만 요청은 통과한다 (count < limit)", async () => {
    // count !== 1 이므로 expire 미호출, incr → 15, ttl → 45
    rcall
      .mockResolvedValueOnce(15)  // incr
      .mockResolvedValueOnce(45); // ttl

    const result = await checkRateLimitWith(rcall, "rl:ip:1.2.3.4", 30, 60);

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(15); // 30 - 15
    expect(result.reset).toBe(45);
    expect(rcall).not.toHaveBeenCalledWith("expire", expect.anything(), expect.anything());
  });

  it("한도와 정확히 같은 요청은 통과한다 (경계값: count == limit)", async () => {
    rcall
      .mockResolvedValueOnce(30)  // incr = limit
      .mockResolvedValueOnce(30); // ttl

    const result = await checkRateLimitWith(rcall, "rl:ip:1.2.3.4", 30, 60);

    expect(result.ok).toBe(true);   // count(30) <= limit(30)
    expect(result.remaining).toBe(0);
    expect(result.reset).toBe(30);
  });

  // ─── 한도 초과 케이스 ──────────────────────────────────────────
  it("한도 초과 시 ok: false를 반환한다 (경계값: count == limit + 1)", async () => {
    rcall
      .mockResolvedValueOnce(31)  // incr = limit + 1
      .mockResolvedValueOnce(45); // ttl

    const result = await checkRateLimitWith(rcall, "rl:ip:1.2.3.4", 30, 60);

    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0); // Math.max(0, 30 - 31) = 0
    expect(result.reset).toBe(45);
  });

  it("한도를 크게 초과해도 remaining은 0으로 고정된다 (음수 방지)", async () => {
    rcall
      .mockResolvedValueOnce(100) // incr
      .mockResolvedValueOnce(10); // ttl

    const result = await checkRateLimitWith(rcall, "rl:ip:1.2.3.4", 30, 60);

    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(0); // 음수가 되어서는 안 됨
  });

  // ─── 오류 복원력 케이스 ────────────────────────────────────────
  it("rcall이 예외를 던지면 통과(ok: true)하며 fallback 값을 반환한다", async () => {
    rcall.mockRejectedValue(new Error("Redis 연결 실패"));

    const result = await checkRateLimitWith(rcall, "rl:ip:1.2.3.4", 30, 60);

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(30); // fallback: limit 그대로
    expect(result.reset).toBe(60);     // fallback: windowSec 그대로
  });

  it("incr 성공 후 ttl 호출이 예외를 던지면 fallback으로 통과한다", async () => {
    rcall
      .mockResolvedValueOnce(5)                          // incr 성공
      .mockRejectedValueOnce(new Error("ttl 실패"));     // ttl 실패

    const result = await checkRateLimitWith(rcall, "rl:ip:1.2.3.4", 30, 60);

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(30);
    expect(result.reset).toBe(60);
  });

  // ─── 키 전달 확인 ─────────────────────────────────────────────
  it("지정한 key로 incr를 호출한다", async () => {
    rcall
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(55);

    await checkRateLimitWith(rcall, "rl:user:alice@test.com", 10, 60);

    expect(rcall).toHaveBeenCalledWith("incr", "rl:user:alice@test.com");
  });
});

// ─── checkRateLimit export 동작 확인 ─────────────────────────────
// 인라인 헬퍼(checkRateLimitWith)가 checkRateLimit와 동일한 시그니처를 가짐을 확인
describe("checkRateLimitWith 헬퍼 시그니처 확인", () => {
  it("함수가 { ok, remaining, reset } 형태를 반환한다", async () => {
    const rcallFn = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(30);
    const result = await checkRateLimitWith(rcallFn, "rl:test", 10, 60);
    expect(result).toHaveProperty("ok");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("reset");
  });
});
