# MetaboBrief

**Open-source personalized metabolomics brief starter. Static-first. Privacy-aware. Evidence-attributed.**

[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![pages](https://img.shields.io/badge/demo-GitHub%20Pages-success)](https://otcan.github.io/metabo-brief/)
[![privacy: local-first](https://img.shields.io/badge/privacy-local--first-success)](#privacy-posture)

MetaboBrief is a static starter for personalized metabolomics briefs. It packages a public landing page, method explainer, report preview, privacy notes, and GitHub Pages deployment workflow that can be adapted for synthetic demos or validated internal workflows.

The project is published for open-source use under `otcan/metabo-brief`.

Live demo: <https://otcan.github.io/metabo-brief/>

## What is included

- Static HTML/CSS/JavaScript pages with no build step.
- A report-preview layout for pathway-level hypotheses and action-plan sections.
- Short and long methodology pages for metabolomics and digital-twin framing.
- Privacy and use notes that emphasize synthetic data for public demos.
- A GitHub Pages workflow in `.github/workflows/static.yml`.

## Supported inputs

MetaboBrief is a communication shell, not an analysis engine. It is designed to present outputs from validated workflows.

| Input type | Status | Notes |
|---|---|---|
| Synthetic metabolomics summaries | Supported | Best for public demos and examples. |
| De-identified pathway hypotheses | Supported | Include source attribution, uncertainty, and validation markers. |
| Genotype or SNP summaries | Template only | Do not publish real user genotype files or raw variants in a public fork. |
| Raw metabolomics files | Not processed | Use an external validated pipeline, then paste summarized results. |
| Raw 23andMe, AncestryDNA, VCF, or gVCF files | Not processed | This repo does not parse or analyze genotype files. |

## Outputs

| Output | File |
|---|---|
| Landing page and report preview | `index.html` |
| Short methodology explainer | `personalized.html` |
| Longer methodology explainer | `personalized-full.html` |
| Research navigation page | `research-summary.html` |
| Privacy and use notes | `privacy.html`, `terms.html` |

## What is not included

- No backend, account system, checkout, analytics, or upload pipeline.
- No medical advice engine.
- No real personal health, genotype, metabolomics, or evidence-review payloads.

## Use locally

Open `index.html` in a browser, or serve the directory with any static server:

```bash
python3 -m http.server 8080
```

Then visit `http://127.0.0.1:8080`.

## Privacy posture

- No data leaves the browser in the default template.
- No telemetry, analytics, uploads, checkout, or contact form is included.
- The demo uses local storage only for cookie-banner preference.
- Public examples should be synthetic or explicitly consented and de-identified.

If you add uploads, analytics, forms, accounts, or API calls, update the privacy notes and treat health, genotype, and metabolomics data as sensitive personal data.

## Regulatory posture

MetaboBrief is informational software for communicating hypotheses and uncertainty. It does not diagnose disease, classify variants, prescribe interventions, or replace qualified professional judgment. Any scientific claim in a fork should be attributed to its source and paired with limitations.

## Customize

1. Replace sample copy in `index.html`, `personalized.html`, and `personalized-full.html`.
2. Replace report preview sections with your own synthetic or consented/de-identified examples.
3. Update `privacy.html` and `terms.html` before deploying any version with forms, uploads, analytics, or account features.
4. Replace assets under `assets/` if your fork has its own visual identity.

## Roadmap

- Add a fully synthetic example report with matching JSON payload.
- Add a small schema for evidence cards and validation markers.
- Add accessibility and content-quality checks for generated report pages.
- Add optional export styles for print/PDF workflows.

## Safety notes

Do not publish real user health, genotype, metabolomics, or report data in this repository or a public fork. Treat the included pages as a communication shell, not as validated clinical software.

See [docs/data-safety.md](docs/data-safety.md) for a longer checklist.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), and keep all examples synthetic unless the dataset is clearly licensed, consented, and safe for public redistribution.

## License

MIT License. See [LICENSE](LICENSE).
