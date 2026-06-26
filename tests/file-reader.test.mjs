import assert from "node:assert/strict";
import { deflateRawSync, gzipSync, gunzipSync, inflateRawSync } from "node:zlib";

import { decodeGenotypeBytes } from "../analyzer/file-reader.js";
import { parseRawGenotype } from "../analyzer/snp-core.js";

const encoder = new TextEncoder();

const nodeDecompressors = {
  gzip: async bytes => new Uint8Array(gunzipSync(bytes)),
  deflateRaw: async bytes => new Uint8Array(inflateRawSync(bytes))
};

function writeUint16(target, value) {
  target.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(target, value) {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function writeBytes(target, bytes) {
  target.push(...bytes);
}

function zipFile(entries) {
  const output = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const raw = encoder.encode(entry.text);
    const data = entry.deflate ? new Uint8Array(deflateRawSync(raw)) : raw;
    const method = entry.deflate ? 8 : 0;
    const localOffset = offset;

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 2048);
    writeUint16(output, method);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint32(output, 0);
    writeUint32(output, data.byteLength);
    writeUint32(output, raw.byteLength);
    writeUint16(output, nameBytes.byteLength);
    writeUint16(output, 0);
    writeBytes(output, nameBytes);
    writeBytes(output, data);
    offset = output.length;

    writeUint32(central, 0x02014b50);
    writeUint16(central, 20);
    writeUint16(central, 20);
    writeUint16(central, 2048);
    writeUint16(central, method);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, 0);
    writeUint32(central, data.byteLength);
    writeUint32(central, raw.byteLength);
    writeUint16(central, nameBytes.byteLength);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, 0);
    writeUint32(central, localOffset);
    writeBytes(central, nameBytes);
  }

  const centralOffset = output.length;
  writeBytes(output, central);
  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, entries.length);
  writeUint16(output, entries.length);
  writeUint32(output, central.length);
  writeUint32(output, centralOffset);
  writeUint16(output, 0);

  return new Uint8Array(output);
}

const myHeritageCsv = [
  "RSID,CHROMOSOME,POSITION,RESULT",
  "rs1801133,1,11856378,AA",
  "rs762551,15,75041917,AC",
  "rs4988235,2,136608646,CC",
  "rs0000001,1,1,--"
].join("\n");

const decodedZip = await decodeGenotypeBytes({
  name: "MyHeritage_raw_dna_data.zip",
  bytes: zipFile([
    { name: "README.txt", text: "Not genotype data", deflate: false },
    { name: "MyHeritage_raw_dna_data.csv", text: myHeritageCsv, deflate: true }
  ]),
  decompressors: nodeDecompressors
});
assert.equal(decodedZip.metadata.fileName, "MyHeritage_raw_dna_data.zip");
assert.equal(decodedZip.metadata.selectedZipEntry, "MyHeritage_raw_dna_data.csv");
assert.equal(decodedZip.metadata.compression, "zip-deflate");
assert.equal(decodedZip.text.includes("rs1801133"), true);

const parsedZip = parseRawGenotype(decodedZip.text, {
  ...decodedZip.metadata,
  warnings: decodedZip.warnings
});
assert.equal(parsedZip.metadata.provider, "MyHeritage");
assert.equal(parsedZip.metadata.genomeBuild, "GRCh37");
assert.equal(parsedZip.metadata.genomeBuildConfidence, "provider-default");
assert.equal(parsedZip.metadata.parsedVariantCount, 3);
assert.equal(parsedZip.metadata.noCallCount, 1);
assert.equal(parsedZip.variants.get("rs762551").normalizedGenotype, "AC");

const decodedGzip = await decodeGenotypeBytes({
  name: "synthetic-23andme.txt.gz",
  bytes: new Uint8Array(gzipSync(encoder.encode([
    "# Provider: 23andMe",
    "# Genome build: GRCh37",
    "rs1801133\t1\t11856378\tAA"
  ].join("\n")))),
  decompressors: nodeDecompressors
});
assert.equal(decodedGzip.metadata.compression, "gzip");
assert.equal(decodedGzip.metadata.importedFrom, "synthetic-23andme.txt");
assert.equal(parseRawGenotype(decodedGzip.text, decodedGzip.metadata).metadata.provider, "23andMe");

const duplicateText = [
  "# Provider: 23andMe",
  "# Genome build: GRCh37",
  "rs1801133\t1\t11856378\tAA",
  "rs1801133\t1\t11856378\tAG"
].join("\n");
const parsedDuplicate = parseRawGenotype(duplicateText);
assert.equal(parsedDuplicate.metadata.duplicateCount, 1);
assert.equal(parsedDuplicate.metadata.conflictingDuplicateCount, 1);
assert.ok(parsedDuplicate.warnings.some(warning => warning.includes("conflicting genotype")));

await assert.rejects(
  () => decodeGenotypeBytes({
    name: "unsupported.zip",
    bytes: zipFile([{ name: "README.md", text: "not a genotype", deflate: false }]),
    decompressors: nodeDecompressors
  }),
  /does not contain a supported/
);

await assert.rejects(
  () => decodeGenotypeBytes({
    name: "variants.vcf.gz",
    bytes: new Uint8Array(gzipSync(encoder.encode("##fileformat=VCFv4.2\n"))),
    decompressors: nodeDecompressors
  }),
  /VCF and VCF.GZ files are not supported/
);

console.log("Compressed genotype file-reader tests passed.");
