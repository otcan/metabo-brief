import assert from "node:assert/strict";

import { APPLICATION_VERSION, REPORT_SCHEMA_VERSION, analyzeVariants, normalizeGenotype, parseRawGenotype } from "../analyzer/snp-core.js";
import { loadDefaultModels, loadPanel, loadText, sha256Text } from "./helpers.mjs";

const panelText = await loadText("data/snp-panel.json");
const panel = await loadPanel();
const defaultModels = await loadDefaultModels();
const sample23 = await loadText("examples/synthetic-23andme.txt");
const sampleAncestry = await loadText("examples/synthetic-ancestry.txt");
const panelSha256 = sha256Text(panelText);

assert.equal(panel.variants.length, 140);
assert.equal(panel.generatedFrom.claimCount, 494);
assert.equal(defaultModels.length, 16);
assert.deepEqual(defaultModels.map(model => model.modelId).sort(), [
  "b12-transport",
  "caffeine-clearance",
  "caffeine-sensitivity",
  "carbohydrate-digestion",
  "choline-support",
  "estrogen-metabolism",
  "glucose",
  "histamine",
  "inflammation-immune-signaling",
  "iron-handling",
  "lipids",
  "methylation",
  "mitochondrial-energy",
  "nitric-oxide-vascular-tone",
  "oxidative-stress",
  "sulfur-transsulfuration"
]);

assert.equal(normalizeGenotype("TC"), "CT");
assert.equal(normalizeGenotype("A/G"), "AG");
assert.equal(normalizeGenotype("--"), null);

const parsed23 = parseRawGenotype(sample23);
assert.equal(parsed23.metadata.dataLineCount, 139);
assert.equal(parsed23.metadata.parsedVariantCount, 138);
assert.equal(parsed23.metadata.noCallCount, 1);
assert.equal(parsed23.metadata.provider, "23andMe");
assert.equal(parsed23.metadata.format, "genotype rsID table");
assert.equal(parsed23.metadata.genomeBuild, "GRCh37");
assert.equal(parsed23.variants.get("rs1801133").normalizedGenotype, "AA");

const report23 = analyzeVariants(parsed23, panel, defaultModels, { panelSha256 });
assert.equal(report23.applicationVersion, APPLICATION_VERSION);
assert.equal(report23.reportSchemaVersion, REPORT_SCHEMA_VERSION);
assert.equal(report23.reportSchemaVersion, "0.3.0");
assert.equal(report23.panelVersion, "0.3.0");
assert.equal(report23.panelSha256, panelSha256);
assert.equal(report23.pathwayModelVersions.length, 16);
assert.ok(report23.pathwayModelVersions.every(item => item.sha256 && item.algorithmVersion === "1.0.0"));
assert.equal(report23.findings.length, 138);
assert.equal(report23.missing.length, 2);
assert.equal(report23.validation.provider, "23andMe");
assert.equal(report23.validation.genomeBuild, "GRCh37");
assert.equal(report23.validation.validationStatus, "limited");
assert.ok(report23.validation.limitations.some(item => item.includes("strand normalization is not performed")));
assert.equal(report23.coverage.panelVariantCount, 140);
assert.equal(report23.coverage.presentPanelVariantCount, 138);
assert.equal(report23.coverage.interpretedFindingCount, 138);
assert.equal(report23.coverage.missingPanelVariantCount, 2);
assert.equal(report23.findings[0].coverageConfidence, "directly observed");
assert.ok(["increased", "decreased", "mixed", "uncertain"].includes(report23.findings[0].effectDirection));
assert.ok(report23.pathwaySummary.some(item => item.pathway === "Methylation" && item.findingCount > 0));
assert.equal(report23.findings[0].scoring.modelVersion, "legacy-v0");
assert.equal(typeof report23.findings[0].scoring.contribution, "number");
assert.equal(report23.pathwayScores.length, 16);
assert.equal(report23.pathwayScores[0].pathwayId, "caffeine-clearance");
assert.equal(report23.pathwayScores[0].score, 100);
assert.equal(report23.pathwayScores[0].resultSupport, "low");
assert.ok(report23.pathwayScores.some(score => score.pathwayId === "methylation" && score.score !== null));
assert.ok(report23.pathwayScores.some(score => score.pathwayId === "oxidative-stress" && score.score !== null));
assert.ok(report23.pathwayScores.some(score => score.pathwayId === "carbohydrate-digestion" && score.score === 100));

const lactaseFinding = report23.findings.find(finding => finding.rsid === "rs4988235");
assert.equal(lactaseFinding.scoring.eligible, true);
assert.equal(lactaseFinding.scoring.contribution, 0.638);
assert.equal(lactaseFinding.scoring.formulaContribution, 0.638);

const parsedAncestry = parseRawGenotype(sampleAncestry);
assert.equal(parsedAncestry.metadata.detectedHeader, true);
assert.equal(parsedAncestry.metadata.parsedVariantCount, 138);
assert.equal(parsedAncestry.metadata.provider, "AncestryDNA");
assert.equal(parsedAncestry.metadata.format, "allele-column rsID table");
assert.equal(parsedAncestry.variants.get("rs1801133").normalizedGenotype, "AA");

const reportAncestry = analyzeVariants(parsedAncestry, panel, defaultModels, { panelSha256 });
assert.equal(reportAncestry.findings.length, 138);
assert.equal(reportAncestry.missing.length, 2);
assert.ok(reportAncestry.findings.some(finding => finding.rsid === "rs671" && finding.genotype === "AA"));
assert.equal(reportAncestry.pathwayScores[0].pathwayId, "caffeine-clearance");

console.log("SNP parser and panel tests passed.");
