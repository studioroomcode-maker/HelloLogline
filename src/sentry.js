import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) return; // DSN 없으면 비활성화
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE, // "development" | "production"
    tracesSampleRate: 0.1, // 10% 성능 추적
    // 민감 정보 필터링
    beforeSend(event) {
      // API 키가 에러 메시지에 포함되면 제거
      if (event.message?.includes("sk-ant")) return null;
      return event;
    },
  });
}

export { Sentry };
