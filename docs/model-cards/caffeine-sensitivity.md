# Caffeine sensitivity tendency

## Review status

- Status: reviewed
- Review level: starter-reviewed
- Reviewed at: 2026-06-26
- Checklist version: 1.0.0
- Release use: Informational genetic pathway tendency scoring only; not diagnostic, clinical, treatment, or population-percentile interpretation.

Starter-reviewed for release as an informational caffeine-sensitivity tendency model with explicit ADORA2A/COMT membership, axis mapping, contribution states, and limitations.

## Biological question

Do the explicitly supported variants favor lower or higher experiential caffeine and stimulant sensitivity?

## Score axis

- Negative pole: Tendency toward lower caffeine or stimulant sensitivity
- Positive pole: Tendency toward higher caffeine or stimulant sensitivity

## Included mechanisms

- Adenosine receptor response context
- COMT stimulant-response context

## Excluded mechanisms

- Caffeine clearance speed
- Current caffeine intake
- Sleep debt
- Anxiety history
- Medication interactions
- Measured caffeine response

## Model thresholds

- Minimum coverage: 0.4
- Minimum independent signals: 1
- Minimum evidence quality: 0.3
- Maximum group contribution: 0.5
- Default profile: conservative

## Inputs

| rsID | Claim count | Axis multiplier | Mechanism | Independence group | Profiles |
|---|---:|---:|---|---|---|
| rs5751876 | 3 | 1 | adenosine-receptor-response | adora2a-response | conservative, exploratory |
| rs4680 | 3 | -1 | comt-stimulant-response-context | comt-response | conservative, exploratory |

## Known weaknesses

- Direct rsID matching is scoreability-gated, but coordinate validation and strand normalization are not yet performed.
- Sleep, anxiety history, caffeine dose, tolerance, medications, and real-world context are not included.
- The model is not calibrated to a population percentile.

## Limitations

- This model estimates experiential stimulant sensitivity tendency, not caffeine clearance.
- Sleep, anxiety, caffeine dose, tolerance, medications, and context can dominate real-world response.
- The current browser analyzer scoreability-gates direct provider-native rsID matching but still does not perform coordinate validation or strand normalization.

## Versioning

- Model ID: caffeine-sensitivity
- Model version: 0.1.0
- Schema version: 1.0.0
- Algorithm: group-capped-normalized-sum 1.0.0
- Variant contribution model: legacy-v0
- Compatible panel version: 0.3.0
