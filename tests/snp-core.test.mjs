import assert from "node:assert/strict";

import { APPLICATION_VERSION, REPORT_SCHEMA_VERSION, analyzeVariants, normalizeGenotype, parseRawGenotype } from "../analyzer/snp-core.js";
import { genotypeText, loadDefaultModels, loadModelWithManifest, loadPanel, loadText, sha256Text } from "./helpers.mjs";

const panelText = await loadText("data/snp-panel.json");
const panel = await loadPanel();
const defaultModels = await loadDefaultModels();
const caffeineClearance = await loadModelWithManifest("caffeine-clearance", "0.2.0");
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
assert.equal(report23.reportSchemaVersion, "0.4.0");
assert.equal(report23.panelVersion, "0.3.0");
assert.equal(report23.panelSha256, panelSha256);
assert.equal(report23.pathwayModelVersions.length, 16);
assert.ok(report23.pathwayModelVersions.every(item => item.sha256 && item.algorithmVersion === "1.0.0"));
assert.equal(report23.findings.length, 138);
assert.equal(report23.missing.length, 2);
assert.equal(report23.validation.provider, "23andMe");
assert.equal(report23.validation.genomeBuild, "GRCh37");
assert.equal(report23.validation.validationStatus, "limited");
assert.equal(report23.validation.scoreability.canScore, true);
assert.equal(report23.validation.scoreability.status, "limited_confidence");
assert.ok(report23.validation.limitations.some(item => item.includes("strand normalization is not performed")));
assert.equal(report23.coverage.panelVariantCount, 140);
assert.equal(report23.coverage.presentPanelVariantCount, 138);
assert.equal(report23.coverage.interpretablePanelVariantCount, 138);
assert.equal(report23.coverage.interpretedFindingCount, 138);
assert.equal(report23.coverage.missingPanelVariantCount, 2);
assert.equal(report23.coverage.excludedPanelVariantCount, 0);
assert.equal(report23.coverage.scoredPanelVariantCount, report23.coverage.scoreEligibleFindingCount);
assert.equal(report23.findings[0].coverageConfidence, "directly observed");
assert.ok(["increased", "decreased", "mixed", "uncertain"].includes(report23.findings[0].effectDirection));
assert.ok(report23.pathwaySummary.some(item => item.pathway === "Methylation" && item.findingCount > 0));
assert.equal(report23.findings[0].scoring.modelVersion, "legacy-v0");
assert.equal(typeof report23.findings[0].scoring.contribution, "number");
assert.equal(report23.pathwayScores.length, 16);
assert.equal(report23.pathwayScores[0].pathwayId, "caffeine-clearance");
assert.equal(report23.pathwayScores[0].score, 100);
assert.equal(report23.pathwayScores[0].resultSupport, "low");
assert.ok(report23.pathwayScores.every(score => score.modelStatus === "reviewed"));
assert.ok(report23.pathwayScores.every(score => score.reviewLevel === "starter-reviewed"));
assert.ok(report23.pathwayScores.every(score => score.modelCard?.startsWith("docs/model-cards/")));
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

const familyTreeDna = [
  "# FamilyTreeDNA raw data fixture",
  "# Genome build: GRCh37",
  "RSID,CHROMOSOME,POSITION,RESULT",
  "rs762551,15,75041917,AC",
  "rs1801133,1,11856378,AA"
].join("\n");
const parsedFamilyTree = parseRawGenotype(familyTreeDna, { fileName: "familytreedna-data.csv" });
assert.equal(parsedFamilyTree.metadata.provider, "FamilyTreeDNA");
assert.equal(parsedFamilyTree.metadata.genomeBuild, "GRCh37");
assert.equal(parsedFamilyTree.metadata.detectedHeader, true);
assert.equal(parsedFamilyTree.metadata.format, "genotype rsID table");

const unknownBuild = parseRawGenotype([
  "rs762551\t15\t75041917\tAC",
  "rs1801133\t1\t11856378\tAA"
].join("\n"));
const unknownBuildReport = analyzeVariants(unknownBuild, panel, [caffeineClearance], { panelSha256 });
assert.equal(unknownBuildReport.validation.validationStatus, "fail");
assert.equal(unknownBuildReport.validation.scoreability.canScore, false);
assert.equal(unknownBuildReport.validation.scoreability.status, "do_not_score");
assert.ok(unknownBuildReport.validation.scoreability.blockingReasons.some(reason => reason.includes("Genome build")));
assert.equal(unknownBuildReport.coverage.scoredPanelVariantCount, 0);
assert.equal(unknownBuildReport.pathwayScores[0].score, null);
assert.equal(unknownBuildReport.pathwayScores[0].scoreStatus, "not_calculated");
assert.equal(unknownBuildReport.pathwayScores[0].scoringBlocked, true);

const conflictingDuplicate = parseRawGenotype([
  "# Provider: 23andMe",
  "# Genome build: GRCh37",
  "rs762551\t15\t75041917\tAC",
  "rs762551\t15\t75041917\tCC"
].join("\n"));
assert.deepEqual(conflictingDuplicate.metadata.conflictingDuplicateRsids, ["rs762551"]);
const conflictingReport = analyzeVariants(conflictingDuplicate, panel, [caffeineClearance], { panelSha256 });
assert.equal(conflictingReport.validation.scoreability.canScore, true);
assert.equal(conflictingReport.coverage.presentPanelVariantCount, 1);
assert.equal(conflictingReport.coverage.excludedPanelVariantCount, 1);
assert.equal(conflictingReport.coverage.scoredPanelVariantCount, 0);
assert.equal(conflictingReport.excluded[0].rsid, "rs762551");
assert.equal(conflictingReport.excluded[0].reason, "conflicting_duplicate");
assert.equal(conflictingReport.findings.some(finding => finding.rsid === "rs762551"), false);
assert.equal(
  conflictingReport.pathwayScores[0].contributors.find(contributor => contributor.rsid === "rs762551").contributionState,
  "excluded"
);

console.log("SNP parser and panel tests passed.");
