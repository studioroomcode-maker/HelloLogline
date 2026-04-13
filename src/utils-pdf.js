/**
 * HelloLogline PDF 내보내기 유틸리티
 * html2pdf.js를 사용하여 분석 결과를 PDF로 출력
 */

/**
 * 점수를 등급으로 변환
 */
function getGradeLabel(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

/**
 * 섹션 합계 계산
 */
function calcSectionTotal(result, section) {
  if (!result?.[section]) return 0;
  return Object.values(result[section]).reduce((sum, item) => sum + (item?.score || 0), 0);
}

/**
 * 현재 분석 결과로부터 PDF HTML을 생성합니다
 */
function buildPdfHtml({
  logline,
  genre,
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
  darkMode,
}) {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  const qualScore = result
    ? calcSectionTotal(result, "structure") + calcSectionTotal(result, "expression") + calcSectionTotal(result, "technical")
    : null;
  const intScore = result ? calcSectionTotal(result, "interest") : null;
  const qualGrade = qualScore != null ? getGradeLabel(qualScore) : "-";
  const intGrade = intScore != null ? getGradeLabel(intScore) : "-";

  const synopsisText =
    pipelineResult?.synopsis ||
    synopsisResults?.synopses?.[0]?.synopsis ||
    "";

  const bg = "#ffffff";
  const text = "#1a1a2e";
  const accent = "#4ECCA3";
  const muted = "#666680";
  const border = "#e0e0ee";
  const card = "#f8f9fc";

  const section = (title, content, color = accent) => `
    <div style="margin-bottom:28px;">
      <div style="border-left:4px solid ${color}; padding:0 0 0 14px; margin-bottom:14px;">
        <h2 style="font-size:16px; font-weight:800; color:${text}; margin:0 0 2px; font-family:sans-serif;">${title}</h2>
      </div>
      ${content}
    </div>
  `;

  const scoreRow = (label, score) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid ${border};">
      <span style="font-size:12px; color:${muted}; font-family:sans-serif;">${label}</span>
      <span style="font-size:12px; font-weight:700; color:${text}; font-family:monospace;">${score ?? "-"}</span>
    </div>
  `;

  // ── 로그라인 분석 섹션 ──
  const loglineSection = result ? section("로그라인 분석", `
    <div style="background:${card}; border:1px solid ${border}; border-radius:10px; padding:16px; margin-bottom:14px;">
      <p style="font-size:14px; color:${text}; line-height:1.8; margin:0; font-family:sans-serif;">"${logline}"</p>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
      <div style="background:${card}; border:1px solid ${border}; border-radius:8px; padding:14px; text-align:center;">
        <div style="font-size:10px; color:${muted}; font-family:monospace; text-transform:uppercase; margin-bottom:6px;">품질 점수</div>
        <div style="font-size:28px; font-weight:800; color:${accent}; font-family:monospace;">${qualScore ?? "-"}</div>
        <div style="font-size:12px; color:${muted}; font-family:monospace;">등급: ${qualGrade}</div>
      </div>
      <div style="background:${card}; border:1px solid ${border}; border-radius:8px; padding:14px; text-align:center;">
        <div style="font-size:10px; color:${muted}; font-family:monospace; text-transform:uppercase; margin-bottom:6px;">흥미도</div>
        <div style="font-size:28px; font-weight:800; color:#FFD166; font-family:monospace;">${intScore ?? "-"}</div>
        <div style="font-size:12px; color:${muted}; font-family:monospace;">등급: ${intGrade}</div>
      </div>
    </div>
    ${result.structure ? `
    <div style="margin-bottom:10px;">
      <div style="font-size:11px; font-weight:700; color:${muted}; text-transform:uppercase; margin-bottom:8px; font-family:monospace;">구조적 완성도</div>
      ${Object.entries(result.structure).map(([k, v]) => scoreRow(k, v?.score)).join("")}
    </div>` : ""}
    ${result.overall_feedback ? `
    <div style="background:rgba(78,204,163,0.06); border:1px solid rgba(78,204,163,0.2); border-radius:8px; padding:12px; margin-top:12px;">
      <div style="font-size:11px; font-weight:700; color:${accent}; margin-bottom:6px; font-family:monospace;">종합 피드백</div>
      <p style="font-size:12px; color:${text}; line-height:1.7; margin:0; font-family:sans-serif;">${result.overall_feedback}</p>
    </div>` : ""}
  `) : "";

  // ── 캐릭터 섹션 ──
  const protagonist = charDevResult?.protagonist;
  const charSection = protagonist ? section("캐릭터 분석", `
    <div style="background:${card}; border:1px solid ${border}; border-radius:8px; padding:14px; margin-bottom:10px;">
      <div style="font-size:12px; font-weight:700; color:${text}; margin-bottom:10px; font-family:sans-serif;">주인공</div>
      ${scoreRow("이름/유형", protagonist.name_suggestion || protagonist.name || "-")}
      ${scoreRow("외적 목표 (Want)", protagonist.want || "-")}
      ${scoreRow("내적 욕구 (Need)", protagonist.need || "-")}
      ${scoreRow("핵심 결함", protagonist.flaw || "-")}
      ${scoreRow("변화 호 (Arc)", protagonist.arc_type || "-")}
    </div>
    ${charDevResult.moral_argument ? `
    <div style="background:rgba(251,146,60,0.06); border:1px solid rgba(251,146,60,0.2); border-radius:8px; padding:12px;">
      <div style="font-size:11px; font-weight:700; color:#FB923C; margin-bottom:6px; font-family:monospace;">도덕적 논거</div>
      <p style="font-size:12px; color:${text}; margin:0; font-family:sans-serif;">${charDevResult.moral_argument}</p>
    </div>` : ""}
  `, "#FB923C") : "";

  // ── 시놉시스 섹션 ──
  const synopsisSection = synopsisText ? section("시놉시스", `
    <div style="background:${card}; border:1px solid ${border}; border-radius:8px; padding:14px;">
      <p style="font-size:13px; color:${text}; line-height:1.8; margin:0; font-family:sans-serif; white-space:pre-wrap;">${synopsisText}</p>
    </div>
  `) : "";

  // ── 트리트먼트 섹션 ──
  const treatmentSection = treatmentResult ? section("트리트먼트", `
    <div style="background:${card}; border:1px solid ${border}; border-radius:8px; padding:14px;">
      <p style="font-size:12px; color:${text}; line-height:1.8; margin:0; font-family:sans-serif; white-space:pre-wrap;">${treatmentResult.slice(0, 3000)}${treatmentResult.length > 3000 ? "\n\n[이하 생략...]" : ""}</p>
    </div>
  `, "#FFD166") : "";

  // ── 시나리오 초고 섹션 ──
  const draftSection = scenarioDraftResult ? section("시나리오 초고", `
    <div style="background:${card}; border:1px solid ${border}; border-radius:8px; padding:14px;">
      <p style="font-size:12px; color:${text}; line-height:1.8; margin:0; font-family:'Courier New', monospace; white-space:pre-wrap;">${scenarioDraftResult.slice(0, 4000)}${scenarioDraftResult.length > 4000 ? "\n\n[이하 생략...]" : ""}</p>
    </div>
  `, "#A78BFA") : "";

  // ── Script Coverage 섹션 ──
  const coverageSection = scriptCoverageResult ? section("Script Coverage", `
    <div style="display:flex; gap:12px; margin-bottom:14px;">
      <div style="background:${card}; border:1px solid ${border}; border-radius:8px; padding:14px; text-align:center; flex:1;">
        <div style="font-size:10px; color:${muted}; font-family:monospace; text-transform:uppercase; margin-bottom:6px;">전체 점수</div>
        <div style="font-size:28px; font-weight:800; color:#60A5FA; font-family:monospace;">${scriptCoverageResult.overall_score ?? "-"}</div>
      </div>
      <div style="background:${card}; border:1px solid ${border}; border-radius:8px; padding:14px; text-align:center; flex:1;">
        <div style="font-size:10px; color:${muted}; font-family:monospace; text-transform:uppercase; margin-bottom:6px;">추천 여부</div>
        <div style="font-size:14px; font-weight:800; color:${text}; font-family:sans-serif; margin-top:8px;">${scriptCoverageResult.recommendation || "-"}</div>
      </div>
    </div>
    ${(scriptCoverageResult.strengths || []).length > 0 ? `
    <div style="background:rgba(78,204,163,0.06); border:1px solid rgba(78,204,163,0.2); border-radius:8px; padding:12px; margin-bottom:8px;">
      <div style="font-size:11px; font-weight:700; color:${accent}; margin-bottom:8px; font-family:monospace;">강점</div>
      ${scriptCoverageResult.strengths.map(s => `<p style="font-size:12px; color:${text}; margin:0 0 4px; font-family:sans-serif;">✓ ${s}</p>`).join("")}
    </div>` : ""}
    ${(scriptCoverageResult.weaknesses || []).length > 0 ? `
    <div style="background:rgba(232,93,117,0.06); border:1px solid rgba(232,93,117,0.2); border-radius:8px; padding:12px;">
      <div style="font-size:11px; font-weight:700; color:#E85D75; margin-bottom:8px; font-family:monospace;">개선 사항</div>
      ${scriptCoverageResult.weaknesses.map(s => `<p style="font-size:12px; color:${text}; margin:0 0 4px; font-family:sans-serif;">• ${s}</p>`).join("")}
    </div>` : ""}
  `, "#60A5FA") : "";

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>HelloLogline 분석 리포트</title>
  <style>
    * { box-sizing: border-box; }
    body { margin:0; padding:0; background:${bg}; color:${text}; font-family:sans-serif; }
    @page { margin: 15mm; }
  </style>
</head>
<body style="padding:0; margin:0;">
  <!-- 표지 -->
  <div style="text-align:center; padding:48px 40px 36px; border-bottom:2px solid ${accent}; margin-bottom:32px;">
    <div style="font-size:11px; font-family:monospace; color:${muted}; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">HelloLogline Analysis Report</div>
    <h1 style="font-size:22px; font-weight:800; color:${text}; margin:0 0 8px;">${logline.slice(0, 80)}${logline.length > 80 ? "…" : ""}</h1>
    <div style="font-size:12px; color:${muted}; font-family:monospace;">${today}</div>
  </div>

  <div style="padding:0 20px 40px;">
    ${loglineSection}
    ${charSection}
    ${synopsisSection}
    ${treatmentSection}
    ${draftSection}
    ${coverageSection}
  </div>

  <!-- 푸터 -->
  <div style="border-top:1px solid ${border}; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
    <span style="font-size:10px; color:${muted}; font-family:monospace;">HelloLogline — AI 시나리오 개발 워크스테이션</span>
    <span style="font-size:10px; color:${muted}; font-family:monospace;">${today}</span>
  </div>
</body>
</html>`;
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
    const qualScore = Object.values(result.structure || {}).reduce((s, v) => s + (v?.score || 0), 0)
      + Object.values(result.expression || {}).reduce((s, v) => s + (v?.score || 0), 0)
      + Object.values(result.technical || {}).reduce((s, v) => s + (v?.score || 0), 0);
    const intScore = Object.values(result.interest || {}).reduce((s, v) => s + (v?.score || 0), 0);
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

  if (synopsisText) {
    lines.push(`## 시놉시스\n${synopsisText}\n`);
  }

  if (treatmentResult) {
    lines.push(`## 트리트먼트\n${treatmentResult}\n`);
  }

  if (beatSheetResult?.beats?.length) {
    lines.push(`## 비트 시트`);
    beatSheetResult.beats.forEach(b => {
      lines.push(`### ${b.name_kr || b.name} (p.${b.page_start || "?"})`);
      lines.push(`${b.summary || ""}`);
      if (b.key_elements?.length) lines.push(`- ${b.key_elements.join("\n- ")}`);
    });
    lines.push("");
  }

  if (scenarioDraftResult) {
    lines.push(`## 시나리오 초고\n\`\`\`\n${scenarioDraftResult}\n\`\`\`\n`);
  }

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
 * 분석 결과를 PDF로 내보냅니다
 * @param {object} data - 분석 결과 데이터
 * @param {string} filename - 저장할 파일명 (확장자 제외)
 */
export async function exportToPdf(data, filename = "hellologline-report") {
  const html2pdf = (await import("html2pdf.js")).default;

  const container = document.createElement("div");
  container.innerHTML = buildPdfHtml(data);
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const opt = {
    margin: [15, 15, 15, 15],
    filename: `${filename}.pdf`,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * 전체 HTML 문서 문자열을 A4 PDF로 다운로드합니다.
 * <head><style>을 DOMParser로 추출해 wrapper div에 포함시켜 html2pdf에 전달합니다.
 *
 * @param {string} htmlString  - 전체 HTML 문서 문자열 (<!DOCTYPE html>... 포함)
 * @param {string} filename    - 저장 파일명 (확장자 제외)
 * @param {number[]} [margin]  - [상, 우, 하, 좌] mm 단위 여백, 기본 [20, 20, 20, 25]
 */
export async function downloadHtmlAsPdf(htmlString, filename = "document", margin = [20, 20, 20, 25]) {
  const html2pdf = (await import("html2pdf.js")).default;

  // DOMParser로 head/body 분리
  const parser = new DOMParser();
  const parsed = parser.parseFromString(htmlString, "text/html");
  const bodyHtml = parsed.body.innerHTML;

  // <style> 태그를 실제 <head>에 주입 — html2canvas가 body 내부 <style>을 무시하는 문제 방지
  const injectedStyles = Array.from(parsed.head.querySelectorAll("style")).map(s => {
    const el = document.createElement("style");
    el.textContent = s.textContent;
    el.setAttribute("data-hll-pdf-temp", "1");
    document.head.appendChild(el);
    return el;
  });

  // body 콘텐츠만 container에 삽입
  const container = document.createElement("div");
  container.style.cssText = "position:absolute;left:-9999px;top:0;width:170mm;background:#fff;";
  container.innerHTML = bodyHtml;
  document.body.appendChild(container);

  const opt = {
    margin,
    filename: `${filename}.pdf`,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] },
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } finally {
    document.body.removeChild(container);
    // 임시 주입한 <style> 태그 정리
    injectedStyles.forEach(el => el.parentNode?.removeChild(el));
  }
}
