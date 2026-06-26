# Examples

This directory contains synthetic files that demonstrate MetaboBrief without exposing personal data.

## Included examples

- `synthetic-23andme.txt`: synthetic 23andMe-style raw SNP file with broad starter-panel coverage.
- `synthetic-ancestry.txt`: synthetic AncestryDNA-style raw SNP file with the same synthetic calls.
- A matching machine-readable JSON report export is planned.

The synthetic examples use the allele orientation expected by the current curated panel and are generated with `node scripts/build-synthetic-examples.mjs`. The analyzer does not yet perform strand flipping.

Compressed ZIP/gzip parser coverage is tested by generating in-memory synthetic archives in `tests/file-reader.test.mjs`; do not commit raw personal genotype archives as fixtures.

## Example rules

- Use synthetic data by default.
- If using public data, document source, license, consent, and redistribution terms.
- Do not include raw genotype files, raw metabolomics files, names, contact details, or private reports.
- Keep source attribution visible for any scientific claim.
