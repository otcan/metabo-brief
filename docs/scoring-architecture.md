# Scoring Architecture

MetaboBrief is a pathway-scoring engine, not only a SNP lookup table.

The score represents:

> A modelled genetic tendency within a defined biological pathway, based on explicitly listed model inputs, the variants present in the uploaded file, and the evidence available in the installed annotation pack.

The score does not represent:

- A diagnosis.
- A disease-risk percentage.
- A measurement of current enzyme activity.
- A substitute for biomarkers.
- A prediction that an outcome will happen.
- A population percentile.

## Output Contract

Every scoreable pathway exposes separate measurements:

- Pathway tendency score.
- Signal strength.
- Evidence quality.
- Directional consistency.
- Result support.
- Evidence conflict.
- Coverage.
- Contributor dominance.
- Leave-one-group-out sensitivity.
- Stability.

Coverage is not hidden inside the score. Missing variants are not treated as neutral genotypes.

## Variant Contribution

The legacy variant contribution model is preserved as:

```text
modelId: metabobrief-variant-contribution
modelVersion: legacy-v0
```

Formula:

```text
variant contribution = direction * magnitude * certainty
```

Where:

- `direction` is `-1`, `0`, or `+1`.
- `magnitude` is the normalized estimated biological effect.
- `certainty` is the evidence-derived weight.
- `pathwayScoringEligible` describes whether the panel claim can be used by a pathway model.

Only records with explicit scoring components and a claim ID produce a numeric contribution. Older attention-style fields are kept as legacy data and do not enter pathway scoring.

## Explicit Model Membership

A panel claim does not enter a score because its pathway label happens to match a model. Each model must list every accepted input:

```json
{
  "rsid": "rs762551",
  "claimIds": [
    "rs762551_AA_enzyme_activity",
    "rs762551_AC_enzyme_activity",
    "rs762551_CC_enzyme_activity"
  ],
  "axisMultiplier": 1,
  "mechanism": "cyp1a2-clearance",
  "independenceGroup": "cyp1a2-clearance",
  "modelWeight": 1,
  "profiles": ["conservative", "exploratory"],
  "inclusionRationale": "CYP1A2 is the primary caffeine clearance gene represented in the starter panel."
}
```

`axisMultiplier` maps the variant contribution onto the model's biological pole. This prevents an expression, activity, biomarker, or sensitivity effect from being silently treated as the same direction.

The current model files are loaded through `models/manifest.json`:

- `models/caffeine-clearance/0.2.0.json`
- `models/caffeine-sensitivity/0.1.0.json`
- `models/generated/*/0.1.0.json`
- `models/archived/caffeine-response-legacy-v1.json`

The generated starter models cover every current non-caffeine panel pathway family using the axes in `data/pathway-definitions.json`. They are explicit model files, not runtime label matching. The archived caffeine-response model is not enabled by default. It preserves old broad-score reproducibility after the split into clearance and sensitivity.

Default-enabled pathway models are marked `reviewed` with `starter-reviewed` review level and a model card under `docs/model-cards/`. That status means the model has explicit inputs, axes, contribution states, thresholds, and limitations suitable for an informational release. It does not mean expert clinical review or population calibration.

## Contribution States

Each model input resolves to one runtime state:

- `scored`: observed, supported, and contributes to numerator and denominator.
- `supported_baseline`: observed and explicitly modelled as baseline; contributes to denominator only.
- `insufficient_evidence`: observed but not trusted enough for this model; contributes to neither numerator nor denominator.
- `unsupported_genotype`: observed genotype is not one of the model's accepted claim IDs; contributes to neither numerator nor denominator.
- `excluded`: observed and intentionally excluded; contributes to neither numerator nor denominator.
- `not_observed`: model input was not present in the uploaded file; contributes to coverage only.

Only `scored` and `supported_baseline` enter the denominator. No directional evidence is not the same thing as biological neutrality.

## Pathway Score

The current algorithm is:

```text
algorithmId: group-capped-normalized-sum
algorithmVersion: 1.0.0

pathway raw score =
  sum of scored grouped contributions
  /
  sum of scored-or-baseline grouped maximum contribution weights

pathway index =
  50 + (50 * pathway raw score)
```

Interpretation:

- `50` means no directional tendency from the observed, denominator-eligible inputs.
- Below `50` moves toward the pathway model's negative pole.
- Above `50` moves toward the pathway model's positive pole.

The exact poles are defined per pathway model. A high score is not automatically good or bad.

## Trust Metrics

MetaboBrief separates concepts that are often collapsed:

- Evidence quality: how strong the supporting research is.
- Directional consistency: whether scored contributors point in the same direction.
- Result support: coverage, independent signals, and contributor dominance.
- Evidence conflict: explicit disagreement between sources or curated claims.

Opposing biological contributions can make directional consistency `mixed` without making the evidence itself conflicting.

## Sensitivity Metrics

Contributor dominance reports how concentrated the directional signal is:

- `distributed`
- `moderately concentrated`
- `single-signal dominated`

Leave-one-group-out sensitivity recalculates the score after removing each independence group. It is not a statistical confidence interval; it shows whether one genetic signal dominates the displayed score.

## Version Contract

Reports keep these versions separately:

- `reportSchemaVersion`
- `applicationVersion`
- `panelVersion`
- `panelSha256`
- `modelId`
- `modelVersion`
- `modelSha256`
- `algorithmId`
- `algorithmVersion`
- `variantContributionModelVersion`
- `modelStatus`
- `reviewLevel`
- `modelCard`

The model manifest also records the starter annotation-pack checksum and pathway-definition checksum. CI validates model checksums, model-lock entries, explicit claim membership, interpretation bands, panel compatibility, definition drift, review metadata, model-card presence, and scoring invariants.

## No Global Score

MetaboBrief should not produce a global health score. The product output is a pathway profile with inspectable, reconstructable pathway tendency scores.
