import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildVariantScoring, scorePathwayModel } from "../analyzer/scoring-engine.js";
import { parseRawGenotype, analyzeVariants } from "../analyzer/snp-core.js";

const panel = JSON.parse(await readFile(new URL("../data/snp-panel.json", import.meta.url), "utf8"));
const caffeineModel = JSON.parse(await readFile(new URL("../models/caffeine-clearance.json", import.meta.url), "utf8"));
const sample23 = await readFile(new URL("../examples/synthetic-23andme.txt", import.meta.url), "utf8");

const variantScore = buildVariantScoring({
  score: 0.203,
  direction: "possible_increase",
  magnitude: 0.35,
  certainty: 0.58,
  pathwayScoringEligible: true
});

assert.equal(variantScore.eligible, true);
assert.equal(variantScore.direction, 1);
assert.equal(variantScore.magnitude, 0.35);
assert.equal(variantScore.certainty, 0.58);
assert.equal(variantScore.contribution, 0.203);
assert.equal(variantScore.formulaContribution, 0.203);
assert.equal(variantScore.modelVersion, "legacy-v0");

const parsed = parseRawGenotype(sample23);
const report = analyzeVariants(parsed, panel, [caffeineModel]);
const pathwayScore = report.pathwayScores[0];

assert.equal(pathwayScore.pathwayId, "caffeine-clearance");
assert.equal(pathwayScore.modelVersion, "metabobrief-pathway-v1");
assert.equal(pathwayScore.variantModelVersion, "legacy-v0");
assert.equal(pathwayScore.score, 72);
assert.equal(pathwayScore.rawScore, 0.449);
assert.equal(pathwayScore.signalStrength, "weak");
assert.equal(pathwayScore.evidenceConfidence, "strong");
assert.equal(pathwayScore.coverage, 0.286);
assert.equal(pathwayScore.stability, "stable");
assert.equal(pathwayScore.eligibleVariantCount, 7);
assert.equal(pathwayScore.observedVariantCount, 2);
assert.equal(pathwayScore.scoredVariantCount, 1);
assert.equal(pathwayScore.independentSignalCount, 1);

const scored = pathwayScore.contributors.find(contributor => contributor.rsid === "rs887829");
assert.equal(scored.status, "observed and scored");
assert.equal(scored.contribution, 0.266);
assert.equal(scored.rawContribution, 0.266);

const excluded = pathwayScore.contributors.find(contributor => contributor.rsid === "rs762551");
assert.equal(excluded.status, "excluded by scoring model");
assert.equal(excluded.contribution, 0);
assert.equal(excluded.rawContribution, 0.11);

const directScore = scorePathwayModel({
  panel,
  parsed,
  findings: report.findings,
  model: caffeineModel
});
assert.deepEqual(directScore, pathwayScore);

console.log("Scoring engine tests passed.");
