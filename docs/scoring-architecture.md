# Scoring Architecture

MetaboBrief is a pathway-scoring engine, not only a SNP lookup table.

The score represents:

> A modelled genetic tendency within a defined biological pathway, based on the variants present in the uploaded file and the evidence available in the installed annotation pack.

The score does not represent:

- A diagnosis.
- A disease-risk percentage.
- A measurement of current enzyme activity.
- A substitute for biomarkers.
- A prediction that an outcome will happen.
- A population percentile.

## Output Contract

Every scoreable pathway should expose four separate measurements:

1. Pathway tendency score.
2. Signal strength.
3. Evidence confidence.
4. Coverage.

Coverage must not be hidden inside the score. Missing variants are not treated as neutral genotypes.

## Variant Contribution

The legacy variant model is preserved as:

```text
modelId: metabobrief-pathway
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
- `pathwayScoringEligible` determines whether the finding contributes to a pathway score.

The current panel's stored `score` value is preserved as the legacy contribution. Recalculated `direction * magnitude * certainty` is retained as `formulaContribution` so scores can be audited.

## Pathway Score

The first pathway model uses:

```text
pathway raw score =
  sum of observed eligible grouped contributions
  /
  sum of observed eligible grouped maximum contribution weights

pathway index =
  50 + (50 * pathway raw score)
```

Interpretation:

- `50` means no strong directional tendency from the observed model inputs.
- Below `50` moves toward the pathway model's negative pole.
- Above `50` moves toward the pathway model's positive pole.

The exact poles are defined per pathway model. A high score is not automatically good or bad.

## Current Reference Model

The first machine-readable model is:

- `models/caffeine-clearance.json`
- `pathwayId: caffeine-clearance`
- `modelVersion: metabobrief-pathway-v1`

It defines:

- Biological question.
- Negative and positive poles.
- Included and excluded mechanisms.
- Eligible target types.
- Minimum coverage and signal thresholds.
- Conservative evidence floor.
- Independence groups.
- Interpretation bands.
- Limitations.

## Signal Strength

Signal strength describes how much directional genetic signal was available after model filtering:

- Weak.
- Moderate.
- Strong.

This is separate from the score. A pathway can have a high score but weak signal if it is driven by one counted independent signal.

## Evidence Confidence

Evidence confidence describes the underlying evidence weight:

- Strong.
- Moderate.
- Limited.
- Conflicting.

The report keeps the human-readable confidence label and the numerical evidence weight together.

## Stability

The scoring engine calculates:

- Conservative profile: only evidence at or above the model's evidence floor.
- Exploratory profile: all enabled evidence.

If the profiles diverge materially, the pathway is marked `sensitive to limited evidence`.

## Missing Data Rules

Each eligible model locus receives one status:

- Observed and scored.
- Observed but neutral.
- Observed but unsupported.
- Excluded by scoring model.
- Not tested.

Missing variants are counted in coverage. They are not scored as zero.

## No Global Score

MetaboBrief should not produce a global health score. The product output is a pathway profile with inspectable, reproducible pathway tendency scores.
