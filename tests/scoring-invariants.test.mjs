import assert from "node:assert/strict";

import { analyzeVariants, parseRawGenotype } from "../analyzer/snp-core.js";
import { clone, genotypeText, loadModelWithManifest, loadPanel } from "./helpers.mjs";

const panel = await loadPanel();
const clearanceModel = await loadModelWithManifest("caffeine-clearance", "0.2.0");

function scoreFor(model, rows, panelOverride = panel) {
  const parsed = parseRawGenotype(genotypeText(rows));
  return analyzeVariants(parsed, panelOverride, [model]).pathwayScores[0];
}

const baseScore = scoreFor(clearanceModel, [["rs762551", "AC"]]);

const unrelatedPanel = clone(panel);
unrelatedPanel.variants.push({
  rsid: "rs999999",
  gene: "TEST",
  label: "Unrelated test-only score",
  pathway: "Unrelated",
  pathways: ["Unrelated"],
  targetType: "enzyme_activity",
  evidenceLevel: "test fixture",
  sourceLinks: [],
  genotypes: {
    AA: {
      score: 0.9,
      direction: "possible_increase",
      magnitude: 0.9,
      certainty: 1,
      targetType: "enzyme_activity",
      claimId: "rs999999_AA_enzyme_activity",
      pathwayScoringEligible: true,
      interpretation: "Synthetic unrelated test claim."
    }
  },
  validationMarkers: [],
  limitations: []
});
const unrelatedScore = scoreFor(clearanceModel, [["rs762551", "AC"], ["rs999999", "AA"]], unrelatedPanel);
assert.equal(unrelatedScore.score, baseScore.score);
assert.equal(unrelatedScore.numerator, baseScore.numerator);
assert.equal(unrelatedScore.denominator, baseScore.denominator);

const reversedPanel = clone(panel);
reversedPanel.variants.reverse();
const reorderedScore = scoreFor(clearanceModel, [["rs762551", "AC"]], reversedPanel);
assert.equal(reorderedScore.score, baseScore.score);
assert.equal(reorderedScore.numerator, baseScore.numerator);
assert.equal(reorderedScore.denominator, baseScore.denominator);

const unsupportedScore = scoreFor(clearanceModel, [["rs762551", "AG"]]);
const unsupportedContributor = unsupportedScore.contributors.find(contributor => contributor.rsid === "rs762551");
assert.equal(unsupportedContributor.contributionState, "unsupported_genotype");
assert.equal(unsupportedContributor.denominatorContribution, 0);
assert.equal(unsupportedScore.denominatorContributorCount, 0);
assert.equal(unsupportedScore.score, null);

const missingScore = scoreFor(clearanceModel, []);
assert.equal(missingScore.coverage, 0);
assert.equal(missingScore.numerator, 0);
assert.equal(missingScore.denominator, 0);
assert.equal(missingScore.score, null);

const excludedModel = clone(clearanceModel);
excludedModel.inputs[0].contributionStates.rs762551_AC_enzyme_activity = "excluded";
const excludedScore = scoreFor(excludedModel, [["rs762551", "AC"]]);
assert.equal(excludedScore.contributors.find(contributor => contributor.rsid === "rs762551").contributionState, "excluded");
assert.equal(excludedScore.denominator, 0);
assert.equal(excludedScore.score, null);

const insufficientModel = clone(clearanceModel);
insufficientModel.inputs[0].contributionStates.rs762551_AC_enzyme_activity = "insufficient_evidence";
const insufficientScore = scoreFor(insufficientModel, [["rs762551", "AC"]]);
assert.equal(insufficientScore.contributors.find(contributor => contributor.rsid === "rs762551").contributionState, "insufficient_evidence");
assert.equal(insufficientScore.denominator, 0);
assert.equal(insufficientScore.score, null);

const baselineModel = clone(clearanceModel);
baselineModel.inputs[0].contributionStates.rs762551_AC_enzyme_activity = "supported_baseline";
baselineModel.minimumIndependentSignals = 0;
baselineModel.minimumEvidenceQuality = 0;
const baselineScore = scoreFor(baselineModel, [["rs762551", "AC"]]);
assert.equal(baselineScore.contributors.find(contributor => contributor.rsid === "rs762551").contributionState, "supported_baseline");
assert.equal(baselineScore.denominator, 0.28);
assert.equal(baselineScore.score, 50);

const cappedModel = clone(clearanceModel);
cappedModel.inputs[1].profiles = ["conservative", "exploratory"];
cappedModel.inputs[1].independenceGroup = cappedModel.inputs[0].independenceGroup;
cappedModel.maximumGroupContribution = 0.1;
const cappedScore = scoreFor(cappedModel, [["rs762551", "AA"], ["rs2472297", "TT"]]);
assert.equal(cappedScore.independentSignalCount, 1);
assert.equal(cappedScore.denominator, 0.1);
assert.equal(cappedScore.score, 100);

const opposingModel = clone(clearanceModel);
opposingModel.inputs[1].profiles = ["conservative", "exploratory"];
opposingModel.inputs[1].axisMultiplier = -1;
const opposingScore = scoreFor(opposingModel, [["rs762551", "AA"], ["rs2472297", "TT"]]);
assert.equal(opposingScore.directionalConsistency, "mixed");
assert.notEqual(opposingScore.evidenceQuality, "conflicting");
assert.equal(opposingScore.evidenceConflict, "none");

const exploratoryOnlyScore = scoreFor(clearanceModel, [["rs2472297", "TT"]]);
assert.equal(exploratoryOnlyScore.score, null);
assert.equal(exploratoryOnlyScore.conservativeScore, null);
assert.equal(exploratoryOnlyScore.exploratoryScore, 100);

const reconstructed = Math.round(50 + (50 * (baseScore.numerator / baseScore.denominator)));
assert.equal(reconstructed, baseScore.score);

console.log("Scoring invariant tests passed.");
