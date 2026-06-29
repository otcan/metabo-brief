import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ALGORITHM_ID,
  ALGORITHM_VERSION,
  VARIANT_SCORING_MODEL_VERSION,
  buildVariantScoring
} from "../analyzer/scoring-engine.js";

const APPLICATION_VERSION = "0.4.0";
const MODEL_SCHEMA_VERSION = "1.0.0";
const GENERATED_MODEL_VERSION = "0.1.0";
const GENERATED_MODELS_ROOT = "models/generated";
const MANUAL_MODEL_PATHS = [
  "models/caffeine-clearance/0.2.0.json",
  "models/caffeine-sensitivity/0.1.0.json",
  "models/archived/caffeine-response-legacy-v1.json"
];

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function writeJson(root, relativePath, data) {
  const fullPath = path.join(root, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function sha256(root, relativePath) {
  const text = await readFile(path.join(root, relativePath), "utf8");
  return createHash("sha256").update(text).digest("hex");
}

function normalizeRsid(value) {
  return String(value || "").trim().toLowerCase();
}

function slug(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function variantPathways(variant) {
  return Array.isArray(variant.pathways) && variant.pathways.length
    ? variant.pathways
    : [variant.pathway || "Uncategorized"];
}

function targetTypeForVariant(variant) {
  const targets = new Set(
    Object.values(variant.genotypes || {})
      .map(effect => effect.targetType || variant.targetType || "unknown")
      .filter(Boolean)
  );
  if (targets.size === 1) {
    return [...targets][0];
  }
  return "mixed";
}

function claimProfiles(effect, conservativeEvidenceMinimum) {
  const scoring = buildVariantScoring(effect);
  if (scoring.contribution !== 0 && scoring.certainty < conservativeEvidenceMinimum) {
    return ["exploratory"];
  }
  return ["conservative", "exploratory"];
}

function buildInput(variant, definition) {
  const effects = Object.entries(variant.genotypes || {})
    .map(([genotype, effect]) => ({
      genotype,
      effect,
      scoring: buildVariantScoring(effect)
    }))
    .filter(item => item.effect.claimId);
  const scoredEffects = effects.filter(item =>
    item.effect.pathwayScoringEligible && Math.abs(item.scoring.contribution) > 0
  );

  if (!effects.length || !scoredEffects.length) {
    return null;
  }

  const contributionStates = {};
  const profilesByClaimId = {};
  const conservativeEvidenceMinimum = definition.conservativeEvidenceMinimum ?? 0.5;
  const hasConservativeScoredEffect = scoredEffects.some(item => item.scoring.certainty >= conservativeEvidenceMinimum);

  for (const item of effects) {
    const claimId = item.effect.claimId;
    if (item.effect.pathwayScoringEligible && Math.abs(item.scoring.contribution) > 0) {
      contributionStates[claimId] = "scored";
      profilesByClaimId[claimId] = claimProfiles(item.effect, conservativeEvidenceMinimum);
    } else if (item.scoring.contribution === 0) {
      contributionStates[claimId] = "supported_baseline";
      profilesByClaimId[claimId] = hasConservativeScoredEffect
        ? ["conservative", "exploratory"]
        : ["exploratory"];
    } else {
      contributionStates[claimId] = "insufficient_evidence";
      profilesByClaimId[claimId] = ["exploratory"];
    }
  }

  const profiles = [...new Set(Object.values(profilesByClaimId).flat())];
  const targetType = targetTypeForVariant(variant);
  const gene = slug(variant.gene || variant.rsid);

  return {
    rsid: variant.rsid,
    claimIds: effects.map(item => item.effect.claimId),
    contributionStates,
    axisMultiplier: definition.axisMultiplier ?? 1,
    mechanism: `${gene}-${slug(targetType)}`,
    independenceGroup: `${gene}-${slug(targetType)}`,
    modelWeight: definition.modelWeight ?? 1,
    profiles,
    profilesByClaimId,
    inclusionRationale: `Included because the starter SNP panel assigns ${variant.gene || variant.rsid} ${variant.rsid} to ${definition.sourcePathway} with explicit genotype contribution components.`
  };
}

function buildModel(panel, definition, definitions) {
  const inputs = (panel.variants || [])
    .filter(variant => variantPathways(variant).includes(definition.sourcePathway))
    .map(variant => buildInput(variant, definition))
    .filter(Boolean)
    .sort((a, b) => a.rsid.localeCompare(b.rsid));

  if (!inputs.length) {
    throw new Error(`No scoreable inputs generated for ${definition.sourcePathway}`);
  }

  const independentGroups = new Set(inputs.map(input => input.independenceGroup));
  const minimumIndependentSignals =
    definition.minimumIndependentSignals ?? (independentGroups.size >= 2 ? 2 : 1);
  const review = {
    ...(definitions.reviewDefaults || {}),
    ...(definition.review || {})
  };

  return {
    schemaVersion: MODEL_SCHEMA_VERSION,
    modelId: definition.modelId,
    modelVersion: definition.modelVersion || definitions.modelVersion || GENERATED_MODEL_VERSION,
    name: definition.name,
    pathway: definition.sourcePathway,
    profileGroup: definition.profileGroup || definitions.profileGroup,
    status: definition.status || review.status || "experimental",
    reviewLevel: review.reviewLevel,
    reviewedAt: review.reviewedAt,
    reviewChecklistVersion: review.reviewChecklistVersion,
    reviewNotes: review.reviewNotes,
    knownWeaknesses: review.knownWeaknesses || [],
    releaseUse: review.releaseUse,
    algorithm: {
      id: ALGORITHM_ID,
      version: ALGORITHM_VERSION
    },
    variantContributionModelVersion: VARIANT_SCORING_MODEL_VERSION,
    compatiblePanelVersion: panel.version,
    biologicalQuestion: definition.biologicalQuestion,
    negativePole: definition.negativePole,
    positivePole: definition.positivePole,
    includedMechanisms: definition.includedMechanisms || [],
    excludedMechanisms: definition.excludedMechanisms || [],
    defaultProfile: definition.defaultProfile || "conservative",
    minimumCoverage: definition.minimumCoverage ?? 0.25,
    minimumIndependentSignals,
    minimumEvidenceQuality: definition.minimumEvidenceQuality ?? 0.3,
    maximumGroupContribution: definition.maximumGroupContribution ?? 0.5,
    inputs,
    interpretationBands: [
      {
        min: 0,
        max: 39,
        label: `toward ${definition.negativePole.toLowerCase()}`
      },
      {
        min: 40,
        max: 60,
        label: "near the model midpoint"
      },
      {
        min: 61,
        max: 100,
        label: `toward ${definition.positivePole.toLowerCase()}`
      }
    ],
    limitations: [
      "This is a relative pathway tendency within the MetaboBrief starter model, not a population percentile.",
      "This model combines curated SNP contribution components assigned to this pathway; it does not measure current pathway activity.",
      "The current browser analyzer scoreability-gates direct provider-native rsID matching but still does not perform coordinate validation or strand normalization.",
      ...(definition.excludedMechanisms?.length
        ? [`Not included: ${definition.excludedMechanisms.join(", ")}.`]
        : [])
    ]
  };
}

async function listJsonFiles(root, relativeDir) {
  const fullDir = path.join(root, relativeDir);
  const entries = await readdir(fullDir, { recursive: true, withFileTypes: true });
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
    .map(entry => path.join(entry.path, entry.name))
    .map(fullPath => path.relative(root, fullPath).split(path.sep).join("/"))
    .sort();
}

export async function buildPathwayModels(root = repoRoot()) {
  const panel = await readJson(root, "data/snp-panel.json");
  const definitions = await readJson(root, "data/pathway-definitions.json");
  await rm(path.join(root, GENERATED_MODELS_ROOT), { recursive: true, force: true });

  for (const definition of definitions.definitions || []) {
    const model = buildModel(panel, definition, definitions);
    await writeJson(root, `${GENERATED_MODELS_ROOT}/${model.modelId}/${model.modelVersion}.json`, model);
  }

  const generatedModelPaths = await listJsonFiles(root, GENERATED_MODELS_ROOT);
  const modelPaths = [...MANUAL_MODEL_PATHS, ...generatedModelPaths];
  const models = [];

  for (const modelPath of modelPaths) {
    const model = await readJson(root, modelPath);
    models.push({
      modelId: model.modelId,
      modelVersion: model.modelVersion,
      path: modelPath,
      sha256: await sha256(root, modelPath),
      status: model.status || "experimental",
      defaultEnabled: !["archived", "deprecated"].includes(model.status),
      compatibleAnnotationPack: model.compatiblePanelVersion,
      requiredEngineVersion: APPLICATION_VERSION,
      requiredSchemaVersion: model.schemaVersion,
      algorithm: model.algorithm,
      variantContributionModelVersion: model.variantContributionModelVersion,
      modelCard: `docs/model-cards/${model.modelId}.md`
    });
  }

  models.sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1;
    if (a.status !== "archived" && b.status === "archived") return -1;
    return a.modelId.localeCompare(b.modelId) || a.modelVersion.localeCompare(b.modelVersion);
  });

  const manifest = {
    schemaVersion: "1.0.0",
    generatedAt: "2026-06-26",
    modelSchema: {
      path: "models/pathway-model.schema.json",
      sha256: await sha256(root, "models/pathway-model.schema.json")
    },
    pathwayDefinitions: {
      path: "data/pathway-definitions.json",
      sha256: await sha256(root, "data/pathway-definitions.json")
    },
    annotationPack: {
      id: "starter-snp-panel",
      version: panel.version,
      path: "data/snp-panel.json",
      sha256: await sha256(root, "data/snp-panel.json"),
      recordCount: (panel.variants || []).length,
      claimCount: panel.generatedFrom?.claimCount || 0
    },
    models
  };

  const lock = {
    schemaVersion: "1.0.0",
    generatedAt: "2026-06-26",
    models: models.map(model => ({
      modelId: model.modelId,
      modelVersion: model.modelVersion,
      path: model.path,
      sha256: model.sha256
    }))
  };

  await writeJson(root, "models/manifest.json", manifest);
  await writeJson(root, "models/model-lock.json", lock);

  return { generated: generatedModelPaths.length, manifestModels: models.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildPathwayModels();
  console.log(`Generated ${result.generated} pathway models; manifest contains ${result.manifestModels} models.`);
}
