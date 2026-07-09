/**
 * /api/share 인증 회귀 테스트 (H-3)
 *
 * 예전에는 POST 에 인증이 전혀 없어 누구나 무제한으로 DB 에 데이터를 밀어넣을 수 있었고,
 * Access-Control-Allow-Origin: * 라서 아무 사이트나 공유 데이터를 읽을 수 있었다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/_redis.js", () => ({
  checkRateLimit: vi.fn(() => ({ ok: true, remaining: 20, reset: 3600 })),
}));

process.env.SUPABASE_URL = "https://t.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "k";

const { checkRateLimit } = await import("../api/_redis.js");
const { issueToken } = await import("../api/auth/_jwt.js");
const { default: handler } = await import("../api/share.js");

const TOKEN = issueToken({ id: "google_1", email: "user@test.com", provider: "google" });

function makeRes() {
  const headers = {};
  return {
    statusCode: 200, payload: undefined, headers,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
    setHeader(k, v) { headers[k] = v; },
    end() { return this; },
  };
}

function mockSupabaseInsertOk() {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) }));
}

const postReq = (headers = {}) => ({
  method: "POST",
  headers,
  query: {},
  body: { logline: "테스트 로그라인", genre: "스릴러", data: { x: 1 } },
});

describe("POST /api/share 인증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ ok: true, remaining: 20, reset: 3600 });
    mockSupabaseInsertOk();
  });

  it("토큰이 없으면 401 이고 저장하지 않는다", async () => {
    const res = makeRes();
    await handler(postReq(), res);

    expect(res.statusCode).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("유효하지 않은 토큰은 401", async () => {
    const res = makeRes();
    await handler(postReq({ "x-auth-token": "garbage.token.value" }), res);

    expect(res.statusCode).toBe(401);
  });

  it("로그인한 사용자는 공유 링크를 만들 수 있다", async () => {
    const res = makeRes();
    await handler(postReq({ "x-auth-token": TOKEN }), res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.id).toBeTruthy();
  });

  it("공유 ID 는 추측하기 어려운 길이(24자 hex)다", async () => {
    const res = makeRes();
    await handler(postReq({ "x-auth-token": TOKEN }), res);

    expect(res.payload.id).toMatch(/^[a-f0-9]{24}$/);
  });

  it("사용자별 레이트리밋을 초과하면 429", async () => {
    checkRateLimit.mockResolvedValue({ ok: false, remaining: 0, reset: 3600 });
    const res = makeRes();
    await handler(postReq({ "x-auth-token": TOKEN }), res);

    expect(res.statusCode).toBe(429);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("응답에 Access-Control-Allow-Origin: * 가 없다", async () => {
    const res = makeRes();
    await handler(postReq({ "x-auth-token": TOKEN }), res);

    expect(res.headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});

describe("GET /api/share 는 인증 없이 조회 가능 (공유 링크의 목적)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true, status: 200,
      json: () => Promise.resolve([{ data: { x: 1 }, logline: "x", genre: "", created_at: 1, expires_at: Date.now() + 1e9 }]),
    }));
  });

  it("id 로 조회하면 200", async () => {
    const res = makeRes();
    await handler({ method: "GET", headers: {}, query: { id: "abc123" } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.logline).toBe("x");
  });
});
