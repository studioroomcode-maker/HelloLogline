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

// ─── In-memory rate limit fallback ──────────────────────────────────────────
// Used when Redis/Supabase is unreachable. Provides burst protection within a
// warm serverless instance. Not shared across instances — best-effort only.
const _memStore = new Map();

function memRateCheck(key, limit, windowSec) {
  const now = Date.now();
  const entry = _memStore.get(key);
  if (!entry || entry.resetAt <= now) {
    _memStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1, reset: windowSec };
  }
  entry.count++;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    reset: Math.ceil((entry.resetAt - now) / 1000),
  };
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
    // Redis/Supabase 불가 — 인스턴스 내 in-memory 폴백으로 최소한의 버스트 방어
    return memRateCheck(key, limit, windowSec);
  }
}

// ─── 구독 관리 (Supabase 전용) ─────────────────────────────────────
// 테이블 생성 SQL (Supabase SQL Editor에서 실행):
//   CREATE TABLE hll_subscriptions (
//     email           text PRIMARY KEY,
//     plan            text NOT NULL,
//     billing_key     text NOT NULL,
//     customer_key    text,
//     status          text DEFAULT 'active',
//     next_billing_at bigint DEFAULT 0,
//     created_at      bigint DEFAULT 0
//   );

/** 구독 정보 조회. 없으면 null */
export async function getSubscription(email) {
  if (!usingSupa()) return null;
  const rows = await supaReq(
    `hll_subscriptions?email=eq.${encodeURIComponent(email)}&select=*`
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

/** 구독 정보 생성/갱신 */
export async function upsertSubscription(email, data) {
  if (!usingSupa()) return null;
  return supaReq("hll_subscriptions", {
    method: "POST",
    prefer: "resolution=merge-duplicates",
    body: { email, ...data },
  });
}

/**
 * 자동 결제 대상 구독 목록 — status='active' AND next_billing_at <= now
 * @param {number} nowMs — Date.now()
 */
export async function listDueSubscriptions(nowMs) {
  if (!usingSupa()) return [];
  const rows = await supaReq(
    `hll_subscriptions?status=eq.active&next_billing_at=lte.${nowMs}&select=*`
  );
  return Array.isArray(rows) ? rows : [];
}

// ─── 결제 이벤트 로그 (멱등성 + 감사) ────────────────────────────
// 테이블 생성 SQL:
//   CREATE TABLE hll_payment_events (
//     payment_key   text PRIMARY KEY,
//     order_id      text,
//     email         text,
//     amount        bigint,
//     status        text,
//     event         text,
//     credits_added bigint DEFAULT 0,
//     raw           jsonb,
//     created_at    bigint
//   );
//   CREATE INDEX hll_payment_events_email_idx ON hll_payment_events(email);
//   CREATE INDEX hll_payment_events_order_idx ON hll_payment_events(order_id);

/** 결제 이벤트 조회 — 이미 처리됐는지 확인 (멱등성) */
export async function getPaymentEvent(paymentKey) {
  if (!usingSupa()) return null;
  const rows = await supaReq(
    `hll_payment_events?payment_key=eq.${encodeURIComponent(paymentKey)}&select=*`
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

/** 결제 이벤트 저장 — merge-duplicates로 upsert */
export async function savePaymentEvent(paymentKey, data) {
  if (!usingSupa()) return null;
  return supaReq("hll_payment_events", {
    method: "POST",
    prefer: "resolution=merge-duplicates",
    body: {
      payment_key: paymentKey,
      created_at: Date.now(),
      ...data,
    },
  });
}

// ─── 감사 로그 ──────────────────────────────────────────────────
// 테이블 생성 SQL:
//   CREATE TABLE hll_audit_logs (
//     id         bigserial PRIMARY KEY,
//     actor      text,
//     action     text,
//     target     text,
//     detail     jsonb,
//     created_at bigint
//   );
//   CREATE INDEX hll_audit_logs_actor_idx ON hll_audit_logs(actor);
//   CREATE INDEX hll_audit_logs_action_idx ON hll_audit_logs(action);

/** 감사 로그 기록 — 실패해도 호출자에게 예외를 던지지 않음 */
export async function writeAuditLog(actor, action, target, detail) {
  if (!usingSupa()) return null;
  try {
    return await supaReq("hll_audit_logs", {
      method: "POST",
      body: { actor, action, target, detail, created_at: Date.now() },
    });
  } catch { return null; }
}

// ─── API 사용량 로그 (사용자별 토큰/요청 추적) ─────────────────────
// 테이블 생성 SQL (Supabase SQL Editor에서 실행):
//   CREATE TABLE hll_api_usage (
//     id            bigserial PRIMARY KEY,
//     email         text NOT NULL,
//     feature       text,
//     model         text,
//     input_tokens  bigint DEFAULT 0,
//     output_tokens bigint DEFAULT 0,
//     cache_creation_input_tokens bigint DEFAULT 0,
//     cache_read_input_tokens     bigint DEFAULT 0,
//     credits       bigint DEFAULT 0,
//     status        text,
//     stream        boolean DEFAULT false,
//     created_at    bigint
//   );
//   CREATE INDEX hll_api_usage_email_idx      ON hll_api_usage(email);
//   CREATE INDEX hll_api_usage_created_at_idx ON hll_api_usage(created_at);

/** API 사용량 1건 기록. 실패해도 호출자에게 예외를 던지지 않음 */
export async function recordApiUsage(email, data) {
  if (!usingSupa() || !email) return null;
  try {
    return await supaReq("hll_api_usage", {
      method: "POST",
      body: {
        email: String(email).toLowerCase(),
        feature: data?.feature || null,
        model: data?.model || null,
        input_tokens: Number(data?.input_tokens || 0),
        output_tokens: Number(data?.output_tokens || 0),
        cache_creation_input_tokens: Number(data?.cache_creation_input_tokens || 0),
        cache_read_input_tokens: Number(data?.cache_read_input_tokens || 0),
        credits: Number(data?.credits || 0),
        status: data?.status || "ok",
        stream: !!data?.stream,
        created_at: Date.now(),
      },
    });
  } catch { return null; }
}

/**
 * 사용자별 사용량 집계.
 *   email  — 특정 사용자만 (옵션)
 *   sinceMs — 시작 시각 (옵션, 0이면 전체)
 * 반환: [{ email, requests, input_tokens, output_tokens, cache_creation, cache_read, credits, last_at }]
 */
export async function getUsageSummary({ email = null, sinceMs = 0, limit = 5000 } = {}) {
  if (!usingSupa()) return [];
  const filters = [];
  if (email) filters.push(`email=eq.${encodeURIComponent(String(email).toLowerCase())}`);
  if (sinceMs > 0) filters.push(`created_at=gte.${sinceMs}`);
  const qs = filters.length ? `&${filters.join("&")}` : "";
  const rows = await supaReq(
    `hll_api_usage?select=email,input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens,credits,created_at&order=created_at.desc&limit=${limit}${qs}`
  );
  if (!Array.isArray(rows)) return [];
  const map = new Map();
  for (const r of rows) {
    const key = (r.email || "").toLowerCase();
    if (!key) continue;
    const cur = map.get(key) || {
      email: key, requests: 0,
      input_tokens: 0, output_tokens: 0,
      cache_creation: 0, cache_read: 0,
      credits: 0, last_at: 0,
    };
    cur.requests += 1;
    cur.input_tokens  += Number(r.input_tokens  || 0);
    cur.output_tokens += Number(r.output_tokens || 0);
    cur.cache_creation += Number(r.cache_creation_input_tokens || 0);
    cur.cache_read     += Number(r.cache_read_input_tokens || 0);
    cur.credits        += Number(r.credits || 0);
    if (r.created_at && Number(r.created_at) > cur.last_at) cur.last_at = Number(r.created_at);
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) =>
    (b.input_tokens + b.output_tokens) - (a.input_tokens + a.output_tokens)
  );
}

/** 단일 사용자의 최근 호출 N건. 상세 화면용 */
export async function getUsageRecent(email, limit = 50) {
  if (!usingSupa() || !email) return [];
  const rows = await supaReq(
    `hll_api_usage?email=eq.${encodeURIComponent(String(email).toLowerCase())}&select=*&order=created_at.desc&limit=${limit}`
  );
  return Array.isArray(rows) ? rows : [];
}
