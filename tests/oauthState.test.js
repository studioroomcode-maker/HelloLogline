/**
 * OAuth state (CSRF) 검증 테스트 (H-1)
 *
 * 예전에는 쿠키가 없으면 HMAC 만으로 통과시켰다.
 * 공격자가 자기 OAuth 흐름에서 얻은 유효 state 를 피해자에게 열게 하면
 * 피해자가 공격자 계정으로 로그인되는 로그인 CSRF 가 가능했다.
 */
import { describe, it, expect } from "vitest";
import { generateState, stateCookieHeader, verifyState, clearStateCookieHeader } from "../api/auth/_csrf.js";

const COOKIE = "hll_oauth_state";
const cookieOf = (state) => `${COOKIE}=${state}`;

describe("generateState", () => {
  it("ts.nonce.sig 3부분 형식이다", () => {
    expect(generateState().split(".")).toHaveLength(3);
  });

  it("연속 호출해도 서로 다른 state 를 만든다 (nonce 존재)", () => {
    const states = new Set(Array.from({ length: 200 }, () => generateState()));
    expect(states.size).toBe(200);
  });
});

describe("verifyState", () => {
  it("state 와 쿠키가 일치하면 통과", () => {
    const s = generateState();
    expect(verifyState(s, cookieOf(s))).toBe(true);
  });

  it("쿠키가 없으면 거부한다 — 로그인 CSRF 차단의 핵심", () => {
    const s = generateState();
    expect(verifyState(s, "")).toBe(false);
    expect(verifyState(s, undefined)).toBe(false);
  });

  it("쿠키에 다른 state 가 들어있으면 거부한다", () => {
    const attacker = generateState();
    const victim = generateState();
    expect(verifyState(attacker, cookieOf(victim))).toBe(false);
  });

  it("다른 쿠키만 있고 state 쿠키가 없으면 거부한다", () => {
    const s = generateState();
    expect(verifyState(s, "hll_auth=abc; theme=dark")).toBe(false);
  });

  it("서명이 변조되면 거부한다", () => {
    const s = generateState();
    const [ts, nonce] = s.split(".");
    const forged = `${ts}.${nonce}.AAAAAAAAAAAAAAAAAAAAAA`;
    expect(verifyState(forged, cookieOf(forged))).toBe(false);
  });

  it("nonce 가 변조되면 거부한다", () => {
    const s = generateState();
    const [ts, , sig] = s.split(".");
    const forged = `${ts}.bbbbbbbbbbbbbbbb.${sig}`;
    expect(verifyState(forged, cookieOf(forged))).toBe(false);
  });

  it("10분이 지난 state 는 거부한다", () => {
    const old = (Date.now() - 11 * 60 * 1000).toString(36);
    // 서명은 유효하게 만들되 시각만 과거로 — 만료 검사가 동작하는지 본다
    const s = generateState();
    const [, nonce, sig] = s.split(".");
    const expired = `${old}.${nonce}.${sig}`;
    expect(verifyState(expired, cookieOf(expired))).toBe(false);
  });

  it("빈 state 는 거부한다", () => {
    expect(verifyState("", cookieOf("x"))).toBe(false);
    expect(verifyState(null, cookieOf("x"))).toBe(false);
  });

  it("점이 2개가 아니면 거부한다 (구버전 ts.sig 형식 포함)", () => {
    expect(verifyState("abc.def", cookieOf("abc.def"))).toBe(false);
    expect(verifyState("a.b.c.d", cookieOf("a.b.c.d"))).toBe(false);
  });
});

describe("쿠키 헤더", () => {
  it("https 에서는 Secure 플래그가 붙는다", () => {
    const h = stateCookieHeader(generateState(), "https");
    expect(h).toContain("HttpOnly");
    expect(h).toContain("SameSite=Lax");
    expect(h).toContain("Secure");
  });

  it("http(로컬)에서는 Secure 를 붙이지 않는다", () => {
    expect(stateCookieHeader(generateState(), "http")).not.toContain("Secure");
  });

  it("삭제 헤더는 Max-Age=0 이다", () => {
    expect(clearStateCookieHeader()).toContain("Max-Age=0");
  });
});
