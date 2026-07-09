/**
 * /api/share — 분석 결과 공유 링크
 *
 * POST: 공유 링크 생성 → { id, url }
 * GET:  공유 결과 조회 → { logline, genre, data, created_at }
 *
 * 스토리지 우선순위:
 *   1. Supabase (SUPABASE_URL + SUPABASE_SERVICE_KEY)
 *   2. Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *
 * Supabase 테이블 생성 SQL:
 *   CREATE TABLE hll_shares (
 *     id text PRIMARY KEY, logline text, genre text,
 *     data jsonb, created_at bigint, expires_at bigint
 *   );
 */

import { randomBytes } from "crypto";
import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";
import { checkRateLimit } from "./_redis.js";

const SUPA_URL    = (process.env.SUPABASE_URL              || "").trim();
const SUPA_KEY    = (process.env.SUPABASE_SERVICE_KEY      || "").trim();
const REDIS_URL   = (process.env.UPSTASH_REDIS_REST_URL    || "").trim();
const REDIS_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN  || "").trim();

const usingSupa  = SUPA_URL  && SUPA_KEY;
const usingRedis = REDIS_URL && REDIS_TOKEN;

// ── Supabase helpers ──────────────────────────────────────────────
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
    if (r.status === 204) return {};
    if (r.status === 404 || !r.ok) return null;
    return r.json().catch(() => null);
  } catch { return null; }
}

// ── Upstash Redis helpers ─────────────────────────────────────────
async function redisCmd(...args) {
  try {
    const r = await fetch(`${REDIS_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.result ?? null;
  } catch { return null; }
}

const REDIS_TTL = 30 * 24 * 60 * 60; // 30일(초)

async function redisSet(id, payload) {
  return redisCmd("SET", `hll:share:${id}`, JSON.stringify(payload), "EX", REDIS_TTL);
}
async function redisGet(id) {
  const raw = await redisCmd("GET", `hll:share:${id}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── 저장 / 조회 ───────────────────────────────────────────────────
async function saveShare(id, payload) {
  if (usingSupa) {
    const r = await supaReq("hll_shares", {
      method: "POST", prefer: "return=minimal",
      body: payload,
    });
    return r !== null;
  }
  if (usingRedis) {
    const r = await redisSet(id, payload);
    return r === "OK";
  }
  return false;
}

async function loadShare(id) {
  if (usingSupa) {
    const rows = await supaReq(`hll_shares?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!rows || rows.length === 0) return null;
    return rows[0];
  }
  if (usingRedis) {
    return redisGet(id);
  }
  return null;
}

// ── Handler ───────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS 헤더 없음 — 공유 페이지(/share/:id)는 같은 오리진의 SPA가 읽는다.
  // 예전에는 Access-Control-Allow-Origin: * 라서 아무 사이트나 읽을 수 있었다.
  const configured = usingSupa || usingRedis;

  // ── GET ──
  if (req.method === "GET") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id가 필요합니다." });

    if (!configured) {
      return res.status(503).json({
        error: "공유 기능 미설정. Vercel 환경변수에 SUPABASE_URL+SUPABASE_SERVICE_KEY 또는 UPSTASH_REDIS_REST_URL+UPSTASH_REDIS_REST_TOKEN을 추가하세요.",
      });
    }

    const row = await loadShare(id);
    if (!row) return res.status(404).json({ error: "공유 링크를 찾을 수 없습니다." });
    if (row.expires_at && row.expires_at < Date.now()) {
      return res.status(410).json({ error: "만료된 공유 링크입니다. (30일 초과)" });
    }

    return res.status(200).json({
      data: row.data,
      logline: row.logline,
      genre: row.genre,
      created_at: row.created_at,
    });
  }

  // ── POST ──
  if (req.method === "POST") {
    // 인증 필수 — 예전에는 누구나 무제한으로 DB에 데이터를 밀어넣을 수 있었다.
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: "로그인이 필요합니다." });

    let email;
    try {
      email = verifyToken(token).email || "";
    } catch {
      return res.status(401).json({ error: "인증 토큰이 유효하지 않습니다." });
    }

    // 사용자당 시간당 20개
    if (email) {
      const limit = await checkRateLimit(`rl:share:${email}`, 20, 3600);
      if (!limit.ok) {
        return res.status(429).json({ error: "공유 링크를 너무 많이 만들었습니다. 잠시 후 다시 시도해주세요." });
      }
    }

    if (!configured) {
      return res.status(503).json({
        error: "공유 기능 미설정. Vercel 대시보드 → Settings → Environment Variables에서 SUPABASE_URL + SUPABASE_SERVICE_KEY 또는 UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN을 추가하세요.",
      });
    }

    let bodyData;
    try {
      bodyData = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: "잘못된 요청 본문입니다." });
    }

    const { logline, genre, data } = bodyData || {};
    if (!logline || !data) {
      return res.status(400).json({ error: "logline과 data가 필요합니다." });
    }

    // 4바이트(32비트)는 열거·충돌이 가능한 크기였다. 공유 문서에는 비공개 시나리오가 담긴다.
    const id = randomBytes(12).toString("hex"); // 24자
    const now = Date.now();
    const payload = {
      id, logline, genre: genre || "", data,
      created_at: now,
      expires_at: now + REDIS_TTL * 1000,
    };

    const ok = await saveShare(id, payload);
    if (!ok) {
      return res.status(500).json({
        error: "저장 실패. DB 연결 또는 테이블 설정을 확인하세요.",
        hint: usingSupa
          ? "Supabase에 hll_shares 테이블이 존재하는지 확인하세요."
          : "Upstash Redis 연결 상태를 확인하세요.",
      });
    }

    return res.status(200).json({ id, url: `/share/${id}` });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
