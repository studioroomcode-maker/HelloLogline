import { createHmac } from "crypto";

const SECRET = process.env.JWT_SECRET || "hll-jwt-fallback-secret";

function verifyToken(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }
  return payload;
}

export default function handler(req, res) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try {
    const user = verifyToken(auth.slice(7));
    res.json({ user: { id: user.id, provider: user.provider, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}
