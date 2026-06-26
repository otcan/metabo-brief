import assert from "node:assert/strict";

import { analyzeVariants, parseRawGenotype } from "../analyzer/snp-core.js";
import { loadDefaultModels, loadModelWithManifest, loadPanel, loadText } from "./helpers.mjs";

const panel = await loadPanel();
const sample23 = await loadText("examples/synthetic-23andme.txt");
const parsed = parseRawGenotype(sample23);
const defaultReport = analyzeVariants(parsed, panel, await loadDefaultModels());

const defaultSummary = defaultReport.pathwayScores.map(score => ({
  modelId: score.modelId,
  modelVersion: score.modelVersion,
  score: score.score,
  rawScore: score.rawScore,
  numerator: score.numerator,
  denominator: score.denominator,
  scoreStatus: score.scoreStatus,
  evidenceQuality: score.evidenceQuality,
  directionalConsistency: score.directionalConsistency,
  resultSupport: score.resultSupport,
  coverage: score.coverage,
  dominance: score.contributorDominance.label,
  leaveOneGroupOut: [score.leaveOneGroupOut.min, score.leaveOneGroupOut.max]
}));

assert.deepEqual(defaultSummary, [
  {
    modelId: "caffeine-clearance",
    modelVersion: "0.2.0",
    score: 70,
    rawScore: 0.393,
    numerator: 0.11,
    denominator: 0.28,
    scoreStatus: "provisional",
    evidenceQuality: "moderate",
    directionalConsistency: "consistent_positive",
    resultSupport: "low",
    coverage: 0.5,
    dominance: "single-signal dominated",
    leaveOneGroupOut: [50, 50]
  },
  {
    modelId: "caffeine-sensitivity",
    modelVersion: "0.1.0",
    score: null,
    rawScore: null,
    numerator: 0,
    denominator: 0,
    scoreStatus: "insufficient_coverage",
    evidenceQuality: "none",
    directionalConsistency: "none",
    resultSupport: "insufficient",
    coverage: 0,
    dominance: "none",
    leaveOneGroupOut: [null, null]
  }
]);

const archivedModel = await loadModelWithManifest("caffeine-response-legacy", "1.0.0");
const archivedScore = analyzeVariants(parsed, panel, [archivedModel]).pathwayScores[0];

assert.deepEqual({
  modelId: archivedScore.modelId,
  modelVersion: archivedScore.modelVersion,
  score: archivedScore.score,
  rawScore: archivedScore.rawScore,
  scoreStatus: archivedScore.scoreStatus,
  evidenceQuality: archivedScore.evidenceQuality,
  resultSupport: archivedScore.resultSupport,
  coverage: archivedScore.coverage,
  dominance: archivedScore.contributorDominance.label,
  leaveOneGroupOut: [archivedScore.leaveOneGroupOut.min, archivedScore.leaveOneGroupOut.max]
}, {
  modelId: "caffeine-response-legacy",
  modelVersion: "1.0.0",
  score: 72,
  rawScore: 0.449,
  scoreStatus: "provisional",
  evidenceQuality: "strong",
  resultSupport: "low",
  coverage: 0.286,
  dominance: "single-signal dominated",
  leaveOneGroupOut: [50, 93]
});

console.log("Scoring regression tests passed.");
