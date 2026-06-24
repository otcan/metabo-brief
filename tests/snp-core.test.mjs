import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { analyzeVariants, normalizeGenotype, parseRawGenotype } from "../analyzer/snp-core.js";

const panel = JSON.parse(await readFile(new URL("../data/snp-panel.json", import.meta.url), "utf8"));
const caffeineModel = JSON.parse(await readFile(new URL("../models/caffeine-clearance.json", import.meta.url), "utf8"));
const sample23 = await readFile(new URL("../examples/synthetic-23andme.txt", import.meta.url), "utf8");
const sampleAncestry = await readFile(new URL("../examples/synthetic-ancestry.txt", import.meta.url), "utf8");

assert.equal(panel.variants.length, 140);
assert.equal(panel.generatedFrom.claimCount, 491);

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

const report23 = analyzeVariants(parsed23, panel, [caffeineModel]);
assert.equal(report23.reportSchemaVersion, "0.2.0");
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
assert.equal(report23.pathwayScores.length, 1);
assert.equal(report23.pathwayScores[0].pathwayId, "caffeine-clearance");
assert.equal(report23.pathwayScores[0].score, 72);

const parsedAncestry = parseRawGenotype(sampleAncestry);
assert.equal(parsedAncestry.metadata.detectedHeader, true);
assert.equal(parsedAncestry.metadata.parsedVariantCount, 10);
assert.equal(parsedAncestry.metadata.provider, "AncestryDNA");
assert.equal(parsedAncestry.metadata.format, "allele-column rsID table");
assert.equal(parsedAncestry.variants.get("rs1801133").normalizedGenotype, "AG");

const reportAncestry = analyzeVariants(parsedAncestry, panel, [caffeineModel]);
assert.equal(reportAncestry.findings.length, 10);
assert.equal(reportAncestry.missing.length, 130);
assert.ok(reportAncestry.findings.some(finding => finding.rsid === "rs671" && finding.genotype === "AG"));
assert.equal(reportAncestry.pathwayScores[0].pathwayId, "caffeine-clearance");

console.log("SNP parser and panel tests passed.");
