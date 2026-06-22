const BASES = new Set(["A", "C", "G", "T"]);
const BASE_ORDER = { A: 0, C: 1, G: 2, T: 3 };

export function normalizeRsid(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeGenotype(value) {
  const genotype = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s/|]/g, "");

  if (!genotype || genotype === "--" || genotype === "00" || genotype.includes("-")) {
    return null;
  }

  if (genotype.length !== 2) {
    return null;
  }

  const alleles = genotype.split("");
  if (!alleles.every(allele => BASES.has(allele))) {
    return null;
  }

  return alleles.sort((a, b) => BASE_ORDER[a] - BASE_ORDER[b]).join("");
}

function splitRow(line) {
  const delimiter = line.includes("\t") ? "\t" : ",";
  if (delimiter === "\t") {
    return line.split("\t").map(part => part.trim());
  }

  const fields = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function headerIndex(headers, names) {
  const normalized = headers.map(normalizeHeader);
  for (const name of names) {
    const index = normalized.indexOf(normalizeHeader(name));
    if (index !== -1) {
      return index;
    }
  }
  return -1;
}

function looksLikeHeader(fields) {
  const normalized = fields.map(normalizeHeader);
  return (
    normalized.some(value => ["rsid", "rs", "snpid", "snpname"].includes(value)) &&
    normalized.some(value => ["genotype", "result", "allele1", "allelea"].includes(value))
  );
}

function readWithHeader(fields, header) {
  const rsidIndex = headerIndex(header, ["rsid", "rs#", "snp id", "snp name"]);
  const chromosomeIndex = headerIndex(header, ["chromosome", "chromosome number", "chrom"]);
  const positionIndex = headerIndex(header, ["position", "basepair", "base pair position"]);
  const genotypeIndex = headerIndex(header, ["genotype", "result"]);
  const allele1Index = headerIndex(header, ["allele1", "allele a", "allele one"]);
  const allele2Index = headerIndex(header, ["allele2", "allele b", "allele two"]);

  if (rsidIndex < 0) {
    return null;
  }

  const genotype =
    genotypeIndex >= 0
      ? fields[genotypeIndex]
      : allele1Index >= 0 && allele2Index >= 0
        ? `${fields[allele1Index]}${fields[allele2Index]}`
        : "";

  return {
    rsid: fields[rsidIndex],
    chromosome: chromosomeIndex >= 0 ? fields[chromosomeIndex] : "",
    position: positionIndex >= 0 ? fields[positionIndex] : "",
    genotype
  };
}

function readWithoutHeader(fields) {
  if (fields.length >= 5 && normalizeRsid(fields[0]).startsWith("rs")) {
    return {
      rsid: fields[0],
      chromosome: fields[1],
      position: fields[2],
      genotype: `${fields[3]}${fields[4]}`
    };
  }

  if (fields.length >= 4 && normalizeRsid(fields[0]).startsWith("rs")) {
    return {
      rsid: fields[0],
      chromosome: fields[1],
      position: fields[2],
      genotype: fields[3]
    };
  }

  return null;
}

export function parseRawGenotype(text) {
  const variants = new Map();
  const records = [];
  const warnings = [];
  const lines = String(text || "").split(/\r?\n/);
  let header = null;
  let commentCount = 0;
  let dataLineCount = 0;
  let noCallCount = 0;
  let duplicateCount = 0;
  let malformedCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("#")) {
      commentCount += 1;
      continue;
    }

    const fields = splitRow(line);
    if (!header && looksLikeHeader(fields)) {
      header = fields;
      continue;
    }

    dataLineCount += 1;
    const record = header ? readWithHeader(fields, header) : readWithoutHeader(fields);
    if (!record || !record.rsid) {
      malformedCount += 1;
      continue;
    }

    const normalizedRsid = normalizeRsid(record.rsid);
    const normalizedGenotype = normalizeGenotype(record.genotype);
    if (!normalizedGenotype) {
      noCallCount += 1;
      continue;
    }

    const parsedRecord = {
      rsid: record.rsid.trim(),
      normalizedRsid,
      chromosome: String(record.chromosome || "").trim(),
      position: String(record.position || "").trim(),
      genotype: String(record.genotype || "").trim().toUpperCase(),
      normalizedGenotype
    };

    if (variants.has(normalizedRsid)) {
      duplicateCount += 1;
    }

    variants.set(normalizedRsid, parsedRecord);
    records.push(parsedRecord);
  }

  if (malformedCount > 0) {
    warnings.push(`${malformedCount} row(s) could not be parsed and were skipped.`);
  }
  if (duplicateCount > 0) {
    warnings.push(`${duplicateCount} duplicate rsID row(s) were overwritten by later rows.`);
  }

  return {
    variants,
    records,
    warnings,
    metadata: {
      commentCount,
      dataLineCount,
      parsedVariantCount: variants.size,
      noCallCount,
      duplicateCount,
      malformedCount,
      detectedHeader: Boolean(header)
    }
  };
}

export function analyzeVariants(parsed, panel) {
  const findings = [];
  const missing = [];
  const unknownGenotypes = [];
  const pathwayTotals = new Map();

  for (const variant of panel.variants || []) {
    const parsedVariant = parsed.variants.get(normalizeRsid(variant.rsid));
    if (!parsedVariant) {
      missing.push({
        rsid: variant.rsid,
        gene: variant.gene,
        pathway: variant.pathway
      });
      continue;
    }

    const genotype = parsedVariant.normalizedGenotype;
    const effect = variant.genotypes?.[genotype];
    if (!effect) {
      unknownGenotypes.push({
        rsid: variant.rsid,
        gene: variant.gene,
        genotype,
        pathway: variant.pathway
      });
      continue;
    }

    const score = Number(effect.score || 0);
    const pathway = variant.pathway || "Uncategorized";
    pathwayTotals.set(pathway, (pathwayTotals.get(pathway) || 0) + Math.abs(score));

    findings.push({
      rsid: variant.rsid,
      gene: variant.gene,
      pathway,
      label: variant.label,
      genotype,
      rawGenotype: parsedVariant.genotype,
      interpretation: effect.interpretation,
      direction: effect.direction || "neutral",
      score,
      evidenceLevel: variant.evidenceLevel,
      sourceLinks: variant.sourceLinks || [],
      limitations: variant.limitations || [],
      validationMarkers: variant.validationMarkers || []
    });
  }

  findings.sort((a, b) => Math.abs(b.score) - Math.abs(a.score) || a.rsid.localeCompare(b.rsid));

  const pathwaySummary = Array.from(pathwayTotals.entries())
    .map(([pathway, score]) => ({ pathway, score }))
    .sort((a, b) => b.score - a.score || a.pathway.localeCompare(b.pathway));

  return {
    panelVersion: panel.version,
    generatedAt: new Date().toISOString(),
    metadata: parsed.metadata,
    warnings: [
      ...parsed.warnings,
      "Direct rsID/genotype matching only. No strand flipping, imputation, phasing, or genome-build liftover is performed.",
      "This report is informational and does not diagnose disease or recommend treatment."
    ],
    findings,
    missing,
    unknownGenotypes,
    pathwaySummary
  };
}
