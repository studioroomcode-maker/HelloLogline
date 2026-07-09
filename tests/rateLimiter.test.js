/**
 * 레이트 리미터 테스트 (C-2 회귀 방지)
 *
 * 이전 버전은 checkRateLimit 의 "복사본"을 인라인으로 재현해 테스트했다.
 * 그 결과 실제 Supabase 경로에서 rcall("incr") 이 null 을 반환하고
 * `null <= limit` 이 true 가 되어 리미팅이 통째로 무력화된 것을 놓쳤다.
 *
 * 이제는 api/_redis.js 의 실제 checkRateLimit 을 import 해서,
 * fetch 레벨에서 저장소를 흉내내 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/** 지정한 env 로 _redis.js 를 새로 로드한다 (모듈 최상단에서 env 를 읽으므로) */
async function loadWithEnv(env) {
  vi.resetModules();
  for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
    delete process.env[k];
  }
  Object.assign(process.env, env);
  return import("../api/_redis.js");
}

const SUPA_ENV = { SUPABASE_URL: "https://t.supabase.co", SUPABASE_SERVICE_KEY: "k" };
const REDIS_ENV = { UPSTASH_REDIS_REST_URL: "https://t.upstash.io", UPSTASH_REDIS_REST_TOKEN: "k" };

describe("checkRateLimit — Supabase RPC 경로", () => {
  beforeEach(() => vi.clearAllMocks());

  /** incr_rate_limit RPC 를 흉내내는 인메모리 카운터 */
  function mockRpc() {
    const counters = new Map();
    global.fetch = vi.fn((url, opts) => {
      if (!String(url).includes("rpc/incr_rate_limit")) {
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) });
      }
      const { p_key, p_window } = JSON.parse(opts.body);
      const n = (counters.get(p_key) || 0) + 1;
      counters.set(p_key, n);
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve([{ count: n, reset_at: Date.now() + p_window * 1000 }]),
      });
    });
  }

  it("한도 이내면 ok:true", async () => {
    const { checkRateLimit } = await loadWithEnv(SUPA_ENV);
    mockRpc();
    const r = await checkRateLimit("rl:ip:1.1.1.1", 3, 60);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it("한도를 넘으면 ok:false — 예전에 조용히 통과하던 케이스", async () => {
    const { checkRateLimit } = await loadWithEnv(SUPA_ENV);
    mockRpc();
    const key = "rl:ip:2.2.2.2";
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await checkRateLimit(key, 3, 60));

    expect(results.map(r => r.ok)).toEqual([true, true, true, false, false]);
  });

  it("키가 다르면 카운터가 분리된다", async () => {
    const { checkRateLimit } = await loadWithEnv(SUPA_ENV);
    mockRpc();
    await checkRateLimit("rl:user:a@x.com", 1, 60);
    const other = await checkRateLimit("rl:user:b@x.com", 1, 60);
    expect(other.ok).toBe(true);
  });

  it("RPC 가 없으면(404) 인메모리 폴백이 실제로 카운트한다", async () => {
    const { checkRateLimit } = await loadWithEnv(SUPA_ENV);
    // 모든 요청 404 — 마이그레이션 미실행 상황
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) }));

    const key = "rl:ip:3.3.3.3";
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await checkRateLimit(key, 2, 60));

    // 폴백이 통과만 시키면 안 된다
    expect(results.map(r => r.ok)).toEqual([true, true, false, false]);
  });

  it("RPC 가 예외를 던져도 폴백이 카운트한다", async () => {
    const { checkRateLimit } = await loadWithEnv(SUPA_ENV);
    global.fetch = vi.fn(() => Promise.reject(new Error("network down")));

    const key = "rl:ip:4.4.4.4";
    const a = await checkRateLimit(key, 1, 60);
    const b = await checkRateLimit(key, 1, 60);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(false);
  });
});

describe("checkRateLimit — Upstash Redis 경로", () => {
  function mockRedis() {
    const counters = new Map();
    global.fetch = vi.fn((_url, opts) => {
      const [cmd, key] = JSON.parse(opts.body);
      let result = null;
      if (cmd === "incr") { result = (counters.get(key) || 0) + 1; counters.set(key, result); }
      else if (cmd === "expire") result = 1;
      else if (cmd === "ttl") result = 42;
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ result }) });
    });
  }

  it("한도 초과 시 차단하고 ttl 을 reset 으로 반환한다", async () => {
    const { checkRateLimit } = await loadWithEnv(REDIS_ENV);
    mockRedis();
    const key = "rl:ip:5.5.5.5";
    await checkRateLimit(key, 2, 60);
    await checkRateLimit(key, 2, 60);
    const third = await checkRateLimit(key, 2, 60);

    expect(third.ok).toBe(false);
    expect(third.reset).toBe(42);
  });
});

describe("checkRateLimit — DB 미설정", () => {
  it("환경변수가 없어도 인메모리로 카운트한다 (무조건 통과 금지)", async () => {
    const { checkRateLimit } = await loadWithEnv({});
    const key = "rl:ip:6.6.6.6";
    const a = await checkRateLimit(key, 1, 60);
    const b = await checkRateLimit(key, 1, 60);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(false);
  });
});
