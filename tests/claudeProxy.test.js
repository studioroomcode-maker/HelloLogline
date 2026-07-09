/**
 * /api/claude 프록시 보안 회귀 테스트
 *
 * 출시 전 점검에서 발견된 3가지 결함이 다시 열리지 않도록 고정한다.
 *   C-1: 클라이언트가 보낸 _retry 로 크레딧 차감을 우회
 *   C-3: 임의의 model / max_tokens / _feature 지정
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/_redis.js", () => ({
  rcall: vi.fn(),
  getCredits: vi.fn(() => 100),
  deductCredits: vi.fn(() => 95),
  redisConfigured: vi.fn(() => true),
  checkRateLimit: vi.fn(() => ({ ok: true, remaining: 20, reset: 60 })),
  recordApiUsage: vi.fn(() => Promise.resolve(null)),
}));
vi.mock("../api/_sentry.js", () => ({ captureServerException: vi.fn() }));

process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

const { getCredits, deductCredits, checkRateLimit } = await import("../api/_redis.js");
const { issueToken } = await import("../api/auth/_jwt.js");
const { default: handler } = await import("../api/claude.js");

const TOKEN = issueToken({ id: "google_1", email: "user@test.com", provider: "google" });

function makeReq(body) {
  return { method: "POST", headers: { "x-auth-token": TOKEN }, socket: {}, query: {}, body };
}

function makeRes() {
  const res = {
    statusCode: 200,
    payload: undefined,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
    setHeader() {}, flushHeaders() {}, write() {}, end() {},
  };
  return res;
}

/** 정상 형태의 요청 본문 (필요한 필드만 덮어쓴다) */
function validBody(overrides = {}) {
  return {
    model: "claude-sonnet-4-6",
    max_tokens: 4500,
    messages: [{ role: "user", content: "안녕" }],
    _feature: "logline",
    ...overrides,
  };
}

function mockAnthropicOk() {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: [{ text: "{}" }], usage: { input_tokens: 10, output_tokens: 5 } }),
    })
  );
}

describe("/api/claude 보안 검증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ ok: true, remaining: 20, reset: 60 });
    getCredits.mockResolvedValue(100);
    mockAnthropicOk();
  });

  // ─── C-1: _retry 크레딧 우회 ──────────────────────────────────
  describe("C-1 — _retry 로 크레딧 차감을 우회할 수 없다", () => {
    it("_retry: true 를 보내도 유료 기능은 크레딧이 차감된다", async () => {
      getCredits.mockResolvedValue(100);
      const res = makeRes();
      await handler(makeReq(validBody({ _feature: "scenario", _retry: true })), res);

      expect(res.statusCode).toBe(200);
      expect(deductCredits).toHaveBeenCalledWith("user@test.com", 5);
    });

    it("_retry 없이도 동일하게 차감된다 (동작 일관성)", async () => {
      getCredits.mockResolvedValue(100);
      const res = makeRes();
      await handler(makeReq(validBody({ _feature: "scenario" })), res);

      expect(deductCredits).toHaveBeenCalledWith("user@test.com", 5);
    });

    it("_retry 필드는 Anthropic 요청 본문에 포함되지 않는다", async () => {
      getCredits.mockResolvedValue(100);
      await handler(makeReq(validBody({ _feature: "scenario", _retry: true })), makeRes());

      const sentBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(sentBody).not.toHaveProperty("_retry");
      expect(sentBody).not.toHaveProperty("_feature");
    });
  });

  // ─── C-3: 요청 본문 검증 ──────────────────────────────────────
  describe("C-3 — 임의의 모델/토큰/기능을 지정할 수 없다", () => {
    it("허용 목록에 없는 모델은 400", async () => {
      const res = makeRes();
      await handler(makeReq(validBody({ model: "claude-opus-4-8" })), res);

      expect(res.statusCode).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("model 이 없으면 400", async () => {
      const res = makeRes();
      const body = validBody();
      delete body.model;
      await handler(makeReq(body), res);

      expect(res.statusCode).toBe(400);
    });

    it("max_tokens 가 상한(16000)을 넘으면 400", async () => {
      const res = makeRes();
      await handler(makeReq(validBody({ max_tokens: 64000 })), res);

      expect(res.statusCode).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("max_tokens 가 숫자가 아니면 400", async () => {
      const res = makeRes();
      await handler(makeReq(validBody({ max_tokens: "많이" })), res);

      expect(res.statusCode).toBe(400);
    });

    it("알 수 없는 _feature 는 400", async () => {
      const res = makeRes();
      await handler(makeReq(validBody({ _feature: "무료로_다_주세요" })), res);

      expect(res.statusCode).toBe(400);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("정상 요청은 통과한다", async () => {
      const res = makeRes();
      await handler(makeReq(validBody()), res);

      expect(res.statusCode).toBe(200);
      expect(global.fetch).toHaveBeenCalledOnce();
    });
  });

  // ─── 0크레딧 기능 일일 상한 ───────────────────────────────────
  describe("0크레딧 기능도 일일 상한이 적용된다", () => {
    it("무료 기능 일일 한도를 넘기면 429", async () => {
      checkRateLimit.mockImplementation((key) =>
        key.startsWith("rl:free:") ? { ok: false, remaining: 0, reset: 3600 } : { ok: true, remaining: 20, reset: 60 }
      );
      const res = makeRes();
      await handler(makeReq(validBody({ _feature: "logline" })), res);

      expect(res.statusCode).toBe(429);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("유료 기능은 무료 일일 한도의 영향을 받지 않는다", async () => {
      getCredits.mockResolvedValue(100);
      checkRateLimit.mockImplementation((key) =>
        key.startsWith("rl:free:") ? { ok: false, remaining: 0, reset: 3600 } : { ok: true, remaining: 20, reset: 60 }
      );
      const res = makeRes();
      await handler(makeReq(validBody({ _feature: "synopsis" })), res);

      expect(res.statusCode).toBe(200);
    });
  });

  // ─── 인증 ─────────────────────────────────────────────────────
  it("토큰이 없으면 401", async () => {
    const res = makeRes();
    await handler({ method: "POST", headers: {}, socket: {}, query: {}, body: validBody() }, res);
    expect(res.statusCode).toBe(401);
  });
});
