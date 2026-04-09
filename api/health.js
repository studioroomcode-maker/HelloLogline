export default function handler(req, res) {
  res.json({ status: "ok", hasKey: !!process.env.ANTHROPIC_API_KEY });
}
