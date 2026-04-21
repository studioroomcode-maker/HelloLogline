import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync } from "fs";
import { createHmac } from "crypto";

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

// 필수/권장 환경변수 점검 (부트 시 1회)
{
  const required = ["JWT_SECRET", "ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"];
  const advisory = ["TOSS_SECRET_KEY", "CRON_SECRET", "RESEND_API_KEY", "VITE_TOSS_CLIENT_KEY"];
  const missingReq = required.filter(k => !(process.env[k] || "").trim());
  const missingAdv = advisory.filter(k => !(process.env[k] || "").trim());
  if (missingReq.length) console.warn(`[env] 필수 환경변수 누락: ${missingReq.join(", ")} — 해당 기능 비활성화됨`);
  if (missingAdv.length) console.warn(`[env] 권장 환경변수 누락: ${missingAdv.join(", ")}`);
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

app.get("/health", (_req, res) => res.json({ status: "ok", hasKey: !!process.env.ANTHROPIC_API_KEY }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", hasKey: !!process.env.ANTHROPIC_API_KEY }));

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
        "anthropic-beta": "prompt-caching-2024-07-31",
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

// ── OAuth helpers ──
const JWT_SECRET = process.env.JWT_SECRET || "hll-jwt-fallback-secret";

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function issueJwt(payload) {
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const body = b64url({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 });
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyJwt(token) {
  const [header, body, sig] = token.split(".");
  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired");
  return payload;
}

function issueToken(user, frontendUrl) {
  const token = issueJwt(user);
  return `${frontendUrl}?auth_token=${token}`;
}

// Kakao
app.get("/auth/kakao", (req, res) => {
  const redirectUri = `http://localhost:${BASE_PORT}/auth/kakao/callback`;
  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  res.redirect(url);
});

app.get("/auth/kakao/callback", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code } = req.query;
  if (!code) return res.redirect(`${frontendUrl}?auth_error=kakao`);
  try {
    const redirectUri = `http://localhost:${BASE_PORT}/auth/kakao/callback`;
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", client_id: process.env.KAKAO_REST_API_KEY, redirect_uri: redirectUri, code }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description);
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${td.access_token}` },
    });
    const ud = await userRes.json();
    const user = {
      id: `kakao_${ud.id}`,
      provider: "kakao",
      name: ud.kakao_account?.profile?.nickname || "카카오 사용자",
      email: ud.kakao_account?.email || "",
      avatar: ud.kakao_account?.profile?.profile_image_url || "",
    };
    res.redirect(issueToken(user, frontendUrl));
  } catch (err) {
    console.error("[Kakao OAuth]", err.message);
    res.redirect(`${frontendUrl}?auth_error=kakao`);
  }
});

// Google
app.get("/auth/google", (req, res) => {
  const redirectUri = `http://localhost:${BASE_PORT}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get("/auth/google/callback", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code } = req.query;
  if (!code) return res.redirect(`${frontendUrl}?auth_error=google`);
  try {
    const redirectUri = `http://localhost:${BASE_PORT}/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description);
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${td.access_token}` },
    });
    const ud = await userRes.json();
    const user = {
      id: `google_${ud.sub}`,
      provider: "google",
      name: ud.name || "Google 사용자",
      email: ud.email || "",
      avatar: ud.picture || "",
    };
    res.redirect(issueToken(user, frontendUrl));
  } catch (err) {
    console.error("[Google OAuth]", err.message);
    res.redirect(`${frontendUrl}?auth_error=google`);
  }
});

// Naver
app.get("/auth/naver", (req, res) => {
  const redirectUri = `http://localhost:${BASE_PORT}/auth/naver/callback`;
  const state = Math.random().toString(36).slice(2, 10);
  const params = new URLSearchParams({ client_id: process.env.NAVER_CLIENT_ID, redirect_uri: redirectUri, response_type: "code", state });
  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params}`);
});

app.get("/auth/naver/callback", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code, state } = req.query;
  if (!code) return res.redirect(`${frontendUrl}?auth_error=naver`);
  try {
    const redirectUri = `http://localhost:${BASE_PORT}/auth/naver/callback`;
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", client_id: process.env.NAVER_CLIENT_ID, client_secret: process.env.NAVER_CLIENT_SECRET, code, state }),
    });
    const td = await tokenRes.json();
    if (td.error) throw new Error(td.error_description);
    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${td.access_token}` },
    });
    const ud = await userRes.json();
    const profile = ud.response || {};
    const user = {
      id: `naver_${profile.id}`,
      provider: "naver",
      name: profile.name || profile.nickname || "네이버 사용자",
      email: profile.email || "",
      avatar: profile.profile_image || "",
    };
    res.redirect(issueToken(user, frontendUrl));
  } catch (err) {
    console.error("[Naver OAuth]", err.message);
    res.redirect(`${frontendUrl}?auth_error=naver`);
  }
});

// JWT verification
app.get("/api/auth/me", (req, res) => {
  // 토큰 소스 우선순위: Authorization: Bearer → x-auth-token 헤더
  const auth = req.headers.authorization;
  const xToken = req.headers["x-auth-token"];
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7) : xToken;
  if (!raw) return res.status(401).json({ error: "No token" });
  try {
    const user = verifyJwt(raw);
    res.json({ user: { id: user.id, provider: user.provider, name: user.name, email: user.email, avatar: user.avatar } });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/api/auth/logout", (_req, res) => res.json({ ok: true }));

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
