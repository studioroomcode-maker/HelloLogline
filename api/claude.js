export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const apiKey =
    process.env.ANTHROPIC_API_KEY || req.headers["x-client-api-key"];

  if (!apiKey) {
    return res
      .status(401)
      .json({ error: { message: "API 키가 설정되지 않았습니다." } });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[proxy error]", err.message);
    res.status(500).json({ error: { message: err.message } });
  }
}
