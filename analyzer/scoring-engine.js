export const VARIANT_SCORING_MODEL_ID = "metabobrief-pathway";
export const VARIANT_SCORING_MODEL_VERSION = "legacy-v0";
export const PATHWAY_SCORING_MODEL_ID = "metabobrief-pathway";
export const PATHWAY_SCORING_MODEL_VERSION = "metabobrief-pathway-v1";

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRsid(value) {
  return String(value || "").trim().toLowerCase();
}

function variantPathways(variant) {
  return Array.isArray(variant.pathways) && variant.pathways.length
    ? variant.pathways
    : [variant.pathway || "Uncategorized"];
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

export function buildVariantScoring(effect = {}) {
  const panelScore = finiteNumber(effect.score, 0);
  const magnitude = finiteNumber(effect.magnitude, 0);
  const certainty = finiteNumber(effect.certainty, 0);
  const direction = panelScore !== 0 ? Math.sign(panelScore) : numericDirectionFromText(effect.direction);
  const formulaContribution = round(direction * magnitude * certainty);

  return {
    eligible: Boolean(effect.pathwayScoringEligible),
    direction,
    magnitude,
    certainty,
    contribution: round(Number.isFinite(Number(effect.score)) ? panelScore : formulaContribution),
    formulaContribution,
    modelId: VARIANT_SCORING_MODEL_ID,
    modelVersion: VARIANT_SCORING_MODEL_VERSION,
    formula: "direction * magnitude * certainty"
  };
}

function variantMatchesModel(variant, model) {
  const sourcePathways = model.sourcePathways || [model.pathway].filter(Boolean);
  const pathwayMatch = variantPathways(variant).some(pathway => sourcePathways.includes(pathway));
  if (!pathwayMatch) {
    return false;
  }

  if (!Array.isArray(model.eligibleTargetTypes) || !model.eligibleTargetTypes.length) {
    return true;
  }

  return model.eligibleTargetTypes.includes(variant.targetType || "unknown");
}

function hasEligibleGenotype(variant) {
  return Object.values(variant.genotypes || {}).some(effect => buildVariantScoring(effect).eligible);
}

function maxEligibleContribution(variant) {
  return Math.max(
    0,
    ...Object.values(variant.genotypes || {})
      .filter(effect => buildVariantScoring(effect).eligible)
      .map(effect => Math.abs(buildVariantScoring(effect).contribution))
  );
}

function groupForVariant(variant, model) {
  const rsid = normalizeRsid(variant.rsid);
  for (const [groupId, members] of Object.entries(model.independenceGroups || {})) {
    if ((members || []).map(normalizeRsid).includes(rsid)) {
      return groupId;
    }
  }
  return `${variant.gene || "unknown"}:${variant.rsid}`;
}

function labelEvidenceConfidence(weight, hasOpposingSignals) {
  if (hasOpposingSignals) {
    return "conflicting";
  }
  if (weight >= 0.75) {
    return "strong";
  }
  if (weight >= 0.5) {
    return "moderate";
  }
  return "limited";
}

function labelSignalStrength(signalLoad, independentSignalCount) {
  if (independentSignalCount >= 4 && signalLoad >= 0.55) {
    return "strong";
  }
  if (independentSignalCount >= 2 && signalLoad >= 0.25) {
    return "moderate";
  }
  return "weak";
}

function interpretationForScore(score, model) {
  const bands = model.interpretationBands || [];
  const band = bands.find(item => score >= item.min && score <= item.max);
  if (band) {
    return band.label;
  }
  if (score < 45) {
    return `toward ${model.negativePole || "the negative pole"}`;
  }
  if (score > 55) {
    return `toward ${model.positivePole || "the positive pole"}`;
  }
  return "near the model midpoint";
}

function summarizeGroupedContributions(contributors, model, evidenceFloor = 0) {
  const groups = new Map();

  for (const contributor of contributors) {
    if (contributor.scoring.certainty < evidenceFloor) {
      continue;
    }

    if (!groups.has(contributor.independenceGroup)) {
      groups.set(contributor.independenceGroup, {
        contribution: 0,
        denominator: 0,
        certaintyWeight: 0,
        certaintyDenominator: 0,
        contributors: []
      });
    }

    const group = groups.get(contributor.independenceGroup);
    const maxContribution = Math.abs(contributor.maxContribution);
    group.contribution += contributor.scoring.eligible ? contributor.scoring.contribution : 0;
    group.denominator += maxContribution;
    if (contributor.scoring.eligible) {
      group.certaintyWeight += contributor.scoring.certainty * Math.abs(contributor.scoring.contribution);
      group.certaintyDenominator += Math.abs(contributor.scoring.contribution);
    }
    group.contributors.push(contributor);
  }

  let numerator = 0;
  let denominator = 0;
  let certaintyWeight = 0;
  let certaintyDenominator = 0;
  const maximumGroupContribution = finiteNumber(model.maximumGroupContribution, Infinity);

  for (const group of groups.values()) {
    const groupCap = Number.isFinite(maximumGroupContribution)
      ? Math.min(group.denominator, maximumGroupContribution)
      : group.denominator;
    numerator += clamp(group.contribution, -groupCap, groupCap);
    denominator += groupCap;
    certaintyWeight += group.certaintyWeight;
    certaintyDenominator += group.certaintyDenominator;
  }

  const rawScore = denominator > 0 ? clamp(numerator / denominator, -1, 1) : 0;
  return {
    rawScore,
    score: denominator > 0 ? Math.round(50 + (50 * rawScore)) : null,
    signalLoad: denominator > 0 ? clamp(Math.abs(numerator) / denominator, 0, 1) : 0,
    evidenceWeight: certaintyDenominator > 0 ? certaintyWeight / certaintyDenominator : 0
  };
}

export function scorePathwayModel({ panel, parsed, findings, model }) {
  const eligibleVariants = (panel.variants || []).filter(variant =>
    variantMatchesModel(variant, model) && hasEligibleGenotype(variant)
  );
  const eligibleByRsid = new Map(eligibleVariants.map(variant => [normalizeRsid(variant.rsid), variant]));
  const findingByRsid = new Map(findings.map(finding => [normalizeRsid(finding.rsid), finding]));
  const observedEligible = eligibleVariants.filter(variant => parsed.variants.has(normalizeRsid(variant.rsid)));

  const contributors = observedEligible.map(variant => {
    const finding = findingByRsid.get(normalizeRsid(variant.rsid));
    const scoring = finding?.scoring || buildVariantScoring({});
    const group = groupForVariant(variant, model);
    const countedContribution = scoring.eligible ? scoring.contribution : 0;
    return {
      rsid: variant.rsid,
      gene: variant.gene,
      genotype: finding?.genotype || parsed.variants.get(normalizeRsid(variant.rsid))?.normalizedGenotype || "unsupported",
      targetType: finding?.targetType || variant.targetType || "unknown",
      scoring,
      countedContribution,
      maxContribution: maxEligibleContribution(variant),
      independenceGroup: group,
      status: finding
        ? scoring.eligible
          ? "observed and scored"
          : scoring.contribution === 0
            ? "observed but neutral"
            : "excluded by scoring model"
        : "observed but unsupported"
    };
  });

  const scoredContributors = contributors.filter(contributor => contributor.scoring.eligible);
  const exploratory = summarizeGroupedContributions(contributors, model, 0);
  const conservative = summarizeGroupedContributions(contributors, model, finiteNumber(model.conservativeEvidenceFloor, 0.5));
  const coverage = eligibleVariants.length ? observedEligible.length / eligibleVariants.length : 0;
  const independentSignalCount = new Set(scoredContributors.map(contributor => contributor.independenceGroup)).size;
  const hasPositive = scoredContributors.some(contributor => contributor.scoring.contribution > 0);
  const hasNegative = scoredContributors.some(contributor => contributor.scoring.contribution < 0);
  const hasOpposingSignals = hasPositive && hasNegative;
  const minimumCoverage = finiteNumber(model.minimumCoverage, 0);
  const minimumIndependentSignals = finiteNumber(model.minimumIndependentSignals, 1);
  const minimumEvidenceWeight = finiteNumber(model.minimumEvidenceWeight, 0);
  const passesThresholds =
    eligibleVariants.length > 0 &&
    coverage >= minimumCoverage &&
    independentSignalCount >= minimumIndependentSignals &&
    exploratory.evidenceWeight >= minimumEvidenceWeight &&
    exploratory.score !== null;
  const score = passesThresholds ? exploratory.score : null;
  const rawScore = passesThresholds ? round(exploratory.rawScore) : null;
  const conservativeScore = conservative.score;
  const stability = !passesThresholds
    ? "insufficient coverage"
    : conservativeScore === null || Math.abs(conservativeScore - exploratory.score) > 10
      ? "sensitive to limited evidence"
      : "stable";

  return {
    pathwayId: model.pathwayId,
    pathway: model.pathway,
    title: model.name || model.pathway,
    biologicalQuestion: model.biologicalQuestion,
    negativePole: model.negativePole,
    positivePole: model.positivePole,
    score,
    rawScore,
    scoreLabel: score === null ? "insufficient coverage to calculate" : interpretationForScore(score, model),
    scoreStatus: passesThresholds ? "calculated" : "insufficient_coverage",
    signalStrength: passesThresholds ? labelSignalStrength(exploratory.signalLoad, independentSignalCount) : "insufficient",
    evidenceConfidence: passesThresholds ? labelEvidenceConfidence(exploratory.evidenceWeight, hasOpposingSignals) : "limited",
    evidenceWeight: round(exploratory.evidenceWeight),
    coverage: round(coverage),
    stability,
    conservativeScore: passesThresholds ? conservativeScore : null,
    exploratoryScore: passesThresholds ? exploratory.score : null,
    eligibleVariantCount: eligibleVariants.length,
    observedVariantCount: observedEligible.length,
    scoredVariantCount: scoredContributors.length,
    independentSignalCount,
    modelId: PATHWAY_SCORING_MODEL_ID,
    modelVersion: model.modelVersion || PATHWAY_SCORING_MODEL_VERSION,
    variantModelVersion: VARIANT_SCORING_MODEL_VERSION,
    minimums: {
      coverage: minimumCoverage,
      independentSignals: minimumIndependentSignals,
      evidenceWeight: minimumEvidenceWeight
    },
    contributors: contributors
      .sort((a, b) => Math.abs(b.scoring.contribution) - Math.abs(a.scoring.contribution))
      .map(contributor => ({
        rsid: contributor.rsid,
        gene: contributor.gene,
        genotype: contributor.genotype,
        targetType: contributor.targetType,
        contribution: contributor.countedContribution,
        rawContribution: contributor.scoring.contribution,
        direction: contributor.scoring.direction,
        magnitude: contributor.scoring.magnitude,
        certainty: contributor.scoring.certainty,
        independenceGroup: contributor.independenceGroup,
        status: contributor.status
      })),
    missingVariantCount: eligibleVariants.length - observedEligible.length,
    limitations: model.limitations || []
  };
}

export function buildPathwayScores({ panel, parsed, findings, pathwayModels = [] }) {
  return pathwayModels
    .filter(model => model && model.pathwayId)
    .map(model => scorePathwayModel({ panel, parsed, findings, model }))
    .sort((a, b) => {
      if (a.score === null && b.score !== null) return 1;
      if (a.score !== null && b.score === null) return -1;
      return (b.score || 0) - (a.score || 0) || a.title.localeCompare(b.title);
    });
}
