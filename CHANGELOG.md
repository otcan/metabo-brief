# Changelog

## Unreleased

- Added static Docker packaging with Nginx security headers, `/healthz`, Docker Compose, and a GHCR build workflow.
- Added local ZIP and gzip genotype-file reading for the analyzer, including MyHeritage CSV detection.
- Added file validation metadata for imported filename, selected ZIP entry, compression type, and conflicting duplicate calls.
- Added a CDP browser no-network smoke test for local file analysis.
- Added starter-reviewed release metadata and model cards for every enabled pathway score.
- Added UI grouping for reviewed versus experimental pathway scores with review status, release-use text, known weaknesses, and model-card links.
- Tightened model validation and tests so default-enabled models require review metadata and model-card coverage.
- Added starter pathway score models for every current panel pathway family.
- Added `data/pathway-definitions.json` as the clear source for pathway axes, questions, included mechanisms, and exclusions.
- Added generated explicit model files under `models/generated/` and refreshed the manifest/model lock to 16 enabled score models.
- Converted the lactase persistence marker into explicit scoring components so carbohydrate digestion is represented by the same model contract.
- Replaced the tiny synthetic demo file with full-panel synthetic 23andMe and Ancestry fixtures that render all pathway score cards.
- Added generators for pathway models and synthetic examples.
- Tightened validation to check pathway-definition checksums and full-pathway regression output.
- Restored scoring as a first-class report output with variant-level scoring components.
- Added a pure pathway scoring engine and versioned pathway model files.
- Added a score-first report section with pathway tendency score, signal strength, evidence quality, result support, coverage, stability, and contributor drill-down.
- Added alpha file-validation metadata to reports, including provider, format, genome-build, orientation, and file-plausibility status.
- Added an at-a-glance report overview for medication response, clinical context, metabolism, traits, confirmation needs, and coverage.
- Reworked finding cards around plain-language questions with expandable source and technical details.
- Removed the previous unversioned aggregate score display from analyzer reports.
- Added count-based panel coverage and pathway finding summaries.
- Made the project root an analyzer-first entry page that opens `analyze.html`.
- Added product direction, architecture, evidence contract, and roadmap documents for the open-source SNP-first direction.
- Documented the transition from prototype aggregate pathway totals to transparent pathway tendency scoring with evidence grades, coverage, and stability.
- Clarified future licensing as a maintainer decision rather than changing the current MIT license.

## 0.2.0 - 2026-06-22

- Pivoted core scope to local SNP analysis.
- Added browser-only raw genotype parsing for 23andMe-style and AncestryDNA-style files.
- Imported the larger curated SNP panel from the previous personalized repo: 140 SNPs and 491 genotype claims.
- Added source links, limitations, validation markers, target types, magnitude, and certainty fields to report output.
- Added `analyze.html` local analyzer UI and JSON report export.
- Added no-dependency parser tests and a validation workflow.

## 0.1.0 - 2026-06-22

- Published the initial open-source MetaboBrief static site.
- Added GitHub Pages deployment.
- Added MIT license, privacy notes, use notes, and contribution guidance.
- Removed checkout, form-submission, private review, and service-specific assets from the public template.
