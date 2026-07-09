/**
 * OAuth 사용자 식별자 회귀 테스트
 *
 * 카카오/네이버는 이메일 동의를 거부할 수 있다. 예전에는 email 이 빈 문자열이 되어
 * 프로젝트 저장 등이 401 로 막혔다. 이제 provider+id 로 안정적 대체 식별자를 만든다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/_redis.js", () => ({
  rcall: vi.fn(() => Promise.resolve(null)),
  grantInitialCredits: vi.fn(() => Promise.resolve()),
}));
vi.mock("../api/auth/_csrf.js", () => ({
  generateState: () => "s",
  stateCookieHeader: () => "",
  verifyState: () => true,
  clearStateCookieHeader: () => "",
}));

const { verifyToken } = await import("../api/auth/_jwt.js");
const { default: handler } = await import("../api/auth.js");
const { sendEmail } = await import("../api/_email.js");

function makeRes() {
  const headers = {};
  return {
    statusCode: 200, redirected: null, headers,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
    setHeader(k, v) { headers[k] = v; },
    getHeader(k) { return headers[k]; },
    redirect(url) { this.redirected = url; return this; },
    send() { return this; },
    end() { return this; },
  };
}

/** OAuth 콜백에서 설정된 hll_auth 쿠키의 JWT payload 를 추출한다 */
function tokenPayloadFromRes(res) {
  const cookies = [].concat(res.headers["Set-Cookie"] || []).flat();
  const auth = cookies.find(c => typeof c === "string" && c.startsWith("hll_auth="));
  if (!auth) return null;
  const token = auth.split("=")[1].split(";")[0];
  return verifyToken(token);
}

/** 카카오/네이버 토큰+프로필 응답을 흉내낸다 */
function mockOAuth({ tokenBody, profileBody }) {
  let call = 0;
  global.fetch = vi.fn(() => {
    call += 1;
    const body = call === 1 ? tokenBody : profileBody;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  });
}

const req = (action) => ({
  method: "GET",
  query: { action, code: "authcode", state: "s" },
  headers: { host: "hellologlines.studioroomkr.com", "x-forwarded-proto": "https", cookie: "hll_oauth_state=s" },
});

describe("카카오 이메일 미동의", () => {
  beforeEach(() => vi.clearAllMocks());

  it("이메일이 없으면 kakao_{id}@kakao.local 을 식별자로 쓴다", async () => {
    mockOAuth({
      tokenBody: { access_token: "at" },
      profileBody: { id: 987654, kakao_account: { profile: { nickname: "홍길동" } } }, // email 없음
    });
    const res = makeRes();
    await handler(req("kakao-callback"), res);

    const payload = tokenPayloadFromRes(res);
    expect(payload.email).toBe("kakao_987654@kakao.local");
    expect(payload.name).toBe("홍길동");
  });

  it("이메일이 있으면 실제 이메일을 소문자로 쓴다", async () => {
    mockOAuth({
      tokenBody: { access_token: "at" },
      profileBody: { id: 111, kakao_account: { email: "User@Test.COM", profile: { nickname: "u" } } },
    });
    const res = makeRes();
    await handler(req("kakao-callback"), res);

    expect(tokenPayloadFromRes(res).email).toBe("user@test.com");
  });

  it("같은 카카오 계정은 매번 같은 식별자를 받는다", async () => {
    const profile = { id: 555, kakao_account: { profile: { nickname: "x" } } };
    mockOAuth({ tokenBody: { access_token: "at" }, profileBody: profile });
    const r1 = makeRes(); await handler(req("kakao-callback"), r1);
    mockOAuth({ tokenBody: { access_token: "at" }, profileBody: profile });
    const r2 = makeRes(); await handler(req("kakao-callback"), r2);

    expect(tokenPayloadFromRes(r1).email).toBe(tokenPayloadFromRes(r2).email);
  });
});

describe("네이버 이메일 미동의", () => {
  beforeEach(() => vi.clearAllMocks());

  it("이메일이 없으면 naver_{id}@naver.local 을 식별자로 쓴다", async () => {
    mockOAuth({
      tokenBody: { access_token: "at" },
      profileBody: { response: { id: "abc123", name: "김철수" } }, // email 없음
    });
    const res = makeRes();
    await handler(req("naver-callback"), res);

    expect(tokenPayloadFromRes(res).email).toBe("naver_abc123@naver.local");
  });
});

describe("대체 식별자로는 이메일을 발송하지 않는다", () => {
  it(".local 주소는 발송을 건너뛴다", async () => {
    const r1 = await sendEmail({ to: "kakao_1@kakao.local", subject: "x", html: "y" });
    const r2 = await sendEmail({ to: "naver_1@naver.local", subject: "x", html: "y" });
    expect(r1.ok).toBe(false);
    expect(r1.reason).toBe("synthetic_address");
    expect(r2.reason).toBe("synthetic_address");
  });
});
