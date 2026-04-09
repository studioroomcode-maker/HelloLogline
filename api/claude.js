export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const apiKey =
    process.env.ANTHROPIC_API_KEY || req.headers["x-client-api-key"];

  if (!apiKey) {
    return res
      .status(401)
      .json({ error: { message: "API 키가 설정되지 않았습니다. Vercel 대시보드 → Settings → Environment Variables → ANTHROPIC_API_KEY 를 추가해주세요." } });
  }

  // body가 string이면 파싱, object면 그대로 사용
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[proxy error]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
}
