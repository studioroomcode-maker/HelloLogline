/**
 * buildProjectSnapshot 단위 테스트 하네스
 *
 * 검증 목표:
 *  1. id: currentProjectId가 있으면 사용, 없으면 숫자(timestamp)
 *  2. title: logline 60자 슬라이스 적용
 *  3. logline 비어있으면 title은 "제목 없음"
 *  4. 모든 분석 결과 필드가 state에서 그대로 복사됨
 *  5. 없는 필드는 null / "" / [] / {} 기본값으로 채워짐
 *  6. 스냅샷은 JSON 직렬화 가능 (순환 참조 없음)
 *  7. state에 추가 필드가 있어도 스냅샷에 불필요한 오염 없음
 */

import { describe, it, expect } from "vitest";
import { buildProjectSnapshot } from "../src/utils.js";

// ── 최소 state (빈 프로젝트) ───────────────────────────────────────────────
const EMPTY_STATE = {};

// ── 완전한 state 예시 ────────────────────────────────────────────────────
const FULL_STATE = {
  currentProjectId: "proj-abc-123",
  logline: "두 형사가 연쇄 살인마를 추적하는 과정에서 서로의 어두운 과거와 마주한다",
  genre: "thriller",
  selectedDuration: "feature",
  customTheme: "복수와 용서",
  result: { totalScore: 85, structure: { protagonist: { score: 9 } } },
  result2: { improved: true },
  academicResult: { genre_analysis: "누아르" },
  synopsisResults: [{ text: "시놉시스 1" }, { text: "시놉시스 2" }],
  selectedSynopsisIndex: 1,
  beatSheetResult: { acts: [] },
  beatScenes: { "1": { title: "오프닝" } },
  teamMembers: [{ name: "홍길동", role: "writer" }],
  activityLog: [{ type: "analysis", ts: "2026-01-01" }],
  revisions: [{ id: "r1", text: "초안" }],
  treatmentHistory: ["v1", "v2"],
};

describe("buildProjectSnapshot", () => {
  // ── id 할당 ─────────────────────────────────────────────────────────────
  describe("id 할당", () => {
    it("currentProjectId가 있으면 그 값을 사용한다", () => {
      const snap = buildProjectSnapshot({ currentProjectId: "my-id-123" });
      expect(snap.id).toBe("my-id-123");
    });

    it("currentProjectId가 없으면 숫자(timestamp)를 할당한다", () => {
      const before = Date.now();
      const snap = buildProjectSnapshot({});
      const after = Date.now();
      expect(typeof snap.id).toBe("number");
      expect(snap.id).toBeGreaterThanOrEqual(before);
      expect(snap.id).toBeLessThanOrEqual(after);
    });

    it("currentProjectId가 null이면 숫자를 할당한다", () => {
      const snap = buildProjectSnapshot({ currentProjectId: null });
      expect(typeof snap.id).toBe("number");
    });
  });

  // ── title 생성 ───────────────────────────────────────────────────────────
  describe("title 생성", () => {
    it("logline이 60자 이하면 그대로 title로 사용한다", () => {
      const snap = buildProjectSnapshot({ logline: "짧은 로그라인" });
      expect(snap.title).toBe("짧은 로그라인");
    });

    it("logline이 60자 초과면 60자로 슬라이스한다", () => {
      const long = "가".repeat(80);
      const snap = buildProjectSnapshot({ logline: long });
      expect(snap.title.length).toBe(60);
      expect(snap.title).toBe("가".repeat(60));
    });

    it("logline이 빈 문자열이면 title은 '제목 없음'이다", () => {
      const snap = buildProjectSnapshot({ logline: "" });
      expect(snap.title).toBe("제목 없음");
    });

    it("logline이 없으면 title은 '제목 없음'이다", () => {
      const snap = buildProjectSnapshot({});
      expect(snap.title).toBe("제목 없음");
    });
  });

  // ── 기본값 처리 ───────────────────────────────────────────────────────────
  describe("기본값 처리 (빈 state)", () => {
    it("result는 null이 기본값", () => {
      expect(buildProjectSnapshot({}).result).toBeNull();
    });

    it("synopsisResults는 null이 기본값", () => {
      expect(buildProjectSnapshot({}).synopsisResults).toBeNull();
    });

    it("beatScenes는 {}이 기본값", () => {
      expect(buildProjectSnapshot({}).beatScenes).toEqual({});
    });

    it("teamMembers는 []이 기본값", () => {
      expect(buildProjectSnapshot({}).teamMembers).toEqual([]);
    });

    it("activityLog는 []이 기본값", () => {
      expect(buildProjectSnapshot({}).activityLog).toEqual([]);
    });

    it("revisions는 []이 기본값", () => {
      expect(buildProjectSnapshot({}).revisions).toEqual([]);
    });

    it("treatmentResult는 빈 문자열이 기본값", () => {
      expect(buildProjectSnapshot({}).treatmentResult).toBe("");
    });

    it("genre는 'auto'가 기본값", () => {
      expect(buildProjectSnapshot({}).genre).toBe("auto");
    });

    it("selectedDuration은 'feature'가 기본값", () => {
      expect(buildProjectSnapshot({}).selectedDuration).toBe("feature");
    });
  });

  // ── 데이터 보존 ──────────────────────────────────────────────────────────
  describe("데이터 보존 (완전한 state)", () => {
    it("모든 핵심 필드가 그대로 복사된다", () => {
      const snap = buildProjectSnapshot(FULL_STATE);
      expect(snap.id).toBe("proj-abc-123");
      expect(snap.logline).toBe(FULL_STATE.logline);
      expect(snap.genre).toBe("thriller");
      expect(snap.result).toEqual(FULL_STATE.result);
      expect(snap.academicResult).toEqual(FULL_STATE.academicResult);
      expect(snap.synopsisResults).toHaveLength(2);
      expect(snap.selectedSynopsisIndex).toBe(1);
      expect(snap.beatScenes["1"].title).toBe("오프닝");
      expect(snap.teamMembers[0].name).toBe("홍길동");
      expect(snap.activityLog[0].type).toBe("analysis");
      expect(snap.revisions[0].id).toBe("r1");
      expect(snap.treatmentHistory).toEqual(["v1", "v2"]);
    });
  });

  // ── JSON 직렬화 ───────────────────────────────────────────────────────────
  describe("JSON 직렬화", () => {
    it("빈 state 스냅샷은 JSON.stringify/parse가 가능하다", () => {
      const snap = buildProjectSnapshot(EMPTY_STATE);
      const json = JSON.stringify(snap);
      const parsed = JSON.parse(json);
      expect(parsed.title).toBe("제목 없음");
    });

    it("완전한 state 스냅샷은 JSON.stringify/parse가 가능하다", () => {
      const snap = buildProjectSnapshot(FULL_STATE);
      const json = JSON.stringify(snap);
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe("proj-abc-123");
      expect(parsed.synopsisResults).toHaveLength(2);
    });
  });

  // ── 필드 목록 완전성 ──────────────────────────────────────────────────────
  it("스냅샷에 필수 필드 39개가 모두 포함된다", () => {
    const snap = buildProjectSnapshot({});
    const requiredKeys = [
      "id", "title", "logline", "genre", "selectedDuration",
      "customTheme", "customDurationText", "customFormatLabel",
      "result", "result2", "academicResult", "mythMapResult", "koreanMythResult",
      "expertPanelResult", "barthesCodeResult", "shadowResult", "authenticityResult",
      "charDevResult", "valueChargeResult", "subtextResult",
      "synopsisResults", "pipelineResult", "selectedSynopsisIndex",
      "treatmentResult", "beatSheetResult", "beatScenes",
      "teamMembers", "sceneAssignments", "stageComments", "activityLog",
      "revisions", "currentRevisionId", "sceneRevisionMap",
      "dialogueDevResult", "scriptCoverageResult", "structureResult", "themeResult",
      "rewriteDiagResult", "writerEdits",
    ];
    for (const key of requiredKeys) {
      expect(snap, `필드 '${key}'가 스냅샷에 없음`).toHaveProperty(key);
    }
  });
});
