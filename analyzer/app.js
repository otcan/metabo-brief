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

function renderSummary(report) {
  const matched = report.findings.length;
  const panelSize = state.panel.variants.length;
  const headerState = report.metadata.detectedHeader ? "Detected" : "Inferred";
  const coverage = report.coverage || {};

  els.summary.innerHTML = `
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
  if (!report.findings.length) {
    updateFindingCount(report, 0);
    els.findings.innerHTML = `
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
      <div class="analysis-empty">
        <h3>No findings match the filters</h3>
        <p>Clear search or choose all pathways to return to the full report.</p>
      </div>
    `;
    return;
  }

  els.findings.innerHTML = findings.map(finding => {
    const links = finding.sourceLinks.slice(0, 6).map(link => `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>
    `).join("");

    const limitations = finding.limitations.slice(0, 4).map(item => `<li>${escapeHtml(item)}</li>`).join("");
    const markers = finding.validationMarkers.slice(0, 4).map(item => `<li>${escapeHtml(item)}</li>`).join("");
    const sourceCount = finding.sourceLinks.length;
    const effectDirection = String(finding.effectDirection || "uncertain").replace(/_/g, " ");
    const actionability = String(finding.actionability || "informational").replace(/_/g, " ");

    return `
      <article class="finding-card">
        <div class="finding-topline">
          <div>
            <p class="finding-kicker">${escapeHtml(finding.pathway)}</p>
            <h3>${escapeHtml(finding.gene)} <span>${escapeHtml(finding.rsid)}</span></h3>
          </div>
          <div class="finding-status">
            <span>Review</span>
            <strong>${escapeHtml(finding.reviewStatus)}</strong>
          </div>
        </div>
        <p class="finding-label">${escapeHtml(finding.label)}</p>
        <div class="finding-meta">
          <span>Genotype ${escapeHtml(finding.genotype)} <small>raw ${escapeHtml(finding.rawGenotype)}</small></span>
          <span>${escapeHtml(finding.evidenceLevel)}</span>
          <span>${escapeHtml(finding.relevance)}</span>
          <span>${escapeHtml(effectDirection)}</span>
          <span>${escapeHtml(actionability)}</span>
          <span>${escapeHtml(finding.coverageConfidence)}</span>
        </div>
        <p class="finding-interpretation">${escapeHtml(finding.interpretation)}</p>
        <div class="metric-strip">
          <div><span>Sources</span><strong>${sourceCount}</strong></div>
          <div><span>Type</span><strong>${escapeHtml(finding.targetType)}</strong></div>
          <div><span>Observed</span><strong>${escapeHtml(finding.coverageConfidence)}</strong></div>
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
      </article>
    `;
  }).join("");
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
