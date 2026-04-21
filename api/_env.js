/**
 * 필수/권장 환경변수 검증.
 * - 필수(REQUIRED): 미설정 시 프로덕션에서 엔드포인트 실행 차단
 * - 권장(ADVISORY): 미설정 시 경고만 (기능 일부 비활성)
 */

const IS_PROD = (process.env.VERCEL_ENV || process.env.NODE_ENV) === "production";

export const REQUIRED_ENV = [
  "JWT_SECRET",
  "ANTHROPIC_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
];

export const ADVISORY_ENV = [
  "TOSS_SECRET_KEY",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "VITE_TOSS_CLIENT_KEY",
  "GOOGLE_OAUTH_CLIENT_ID",
  "KAKAO_REST_API_KEY",
  "NAVER_CLIENT_ID",
];

let _cachedReport = null;

function buildReport() {
  const missingRequired = REQUIRED_ENV.filter(k => !(process.env[k] || "").trim());
  const missingAdvisory = ADVISORY_ENV.filter(k => !(process.env[k] || "").trim());
  return {
    ok: missingRequired.length === 0,
    isProd: IS_PROD,
    missingRequired,
    missingAdvisory,
  };
}

export function envReport() {
  if (_cachedReport) return _cachedReport;
  _cachedReport = buildReport();

  if (_cachedReport.missingRequired.length > 0) {
    const msg = `[env] 필수 환경변수 누락: ${_cachedReport.missingRequired.join(", ")}`;
    if (IS_PROD) console.error(msg);
    else console.warn(msg);
  }
  if (_cachedReport.missingAdvisory.length > 0) {
    console.warn(`[env] 권장 환경변수 누락(일부 기능 비활성): ${_cachedReport.missingAdvisory.join(", ")}`);
  }
  return _cachedReport;
}

/**
 * 엔드포인트 진입 시 호출. 프로덕션에서 필수 env 누락이면 500 반환.
 * 반환값: true = 진행 가능, false = 이미 응답 보냄(호출자는 return)
 */
export function ensureEnv(res, requiredKeys = REQUIRED_ENV) {
  const missing = requiredKeys.filter(k => !(process.env[k] || "").trim());
  if (missing.length === 0) return true;
  if (IS_PROD) {
    res.status(500).json({
      error: "서버가 올바르게 구성되지 않았습니다. 관리자에게 문의해 주세요.",
      missing,
    });
    return false;
  }
  console.warn(`[env] 개발 모드: 누락 ${missing.join(", ")} — 요청 진행`);
  return true;
}

// import 시점에 한 번 보고
envReport();
