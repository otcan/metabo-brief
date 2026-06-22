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

## Scoring status

The current `score`, `magnitude`, and `certainty` fields came from the legacy curated panel and are useful for sorting and prototyping. They should not be presented as validated biological risk, pathway performance, or treatment scores.

Future reports should prioritize:

- evidence grade
- actionability
- effect direction
- clinical relevance
- replication status
- coverage confidence

Numerical scores should only be introduced when there is a documented, validated formula with explicit population and ancestry assumptions.

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

Every scored panel entry should have source links, limitations, and validation markers. The report is informational and should not be used to diagnose disease, prescribe interventions, or replace qualified clinical judgment.

See [evidence-contract.md](evidence-contract.md) for the target annotation-pack and report contract.
