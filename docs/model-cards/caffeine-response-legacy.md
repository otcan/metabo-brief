# Caffeine response legacy tendency

## Review status

- Status: archived
- Review level: not reviewed
- Reviewed at: not reviewed
- Checklist version: not specified
- Release use: Informational use only.

No review note listed.

## Biological question

Archived broad caffeine and stimulant response score preserved for reproducibility of reports created before the caffeine model split.

## Score axis

- Negative pole: Tendency toward slower clearance or stronger stimulant sensitivity
- Positive pole: Tendency toward faster clearance or lower stimulant sensitivity

## Included mechanisms

- NAT2 acetylation context
- CYP1A2 regulatory context
- ADORA2A response context
- COMT response context
- UGT1A1 proxy context

## Excluded mechanisms

- Current caffeine intake
- Smoking status
- Pregnancy
- Medication interactions
- Liver function
- Measured caffeine clearance

## Model thresholds

- Minimum coverage: 0.2
- Minimum independent signals: 1
- Minimum evidence quality: 0.3
- Maximum group contribution: 0.5
- Default profile: exploratory

## Inputs

| rsID | Claim count | Axis multiplier | Mechanism | Independence group | Profiles |
|---|---:|---:|---|---|---|
| rs1799930 | 10 | 1 | nat2-acetylation-context | nat2-slow-acetylation | exploratory |
| rs1799931 | 3 | 1 | nat2-acetylation-context | nat2-slow-acetylation | exploratory |
| rs4680 | 3 | 1 | comt-stimulant-context | comt-stimulant-context | exploratory |
| rs5751876 | 3 | 1 | adora2a-sensitivity | adora2a-sensitivity | exploratory |
| rs762551 | 3 | 1 | cyp1a2-ahr-axis | cyp1a2-ahr-axis | exploratory |
| rs8175347 | 3 | 1 | ugt1a1-clearance-context | ugt1a1-clearance-context | exploratory |
| rs887829 | 3 | 1 | ugt1a1-clearance-context | ugt1a1-clearance-context | exploratory |

## Known weaknesses

- Not specified.

## Limitations

- Archived broad caffeine-response model retained only to reproduce earlier reports.
- This model mixes clearance, sensitivity, NAT2, COMT, ADORA2A, and UGT1A1 context and should not be used as the current default.
- The current browser analyzer still performs direct provider-native rsID matching without build or strand normalization.

## Versioning

- Model ID: caffeine-response-legacy
- Model version: 1.0.0
- Schema version: 1.0.0
- Algorithm: group-capped-normalized-sum 1.0.0
- Variant contribution model: legacy-v0
- Compatible panel version: 0.3.0
