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
  if (usingSupa())  return supaRcall(command, ...args);
  if (usingRedis()) return redisRcall(command, ...args);
  return null;
}

/** 어떤 DB를 사용 중인지 반환 (관리자 패널 안내용) */
export const dbProvider = () => usingSupa() ? "supabase" : usingRedis() ? "upstash" : "none";
