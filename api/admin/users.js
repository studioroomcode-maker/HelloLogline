import { createHmac } from "crypto";
import { rcall, redisConfigured } from "../_redis.js";

const JWT_SECRET = (process.env.JWT_SECRET || "hll-jwt-fallback-secret").trim();

function verifyToken(token) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired");
  return payload;
}

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Auth
  const auth = req.headers["x-auth-token"] || (req.headers.authorization || "").replace("Bearer ", "");
  if (!auth) return res.status(401).json({ error: "로그인이 필요합니다." });

  let payload;
  try { payload = verifyToken(auth); } catch {
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
  if (!adminEmails().includes((payload.email || "").toLowerCase())) {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }

  if (!redisConfigured()) {
    return res.json({ configured: false, users: [] });
  }

  // ── GET: list all users ──
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
    // Sort by lastSeen desc
    users.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    return res.json({ configured: true, users });
  }

  // ── POST: set tier ──
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { email, tier } = body || {};
    if (!email || !tier) return res.status(400).json({ error: "email과 tier가 필요합니다." });
    if (!["admin", "pro", "basic", "blocked"].includes(tier)) {
      return res.status(400).json({ error: "유효하지 않은 등급입니다." });
    }
    await rcall("set", `hll:tier:${email.toLowerCase()}`, tier);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
