# Glucose regulation tendency

## Review status

- Status: reviewed
- Review level: starter-reviewed
- Reviewed at: 2026-06-26
- Checklist version: 1.0.0
- Release use: Informational genetic pathway tendency scoring only; not diagnostic, clinical, treatment, or population-percentile interpretation.

Starter-reviewed for release as an informational pathway tendency model. The model has explicit claim membership, pathway-axis text, contribution states, coverage thresholds, and limitations.

## Biological question

Do the curated SNP findings favor lower or higher modelled glucose-regulation burden?

## Score axis

- Negative pole: Lower modelled glucose-regulation burden
- Positive pole: Higher modelled glucose-regulation burden

## Included mechanisms

- Fasting glucose tendency
- insulin signalling context
- transport and secretion context

## Excluded mechanisms

- Measured glucose
- HbA1c
- diet
- body composition
- medication use
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
| rs10830963 | 3 | 1 | mtnr1b-biomarker-tendency | mtnr1b-biomarker-tendency | conservative, exploratory |
| rs1260326 | 3 | 1 | gckr-biomarker-tendency | gckr-biomarker-tendency | conservative, exploratory |
| rs13266634 | 3 | 1 | slc30a8-transport-activity | slc30a8-transport-activity | conservative, exploratory |
| rs1387153 | 3 | 1 | mtnr1b-biomarker-tendency | mtnr1b-biomarker-tendency | conservative, exploratory |
| rs1421085 | 3 | 1 | irx3-irx5-expression | irx3-irx5-expression | conservative, exploratory |
| rs5219 | 3 | 1 | kcnj11-transport-activity | kcnj11-transport-activity | exploratory |
| rs7578326 | 3 | 1 | irs1-expression | irs1-expression | exploratory |
| rs780094 | 3 | 1 | gckr-biomarker-tendency | gckr-biomarker-tendency | conservative, exploratory |
| rs7903146 | 3 | 1 | tcf7l2-biomarker-tendency | tcf7l2-biomarker-tendency | conservative, exploratory |

## Known weaknesses

- Generated from curated starter-panel pathway assignments and not yet expert-reviewed per variant mechanism.
- Axis mapping is starter-level and may need pathway-specific refinement before stronger claims.
- Direct rsID matching is used; genome build and strand normalization are not yet fail-closed.
- Measured biomarkers, medications, diet, symptoms, and clinical context are not included.

## Limitations

- This is a relative pathway tendency within the MetaboBrief starter model, not a population percentile.
- This model combines curated SNP contribution components assigned to this pathway; it does not measure current pathway activity.
- The current browser analyzer still performs direct provider-native rsID matching without build or strand normalization.
- Not included: Measured glucose, HbA1c, diet, body composition, medication use, clinical diagnosis.

## Versioning

- Model ID: glucose
- Model version: 0.1.0
- Schema version: 1.0.0
- Algorithm: group-capped-normalized-sum 1.0.0
- Variant contribution model: legacy-v0
- Compatible panel version: 0.3.0
