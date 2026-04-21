/**
 * Consolidated admin endpoint. Dispatched by ?resource=xxx:
 *   /api/admin?resource=audit  — GET  — 감사 로그 조회
 *   /api/admin?resource=users  — GET  — 사용자 목록 / POST — 등급 변경
 */
import { rcall, redisConfigured, writeAuditLog } from "./_redis.js";
import { verifyToken, getTokenFromRequest } from "./auth/_jwt.js";

const SUPA_URL = (process.env.SUPABASE_URL || "").trim();
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
}

function envTier(email) {
  const e = (email || "").toLowerCase();
  const blocked = (process.env.BLOCKED_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (adminEmails().includes(e)) return "admin";
  if (blocked.includes(e)) return "blocked";
  let tiers = {};
  try { tiers = JSON.parse(process.env.USER_TIERS || "{}"); } catch {}
  return tiers[e] || "basic";
}

async function supaGet(path) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
    });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  } catch { return null; }
}

// ── resource: audit ──────────────────────────────────────────────────────
async function handleAudit(req, res, payload) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!SUPA_URL || !SUPA_KEY) return res.json({ configured: false, logs: [] });

  const limit = Math.min(parseInt(req.query?.limit) || 100, 500);
  const action = req.query?.action ? `&action=eq.${encodeURIComponent(req.query.action)}` : "";
  const actor = req.query?.actor ? `&actor=eq.${encodeURIComponent(req.query.actor)}` : "";

  const rows = await supaGet(
    `hll_audit_logs?select=*&order=created_at.desc&limit=${limit}${action}${actor}`
  );
  return res.json({ configured: true, logs: Array.isArray(rows) ? rows : [] });
}

// ── resource: users ──────────────────────────────────────────────────────
async function handleUsers(req, res, payload) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!redisConfigured()) return res.json({ configured: false, users: [] });

  if (req.method === "GET") {
    const emails = (await rcall("smembers", "hll:users")) || [];
    const users = await Promise.all(
      emails.map(async (email) => {
        const [infoStr, redisTier] = await Promise.all([
          rcall("get", `hll:user:${email}`),
          rcall("get", `hll:tier:${email}`),
        ]);
        let info = {};
        try { info = JSON.parse(infoStr || "{}"); } catch {}
        return {
          email,
          name: info.name || "",
          provider: info.provider || "",
          avatar: info.avatar || "",
          lastSeen: info.lastSeen || null,
          tier: redisTier || envTier(email),
        };
      })
    );
    users.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    return res.json({ configured: true, users });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { email, tier } = body || {};
    if (!email || !tier) return res.status(400).json({ error: "email과 tier가 필요합니다." });
    if (!["admin", "pro", "basic", "blocked"].includes(tier)) {
      return res.status(400).json({ error: "유효하지 않은 등급입니다." });
    }
    await rcall("set", `hll:tier:${email.toLowerCase()}`, tier);
    await writeAuditLog(payload.email, "tier.change", email.toLowerCase(), { newTier: tier });
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// ── Main dispatcher ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  const auth = getTokenFromRequest(req);
  if (!auth) return res.status(401).json({ error: "로그인이 필요합니다." });

  let payload;
  try { payload = verifyToken(auth); }
  catch { return res.status(401).json({ error: "유효하지 않은 토큰입니다." }); }

  if (!adminEmails().includes((payload.email || "").toLowerCase())) {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }

  const resource = req.query?.resource || "";
  switch (resource) {
    case "audit": return handleAudit(req, res, payload);
    case "users": return handleUsers(req, res, payload);
    default:      return res.status(400).json({ error: "Invalid resource. Use ?resource=audit|users" });
  }
}
