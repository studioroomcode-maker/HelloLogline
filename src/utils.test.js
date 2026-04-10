import { describe, it, expect } from "vitest";
import { parseClaudeJson, getGrade, getInterestLevel, calcSectionTotal, formatDate } from "./utils.js";

// ── parseClaudeJson ──────────────────────────────────────────────────────────

describe("parseClaudeJson", () => {
  it("단순한 JSON 객체를 파싱한다", () => {
    const result = parseClaudeJson('{"score": 85, "label": "우수"}');
    expect(result).toEqual({ score: 85, label: "우수" });
  });

  it("마크다운 코드블록을 제거하고 파싱한다", () => {
    const text = "```json\n{\"score\": 72, \"label\": \"양호\"}\n```";
    const result = parseClaudeJson(text);
    expect(result).toEqual({ score: 72, label: "양호" });
  });

  it("JSON 앞뒤의 설명 텍스트를 무시한다", () => {
    const text = '여기 분석 결과입니다:\n{"key": "value"}\n이상입니다.';
    const result = parseClaudeJson(text);
    expect(result).toEqual({ key: "value" });
  });

  it("문자열 내부의 줄바꿈을 이스케이프한다", () => {
    const text = '{"feedback": "첫째 줄\n둘째 줄"}';
    const result = parseClaudeJson(text);
    expect(result.feedback).toContain("첫째 줄");
    expect(result.feedback).toContain("둘째 줄");
  });

  it("중첩 객체를 파싱한다", () => {
    const text = '{"structure": {"protagonist": {"name": "홍길동", "score": 8}}}';
    const result = parseClaudeJson(text);
    expect(result.structure.protagonist.name).toBe("홍길동");
    expect(result.structure.protagonist.score).toBe(8);
  });

  it("배열이 포함된 JSON을 파싱한다", () => {
    const text = '{"tags": ["스릴러", "미스터리", "한국"], "count": 3}';
    const result = parseClaudeJson(text);
    expect(result.tags).toHaveLength(3);
    expect(result.tags[0]).toBe("스릴러");
  });

  it("누락된 쉼표가 있는 JSON을 복구한다", () => {
    // 숫자 다음에 쉼표 누락
    const text = '{"score": 85\n"label": "우수"}';
    const result = parseClaudeJson(text);
    expect(result.score).toBe(85);
    expect(result.label).toBe("우수");
  });

  it("trailing comma가 있는 JSON을 복구한다", () => {
    const text = '{"items": ["a", "b", "c",], "total": 3,}';
    const result = parseClaudeJson(text);
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it("빈 문자열에서 오류를 throw한다", () => {
    // jsonrepair도 복구할 수 없는 완전히 빈 입력
    expect(() => parseClaudeJson("")).toThrow();
  });

  it("한국어 유니코드 문자열을 올바르게 파싱한다", () => {
    const text = '{"제목": "살인의 추억", "장르": "범죄 스릴러", "점수": 95}';
    const result = parseClaudeJson(text);
    expect(result["제목"]).toBe("살인의 추억");
    expect(result["점수"]).toBe(95);
  });

  it("불리언·null 값을 파싱한다", () => {
    const text = '{"active": true, "deprecated": false, "alias": null}';
    const result = parseClaudeJson(text);
    expect(result.active).toBe(true);
    expect(result.deprecated).toBe(false);
    expect(result.alias).toBeNull();
  });
});

// ── getGrade ──────────────────────────────────────────────────────────────────

describe("getGrade", () => {
  it("90 이상은 S 등급", () => {
    expect(getGrade(90).grade).toBe("S");
    expect(getGrade(100).grade).toBe("S");
  });

  it("80~89는 A 등급", () => {
    expect(getGrade(80).grade).toBe("A");
    expect(getGrade(89).grade).toBe("A");
  });

  it("70~79는 B 등급", () => {
    expect(getGrade(70).grade).toBe("B");
  });

  it("60~69는 C 등급", () => {
    expect(getGrade(60).grade).toBe("C");
  });

  it("50~59는 D 등급", () => {
    expect(getGrade(50).grade).toBe("D");
  });

  it("49 이하는 F 등급", () => {
    expect(getGrade(49).grade).toBe("F");
    expect(getGrade(0).grade).toBe("F");
  });
});

// ── calcSectionTotal ──────────────────────────────────────────────────────────

describe("calcSectionTotal", () => {
  it("섹션의 score 합계를 계산한다", () => {
    const result = {
      structure: {
        protagonist: { score: 8 },
        conflict: { score: 7 },
        resolution: { score: 9 },
      },
    };
    expect(calcSectionTotal(result, "structure")).toBe(24);
  });

  it("존재하지 않는 섹션은 0을 반환한다", () => {
    expect(calcSectionTotal({}, "structure")).toBe(0);
    expect(calcSectionTotal(null, "structure")).toBe(0);
  });

  it("score가 없는 항목은 0으로 처리한다", () => {
    const result = {
      structure: {
        a: { score: 5 },
        b: {},
        c: { score: 3 },
      },
    };
    expect(calcSectionTotal(result, "structure")).toBe(8);
  });
});
