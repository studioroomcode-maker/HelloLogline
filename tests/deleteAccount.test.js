/**
 * 회원 탈퇴 회귀 테스트
 *
 * 핵심 불변식:
 *   - 개인정보·창작물(projects, versions, api_usage, subscriptions, users)은 삭제한다
 *   - 결제·거래 기록(payment_events)과 감사 로그(audit_logs)는 전자상거래법상
 *     보존 의무가 있으므로 삭제하지 않는다
 *   - 삭제 사실 자체는 감사 로그에 남긴다
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const writeAuditLog = vi.fn(() => Promise.resolve(null));
const rcall = vi.fn(() => Promise.resolve(null));

// deleteUserData 는 실제 구현을 쓰고, 그 외 _redis export 는 가볍게 mock
vi.mock("../api/_redis.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, writeAuditLog, rcall };
});

process.env.SUPABASE_URL = "https://t.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "k";

const { issueToken } = await import("../api/auth/_jwt.js");
const { default: handler } = await import("../api/auth.js");

const EMAIL = "leaving@test.com";
const TOKEN = issueToken({ id: "google_1", email: EMAIL, provider: "google" });

function makeRes() {
  const headers = {};
  return {
    statusCode: 200, payload: undefined, headers,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
    setHeader(k, v) { headers[k] = v; },
    getHeader(k) { return headers[k]; },
    end() { return this; },
  };
}

/** Supabase DELETE 를 성공으로 응답하고, 호출된 경로를 기록한다 */
function mockSupabaseAllOk() {
  const deleted = [];
  global.fetch = vi.fn((url, opts = {}) => {
    if ((opts.method || "GET") === "DELETE") deleted.push(String(url));
    return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
  });
  return deleted;
}

const req = () => ({ method: "POST", headers: { "x-auth-token": TOKEN }, query: { action: "delete-account" } });

describe("POST /api/auth?action=delete-account", () => {
  beforeEach(() => vi.clearAllMocks());

  it("토큰이 없으면 401", async () => {
    mockSupabaseAllOk();
    const res = makeRes();
    await handler({ method: "POST", headers: {}, query: { action: "delete-account" } }, res);
    expect(res.statusCode).toBe(401);
  });

  it("GET 은 405", async () => {
    mockSupabaseAllOk();
    const res = makeRes();
    await handler({ method: "GET", headers: { "x-auth-token": TOKEN }, query: { action: "delete-account" } }, res);
    expect(res.statusCode).toBe(405);
  });

  it("개인정보·창작물 테이블을 삭제한다", async () => {
    const deleted = mockSupabaseAllOk();
    const res = makeRes();
    await handler(req(), res);

    expect(res.statusCode).toBe(200);
    const joined = deleted.join("\n");
    expect(joined).toContain("hll_projects?user_email=eq.");
    expect(joined).toContain("hll_project_versions?user_email=eq.");
    expect(joined).toContain("hll_api_usage?email=eq.");
    expect(joined).toContain("hll_subscriptions?email=eq.");
    expect(joined).toContain("hll_users?email=eq.");
  });

  it("결제 기록과 감사 로그는 삭제하지 않는다 (법적 보존)", async () => {
    const deleted = mockSupabaseAllOk();
    await handler(req(), makeRes());

    const joined = deleted.join("\n");
    expect(joined).not.toContain("hll_payment_events");
    expect(joined).not.toContain("hll_audit_logs");
  });

  it("삭제 대상은 항상 본인 email 로만 필터링된다", async () => {
    const deleted = mockSupabaseAllOk();
    await handler(req(), makeRes());

    const enc = encodeURIComponent(EMAIL);
    for (const url of deleted) {
      expect(url).toContain(`eq.${enc}`);
    }
  });

  it("탈퇴 성공 시 감사 로그를 남기고 세션 쿠키를 만료시킨다", async () => {
    mockSupabaseAllOk();
    const res = makeRes();
    await handler(req(), res);

    expect(writeAuditLog).toHaveBeenCalledWith("api:auth", "account.deleted", EMAIL, {});
    const cookies = [].concat(res.headers["Set-Cookie"] || []).flat();
    expect(cookies.some(c => c.includes("hll_auth=") && c.includes("Max-Age=0"))).toBe(true);
  });

  it("일부 삭제 실패 시 500 이고 실패를 감사 로그에 남긴다", async () => {
    // hll_users 삭제만 실패시킨다
    global.fetch = vi.fn((url, opts = {}) => {
      if ((opts.method || "GET") === "DELETE" && String(url).includes("hll_users")) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) });
      }
      return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
    });
    const res = makeRes();
    await handler(req(), res);

    expect(res.statusCode).toBe(500);
    expect(writeAuditLog).toHaveBeenCalledWith(
      "api:auth", "account.delete_failed", EMAIL,
      expect.objectContaining({ failed: expect.arrayContaining(["hll_users"]) })
    );
  });
});
