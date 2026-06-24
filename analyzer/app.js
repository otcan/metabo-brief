import { analyzeVariants, parseRawGenotype } from "./snp-core.js";

const state = {
  panel: null,
  latestReport: null,
  query: "",
  pathway: "all"
};

const els = {
  file: document.getElementById("snp-file"),
  fileName: document.getElementById("selected-file-name"),
  sample: document.getElementById("load-sample"),
  exportJson: document.getElementById("export-json"),
  status: document.getElementById("analyzer-status"),
  panelRelease: document.getElementById("panel-release"),
  panelVariantCount: document.getElementById("panel-variant-count"),
  panelClaimCount: document.getElementById("panel-claim-count"),
  panelStudyCount: document.getElementById("panel-study-count"),
  summary: document.getElementById("analysis-summary"),
  findings: document.getElementById("analysis-findings"),
  warnings: document.getElementById("analysis-warnings"),
  findingSearch: document.getElementById("finding-search"),
  pathwayFilter: document.getElementById("pathway-filter"),
  findingCount: document.getElementById("finding-count")
};

function setStatus(message, stateName = "neutral") {
  els.status.textContent = message;
  els.status.dataset.state = stateName;
}

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

function plural(value, singular, pluralLabel = `${singular}s`) {
  return Number(value) === 1 ? singular : pluralLabel;
}

function formatLabel(value) {
  return String(value || "unknown")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, char => char.toUpperCase());
}

function primaryPathway(finding) {
  return finding.pathways?.[0] || finding.pathway || "Genetic context";
}

function findingTitle(finding) {
  const pathway = primaryPathway(finding);
  const pathwayText = pathway.toLowerCase();
  if (pathwayText.includes("caffeine") || pathwayText.includes("stimulant")) {
    return "Caffeine and stimulant sensitivity context";
  }
  if (pathwayText.includes("methylation")) {
    return "Methylation pathway context";
  }
  if (pathwayText.includes("b12")) {
    return "B12 transport context";
  }
  if (pathwayText.includes("iron")) {
    return "Iron handling context";
  }
  if (pathwayText.includes("glucose")) {
    return "Glucose metabolism context";
  }
  if (pathwayText.includes("lipid")) {
    return "Lipid metabolism context";
  }
  if (pathwayText.includes("histamine")) {
    return "Histamine pathway context";
  }
  return `${pathway} context found`;
}

function practicalMeaning(finding) {
  const pathway = primaryPathway(finding).toLowerCase();
  if (finding.relevance === "clinical" || finding.actionability === "discuss") {
    return "This may be worth discussing with a qualified professional, especially if it overlaps with symptoms, medication use, or lab results.";
  }
  if (finding.relevance === "trait") {
    return "This may describe a reported tendency in some populations, but environment, ancestry, and study design can strongly affect interpretation.";
  }
  return `This can provide genetic context for ${pathway}, but it does not measure your current biology or prove that the pathway is impaired.`;
}

function limitationSummary(finding) {
  if (finding.limitations?.length) {
    return finding.limitations[0];
  }
  return "This does not diagnose a condition, estimate total risk, or replace confirmatory clinical testing.";
}

function nextStep(finding) {
  if (finding.actionability === "discuss") {
    return "Use this as a discussion point with a qualified professional before making health or medication decisions.";
  }
  if (finding.actionability === "confirm") {
    return "Confirm the context with source studies, measured biomarkers, or professional review before acting on it.";
  }
  return "Treat this as informational context and compare it with lived response, lifestyle factors, and measured labs where relevant.";
}

function findingMatchesCategory(finding, category) {
  const text = [
    finding.gene,
    finding.rsid,
    finding.pathway,
    finding.targetType,
    finding.evidenceLevel,
    finding.relevance,
    finding.actionability
  ].join(" ").toLowerCase();

  if (category === "medication") {
    return /caffeine|stimulant|cyp|nat2|ugt|adora|ahr|aldh|adh/.test(text);
  }
  if (category === "clinical") {
    return /clinical|discuss|deficiency|requires confirmation/.test(text);
  }
  if (category === "metabolism") {
    return /methylation|b12|iron|glucose|lipid|histamine|choline|sulfur|oxidative|mitochondrial|estrogen|nitric|carbohydrate/.test(text);
  }
  if (category === "traits") {
    return finding.relevance === "trait" || /trait|tendency|biomarker/.test(text);
  }
  if (category === "confirmation") {
    return finding.actionability === "confirm" || finding.actionability === "discuss" || finding.reviewStatus !== "curated";
  }
  return false;
}

function buildAtAGlance(report) {
  const categories = [
    {
      id: "medication",
      title: "Medication response",
      description: "Drug, caffeine, stimulant, or detoxification-adjacent variants represented in the current panel."
    },
    {
      id: "clinical",
      title: "Clinically important context",
      description: "Findings that should be treated as professional-review context, not diagnosis."
    },
    {
      id: "metabolism",
      title: "Metabolism and nutrition",
      description: "Methylation, nutrient transport, glucose, lipid, histamine, and related pathway context."
    },
    {
      id: "traits",
      title: "Traits and tendencies",
      description: "Reported tendencies that may vary by ancestry, environment, and study design."
    },
    {
      id: "confirmation",
      title: "Findings needing confirmation",
      description: "Items where the current report should be confirmed or contextualized before action."
    }
  ];

  const items = categories.map(category => {
    const matches = report.findings.filter(finding => findingMatchesCategory(finding, category.id));
    return {
      ...category,
      count: matches.length,
      examples: matches.slice(0, 3).map(finding => `${finding.gene} ${finding.rsid}`)
    };
  });

  const coverage = report.coverage || {};
  items.push({
    id: "coverage",
    title: "Coverage and limitations",
    description: "How much of the starter panel was callable from this file.",
    count: coverage.presentPanelVariantCount || 0,
    examples: [
      `${formatNumber(coverage.presentPanelVariantCount)} of ${formatNumber(coverage.panelVariantCount)} panel loci present`,
      `${formatNumber(report.validation?.limitations?.length)} validation ${plural(report.validation?.limitations?.length, "limit")}`
    ]
  });

  return items;
}

function renderAtAGlance(report) {
  const cards = buildAtAGlance(report).map(item => `
    <article class="glance-card" data-category="${escapeHtml(item.id)}">
      <div>
        <span>${formatNumber(item.count)}</span>
        <strong>${escapeHtml(item.title)}</strong>
      </div>
      <p>${escapeHtml(item.description)}</p>
      <small>${item.examples.length ? escapeHtml(item.examples.join(" / ")) : "No matching findings in this run."}</small>
    </article>
  `).join("");

  return `
    <section class="report-overview" aria-label="At a glance">
      <div class="report-overview-heading">
        <p class="snp-kicker">At a glance</p>
        <h3>Report overview</h3>
      </div>
      <div class="glance-grid">${cards}</div>
    </section>
  `;
}

function renderSummary(report) {
  const matched = report.findings.length;
  const panelSize = state.panel.variants.length;
  const headerState = report.metadata.detectedHeader ? "Detected" : "Inferred";
  const coverage = report.coverage || {};
  const validation = report.validation || {};
  const validationRows = [
    ["Provider", `${validation.provider || "not detected"} (${validation.providerConfidence || "none"})`],
    ["Format", `${validation.format || "unrecognized"} (${validation.formatConfidence || "low"})`],
    ["Genome build", `${validation.genomeBuild || "not detected"} (${validation.genomeBuildConfidence || "none"})`],
    ["Orientation", `${validation.orientation || "provider-native"} (${validation.orientationConfidence || "limited"})`],
    ["File plausibility", validation.filePlausibility || "not assessed"]
  ].map(([label, value]) => `
    <div class="validation-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join("");

  els.summary.innerHTML = `
    <div class="analysis-validation" data-status="${escapeHtml(validation.validationStatus || "limited")}">
      <div class="validation-heading">
        <span>Validation</span>
        <strong>${escapeHtml(formatLabel(validation.validationStatus || "limited"))}</strong>
      </div>
      ${validationRows}
    </div>
    <div class="analysis-stat"><span>Parsed SNPs</span><strong>${formatNumber(report.metadata.parsedVariantCount)}</strong></div>
    <div class="analysis-stat"><span>Panel loci present</span><strong>${formatNumber(coverage.presentPanelVariantCount ?? matched)}/${panelSize}</strong></div>
    <div class="analysis-stat"><span>Interpreted</span><strong>${formatNumber(coverage.interpretedFindingCount ?? matched)}</strong></div>
    <div class="analysis-stat"><span>Not in file</span><strong>${formatNumber(coverage.missingPanelVariantCount ?? report.missing.length)}</strong></div>
    <div class="analysis-stat"><span>Uninterpretable</span><strong>${formatNumber(coverage.uninterpretablePanelVariantCount ?? report.unknownGenotypes.length)}</strong></div>
    <div class="analysis-stat"><span>No-calls</span><strong>${formatNumber(report.metadata.noCallCount)}</strong></div>
    <div class="analysis-stat"><span>Header</span><strong>${headerState}</strong></div>
  `;

  const pathways = report.pathwaySummary.map(item => `
    <li>
      <div>
        <strong>${escapeHtml(item.pathway)}</strong>
        <span>${formatNumber(item.findingCount)} interpreted finding${item.findingCount === 1 ? "" : "s"}</span>
      </div>
    </li>
  `).join("");

  if (pathways) {
    els.summary.insertAdjacentHTML("beforeend", `
      <div class="analysis-pathways">
        <h3>Finding groups</h3>
        <ul>${pathways}</ul>
      </div>
    `);
  }
}

function renderWarnings(report) {
  els.warnings.innerHTML = (report.warnings.length ? report.warnings : ["No warnings reported."]).map(warning => `
    <li>${escapeHtml(warning)}</li>
  `).join("");
}

function findingMatchesQuery(finding, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    finding.gene,
    finding.rsid,
    finding.label,
    finding.pathway,
    finding.genotype,
    finding.evidenceLevel,
    finding.targetType,
    finding.interpretation,
    ...(finding.aliases || [])
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function visibleFindings(report) {
  const query = state.query.trim().toLowerCase();
  return report.findings.filter(finding => {
    const pathwayMatch = state.pathway === "all" || finding.pathways.includes(state.pathway);
    return pathwayMatch && findingMatchesQuery(finding, query);
  });
}

function populatePathwayFilter(report) {
  const selected = state.pathway;
  const options = [
    '<option value="all">All pathways</option>',
    ...report.pathwaySummary.map(item => `
      <option value="${escapeHtml(item.pathway)}">${escapeHtml(item.pathway)}</option>
    `)
  ].join("");

  els.pathwayFilter.innerHTML = options;
  els.pathwayFilter.value = report.pathwaySummary.some(item => item.pathway === selected) ? selected : "all";
  state.pathway = els.pathwayFilter.value;
}

function updateFindingCount(report, visibleCount) {
  const total = report.findings.length;
  els.findingCount.textContent = total
    ? `${visibleCount} of ${total} shown`
    : "0 findings";
}

function renderFindings(report) {
  const overview = renderAtAGlance(report);

  if (!report.findings.length) {
    updateFindingCount(report, 0);
    els.findings.innerHTML = `
      ${overview}
      <div class="analysis-empty">
        <h3>No panel variants matched</h3>
        <p>The file parsed successfully, but none of the current panel rsIDs were present.</p>
      </div>
    `;
    return;
  }

  const findings = visibleFindings(report);
  updateFindingCount(report, findings.length);

  if (!findings.length) {
    els.findings.innerHTML = `
      ${overview}
      <div class="analysis-empty">
        <h3>No findings match the filters</h3>
        <p>Clear search or choose all pathways to return to the full report.</p>
      </div>
    `;
    return;
  }

  const cards = findings.map(finding => {
    const links = finding.sourceLinks.slice(0, 6).map(link => `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>
    `).join("");

    const limitations = finding.limitations.slice(0, 4).map(item => `<li>${escapeHtml(item)}</li>`).join("");
    const markers = finding.validationMarkers.slice(0, 4).map(item => `<li>${escapeHtml(item)}</li>`).join("");
    const sourceCount = finding.sourceLinks.length;
    const effectDirection = String(finding.effectDirection || "uncertain").replace(/_/g, " ");
    const actionability = String(finding.actionability || "informational").replace(/_/g, " ");
    const title = findingTitle(finding);

    return `
      <article class="finding-card">
        <div class="finding-topline">
          <div>
            <p class="finding-kicker">${escapeHtml(finding.pathway)}</p>
            <h3>${escapeHtml(title)}</h3>
          </div>
          <div class="finding-status">
            <span>Review</span>
            <strong>${escapeHtml(finding.reviewStatus)}</strong>
          </div>
        </div>
        <p class="finding-label">Your file contains ${escapeHtml(finding.gene)} ${escapeHtml(finding.rsid)} ${escapeHtml(finding.genotype)}.</p>
        <div class="finding-meta">
          <span>Evidence: ${escapeHtml(finding.evidenceLevel)}</span>
          <span>Meaning: ${escapeHtml(finding.relevance)}</span>
          <span>Direction: ${escapeHtml(effectDirection)}</span>
          <span>Action: ${escapeHtml(actionability)}</span>
        </div>
        <div class="finding-answer-grid">
          <div>
            <span>What did we find?</span>
            <p>${escapeHtml(finding.interpretation)}</p>
          </div>
          <div>
            <span>Why it might matter</span>
            <p>${escapeHtml(practicalMeaning(finding))}</p>
          </div>
          <div>
            <span>What this does not mean</span>
            <p>${escapeHtml(limitationSummary(finding))}</p>
          </div>
          <div>
            <span>Next step</span>
            <p>${escapeHtml(nextStep(finding))}</p>
          </div>
        </div>
        <details class="technical-details">
          <summary>Source and technical details</summary>
          <div class="technical-grid">
            <div><span>Gene</span><strong>${escapeHtml(finding.gene)}</strong></div>
            <div><span>rsID</span><strong>${escapeHtml(finding.rsid)}</strong></div>
            <div><span>Observed genotype</span><strong>${escapeHtml(finding.genotype)} <small>raw ${escapeHtml(finding.rawGenotype)}</small></strong></div>
            <div><span>Target type</span><strong>${escapeHtml(finding.targetType)}</strong></div>
            <div><span>Coverage</span><strong>${escapeHtml(finding.coverageConfidence)}</strong></div>
            <div><span>Sources</span><strong>${sourceCount}</strong></div>
          </div>
          <div class="finding-grid">
            <div>
              <h4>Validation markers</h4>
              <ul>${markers || "<li>None specified.</li>"}</ul>
            </div>
            <div>
              <h4>Limitations</h4>
              <ul>${limitations || "<li>Interpret in context.</li>"}</ul>
            </div>
          </div>
          <div class="finding-links">${links || '<span class="finding-link-muted">No source links listed.</span>'}</div>
        </details>
      </article>
    `;
  }).join("");

  els.findings.innerHTML = `${overview}${cards}`;
}

function renderReport(report) {
  state.latestReport = report;
  state.query = "";
  state.pathway = "all";
  els.findingSearch.value = "";
  els.findingSearch.disabled = false;
  els.pathwayFilter.disabled = false;
  populatePathwayFilter(report);
  renderSummary(report);
  renderWarnings(report);
  renderFindings(report);
  els.exportJson.disabled = false;
}

async function analyzeText(text, label) {
  if (!state.panel) {
    setStatus("SNP panel is still loading. Try again in a moment.", "error");
    return;
  }

  const parsed = parseRawGenotype(text);
  const report = analyzeVariants(parsed, state.panel);
  renderReport(report);
  els.fileName.textContent = label;
  setStatus(`Analyzed ${label}. Everything stayed in this browser session.`, "success");
}

async function loadPanel() {
  const response = await fetch("data/snp-panel.json");
  if (!response.ok) {
    throw new Error(`Could not load SNP panel (${response.status})`);
  }
  state.panel = await response.json();
  const generatedFrom = state.panel.generatedFrom || {};
  els.panelRelease.textContent = `v${state.panel.version}`;
  els.panelVariantCount.textContent = formatNumber(state.panel.variants.length);
  els.panelClaimCount.textContent = formatNumber(generatedFrom.claimCount);
  els.panelStudyCount.textContent = formatNumber(generatedFrom.studyEvidenceCount);
  setStatus(`Ready. SNP panel ${state.panel.version} loaded with ${state.panel.variants.length} variants.`, "success");
}

async function loadSample() {
  const response = await fetch("examples/synthetic-23andme.txt");
  if (!response.ok) {
    throw new Error(`Could not load sample file (${response.status})`);
  }
  await analyzeText(await response.text(), "synthetic 23andMe-style sample");
}

function exportJson() {
  if (!state.latestReport) {
    return;
  }
  const blob = new Blob([JSON.stringify(state.latestReport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "metabobrief-snp-report.json";
  link.click();
  URL.revokeObjectURL(url);
}

els.file.addEventListener("change", async event => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }
  els.fileName.textContent = file.name;
  await analyzeText(await file.text(), file.name);
});

els.sample.addEventListener("click", () => {
  loadSample().catch(error => setStatus(error.message, "error"));
});

els.exportJson.addEventListener("click", exportJson);

els.findingSearch.addEventListener("input", event => {
  state.query = event.target.value;
  if (state.latestReport) {
    renderFindings(state.latestReport);
  }
});

els.pathwayFilter.addEventListener("change", event => {
  state.pathway = event.target.value;
  if (state.latestReport) {
    renderFindings(state.latestReport);
  }
});

loadPanel().catch(error => setStatus(error.message, "error"));
