# Changelog

## Unreleased

- Restored scoring as a first-class report output with variant-level scoring components.
- Added a pure pathway scoring engine and the first versioned pathway model for caffeine clearance.
- Added a score-first report section with pathway tendency score, signal strength, evidence confidence, coverage, stability, and contributor drill-down.
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
