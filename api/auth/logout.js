import { clearAuthCookie } from "./_jwt.js";

export default function handler(req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
}
