# Contributing to MetaboBrief

MetaboBrief is a static template for communicating personalized metabolomics hypotheses. Contributions should make the template clearer, safer, easier to fork, or easier to validate.

## Development setup

No build step is required. Serve the repository with any static server:

```bash
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080`.

## Contribution areas

- Improve report sections for uncertainty, source attribution, limitations, and validation markers.
- Improve accessibility, responsive layout, and print/PDF behavior.
- Add synthetic examples that demonstrate report structure without exposing personal data.
- Improve documentation for privacy, deployment, and safe reuse.

## Data rules

- Do not commit real personal health, genotype, metabolomics, or report data.
- Use synthetic examples by default.
- If you propose a public dataset example, document its source, license, consent posture, and redistribution terms.
- Keep source attribution visible in any evidence or claim examples.

## License compatibility

Do not copy code, report templates, text, or assets from projects with incompatible licenses into this MIT repository. It is fine to borrow broad ideas and implement them independently.

## Pull request checklist

- The site still opens from `index.html` with no build step.
- Public examples are synthetic or documented as safely redistributable.
- Privacy/use notes are updated if behavior changes.
- Links to repository, issues, and demo still work.
