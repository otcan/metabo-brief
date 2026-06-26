import assert from "node:assert/strict";

import { buildVariantScoring, scorePathwayModel } from "../analyzer/scoring-engine.js";
import { analyzeVariants, parseRawGenotype } from "../analyzer/snp-core.js";
import { loadModelWithManifest, loadPanel, loadText } from "./helpers.mjs";

const panel = await loadPanel();
const clearanceModel = await loadModelWithManifest("caffeine-clearance", "0.2.0");
const archivedModel = await loadModelWithManifest("caffeine-response-legacy", "1.0.0");
const sample23 = await loadText("examples/synthetic-23andme.txt");

const variantScore = buildVariantScoring({
  score: 0.203,
  direction: "possible_increase",
  magnitude: 0.35,
  certainty: 0.58,
  claimId: "example_claim",
  pathwayScoringEligible: true
});

assert.equal(variantScore.eligible, true);
assert.equal(variantScore.direction, 1);
assert.equal(variantScore.magnitude, 0.35);
assert.equal(variantScore.certainty, 0.58);
assert.equal(variantScore.contribution, 0.203);
assert.equal(variantScore.formulaContribution, 0.203);
assert.equal(variantScore.legacyScore, null);
assert.equal(variantScore.modelVersion, "legacy-v0");

const legacyAttentionScore = buildVariantScoring({
  score: 1.5,
  direction: "higher_attention"
});

assert.equal(legacyAttentionScore.eligible, false);
assert.equal(legacyAttentionScore.contribution, 0);
assert.equal(legacyAttentionScore.formulaContribution, 0);
assert.equal(legacyAttentionScore.legacyScore, 1.5);

const parsed = parseRawGenotype(sample23);
const report = analyzeVariants(parsed, panel, [clearanceModel]);
const pathwayScore = report.pathwayScores[0];

assert.equal(pathwayScore.pathwayId, "caffeine-clearance");
assert.equal(pathwayScore.modelVersion, "0.2.0");
assert.equal(pathwayScore.algorithmId, "group-capped-normalized-sum");
assert.equal(pathwayScore.algorithmVersion, "1.0.0");
assert.equal(pathwayScore.variantContributionModelVersion, "legacy-v0");
assert.equal(pathwayScore.score, 70);
assert.equal(pathwayScore.rawScore, 0.393);
assert.equal(pathwayScore.numerator, 0.11);
assert.equal(pathwayScore.denominator, 0.28);
assert.equal(pathwayScore.signalStrength, "weak");
assert.equal(pathwayScore.evidenceQuality, "moderate");
assert.equal(pathwayScore.directionalConsistency, "consistent_positive");
assert.equal(pathwayScore.evidenceConflict, "none");
assert.equal(pathwayScore.resultSupport, "low");
assert.equal(pathwayScore.scoreStatus, "provisional");
assert.equal(pathwayScore.coverage, 0.5);
assert.equal(pathwayScore.scoredCoverage, 0.5);
assert.equal(pathwayScore.stability, "stable");
assert.equal(pathwayScore.inputCount, 2);
assert.equal(pathwayScore.observedVariantCount, 1);
assert.equal(pathwayScore.denominatorContributorCount, 1);
assert.equal(pathwayScore.scoredVariantCount, 1);
assert.equal(pathwayScore.independentSignalCount, 1);
assert.equal(pathwayScore.contributorDominance.label, "single-signal dominated");
assert.equal(pathwayScore.contributorDominance.topIndependentGroupPercent, 100);
assert.deepEqual(pathwayScore.leaveOneGroupOut.scores, [
  { omittedGroup: "cyp1a2-clearance", score: 50 }
]);

const scored = pathwayScore.contributors.find(contributor => contributor.rsid === "rs762551");
assert.equal(scored.contributionState, "scored");
assert.equal(scored.claimId, "rs762551_AC_enzyme_activity");
assert.equal(scored.contribution, 0.11);
assert.equal(scored.denominatorContribution, 0.28);

const missing = pathwayScore.contributors.find(contributor => contributor.rsid === "rs2472297");
assert.equal(missing.contributionState, "not_observed");
assert.equal(missing.contribution, 0);
assert.equal(missing.denominatorContribution, 0);

const directScore = scorePathwayModel({
  panel,
  parsed,
  findings: report.findings,
  model: clearanceModel
});
assert.deepEqual(directScore, pathwayScore);

const archivedReport = analyzeVariants(parsed, panel, [archivedModel]);
const archivedScore = archivedReport.pathwayScores[0];

assert.equal(archivedScore.modelId, "caffeine-response-legacy");
assert.equal(archivedScore.modelVersion, "1.0.0");
assert.equal(archivedScore.score, 72);
assert.equal(archivedScore.rawScore, 0.449);
assert.equal(archivedScore.scoreStatus, "provisional");
assert.equal(archivedScore.evidenceQuality, "strong");
assert.equal(archivedScore.resultSupport, "low");
assert.equal(archivedScore.coverage, 0.286);
assert.equal(archivedScore.contributorDominance.label, "single-signal dominated");
assert.equal(archivedScore.leaveOneGroupOut.min, 50);
assert.equal(archivedScore.leaveOneGroupOut.max, 93);

console.log("Scoring engine tests passed.");
