/**
 * 분석 결과 → developmentNotes 변환 어댑터.
 * 각 어댑터는 분석 결과 객체를 받아 [{source, area, title, why, action}, ...] 배열을 반환.
 * 호출 측에서 addDevelopmentNotes(adapter(result)) 형태로 사용.
 *
 * source: "coverage" | "logline" | "coreDesign" | "rewriteDiag"
 */

const LABELS_KR = {
  protagonist: "주인공 설정",
  inciting_incident: "촉발 사건",
  goal: "목표 명확성",
  conflict: "갈등 구조",
  stakes: "스테이크",
  irony: "아이러니/훅",
  mental_picture: "시각적 심상",
  emotional_hook: "감정 훅",
  originality: "독창성",
  conciseness: "간결성",
  active_language: "능동 언어",
  no_violations: "포맷 준수",
  genre_tone: "장르 톤",
  information_gap: "정보 격차",
  cognitive_dissonance: "인지 부조화",
  narrative_transportation: "서사 몰입",
  universal_relatability: "보편 공감",
  unpredictability: "예측 불가",
};

/**
 * Stage 1 로그라인 분석 결과에서 점수가 낮은 항목들을 노트로.
 * 점수가 max의 60% 이하인 항목을 추출.
 */
export function notesFromLoglineAnalysis(result) {
  if (!result || typeof result !== "object") return [];
  const sections = ["structure", "expression", "technical", "interest"];
  const notes = [];
  for (const sec of sections) {
    const data = result[sec];
    if (!data || typeof data !== "object") continue;
    for (const [k, v] of Object.entries(data)) {
      if (!v || typeof v !== "object") continue;
      const score = Number(v.score);
      const max = Number(v.max);
      if (!Number.isFinite(score) || !Number.isFinite(max) || max === 0) continue;
      const ratio = score / max;
      if (ratio > 0.6) continue; // 60%+ 면 OK로 간주
      const fb = (v.feedback || "").trim();
      const label = LABELS_KR[k] || k;
      notes.push({
        source: "logline",
        area: "logline",
        title: `로그라인 ${label} 약함 (${score}/${max})`,
        why: fb.slice(0, 160),
        action: ratio < 0.4
          ? "이 항목을 보완하지 않으면 후속 단계 전체가 흔들립니다. Stage 1로 돌아가 로그라인 자체를 다시 작성하거나 핵심 설계 단계에서 보강하세요."
          : "Stage 1 로그라인 개선 또는 Stage 2 핵심 설계에서 이 항목을 명시적으로 강화하세요.",
        linkedStage: "1",
      });
    }
  }
  return notes;
}

/**
 * Stage 2 핵심 설계의 risk_check 배열을 노트로.
 */
export function notesFromCoreDesign(coreDesignResult) {
  if (!coreDesignResult?.risk_check || !Array.isArray(coreDesignResult.risk_check)) return [];
  return coreDesignResult.risk_check
    .filter(r => typeof r === "string" && r.trim())
    .map((risk, i) => ({
      source: "coreDesign",
      area: "coreDesign",
      title: risk.length > 60 ? risk.slice(0, 57) + "…" : risk,
      why: risk.length > 60 ? risk : "",
      action: "Stage 2 핵심 설계에서 작가 피드백으로 다듬거나, Stage 4 시놉시스 단계에서 의식적으로 보완하세요.",
      linkedStage: "2",
    }));
}

/**
 * Stage 7 Script Coverage 결과의 weaknesses와 카테고리 점수가 낮은 항목을 노트로.
 */
export function notesFromCoverage(coverage) {
  if (!coverage || typeof coverage !== "object") return [];
  const notes = [];

  // weaknesses 배열
  if (Array.isArray(coverage.weaknesses)) {
    coverage.weaknesses.forEach((w) => {
      const text = typeof w === "string" ? w : (w?.issue || w?.text || w?.description || "");
      if (!text || typeof text !== "string" || !text.trim()) return;
      const action = typeof w === "object" ? (w?.suggestion || w?.fix || w?.recommendation || "") : "";
      notes.push({
        source: "coverage",
        area: typeof w === "object" && w?.area ? w.area : "draft",
        title: text.length > 60 ? text.slice(0, 57) + "…" : text,
        why: text.length > 60 ? text : "",
        action: action || "Stage 8 고쳐쓰기에서 부분 재작성 또는 전면 개고로 처리하세요.",
        linkedStage: "8",
      });
    });
  }

  // 카테고리별 낮은 점수 (예: structure_score, character_score 등)
  const categoryMap = {
    structure_score: { area: "structure", label: "구조" },
    character_score: { area: "character", label: "캐릭터" },
    dialogue_score: { area: "draft", label: "대사" },
    theme_score: { area: "theme", label: "테마" },
    pacing_score: { area: "draft", label: "페이싱" },
    market_score: { area: "draft", label: "시장성" },
  };
  for (const [key, meta] of Object.entries(categoryMap)) {
    const score = Number(coverage[key]);
    if (Number.isFinite(score) && score > 0 && score < 6) {
      notes.push({
        source: "coverage",
        area: meta.area,
        title: `Coverage ${meta.label} 점수 낮음 (${score}/10)`,
        why: coverage[`${key}_feedback`] || "이 영역의 완성도가 시장 기준 미달.",
        action: `Stage 8 고쳐쓰기에서 ${meta.label} 영역 우선 보강.`,
        linkedStage: "8",
      });
    }
  }

  return notes;
}

/**
 * Stage 8 rewriteDiag 결과를 노트로 (issues / priorities 등).
 */
export function notesFromRewriteDiag(diag) {
  if (!diag || typeof diag !== "object") return [];
  const notes = [];

  // priorities (rank 순서대로)
  if (Array.isArray(diag.priorities)) {
    diag.priorities.forEach((p) => {
      if (!p || typeof p !== "object") return;
      const title = p.issue || p.area || p.title;
      if (!title) return;
      notes.push({
        source: "rewriteDiag",
        area: p.area === "캐릭터" ? "character" : p.area === "구조" ? "structure" : p.area === "대사" ? "draft" : "draft",
        title: typeof title === "string" ? title : String(title),
        why: p.issue || "",
        action: p.action || "Stage 8 부분 재작성 또는 전면 개고로 처리.",
        linkedStage: "8",
      });
    });
  }

  // issues 배열
  if (Array.isArray(diag.issues)) {
    diag.issues.forEach((iss) => {
      const text = typeof iss === "string" ? iss : (iss?.text || iss?.description || "");
      if (!text || !text.trim()) return;
      notes.push({
        source: "rewriteDiag",
        area: "draft",
        title: text.length > 60 ? text.slice(0, 57) + "…" : text,
        why: text.length > 60 ? text : "",
        action: "Stage 8 고쳐쓰기에서 처리.",
        linkedStage: "8",
      });
    });
  }

  return notes;
}
