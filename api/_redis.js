const REDIS_URL   = (process.env.UPSTASH_REDIS_REST_URL   || "").trim();
const REDIS_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();

export const redisConfigured = () => !!(REDIS_URL && REDIS_TOKEN);

/** Execute a Redis command via Upstash REST API. Returns result or null. */
export async function rcall(command, ...args) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
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
