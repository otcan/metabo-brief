import assert from "node:assert/strict";

import { analyzeVariants, parseRawGenotype } from "../analyzer/snp-core.js";
import { genotypeText, loadDefaultModels, loadModelWithManifest, loadPanel, loadText } from "./helpers.mjs";

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
    score: 100,
    rawScore: 1,
    numerator: 0.28,
    denominator: 0.28,
    scoreStatus: "provisional",
    evidenceQuality: "moderate",
    directionalConsistency: "consistent_positive",
    resultSupport: "low",
    coverage: 1,
    dominance: "single-signal dominated",
    leaveOneGroupOut: [50, 50]
  },
  {
    modelId: "caffeine-sensitivity",
    modelVersion: "0.1.0",
    score: 100,
    rawScore: 1,
    numerator: 0.569,
    denominator: 0.569,
    scoreStatus: "calculated",
    evidenceQuality: "strong",
    directionalConsistency: "consistent_positive",
    resultSupport: "moderate",
    coverage: 1,
    dominance: "moderately concentrated",
    leaveOneGroupOut: [100, 100]
  },
  {
    modelId: "carbohydrate-digestion",
    modelVersion: "0.1.0",
    score: 100,
    rawScore: 1,
    numerator: 0.5,
    denominator: 0.5,
    scoreStatus: "provisional",
    evidenceQuality: "strong",
    directionalConsistency: "consistent_positive",
    resultSupport: "low",
    coverage: 1,
    dominance: "single-signal dominated",
    leaveOneGroupOut: [50, 50]
  },
  {
    modelId: "glucose",
    modelVersion: "0.1.0",
    score: 89,
    rawScore: 0.774,
    numerator: 1.612,
    denominator: 2.084,
    scoreStatus: "calculated",
    evidenceQuality: "strong",
    directionalConsistency: "mixed",
    resultSupport: "high",
    coverage: 1,
    dominance: "distributed",
    leaveOneGroupOut: [85, 100]
  },
  {
    modelId: "iron-handling",
    modelVersion: "0.1.0",
    score: 52,
    rawScore: 0.042,
    numerator: 0.085,
    denominator: 2.017,
    scoreStatus: "calculated",
    evidenceQuality: "moderate",
    directionalConsistency: "mixed",
    resultSupport: "high",
    coverage: 1,
    dominance: "distributed",
    leaveOneGroupOut: [36, 67]
  },
  {
    modelId: "inflammation-immune-signaling",
    modelVersion: "0.1.0",
    score: 48,
    rawScore: -0.035,
    numerator: -0.022,
    denominator: 0.622,
    scoreStatus: "calculated",
    evidenceQuality: "moderate",
    directionalConsistency: "mixed",
    resultSupport: "moderate",
    coverage: 1,
    dominance: "moderately concentrated",
    leaveOneGroupOut: [0, 100]
  },
  {
    modelId: "estrogen-metabolism",
    modelVersion: "0.1.0",
    score: 29,
    rawScore: -0.427,
    numerator: -0.465,
    denominator: 1.089,
    scoreStatus: "calculated",
    evidenceQuality: "moderate",
    directionalConsistency: "mixed",
    resultSupport: "high",
    coverage: 0.8,
    dominance: "distributed",
    leaveOneGroupOut: [0, 47]
  },
  {
    modelId: "lipids",
    modelVersion: "0.1.0",
    score: 19,
    rawScore: -0.619,
    numerator: -0.852,
    denominator: 1.376,
    scoreStatus: "calculated",
    evidenceQuality: "moderate",
    directionalConsistency: "mixed",
    resultSupport: "moderate",
    coverage: 1,
    dominance: "moderately concentrated",
    leaveOneGroupOut: [0, 30]
  },
  {
    modelId: "oxidative-stress",
    modelVersion: "0.1.0",
    score: 16,
    rawScore: -0.68,
    numerator: -1.167,
    denominator: 1.717,
    scoreStatus: "calculated",
    evidenceQuality: "moderate",
    directionalConsistency: "mixed",
    resultSupport: "high",
    coverage: 1,
    dominance: "distributed",
    leaveOneGroupOut: [0, 23]
  },
  {
    modelId: "b12-transport",
    modelVersion: "0.1.0",
    score: 0,
    rawScore: -1,
    numerator: -0.353,
    denominator: 0.353,
    scoreStatus: "provisional",
    evidenceQuality: "moderate",
    directionalConsistency: "consistent_negative",
    resultSupport: "low",
    coverage: 1,
    dominance: "single-signal dominated",
    leaveOneGroupOut: [50, 50]
  },
  {
    modelId: "choline-support",
    modelVersion: "0.1.0",
    score: 0,
    rawScore: -1,
    numerator: -1.85,
    denominator: 1.85,
    scoreStatus: "calculated",
    evidenceQuality: "moderate",
    directionalConsistency: "consistent_negative",
    resultSupport: "high",
    coverage: 1,
    dominance: "distributed",
    leaveOneGroupOut: [0, 0]
  },
  {
    modelId: "histamine",
    modelVersion: "0.1.0",
    score: 0,
    rawScore: -1,
    numerator: -0.32,
    denominator: 0.32,
    scoreStatus: "provisional",
    evidenceQuality: "strong",
    directionalConsistency: "consistent_negative",
    resultSupport: "low",
    coverage: 1,
    dominance: "single-signal dominated",
    leaveOneGroupOut: [50, 50]
  },
  {
    modelId: "methylation",
    modelVersion: "0.1.0",
    score: 0,
    rawScore: -1,
    numerator: -1.444,
    denominator: 1.444,
    scoreStatus: "calculated",
    evidenceQuality: "moderate",
    directionalConsistency: "consistent_negative",
    resultSupport: "high",
    coverage: 1,
    dominance: "distributed",
    leaveOneGroupOut: [0, 0]
  },
  {
    modelId: "mitochondrial-energy",
    modelVersion: "0.1.0",
    score: 0,
    rawScore: -1,
    numerator: -0.167,
    denominator: 0.167,
    scoreStatus: "provisional",
    evidenceQuality: "moderate",
    directionalConsistency: "consistent_negative",
    resultSupport: "low",
    coverage: 1,
    dominance: "single-signal dominated",
    leaveOneGroupOut: [50, 50]
  },
  {
    modelId: "nitric-oxide-vascular-tone",
    modelVersion: "0.1.0",
    score: 0,
    rawScore: -1,
    numerator: -0.167,
    denominator: 0.167,
    scoreStatus: "provisional",
    evidenceQuality: "moderate",
    directionalConsistency: "consistent_negative",
    resultSupport: "low",
    coverage: 1,
    dominance: "single-signal dominated",
    leaveOneGroupOut: [50, 50]
  },
  {
    modelId: "sulfur-transsulfuration",
    modelVersion: "0.1.0",
    score: 0,
    rawScore: -1,
    numerator: -0.82,
    denominator: 0.82,
    scoreStatus: "calculated",
    evidenceQuality: "moderate",
    directionalConsistency: "consistent_negative",
    resultSupport: "high",
    coverage: 1,
    dominance: "distributed",
    leaveOneGroupOut: [0, 0]
  }
]);

const archivedModel = await loadModelWithManifest("caffeine-response-legacy", "1.0.0");
const archivedParsed = parseRawGenotype(genotypeText([["rs762551", "AC"], ["rs887829", "CT"]]));
const archivedScore = analyzeVariants(archivedParsed, panel, [archivedModel]).pathwayScores[0];

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
