import { verifyToken } from "./_jwt.js";

export default function handler(req, res) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "No token" });
  try {
    const user = verifyToken(auth.slice(7));
    res.json({ user: { id: user.id, provider: user.provider, name: user.name, email: user.email, avatar: user.avatar } });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
