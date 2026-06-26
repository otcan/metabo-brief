import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ALGORITHM_ID, ALGORITHM_VERSION, buildVariantScoring } from "../analyzer/scoring-engine.js";

const VALID_STATES = new Set([
  "scored",
  "supported_baseline",
  "insufficient_evidence",
  "unsupported_genotype",
  "excluded"
]);

const VALID_PROFILES = new Set(["conservative", "exploratory"]);

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function sha256(root, relativePath) {
  const text = await readFile(path.join(root, relativePath), "utf8");
  return createHash("sha256").update(text).digest("hex");
}

function normalizeRsid(value) {
  return String(value || "").trim().toLowerCase();
}

function numericDirectionFromText(direction) {
  const value = String(direction || "").toLowerCase();
  if (value.includes("decrease") || value.includes("lower") || value.includes("slower")) {
    return -1;
  }
  if (value.includes("increase") || value.includes("higher") || value.includes("faster")) {
    return 1;
  }
  return 0;
}

function collectPanel(panel) {
  const variantsByRsid = new Map();
  const claimsById = new Map();
  for (const variant of panel.variants || []) {
    variantsByRsid.set(normalizeRsid(variant.rsid), variant);
    for (const [genotype, effect] of Object.entries(variant.genotypes || {})) {
      claimsById.set(effect.claimId, { variant, genotype, effect });
    }
  }
  return { variantsByRsid, claimsById };
}

function validatePanelScoring(panel, errors) {
  for (const variant of panel.variants || []) {
    for (const effect of Object.values(variant.genotypes || {})) {
      const scoring = buildVariantScoring(effect);
      if (Math.abs(scoring.contribution - scoring.formulaContribution) > 0.002) {
        errors.push(`${effect.claimId} score ${scoring.contribution} does not match direction * magnitude * certainty ${scoring.formulaContribution}`);
      }
      const textDirection = numericDirectionFromText(effect.direction);
      if (scoring.contribution !== 0 && textDirection !== 0 && Math.sign(scoring.contribution) !== textDirection) {
        errors.push(`${effect.claimId} direction text disagrees with score sign`);
      }
    }
  }
}

function validateBands(model, errors) {
  const bands = [...(model.interpretationBands || [])].sort((a, b) => a.min - b.min);
  if (!bands.length) {
    errors.push(`${model.modelId} ${model.modelVersion} has no interpretation bands`);
    return;
  }
  if (bands[0].min !== 0) {
    errors.push(`${model.modelId} ${model.modelVersion} interpretation bands must start at 0`);
  }
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    if (band.min > band.max) {
      errors.push(`${model.modelId} ${model.modelVersion} has invalid band ${band.label}`);
    }
    if (index > 0 && band.min !== bands[index - 1].max + 1) {
      errors.push(`${model.modelId} ${model.modelVersion} interpretation bands overlap or leave gaps`);
    }
  }
  if (bands[bands.length - 1].max !== 100) {
    errors.push(`${model.modelId} ${model.modelVersion} interpretation bands must end at 100`);
  }
}

function validateModelShape(model, manifestEntry, panelIndex, errors) {
  const prefix = `${model.modelId || "unknown"} ${model.modelVersion || "unknown"}`;
  const required = [
    "schemaVersion",
    "modelId",
    "modelVersion",
    "algorithm",
    "variantContributionModelVersion",
    "compatiblePanelVersion",
    "inputs"
  ];
  for (const key of required) {
    if (model[key] === undefined || model[key] === null) {
      errors.push(`${prefix} missing ${key}`);
    }
  }
  if (model.algorithm?.id !== ALGORITHM_ID || model.algorithm?.version !== ALGORITHM_VERSION) {
    errors.push(`${prefix} uses unsupported algorithm ${model.algorithm?.id || "missing"} ${model.algorithm?.version || "missing"}`);
  }
  if (manifestEntry.algorithm?.id !== model.algorithm?.id || manifestEntry.algorithm?.version !== model.algorithm?.version) {
    errors.push(`${prefix} manifest algorithm does not match model`);
  }
  if (manifestEntry.compatibleAnnotationPack !== model.compatiblePanelVersion) {
    errors.push(`${prefix} manifest panel compatibility does not match model`);
  }
  if (manifestEntry.requiredSchemaVersion !== model.schemaVersion) {
    errors.push(`${prefix} manifest schema version does not match model`);
  }
  if (model.compatiblePanelVersion !== panelIndex.panel.version) {
    errors.push(`${prefix} is incompatible with panel ${panelIndex.panel.version}`);
  }
  if (!Array.isArray(model.inputs) || model.inputs.length === 0) {
    errors.push(`${prefix} must define explicit inputs`);
  }
}

function validateInputs(model, panelIndex, errors) {
  const claimGroups = new Map();
  for (const input of model.inputs || []) {
    const variant = panelIndex.variantsByRsid.get(normalizeRsid(input.rsid));
    if (!variant) {
      errors.push(`${model.modelId} ${model.modelVersion} references missing rsID ${input.rsid}`);
      continue;
    }
    if (!Number.isFinite(Number(input.axisMultiplier)) || Number(input.axisMultiplier) === 0) {
      errors.push(`${model.modelId} ${model.modelVersion} ${input.rsid} has no usable axis mapping`);
    }
    if (!input.mechanism) {
      errors.push(`${model.modelId} ${model.modelVersion} ${input.rsid} has no mechanism`);
    }
    if (!input.independenceGroup) {
      errors.push(`${model.modelId} ${model.modelVersion} ${input.rsid} has no independence group`);
    }
    if (!input.inclusionRationale) {
      errors.push(`${model.modelId} ${model.modelVersion} ${input.rsid} has no inclusion rationale`);
    }
    const profiles = input.profiles || [];
    if (!profiles.length || profiles.some(profile => !VALID_PROFILES.has(profile))) {
      errors.push(`${model.modelId} ${model.modelVersion} ${input.rsid} has invalid profile eligibility`);
    }

    for (const claimId of input.claimIds || []) {
      const claim = panelIndex.claimsById.get(claimId);
      if (!claim) {
        errors.push(`${model.modelId} ${model.modelVersion} references missing claim ${claimId}`);
        continue;
      }
      if (normalizeRsid(claim.variant.rsid) !== normalizeRsid(input.rsid)) {
        errors.push(`${model.modelId} ${model.modelVersion} claim ${claimId} does not belong to ${input.rsid}`);
      }
      const state = input.contributionStates?.[claimId];
      if (!VALID_STATES.has(state)) {
        errors.push(`${model.modelId} ${model.modelVersion} claim ${claimId} has no valid contribution state`);
      }
      const priorGroup = claimGroups.get(claimId);
      if (priorGroup && priorGroup !== input.independenceGroup) {
        errors.push(`${model.modelId} ${model.modelVersion} claim ${claimId} appears in multiple independence groups`);
      }
      claimGroups.set(claimId, input.independenceGroup);
    }

    for (const claimId of Object.keys(input.contributionStates || {})) {
      if (!(input.claimIds || []).includes(claimId)) {
        errors.push(`${model.modelId} ${model.modelVersion} has contribution state for non-input claim ${claimId}`);
      }
    }

    for (const [claimId, profilesForClaim] of Object.entries(input.profilesByClaimId || {})) {
      if (!(input.claimIds || []).includes(claimId)) {
        errors.push(`${model.modelId} ${model.modelVersion} has profile override for non-input claim ${claimId}`);
      }
      if (!Array.isArray(profilesForClaim) || profilesForClaim.some(profile => !VALID_PROFILES.has(profile))) {
        errors.push(`${model.modelId} ${model.modelVersion} claim ${claimId} has invalid profile override`);
      }
    }
  }
}

export async function validateModels(root = repoRoot()) {
  const errors = [];
  const panel = await readJson(root, "data/snp-panel.json");
  const manifest = await readJson(root, "models/manifest.json");
  const lock = await readJson(root, "models/model-lock.json");
  const panelIndex = { panel, ...collectPanel(panel) };
  const seen = new Map();
  const locked = new Map((lock.models || []).map(item => [`${item.modelId}@${item.modelVersion}`, item.sha256]));

  validatePanelScoring(panel, errors);

  if (!manifest.pathwayDefinitions) {
    errors.push("manifest missing pathwayDefinitions metadata");
  } else {
    const definitionsSha = await sha256(root, manifest.pathwayDefinitions.path);
    if (definitionsSha !== manifest.pathwayDefinitions.sha256) {
      errors.push("pathway definitions manifest checksum mismatch");
    }
  }

  if (!manifest.annotationPack) {
    errors.push("manifest missing annotationPack metadata");
  } else {
    const panelSha = await sha256(root, manifest.annotationPack.path);
    if (panelSha !== manifest.annotationPack.sha256) {
      errors.push("annotation pack manifest checksum mismatch");
    }
    if (manifest.annotationPack.version !== panel.version) {
      errors.push(`annotation pack manifest version ${manifest.annotationPack.version} does not match panel ${panel.version}`);
    }
    if (manifest.annotationPack.recordCount !== (panel.variants || []).length) {
      errors.push("annotation pack manifest record count does not match panel");
    }
    if (manifest.annotationPack.claimCount !== panel.generatedFrom?.claimCount) {
      errors.push("annotation pack manifest claim count does not match panel metadata");
    }
  }

  for (const entry of manifest.models || []) {
    const key = `${entry.modelId}@${entry.modelVersion}`;
    const actualSha = await sha256(root, entry.path);
    if (actualSha !== entry.sha256) {
      errors.push(`${key} manifest checksum mismatch`);
    }
    if (locked.has(key) && locked.get(key) !== actualSha) {
      errors.push(`${key} changed content without a model-version change`);
    }
    if (seen.has(key) && seen.get(key) !== actualSha) {
      errors.push(`${key} appears more than once with different content`);
    }
    seen.set(key, actualSha);

    const model = await readJson(root, entry.path);
    validateModelShape(model, entry, panelIndex, errors);
    validateInputs(model, panelIndex, errors);
    validateBands(model, errors);
  }

  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = await validateModels();
  if (errors.length) {
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }
  console.log("Model validation passed.");
}
