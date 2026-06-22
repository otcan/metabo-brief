# Contributing to MetaboBrief

MetaboBrief is a local-first SNP analyzer and static template for communicating personal omics hypotheses. Contributions should make parsing, curation, reporting, privacy, and validation clearer.

## Development setup

No build step is required. Serve the repository with any static server:

```bash
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080`.

## Contribution areas

- Improve SNP parser coverage while keeping behavior explicit and tested.
- Improve panel records for uncertainty, source attribution, limitations, and validation markers.
- Improve accessibility, responsive layout, and print/PDF behavior.
- Add synthetic genotype examples that demonstrate parser behavior without exposing personal data.
- Improve documentation for privacy, deployment, and safe reuse.

Before adding new annotation sources or report semantics, read:

- [Product direction](docs/product-direction.md)
- [Architecture direction](docs/architecture.md)
- [Evidence and report contract](docs/evidence-contract.md)
- [Roadmap](docs/roadmap.md)

## Data rules

- Do not commit real personal health, genotype, metabolomics, or report data.
- Use synthetic examples by default.
- If you propose a public dataset example, document its source, license, consent posture, and redistribution terms.
- Keep source attribution visible in any evidence or claim examples.

## License compatibility

Do not copy code, report templates, text, or assets from projects with incompatible licenses into this MIT repository. It is fine to borrow broad ideas and implement them independently.

Do not add SNPedia-derived content to the default unrestricted pack. If the project supports it later, it must be an explicitly optional non-commercial add-on with visible licence gating.

Do not change `LICENSE` as part of a feature PR. Relicensing is a maintainer-level decision.

## Pull request checklist

- The site still opens from `index.html` with no build step.
- Public examples are synthetic or documented as safely redistributable.
- Privacy/use notes are updated if behavior changes.
- Links to repository, issues, and demo still work.
- Evidence additions include source links, source licence, limitations, and tests for expected genotypes.
