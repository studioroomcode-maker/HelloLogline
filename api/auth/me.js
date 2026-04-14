import { rcall } from "../_redis.js";
import { verifyToken, getTokenFromRequest } from "./_jwt.js";

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
  const rawToken = getTokenFromRequest(req);
  if (!rawToken) return res.status(401).json({ error: "No token" });
  try {
    const payload = verifyToken(rawToken);
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
