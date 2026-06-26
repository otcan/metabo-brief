import assert from "node:assert/strict";

import {
  EXPORT_SCHEMA_VERSION,
  SENSITIVE_EXPORT_WARNING,
  buildDeterministicReport,
  buildJsonExportPayload,
  buildPrintableReportHtml,
  stableStringify
} from "../analyzer/report-export.js";
import { analyzeVariants, parseRawGenotype } from "../analyzer/snp-core.js";
import { clone, loadDefaultModels, loadPanel, loadText, sha256Text } from "./helpers.mjs";

const panelText = await loadText("data/snp-panel.json");
const panel = await loadPanel();
const models = await loadDefaultModels();
const sample = await loadText("examples/synthetic-23andme.txt");
const panelSha256 = sha256Text(panelText);
const report = analyzeVariants(parseRawGenotype(sample), panel, models, { panelSha256 });

const reportRunA = clone(report);
const reportRunB = clone(report);
reportRunA.generatedAt = "2026-06-27T08:00:00.000Z";
reportRunB.generatedAt = "2026-06-27T09:30:00.000Z";

const payloadA = await buildJsonExportPayload(reportRunA, { exportedAt: "2026-06-27T10:00:00.000Z" });
const payloadB = await buildJsonExportPayload(reportRunB, { exportedAt: "2026-06-27T10:00:00.000Z" });

assert.equal(payloadA.exportSchemaVersion, EXPORT_SCHEMA_VERSION);
assert.equal(payloadA.exportKind, "metabobrief-snp-report");
assert.equal(payloadA.warning, SENSITIVE_EXPORT_WARNING);
assert.equal(payloadA.runMetadata.reportGeneratedAt, "2026-06-27T08:00:00.000Z");
assert.equal(payloadB.runMetadata.reportGeneratedAt, "2026-06-27T09:30:00.000Z");
assert.equal(payloadA.deterministicReport.generatedAt, undefined);
assert.equal(payloadA.replayMetadata.panelSha256, panelSha256);
assert.equal(payloadA.replayMetadata.pathwayModelVersions.length, 16);
assert.equal(payloadA.replayMetadata.inputValidation.provider, "23andMe");
assert.equal(payloadA.replayMetadata.coverage.panelVariantCount, 140);
assert.equal(payloadA.replayMetadata.deterministicReportSha256, payloadB.replayMetadata.deterministicReportSha256);
assert.equal(
  stableStringify(payloadA.deterministicReport),
  stableStringify(buildDeterministicReport(reportRunB))
);

const html = await buildPrintableReportHtml(reportRunA, { exportedAt: "2026-06-27T10:00:00.000Z" });
assert.ok(html.includes("MetaboBrief SNP report"));
assert.ok(html.includes(SENSITIVE_EXPORT_WARNING));
assert.ok(html.includes(payloadA.replayMetadata.deterministicReportSha256));
assert.ok(html.includes("Pathway scores"));
assert.ok(html.includes("metabobrief-export-json"));
assert.ok(html.includes("&quot;deterministicReport&quot;"));

console.log("Report export tests passed.");
