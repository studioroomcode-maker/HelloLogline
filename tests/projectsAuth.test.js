/**
 * /api/projects 쓰기 격리 테스트
 *
 * hll_projects 의 PK 는 (id, user_email) 복합키다 (프로덕션 DB에서 확인).
 * 따라서 merge-duplicates 업서트의 충돌 대상은 "id + 소유자" 쌍이고,
 * 남의 id 로 PUT 해도 남의 행에는 닿지 않는다.
 *
 * 이 테스트가 지키는 불변식:
 *   1. 업서트는 항상 호출자의 user_email 로 기록한다 (남의 소유자명을 쓰지 않는다)
 *   2. 충돌 대상이 on_conflict=id,user_email 로 명시되어 있다
 *      — 누군가 PK 를 id 단독으로 바꾸면 여기서 깨져야 한다
 *   3. 읽기/삭제는 user_email 로 필터링된다
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test-service-key";

const { issueToken } = await import("../api/auth/_jwt.js");
const { default: handler } = await import("../api/projects.js");

const VICTIM = "victim@test.com";
const ATTACKER = "attacker@test.com";
const PROJECT_ID = "1751000000000"; // 예전 방식(타임스탬프)으로 만들어진 피해자 프로젝트

const tokenFor = (email) => issueToken({ id: `google_${email}`, email, provider: "google" });

function makeRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
    end() { return this; },
  };
}

/** Supabase REST 호출을 가로채 기록한다. */
function mockSupabase() {
  const calls = [];
  global.fetch = vi.fn((url, opts = {}) => {
    calls.push({ url: String(url), method: opts.method || "GET", body: opts.body ? JSON.parse(opts.body) : null });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  });
  return calls;
}

describe("PUT /api/projects — 쓰기 격리", () => {
  beforeEach(() => vi.clearAllMocks());

  it("남의 프로젝트 id 로 PUT 해도 소유자는 호출자로 기록된다", async () => {
    const calls = mockSupabase();
    await handler({
      method: "PUT",
      headers: { "x-auth-token": tokenFor(ATTACKER) },
      query: {},
      body: { id: PROJECT_ID, title: "탈취 시도", logline: "", genre: "" },
    }, makeRes());

    const write = calls.find(c => c.method === "POST");
    expect(write.body.user_email).toBe(ATTACKER);
    expect(write.body.user_email).not.toBe(VICTIM);
  });

  it("업서트 충돌 대상이 (id, user_email) 로 명시되어 있다", async () => {
    const calls = mockSupabase();
    await handler({
      method: "PUT",
      headers: { "x-auth-token": tokenFor(VICTIM) },
      query: {},
      body: { id: PROJECT_ID, title: "내 프로젝트" },
    }, makeRes());

    const write = calls.find(c => c.method === "POST");
    // 이게 빠지면 PostgREST 가 PK 를 충돌 대상으로 쓴다.
    // PK 가 id 단독으로 바뀌는 순간 남의 행을 덮어쓰게 된다.
    expect(write.url).toContain("on_conflict=id,user_email");
  });

  it("정상 저장은 200 을 반환한다", async () => {
    mockSupabase();
    const res = makeRes();
    await handler({
      method: "PUT",
      headers: { "x-auth-token": tokenFor(VICTIM) },
      query: {},
      body: { id: PROJECT_ID, title: "내 프로젝트" },
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.ok).toBe(true);
  });

  it("id 가 없으면 400", async () => {
    mockSupabase();
    const res = makeRes();
    await handler({ method: "PUT", headers: { "x-auth-token": tokenFor(VICTIM) }, query: {}, body: { title: "x" } }, res);
    expect(res.statusCode).toBe(400);
  });
});

describe("읽기/삭제는 소유자로 필터링된다", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET 목록은 user_email 로 필터링한다", async () => {
    const calls = mockSupabase();
    await handler({ method: "GET", headers: { "x-auth-token": tokenFor(ATTACKER) }, query: {} }, makeRes());

    expect(calls[0].url).toContain(`user_email=eq.${encodeURIComponent(ATTACKER)}`);
  });

  it("GET 단건도 user_email 로 필터링한다 — 남의 프로젝트를 읽을 수 없다", async () => {
    const calls = mockSupabase();
    await handler({ method: "GET", headers: { "x-auth-token": tokenFor(ATTACKER) }, query: { id: PROJECT_ID } }, makeRes());

    expect(calls[0].url).toContain(`user_email=eq.${encodeURIComponent(ATTACKER)}`);
  });

  it("DELETE 도 user_email 로 필터링한다 — 남의 프로젝트를 지울 수 없다", async () => {
    const calls = mockSupabase();
    await handler({ method: "DELETE", headers: { "x-auth-token": tokenFor(ATTACKER) }, query: { id: PROJECT_ID } }, makeRes());

    const del = calls.find(c => c.method === "DELETE");
    expect(del.url).toContain(`user_email=eq.${encodeURIComponent(ATTACKER)}`);
  });
});

describe("버전 저장", () => {
  beforeEach(() => vi.clearAllMocks());

  it("버전 행은 항상 호출자 소유로 기록된다", async () => {
    const calls = mockSupabase();
    await handler({
      method: "POST",
      headers: { "x-auth-token": tokenFor(ATTACKER) },
      query: { resource: "versions" },
      body: { projectId: PROJECT_ID, snapshot: { title: "x" } },
    }, makeRes());

    const write = calls.find(c => c.method === "POST" && c.url.includes("hll_project_versions"));
    expect(write.body.user_email).toBe(ATTACKER);
  });

  it("버전 조회는 user_email 로 필터링한다", async () => {
    const calls = mockSupabase();
    await handler({
      method: "GET",
      headers: { "x-auth-token": tokenFor(ATTACKER) },
      query: { resource: "versions", projectId: PROJECT_ID },
    }, makeRes());

    expect(calls[0].url).toContain(`user_email=eq.${encodeURIComponent(ATTACKER)}`);
  });
});

describe("인증", () => {
  it("토큰이 없으면 401", async () => {
    mockSupabase();
    const res = makeRes();
    await handler({ method: "PUT", headers: {}, query: {}, body: { id: PROJECT_ID } }, res);
    expect(res.statusCode).toBe(401);
  });

  it("email 클레임이 없는 토큰은 401", async () => {
    mockSupabase();
    const res = makeRes();
    const noEmail = issueToken({ id: "kakao_1", provider: "kakao" });
    await handler({ method: "PUT", headers: { "x-auth-token": noEmail }, query: {}, body: { id: PROJECT_ID } }, res);
    expect(res.statusCode).toBe(401);
  });
});
