import assert from "node:assert/strict";

import { validateModels } from "../scripts/validate-models.mjs";
import { loadJson } from "./helpers.mjs";

const errors = await validateModels();
assert.deepEqual(errors, []);

const manifest = await loadJson("models/manifest.json");
assert.equal(manifest.schemaVersion, "1.0.0");
assert.deepEqual(manifest.annotationPack, {
  id: "starter-snp-panel",
  version: "0.2.0",
  path: "data/snp-panel.json",
  sha256: "0f7b04c65bfcb4eb2269e1f9b6647b5c209c1f5f8e5134398d8ef1c8c55dbbd7",
  recordCount: 140,
  claimCount: 491
});
assert.ok(Array.isArray(manifest.models));
assert.ok(manifest.models.length >= 3);
assert.equal(manifest.models.filter(model => model.defaultEnabled).length, 2);

for (const entry of manifest.models) {
  assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  assert.equal(entry.algorithm.id, "group-capped-normalized-sum");
  assert.equal(entry.algorithm.version, "1.0.0");
  assert.equal(entry.variantContributionModelVersion, "legacy-v0");
  assert.equal(entry.requiredSchemaVersion, "1.0.0");
}

const archived = manifest.models.find(model => model.modelId === "caffeine-response-legacy");
assert.equal(archived.status, "archived");
assert.equal(archived.defaultEnabled, false);

console.log("Model validation tests passed.");
