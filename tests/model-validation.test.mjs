import assert from "node:assert/strict";

import { validateModels } from "../scripts/validate-models.mjs";
import { loadJson } from "./helpers.mjs";

const errors = await validateModels();
assert.deepEqual(errors, []);

const manifest = await loadJson("models/manifest.json");
assert.equal(manifest.schemaVersion, "1.0.0");
assert.deepEqual(manifest.annotationPack, {
  id: "starter-snp-panel",
  version: "0.3.0",
  path: "data/snp-panel.json",
  sha256: "95866e4c17cbc45e50a09bcbc79305ba0cfbc6ef2c0e3ac476ffcdc63065e313",
  recordCount: 140,
  claimCount: 494
});
assert.match(manifest.pathwayDefinitions.sha256, /^[a-f0-9]{64}$/);
assert.ok(Array.isArray(manifest.models));
assert.equal(manifest.models.length, 17);

const enabledModels = manifest.models.filter(model => model.defaultEnabled);
assert.equal(enabledModels.length, 16);
assert.equal(enabledModels.filter(model => model.status === "reviewed").length, 16);
assert.ok(enabledModels.every(model => model.modelCard?.startsWith("docs/model-cards/")));

for (const entry of manifest.models) {
  assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  assert.equal(entry.algorithm.id, "group-capped-normalized-sum");
  assert.equal(entry.algorithm.version, "1.0.0");
  assert.equal(entry.variantContributionModelVersion, "legacy-v0");
  assert.equal(entry.requiredSchemaVersion, "1.0.0");
  assert.ok(entry.modelCard?.startsWith("docs/model-cards/"));
}

const archived = manifest.models.find(model => model.modelId === "caffeine-response-legacy");
assert.equal(archived.status, "archived");
assert.equal(archived.defaultEnabled, false);

const methylationEntry = manifest.models.find(model => model.modelId === "methylation");
const methylationModel = await loadJson(methylationEntry.path);
assert.equal(methylationModel.status, "reviewed");
assert.equal(methylationModel.reviewLevel, "starter-reviewed");
assert.match(methylationModel.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
assert.ok(methylationModel.reviewNotes.includes("informational"));
assert.ok(methylationModel.knownWeaknesses.length >= 2);

console.log("Model validation tests passed.");
