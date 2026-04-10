import { createHmac } from "crypto";
import { getCredits } from "../_redis.js";

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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers["x-auth-token"] || req.headers.authorization?.replace("Bearer ", "");
  if (!authHeader) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  let email;
  try {
    const payload = verifyToken(authHeader);
    email = payload.email;
  } catch {
    return res.status(401).json({ error: "인증 토큰이 유효하지 않습니다." });
  }

  const credits = await getCredits(email);
  return res.status(200).json({ credits: credits ?? 0 });
}
