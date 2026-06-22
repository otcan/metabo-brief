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

- signed `score`
- `direction`
- `magnitude`
- `certainty`
- `targetType`
- claim ID
- interpretation text

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
