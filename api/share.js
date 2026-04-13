/**
 * /api/share — 분석 결과 공유 링크
 *
 * POST: 공유 링크 생성 → { id, url }
 * GET:  공유 결과 조회 → { logline, genre, data, created_at }
 *
 * Supabase SQL (SQL Editor에서 실행):
 * CREATE TABLE hll_shares (
 *   id         text PRIMARY KEY,
 *   logline    text,
 *   genre      text,
 *   data       jsonb,
 *   created_at bigint,
 *   expires_at bigint
 * );
 */

import { randomBytes } from "crypto";

const SUPA_URL = (process.env.SUPABASE_URL || "").trim();
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();

async function supaReq(path, { method = "GET", body, prefer } = {}) {
  if (!SUPA_URL || !SUPA_KEY) return null;
  const headers = {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers["Prefer"] = prefer;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 204) return {};   // POST return=minimal 성공 (No Content)
    if (r.status === 404) return null;
    if (!r.ok) return null;
    return r.json().catch(() => null);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ── GET: 공유 결과 조회 ──
  if (req.method === "GET") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id가 필요합니다." });

    if (!SUPA_URL || !SUPA_KEY) {
      return res.status(503).json({ error: "공유 기능을 사용하려면 Supabase 설정이 필요합니다." });
    }

    const rows = await supaReq(
      `hll_shares?id=eq.${encodeURIComponent(id)}&select=*`
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "공유 링크를 찾을 수 없습니다." });
    }
    const row = rows[0];

    // 만료 확인
    if (row.expires_at && row.expires_at < Date.now()) {
      return res.status(410).json({ error: "만료된 공유 링크입니다." });
    }

    return res.status(200).json({
      data: row.data,
      logline: row.logline,
      genre: row.genre,
      created_at: row.created_at,
    });
  }

  // ── POST: 공유 링크 생성 ──
  if (req.method === "POST") {
    if (!SUPA_URL || !SUPA_KEY) {
      return res.status(503).json({
        error: "공유 기능을 사용하려면 Supabase 설정이 필요합니다.",
        sql: "CREATE TABLE hll_shares (id text PRIMARY KEY, logline text, genre text, data jsonb, created_at bigint, expires_at bigint);",
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

    // 8자리 랜덤 ID 생성 (예: "a3f2c1b0")
    const id = randomBytes(4).toString("hex");
    const now = Date.now();
    const expires_at = now + 30 * 24 * 60 * 60 * 1000; // 30일

    const result = await supaReq("hll_shares", {
      method: "POST",
      prefer: "return=minimal",
      body: { id, logline, genre: genre || "", data, created_at: now, expires_at },
    });

    if (result === null) {
      return res.status(500).json({
        error: "저장 실패. Supabase에 hll_shares 테이블이 있는지 확인하세요.",
        sql: "CREATE TABLE hll_shares (id text PRIMARY KEY, logline text, genre text, data jsonb, created_at bigint, expires_at bigint);",
      });
    }

    return res.status(200).json({ id, url: `/share/${id}` });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
