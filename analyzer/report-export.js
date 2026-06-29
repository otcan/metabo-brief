export const EXPORT_SCHEMA_VERSION = "0.1.0";

export const SENSITIVE_EXPORT_WARNING =
  "This export contains sensitive genetic findings and analysis metadata. Store it carefully and share it only with people or systems you trust.";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function formatScore(value) {
  return value === null || value === undefined ? "Insufficient" : `${Math.round(value)}/100`;
}

function formatLabel(value) {
  return String(value || "unknown")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, char => char.toUpperCase());
}

function deepSort(value) {
  if (Array.isArray(value)) {
    return value.map(deepSort);
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(key => [key, deepSort(value[key])])
  );
}

export function stableStringify(value) {
  return JSON.stringify(deepSort(value), null, 2);
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildDeterministicReport(report) {
  const { generatedAt, ...deterministicReport } = report || {};
  return JSON.parse(JSON.stringify(deterministicReport));
}

export function buildReplayMetadata(report, deterministicReportSha256 = null) {
  const validation = report.validation || {};
  const coverage = report.coverage || {};
  return {
    applicationVersion: report.applicationVersion || null,
    reportSchemaVersion: report.reportSchemaVersion || null,
    panelVersion: report.panelVersion || null,
    panelSha256: report.panelSha256 || null,
    deterministicReportSha256,
    pathwayModelVersions: report.pathwayModelVersions || [],
    inputValidation: {
      provider: validation.provider || "not detected",
      providerConfidence: validation.providerConfidence || "none",
      format: validation.format || "unrecognized rsID table",
      formatConfidence: validation.formatConfidence || "low",
      genomeBuild: validation.genomeBuild || "not detected",
      genomeBuildConfidence: validation.genomeBuildConfidence || "none",
      orientation: validation.orientation || "provider-native",
      orientationConfidence: validation.orientationConfidence || "limited",
      validationStatus: validation.validationStatus || "limited"
    },
    scoreability: validation.scoreability || {
      canScore: false,
      status: "do_not_score",
      label: "Do not score",
      blockingReasons: ["Scoreability metadata was not present in this report."],
      limitations: [],
      excludedRsids: []
    },
    coverage: {
      panelVariantCount: coverage.panelVariantCount || 0,
      presentPanelVariantCount: coverage.presentPanelVariantCount || 0,
      interpretablePanelVariantCount: coverage.interpretablePanelVariantCount || 0,
      interpretedFindingCount: coverage.interpretedFindingCount || 0,
      missingPanelVariantCount: coverage.missingPanelVariantCount || 0,
      uninterpretablePanelVariantCount: coverage.uninterpretablePanelVariantCount || 0,
      excludedPanelVariantCount: coverage.excludedPanelVariantCount || 0,
      scoreEligibleFindingCount: coverage.scoreEligibleFindingCount || 0,
      scoredPanelVariantCount: coverage.scoredPanelVariantCount || 0,
      directlyObservedFindingCount: coverage.directlyObservedFindingCount || 0
    },
    limitations: validation.limitations || []
  };
}

export async function buildJsonExportPayload(report, options = {}) {
  const deterministicReport = buildDeterministicReport(report);
  const deterministicReportJson = stableStringify(deterministicReport);
  const deterministicReportSha256 = await sha256Hex(deterministicReportJson);

  return {
    exportSchemaVersion: EXPORT_SCHEMA_VERSION,
    exportKind: "metabobrief-snp-report",
    warning: SENSITIVE_EXPORT_WARNING,
    runMetadata: {
      exportedAt: options.exportedAt || new Date().toISOString(),
      reportGeneratedAt: report.generatedAt || null
    },
    replayMetadata: buildReplayMetadata(report, deterministicReportSha256),
    deterministicReport
  };
}

function renderKeyValueRows(rows) {
  return rows.map(([label, value]) => `
    <tr>
      <th>${escapeHtml(label)}</th>
      <td>${escapeHtml(value)}</td>
    </tr>
  `).join("");
}

function renderPathwayRows(scores) {
  return (scores || []).map(score => `
    <tr>
      <td>
        <strong>${escapeHtml(score.title || score.pathwayId)}</strong>
        <small>${escapeHtml(score.pathwayId)} ${escapeHtml(score.modelVersion || "")}</small>
      </td>
      <td>${escapeHtml(formatScore(score.score))}</td>
      <td>${escapeHtml(formatLabel(score.resultSupport))}</td>
      <td>${escapeHtml(formatLabel(score.evidenceQuality))}</td>
      <td>${escapeHtml(formatPercent(score.coverage))}</td>
      <td>${escapeHtml(formatLabel(score.stability))}</td>
    </tr>
  `).join("");
}

function renderFindingRows(findings) {
  return (findings || []).map(finding => `
    <tr>
      <td>
        <strong>${escapeHtml(finding.gene)} ${escapeHtml(finding.rsid)}</strong>
        <small>${escapeHtml(finding.pathway)}</small>
      </td>
      <td>${escapeHtml(finding.genotype)}</td>
      <td>${escapeHtml(finding.evidenceLevel)}</td>
      <td>${escapeHtml(finding.effectDirection)}</td>
      <td>${escapeHtml(finding.interpretation)}</td>
    </tr>
  `).join("");
}

export async function buildPrintableReportHtml(report, options = {}) {
  const payload = options.payload || await buildJsonExportPayload(report, options);
  const replay = payload.replayMetadata;
  const validation = replay.inputValidation;
  const scoreability = replay.scoreability || {};
  const coverage = replay.coverage;
  const modelRows = (replay.pathwayModelVersions || []).map(model => `
    <tr>
      <td>${escapeHtml(`${model.modelId} ${model.modelVersion}`)}</td>
      <td><code>${escapeHtml(model.sha256 || "missing")}</code></td>
      <td>${escapeHtml(`${model.algorithmId || "algorithm"} ${model.algorithmVersion || "unknown"}`)}</td>
    </tr>
  `).join("");

  const embeddedPayload = escapeHtml(stableStringify(payload));
  const pathwayRows = renderPathwayRows(report.pathwayScores);
  const findingRows = renderFindingRows(report.findings);
  const warningRows = (report.warnings || []).map(warning => `<li>${escapeHtml(warning)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>MetaboBrief SNP Report</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      background: #f4f7fb;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    main { max-width: 1120px; margin: 0 auto; padding: 32px 20px 48px; }
    header, section { margin-bottom: 20px; padding: 18px; border: 1px solid #dbe3ee; background: #ffffff; }
    h1, h2, h3 { margin: 0; line-height: 1.2; }
    h1 { font-size: 28px; }
    h2 { margin-bottom: 12px; font-size: 19px; }
    p { margin: 8px 0 0; }
    .kicker { color: #0f766e; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .warning { border-color: #fecdd3; background: #fff1f2; color: #9f1239; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .metric { padding: 10px; border: 1px solid #e2e8f0; background: #fbfdff; }
    .metric span { display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 4px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { color: #334155; font-size: 12px; text-transform: uppercase; }
    td small { display: block; margin-top: 3px; color: #64748b; }
    ul { margin: 0; padding-left: 18px; }
    code { overflow-wrap: anywhere; }
    script { display: none; }
    @media print {
      body { background: #ffffff; }
      main { max-width: none; padding: 0; }
      header, section { break-inside: avoid; border-color: #cccccc; }
      .finding-table tr, .pathway-table tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="kicker">MetaboBrief SNP report</p>
      <h1>Pathway tendency scores and genotype findings</h1>
      <p>Generated by MetaboBrief ${escapeHtml(report.applicationVersion || "unknown")} from a local browser analysis. This report is informational and does not diagnose disease or recommend treatment.</p>
    </header>

    <section class="warning" aria-label="Sensitive export warning">
      ${escapeHtml(SENSITIVE_EXPORT_WARNING)}
    </section>

    <section>
      <h2>Replay metadata</h2>
      <table>
        <tbody>
          ${renderKeyValueRows([
            ["Application version", replay.applicationVersion],
            ["Report schema", replay.reportSchemaVersion],
            ["Export schema", payload.exportSchemaVersion],
            ["Panel version", replay.panelVersion],
            ["Panel SHA-256", replay.panelSha256 || "missing"],
            ["Deterministic report SHA-256", replay.deterministicReportSha256 || "missing"],
            ["Report generated at", payload.runMetadata.reportGeneratedAt || "not recorded"],
            ["Exported at", payload.runMetadata.exportedAt]
          ])}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Validation and coverage</h2>
      <div class="grid">
        <div class="metric"><span>Provider</span><strong>${escapeHtml(validation.provider)}</strong></div>
        <div class="metric"><span>Genome build</span><strong>${escapeHtml(validation.genomeBuild)}</strong></div>
        <div class="metric"><span>Validation</span><strong>${escapeHtml(formatLabel(validation.validationStatus))}</strong></div>
        <div class="metric"><span>Scoring</span><strong>${escapeHtml(scoreability.label || "Not assessed")}</strong></div>
      </div>
      <table>
        <tbody>
          ${renderKeyValueRows([
            ["Panel coverage", `${formatNumber(coverage.presentPanelVariantCount)} / ${formatNumber(coverage.panelVariantCount)}`],
            ["Format", `${validation.format} (${validation.formatConfidence})`],
            ["Orientation", `${validation.orientation} (${validation.orientationConfidence})`],
            ["Interpreted findings", formatNumber(coverage.interpretedFindingCount)],
            ["Score eligible findings", formatNumber(coverage.scoreEligibleFindingCount)],
            ["Scored loci", formatNumber(coverage.scoredPanelVariantCount)],
            ["Missing panel loci", formatNumber(coverage.missingPanelVariantCount)],
            ["Uninterpretable panel loci", formatNumber(coverage.uninterpretablePanelVariantCount)],
            ["Excluded panel loci", formatNumber(coverage.excludedPanelVariantCount)],
            ["Score blocking reasons", (scoreability.blockingReasons || []).join(" / ") || "none"]
          ])}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Pathway scores</h2>
      <table class="pathway-table">
        <thead>
          <tr><th>Pathway</th><th>Score</th><th>Support</th><th>Evidence</th><th>Coverage</th><th>Stability</th></tr>
        </thead>
        <tbody>${pathwayRows || '<tr><td colspan="6">No pathway scores available.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>Findings</h2>
      <table class="finding-table">
        <thead>
          <tr><th>Variant</th><th>Genotype</th><th>Evidence</th><th>Direction</th><th>Interpretation</th></tr>
        </thead>
        <tbody>${findingRows || '<tr><td colspan="5">No findings available.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>Model versions</h2>
      <table>
        <thead><tr><th>Model</th><th>SHA-256</th><th>Algorithm</th></tr></thead>
        <tbody>${modelRows || '<tr><td colspan="3">No model metadata available.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>Warnings and limitations</h2>
      <ul>${warningRows || "<li>No warnings reported.</li>"}</ul>
    </section>
  </main>
  <script id="metabobrief-export-json" type="application/json">${embeddedPayload}</script>
</body>
</html>`;
}
