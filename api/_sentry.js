/**
 * 서버사이드 Sentry — Vercel Functions용.
 * SENTRY_DSN 미설정 시 완전 비활성(console.error만 남김).
 */
import * as Sentry from "@sentry/node";

const DSN = (process.env.SENTRY_DSN_SERVER || process.env.SENTRY_DSN || "").trim();
let _initialized = false;

function maybeInit() {
  if (_initialized) return;
  _initialized = true;
  if (!DSN) return;
  try {
    Sentry.init({
      dsn: DSN,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      tracesSampleRate: 0.05,
      beforeSend(event) {
        const msg = event.message || "";
        if (msg.includes("sk-ant") || msg.includes("SUPABASE_SERVICE_KEY")) return null;
        return event;
      },
    });
  } catch (e) {
    console.warn("[sentry:server] init 실패", e?.message || e);
  }
}

/** 서버 에러 전송 — 실패해도 절대 throw 하지 않음 */
export function captureServerException(err, context = {}) {
  try {
    maybeInit();
    if (DSN) {
      Sentry.withScope((scope) => {
        for (const [k, v] of Object.entries(context)) {
          try { scope.setExtra(k, v); } catch { /* noop */ }
        }
        Sentry.captureException(err);
      });
    }
  } catch { /* noop */ }
  // Vercel 로그에도 남기기
  try { console.error("[server-error]", context?.where || "", err?.message || err); } catch { /* noop */ }
}

/** 수동 메시지 기록 */
export function captureServerMessage(msg, context = {}) {
  try {
    maybeInit();
    if (DSN) {
      Sentry.withScope((scope) => {
        for (const [k, v] of Object.entries(context)) {
          try { scope.setExtra(k, v); } catch { /* noop */ }
        }
        Sentry.captureMessage(msg);
      });
    }
  } catch { /* noop */ }
}
