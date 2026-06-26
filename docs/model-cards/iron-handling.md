# Iron handling tendency

## Review status

- Status: reviewed
- Review level: starter-reviewed
- Reviewed at: 2026-06-26
- Checklist version: 1.0.0
- Release use: Informational genetic pathway tendency scoring only; not diagnostic, clinical, treatment, or population-percentile interpretation.

Starter-reviewed for release as an informational pathway tendency model. The model has explicit claim membership, pathway-axis text, contribution states, coverage thresholds, and limitations.

## Biological question

Do the curated SNP findings favor lower or higher modelled iron-handling burden?

## Score axis

- Negative pole: Lower modelled iron-handling burden
- Positive pole: Higher modelled iron-handling burden

## Included mechanisms

- Iron transport
- storage tendency
- inflammation-linked iron context

## Excluded mechanisms

- Ferritin
- transferrin saturation
- CBC
- diet
- blood donation
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
| rs1799852 | 6 | 1 | tf-biomarker-tendency | tf-biomarker-tendency | conservative, exploratory |
| rs1799945 | 3 | 1 | hfe-biomarker-tendency | hfe-biomarker-tendency | conservative, exploratory |
| rs1800562 | 3 | 1 | hfe-biomarker-tendency | hfe-biomarker-tendency | conservative, exploratory |
| rs3811647 | 6 | 1 | tf-biomarker-tendency | tf-biomarker-tendency | conservative, exploratory |
| rs4820268 | 10 | 1 | tmprss6-biomarker-tendency | tmprss6-biomarker-tendency | conservative, exploratory |
| rs7385804 | 6 | 1 | tfr2-biomarker-tendency | tfr2-biomarker-tendency | conservative, exploratory |
| rs855791 | 10 | 1 | tmprss6-biomarker-tendency | tmprss6-biomarker-tendency | conservative, exploratory |

## Known weaknesses

- Generated from curated starter-panel pathway assignments and not yet expert-reviewed per variant mechanism.
- Axis mapping is starter-level and may need pathway-specific refinement before stronger claims.
- Direct rsID matching is used; genome build and strand normalization are not yet fail-closed.
- Measured biomarkers, medications, diet, symptoms, and clinical context are not included.

## Limitations

- This is a relative pathway tendency within the MetaboBrief starter model, not a population percentile.
- This model combines curated SNP contribution components assigned to this pathway; it does not measure current pathway activity.
- The current browser analyzer still performs direct provider-native rsID matching without build or strand normalization.
- Not included: Ferritin, transferrin saturation, CBC, diet, blood donation, clinical diagnosis.

## Versioning

- Model ID: iron-handling
- Model version: 0.1.0
- Schema version: 1.0.0
- Algorithm: group-capped-normalized-sum 1.0.0
- Variant contribution model: legacy-v0
- Compatible panel version: 0.3.0
