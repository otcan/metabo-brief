# Examples

This directory contains synthetic files that demonstrate MetaboBrief without exposing personal data.

## Planned examples

- `synthetic-23andme.txt`: synthetic 23andMe-style raw SNP file.
- `synthetic-ancestry.txt`: synthetic AncestryDNA-style raw SNP file.
- A matching machine-readable JSON report export is planned.

The synthetic examples use the allele orientation expected by the current curated panel. The analyzer does not yet perform strand flipping.

## Example rules

- Use synthetic data by default.
- If using public data, document source, license, consent, and redistribution terms.
- Do not include raw genotype files, raw metabolomics files, names, contact details, or private reports.
- Keep source attribution visible for any scientific claim.
