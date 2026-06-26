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
assert.equal(panel.generatedFrom.claimCount, 491);
assert.deepEqual(defaultModels.map(model => model.modelId), ["caffeine-clearance", "caffeine-sensitivity"]);

assert.equal(normalizeGenotype("TC"), "CT");
assert.equal(normalizeGenotype("A/G"), "AG");
assert.equal(normalizeGenotype("--"), null);

const parsed23 = parseRawGenotype(sample23);
assert.equal(parsed23.metadata.dataLineCount, 11);
assert.equal(parsed23.metadata.parsedVariantCount, 10);
assert.equal(parsed23.metadata.noCallCount, 1);
assert.equal(parsed23.metadata.provider, "23andMe");
assert.equal(parsed23.metadata.format, "genotype rsID table");
assert.equal(parsed23.metadata.genomeBuild, null);
assert.equal(parsed23.variants.get("rs1801133").normalizedGenotype, "AG");

const report23 = analyzeVariants(parsed23, panel, defaultModels, { panelSha256 });
assert.equal(report23.applicationVersion, APPLICATION_VERSION);
assert.equal(report23.reportSchemaVersion, REPORT_SCHEMA_VERSION);
assert.equal(report23.reportSchemaVersion, "0.3.0");
assert.equal(report23.panelVersion, "0.2.0");
assert.equal(report23.panelSha256, panelSha256);
assert.deepEqual(report23.pathwayModelVersions.map(item => item.modelId), ["caffeine-clearance", "caffeine-sensitivity"]);
assert.ok(report23.pathwayModelVersions.every(item => item.sha256 && item.algorithmVersion === "1.0.0"));
assert.equal(report23.findings.length, 10);
assert.equal(report23.missing.length, 130);
assert.equal(report23.validation.provider, "23andMe");
assert.equal(report23.validation.genomeBuild, "not detected");
assert.equal(report23.validation.validationStatus, "limited");
assert.ok(report23.validation.limitations.some(item => item.includes("Genome build was not detected")));
assert.equal(report23.coverage.panelVariantCount, 140);
assert.equal(report23.coverage.presentPanelVariantCount, 10);
assert.equal(report23.coverage.interpretedFindingCount, 10);
assert.equal(report23.coverage.missingPanelVariantCount, 130);
assert.equal(report23.findings[0].coverageConfidence, "directly observed");
assert.ok(["increased", "decreased", "mixed", "uncertain"].includes(report23.findings[0].effectDirection));
assert.ok(report23.pathwaySummary.some(item => item.pathway === "Methylation" && item.findingCount > 0));
assert.equal(report23.findings[0].scoring.modelVersion, "legacy-v0");
assert.equal(typeof report23.findings[0].scoring.contribution, "number");
assert.equal(report23.pathwayScores.length, 2);
assert.equal(report23.pathwayScores[0].pathwayId, "caffeine-clearance");
assert.equal(report23.pathwayScores[0].score, 70);
assert.equal(report23.pathwayScores[0].resultSupport, "low");
assert.equal(report23.pathwayScores[1].pathwayId, "caffeine-sensitivity");
assert.equal(report23.pathwayScores[1].score, null);
assert.equal(report23.pathwayScores[1].scoreStatus, "insufficient_coverage");

const lactaseFinding = report23.findings.find(finding => finding.rsid === "rs4988235");
assert.equal(lactaseFinding.scoring.eligible, false);
assert.equal(lactaseFinding.scoring.contribution, 0);
assert.equal(lactaseFinding.scoring.formulaContribution, 0);

const parsedAncestry = parseRawGenotype(sampleAncestry);
assert.equal(parsedAncestry.metadata.detectedHeader, true);
assert.equal(parsedAncestry.metadata.parsedVariantCount, 10);
assert.equal(parsedAncestry.metadata.provider, "AncestryDNA");
assert.equal(parsedAncestry.metadata.format, "allele-column rsID table");
assert.equal(parsedAncestry.variants.get("rs1801133").normalizedGenotype, "AG");

const reportAncestry = analyzeVariants(parsedAncestry, panel, defaultModels, { panelSha256 });
assert.equal(reportAncestry.findings.length, 10);
assert.equal(reportAncestry.missing.length, 130);
assert.ok(reportAncestry.findings.some(finding => finding.rsid === "rs671" && finding.genotype === "AG"));
assert.equal(reportAncestry.pathwayScores[0].pathwayId, "caffeine-clearance");

console.log("SNP parser and panel tests passed.");
