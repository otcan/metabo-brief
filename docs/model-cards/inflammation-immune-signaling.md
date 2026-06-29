# Inflammation and immune signalling tendency

## Review status

- Status: reviewed
- Review level: starter-reviewed
- Reviewed at: 2026-06-26
- Checklist version: 1.0.0
- Release use: Informational genetic pathway tendency scoring only; not diagnostic, clinical, treatment, or population-percentile interpretation.

Starter-reviewed for release as an informational pathway tendency model. The model has explicit claim membership, pathway-axis text, contribution states, coverage thresholds, and limitations.

## Biological question

Do the curated SNP findings favor lower or higher modelled inflammatory signalling burden?

## Score axis

- Negative pole: Lower modelled inflammatory signalling burden
- Positive pole: Higher modelled inflammatory signalling burden

## Included mechanisms

- Cytokine signalling
- CRP tendency
- NF-kB context
- oxidative immune context

## Excluded mechanisms

- Measured CRP
- infection status
- autoimmune diagnosis
- medications
- clinical diagnosis

## Model thresholds

- Minimum coverage: 0.25
- Minimum independent signals: 2
- Minimum evidence quality: 0.3
- Maximum group contribution: 0.5
- Default profile: conservative

## Inputs

| rsID | Claim count | Axis multiplier | Mechanism | Independence group | Profiles |
|---|---:|---:|---|---|---|
| rs1205 | 3 | 1 | crp-biomarker-tendency | crp-biomarker-tendency | conservative, exploratory |
| rs4648068 | 3 | 1 | nfkb1-expression | nfkb1-expression | conservative, exploratory |

## Known weaknesses

- Generated from curated starter-panel pathway assignments and not yet expert-reviewed per variant mechanism.
- Axis mapping is starter-level and may need pathway-specific refinement before stronger claims.
- Direct rsID matching is scoreability-gated, but coordinate validation and strand normalization are not yet performed.
- Measured biomarkers, medications, diet, symptoms, and clinical context are not included.

## Limitations

- This is a relative pathway tendency within the MetaboBrief starter model, not a population percentile.
- This model combines curated SNP contribution components assigned to this pathway; it does not measure current pathway activity.
- The current browser analyzer scoreability-gates direct provider-native rsID matching but still does not perform coordinate validation or strand normalization.
- Not included: Measured CRP, infection status, autoimmune diagnosis, medications, clinical diagnosis.

## Versioning

- Model ID: inflammation-immune-signaling
- Model version: 0.1.0
- Schema version: 1.0.0
- Algorithm: group-capped-normalized-sum 1.0.0
- Variant contribution model: legacy-v0
- Compatible panel version: 0.3.0
