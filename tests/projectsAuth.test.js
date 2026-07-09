/**
 * /api/projects 소유권 검증 회귀 테스트 (C-4)
 *
 * merge-duplicates 업서트는 기존 행의 user_email 까지 덮어쓴다.
 * 소유권 확인이 없으면 남의 프로젝트 id 로 PUT 하는 것만으로 소유권을 빼앗을 수 있다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test-service-key";

const { issueToken } = await import("../api/auth/_jwt.js");
const { default: handler } = await import("../api/projects.js");

const VICTIM = "victim@test.com";
const ATTACKER = "attacker@test.com";
const PROJECT_ID = "1751000000000"; // 예전 방식(타임스탬프)으로 만들어진 피해자 프로젝트

function tokenFor(email) {
  return issueToken({ id: `google_${email}`, email, provider: "google" });
}

function makeRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
    end() { return this; },
  };
}

/** Supabase REST 를 흉내낸다. select=user_email 조회에는 피해자 소유로 응답. */
function mockSupabase() {
  const writes = [];
  global.fetch = vi.fn((url, opts = {}) => {
    const method = opts.method || "GET";
    if (method === "GET" && url.includes("select=user_email")) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve([{ user_email: VICTIM }]),
      });
    }
    if (method === "POST") writes.push({ url, body: JSON.parse(opts.body) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  });
  return writes;
}

describe("/api/projects 소유권 검증", () => {
  beforeEach(() => vi.clearAllMocks());

  it("남의 프로젝트 id 로 PUT 하면 403 이고 저장되지 않는다", async () => {
    const writes = mockSupabase();
    const res = makeRes();

    await handler({
      method: "PUT",
      headers: { "x-auth-token": tokenFor(ATTACKER) },
      query: {},
      body: { id: PROJECT_ID, title: "탈취됨", logline: "", genre: "" },
    }, res);

    expect(res.statusCode).toBe(403);
    expect(writes).toHaveLength(0);
  });

  it("본인 프로젝트는 정상 저장된다", async () => {
    const writes = mockSupabase();
    const res = makeRes();

    await handler({
      method: "PUT",
      headers: { "x-auth-token": tokenFor(VICTIM) },
      query: {},
      body: { id: PROJECT_ID, title: "내 프로젝트", logline: "", genre: "" },
    }, res);

    expect(res.statusCode).toBe(200);
    expect(writes).toHaveLength(1);
    expect(writes[0].body.user_email).toBe(VICTIM);
  });

  it("새 프로젝트(기존 행 없음)는 정상 생성된다", async () => {
    const writes = [];
    global.fetch = vi.fn((url, opts = {}) => {
      const method = opts.method || "GET";
      if (method === "GET" && url.includes("select=user_email")) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      }
      if (method === "POST") writes.push({ url, body: JSON.parse(opts.body) });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    });
    const res = makeRes();

    await handler({
      method: "PUT",
      headers: { "x-auth-token": tokenFor(ATTACKER) },
      query: {},
      body: { id: "b3f1c2d4-0000-4000-8000-000000000001", title: "새 프로젝트" },
    }, res);

    expect(res.statusCode).toBe(200);
    expect(writes[0].body.user_email).toBe(ATTACKER);
  });

  it("남의 프로젝트에 버전을 추가할 수 없다", async () => {
    const writes = mockSupabase();
    const res = makeRes();

    await handler({
      method: "POST",
      headers: { "x-auth-token": tokenFor(ATTACKER) },
      query: { resource: "versions" },
      body: { projectId: PROJECT_ID, snapshot: { title: "x" } },
    }, res);

    expect(res.statusCode).toBe(403);
    expect(writes).toHaveLength(0);
  });

  it("토큰이 없으면 401", async () => {
    mockSupabase();
    const res = makeRes();
    await handler({ method: "PUT", headers: {}, query: {}, body: { id: PROJECT_ID } }, res);
    expect(res.statusCode).toBe(401);
  });
});
