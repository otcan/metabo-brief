# MetaboBrief

MetaboBrief is a static starter for personalized metabolomics briefs. It packages a public landing page, method explainer, report preview, privacy notes, and GitHub Pages deployment workflow that can be adapted for synthetic demos or validated internal workflows.

The project is published for open-source use under `otcan/metabo-brief`.

## What is included

- Static HTML/CSS/JavaScript pages with no build step.
- A report-preview layout for pathway-level hypotheses and action-plan sections.
- Short and long methodology pages for metabolomics and digital-twin framing.
- Privacy and use notes that emphasize synthetic data for public demos.
- A GitHub Pages workflow in `.github/workflows/static.yml`.

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

## Customize

1. Replace sample copy in `index.html`, `personalized.html`, and `personalized-full.html`.
2. Replace report preview sections with your own synthetic or consented/de-identified examples.
3. Update `privacy.html` and `terms.html` before deploying any version with forms, uploads, analytics, or account features.
4. Replace assets under `assets/` if your fork has its own visual identity.

## Safety notes

Do not publish real user health, genotype, metabolomics, or report data in this repository or a public fork. Treat the included pages as a communication shell, not as validated clinical software.

## License

MIT License. See [LICENSE](LICENSE).
