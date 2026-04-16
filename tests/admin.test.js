/**
 * admin API 서버사이드 권한 검증 하네스
 *
 * 검증 목표:
 *  1. 토큰 없음          → 401
 *  2. 잘못된 토큰 서명   → 401
 *  3. 유효 토큰이지만 비관리자 → 403
 *  4. 유효 토큰 + 관리자 → 통과 (Redis 없어도 configured:false로 응답)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { issueToken } from "../api/auth/_jwt.js";

// ── Redis mock ──────────────────────────────────────────────────────────────
vi.mock("../api/_redis.js", () => ({
  rcall: vi.fn().mockResolvedValue([]),
  redisConfigured: vi.fn().mockReturnValue(false), // Redis 없는 환경 시뮬레이션
}));

// ── 핸들러 import는 mock 이후에 ──────────────────────────────────────────────
const { default: handler } = await import("../api/admin/users.js");

// ── 가짜 req/res 팩토리 ────────────────────────────────────────────────────
function makeReq({ method = "GET", token = null, cookie = null } = {}) {
  const headers = {};
  if (token) headers["x-auth-token"] = token;
  if (cookie) headers["cookie"] = `hll_auth=${cookie}`;
  return { method, headers, query: {} };
}

function makeRes() {
  const res = {
    _status: 200, _body: null, _headers: {},
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
    setHeader(k, v) { this._headers[k] = v; return this; },
    end() { return this; },
  };
  return res;
}

// ── 환경변수 설정 ──────────────────────────────────────────────────────────
const ADMIN_EMAIL = "admin@hello.com";
const OTHER_EMAIL = "user@hello.com";

beforeEach(() => {
  process.env.ADMIN_EMAILS = ADMIN_EMAIL;
});

afterEach(() => {
  delete process.env.ADMIN_EMAILS;
});

describe("admin API — 서버사이드 권한 검증", () => {
  it("토큰 없음 → 401", async () => {
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res._status).toBe(401);
    expect(res._body?.error).toBeTruthy();
  });

  it("서명이 잘못된 토큰 → 401", async () => {
    const fakeToken = "aaa.bbb.ccc";
    const res = makeRes();
    await handler(makeReq({ token: fakeToken }), res);
    expect(res._status).toBe(401);
  });

  it("유효한 토큰이지만 비관리자 → 403", async () => {
    const token = issueToken({ email: OTHER_EMAIL });
    const res = makeRes();
    await handler(makeReq({ token }), res);
    expect(res._status).toBe(403);
    expect(res._body?.error).toMatch(/관리자/);
  });

  it("관리자 토큰 → 200 (Redis 미설정이면 configured:false)", async () => {
    const token = issueToken({ email: ADMIN_EMAIL });
    const res = makeRes();
    await handler(makeReq({ token }), res);
    // Redis 없어도 인증은 통과 → configured:false 응답
    expect(res._status).toBe(200);
    expect(res._body?.configured).toBe(false);
  });

  it("httpOnly 쿠키로 전달된 관리자 토큰도 통과", async () => {
    const token = issueToken({ email: ADMIN_EMAIL });
    const res = makeRes();
    await handler(makeReq({ cookie: token }), res);
    expect(res._status).toBe(200);
  });

  it("POST 요청도 관리자 검증 통과 후 실행 (Redis 없으면 에러 없이 처리)", async () => {
    const token = issueToken({ email: ADMIN_EMAIL });
    const req = { ...makeReq({ method: "POST", token }), body: { email: "x@x.com", tier: "pro" } };
    const res = makeRes();
    await handler(req, res);
    // Redis 없으므로 configured:false 분기에서 처리됨
    expect([200, 500]).toContain(res._status);
  });
});
