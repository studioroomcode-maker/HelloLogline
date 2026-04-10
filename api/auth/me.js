import { createHmac } from "crypto";
import { rcall } from "../_redis.js";

const SECRET = (process.env.JWT_SECRET || "hll-jwt-fallback-secret").trim();

function verifyToken(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return payload;
}

async function getUserTier(email, userId) {
  const adminEmails  = (process.env.ADMIN_EMAILS  || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const blockedEmails = (process.env.BLOCKED_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

  const e  = (email  || "").toLowerCase();
  const id = (userId || "").toLowerCase();

  // Env-var admins/blocked override everything
  if (adminEmails.includes(e)  || adminEmails.includes(id))  return "admin";
  if (blockedEmails.includes(e) || blockedEmails.includes(id)) return "blocked";

  // Redis tier override (set by admin panel)
  const redisTier = await rcall("get", `hll:tier:${e}`);
  if (redisTier) return redisTier;

  // Fall back to USER_TIERS env var
  let userTiers = {};
  try { userTiers = JSON.parse(process.env.USER_TIERS || "{}"); } catch {}
  return userTiers[e] || userTiers[id] || userTiers[email] || userTiers[userId] || "basic";
}

export default async function handler(req, res) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try {
    const payload = verifyToken(auth.slice(7));
    const tier = await getUserTier(payload.email, payload.id);
    res.json({
      user: {
        id: payload.id,
        provider: payload.provider,
        name: payload.name,
        email: payload.email,
        avatar: payload.avatar,
        tier,
      }
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
