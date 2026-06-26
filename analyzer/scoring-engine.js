export const VARIANT_SCORING_MODEL_ID = "metabobrief-variant-contribution";
export const VARIANT_SCORING_MODEL_VERSION = "legacy-v0";
export const ALGORITHM_ID = "group-capped-normalized-sum";
export const ALGORITHM_VERSION = "1.0.0";

const CONTRIBUTION_STATES = new Set([
  "scored",
  "supported_baseline",
  "insufficient_evidence",
  "unsupported_genotype",
  "excluded",
  "not_observed"
]);

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

function profileList(value) {
  return Array.isArray(value) && value.length ? value : ["conservative", "exploratory"];
}

function claimState(input, claimId) {
  const state = input.contributionStates?.[claimId] || "unsupported_genotype";
  return CONTRIBUTION_STATES.has(state) ? state : "unsupported_genotype";
}

function claimProfiles(input, claimId) {
  return profileList(input.profilesByClaimId?.[claimId] || input.profiles);
}

function variantByRsid(panel) {
  return new Map((panel.variants || []).map(variant => [normalizeRsid(variant.rsid), variant]));
}

function findingByRsid(findings) {
  return new Map(findings.map(finding => [normalizeRsid(finding.rsid), finding]));
}

function effectByClaimId(variant, claimId) {
  return Object.values(variant?.genotypes || {}).find(effect => effect.claimId === claimId) || null;
}

function inputClaimEffects(input, variant) {
  return (input.claimIds || [])
    .map(claimId => ({ claimId, effect: effectByClaimId(variant, claimId) }))
    .filter(item => item.effect);
}

function rawContributionFromEffect(effect) {
  return buildVariantScoring(effect).contribution;
}

function maxInputContribution(input, variant) {
  const weight = finiteNumber(input.modelWeight, 1);
  const axisMultiplier = finiteNumber(input.axisMultiplier, 1);
  return Math.max(
    0,
    ...inputClaimEffects(input, variant)
      .filter(({ claimId }) => ["scored", "supported_baseline"].includes(claimState(input, claimId)))
      .map(({ effect }) => Math.abs(rawContributionFromEffect(effect) * axisMultiplier * weight))
  );
}

function findObservedClaim(input, finding) {
  if (!finding?.scoring?.claimId) {
    return null;
  }
  return (input.claimIds || []).includes(finding.scoring.claimId) ? finding.scoring.claimId : null;
}

export function buildVariantScoring(effect = {}) {
  const hasExplicitComponents =
    Boolean(effect.claimId) &&
    effect.magnitude !== undefined &&
    effect.certainty !== undefined;
  const hasStoredContribution = hasExplicitComponents && Number.isFinite(Number(effect.score));
  const panelScore = hasStoredContribution ? finiteNumber(effect.score, 0) : 0;
  const magnitude = finiteNumber(effect.magnitude, 0);
  const certainty = finiteNumber(effect.certainty, 0);
  const direction = hasStoredContribution && panelScore !== 0
    ? Math.sign(panelScore)
    : numericDirectionFromText(effect.direction);
  const formulaContribution = round(direction * magnitude * certainty);

  return {
    claimId: effect.claimId || null,
    eligible: Boolean(effect.pathwayScoringEligible),
    direction,
    magnitude,
    certainty,
    contribution: round(Number.isFinite(Number(effect.score)) ? panelScore : formulaContribution),
    formulaContribution,
    legacyScore: hasExplicitComponents ? null : Number.isFinite(Number(effect.score)) ? Number(effect.score) : null,
    modelId: VARIANT_SCORING_MODEL_ID,
    modelVersion: VARIANT_SCORING_MODEL_VERSION,
    formula: "direction * magnitude * certainty"
  };
}

function scoreFromRaw(rawScore) {
  return Math.round(50 + (50 * clamp(rawScore, -1, 1)));
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

function labelEvidenceQuality(weight) {
  if (weight >= 0.75) {
    return "strong";
  }
  if (weight >= 0.5) {
    return "moderate";
  }
  if (weight > 0) {
    return "limited";
  }
  return "none";
}

function labelSignalStrength(signalLoad, independentSignalCount) {
  if (independentSignalCount >= 4 && signalLoad >= 0.55) {
    return "strong";
  }
  if (independentSignalCount >= 2 && signalLoad >= 0.25) {
    return "moderate";
  }
  if (independentSignalCount >= 1 && signalLoad > 0) {
    return "weak";
  }
  return "none";
}

function labelDirectionalConsistency(groupContributions) {
  const scored = groupContributions.filter(group => Math.abs(group.numerator) > 0);
  const hasPositive = scored.some(group => group.numerator > 0);
  const hasNegative = scored.some(group => group.numerator < 0);
  if (hasPositive && hasNegative) {
    return "mixed";
  }
  if (hasPositive) {
    return "consistent_positive";
  }
  if (hasNegative) {
    return "consistent_negative";
  }
  return "none";
}

function labelDominance(topShare, independentSignalCount) {
  if (!independentSignalCount) {
    return "none";
  }
  if (topShare >= 0.75 || independentSignalCount === 1) {
    return "single-signal dominated";
  }
  if (topShare >= 0.5) {
    return "moderately concentrated";
  }
  return "distributed";
}

function labelResultSupport({ coverage, independentSignalCount, topShare, denominatorContributorCount }) {
  if (!denominatorContributorCount) {
    return "insufficient";
  }
  if (coverage < 0.5 || independentSignalCount < 2 || topShare >= 0.75) {
    return "low";
  }
  if (coverage < 0.75 || independentSignalCount < 3 || topShare >= 0.5) {
    return "moderate";
  }
  return "high";
}

function contributorForInput({ input, variant, parsed, finding }) {
  const parsedVariant = parsed.variants.get(normalizeRsid(input.rsid));
  const modelWeight = finiteNumber(input.modelWeight, 1);
  const axisMultiplier = finiteNumber(input.axisMultiplier, 1);
  const maxContribution = maxInputContribution(input, variant);

  if (!parsedVariant) {
    return {
      rsid: input.rsid,
      gene: variant?.gene || input.gene || "unknown",
      genotype: "not observed",
      claimId: null,
      mechanism: input.mechanism,
      targetType: variant?.targetType || "unknown",
      contributionState: "not_observed",
      profiles: profileList(input.profiles),
      contribution: 0,
      rawContribution: 0,
      denominatorContribution: 0,
      direction: 0,
      magnitude: 0,
      certainty: 0,
      evidenceConflict: Boolean(input.evidenceConflict),
      modelWeight,
      axisMultiplier,
      maxContribution,
      independenceGroup: input.independenceGroup,
      inclusionRationale: input.inclusionRationale || ""
    };
  }

  const claimId = findObservedClaim(input, finding);
  if (!claimId) {
    return {
      rsid: input.rsid,
      gene: variant?.gene || input.gene || "unknown",
      genotype: finding?.genotype || parsedVariant.normalizedGenotype || "unsupported",
      claimId: finding?.scoring?.claimId || null,
      mechanism: input.mechanism,
      targetType: finding?.targetType || variant?.targetType || "unknown",
      contributionState: "unsupported_genotype",
      profiles: profileList(input.profiles),
      contribution: 0,
      rawContribution: finding?.scoring?.contribution || 0,
      denominatorContribution: 0,
      direction: finding?.scoring?.direction || 0,
      magnitude: finding?.scoring?.magnitude || 0,
      certainty: finding?.scoring?.certainty || 0,
      evidenceConflict: Boolean(input.evidenceConflict),
      modelWeight,
      axisMultiplier,
      maxContribution,
      independenceGroup: input.independenceGroup,
      inclusionRationale: input.inclusionRationale || ""
    };
  }

  const scoring = finding.scoring;
  const contributionState = claimState(input, claimId);
  const profiles = claimProfiles(input, claimId);
  const mappedContribution = round(scoring.contribution * axisMultiplier * modelWeight);
  const denominatorContribution = ["scored", "supported_baseline"].includes(contributionState)
    ? maxContribution
    : 0;

  return {
    rsid: input.rsid,
    gene: finding.gene || variant?.gene || input.gene || "unknown",
    genotype: finding.genotype,
    claimId,
    mechanism: input.mechanism,
    targetType: finding.targetType || variant?.targetType || "unknown",
    contributionState,
    profiles,
    contribution: contributionState === "scored" ? mappedContribution : 0,
    rawContribution: scoring.contribution,
    denominatorContribution,
    direction: scoring.direction,
    magnitude: scoring.magnitude,
    certainty: scoring.certainty,
    evidenceConflict: Boolean(input.evidenceConflict),
    modelWeight,
    axisMultiplier,
    maxContribution,
    independenceGroup: input.independenceGroup,
    inclusionRationale: input.inclusionRationale || ""
  };
}

function groupContributors(contributors, profile) {
  const groups = new Map();

  for (const contributor of contributors) {
    if (!contributor.profiles.includes(profile)) {
      continue;
    }
    if (!["scored", "supported_baseline"].includes(contributor.contributionState)) {
      continue;
    }

    if (!groups.has(contributor.independenceGroup)) {
      groups.set(contributor.independenceGroup, {
        independenceGroup: contributor.independenceGroup,
        numerator: 0,
        denominator: 0,
        certaintyWeight: 0,
        certaintyDenominator: 0,
        contributors: []
      });
    }

    const group = groups.get(contributor.independenceGroup);
    group.numerator += contributor.contribution;
    group.denominator += contributor.denominatorContribution;
    if (contributor.contributionState === "scored" && Math.abs(contributor.contribution) > 0) {
      group.certaintyWeight += contributor.certainty * Math.abs(contributor.contribution);
      group.certaintyDenominator += Math.abs(contributor.contribution);
    }
    group.contributors.push(contributor);
  }

  return Array.from(groups.values());
}

function summarizeProfile(contributors, model, profile, omitGroup = null) {
  const maximumGroupContribution = finiteNumber(model.maximumGroupContribution, Infinity);
  const groupContributions = groupContributors(contributors, profile)
    .filter(group => group.independenceGroup !== omitGroup)
    .map(group => {
      const denominator = Number.isFinite(maximumGroupContribution)
        ? Math.min(group.denominator, maximumGroupContribution)
        : group.denominator;
      return {
        ...group,
        denominator,
        numerator: clamp(group.numerator, -denominator, denominator)
      };
    });

  const numerator = groupContributions.reduce((total, group) => total + group.numerator, 0);
  const denominator = groupContributions.reduce((total, group) => total + group.denominator, 0);
  const certaintyWeight = groupContributions.reduce((total, group) => total + group.certaintyWeight, 0);
  const certaintyDenominator = groupContributions.reduce((total, group) => total + group.certaintyDenominator, 0);
  const rawScore = denominator > 0 ? clamp(numerator / denominator, -1, 1) : 0;
  const absByGroup = groupContributions.map(group => Math.abs(group.numerator)).filter(value => value > 0);
  const totalAbs = absByGroup.reduce((total, value) => total + value, 0);
  const topShare = totalAbs ? Math.max(...absByGroup) / totalAbs : 0;
  const independentSignalCount = absByGroup.length;
  const denominatorContributorCount = groupContributions.reduce(
    (total, group) => total + group.contributors.filter(contributor => contributor.denominatorContribution > 0).length,
    0
  );

  return {
    profile,
    rawScore,
    score: denominator > 0 ? scoreFromRaw(rawScore) : null,
    numerator: round(numerator),
    denominator: round(denominator),
    signalLoad: denominator > 0 ? clamp(Math.abs(numerator) / denominator, 0, 1) : 0,
    evidenceWeight: certaintyDenominator > 0 ? certaintyWeight / certaintyDenominator : 0,
    groupContributions,
    independentSignalCount,
    denominatorContributorCount,
    topShare
  };
}

function leaveOneGroupOut(profileSummary) {
  if (!profileSummary.groupContributions.length) {
    return {
      min: null,
      max: null,
      scores: []
    };
  }

  const scores = profileSummary.groupContributions.map(group => {
    const numerator = profileSummary.numerator - group.numerator;
    const denominator = profileSummary.denominator - group.denominator;
    const score = denominator > 0 ? scoreFromRaw(numerator / denominator) : 50;
    return {
      omittedGroup: group.independenceGroup,
      score
    };
  });

  return {
    min: Math.min(...scores.map(item => item.score)),
    max: Math.max(...scores.map(item => item.score)),
    scores
  };
}

function modelInputCount(model) {
  return (model.inputs || []).length;
}

export function scorePathwayModel({ panel, parsed, findings, model }) {
  const variants = variantByRsid(panel);
  const findingsByRsid = findingByRsid(findings);
  const contributors = (model.inputs || []).map(input => {
    const variant = variants.get(normalizeRsid(input.rsid));
    return contributorForInput({
      input,
      variant,
      parsed,
      finding: findingsByRsid.get(normalizeRsid(input.rsid))
    });
  });

  const defaultProfile = model.defaultProfile || "conservative";
  const conservative = summarizeProfile(contributors, model, "conservative");
  const exploratory = summarizeProfile(contributors, model, "exploratory");
  const selected = defaultProfile === "exploratory" ? exploratory : conservative;
  const inputCount = modelInputCount(model);
  const observedInputCount = contributors.filter(contributor => contributor.contributionState !== "not_observed").length;
  const interpretableInputCount = contributors.filter(contributor =>
    ["scored", "supported_baseline", "insufficient_evidence", "excluded"].includes(contributor.contributionState)
  ).length;
  const scoredContributorCount = contributors.filter(contributor =>
    contributor.profiles.includes(defaultProfile) && contributor.contributionState === "scored"
  ).length;
  const coverage = inputCount ? observedInputCount / inputCount : 0;
  const scoredCoverage = inputCount ? selected.denominatorContributorCount / inputCount : 0;
  const minimumCoverage = finiteNumber(model.minimumCoverage, 0);
  const minimumIndependentSignals = finiteNumber(model.minimumIndependentSignals, 1);
  const minimumEvidenceQuality = finiteNumber(model.minimumEvidenceQuality, 0);
  const evidenceQuality = labelEvidenceQuality(selected.evidenceWeight);
  const directionalConsistency = labelDirectionalConsistency(selected.groupContributions);
  const evidenceConflict = contributors.some(contributor => contributor.evidenceConflict) ? "present" : "none";
  const dominanceLabel = labelDominance(selected.topShare, selected.independentSignalCount);
  const resultSupport = labelResultSupport({
    coverage,
    independentSignalCount: selected.independentSignalCount,
    topShare: selected.topShare,
    denominatorContributorCount: selected.denominatorContributorCount
  });
  const passesThresholds =
    selected.score !== null &&
    coverage >= minimumCoverage &&
    selected.independentSignalCount >= minimumIndependentSignals &&
    selected.evidenceWeight >= minimumEvidenceQuality;
  const score = passesThresholds ? selected.score : null;
  const rawScore = passesThresholds ? round(selected.rawScore) : null;
  const loo = leaveOneGroupOut(selected);
  const stability = !passesThresholds
    ? "insufficient coverage"
    : conservative.score === null || exploratory.score === null || Math.abs(conservative.score - exploratory.score) > 10
      ? "sensitive to limited evidence"
      : "stable";

  return {
    schemaVersion: model.schemaVersion,
    modelId: model.modelId,
    modelVersion: model.modelVersion,
    algorithmId: model.algorithm?.id || ALGORITHM_ID,
    algorithmVersion: model.algorithm?.version || ALGORITHM_VERSION,
    variantContributionModelVersion: model.variantContributionModelVersion || VARIANT_SCORING_MODEL_VERSION,
    compatiblePanelVersion: model.compatiblePanelVersion,
    modelSha256: model.sha256 || model.__manifest?.sha256 || null,
    profileGroup: model.profileGroup || null,
    pathwayId: model.modelId,
    pathway: model.pathway,
    title: model.name || model.pathway,
    biologicalQuestion: model.biologicalQuestion,
    negativePole: model.negativePole,
    positivePole: model.positivePole,
    score,
    rawScore,
    numerator: passesThresholds ? round(selected.numerator) : round(selected.numerator),
    denominator: passesThresholds ? round(selected.denominator) : round(selected.denominator),
    scoringFormula: "50 + (50 * numerator / denominator)",
    scoreLabel: score === null ? "insufficient coverage to calculate" : interpretationForScore(score, model),
    scoreStatus: passesThresholds ? (resultSupport === "low" ? "provisional" : "calculated") : "insufficient_coverage",
    signalStrength: passesThresholds ? labelSignalStrength(selected.signalLoad, selected.independentSignalCount) : "insufficient",
    evidenceQuality,
    evidenceWeight: round(selected.evidenceWeight),
    evidenceConflict,
    directionalConsistency,
    resultSupport,
    coverage: round(coverage),
    scoredCoverage: round(scoredCoverage),
    stability,
    contributorDominance: {
      label: dominanceLabel,
      topIndependentGroupShare: round(selected.topShare),
      topIndependentGroupPercent: Math.round(selected.topShare * 100)
    },
    leaveOneGroupOut: loo,
    conservativeScore: conservative.score,
    exploratoryScore: exploratory.score,
    defaultProfile,
    inputCount,
    eligibleVariantCount: inputCount,
    observedVariantCount: observedInputCount,
    interpretableInputCount,
    denominatorContributorCount: selected.denominatorContributorCount,
    scoredVariantCount: scoredContributorCount,
    independentSignalCount: selected.independentSignalCount,
    minimums: {
      coverage: minimumCoverage,
      independentSignals: minimumIndependentSignals,
      evidenceQuality: minimumEvidenceQuality
    },
    maximumGroupContribution: Number.isFinite(finiteNumber(model.maximumGroupContribution, Infinity))
      ? finiteNumber(model.maximumGroupContribution)
      : null,
    contributors: contributors
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution) || a.rsid.localeCompare(b.rsid))
      .map(contributor => ({
        rsid: contributor.rsid,
        gene: contributor.gene,
        genotype: contributor.genotype,
        claimId: contributor.claimId,
        mechanism: contributor.mechanism,
        targetType: contributor.targetType,
        contributionState: contributor.contributionState,
        contribution: round(contributor.contribution),
        rawContribution: round(contributor.rawContribution),
        denominatorContribution: round(contributor.denominatorContribution),
        direction: contributor.direction,
        magnitude: contributor.magnitude,
        certainty: contributor.certainty,
        axisMultiplier: contributor.axisMultiplier,
        modelWeight: contributor.modelWeight,
        independenceGroup: contributor.independenceGroup,
        profiles: contributor.profiles,
        inclusionRationale: contributor.inclusionRationale
      })),
    missingVariantCount: contributors.filter(contributor => contributor.contributionState === "not_observed").length,
    limitations: model.limitations || []
  };
}

export function buildPathwayScores({ panel, parsed, findings, pathwayModels = [] }) {
  return pathwayModels
    .filter(model => model && model.modelId)
    .map(model => scorePathwayModel({ panel, parsed, findings, model }))
    .sort((a, b) => {
      if (a.score === null && b.score !== null) return 1;
      if (a.score !== null && b.score === null) return -1;
      return (b.score || 0) - (a.score || 0) || a.title.localeCompare(b.title);
    });
}
