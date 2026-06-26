import { buildPathwayScores, buildVariantScoring } from "./scoring-engine.js";

export const APPLICATION_VERSION = "0.3.0";
export const REPORT_SCHEMA_VERSION = "0.3.0";

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

function detectProvider(commentLines) {
  const text = commentLines.join(" ").toLowerCase();
  if (text.includes("23andme") || text.includes("23 and me")) {
    return { provider: "23andMe", confidence: "medium" };
  }
  if (text.includes("ancestrydna") || text.includes("ancestry dna")) {
    return { provider: "AncestryDNA", confidence: "medium" };
  }
  if (text.includes("myheritage")) {
    return { provider: "MyHeritage", confidence: "medium" };
  }
  if (text.includes("familytreedna") || text.includes("family tree dna")) {
    return { provider: "FamilyTreeDNA", confidence: "medium" };
  }
  return { provider: null, confidence: "none" };
}

function detectGenomeBuild(commentLines) {
  const text = commentLines.join(" ").toLowerCase();
  if (/\b(grch37|hg19|build\s*37|genome\s+build\s+37)\b/.test(text)) {
    return { genomeBuild: "GRCh37", confidence: "medium" };
  }
  if (/\b(grch38|hg38|build\s*38|genome\s+build\s+38)\b/.test(text)) {
    return { genomeBuild: "GRCh38", confidence: "medium" };
  }
  return { genomeBuild: null, confidence: "none" };
}

function inferHeaderFormat(header) {
  const normalized = header.map(normalizeHeader);
  if (normalized.includes("allele1") && normalized.includes("allele2")) {
    return "allele-column rsID table";
  }
  if (normalized.includes("genotype") || normalized.includes("result")) {
    return "genotype rsID table";
  }
  return "header-based rsID table";
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

function cleanLegacyPlainText(value) {
  return String(value || "")
    .replace(/\bDirection\s+[-\d.]+;\s*magnitude\s+[-\d.]+;\s*certainty\s+[-\d.]+;\s*final score\s+[-\d.]+\.?\s*/gi, "");
}

export function parseRawGenotype(text) {
  const variants = new Map();
  const records = [];
  const warnings = [];
  const lines = String(text || "").split(/\r?\n/);
  let header = null;
  let inferredFormat = null;
  const commentLines = [];
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
      if (commentLines.length < 40) {
        commentLines.push(line.replace(/^#+\s*/, ""));
      }
      continue;
    }

    const fields = splitRow(line);
    if (!header && looksLikeHeader(fields)) {
      header = fields;
      inferredFormat = inferHeaderFormat(fields);
      continue;
    }

    dataLineCount += 1;
    if (!inferredFormat && normalizeRsid(fields[0]).startsWith("rs")) {
      inferredFormat = fields.length >= 5 ? "allele-column rsID table" : "genotype rsID table";
    }
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

  const provider = detectProvider(commentLines);
  const build = detectGenomeBuild(commentLines);

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
      detectedHeader: Boolean(header),
      provider: provider.provider,
      providerConfidence: provider.confidence,
      format: inferredFormat || "unrecognized rsID table",
      formatConfidence: inferredFormat ? "medium" : "low",
      genomeBuild: build.genomeBuild,
      genomeBuildConfidence: build.confidence,
      orientation: "provider-native",
      orientationConfidence: "limited"
    }
  };
}

function buildValidation(parsed, coverage) {
  const metadata = parsed.metadata;
  const limitations = [];
  const parsedVariantCount = metadata.parsedVariantCount || 0;

  if (!metadata.provider) {
    limitations.push("Provider was not detected from file comments or headers.");
  }
  if (!metadata.genomeBuild) {
    limitations.push("Genome build was not detected; no liftover or coordinate validation was performed.");
  }
  if (metadata.orientationConfidence !== "high") {
    limitations.push("Alleles are treated as provider-native direct genotype calls; strand normalization is not performed.");
  }
  if (parsedVariantCount < 1000) {
    limitations.push("This file has far fewer variants than a normal consumer DNA export and may be a fixture or partial file.");
  }
  if (coverage.uninterpretablePanelVariantCount > 0) {
    limitations.push(`${coverage.uninterpretablePanelVariantCount} panel loci were present but did not match a supported genotype claim.`);
  }

  return {
    provider: metadata.provider || "not detected",
    providerConfidence: metadata.providerConfidence || "none",
    format: metadata.format || "unrecognized rsID table",
    formatConfidence: metadata.formatConfidence || "low",
    genomeBuild: metadata.genomeBuild || "not detected",
    genomeBuildConfidence: metadata.genomeBuildConfidence || "none",
    orientation: metadata.orientation || "provider-native",
    orientationConfidence: metadata.orientationConfidence || "limited",
    filePlausibility:
      parsedVariantCount >= 100000
        ? "plausible full consumer export"
        : parsedVariantCount >= 1000
          ? "small or partial genotype export"
          : "fixture or partial file",
    validationStatus: limitations.length ? "limited" : "pass",
    limitations
  };
}

export function analyzeVariants(parsed, panel, pathwayModels = [], reportContext = {}) {
  const findings = [];
  const missing = [];
  const unknownGenotypes = [];
  const pathwayCounts = new Map();

  function pathwayEntry(pathway) {
    if (!pathwayCounts.has(pathway)) {
      pathwayCounts.set(pathway, {
        pathway,
        findingCount: 0,
        relevanceCounts: {},
        effectDirectionCounts: {},
        reviewStatusCounts: {}
      });
    }
    return pathwayCounts.get(pathway);
  }

  function addCount(target, key) {
    target[key] = (target[key] || 0) + 1;
  }

  function classifyEffectDirection(direction) {
    const value = String(direction || "").toLowerCase();
    if (value.includes("increase") || value.includes("higher") || value.includes("persistence")) {
      return "increased";
    }
    if (value.includes("decrease") || value.includes("lower")) {
      return "decreased";
    }
    if (value.includes("mixed")) {
      return "mixed";
    }
    return "uncertain";
  }

  function classifyRelevance(targetType, evidenceLevel, pathways) {
    const target = String(targetType || "").toLowerCase();
    const evidence = String(evidenceLevel || "").toLowerCase();
    const pathwayText = pathways.join(" ").toLowerCase();
    if (evidence.includes("clinical")) {
      return "clinical";
    }
    if (pathwayText.includes("caffeine") || pathwayText.includes("stimulant")) {
      return "metabolic context";
    }
    if (target.includes("biomarker") || evidence.includes("trait")) {
      return "trait";
    }
    return "metabolic context";
  }

  function classifyActionability(validationMarkers, direction) {
    const value = String(direction || "").toLowerCase();
    if (value.includes("clinical")) {
      return "discuss";
    }
    if (validationMarkers.length > 0) {
      return "confirm";
    }
    return "informational";
  }

  function classifyReviewStatus(evidenceLevel) {
    const value = String(evidenceLevel || "").toLowerCase();
    if (value.includes("curated") || value.includes("established")) {
      return "curated";
    }
    return "awaiting review";
  }

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

    const pathways =
      Array.isArray(variant.pathways) && variant.pathways.length
        ? variant.pathways
        : [variant.pathway || "Uncategorized"];
    const pathwayLabel = pathways.join(" / ");
    const targetType = effect.targetType || variant.targetType || "unknown";
    const evidenceLevel = variant.evidenceLevel || "unspecified";
    const validationMarkers = variant.validationMarkers || [];
    const effectDirection = classifyEffectDirection(effect.direction);
    const relevance = classifyRelevance(targetType, evidenceLevel, pathways);
    const actionability = classifyActionability(validationMarkers, effect.direction);
    const reviewStatus = classifyReviewStatus(evidenceLevel);
    const coverageConfidence = "directly observed";
    const scoring = buildVariantScoring(effect);

    for (const pathway of pathways) {
      const entry = pathwayEntry(pathway);
      entry.findingCount += 1;
      addCount(entry.relevanceCounts, relevance);
      addCount(entry.effectDirectionCounts, effectDirection);
      addCount(entry.reviewStatusCounts, reviewStatus);
    }

    findings.push({
      rsid: variant.rsid,
      gene: variant.gene,
      pathway: pathwayLabel,
      pathways,
      label: variant.label,
      aliases: variant.aliases || [],
      genotype,
      rawGenotype: parsedVariant.genotype,
      interpretation: cleanLegacyPlainText(effect.interpretation),
      direction: effect.direction || "neutral",
      effectDirection,
      relevance,
      actionability,
      reviewStatus,
      coverageConfidence,
      targetType,
      evidenceLevel,
      scoring,
      sourceLinks: variant.sourceLinks || [],
      limitations: (variant.limitations || []).map(cleanLegacyPlainText),
      validationMarkers
    });
  }

  findings.sort((a, b) =>
    b.sourceLinks.length - a.sourceLinks.length ||
    a.pathway.localeCompare(b.pathway) ||
    a.rsid.localeCompare(b.rsid)
  );

  const pathwaySummary = Array.from(pathwayCounts.values())
    .sort((a, b) => b.findingCount - a.findingCount || a.pathway.localeCompare(b.pathway));
  const presentPanelVariantCount = findings.length + unknownGenotypes.length;
  const coverage = {
    panelVariantCount: (panel.variants || []).length,
    presentPanelVariantCount,
    interpretedFindingCount: findings.length,
    missingPanelVariantCount: missing.length,
    uninterpretablePanelVariantCount: unknownGenotypes.length,
    directlyObservedFindingCount: findings.length
  };
  const validation = buildValidation(parsed, coverage);
  const pathwayScores = buildPathwayScores({ panel, parsed, findings, pathwayModels });

  return {
    applicationVersion: reportContext.applicationVersion || APPLICATION_VERSION,
    reportSchemaVersion: reportContext.reportSchemaVersion || REPORT_SCHEMA_VERSION,
    panelVersion: panel.version,
    panelSha256: reportContext.panelSha256 || null,
    pathwayModelVersions: pathwayModels.map(model => ({
      modelId: model.modelId,
      modelVersion: model.modelVersion,
      sha256: model.sha256 || model.__manifest?.sha256 || null,
      algorithmId: model.algorithm?.id || null,
      algorithmVersion: model.algorithm?.version || null,
      variantContributionModelVersion: model.variantContributionModelVersion || null
    })),
    generatedAt: new Date().toISOString(),
    metadata: parsed.metadata,
    validation,
    coverage,
    warnings: [
      ...parsed.warnings,
      ...validation.limitations,
      "Direct rsID/genotype matching only. No strand flipping, imputation, phasing, or genome-build liftover is performed.",
      "This report is informational and does not diagnose disease or recommend treatment."
    ],
    findings,
    missing,
    unknownGenotypes,
    pathwaySummary,
    pathwayScores
  };
}
