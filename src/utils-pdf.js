/**
 * HelloLogline PDF 내보내기 유틸리티
 * 브라우저 네이티브 인쇄(Print to PDF)를 사용 — 벡터 텍스트, 정확한 A4 레이아웃
 */

function calcSectionTotal(result, section) {
  if (!result?.[section]) return 0;
  return Object.values(result[section]).reduce((sum, item) => sum + (item?.score || 0), 0);
}

function getGradeLabel(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

// ── 공통 헬퍼 ─────────────────────────────────────────────────────────────────

function scoreBar(label, score, maxScore = 10, color = "#4ECCA3") {
  const pct = maxScore ? Math.round((score / maxScore) * 100) : 0;
  const gradeColors = { 9: "#4ECCA3", 8: "#60A5FA", 7: "#C8A84B", 6: "#FB923C", 5: "#FB923C" };
  const barColor = score >= 9 ? "#4ECCA3" : score >= 8 ? "#60A5FA" : score >= 7 ? "#C8A84B" : score >= 5 ? "#FB923C" : "#E85D75";
  return `
    <div style="display:flex;align-items:center;gap:10pt;margin-bottom:4pt;page-break-inside:avoid;">
      <div style="min-width:110pt;font-size:8pt;color:#555;line-height:1.4;">${label}</div>
      <div style="flex:1;height:5pt;background:#ebebeb;border-radius:3pt;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3pt;"></div>
      </div>
      <div style="min-width:22pt;text-align:right;font-size:8.5pt;font-weight:700;color:#1a1a2e;font-family:'Courier New',monospace;">${score}</div>
    </div>`;
}

function kv(label, value) {
  if (!value) return "";
  return `<div style="margin-bottom:5pt;display:flex;gap:6pt;align-items:baseline;">
    <span style="min-width:90pt;font-size:7.5pt;color:#888;flex-shrink:0;">${label}</span>
    <span style="font-size:9pt;color:#1a1a2e;line-height:1.6;">${value}</span>
  </div>`;
}

function sectionHeader(title, subtitle, accentColor = "#4ECCA3") {
  return `
    <div style="border-left:4pt solid ${accentColor};padding-left:10pt;margin-bottom:12pt;page-break-after:avoid;">
      <div style="font-size:7pt;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:2px;margin-bottom:2pt;">${subtitle || ""}</div>
      <div style="font-size:13pt;font-weight:800;color:#1a1a2e;">${title}</div>
    </div>`;
}

function infoBox(title, content, accentColor = "#4ECCA3") {
  if (!content) return "";
  return `<div style="border:1pt solid ${accentColor}30;border-radius:5pt;padding:9pt 11pt;background:${accentColor}06;margin-bottom:8pt;page-break-inside:avoid;">
    ${title ? `<div style="font-size:7pt;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:5pt;">${title}</div>` : ""}
    <div style="font-size:9pt;color:#1a1a2e;line-height:1.75;">${content}</div>
  </div>`;
}

function chip(label, value, color = "#4ECCA3") {
  if (!value) return "";
  return `<span style="display:inline-block;padding:2pt 8pt;border-radius:12pt;border:1pt solid ${color}40;background:${color}10;font-size:7.5pt;font-weight:700;color:${color};margin-right:5pt;margin-bottom:4pt;">${label}: ${value}</span>`;
}

// ── 메인 HTML 빌더 ─────────────────────────────────────────────────────────────

function buildPdfHtml({
  logline = "",
  genre = "",
  result,
  charDevResult,
  shadowResult,
  authenticityResult,
  synopsisResults,
  pipelineResult,
  structureResult,
  valueChargeResult,
  treatmentResult,
  beatSheetResult,
  scenarioDraftResult,
  rewriteDiagResult,
  scriptCoverageResult,
  valuationResult,
}) {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const qualScore = result
    ? calcSectionTotal(result, "structure") + calcSectionTotal(result, "expression") + calcSectionTotal(result, "technical")
    : null;
  const intScore = result ? calcSectionTotal(result, "interest") : null;
  const qualGrade = qualScore != null ? getGradeLabel(qualScore) : "—";
  const intGrade = intScore != null ? getGradeLabel(intScore) : "—";

  const synopsisText =
    pipelineResult?.synopsis ||
    synopsisResults?.synopses?.[0]?.synopsis || "";

  // ── 표지 ──────────────────────────────────────────────────────────────────
  const scoreChips = [
    qualScore != null ? `품질 <strong>${qualScore}점</strong> (${qualGrade}등급)` : null,
    intScore != null ? `흥미도 <strong>${intScore}점</strong>` : null,
    scriptCoverageResult?.verdict ? `Coverage <strong>${scriptCoverageResult.verdict}</strong>` : null,
  ].filter(Boolean);

  const cover = `
    <div style="height:250mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;">
      <!-- 상단 배지 -->
      <div>
        <div style="font-size:7pt;font-weight:700;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:24pt;">
          HELLOLOGLINE · AI 시나리오 개발 리포트
        </div>

        <!-- 주 제목 -->
        <div style="font-size:11pt;font-weight:400;color:#888;margin-bottom:8pt;letter-spacing:0.5px;">로그라인</div>
        <div style="font-size:16pt;font-weight:800;color:#1a1a2e;line-height:1.5;max-width:440pt;margin-bottom:24pt;word-break:keep-all;">
          ${logline}
        </div>

        <!-- 핵심 지표 칩 -->
        ${scoreChips.length > 0 ? `<div style="margin-bottom:24pt;">${scoreChips.map(c => `<span style="display:inline-block;padding:4pt 10pt;border:1.5pt solid #1a1a2e20;border-radius:20pt;font-size:8.5pt;color:#444;margin-right:6pt;margin-bottom:6pt;background:#f7f7f7;">${c}</span>`).join("")}</div>` : ""}

        <!-- 구분선 -->
        <div style="height:2pt;background:linear-gradient(90deg,#1a1a2e,#ccc);width:100%;margin-bottom:20pt;"></div>

        <!-- 메타 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8pt;">
          ${genre && genre !== "auto" ? `
          <div>
            <div style="font-size:7pt;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:3pt;">장르</div>
            <div style="font-size:10pt;font-weight:700;color:#1a1a2e;">${genre}</div>
          </div>` : ""}
          <div>
            <div style="font-size:7pt;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:3pt;">생성일</div>
            <div style="font-size:10pt;font-weight:700;color:#1a1a2e;">${today}</div>
          </div>
          ${qualScore != null ? `
          <div>
            <div style="font-size:7pt;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:3pt;">품질 점수</div>
            <div style="font-size:10pt;font-weight:700;color:#1a1a2e;">${qualScore}점 · ${qualGrade}등급</div>
          </div>` : ""}
          ${scriptCoverageResult?.verdict ? `
          <div>
            <div style="font-size:7pt;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:3pt;">Coverage</div>
            <div style="font-size:10pt;font-weight:700;color:${scriptCoverageResult.verdict === "RECOMMEND" ? "#1a7a4a" : scriptCoverageResult.verdict === "CONSIDER" ? "#7a5a1a" : "#7a1a1a"};">${scriptCoverageResult.verdict}</div>
          </div>` : ""}
        </div>
      </div>

      <!-- 하단 -->
      <div style="font-size:7.5pt;color:#bbb;letter-spacing:1px;">
        hellologline.com · AI 시나리오 개발 워크스테이션
      </div>
    </div>`;

  // ── Stage 1: 로그라인 분석 ─────────────────────────────────────────────────
  let s1 = "";
  if (result) {
    const LABELS = {
      protagonist: "주인공 설정",
      inciting_incident: "촉발 사건",
      goal: "목표 명확성",
      conflict: "갈등 구조",
      stakes: "위험 요소",
      irony: "아이러니",
      mental_picture: "시각적 이미지",
      emotional_hook: "감정 훅",
      originality: "독창성",
      conciseness: "간결성",
      active_language: "능동 언어",
      no_violations: "포맷 준수",
      genre_tone: "장르 톤",
      information_gap: "정보 격차",
      cognitive_dissonance: "인지 충돌",
      narrative_transportation: "서사 몰입",
      universal_relatability: "보편 공감",
      unpredictability: "예측 불가",
    };

    const structEntries = Object.entries(result.structure || {}).map(([k, v]) =>
      scoreBar(LABELS[k] || k, v?.score, 10));
    const exprEntries = Object.entries(result.expression || {}).map(([k, v]) =>
      scoreBar(LABELS[k] || k, v?.score, 10));
    const techEntries = Object.entries(result.technical || {}).map(([k, v]) =>
      scoreBar(LABELS[k] || k, v?.score, 10));
    const intEntries = Object.entries(result.interest || {}).map(([k, v]) =>
      scoreBar(LABELS[k] || k, v?.score, 10));

    s1 = `
    <div style="page-break-before:always;">
      ${sectionHeader("로그라인 분석", "Stage 01")}

      <!-- 점수 카드 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin-bottom:14pt;">
        <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:12pt;text-align:center;background:#f9f9f9;">
          <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:5pt;">품질 점수</div>
          <div style="font-size:28pt;font-weight:800;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1;">${qualScore}</div>
          <div style="font-size:8pt;color:#888;margin-top:4pt;">등급: ${qualGrade}</div>
        </div>
        <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:12pt;text-align:center;background:#f9f9f9;">
          <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:5pt;">흥미도</div>
          <div style="font-size:28pt;font-weight:800;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1;">${intScore}</div>
          <div style="font-size:8pt;color:#888;margin-top:4pt;">등급: ${intGrade}</div>
        </div>
      </div>

      <!-- 세부 점수 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16pt;margin-bottom:14pt;">
        <div>
          <div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:7pt;padding-bottom:4pt;border-bottom:1pt solid #eee;">구조적 완성도</div>
          ${structEntries.join("")}
        </div>
        <div>
          <div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:7pt;padding-bottom:4pt;border-bottom:1pt solid #eee;">표현 기술</div>
          ${exprEntries.join("")}
        </div>
        <div>
          <div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:7pt;padding-bottom:4pt;border-bottom:1pt solid #eee;">기술적 완성도</div>
          ${techEntries.join("")}
        </div>
        <div>
          <div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:7pt;padding-bottom:4pt;border-bottom:1pt solid #eee;">흥미도 지표</div>
          ${intEntries.join("")}
        </div>
      </div>

      ${result.overall_feedback ? infoBox("종합 피드백", result.overall_feedback) : ""}
    </div>`;
  }

  // ── Stage 3: 캐릭터 ────────────────────────────────────────────────────────
  let s3 = "";
  const protagonist = charDevResult?.protagonist;
  if (protagonist) {
    const supporting = charDevResult.supporting_characters || [];
    s3 = `
    <div style="page-break-before:always;">
      ${sectionHeader("캐릭터 분석", "Stage 03", "#FB923C")}

      <!-- 주인공 -->
      <div style="border:1pt solid #FB923C30;border-radius:6pt;padding:12pt 14pt;background:#FB923C06;margin-bottom:10pt;page-break-inside:avoid;">
        <div style="font-size:8pt;font-weight:700;color:#FB923C;text-transform:uppercase;letter-spacing:1px;margin-bottom:8pt;">주인공</div>
        ${kv("이름/유형", protagonist.name_suggestion || protagonist.name)}
        ${kv("외적 목표 (Want)", protagonist.want)}
        ${kv("내적 욕구 (Need)", protagonist.need)}
        ${kv("핵심 결함 (Flaw)", protagonist.flaw)}
        ${kv("변화 호 (Arc)", protagonist.arc_type)}
        ${kv("직업/배경", protagonist.occupation || protagonist.background)}
      </div>

      ${charDevResult.moral_argument ? infoBox("도덕적 논거", charDevResult.moral_argument, "#FB923C") : ""}

      ${supporting.length > 0 ? `
      <div style="margin-top:10pt;">
        <div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:7pt;padding-bottom:4pt;border-bottom:1pt solid #eee;">조연 캐릭터</div>
        <div style="display:grid;grid-template-columns:${supporting.length > 2 ? "1fr 1fr" : "1fr 1fr"};gap:8pt;">
          ${supporting.slice(0, 4).map(c => `
          <div style="border:1pt solid #e0e0e0;border-radius:5pt;padding:9pt 11pt;background:#f9f9f9;page-break-inside:avoid;">
            <div style="font-size:9pt;font-weight:700;color:#1a1a2e;margin-bottom:5pt;">${c.name || "—"}</div>
            ${c.role ? `<div style="font-size:8pt;color:#888;margin-bottom:3pt;">${c.role}</div>` : ""}
            ${c.relation ? `<div style="font-size:7.5pt;color:#aaa;">${c.relation}</div>` : ""}
          </div>`).join("")}
        </div>
      </div>` : ""}

      ${shadowResult?.shadow_self ? infoBox("융 그림자 분석", shadowResult.shadow_self, "#A78BFA") : ""}
      ${authenticityResult?.verdict ? infoBox("실존 진정성", `${authenticityResult.verdict}${authenticityResult.summary ? " — " + authenticityResult.summary : ""}`, "#60A5FA") : ""}
    </div>`;
  }

  // ── Stage 4: 시놉시스 + 구조 ──────────────────────────────────────────────
  let s4 = "";
  if (synopsisText || structureResult) {
    const dirTitle = pipelineResult?.direction_title || synopsisResults?.synopses?.[0]?.direction_title || "";
    const theme = pipelineResult?.theme || synopsisResults?.synopses?.[0]?.theme || "";
    const keyScenes = pipelineResult?.key_scenes || synopsisResults?.synopses?.[0]?.key_scenes || [];

    s4 = `
    <div style="page-break-before:always;">
      ${sectionHeader("시놉시스 / 구조 분석", "Stage 04", "#4ECCA3")}

      ${dirTitle ? `<div style="font-size:11pt;font-weight:700;color:#1a1a2e;margin-bottom:6pt;">${dirTitle}</div>` : ""}
      ${theme ? `<div style="font-size:9pt;color:#666;margin-bottom:10pt;">테마: ${theme}</div>` : ""}

      ${synopsisText ? `
      <div style="border-left:3pt solid #4ECCA3;padding-left:12pt;margin-bottom:12pt;">
        <div style="font-size:9.5pt;color:#1a1a2e;line-height:1.85;word-break:keep-all;">${synopsisText}</div>
      </div>` : ""}

      ${keyScenes.length > 0 ? `
      <div style="margin-bottom:12pt;">
        <div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:7pt;padding-bottom:4pt;border-bottom:1pt solid #eee;">핵심 장면</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6pt;">
          ${keyScenes.slice(0, 6).map((sc, i) => {
            const scName = typeof sc === "string" ? sc : (sc.scene || sc.title || sc.name || JSON.stringify(sc));
            return `<div style="border:1pt solid #e0e0e0;border-radius:4pt;padding:7pt 9pt;background:#f9f9f9;page-break-inside:avoid;">
              <div style="font-size:7pt;font-weight:700;color:#4ECCA3;margin-bottom:3pt;">SCENE ${i + 1}</div>
              <div style="font-size:8pt;color:#1a1a2e;line-height:1.55;">${scName}</div>
            </div>`;
          }).join("")}
        </div>
      </div>` : ""}

      ${structureResult ? `
      <div style="margin-top:10pt;">
        <div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:7pt;padding-bottom:4pt;border-bottom:1pt solid #eee;">구조 분석</div>
        ${structureResult.act1_summary ? kv("1막", structureResult.act1_summary) : ""}
        ${structureResult.act2_summary ? kv("2막", structureResult.act2_summary) : ""}
        ${structureResult.act3_summary ? kv("3막", structureResult.act3_summary) : ""}
        ${structureResult.midpoint ? kv("미드포인트", structureResult.midpoint) : ""}
        ${structureResult.all_is_lost ? kv("모든 것을 잃다", structureResult.all_is_lost) : ""}
      </div>` : ""}
    </div>`;
  }

  // ── Stage 5: 트리트먼트 ────────────────────────────────────────────────────
  let s5 = "";
  if (treatmentResult) {
    const MAX_CHARS = 3500;
    const truncated = treatmentResult.length > MAX_CHARS;
    s5 = `
    <div style="page-break-before:always;">
      ${sectionHeader("트리트먼트", "Stage 05", "#C8A84B")}
      <div style="font-size:9pt;color:#1a1a2e;line-height:1.85;white-space:pre-wrap;word-break:keep-all;">
        ${treatmentResult.slice(0, MAX_CHARS)}${truncated ? "\n\n[...이하 생략]" : ""}
      </div>
    </div>`;
  }

  // ── Stage 7: Script Coverage ───────────────────────────────────────────────
  let s7 = "";
  if (scriptCoverageResult) {
    const cv = scriptCoverageResult;
    const verdictColor = cv.verdict === "RECOMMEND" ? "#1a7a4a" : cv.verdict === "CONSIDER" ? "#7a5a1a" : "#7a1a1a";
    const verdictKr = { RECOMMEND: "추천", CONSIDER: "검토", PASS: "보류" }[cv.verdict] || cv.verdict;

    const cvScoreFields = {
      premise_score: "전제/아이디어",
      structure_score: "구조",
      character_score: "캐릭터",
      dialogue_score: "대사",
      tone_score: "톤/분위기",
      marketability_score: "상업성",
    };

    s7 = `
    <div style="page-break-before:always;">
      ${sectionHeader("Script Coverage", "Stage 07", "#60A5FA")}

      <!-- 판정 -->
      <div style="border:2pt solid ${verdictColor};border-radius:8pt;padding:14pt 18pt;background:${verdictColor}08;margin-bottom:14pt;display:flex;align-items:center;gap:20pt;page-break-inside:avoid;">
        <div style="text-align:center;flex-shrink:0;">
          <div style="font-size:22pt;font-weight:800;color:${verdictColor};font-family:'Courier New',monospace;line-height:1;">${verdictKr}</div>
          <div style="font-size:7pt;color:${verdictColor};text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">${cv.verdict}</div>
        </div>
        ${cv.logline_score != null ? `
        <div style="text-align:center;flex-shrink:0;border-left:1pt solid ${verdictColor}30;padding-left:20pt;">
          <div style="font-size:22pt;font-weight:800;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1;">${cv.logline_score}</div>
          <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">/ 100</div>
        </div>` : ""}
        ${cv.summary ? `<div style="font-size:9pt;color:#333;line-height:1.7;flex:1;">${cv.summary}</div>` : ""}
      </div>

      <!-- 세부 점수 -->
      ${Object.entries(cvScoreFields).some(([k]) => cv[k] != null) ? `
      <div style="margin-bottom:14pt;">
        <div style="font-size:7pt;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:7pt;padding-bottom:4pt;border-bottom:1pt solid #eee;">세부 평가</div>
        ${Object.entries(cvScoreFields).map(([k, label]) =>
          cv[k] != null ? scoreBar(label, cv[k], 10, "#60A5FA") : ""
        ).join("")}
      </div>` : ""}

      <!-- 강점 / 약점 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin-bottom:10pt;">
        ${(cv.strengths || []).length > 0 ? `
        <div style="border:1pt solid #4ECCA330;border-radius:5pt;padding:10pt;background:#4ECCA306;">
          <div style="font-size:7pt;font-weight:700;color:#4ECCA3;text-transform:uppercase;letter-spacing:1px;margin-bottom:6pt;">강점</div>
          ${cv.strengths.map(s => `<div style="font-size:8.5pt;color:#1a1a2e;margin-bottom:3pt;padding-left:8pt;position:relative;"><span style="position:absolute;left:0;color:#4ECCA3;">✓</span>${s}</div>`).join("")}
        </div>` : ""}
        ${(cv.weaknesses || []).length > 0 ? `
        <div style="border:1pt solid #E85D7530;border-radius:5pt;padding:10pt;background:#E85D7506;">
          <div style="font-size:7pt;font-weight:700;color:#E85D75;text-transform:uppercase;letter-spacing:1px;margin-bottom:6pt;">개선 사항</div>
          ${cv.weaknesses.map(s => `<div style="font-size:8.5pt;color:#1a1a2e;margin-bottom:3pt;padding-left:8pt;position:relative;"><span style="position:absolute;left:0;color:#E85D75;">•</span>${s}</div>`).join("")}
        </div>` : ""}
      </div>

      ${cv.recommendation ? infoBox("최종 제언", cv.recommendation, "#60A5FA") : ""}
    </div>`;
  }

  // ── Stage 7: 시장 가치 ─────────────────────────────────────────────────────
  let s7v = "";
  if (valuationResult) {
    const vl = valuationResult;
    s7v = `
    <div style="page-break-before:always;">
      ${sectionHeader("시장 가치 평가", "Stage 07", "#C8A84B")}

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8pt;margin-bottom:14pt;">
        ${vl.market_value_score != null ? `
        <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:10pt;text-align:center;background:#f9f9f9;">
          <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4pt;">시장 가치</div>
          <div style="font-size:22pt;font-weight:800;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1;">${vl.market_value_score}</div>
          <div style="font-size:7.5pt;color:#aaa;margin-top:3pt;">/ 10</div>
        </div>` : ""}
        ${vl.investment_grade ? `
        <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:10pt;text-align:center;background:#f9f9f9;">
          <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4pt;">투자 등급</div>
          <div style="font-size:16pt;font-weight:800;color:#C8A84B;font-family:'Courier New',monospace;line-height:1.2;margin-top:4pt;">${vl.investment_grade}</div>
        </div>` : ""}
        ${vl.comparable_budget ? `
        <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:10pt;text-align:center;background:#f9f9f9;">
          <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4pt;">유사 예산 규모</div>
          <div style="font-size:10pt;font-weight:700;color:#1a1a2e;margin-top:6pt;">${vl.comparable_budget}</div>
        </div>` : ""}
      </div>

      ${vl.target_platform ? kv("최적 플랫폼", vl.target_platform) : ""}
      ${vl.target_audience ? kv("핵심 타겟", vl.target_audience) : ""}
      ${vl.development_notes ? infoBox("개발 제언", vl.development_notes, "#C8A84B") : ""}
    </div>`;
  }

  // ── Stage 6: 시나리오 초고 (마지막 — 길이 제한) ───────────────────────────
  let s6 = "";
  if (scenarioDraftResult) {
    const MAX = 5000;
    const truncated = scenarioDraftResult.length > MAX;
    s6 = `
    <div style="page-break-before:always;">
      ${sectionHeader("시나리오 초고", "Stage 06", "#A78BFA")}
      <div style="font-size:8.5pt;color:#1a1a2e;line-height:1.9;white-space:pre-wrap;word-break:break-word;font-family:'Courier New',monospace;">
        ${scenarioDraftResult.slice(0, MAX)}${truncated ? "\n\nFADE OUT.\n[...이하 생략]" : ""}
      </div>
    </div>`;
  }

  // ── 전체 조합 ──────────────────────────────────────────────────────────────
  const sections = [cover, s1, s3, s4, s5, s7, s7v, s6].filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>HelloLogline 분석 리포트 — ${logline.slice(0, 30) || "문서"}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 20mm 20mm 20mm;
    @bottom-right {
      content: counter(page);
      font-size: 8pt;
      color: #bbb;
      font-family: 'Courier New', monospace;
    }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: "Malgun Gothic", "AppleGothic", "NanumGothic", sans-serif;
    font-size: 9.5pt;
    color: #1a1a2e;
    background: #fff;
    line-height: 1.75;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    word-break: keep-all;
  }

  /* 섹션이 페이지 경계에서 고아 방지 */
  div { orphans: 2; widows: 2; }

  /* 페이지 넘김 허용 구간 */
  .allow-break { page-break-inside: auto !important; }
</style>
</head>
<body>
${sections}
</body>
</html>`;
}

// ── 공개 API ──────────────────────────────────────────────────────────────────

/**
 * 분석 결과를 브라우저 인쇄 다이얼로그로 내보냅니다.
 * 브라우저의 "PDF로 저장" 기능을 통해 A4 벡터 PDF가 생성됩니다.
 */
export async function exportToPdf(data, filename = "hellologline-report") {
  const htmlString = buildPdfHtml(data);
  await downloadHtmlAsPdf(htmlString, filename);
}

/**
 * 분석 결과를 Markdown 문서로 내보냅니다
 */
export function exportToMarkdown(data, filename = "hellologline-report") {
  const {
    logline = "", genre = "", result, charDevResult,
    synopsisResults, pipelineResult, treatmentResult,
    beatSheetResult, scenarioDraftResult, scriptCoverageResult, valuationResult,
  } = data;

  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const synopsisText = pipelineResult?.synopsis || synopsisResults?.synopses?.[0]?.synopsis || "";

  const lines = [];
  lines.push(`# HelloLogline 분석 리포트`);
  lines.push(`> 생성일: ${today}\n`);
  lines.push(`## 로그라인\n> ${logline}\n`);

  if (result) {
    const qualScore = calcSectionTotal(result, "structure") + calcSectionTotal(result, "expression") + calcSectionTotal(result, "technical");
    const intScore = calcSectionTotal(result, "interest");
    lines.push(`## 분석 점수`);
    lines.push(`- 품질 점수: **${qualScore}점**`);
    lines.push(`- 흥미도: **${intScore}점**`);
    if (result.overall_feedback) lines.push(`\n### 종합 피드백\n${result.overall_feedback}`);
    lines.push("");
  }

  if (charDevResult?.protagonist) {
    const p = charDevResult.protagonist;
    lines.push(`## 캐릭터 분석`);
    lines.push(`### 주인공: ${p.name_suggestion || p.name || "—"}`);
    if (p.want) lines.push(`- **외적 목표 (Want):** ${p.want}`);
    if (p.need) lines.push(`- **내적 욕구 (Need):** ${p.need}`);
    if (p.flaw) lines.push(`- **핵심 결함:** ${p.flaw}`);
    if (p.arc_type) lines.push(`- **변화 호 (Arc):** ${p.arc_type}`);
    if (charDevResult.moral_argument) lines.push(`\n**도덕적 논거:** ${charDevResult.moral_argument}`);
    lines.push("");
  }

  if (synopsisText) lines.push(`## 시놉시스\n${synopsisText}\n`);
  if (treatmentResult) lines.push(`## 트리트먼트\n${treatmentResult}\n`);

  if (beatSheetResult?.beats?.length) {
    lines.push(`## 비트 시트`);
    beatSheetResult.beats.forEach(b => {
      lines.push(`### ${b.name_kr || b.name} (p.${b.page_start || "?"})`);
      lines.push(b.summary || "");
      if (b.key_elements?.length) lines.push(`- ${b.key_elements.join("\n- ")}`);
    });
    lines.push("");
  }

  if (scenarioDraftResult) lines.push(`## 시나리오 초고\n\`\`\`\n${scenarioDraftResult}\n\`\`\`\n`);

  if (scriptCoverageResult) {
    lines.push(`## Script Coverage`);
    lines.push(`- **전체 점수:** ${scriptCoverageResult.overall_score ?? "—"}`);
    lines.push(`- **추천 여부:** ${scriptCoverageResult.recommendation || "—"}`);
    if (scriptCoverageResult.strengths?.length) {
      lines.push(`\n### 강점`);
      scriptCoverageResult.strengths.forEach(s => lines.push(`- ${s}`));
    }
    if (scriptCoverageResult.weaknesses?.length) {
      lines.push(`\n### 개선 사항`);
      scriptCoverageResult.weaknesses.forEach(s => lines.push(`- ${s}`));
    }
    lines.push("");
  }

  if (valuationResult) {
    lines.push(`## 시장 가치 평가`);
    if (valuationResult.market_value_score != null) lines.push(`- **시장 가치:** ${valuationResult.market_value_score}/10`);
    if (valuationResult.investment_grade) lines.push(`- **투자 등급:** ${valuationResult.investment_grade}`);
    lines.push("");
  }

  lines.push(`---\n*HelloLogline — AI 시나리오 개발 워크스테이션*`);

  const md = lines.join("\n");
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 전체 HTML 문서 문자열을 새 창에서 인쇄 다이얼로그로 열어 PDF 저장합니다.
 */
export async function downloadHtmlAsPdf(htmlString, filename = "document") {
  const filenameJson = JSON.stringify(filename);

  const needsPage = !htmlString.includes("@page");
  const pageStyle = needsPage
    ? `<style>@page { size: A4 portrait; margin: 18mm 20mm 20mm 20mm; }</style>`
    : "";

  const printScript = `<script>
  window.addEventListener('load', function() {
    document.title = ${filenameJson};
    setTimeout(function() { window.print(); }, 400);
  });
<\/script>`;

  let modifiedHtml = htmlString;
  if (modifiedHtml.includes("</head>")) {
    modifiedHtml = modifiedHtml.replace("</head>", `${pageStyle}${printScript}</head>`);
  } else {
    modifiedHtml = `<head>${pageStyle}${printScript}</head>` + modifiedHtml;
  }

  const blob = new Blob([modifiedHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");

  if (!win || win.closed || typeof win.closed === "undefined") {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  setTimeout(() => URL.revokeObjectURL(url), 300000);
}
