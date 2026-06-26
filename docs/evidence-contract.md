# Evidence and Report Contract

This document defines the direction for annotation packs and report output. It is stricter than the current `data/snp-panel.json` prototype and should guide future schema work.

## Evidence Rules

Every conclusion must be inspectable.

Every finding should include:

- Source.
- Evidence grade.
- Source release date.
- Genome build.
- Interpretation method.
- Known limitations.
- Pack version.
- Source licence.

Records without source links, limitations, and a known licence should not ship in a default pack.

## Source Policy

Default packs should prioritize sources that can be redistributed in an open-source self-hosted application.

ClinVar can provide clinical context, but ClinVar's own disclaimer must be represented in the UI: its website warns that the information is not intended for direct diagnostic use or medical decision-making without review by a genetics professional, and that individuals should not change health behavior solely on that information.

GWAS Catalog data can support trait associations, but records should be filtered and displayed with:

- Ancestry context.
- Sample size.
- Effect size.
- P-value.
- Replication context.
- Publication/source identifiers.

SNPedia-derived content should not be included in the default unrestricted pack. If supported later, make it an explicitly optional non-commercial add-on with clear licence gating.

## Evidence Grades and Scores

Use explicit evidence grades alongside transparent numeric scores.

Scores must never be opaque. Every numeric pathway score needs:

- A scoring model ID and version.
- A defined pathway axis.
- A visible formula.
- Variant-level contribution components.
- Evidence confidence.
- Signal strength.
- Coverage.
- Stability.
- Limitations.

Evidence grades describe the trustworthiness of the underlying claims. They do not replace pathway tendency scores.

Suggested initial scale:

| Grade | Meaning |
|---|---|
| Strong | Guideline, expert-reviewed, replicated, or clinically curated evidence with clear limitations. |
| Moderate | Multiple supporting sources or replicated associations, but not sufficient for clinical action. |
| Limited | Early, small, context-dependent, or weakly replicated evidence. |
| Conflicting | Credible sources disagree or classify the same variant differently. |
| Research | Plausible but experimental; disabled by default unless the user opts in. |

Actionability should be separate from evidence strength:

- Informational.
- Contextualize with symptoms, habits, labs, or medication list.
- Confirm with measured biomarkers.
- Confirm clinically before action.
- Not actionable.

## Report JSON Shape

The shared report schema should be deterministic and reusable by the browser, CLI, and local service.

Draft top-level shape:

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-06-22T00:00:00.000Z",
  "input": {
    "provider": "23andMe",
    "format": "raw-rsid-table",
    "detectedGenomeBuild": "GRCh37",
    "buildConfidence": "medium",
    "variantCount": 0,
    "noCallCount": 0,
    "duplicateCount": 0
  },
  "packs": [
    {
      "id": "core",
      "version": "0.1.0",
      "schemaVersion": "1.0.0",
      "sha256": "..."
    }
  ],
  "categories": [],
  "pathwayScores": [],
  "findings": [],
  "coverage": {},
  "warnings": []
}
```

Draft pathway score shape:

```json
{
  "pathwayId": "caffeine-clearance",
  "pathway": "Caffeine / stimulant sensitivity",
  "title": "Caffeine clearance tendency",
  "biologicalQuestion": "Do the explicitly supported variants favor faster or slower caffeine clearance?",
  "negativePole": "Tendency toward slower caffeine clearance",
  "positivePole": "Tendency toward faster caffeine clearance",
  "score": 70,
  "rawScore": 0.393,
  "numerator": 0.11,
  "denominator": 0.28,
  "scoringFormula": "50 + (50 * numerator / denominator)",
  "scoreLabel": "toward faster caffeine clearance",
  "scoreStatus": "provisional",
  "signalStrength": "weak",
  "evidenceQuality": "moderate",
  "evidenceWeight": 0.55,
  "directionalConsistency": "consistent_positive",
  "resultSupport": "low",
  "evidenceConflict": "none",
  "coverage": 0.5,
  "stability": "stable",
  "contributorDominance": {
    "label": "single-signal dominated",
    "topIndependentGroupPercent": 100
  },
  "leaveOneGroupOut": {
    "min": 50,
    "max": 50,
    "scores": []
  },
  "inputCount": 2,
  "observedVariantCount": 1,
  "independentSignalCount": 1,
  "modelId": "caffeine-clearance",
  "modelVersion": "0.2.0",
  "modelSha256": "...",
  "algorithmId": "group-capped-normalized-sum",
  "algorithmVersion": "1.0.0",
  "variantContributionModelVersion": "legacy-v0",
  "contributors": []
}
```

Draft finding shape:

```json
{
  "id": "core:cyp1a2-rs762551-ac",
  "category": "Metabolism and nutrition",
  "title": "Possible reduced caffeine clearance",
  "summary": "Your file contains CYP1A2 rs762551 AC.",
  "plainLanguageMeaning": "Some studies associate this genotype with intermediate caffeine metabolism.",
  "nextStep": "Compare caffeine timing with sleep quality.",
  "evidenceGrade": "Moderate",
  "actionability": "Contextualize with habits or biomarkers",
  "clinicalRelevance": "Informational",
  "effectDirection": "possible decrease",
  "replicationStatus": "replicated association",
  "coverageConfidence": "direct genotype match",
  "observed": {
    "rsid": "rs762551",
    "gene": "CYP1A2",
    "genotype": "AC",
    "rawGenotype": "AC",
    "orientation": "unknown",
    "genomeBuild": "GRCh37"
  },
  "technical": {
    "sourceRecord": "...",
    "studyOrGuideline": "...",
    "populationStudied": "...",
    "effectSize": "...",
    "conflictingEvidence": [],
    "limitations": []
  },
  "scoring": {
    "eligible": true,
    "direction": 1,
    "magnitude": 0.35,
    "certainty": 0.58,
    "contribution": 0.203,
    "formulaContribution": 0.203,
    "modelId": "metabobrief-variant-contribution",
    "modelVersion": "legacy-v0",
    "formula": "direction * magnitude * certainty"
  },
  "provenance": {
    "packId": "core",
    "packVersion": "0.1.0",
    "sourceReleaseDate": "2026-01-01",
    "sourceLicence": "..."
  }
}
```

## Pathway Model Shape

Pathway models should be machine-readable and separate from SNP annotations.

```text
models/
  pathway-model.schema.json
  manifest.json
  model-lock.json
  generated/
    methylation/
      0.1.0.json
    oxidative-stress/
      0.1.0.json
  caffeine-clearance/
    0.2.0.json
  caffeine-sensitivity/
    0.1.0.json
  archived/
    caffeine-response-legacy-v1.json
```

The generated starter models are built from `data/pathway-definitions.json` and the explicit genotype claims in `data/snp-panel.json`.

Each model defines:

- Biological axis.
- Included and excluded mechanisms.
- Explicit accepted rsIDs and claim IDs.
- Pathway-axis multiplier for each input.
- Mechanism or subpathway.
- Independence groups.
- Contribution states.
- Conservative and exploratory profile eligibility.
- Minimum coverage.
- Minimum independent signals.
- Minimum evidence quality.
- Algorithm ID and version.
- Compatible annotation-pack version.
- Interpretation bands.
- Limitations.

The runtime must not select model inputs implicitly by pathway label or target type.

## Pack Manifest Shape

Each pack should ship a manifest alongside shards:

```json
{
  "id": "core",
  "name": "MetaboBrief Core",
  "version": "0.1.0",
  "schemaVersion": "1.0.0",
  "buildDate": "2026-06-22",
  "sourceReleaseDates": {},
  "supportedGenomeBuilds": ["GRCh37", "GRCh38"],
  "licences": [],
  "sha256": "...",
  "shards": [],
  "evidenceGradingRules": "...",
  "build": {
    "repository": "https://github.com/otcan/metabo-brief",
    "commit": "...",
    "workflow": "..."
  }
}
```

## Validation Requirements

Every default-pack record must pass checks:

- Source resolves.
- Alleles and builds are explicit.
- Evidence grade is assigned.
- Language is understandable.
- Limitations are present.
- Licence is known.
- Tests cover expected genotypes.
- Contradictory interpretations are represented.

Unsupported builds, formats, alleles, and ambiguous orientations should fail visibly rather than being guessed.
