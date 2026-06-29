# Caffeine clearance tendency

## Review status

- Status: reviewed
- Review level: starter-reviewed
- Reviewed at: 2026-06-26
- Checklist version: 1.0.0
- Release use: Informational genetic pathway tendency scoring only; not diagnostic, clinical, treatment, or population-percentile interpretation.

Starter-reviewed for release as an informational caffeine-clearance tendency model with explicit CYP1A2/AHR membership, axis mapping, contribution states, and limitations.

## Biological question

Do the explicitly supported variants favor faster or slower caffeine clearance?

## Score axis

- Negative pole: Tendency toward slower caffeine clearance
- Positive pole: Tendency toward faster caffeine clearance

## Included mechanisms

- CYP1A2 caffeine metabolism activity
- Documented CYP1A2 regulatory context

## Excluded mechanisms

- Current caffeine intake
- Smoking status
- Pregnancy
- Medication interactions
- Liver function
- Measured caffeine clearance
- Experiential stimulant sensitivity

## Model thresholds

- Minimum coverage: 0.4
- Minimum independent signals: 1
- Minimum evidence quality: 0.3
- Maximum group contribution: 0.5
- Default profile: conservative

## Inputs

| rsID | Claim count | Axis multiplier | Mechanism | Independence group | Profiles |
|---|---:|---:|---|---|---|
| rs762551 | 3 | 1 | cyp1a2-clearance | cyp1a2-clearance | conservative, exploratory |
| rs2472297 | 3 | 1 | cyp1a2-regulatory-context | cyp1a2-ahr-regulatory | exploratory |

## Known weaknesses

- Direct rsID matching is scoreability-gated, but coordinate validation and strand normalization are not yet performed.
- Smoking, pregnancy, medications, liver function, and measured caffeine clearance are not included.
- The model is not calibrated to a population percentile.

## Limitations

- This is a relative pathway tendency within the MetaboBrief model, not a population percentile.
- The model does not include current caffeine intake, smoking, pregnancy, liver function, medications, or measured caffeine clearance.
- The current browser analyzer scoreability-gates direct provider-native rsID matching but still does not perform coordinate validation or strand normalization.

## Versioning

- Model ID: caffeine-clearance
- Model version: 0.2.0
- Schema version: 1.0.0
- Algorithm: group-capped-normalized-sum 1.0.0
- Variant contribution model: legacy-v0
- Compatible panel version: 0.3.0
