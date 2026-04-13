/**
 * DB abstraction — Supabase (우선) 또는 Upstash Redis 중 설정된 쪽을 사용.
 *
 * Supabase 테이블 생성 SQL (Supabase SQL Editor에서 실행):
 *   CREATE TABLE hll_users (
 *     email      text PRIMARY KEY,
 *     name       text,
 *     provider   text,
 *     avatar     text,
 *     last_seen  bigint DEFAULT 0,
 *     tier       text DEFAULT 'basic'
 *   );
 */

const SUPA_URL    = (process.env.SUPABASE_URL          || "").trim();
const SUPA_KEY    = (process.env.SUPABASE_SERVICE_KEY  || "").trim();
const REDIS_URL   = (process.env.UPSTASH_REDIS_REST_URL   || "").trim();
const REDIS_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

const usingSupa  = () => !!(SUPA_URL && SUPA_KEY);
const usingRedis = () => !!(REDIS_URL && REDIS_TOKEN);

export const redisConfigured = () => usingSupa() || usingRedis();

// ─── Redis 가용성 상태 ────────────────────────────────────────────
// null = 미확인, true = 가능, false = 불가
let _redisAvailable = null;

/** 현재 Redis/DB가 실제로 응답 가능한 상태인지 반환 */
export function isRedisAvailable() {
  return _redisAvailable === true;
}

// ─── Supabase REST helpers ───────────────────────────────────────
async function supaReq(path, { method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers["Prefer"] = prefer;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 204 || r.status === 404) return null;
    if (!r.ok) return null;
    return r.json().catch(() => null);
  } catch { return null; }
}

async function supaRcall(command, ...args) {
  const cmd = command.toLowerCase();

  // smembers "hll:users" → SELECT email FROM hll_users
  if (cmd === "smembers" && args[0] === "hll:users") {
    const rows = await supaReq("hll_users?select=email");
    return Array.isArray(rows) ? rows.map(r => r.email) : [];
  }

  // get "hll:user:{email}" → JSON 문자열로 반환
  if (cmd === "get" && args[0]?.startsWith("hll:user:")) {
    const email = args[0].slice("hll:user:".length);
    const rows = await supaReq(`hll_users?email=eq.${encodeURIComponent(email)}&select=name,provider,avatar,last_seen`);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return JSON.stringify(rows[0]);
  }

  // get "hll:tier:{email}" → tier 문자열 반환
  if (cmd === "get" && args[0]?.startsWith("hll:tier:")) {
    const email = args[0].slice("hll:tier:".length);
    const rows = await supaReq(`hll_users?email=eq.${encodeURIComponent(email)}&select=tier`);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows[0].tier || null;
  }

  // sadd "hll:users" email → 행이 없으면 삽입 (ignore duplicate)
  if (cmd === "sadd" && args[0] === "hll:users") {
    await supaReq("hll_users", {
      method: "POST",
      prefer: "resolution=ignore-duplicates",
      body: { email: args[1] },
    });
    return 1;
  }

  // set "hll:user:{email}" jsonString → upsert 사용자 정보
  if (cmd === "set" && args[0]?.startsWith("hll:user:")) {
    const email = args[0].slice("hll:user:".length);
    let info = {};
    try { info = JSON.parse(args[1] || "{}"); } catch {}
    await supaReq("hll_users", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: { email, ...info },
    });
    return "OK";
  }

  // set "hll:tier:{email}" tier → tier 컬럼 업데이트
  if (cmd === "set" && args[0]?.startsWith("hll:tier:")) {
    const email = args[0].slice("hll:tier:".length);
    // 행이 있으면 UPDATE, 없으면 INSERT
    await supaReq("hll_users", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: { email, tier: args[1] },
    });
    return "OK";
  }

  return null;
}

// ─── Upstash Redis helper ────────────────────────────────────────
async function redisRcall(command, ...args) {
  try {
    const r = await fetch(REDIS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([command, ...args]),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.result ?? null;
  } catch { return null; }
}

// ─── 통합 export ────────────────────────────────────────────────
export async function rcall(command, ...args) {
  if (usingSupa() || usingRedis()) {
    try {
      const result = usingSupa()
        ? await supaRcall(command, ...args)
        : await redisRcall(command, ...args);
      // 첫 성공 시 가용 상태로 표시
      if (_redisAvailable !== true) _redisAvailable = true;
      return result;
    } catch (err) {
      if (_redisAvailable !== false) {
        console.warn("[Redis] 연결 불가 — 크레딧/레이트리미팅 기능이 비활성화됩니다. REDIS_URL 또는 SUPABASE_URL 환경변수를 확인하세요.", err?.message || "");
        _redisAvailable = false;
      }
      return null;
    }
  }
  // DB 환경변수 자체가 없는 경우
  if (_redisAvailable !== false) {
    console.warn("[Redis] DB 환경변수 미설정 — 크레딧/레이트리미팅 기능이 비활성화됩니다. REDIS_URL 환경변수를 확인하세요.");
    _redisAvailable = false;
  }
  return null;
}

/** 어떤 DB를 사용 중인지 반환 (관리자 패널 안내용) */
export const dbProvider = () => usingSupa() ? "supabase" : usingRedis() ? "upstash" : "none";

// ─── 크레딧 함수 (Supabase 전용) ────────────────────────────────
/** 크레딧 조회. DB 없으면 0 반환 (기능 무제한 허용) */
export async function getCredits(email) {
  if (!usingSupa()) return 0; // Redis/DB 없음 — 0 반환 (명시적 폴백)
  const rows = await supaReq(`hll_users?email=eq.${encodeURIComponent(email)}&select=credits`);
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  return rows[0].credits ?? 0;
}

/** 크레딧 차감. 반환값: 남은 크레딧 (잔액 부족 시 -1, DB 없음 시 null — 무제한 허용) */
export async function deductCredits(email, amount) {
  if (!usingSupa()) return null; // Redis/DB 없음 — null 반환 (크레딧 차감 건너뜀, 무제한 허용)
  const result = await supaReq("rpc/deduct_credits", {
    method: "POST",
    body: { user_email: email, amount },
  });
  return result ?? -1;
}

/** 크레딧 추가. 반환값: 새 잔액 */
export async function addCreditsDb(email, amount) {
  if (!usingSupa()) return null;
  const result = await supaReq("rpc/add_credits", {
    method: "POST",
    body: { user_email: email, amount },
  });
  return result;
}

/**
 * 신규 가입자에게 초기 크레딧 지급.
 * credits 컬럼이 null(한 번도 충전/차감된 적 없음)인 경우에만 지급.
 */
export async function grantInitialCredits(email, amount = 10) {
  if (!usingSupa()) return;
  try {
    const rows = await supaReq(`hll_users?email=eq.${encodeURIComponent(email)}&select=credits`);
    if (!Array.isArray(rows) || rows.length === 0) return;
    if (rows[0].credits !== null) return; // 이미 크레딧 이력 있음
    await supaReq("rpc/add_credits", {
      method: "POST",
      body: { user_email: email, amount },
    });
  } catch { /* 무시 — 크레딧 지급 실패가 로그인을 막으면 안 됨 */ }
}

/**
 * 레이트 리미팅 체크
 * @param {string} key - 리미팅 키 (예: "rl:ip:1.2.3.4" 또는 "rl:user:email@a.com")
 * @param {number} limit - 허용 최대 요청 수
 * @param {number} windowSec - 윈도우 초 (예: 60)
 * @returns {Promise<{ok: boolean, remaining: number, reset: number}>}
 */
export async function checkRateLimit(key, limit, windowSec) {
  try {
    const count = await rcall("incr", key);
    if (count === 1) {
      await rcall("expire", key, windowSec);
    }
    const ttl = await rcall("ttl", key);
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: ttl,
    };
  } catch {
    // Redis 없으면 통과
    return { ok: true, remaining: limit, reset: windowSec };
  }
}
