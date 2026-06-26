import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CARD_DIR = "docs/model-cards";

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function formatList(items) {
  return (items || []).length
    ? items.map(item => `- ${item}`).join("\n")
    : "- Not specified.";
}

function contributorTable(model) {
  return [
    "| rsID | Claim count | Axis multiplier | Mechanism | Independence group | Profiles |",
    "|---|---:|---:|---|---|---|",
    ...(model.inputs || []).map(input => [
      input.rsid,
      input.claimIds?.length || 0,
      input.axisMultiplier,
      input.mechanism,
      input.independenceGroup,
      (input.profiles || []).join(", ")
    ].map(value => String(value).replace(/\|/g, "\\|")).join(" | "))
      .map(row => `| ${row} |`)
  ].join("\n");
}

function modelCard(model) {
  return `# ${model.name}

## Review status

- Status: ${model.status || "experimental"}
- Review level: ${model.reviewLevel || "not reviewed"}
- Reviewed at: ${model.reviewedAt || "not reviewed"}
- Checklist version: ${model.reviewChecklistVersion || "not specified"}
- Release use: ${model.releaseUse || "Informational use only."}

${model.reviewNotes || "No review note listed."}

## Biological question

${model.biologicalQuestion}

## Score axis

- Negative pole: ${model.negativePole}
- Positive pole: ${model.positivePole}

## Included mechanisms

${formatList(model.includedMechanisms)}

## Excluded mechanisms

${formatList(model.excludedMechanisms)}

## Model thresholds

- Minimum coverage: ${model.minimumCoverage}
- Minimum independent signals: ${model.minimumIndependentSignals}
- Minimum evidence quality: ${model.minimumEvidenceQuality}
- Maximum group contribution: ${model.maximumGroupContribution}
- Default profile: ${model.defaultProfile}

## Inputs

${contributorTable(model)}

## Known weaknesses

${formatList(model.knownWeaknesses)}

## Limitations

${formatList(model.limitations)}

## Versioning

- Model ID: ${model.modelId}
- Model version: ${model.modelVersion}
- Schema version: ${model.schemaVersion}
- Algorithm: ${model.algorithm?.id} ${model.algorithm?.version}
- Variant contribution model: ${model.variantContributionModelVersion}
- Compatible panel version: ${model.compatiblePanelVersion}
`;
}

export async function buildModelCards(root = repoRoot()) {
  const manifest = await readJson(root, "models/manifest.json");
  await mkdir(path.join(root, CARD_DIR), { recursive: true });

  let count = 0;
  for (const entry of manifest.models || []) {
    const model = await readJson(root, entry.path);
    const cardPath = entry.modelCard || `${CARD_DIR}/${model.modelId}.md`;
    await writeFile(path.join(root, cardPath), modelCard(model), "utf8");
    count += 1;
  }
  return { count };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildModelCards();
  console.log(`Generated ${result.count} model cards.`);
}
