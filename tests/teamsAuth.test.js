/**
 * /api/teams 접근 제어 회귀 테스트 (C-5)
 *
 * 예전에는 로그인만 되어 있으면 아무 teamId 로도 팀 전원의 이메일과
 * 미사용 초대 토큰을 조회할 수 있었고, 그 토큰으로 임의 가입이 가능했다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test-service-key";

const { issueToken } = await import("../api/auth/_jwt.js");
const { default: handler } = await import("../api/teams.js");

const TEAM_ID = "team_abc";
const ADMIN = "admin@team.com";
const MEMBER = "member@team.com";
const OUTSIDER = "outsider@evil.com";

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

/**
 * Supabase 흉내. hll_team_members 조회 시 ADMIN/MEMBER 만 역할을 갖는다.
 * @param {object} opts.invite  초대 행 (accept 테스트용)
 */
function mockSupabase({ invite = null } = {}) {
  const writes = [];
  global.fetch = vi.fn((url, opts = {}) => {
    const method = opts.method || "GET";
    const ok = (data) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });

    if (method === "POST") { writes.push({ url, body: opts.body ? JSON.parse(opts.body) : null }); return ok([]); }
    if (method === "PATCH") return ok([]);

    // 역할 조회
    if (url.includes("hll_team_members") && url.includes("select=role")) {
      if (url.includes(encodeURIComponent(ADMIN)))  return ok([{ role: "admin" }]);
      if (url.includes(encodeURIComponent(MEMBER))) return ok([{ role: "member" }]);
      return ok([]); // 비멤버
    }
    // 멤버 목록
    if (url.includes("hll_team_members")) return ok([{ email: ADMIN, role: "admin" }, { email: MEMBER, role: "member" }]);
    // 초대 목록 / 초대 조회
    if (url.includes("hll_team_invites")) return ok(invite ? [invite] : [{ id: 1, invited_email: MEMBER, token: "SECRET-TOKEN", expires_at: "2099-01-01" }]);
    if (url.includes("hll_teams")) return ok([{ id: TEAM_ID, monthly_limit: 500 }]);
    return ok([]);
  });
  return writes;
}

const membersReq = (email) => ({
  method: "GET",
  headers: { "x-auth-token": tokenFor(email) },
  query: { resource: "members", teamId: TEAM_ID },
});

describe("/api/teams 멤버 조회 접근 제어", () => {
  beforeEach(() => vi.clearAllMocks());

  it("팀 멤버가 아니면 403", async () => {
    mockSupabase();
    const res = makeRes();
    await handler(membersReq(OUTSIDER), res);
    expect(res.statusCode).toBe(403);
  });

  it("비멤버에게는 초대 토큰이 절대 노출되지 않는다", async () => {
    mockSupabase();
    const res = makeRes();
    await handler(membersReq(OUTSIDER), res);
    expect(JSON.stringify(res.payload ?? {})).not.toContain("SECRET-TOKEN");
  });

  it("일반 멤버는 멤버 목록은 보되 초대 토큰은 못 본다", async () => {
    mockSupabase();
    const res = makeRes();
    await handler(membersReq(MEMBER), res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.members.length).toBe(2);
    expect(res.payload.invites).toEqual([]);
    expect(JSON.stringify(res.payload)).not.toContain("SECRET-TOKEN");
  });

  it("관리자는 초대 토큰을 볼 수 있다", async () => {
    mockSupabase();
    const res = makeRes();
    await handler(membersReq(ADMIN), res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.invites[0].token).toBe("SECRET-TOKEN");
  });
});

describe("/api/teams 초대 수락", () => {
  beforeEach(() => vi.clearAllMocks());

  const acceptReq = (email) => ({
    method: "POST",
    headers: { "x-auth-token": tokenFor(email) },
    query: { resource: "members" },
    body: { teamId: TEAM_ID, action: "accept", inviteToken: "SECRET-TOKEN" },
  });

  it("남에게 발급된 초대는 수락할 수 없다", async () => {
    const writes = mockSupabase({
      invite: { team_id: TEAM_ID, invited_email: MEMBER, token: "SECRET-TOKEN", expires_at: "2099-01-01" },
    });
    const res = makeRes();
    await handler(acceptReq(OUTSIDER), res);

    expect(res.statusCode).toBe(403);
    expect(writes).toHaveLength(0);
  });

  it("본인에게 발급된 초대는 수락된다", async () => {
    mockSupabase({
      invite: { team_id: TEAM_ID, invited_email: MEMBER, token: "SECRET-TOKEN", expires_at: "2099-01-01" },
    });
    const res = makeRes();
    await handler(acceptReq(MEMBER), res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.ok).toBe(true);
  });

  it("수신자 지정 없는 초대(링크 초대)는 누구나 수락 가능하다", async () => {
    mockSupabase({
      invite: { team_id: TEAM_ID, invited_email: null, token: "SECRET-TOKEN", expires_at: "2099-01-01" },
    });
    const res = makeRes();
    await handler(acceptReq(OUTSIDER), res);

    expect(res.statusCode).toBe(200);
  });
});
