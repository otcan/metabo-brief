# SNP Panel

`data/snp-panel.json` is the local knowledge panel used by the browser analyzer.

## Current size

- 140 SNPs
- 491 genotype claims
- 1,403 study-evidence rows summarized into source links and curation metadata

## Record shape

Each SNP record includes:

- `rsid`
- `gene`
- `label`
- `aliases`
- `pathways`
- `targetType`
- `evidenceLevel`
- `sourceLinks`
- `genotypes`
- `validationMarkers`
- `limitations`
- `summary`
- `provenance`

Each genotype entry includes:

- signed prototype `score`
- `direction`
- `magnitude`
- `certainty`
- `targetType`
- claim ID
- interpretation text

## Legacy score-field status

The `score`, `direction`, `magnitude`, `certainty`, and `pathwayScoringEligible` fields remain first-class model inputs from the legacy curated panel export.

They are exposed as variant-level scoring components:

```json
{
  "scoring": {
    "eligible": true,
    "direction": 1,
    "magnitude": 0.35,
    "certainty": 0.58,
    "contribution": 0.203,
    "modelVersion": "legacy-v0"
  }
}
```

These fields should not be presented as diagnosis, disease-risk percentages, measured enzyme activity, treatment recommendations, or population percentiles.

Reports should pair every score with:

- evidence grade
- actionability
- effect direction
- clinical relevance
- coverage confidence
- signal strength
- evidence confidence
- score stability
- limitations

Pathway scores should only be calculated through a documented, versioned pathway model. The first model is `models/caffeine-clearance.json`.

## Important limitations

The current analyzer performs direct rsID and genotype matching only.

It does not yet perform:

- strand flipping
- allele harmonization
- imputation
- phasing
- genome-build liftover
- REF/ALT interpretation for VCF

That means a genotype must match the panel's recorded allele orientation to produce a finding. Strand-aware matching is a priority before the panel should be treated as robust across all consumer exports.

## Curation policy

Every panel entry should have source links, limitations, and validation markers. The report is informational and should not be used to diagnose disease, prescribe interventions, or replace qualified clinical judgment.

See [evidence-contract.md](evidence-contract.md) for the target annotation-pack and report contract.
