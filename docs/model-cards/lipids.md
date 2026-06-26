# Lipid handling tendency

## Review status

- Status: reviewed
- Review level: starter-reviewed
- Reviewed at: 2026-06-26
- Checklist version: 1.0.0
- Release use: Informational genetic pathway tendency scoring only; not diagnostic, clinical, treatment, or population-percentile interpretation.

Starter-reviewed for release as an informational pathway tendency model. The model has explicit claim membership, pathway-axis text, contribution states, coverage thresholds, and limitations.

## Biological question

Do the curated SNP findings favor lower or higher modelled lipid-handling burden?

## Score axis

- Negative pole: Lower modelled lipid-handling burden
- Positive pole: Higher modelled lipid-handling burden

## Included mechanisms

- Triglyceride context
- LDL and HDL context
- lipoprotein transport
- adiponectin context

## Excluded mechanisms

- Measured lipids
- diet
- body composition
- medication use
- cardiovascular diagnosis

## Model thresholds

- Minimum coverage: 0.25
- Minimum independent signals: 2
- Minimum evidence quality: 0.3
- Maximum group contribution: 0.5
- Default profile: conservative

## Inputs

| rsID | Claim count | Axis multiplier | Mechanism | Independence group | Profiles |
|---|---:|---:|---|---|---|
| rs429358 | 3 | 1 | apoe-biomarker-tendency | apoe-biomarker-tendency | conservative, exploratory |
| rs5882 | 3 | 1 | cetp-transport-activity | cetp-transport-activity | conservative, exploratory |
| rs688 | 3 | 1 | ldlr-transport-activity | ldlr-transport-activity | conservative, exploratory |
| rs708272 | 3 | 1 | cetp-transport-activity | cetp-transport-activity | conservative, exploratory |
| rs7412 | 3 | 1 | apoe-biomarker-tendency | apoe-biomarker-tendency | conservative, exploratory |

## Known weaknesses

- Generated from curated starter-panel pathway assignments and not yet expert-reviewed per variant mechanism.
- Axis mapping is starter-level and may need pathway-specific refinement before stronger claims.
- Direct rsID matching is used; genome build and strand normalization are not yet fail-closed.
- Measured biomarkers, medications, diet, symptoms, and clinical context are not included.

## Limitations

- This is a relative pathway tendency within the MetaboBrief starter model, not a population percentile.
- This model combines curated SNP contribution components assigned to this pathway; it does not measure current pathway activity.
- The current browser analyzer still performs direct provider-native rsID matching without build or strand normalization.
- Not included: Measured lipids, diet, body composition, medication use, cardiovascular diagnosis.

## Versioning

- Model ID: lipids
- Model version: 0.1.0
- Schema version: 1.0.0
- Algorithm: group-capped-normalized-sum 1.0.0
- Variant contribution model: legacy-v0
- Compatible panel version: 0.3.0
