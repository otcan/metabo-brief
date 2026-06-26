import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASES = new Set(["A", "C", "G", "T"]);
const BASE_ORDER = { A: 0, C: 1, G: 2, T: 3 };

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function normalizeGenotype(value) {
  const genotype = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s/|]/g, "");

  if (genotype.length !== 2) {
    return null;
  }

  const alleles = genotype.split("");
  if (!alleles.every(allele => BASES.has(allele))) {
    return null;
  }

  return alleles.sort((a, b) => BASE_ORDER[a] - BASE_ORDER[b]).join("");
}

function scoreValue(effect) {
  return Math.abs(Number(effect?.score || 0));
}

function chooseDemoGenotype(variant) {
  const candidates = Object.entries(variant.genotypes || {})
    .map(([genotype, effect]) => ({
      genotype: normalizeGenotype(genotype),
      effect,
      score: scoreValue(effect),
      eligible: Boolean(effect.pathwayScoringEligible)
    }))
    .filter(item => item.genotype);

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) =>
    Number(b.eligible) - Number(a.eligible) ||
    b.score - a.score ||
    a.genotype.localeCompare(b.genotype)
  );
  return candidates[0].genotype;
}

export async function buildSyntheticExamples(root = repoRoot()) {
  const panel = JSON.parse(await readFile(path.join(root, "data/snp-panel.json"), "utf8"));
  const rows = (panel.variants || [])
    .map(variant => ({ variant, genotype: chooseDemoGenotype(variant) }))
    .filter(item => item.genotype)
    .sort((a, b) => a.variant.rsid.localeCompare(b.variant.rsid));

  const header = [
    "# Synthetic 23andMe-style file for MetaboBrief tests and demos.",
    "# This is not real personal genotype data.",
    "# Provider: 23andMe",
    "# Genome build: GRCh37",
    "# rsid\tchromosome\tposition\tgenotype"
  ];
  const twentyThreeAndMe = [
    ...header,
    ...rows.map(({ variant, genotype }) => `${variant.rsid}\t0\t0\t${genotype}`),
    "rs0000000\t1\t0\t--"
  ].join("\n");

  const ancestry = [
    "# Synthetic AncestryDNA-style file for MetaboBrief tests and demos.",
    "# This is not real personal genotype data.",
    "# Provider: AncestryDNA",
    "# Genome build: GRCh37",
    "rsid\tchromosome\tposition\tallele1\tallele2",
    ...rows.map(({ variant, genotype }) => `${variant.rsid}\t0\t0\t${genotype[0]}\t${genotype[1]}`)
  ].join("\n");

  await writeFile(path.join(root, "examples/synthetic-23andme.txt"), `${twentyThreeAndMe}\n`, "utf8");
  await writeFile(path.join(root, "examples/synthetic-ancestry.txt"), `${ancestry}\n`, "utf8");

  return { rows: rows.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildSyntheticExamples();
  console.log(`Generated synthetic examples with ${result.rows} panel rows.`);
}
