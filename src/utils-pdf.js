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

// ── Stage별 A4 PDF 내보내기 ────────────────────────────────────────────────────

const STAGE_META = {
  "1": { num: "01", name: "로그라인 분석", accent: "#C8A84B" },
  "2": { num: "02", name: "개념 분석", accent: "#45B7D1" },
  "3": { num: "03", name: "캐릭터", accent: "#FB923C" },
  "4": { num: "04", name: "시놉시스 / 구조", accent: "#4ECCA3" },
  "5": { num: "05", name: "트리트먼트 / 비트", accent: "#FFD166" },
  "6": { num: "06", name: "시나리오 초고", accent: "#A78BFA" },
  "7": { num: "07", name: "Script Coverage / 시장가치", accent: "#60A5FA" },
  "8": { num: "08", name: "시나리오 고쳐쓰기", accent: "#E85D75" },
};

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textBlock(text, color = "#1a1a2e") {
  const safe = escapeHtml(text).replace(/\n/g, "<br/>");
  return `<div style="font-size:9pt;color:${color};line-height:1.85;word-break:keep-all;white-space:pre-wrap;">${safe}</div>`;
}

function subsectionTitle(title, color = "#999") {
  return `<div style="font-size:7.5pt;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1.5px;margin:10pt 0 6pt;padding-bottom:3pt;border-bottom:1pt solid #eee;page-break-after:avoid;">${title}</div>`;
}

function listBox(items, color = "#4ECCA3") {
  if (!items || !items.length) return "";
  return `<div style="border:1pt solid ${color}28;border-radius:5pt;padding:9pt 11pt;background:${color}06;margin-bottom:7pt;page-break-inside:avoid;">
    ${items.map(x => `<div style="font-size:8.5pt;color:#1a1a2e;margin-bottom:3pt;padding-left:10pt;position:relative;line-height:1.65;"><span style="position:absolute;left:0;color:${color};">•</span>${typeof x === "string" ? escapeHtml(x) : escapeHtml(JSON.stringify(x))}</div>`).join("")}
  </div>`;
}

// ── 필드명 한글 라벨 (공통) ───────────────────────────────────────────────────
const FIELD_LABELS_KR = {
  // Stage 1
  protagonist: "주인공", inciting_incident: "촉발 사건", goal: "목표",
  conflict: "갈등", stakes: "이해관계", irony: "아이러니", mental_picture: "심상",
  emotional_hook: "감정 훅", originality: "독창성", conciseness: "간결성",
  active_language: "능동 언어", no_violations: "금기사항", genre_tone: "장르 톤",
  information_gap: "정보 격차", cognitive_dissonance: "인지 부조화",
  narrative_transportation: "서사 몰입", universal_relatability: "보편 공감",
  unpredictability: "예측 불가", overall_feedback: "종합 피드백",
  improvement_questions: "개선 질문", detected_genre: "감지 장르",
  structure: "구조적 완성도", expression: "표현적 매력도",
  technical: "기술적 완성도", interest: "흥미 유발 지수",
  // Early coverage
  marketability_score: "상업성 점수", one_line_verdict: "한 줄 판정",
  best_platform: "최적 플랫폼", target_audience: "핵심 타겟",
  comparable_hit: "유사 히트작", key_strengths: "핵심 강점",
  key_risks: "위험 요소", development_priority: "우선 보완 사항",
  // Insight
  overall_verdict: "전체 평가", strongest_element: "가장 강한 요소",
  priority_issues: "우선순위 이슈", problem: "문제점",
  why_matters: "중요한 이유", action: "개선 방법", title: "제목",
  // Stage 2 academic
  aristotle: "아리스토텔레스 (시학)", integrated_assessment: "통합 평가",
  dominant_theory_fit: "지배 이론 부합도", theoretical_verdict: "이론적 판정",
  // Stage 2 myth map
  primary_stage: "핵심 단계", campbell_verdict: "Campbell 판정",
  journey_phases: "여정 단계", archetype_roles: "원형 역할",
  // Stage 2 barthes
  hermeneutic_code: "해석학적 코드", proairetic_code: "행위적 코드",
  semic_code: "의미적 코드", symbolic_code: "상징적 코드",
  cultural_code: "문화적 코드", total_activation: "총 활성화",
  dominant_code: "지배 코드", barthes_verdict: "Barthes 판정",
  // Stage 2 korean myth
  han_resonance: "한(恨) 공명", jeong_resonance: "정(情) 공명",
  sinmyeong_element: "신명(神明) 요소", korean_myth_verdict: "한국 신화 판정",
  // Stage 2 theme
  controlling_idea: "지배 테마", moral_premise: "도덕적 전제",
  thematic_question: "주제적 질문", central_theme: "중심 테마",
  moral_argument: "도덕적 논거", sub_themes: "하위 테마",
  protagonist_inner_journey: "주인공 내적 여정",
  // Stage 2 expert panel
  panel_title: "패널 주제", round1: "라운드 1 (개별 의견)",
  round2: "라운드 2 (토론)", synthesis: "종합",
  consensus: "합의점", improvements: "개선안", critical_gap: "핵심 결함",
  philosophical_core: "철학적 핵심",
  // Stage 3 character dev
  egri_dimensions: "Egri 3차원", supporting_characters: "조연 캐릭터",
  want: "외적 목표 (Want)", need: "내적 욕구 (Need)",
  arc_type: "변화 호 (Arc)", flaw: "핵심 결함", ghost: "상처 (Ghost)",
  sociology: "사회적 배경", physiology: "생리적 특성",
  psychology: "심리적 특성", name_suggestion: "이름 제안",
  occupation: "직업", background: "배경", role: "역할",
  relation: "관계", function: "기능",
  // Stage 3 shadow
  hero_archetype: "영웅 원형", shadow: "그림자", shadow_self: "그림자 자기",
  individuation_arc: "개성화 과정", jung_verdict: "Jung 판정",
  integration: "통합", manifestations: "현현",
  // Stage 3 authenticity
  authenticity_score: "진정성 점수", authenticity_label: "진정성 레이블",
  existential_verdict: "실존 판정", facticity: "피투성 (Facticity)",
  mauvaise_foi: "자기기만 (Mauvaise Foi)", genuine_choice: "진정한 선택",
  other_gaze: "타자의 시선 (Le Regard)", absurdity: "부조리 (Absurdity)",
  kierkegaard_stage: "Kierkegaard 단계",
  nietzsche_connection: "Nietzsche 연결",
  // Stage 4 structure
  structure_type: "구조 유형", acts: "막 구성", plot_points: "플롯 포인트",
  turning_points: "전환점", act1_summary: "1막 요약",
  act2_summary: "2막 요약", act3_summary: "3막 요약",
  midpoint: "미드포인트", all_is_lost: "모든 것을 잃다",
  // Stage 4 value charge
  primary_charge: "주요 가치 변화", charge_intensity: "변화 강도",
  mckee_verdict: "McKee 판정",
  // Stage 4 subtext
  subtext_score: "서브텍스트 점수", surface_story: "표층 이야기",
  deeper_story: "심층 이야기", chekhov_verdict: "Chekhov 판정",
  // Stage 4 pipeline/synopsis
  direction_title: "방향 제목", synopsis: "시놉시스", theme: "테마",
  key_scenes: "핵심 장면", ending_type: "결말 유형",
  // Stage 4 comparable
  comparable_works: "유사 작품", similarity_score: "유사도",
  why_comparable: "유사한 이유", what_to_learn: "학습 포인트",
  market_positioning: "시장 포지셔닝", tone_reference: "톤 레퍼런스",
  year: "연도",
  // Stage 4 episode series
  series_type: "시리즈 유형", episode_count: "회차 수",
  season_logline: "시즌 로그라인", episodes: "회차", number: "회차",
  logline: "로그라인", key_scene: "핵심 씬", cliffhanger: "클리프행어",
  series_arc: "시즌 아크", season_want: "시즌 목표", finale: "피날레",
  // Stage 5
  format_name: "포맷", total_pages: "총 페이지", beats: "비트",
  name_kr: "비트명", page_start: "시작 페이지", summary: "요약",
  character_voices: "캐릭터 보이스", subtext_techniques: "서브텍스트 기법",
  key_scene_dialogue: "핵심 씬 대사", voice_analysis: "보이스 분석",
  sample_lines: "샘플 대사",
  // Stage 7 coverage
  overall_score: "종합 점수", recommendation: "추천 여부",
  verdict_rationale: "판정 근거", scores: "세부 점수",
  strengths: "강점", weaknesses: "개선 사항",
  verdict: "판정", logline_score: "로그라인 점수",
  // Stage 7 valuation
  completion_score: "완성도 점수", completion_label: "완성도 레이블",
  completion_breakdown: "완성도 세부", market_tier: "시장 등급",
  korean_market: "국내 시장", format_assumed: "가정 포맷",
  price_rationale: "가격 근거", factors_boosting_value: "가치 상승 요인",
  factors_reducing_value: "가치 하락 요인",
  development_recommendation: "개발 제언",
  predicted_reviews: "예상 리뷰", reviewer_type: "리뷰어 유형",
  platform: "플랫폼", rating: "평점", review: "리뷰",
  disclaimer: "면책 조항", market_value_score: "시장 가치 점수",
  investment_grade: "투자 등급", comparable_budget: "유사 예산",
  target_platform: "최적 플랫폼", development_notes: "개발 노트",
  // Stage 7/8 rewrite
  priorities: "우선순위", area: "영역", issue: "문제",
  rank: "순위",
};

function toLabel(key) {
  if (FIELD_LABELS_KR[key]) return FIELD_LABELS_KR[key];
  return String(key).replace(/_/g, " ");
}

// 아래 키는 렌더링에서 제외 (내부 메타데이터)
const SKIP_KEYS = new Set(["id", "max"]);

/**
 * 제너릭 재귀 렌더러 — 어떤 JS 값이든 A4 지면에 적합하게 HTML 로 변환.
 * - score 필드가 있는 객체: 점수 바
 * - 문자열: 텍스트 블록
 * - 배열: 불릿 또는 카드 그리드
 * - 중첩 객체: subsection 헤더 + 재귀
 */
function renderAnyValue(value, depth = 0) {
  if (value == null || value === "") return "";

  if (typeof value === "string") {
    const safe = escapeHtml(value).replace(/\n/g, "<br/>");
    return `<div style="font-size:9pt;color:#1a1a2e;line-height:1.75;margin-bottom:4pt;word-break:keep-all;">${safe}</div>`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return `<span style="font-size:9pt;color:#1a1a2e;font-family:'Courier New',monospace;font-weight:600;">${value}</span>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    if (value.every(v => typeof v === "string" || typeof v === "number")) {
      return listBox(value.map(String), "#4ECCA3");
    }
    return value.map((v, i) => {
      if (v == null) return "";
      const inner = renderAnyValue(v, depth + 1);
      if (!inner) return "";
      return `<div style="border:1pt solid #e0e0e0;border-radius:4pt;padding:8pt 10pt;background:#fafafa;margin-bottom:6pt;page-break-inside:avoid;">
        <div style="font-size:7pt;font-weight:700;color:#888;font-family:'Courier New',monospace;letter-spacing:1px;margin-bottom:4pt;">[${i + 1}]</div>
        ${inner}
      </div>`;
    }).join("");
  }

  if (typeof value === "object") {
    // score 객체: { score, found?, feedback?, max? }
    if (typeof value.score === "number") {
      const max = value.max || 10;
      let html = `<div style="margin-bottom:6pt;page-break-inside:avoid;">${scoreBar("", value.score, max)}`;
      if (value.found) html += `<div style="font-size:7.5pt;color:#666;padding-left:120pt;margin-top:-2pt;margin-bottom:3pt;line-height:1.55;">감지: "${escapeHtml(value.found)}"</div>`;
      if (value.feedback) html += `<div style="font-size:8pt;color:#555;padding-left:120pt;margin-top:-2pt;margin-bottom:3pt;line-height:1.6;">${escapeHtml(value.feedback)}</div>`;
      html += `</div>`;
      return html;
    }

    const entries = Object.entries(value)
      .filter(([k, v]) => !SKIP_KEYS.has(k) && v != null && v !== "" && !(Array.isArray(v) && v.length === 0));
    if (entries.length === 0) return "";

    return entries.map(([k, v]) => {
      const label = toLabel(k);

      // 원시값(스칼라) — 인라인 렌더
      if (typeof v === "string") {
        const safe = escapeHtml(v).replace(/\n/g, "<br/>");
        return `<div style="margin-bottom:5pt;page-break-inside:avoid;">
          <div style="font-size:7.5pt;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:2pt;">${escapeHtml(label)}</div>
          <div style="font-size:9pt;color:#1a1a2e;line-height:1.7;padding-left:2pt;word-break:keep-all;">${safe}</div>
        </div>`;
      }
      if (typeof v === "number" || typeof v === "boolean") {
        return `<div style="margin-bottom:4pt;display:flex;gap:8pt;align-items:baseline;">
          <span style="font-size:7.5pt;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;min-width:110pt;">${escapeHtml(label)}</span>
          <span style="font-size:9pt;color:#1a1a2e;font-family:'Courier New',monospace;font-weight:600;">${v}</span>
        </div>`;
      }

      // score 객체 — 점수 바
      if (v && typeof v === "object" && typeof v.score === "number") {
        const max = v.max || 10;
        let html = `<div style="margin-bottom:6pt;page-break-inside:avoid;">${scoreBar(label, v.score, max)}`;
        if (v.found) html += `<div style="font-size:7.5pt;color:#666;padding-left:120pt;margin-top:-2pt;margin-bottom:3pt;line-height:1.55;">감지: "${escapeHtml(v.found)}"</div>`;
        if (v.feedback) html += `<div style="font-size:8pt;color:#555;padding-left:120pt;margin-top:-2pt;margin-bottom:3pt;line-height:1.6;">${escapeHtml(v.feedback)}</div>`;
        html += `</div>`;
        return html;
      }

      // 중첩 객체/배열 — subsection
      const inner = renderAnyValue(v, depth + 1);
      if (!inner) return "";
      const indent = Math.min(depth, 2) * 8;
      return `<div style="margin-bottom:8pt;padding-left:${indent}pt;page-break-inside:avoid;">
        <div style="font-size:8pt;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:1px;margin-bottom:5pt;padding-bottom:2pt;border-bottom:1pt solid #e0e0e0;">${escapeHtml(label)}</div>
        ${inner}
      </div>`;
    }).join("");
  }

  return "";
}

/**
 * Result 전체를 카드로 감싸 렌더 — 섹션 구분용.
 */
function renderResultCard(title, data, accent = "#4ECCA3") {
  if (!data) return "";
  const body = renderAnyValue(data);
  if (!body) return "";
  return `<div style="border:1pt solid ${accent}30;border-left:3pt solid ${accent};border-radius:5pt;padding:12pt 14pt;background:${accent}04;margin-bottom:10pt;page-break-inside:auto;">
    <div style="font-size:9pt;font-weight:800;color:${accent};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10pt;padding-bottom:5pt;border-bottom:1pt solid ${accent}30;">${escapeHtml(title)}</div>
    ${body}
  </div>`;
}

function buildCoverHtml({ logline, genre, stageLabel }) {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  return `
    <div style="height:250mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;">
      <div>
        <div style="font-size:7pt;font-weight:700;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:24pt;">
          HELLOLOGLINE · AI 시나리오 개발 리포트
        </div>
        <div style="font-size:10pt;font-weight:400;color:#888;margin-bottom:8pt;letter-spacing:0.5px;">${stageLabel || "단계별 리포트"}</div>
        <div style="font-size:11pt;font-weight:400;color:#888;margin-bottom:8pt;letter-spacing:0.5px;">로그라인</div>
        <div style="font-size:16pt;font-weight:800;color:#1a1a2e;line-height:1.5;max-width:440pt;margin-bottom:24pt;word-break:keep-all;">
          ${escapeHtml(logline || "(로그라인 미입력)")}
        </div>
        <div style="height:2pt;background:linear-gradient(90deg,#1a1a2e,#ccc);width:100%;margin-bottom:20pt;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8pt;">
          ${genre && genre !== "auto" ? `
          <div>
            <div style="font-size:7pt;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:3pt;">장르</div>
            <div style="font-size:10pt;font-weight:700;color:#1a1a2e;">${escapeHtml(genre)}</div>
          </div>` : ""}
          <div>
            <div style="font-size:7pt;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:3pt;">생성일</div>
            <div style="font-size:10pt;font-weight:700;color:#1a1a2e;">${today}</div>
          </div>
        </div>
      </div>
      <div style="font-size:7.5pt;color:#bbb;letter-spacing:1px;">
        hellologline.com · AI 시나리오 개발 워크스테이션
      </div>
    </div>`;
}

// ── Stage 1 ────────────────────────────────────────────────────────────────────
function buildStage1SectionHtml(data) {
  const { result, earlyCoverageResult, insightResult } = data;
  if (!result && !earlyCoverageResult && !insightResult) return "";

  const meta = STAGE_META["1"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (result) {
    const qualScore = calcSectionTotal(result, "structure") + calcSectionTotal(result, "expression") + calcSectionTotal(result, "technical");
    const intScore = calcSectionTotal(result, "interest");
    parts.push(`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin-bottom:14pt;">
        <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:12pt;text-align:center;background:#f9f9f9;">
          <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:5pt;">품질 점수</div>
          <div style="font-size:28pt;font-weight:800;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1;">${qualScore}</div>
          <div style="font-size:8pt;color:#888;margin-top:4pt;">등급: ${getGradeLabel(qualScore)}</div>
        </div>
        <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:12pt;text-align:center;background:#f9f9f9;">
          <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:5pt;">흥미도</div>
          <div style="font-size:28pt;font-weight:800;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1;">${intScore}</div>
          <div style="font-size:8pt;color:#888;margin-top:4pt;">등급: ${getGradeLabel(intScore)}</div>
        </div>
      </div>`);
    parts.push(renderResultCard("로그라인 상세 분석", result, "#C8A84B"));
  }

  if (earlyCoverageResult) {
    parts.push(renderResultCard("빠른 상업성 체크 (Early Coverage)", earlyCoverageResult, "#60A5FA"));
  }

  if (insightResult) {
    parts.push(renderResultCard("종합 인사이트", insightResult, "#A78BFA"));
  }

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 2 ────────────────────────────────────────────────────────────────────
function buildStage2SectionHtml(data) {
  const { academicResult, mythMapResult, barthesCodeResult, koreanMythResult, themeResult, expertPanelResult } = data;
  if (!academicResult && !mythMapResult && !barthesCodeResult && !koreanMythResult && !themeResult && !expertPanelResult) return "";

  const meta = STAGE_META["2"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (academicResult) parts.push(renderResultCard("학술 서사 이론 (Aristotle · Freytag · Syd Field)", academicResult, "#45B7D1"));
  if (mythMapResult) parts.push(renderResultCard("신화 지도 (Campbell 영웅 여정)", mythMapResult, "#A78BFA"));
  if (barthesCodeResult) parts.push(renderResultCard("바르트 코드 (S/Z)", barthesCodeResult, "#4ECCA3"));
  if (koreanMythResult) parts.push(renderResultCard("한국 신화·미학 공명", koreanMythResult, "#F7A072"));
  if (themeResult) parts.push(renderResultCard("핵심 테마", themeResult, "#C8A84B"));
  if (expertPanelResult) parts.push(renderResultCard("전문가 패널 토론", expertPanelResult, "#FFD166"));

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 3 ────────────────────────────────────────────────────────────────────
function buildStage3SectionHtml(data) {
  const { charDevResult, shadowResult, authenticityResult } = data;
  if (!charDevResult && !shadowResult && !authenticityResult) return "";

  const meta = STAGE_META["3"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (charDevResult) parts.push(renderResultCard("캐릭터 종합 개발", charDevResult, "#FB923C"));
  if (shadowResult) parts.push(renderResultCard("Jung 그림자 분석", shadowResult, "#A78BFA"));
  if (authenticityResult) parts.push(renderResultCard("실존 진정성 분석", authenticityResult, "#60A5FA"));

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 4 ────────────────────────────────────────────────────────────────────
function buildStage4SectionHtml(data) {
  const { structureResult, valueChargeResult, pipelineResult, synopsisResults, comparableResult, subtextResult } = data;
  const synopsisText = pipelineResult?.synopsis || synopsisResults?.synopses?.[0]?.synopsis || "";
  if (!structureResult && !valueChargeResult && !synopsisText && !comparableResult && !subtextResult && !pipelineResult && !synopsisResults) return "";

  const meta = STAGE_META["4"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (pipelineResult) parts.push(renderResultCard("선택된 시놉시스", pipelineResult, "#4ECCA3"));
  if (synopsisResults) parts.push(renderResultCard("생성된 시놉시스 방향들", synopsisResults, "#4ECCA3"));
  if (structureResult) parts.push(renderResultCard("3막 구조 분석", structureResult, "#45B7D1"));
  if (valueChargeResult) parts.push(renderResultCard("가치 전하 (McKee)", valueChargeResult, "#C8A84B"));
  if (subtextResult) parts.push(renderResultCard("서브텍스트 (Chekhov)", subtextResult, "#A78BFA"));
  if (comparableResult) parts.push(renderResultCard("유사 작품 분석", comparableResult, "#60A5FA"));

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 5 ────────────────────────────────────────────────────────────────────
function buildStage5SectionHtml(data) {
  const { treatmentResult, beatSheetResult, dialogueDevResult } = data;
  if (!treatmentResult && !beatSheetResult && !dialogueDevResult) return "";

  const meta = STAGE_META["5"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (treatmentResult) {
    parts.push(`<div style="border:1pt solid #FFD16630;border-left:3pt solid #FFD166;border-radius:5pt;padding:12pt 14pt;background:#FFD16604;margin-bottom:10pt;page-break-inside:auto;">
      <div style="font-size:9pt;font-weight:800;color:#FFD166;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10pt;padding-bottom:5pt;border-bottom:1pt solid #FFD16630;">트리트먼트</div>
      <div style="font-size:9pt;color:#1a1a2e;line-height:1.85;white-space:pre-wrap;word-break:keep-all;">${escapeHtml(treatmentResult)}</div>
    </div>`);
  }
  if (beatSheetResult) parts.push(renderResultCard("비트 시트", beatSheetResult, "#FFD166"));
  if (dialogueDevResult) parts.push(renderResultCard("대사 개발", dialogueDevResult, "#A78BFA"));

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 6 ────────────────────────────────────────────────────────────────────
function buildStage6SectionHtml(data) {
  const { scenarioDraftResult } = data;
  if (!scenarioDraftResult) return "";

  const meta = STAGE_META["6"];
  return `<div style="page-break-before:always;">
    ${sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)}
    <div style="font-size:8.5pt;color:#1a1a2e;line-height:1.9;white-space:pre-wrap;word-break:break-word;font-family:'Courier New',monospace;">
      ${escapeHtml(scenarioDraftResult)}
    </div>
  </div>`;
}

// ── Stage 7 ────────────────────────────────────────────────────────────────────
function buildStage7SectionHtml(data) {
  const { scriptCoverageResult, valuationResult, rewriteDiagResult } = data;
  if (!scriptCoverageResult && !valuationResult && !rewriteDiagResult) return "";

  const meta = STAGE_META["7"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (scriptCoverageResult) parts.push(renderResultCard("Script Coverage (할리우드 심사)", scriptCoverageResult, "#60A5FA"));
  if (valuationResult) parts.push(renderResultCard("시장 가치 평가", valuationResult, "#C8A84B"));
  if (rewriteDiagResult) parts.push(renderResultCard("고쳐쓰기 전 진단", rewriteDiagResult, "#FB923C"));

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 8 ────────────────────────────────────────────────────────────────────
function buildStage8SectionHtml(data) {
  const { partialRewriteResult, fullRewriteResult, rewriteDiagResult } = data;
  if (!partialRewriteResult && !fullRewriteResult && !rewriteDiagResult) return "";

  const meta = STAGE_META["8"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (rewriteDiagResult) parts.push(renderResultCard("초고 진단", rewriteDiagResult, "#FB923C"));

  if (partialRewriteResult) {
    parts.push(`<div style="border:1pt solid #60A5FA30;border-left:3pt solid #60A5FA;border-radius:5pt;padding:12pt 14pt;background:#60A5FA04;margin-bottom:10pt;page-break-inside:auto;">
      <div style="font-size:9pt;font-weight:800;color:#60A5FA;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10pt;padding-bottom:5pt;border-bottom:1pt solid #60A5FA30;">부분 재작성</div>
      <div style="font-size:8.5pt;color:#1a1a2e;line-height:1.9;white-space:pre-wrap;word-break:keep-all;font-family:'Courier New',monospace;">${escapeHtml(partialRewriteResult)}</div>
    </div>`);
  }

  if (fullRewriteResult) {
    parts.push(`<div style="border:1pt solid #A78BFA30;border-left:3pt solid #A78BFA;border-radius:5pt;padding:12pt 14pt;background:#A78BFA04;margin-bottom:10pt;page-break-inside:auto;">
      <div style="font-size:9pt;font-weight:800;color:#A78BFA;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10pt;padding-bottom:5pt;border-bottom:1pt solid #A78BFA30;">전체 개고</div>
      <div style="font-size:8.5pt;color:#1a1a2e;line-height:1.9;white-space:pre-wrap;word-break:keep-all;font-family:'Courier New',monospace;">${escapeHtml(fullRewriteResult)}</div>
    </div>`);
  }

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

const STAGE_BUILDERS = {
  "1": buildStage1SectionHtml,
  "2": buildStage2SectionHtml,
  "3": buildStage3SectionHtml,
  "4": buildStage4SectionHtml,
  "5": buildStage5SectionHtml,
  "6": buildStage6SectionHtml,
  "7": buildStage7SectionHtml,
  "8": buildStage8SectionHtml,
};

function buildStagesDocumentHtml({ logline, genre, stageLabel, stageIds, data }) {
  const cover = buildCoverHtml({ logline, genre, stageLabel });
  const sections = stageIds
    .map(id => STAGE_BUILDERS[id]?.(data) || "")
    .filter(Boolean)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>HelloLogline ${stageLabel || "리포트"} — ${escapeHtml((logline || "").slice(0, 30)) || "문서"}</title>
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
  div { orphans: 2; widows: 2; }
  .allow-break { page-break-inside: auto !important; }
</style>
</head>
<body>
${cover}
${sections}
</body>
</html>`;
}

/**
 * 특정 단계의 결과를 A4 PDF로 내보냅니다.
 * @param {Object} opts
 * @param {string} opts.stageId — "1" ~ "8"
 * @param {boolean} opts.includePrevious — 이전 단계까지 포함할지 여부
 * @param {string} [opts.logline]
 * @param {string} [opts.genre]
 * @param {Object} opts.data — 모든 스테이지 결과가 담긴 객체
 * @param {string} [opts.filename]
 */
export async function exportStagePdf({ stageId, includePrevious = false, logline = "", genre = "", data = {}, filename }) {
  const meta = STAGE_META[stageId];
  if (!meta) throw new Error(`Unknown stageId: ${stageId}`);

  const stageIds = includePrevious
    ? Object.keys(STAGE_META).filter(id => Number(id) <= Number(stageId))
    : [stageId];

  const stageLabel = includePrevious
    ? `Stage 01 ~ ${meta.num} · ${meta.name}`
    : `Stage ${meta.num} · ${meta.name}`;

  const html = buildStagesDocumentHtml({
    logline, genre, stageLabel, stageIds, data,
  });

  const safeTitle = (logline || "report").slice(0, 20).replace(/[\\/:*?"<>|]/g, "_");
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const finalName = filename || `hellologline_stage${meta.num}${includePrevious ? "_full" : ""}_${safeTitle}_${stamp}`;
  await downloadHtmlAsPdf(html, finalName);
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
