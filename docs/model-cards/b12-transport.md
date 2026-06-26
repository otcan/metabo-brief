# B12 transport tendency

## Review status

- Status: reviewed
- Review level: starter-reviewed
- Reviewed at: 2026-06-26
- Checklist version: 1.0.0
- Release use: Informational genetic pathway tendency scoring only; not diagnostic, clinical, treatment, or population-percentile interpretation.

Starter-reviewed for release as an informational pathway tendency model. The model has explicit claim membership, pathway-axis text, contribution states, coverage thresholds, and limitations.

## Biological question

Do the curated SNP findings favor lower or higher modelled B12 transport and handling demand?

## Score axis

- Negative pole: Lower modelled B12 transport constraint
- Positive pole: Higher modelled B12 transport constraint

## Included mechanisms

- B12 transport
- one-carbon cofactor context

## Excluded mechanisms

- Measured B12
- methylmalonic acid
- homocysteine
- dietary intake
- supplement use
- clinical deficiency diagnosis

## Model thresholds

- Minimum coverage: 0.25
- Minimum independent signals: 1
- Minimum evidence quality: 0.3
- Maximum group contribution: 0.5
- Default profile: conservative

## Inputs

| rsID | Claim count | Axis multiplier | Mechanism | Independence group | Profiles |
|---|---:|---:|---|---|---|
| rs1801131 | 3 | 1 | mthfr-enzyme-activity | mthfr-enzyme-activity | exploratory |
| rs1801133 | 3 | 1 | mthfr-enzyme-activity | mthfr-enzyme-activity | conservative, exploratory |

## Known weaknesses

- Generated from curated starter-panel pathway assignments and not yet expert-reviewed per variant mechanism.
- Axis mapping is starter-level and may need pathway-specific refinement before stronger claims.
- Direct rsID matching is used; genome build and strand normalization are not yet fail-closed.
- Measured biomarkers, medications, diet, symptoms, and clinical context are not included.

## Limitations

- This is a relative pathway tendency within the MetaboBrief starter model, not a population percentile.
- This model combines curated SNP contribution components assigned to this pathway; it does not measure current pathway activity.
- The current browser analyzer still performs direct provider-native rsID matching without build or strand normalization.
- Not included: Measured B12, methylmalonic acid, homocysteine, dietary intake, supplement use, clinical deficiency diagnosis.

## Versioning

- Model ID: b12-transport
- Model version: 0.1.0
- Schema version: 1.0.0
- Algorithm: group-capped-normalized-sum 1.0.0
- Variant contribution model: legacy-v0
- Compatible panel version: 0.3.0
