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
    ${items.map(x => `<div style="font-size:8.5pt;color:#1a1a2e;margin-bottom:3pt;padding-left:10pt;position:relative;line-height:1.65;"><span style="position:absolute;left:0;color:${color};">•</span>${escapeHtml(x)}</div>`).join("")}
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
  const parts = [];
  parts.push(sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent));

  if (result) {
    const qualScore = calcSectionTotal(result, "structure") + calcSectionTotal(result, "expression") + calcSectionTotal(result, "technical");
    const intScore = calcSectionTotal(result, "interest");
    const qualGrade = getGradeLabel(qualScore);
    const intGrade = getGradeLabel(intScore);
    const LABELS = {
      protagonist: "주인공 설정", inciting_incident: "촉발 사건", goal: "목표 명확성",
      conflict: "갈등 구조", stakes: "위험 요소", irony: "아이러니",
      mental_picture: "시각적 이미지", emotional_hook: "감정 훅", originality: "독창성",
      conciseness: "간결성", active_language: "능동 언어", no_violations: "포맷 준수",
      genre_tone: "장르 톤", information_gap: "정보 격차", cognitive_dissonance: "인지 충돌",
      narrative_transportation: "서사 몰입", universal_relatability: "보편 공감", unpredictability: "예측 불가",
    };

    parts.push(`
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
      </div>`);

    const groups = [
      { title: "구조적 완성도", data: result.structure },
      { title: "표현 기술", data: result.expression },
      { title: "기술적 완성도", data: result.technical },
      { title: "흥미도 지표", data: result.interest },
    ].filter(g => g.data && Object.keys(g.data).length);

    parts.push(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:14pt;margin-bottom:14pt;">`);
    groups.forEach(g => {
      const rows = Object.entries(g.data).map(([k, v]) => scoreBar(LABELS[k] || k, v?.score, 10)).join("");
      parts.push(`<div>${subsectionTitle(g.title)}${rows}</div>`);
    });
    parts.push(`</div>`);

    if (result.overall_feedback) parts.push(infoBox("종합 피드백", escapeHtml(result.overall_feedback)));
  }

  if (earlyCoverageResult) {
    parts.push(subsectionTitle("초기 커버리지", "#60A5FA"));
    const ec = earlyCoverageResult;
    const rows = [];
    if (ec.verdict) rows.push(kv("판정", ec.verdict));
    if (ec.logline_score != null) rows.push(kv("점수", `${ec.logline_score}/100`));
    if (ec.summary) rows.push(kv("요약", ec.summary));
    parts.push(rows.join(""));
    if (ec.strengths?.length) parts.push(`<div style="margin-top:6pt;"><div style="font-size:7pt;font-weight:700;color:#4ECCA3;margin-bottom:4pt;">강점</div>${listBox(ec.strengths, "#4ECCA3")}</div>`);
    if (ec.weaknesses?.length) parts.push(`<div style="margin-top:4pt;"><div style="font-size:7pt;font-weight:700;color:#E85D75;margin-bottom:4pt;">약점</div>${listBox(ec.weaknesses, "#E85D75")}</div>`);
  }

  if (insightResult) {
    parts.push(subsectionTitle("종합 인사이트", "#A78BFA"));
    if (insightResult.overall_verdict) parts.push(infoBox("전체 평가", escapeHtml(insightResult.overall_verdict), "#A78BFA"));
    if (insightResult.strongest_element) parts.push(infoBox("가장 강한 요소", escapeHtml(insightResult.strongest_element), "#4ECCA3"));
    if (Array.isArray(insightResult.priority_issues) && insightResult.priority_issues.length) {
      insightResult.priority_issues.forEach((issue, i) => {
        const accent = ["#FF6B6B","#C8A84B","#45B7D1"][i] || "#A78BFA";
        parts.push(`<div style="border:1pt solid ${accent}28;border-left:3pt solid ${accent};border-radius:4pt;padding:8pt 11pt;background:${accent}06;margin-bottom:6pt;page-break-inside:avoid;">
          <div style="display:flex;align-items:baseline;gap:6pt;margin-bottom:4pt;">
            <span style="font-size:8pt;font-weight:800;color:${accent};font-family:'Courier New',monospace;">0${i+1}</span>
            <span style="font-size:9.5pt;font-weight:700;color:#1a1a2e;">${escapeHtml(issue.title || "")}</span>
          </div>
          ${issue.problem ? `<div style="font-size:8.5pt;color:#333;line-height:1.65;margin-bottom:3pt;">${escapeHtml(issue.problem)}</div>` : ""}
          ${issue.why_matters ? `<div style="font-size:8pt;color:#666;font-style:italic;margin-bottom:4pt;">→ ${escapeHtml(issue.why_matters)}</div>` : ""}
          ${issue.action ? `<div style="padding:5pt 9pt;background:#fff;border:1pt solid #e0e0e0;border-radius:3pt;font-size:8.5pt;color:#1a1a2e;line-height:1.6;"><span style="font-size:7pt;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-right:4pt;">개선 방법</span>${escapeHtml(issue.action)}</div>` : ""}
        </div>`);
      });
    }
  }

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 2 ────────────────────────────────────────────────────────────────────
function buildStage2SectionHtml(data) {
  const { academicResult, mythMapResult, barthesCodeResult, koreanMythResult, themeResult, expertPanelResult } = data;
  if (!academicResult && !mythMapResult && !barthesCodeResult && !koreanMythResult && !themeResult && !expertPanelResult) return "";

  const meta = STAGE_META["2"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (academicResult) {
    parts.push(subsectionTitle("학술 서사 이론", meta.accent));
    if (academicResult.aristotle_analysis) parts.push(infoBox("Aristotle", escapeHtml(academicResult.aristotle_analysis), "#45B7D1"));
    if (academicResult.freytag_analysis) parts.push(infoBox("Freytag", escapeHtml(academicResult.freytag_analysis), "#45B7D1"));
    if (academicResult.field_analysis) parts.push(infoBox("Syd Field", escapeHtml(academicResult.field_analysis), "#45B7D1"));
    if (academicResult.summary) parts.push(infoBox("종합", escapeHtml(academicResult.summary), "#45B7D1"));
  }

  if (mythMapResult) {
    parts.push(subsectionTitle("신화 지도 (Campbell 영웅 여정)", "#A78BFA"));
    if (mythMapResult.summary) parts.push(infoBox("", escapeHtml(mythMapResult.summary), "#A78BFA"));
    const stages = mythMapResult.stages || [];
    if (stages.length) {
      parts.push(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:7pt;margin-bottom:8pt;">`);
      stages.slice(0, 12).forEach(s => {
        parts.push(`<div style="border:1pt solid #A78BFA28;border-radius:4pt;padding:7pt 9pt;background:#A78BFA06;page-break-inside:avoid;">
          <div style="font-size:7.5pt;font-weight:700;color:#A78BFA;margin-bottom:3pt;">${escapeHtml(s.name || s.stage || "")}</div>
          <div style="font-size:8pt;color:#1a1a2e;line-height:1.6;">${escapeHtml(s.description || s.content || "")}</div>
        </div>`);
      });
      parts.push(`</div>`);
    }
  }

  if (barthesCodeResult) {
    parts.push(subsectionTitle("바르트 코드 (S/Z)", "#4ECCA3"));
    const codes = ["hermeneutic", "proairetic", "semic", "symbolic", "cultural"];
    const labels = { hermeneutic: "해석학적", proairetic: "행위적", semic: "의미적", symbolic: "상징적", cultural: "문화적" };
    codes.forEach(c => {
      if (barthesCodeResult[c]) parts.push(infoBox(labels[c] + " 코드", escapeHtml(barthesCodeResult[c]), "#4ECCA3"));
    });
  }

  if (koreanMythResult) {
    parts.push(subsectionTitle("한국 신화·미학 공명", "#F7A072"));
    if (koreanMythResult.summary) parts.push(infoBox("요약", escapeHtml(koreanMythResult.summary), "#F7A072"));
    if (koreanMythResult.han_analysis) parts.push(infoBox("한(恨)", escapeHtml(koreanMythResult.han_analysis), "#F7A072"));
    if (koreanMythResult.jeong_analysis) parts.push(infoBox("정(情)", escapeHtml(koreanMythResult.jeong_analysis), "#F7A072"));
  }

  if (themeResult) {
    parts.push(subsectionTitle("핵심 테마", "#C8A84B"));
    if (themeResult.central_theme) parts.push(infoBox("중심 테마", escapeHtml(themeResult.central_theme), "#C8A84B"));
    if (themeResult.moral_argument) parts.push(infoBox("도덕적 논거", escapeHtml(themeResult.moral_argument), "#C8A84B"));
    if (Array.isArray(themeResult.sub_themes)) parts.push(listBox(themeResult.sub_themes, "#C8A84B"));
  }

  if (expertPanelResult) {
    parts.push(subsectionTitle("전문가 패널 토론", "#FFD166"));
    if (expertPanelResult.consensus) parts.push(infoBox("합의점", escapeHtml(expertPanelResult.consensus), "#FFD166"));
    if (expertPanelResult.key_strengths?.length) parts.push(`<div style="margin-bottom:6pt;"><div style="font-size:7pt;font-weight:700;color:#4ECCA3;margin-bottom:4pt;">핵심 강점</div>${listBox(expertPanelResult.key_strengths, "#4ECCA3")}</div>`);
    if (expertPanelResult.key_concerns?.length) parts.push(`<div style="margin-bottom:6pt;"><div style="font-size:7pt;font-weight:700;color:#E85D75;margin-bottom:4pt;">주요 우려</div>${listBox(expertPanelResult.key_concerns, "#E85D75")}</div>`);
  }

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 3 ────────────────────────────────────────────────────────────────────
function buildStage3SectionHtml(data) {
  const { charDevResult, shadowResult, authenticityResult } = data;
  if (!charDevResult && !shadowResult && !authenticityResult) return "";

  const meta = STAGE_META["3"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  const protagonist = charDevResult?.protagonist;
  if (protagonist) {
    parts.push(`
      <div style="border:1pt solid #FB923C30;border-radius:6pt;padding:12pt 14pt;background:#FB923C06;margin-bottom:10pt;page-break-inside:avoid;">
        <div style="font-size:8pt;font-weight:700;color:#FB923C;text-transform:uppercase;letter-spacing:1px;margin-bottom:8pt;">주인공</div>
        ${kv("이름/유형", protagonist.name_suggestion || protagonist.name)}
        ${kv("외적 목표 (Want)", protagonist.want)}
        ${kv("내적 욕구 (Need)", protagonist.need)}
        ${kv("핵심 결함 (Flaw)", protagonist.flaw)}
        ${kv("변화 호 (Arc)", protagonist.arc_type)}
        ${kv("직업/배경", protagonist.occupation || protagonist.background)}
      </div>`);
    if (charDevResult.moral_argument) parts.push(infoBox("도덕적 논거", escapeHtml(charDevResult.moral_argument), "#FB923C"));

    const supporting = charDevResult.supporting_characters || [];
    if (supporting.length) {
      parts.push(subsectionTitle("조연 캐릭터"));
      parts.push(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8pt;">`);
      supporting.slice(0, 6).forEach(c => {
        parts.push(`<div style="border:1pt solid #e0e0e0;border-radius:5pt;padding:9pt 11pt;background:#f9f9f9;page-break-inside:avoid;">
          <div style="font-size:9pt;font-weight:700;color:#1a1a2e;margin-bottom:5pt;">${escapeHtml(c.name || "—")}</div>
          ${c.role ? `<div style="font-size:8pt;color:#888;margin-bottom:3pt;">${escapeHtml(c.role)}</div>` : ""}
          ${c.relation ? `<div style="font-size:7.5pt;color:#aaa;">${escapeHtml(c.relation)}</div>` : ""}
        </div>`);
      });
      parts.push(`</div>`);
    }
  }

  if (shadowResult?.shadow_self) parts.push(infoBox("융 그림자 분석", escapeHtml(shadowResult.shadow_self), "#A78BFA"));
  if (authenticityResult?.verdict) {
    const summary = authenticityResult.summary ? " — " + authenticityResult.summary : "";
    parts.push(infoBox("실존 진정성", escapeHtml(authenticityResult.verdict + summary), "#60A5FA"));
  }

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 4 ────────────────────────────────────────────────────────────────────
function buildStage4SectionHtml(data) {
  const { structureResult, valueChargeResult, pipelineResult, synopsisResults, comparableResult, subtextResult } = data;
  const synopsisText = pipelineResult?.synopsis || synopsisResults?.synopses?.[0]?.synopsis || "";
  if (!structureResult && !valueChargeResult && !synopsisText && !comparableResult && !subtextResult) return "";

  const meta = STAGE_META["4"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  const dirTitle = pipelineResult?.direction_title || synopsisResults?.synopses?.[0]?.direction_title || "";
  const theme = pipelineResult?.theme || synopsisResults?.synopses?.[0]?.theme || "";
  const keyScenes = pipelineResult?.key_scenes || synopsisResults?.synopses?.[0]?.key_scenes || [];

  if (dirTitle) parts.push(`<div style="font-size:11pt;font-weight:700;color:#1a1a2e;margin-bottom:6pt;">${escapeHtml(dirTitle)}</div>`);
  if (theme) parts.push(`<div style="font-size:9pt;color:#666;margin-bottom:10pt;">테마: ${escapeHtml(theme)}</div>`);

  if (synopsisText) {
    parts.push(`<div style="border-left:3pt solid #4ECCA3;padding-left:12pt;margin-bottom:12pt;">
      <div style="font-size:9.5pt;color:#1a1a2e;line-height:1.85;word-break:keep-all;white-space:pre-wrap;">${escapeHtml(synopsisText)}</div>
    </div>`);
  }

  if (keyScenes.length) {
    parts.push(subsectionTitle("핵심 장면"));
    parts.push(`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6pt;margin-bottom:12pt;">`);
    keyScenes.slice(0, 9).forEach((sc, i) => {
      const scName = typeof sc === "string" ? sc : (sc.scene || sc.title || sc.name || "");
      parts.push(`<div style="border:1pt solid #e0e0e0;border-radius:4pt;padding:7pt 9pt;background:#f9f9f9;page-break-inside:avoid;">
        <div style="font-size:7pt;font-weight:700;color:#4ECCA3;margin-bottom:3pt;">SCENE ${i + 1}</div>
        <div style="font-size:8pt;color:#1a1a2e;line-height:1.55;">${escapeHtml(scName)}</div>
      </div>`);
    });
    parts.push(`</div>`);
  }

  if (structureResult) {
    parts.push(subsectionTitle("구조 분석"));
    if (structureResult.act1_summary) parts.push(kv("1막", escapeHtml(structureResult.act1_summary)));
    if (structureResult.act2_summary) parts.push(kv("2막", escapeHtml(structureResult.act2_summary)));
    if (structureResult.act3_summary) parts.push(kv("3막", escapeHtml(structureResult.act3_summary)));
    if (structureResult.midpoint) parts.push(kv("미드포인트", escapeHtml(structureResult.midpoint)));
    if (structureResult.all_is_lost) parts.push(kv("모든 것을 잃다", escapeHtml(structureResult.all_is_lost)));
  }

  if (valueChargeResult) {
    parts.push(subsectionTitle("가치 전하 (Value Charge)", "#C8A84B"));
    if (valueChargeResult.summary) parts.push(infoBox("", escapeHtml(valueChargeResult.summary), "#C8A84B"));
  }

  if (subtextResult) {
    parts.push(subsectionTitle("서브텍스트", "#A78BFA"));
    if (subtextResult.summary) parts.push(infoBox("", escapeHtml(subtextResult.summary), "#A78BFA"));
  }

  if (comparableResult) {
    parts.push(subsectionTitle("유사 작품 분석", "#60A5FA"));
    const works = comparableResult.works || [];
    if (works.length) {
      parts.push(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:7pt;">`);
      works.slice(0, 6).forEach(w => {
        parts.push(`<div style="border:1pt solid #60A5FA28;border-radius:5pt;padding:8pt 10pt;background:#60A5FA06;page-break-inside:avoid;">
          <div style="font-size:9pt;font-weight:700;color:#1a1a2e;margin-bottom:3pt;">${escapeHtml(w.title || "")}</div>
          ${w.year ? `<div style="font-size:7.5pt;color:#888;margin-bottom:3pt;">${escapeHtml(w.year)}</div>` : ""}
          ${w.reason ? `<div style="font-size:8pt;color:#1a1a2e;line-height:1.6;">${escapeHtml(w.reason)}</div>` : ""}
        </div>`);
      });
      parts.push(`</div>`);
    }
  }

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 5 ────────────────────────────────────────────────────────────────────
function buildStage5SectionHtml(data) {
  const { treatmentResult, beatSheetResult, dialogueDevResult } = data;
  if (!treatmentResult && !beatSheetResult && !dialogueDevResult) return "";

  const meta = STAGE_META["5"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (treatmentResult) {
    parts.push(subsectionTitle("트리트먼트"));
    parts.push(`<div style="font-size:9pt;color:#1a1a2e;line-height:1.85;white-space:pre-wrap;word-break:keep-all;margin-bottom:10pt;">${escapeHtml(treatmentResult)}</div>`);
  }

  if (beatSheetResult?.beats?.length) {
    parts.push(subsectionTitle("비트 시트", "#FFD166"));
    beatSheetResult.beats.forEach(b => {
      parts.push(`<div style="border:1pt solid #FFD16628;border-radius:5pt;padding:8pt 11pt;background:#FFD16606;margin-bottom:6pt;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4pt;">
          <div style="font-size:9pt;font-weight:700;color:#1a1a2e;">${escapeHtml(b.name_kr || b.name || "")}</div>
          <div style="font-size:7.5pt;color:#888;font-family:'Courier New',monospace;">p.${escapeHtml(b.page_start || "?")}</div>
        </div>
        ${b.summary ? `<div style="font-size:8.5pt;color:#1a1a2e;line-height:1.65;">${escapeHtml(b.summary)}</div>` : ""}
      </div>`);
    });
  }

  if (dialogueDevResult) {
    parts.push(subsectionTitle("대사 개발", "#A78BFA"));
    if (dialogueDevResult.voice_analysis) parts.push(infoBox("보이스 분석", escapeHtml(dialogueDevResult.voice_analysis), "#A78BFA"));
    if (Array.isArray(dialogueDevResult.sample_lines)) parts.push(listBox(dialogueDevResult.sample_lines, "#A78BFA"));
  }

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

  if (scriptCoverageResult) {
    const cv = scriptCoverageResult;
    const verdictColor = cv.verdict === "RECOMMEND" ? "#1a7a4a" : cv.verdict === "CONSIDER" ? "#7a5a1a" : "#7a1a1a";
    const verdictKr = { RECOMMEND: "추천", CONSIDER: "검토", PASS: "보류" }[cv.verdict] || cv.verdict;

    parts.push(`<div style="border:2pt solid ${verdictColor};border-radius:8pt;padding:14pt 18pt;background:${verdictColor}08;margin-bottom:14pt;display:flex;align-items:center;gap:20pt;page-break-inside:avoid;">
      <div style="text-align:center;flex-shrink:0;">
        <div style="font-size:22pt;font-weight:800;color:${verdictColor};font-family:'Courier New',monospace;line-height:1;">${escapeHtml(verdictKr || "")}</div>
        <div style="font-size:7pt;color:${verdictColor};text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">${escapeHtml(cv.verdict || "")}</div>
      </div>
      ${cv.logline_score != null ? `
      <div style="text-align:center;flex-shrink:0;border-left:1pt solid ${verdictColor}30;padding-left:20pt;">
        <div style="font-size:22pt;font-weight:800;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1;">${cv.logline_score}</div>
        <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">/ 100</div>
      </div>` : ""}
      ${cv.summary ? `<div style="font-size:9pt;color:#333;line-height:1.7;flex:1;">${escapeHtml(cv.summary)}</div>` : ""}
    </div>`);

    const cvScoreFields = {
      premise_score: "전제/아이디어", structure_score: "구조", character_score: "캐릭터",
      dialogue_score: "대사", tone_score: "톤/분위기", marketability_score: "상업성",
    };
    const hasScores = Object.entries(cvScoreFields).some(([k]) => cv[k] != null);
    if (hasScores) {
      parts.push(subsectionTitle("세부 평가"));
      parts.push(Object.entries(cvScoreFields).map(([k, label]) =>
        cv[k] != null ? scoreBar(label, cv[k], 10, "#60A5FA") : ""
      ).join(""));
    }

    parts.push(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10pt;margin-top:10pt;margin-bottom:10pt;">`);
    if ((cv.strengths || []).length) {
      parts.push(`<div style="border:1pt solid #4ECCA330;border-radius:5pt;padding:10pt;background:#4ECCA306;">
        <div style="font-size:7pt;font-weight:700;color:#4ECCA3;text-transform:uppercase;letter-spacing:1px;margin-bottom:6pt;">강점</div>
        ${cv.strengths.map(s => `<div style="font-size:8.5pt;color:#1a1a2e;margin-bottom:3pt;padding-left:8pt;position:relative;"><span style="position:absolute;left:0;color:#4ECCA3;">✓</span>${escapeHtml(s)}</div>`).join("")}
      </div>`);
    }
    if ((cv.weaknesses || []).length) {
      parts.push(`<div style="border:1pt solid #E85D7530;border-radius:5pt;padding:10pt;background:#E85D7506;">
        <div style="font-size:7pt;font-weight:700;color:#E85D75;text-transform:uppercase;letter-spacing:1px;margin-bottom:6pt;">개선 사항</div>
        ${cv.weaknesses.map(s => `<div style="font-size:8.5pt;color:#1a1a2e;margin-bottom:3pt;padding-left:8pt;position:relative;"><span style="position:absolute;left:0;color:#E85D75;">•</span>${escapeHtml(s)}</div>`).join("")}
      </div>`);
    }
    parts.push(`</div>`);

    if (cv.recommendation) parts.push(infoBox("최종 제언", escapeHtml(cv.recommendation), "#60A5FA"));
  }

  if (valuationResult) {
    const vl = valuationResult;
    parts.push(subsectionTitle("시장 가치 평가", "#C8A84B"));
    parts.push(`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8pt;margin-bottom:10pt;">
      ${vl.market_value_score != null ? `
      <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:10pt;text-align:center;background:#f9f9f9;">
        <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4pt;">시장 가치</div>
        <div style="font-size:22pt;font-weight:800;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1;">${vl.market_value_score}</div>
        <div style="font-size:7.5pt;color:#aaa;margin-top:3pt;">/ 10</div>
      </div>` : ""}
      ${vl.investment_grade ? `
      <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:10pt;text-align:center;background:#f9f9f9;">
        <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4pt;">투자 등급</div>
        <div style="font-size:16pt;font-weight:800;color:#C8A84B;font-family:'Courier New',monospace;line-height:1.2;margin-top:4pt;">${escapeHtml(vl.investment_grade)}</div>
      </div>` : ""}
      ${vl.comparable_budget ? `
      <div style="border:1pt solid #e0e0e0;border-radius:6pt;padding:10pt;text-align:center;background:#f9f9f9;">
        <div style="font-size:7pt;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4pt;">유사 예산 규모</div>
        <div style="font-size:10pt;font-weight:700;color:#1a1a2e;margin-top:6pt;">${escapeHtml(vl.comparable_budget)}</div>
      </div>` : ""}
    </div>`);
    if (vl.target_platform) parts.push(kv("최적 플랫폼", escapeHtml(vl.target_platform)));
    if (vl.target_audience) parts.push(kv("핵심 타겟", escapeHtml(vl.target_audience)));
    if (vl.development_notes) parts.push(infoBox("개발 제언", escapeHtml(vl.development_notes), "#C8A84B"));
  }

  if (rewriteDiagResult) {
    parts.push(subsectionTitle("고쳐쓰기 전 진단", "#FB923C"));
    if (rewriteDiagResult.summary) parts.push(infoBox("", escapeHtml(rewriteDiagResult.summary), "#FB923C"));
    if (Array.isArray(rewriteDiagResult.priorities)) {
      rewriteDiagResult.priorities.forEach((p, i) => {
        parts.push(`<div style="border-left:3pt solid #FB923C;padding:6pt 10pt;margin-bottom:5pt;background:#FB923C06;page-break-inside:avoid;">
          <div style="font-size:8pt;font-weight:700;color:#FB923C;">우선순위 ${i + 1}${p.area ? " — " + escapeHtml(p.area) : ""}</div>
          ${p.issue ? `<div style="font-size:8.5pt;color:#555;margin-top:3pt;">문제: ${escapeHtml(p.issue)}</div>` : ""}
          ${p.action ? `<div style="font-size:8.5pt;color:#1a1a2e;margin-top:3pt;">→ ${escapeHtml(p.action)}</div>` : ""}
        </div>`);
      });
    }
  }

  return `<div style="page-break-before:always;">${parts.join("")}</div>`;
}

// ── Stage 8 ────────────────────────────────────────────────────────────────────
function buildStage8SectionHtml(data) {
  const { partialRewriteResult, fullRewriteResult, rewriteDiagResult } = data;
  if (!partialRewriteResult && !fullRewriteResult && !rewriteDiagResult) return "";

  const meta = STAGE_META["8"];
  const parts = [sectionHeader(meta.name, `Stage ${meta.num}`, meta.accent)];

  if (rewriteDiagResult) {
    parts.push(subsectionTitle("초고 진단", "#FB923C"));
    if (rewriteDiagResult.summary) parts.push(infoBox("", escapeHtml(rewriteDiagResult.summary), "#FB923C"));
    if (Array.isArray(rewriteDiagResult.priorities)) {
      rewriteDiagResult.priorities.forEach((p, i) => {
        parts.push(`<div style="border-left:3pt solid #FB923C;padding:6pt 10pt;margin-bottom:5pt;background:#FB923C06;page-break-inside:avoid;">
          <div style="font-size:8pt;font-weight:700;color:#FB923C;">우선순위 ${i + 1}${p.area ? " — " + escapeHtml(p.area) : ""}</div>
          ${p.issue ? `<div style="font-size:8.5pt;color:#555;margin-top:3pt;">문제: ${escapeHtml(p.issue)}</div>` : ""}
          ${p.action ? `<div style="font-size:8.5pt;color:#1a1a2e;margin-top:3pt;">→ ${escapeHtml(p.action)}</div>` : ""}
        </div>`);
      });
    }
  }

  if (partialRewriteResult) {
    parts.push(subsectionTitle("부분 재작성", "#60A5FA"));
    parts.push(`<div style="font-size:8.5pt;color:#1a1a2e;line-height:1.9;white-space:pre-wrap;word-break:keep-all;font-family:'Courier New',monospace;margin-bottom:10pt;">${escapeHtml(partialRewriteResult)}</div>`);
  }

  if (fullRewriteResult) {
    parts.push(subsectionTitle("전체 개고", "#A78BFA"));
    parts.push(`<div style="font-size:8.5pt;color:#1a1a2e;line-height:1.9;white-space:pre-wrap;word-break:keep-all;font-family:'Courier New',monospace;">${escapeHtml(fullRewriteResult)}</div>`);
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
