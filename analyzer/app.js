import { analyzeVariants, parseRawGenotype } from "./snp-core.js";

const state = {
  panel: null,
  latestReport: null
};

const els = {
  file: document.getElementById("snp-file"),
  sample: document.getElementById("load-sample"),
  exportJson: document.getElementById("export-json"),
  status: document.getElementById("analyzer-status"),
  summary: document.getElementById("analysis-summary"),
  findings: document.getElementById("analysis-findings"),
  warnings: document.getElementById("analysis-warnings")
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

function renderSummary(report) {
  const matched = report.findings.length;
  const panelSize = state.panel.variants.length;
  const coverage = panelSize ? Math.round((matched / panelSize) * 100) : 0;

  els.summary.innerHTML = `
    <div class="analysis-stat"><span>Parsed SNPs</span><strong>${report.metadata.parsedVariantCount}</strong></div>
    <div class="analysis-stat"><span>Panel matches</span><strong>${matched}/${panelSize}</strong></div>
    <div class="analysis-stat"><span>Panel coverage</span><strong>${coverage}%</strong></div>
    <div class="analysis-stat"><span>No-calls skipped</span><strong>${report.metadata.noCallCount}</strong></div>
  `;

  const pathways = report.pathwaySummary.map(item => `
    <li><strong>${escapeHtml(item.pathway)}</strong><span>${item.score.toFixed(1)} attention score</span></li>
  `).join("");

  if (pathways) {
    els.summary.insertAdjacentHTML("beforeend", `
      <div class="analysis-pathways">
        <h3>Pathway signal</h3>
        <ul>${pathways}</ul>
      </div>
    `);
  }
}

function renderWarnings(report) {
  els.warnings.innerHTML = report.warnings.map(warning => `
    <li>${escapeHtml(warning)}</li>
  `).join("");
}

function renderFindings(report) {
  if (!report.findings.length) {
    els.findings.innerHTML = `
      <div class="analysis-empty">
        <h3>No panel variants matched</h3>
        <p>The file parsed successfully, but none of the current panel rsIDs were present.</p>
      </div>
    `;
    return;
  }

  els.findings.innerHTML = report.findings.map(finding => {
    const links = finding.sourceLinks.map(link => `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>
    `).join("");

    const limitations = finding.limitations.map(item => `<li>${escapeHtml(item)}</li>`).join("");
    const markers = finding.validationMarkers.map(item => `<li>${escapeHtml(item)}</li>`).join("");

    return `
      <article class="finding-card">
        <div class="finding-topline">
          <div>
            <p class="finding-kicker">${escapeHtml(finding.pathway)} · ${escapeHtml(finding.evidenceLevel)}</p>
            <h3>${escapeHtml(finding.gene)} ${escapeHtml(finding.rsid)}</h3>
          </div>
          <div class="finding-score" data-direction="${escapeHtml(finding.direction)}">
            <span>Score</span>
            <strong>${finding.score.toFixed(1)}</strong>
          </div>
        </div>
        <p class="finding-label">${escapeHtml(finding.label)}</p>
        <p><strong>Detected genotype:</strong> ${escapeHtml(finding.genotype)} <span class="text-muted">(raw: ${escapeHtml(finding.rawGenotype)})</span></p>
        <p>${escapeHtml(finding.interpretation)}</p>
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
        <div class="finding-links">${links}</div>
      </article>
    `;
  }).join("");
}

function renderReport(report) {
  state.latestReport = report;
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
  setStatus(`Analyzed ${label}. Everything stayed in this browser session.`, "success");
}

async function loadPanel() {
  const response = await fetch("data/snp-panel.json");
  if (!response.ok) {
    throw new Error(`Could not load SNP panel (${response.status})`);
  }
  state.panel = await response.json();
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
  await analyzeText(await file.text(), file.name);
});

els.sample.addEventListener("click", () => {
  loadSample().catch(error => setStatus(error.message, "error"));
});

els.exportJson.addEventListener("click", exportJson);

loadPanel().catch(error => setStatus(error.message, "error"));
