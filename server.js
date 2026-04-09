import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync } from "fs";

const app = express();
const BASE_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const PORT_FILE = ".proxy-port"; // Vite dev server reads this to know the actual port

// Load .env manually (avoid importing dotenv as a runtime dep)
try {
  const env = readFileSync(".env", "utf8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length) {
      const val = rest.join("=").replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // .env not found — rely on system env
}

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
  })
);
app.use(express.json({ limit: "4mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/claude", async (req, res) => {
  // Server-side key takes priority; fallback to client-provided key
  const apiKey =
    process.env.ANTHROPIC_API_KEY || req.headers["x-client-api-key"];

  if (!apiKey) {
    return res
      .status(401)
      .json({ error: { message: "API 키가 설정되지 않았습니다." } });
  }

  const controller = new AbortController();
  req.socket.on("close", () => { if (!res.headersSent) controller.abort(); });

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    if (err.name === "AbortError") {
      res.status(499).json({ error: { message: "요청이 취소되었습니다." } });
    } else {
      console.error("[proxy error]", err.message);
      res.status(500).json({ error: { message: err.message } });
    }
  }
});

// ── Port auto-fallback ──
function startServer(port) {
  const server = app.listen(port);

  server.on("listening", () => {
    const keySource = process.env.ANTHROPIC_API_KEY
      ? ".env (서버 환경변수)"
      : "사용자 입력 (클라이언트 제공)";

    if (port !== BASE_PORT) {
      console.log(`⚠️  포트 ${BASE_PORT} 사용 중 → 포트 ${port}로 대체 실행`);
    }
    console.log(
      `✅ Hello Logline proxy  →  http://localhost:${port}  |  키 출처: ${keySource}`
    );

    // Write actual port so vite.config.js can read it
    try { writeFileSync(PORT_FILE, String(port)); } catch { /* ignore */ }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️  포트 ${port} 사용 중, 포트 ${port + 1} 시도...`);
      server.close();
      startServer(port + 1);
    } else {
      console.error("[server error]", err.message);
      process.exit(1);
    }
  });
}

startServer(BASE_PORT);
