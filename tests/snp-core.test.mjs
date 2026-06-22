import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { analyzeVariants, normalizeGenotype, parseRawGenotype } from "../analyzer/snp-core.js";

const panel = JSON.parse(await readFile(new URL("../data/snp-panel.json", import.meta.url), "utf8"));
const sample23 = await readFile(new URL("../examples/synthetic-23andme.txt", import.meta.url), "utf8");
const sampleAncestry = await readFile(new URL("../examples/synthetic-ancestry.txt", import.meta.url), "utf8");

assert.equal(normalizeGenotype("TC"), "CT");
assert.equal(normalizeGenotype("A/G"), "AG");
assert.equal(normalizeGenotype("--"), null);

const parsed23 = parseRawGenotype(sample23);
assert.equal(parsed23.metadata.dataLineCount, 11);
assert.equal(parsed23.metadata.parsedVariantCount, 10);
assert.equal(parsed23.metadata.noCallCount, 1);
assert.equal(parsed23.variants.get("rs1801133").normalizedGenotype, "CT");

const report23 = analyzeVariants(parsed23, panel);
assert.equal(report23.findings.length, 10);
assert.equal(report23.missing.length, 0);
assert.ok(Math.abs(report23.findings[0].score) >= 1);
assert.ok(report23.pathwaySummary.some(item => item.pathway === "Methylation / one-carbon metabolism"));

const parsedAncestry = parseRawGenotype(sampleAncestry);
assert.equal(parsedAncestry.metadata.detectedHeader, true);
assert.equal(parsedAncestry.metadata.parsedVariantCount, 10);
assert.equal(parsedAncestry.variants.get("rs1801133").normalizedGenotype, "TT");

const reportAncestry = analyzeVariants(parsedAncestry, panel);
assert.equal(reportAncestry.findings.length, 10);
assert.equal(reportAncestry.missing.length, 0);
assert.ok(reportAncestry.findings.some(finding => finding.rsid === "rs671" && finding.genotype === "AG"));

console.log("SNP parser and panel tests passed.");
