/**
 * GET /api/admin/audit — 최근 감사 로그 조회 (관리자 전용)
 */
import { verifyToken, getTokenFromRequest } from "../auth/_jwt.js";

const SUPA_URL = (process.env.SUPABASE_URL || "").trim();
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
}

async function supaGet(path) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
      },
    });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = getTokenFromRequest(req);
  if (!auth) return res.status(401).json({ error: "로그인이 필요합니다." });

  let payload;
  try { payload = verifyToken(auth); } catch {
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
  if (!adminEmails().includes((payload.email || "").toLowerCase())) {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }

  if (!SUPA_URL || !SUPA_KEY) {
    return res.json({ configured: false, logs: [] });
  }

  const limit = Math.min(parseInt(req.query?.limit) || 100, 500);
  const action = req.query?.action ? `&action=eq.${encodeURIComponent(req.query.action)}` : "";
  const actor = req.query?.actor ? `&actor=eq.${encodeURIComponent(req.query.actor)}` : "";

  const rows = await supaGet(
    `hll_audit_logs?select=*&order=created_at.desc&limit=${limit}${action}${actor}`
  );
  return res.json({ configured: true, logs: Array.isArray(rows) ? rows : [] });
}
