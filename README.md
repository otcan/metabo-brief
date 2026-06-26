# MetaboBrief

**Open-source local SNP pathway scoring and personal omics brief generation. Static-first. Privacy-aware. Evidence-attributed.**

[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![pages](https://img.shields.io/badge/demo-GitHub%20Pages-success)](https://otcan.github.io/metabo-brief/)
[![privacy: local-first](https://img.shields.io/badge/privacy-local--first-success)](#privacy-posture)

MetaboBrief is a browser-first SNP pathway-scoring engine and report surface. It parses raw genotype files locally, matches rsIDs against a curated JSON SNP panel, and renders evidence-attributed pathway tendency scores with inspectable contributors.

The project is published for open-source use under `otcan/metabo-brief`.

Live demo: <https://otcan.github.io/metabo-brief/>

The project root opens the SNP analyzer. The previous marketing-style homepage has been removed from the default demo path.

## Product direction

MetaboBrief should become the easiest self-hosted, open-source way to turn consumer DNA files into transparent, evidence-linked pathway tendency scores without uploading the DNA.

The current repository is the Lite foundation: local browser parsing, bundled starter annotations, and static hosting. The next phase is to formalize evidence packs, provider/build detection, report schema, and self-hosted deployment.

Design contracts:

- [Product direction](docs/product-direction.md)
- [Architecture direction](docs/architecture.md)
- [Evidence and report contract](docs/evidence-contract.md)
- [Scoring architecture](docs/scoring-architecture.md)
- [Roadmap](docs/roadmap.md)
- [SNP panel notes](docs/snp-panel.md)
- [Data safety](docs/data-safety.md)

## What is included

- Static HTML/CSS/JavaScript pages with no build step.
- Browser-only parsing for 23andMe-style and AncestryDNA-style raw genotype files.
- A curated SNP panel in `data/snp-panel.json` with 140 SNPs and 494 genotype claims.
- A pure scoring engine in `analyzer/scoring-engine.js`.
- Manifest-backed pathway models in `models/manifest.json`, with 16 enabled scores covering every current panel pathway family.
- Clear pathway axes in `data/pathway-definitions.json`, used to generate starter pathway models under `models/generated/`.
- Starter-reviewed model cards in `docs/model-cards/` for every enabled pathway score.
- An archived broad caffeine-response model retained for old-score reproducibility.
- Local SNP report rendering in `analyze.html`.
- Alpha file-validation metadata for provider, format, genome build, orientation, and file plausibility.
- A score-first report surface with pathway tendency scores, signal strength, evidence quality, result support, directional consistency, coverage, stability, contributor dominance, leave-one-group-out sensitivity, plain-language finding cards, and source links.
- Short and long methodology pages for future metabolomics and digital-twin framing.
- Privacy and use notes that emphasize synthetic data for public demos.
- GitHub Actions for static deployment, semantic model validation, scoring invariants, regression tests, and SNP parser validation.

## Supported inputs

MetaboBrief now treats SNP analysis as core. The default analyzer performs direct rsID/genotype matching against the bundled panel.

| Input type | Status | Notes |
|---|---|---|
| 23andMe-style raw SNP text | Supported | Four-column `rsid/chromosome/position/genotype` rows. |
| AncestryDNA-style raw SNP text | Supported | Five-column `rsid/chromosome/position/allele1/allele2` rows. |
| Generic rsID + genotype TSV/CSV | Partially supported | Header-based parsing handles common column names. |
| Raw VCF / gVCF | Not yet supported | Planned separately; no liftover or REF/ALT modeling yet. |
| Raw metabolomics files | Later | Metabolomics panel support is deferred. |

## Outputs

| Output | File |
|---|---|
| Analyzer-first entry page | `index.html` |
| Local SNP analyzer | `analyze.html` |
| SNP parser and analysis engine | `analyzer/snp-core.js` |
| Pathway scoring engine | `analyzer/scoring-engine.js` |
| Starter SNP panel | `data/snp-panel.json` |
| Pathway definitions | `data/pathway-definitions.json` |
| Pathway model manifest | `models/manifest.json` |
| Pathway model cards | `docs/model-cards/*.md` |
| Caffeine clearance model | `models/caffeine-clearance/0.2.0.json` |
| Caffeine sensitivity model | `models/caffeine-sensitivity/0.1.0.json` |
| Generated starter pathway models | `models/generated/*/0.1.0.json` |
| Short methodology explainer | `personalized.html` |
| Longer methodology explainer | `personalized-full.html` |
| Research navigation page | `research-summary.html` |
| Privacy and use notes | `privacy.html`, `terms.html` |

## What is not included

- No backend, account system, checkout, analytics, or upload pipeline.
- No strand flipping, imputation, phasing, or genome-build liftover yet. The report now exposes this as validation metadata, but genotypes must still match the panel's recorded allele orientation.
- No VCF/gVCF parser yet.
- No medical advice engine and no global health score.
- No bundled third-party evidence databases beyond the starter JSON panel.
- No real personal health, genotype, metabolomics, or evidence-review payloads.

## Use locally

Serve the directory with any static server:

```bash
python3 -m http.server 8080
```

Then visit:

- `http://127.0.0.1:8080/` for the analyzer-first entry page.
- `http://127.0.0.1:8080/analyze.html` for the SNP analyzer directly.

Run the parser tests:

```bash
npm test
```

## Privacy posture

- Raw genotype files are read locally with browser file APIs.
- No data leaves the browser in the default template.
- No telemetry, analytics, uploads, checkout, or contact form is included.
- The demo uses local storage only for cookie-banner preference.
- Public examples should be synthetic or explicitly consented and de-identified.

If you add uploads, analytics, forms, accounts, or API calls, update the privacy notes and treat health, genotype, and metabolomics data as sensitive personal data.

## Regulatory posture

MetaboBrief is informational software for SNP pathway interpretation and personal omics communication. It does not diagnose disease, classify variants clinically, prescribe interventions, or replace qualified professional judgment. Any scientific claim in a fork should be attributed to its source and paired with limitations.

## Customize

1. Expand or edit the SNP panel in `data/snp-panel.json`.
2. Keep source links, limitations, and validation markers on every panel record.
3. Edit pathway axes in `data/pathway-definitions.json`.
4. Run `npm run build:release-data` to regenerate model JSON, model cards, the manifest, the lock file, and synthetic examples.
5. Replace sample copy in `index.html`, `personalized.html`, and `personalized-full.html`.
6. Update `privacy.html` and `terms.html` before deploying any version with forms, uploads, analytics, or account features.
7. Replace assets under `assets/` if your fork has its own visual identity.

## Roadmap

The roadmap is tracked in [docs/roadmap.md](docs/roadmap.md).

Near-term priorities:

- Define the shared report JSON schema and evidence-grading framework.
- Move from one `snp-panel.json` file to versioned annotation packs.
- Refine the starter-reviewed pathway models with stricter biology-specific axes, thresholds, linkage groups, and score decomposition.
- Add TypeScript parser modules, web-worker parsing, ZIP support, and provider detection.
- Add genome-build and orientation detection before expanding report claims.
- Keep scoring first-class while pairing every score with evidence grade, coverage, stability, and limitations.
- Add printable HTML/PDF export and deterministic JSON export.
- Add official static container and full Docker Compose deployment.
- Defer metabolomics and AI interpretation until the genomics foundation is trustworthy.

## Safety notes

Do not publish real user health, genotype, metabolomics, or report data in this repository or a public fork. Treat the included pages as a communication shell, not as validated clinical software.

See [docs/data-safety.md](docs/data-safety.md) for a longer checklist.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), and keep all examples synthetic unless the dataset is clearly licensed, consented, and safe for public redistribution.

## License

MIT License. See [LICENSE](LICENSE).

Future v1 licensing is an explicit maintainer decision. The current direction document recommends evaluating AGPL-3.0 for the complete application and annotation compiler while keeping evidence packs under source-specific licences.
