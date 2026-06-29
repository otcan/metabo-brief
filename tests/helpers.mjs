import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function loadText(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

export async function loadJson(relativePath) {
  return JSON.parse(await loadText(relativePath));
}

export async function loadPanel() {
  return loadJson("data/snp-panel.json");
}

export async function loadModelWithManifest(modelId, modelVersion = null) {
  const manifest = await loadJson("models/manifest.json");
  const entry = (manifest.models || []).find(item =>
    item.modelId === modelId && (!modelVersion || item.modelVersion === modelVersion)
  );
  if (!entry) {
    throw new Error(`Model not found in manifest: ${modelId}${modelVersion ? `@${modelVersion}` : ""}`);
  }
  const model = await loadJson(entry.path);
  return {
    ...model,
    sha256: entry.sha256,
    __manifest: entry
  };
}

export async function loadDefaultModels() {
  const manifest = await loadJson("models/manifest.json");
  const models = [];
  for (const entry of manifest.models || []) {
    if (!entry.defaultEnabled) {
      continue;
    }
    const model = await loadJson(entry.path);
    models.push({
      ...model,
      sha256: entry.sha256,
      __manifest: entry
    });
  }
  return models;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function genotypeText(rows) {
  const body = rows.map(([rsid, genotype]) => `${rsid}\t1\t0\t${genotype}`).join("\n");
  return [
    "# Synthetic 23andMe-style file for scoring tests.",
    "# This is not real personal genotype data.",
    "# Provider: 23andMe",
    "# Genome build: GRCh37",
    "# rsid\tchromosome\tposition\tgenotype",
    body
  ].join("\n");
}

export function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}
