# Roadmap

This roadmap keeps SNP analysis at the core. Metabolomics and longitudinal data come later, after the genomics foundation is trustworthy.

## Milestone 1 - Product, Evidence, and Scoring Contract

Define the rules before expanding annotations:

- Primary user: nontechnical owner of a consumer DNA file.
- Informational, not diagnostic, positioning.
- Shared report JSON schema.
- Evidence-grading framework.
- Scoring terminology and formula specification.
- Pathway-axis specification.
- Minimum scoring thresholds.
- Missing-data and linkage-group rules.
- Terminology and writing standard.
- Supported data-source policy.
- Annotation and application licensing model.
- Rules for conflicting, missing, and uncertain findings.

Deliverables:

- Product direction document.
- Evidence contract document.
- Scoring architecture document.
- Draft report JSON schema.
- Draft pathway-model schema.
- Licence decision for future v1 packaging.
- Default source allowlist and restricted-source policy.

## Milestone 2 - Trustworthy Browser Engine

Upgrade the current analyzer:

- TypeScript parser library.
- Web-worker parsing.
- ZIP support.
- Provider detection.
- Build and orientation detection.
- Better duplicate and no-call handling.
- Deterministic report generation.
- Synthetic test fixtures for each provider.
- Clear unsupported-file errors.
- Optional IndexedDB report library.

Keep parsing and report generation independent of the UI so the same engine can be used by a CLI or local backend.

## Milestone 3 - Core Annotations and Pathway Models Out of the Box

Create the annotation-pack compiler, formal pathway models, and first bundled pack.

The first reviewed pack should prioritize several hundred understandable, well-supported findings and a smaller set of reviewed pathway models, not hundreds of thousands of weak associations. Generated starter models can cover the full current panel earlier, but each should remain marked experimental until reviewed.

Requirements:

- Versioned pack manifest.
- Versioned pathway-model manifest.
- Source release dates.
- Source licences.
- SHA-256 checksums.
- Supported genome builds.
- Evidence grading rules.
- Pathway axes and scoring formulas.
- Explicit model input lists.
- Contribution-state semantics.
- Linkage and independence groups.
- Reproducible build metadata.
- Schema and content validation.

## Milestone 4 - Consumer Report and Self-Hosting

Deliver:

- New upload and validation flow.
- At-a-glance report.
- Score-first pathway report.
- Conservative and exploratory scoring profiles.
- Score decomposition by contributor.
- Evidence drill-down.
- Search and filtering.
- Coverage report.
- Local report library.
- HTML/PDF/JSON export.
- Official container image.
- Docker Compose deployment.
- Offline documentation.
- Signed versioned releases.
- Software bill of materials.

## Milestone 5 - Full Annotation Mode

Add:

- VCF/gVCF support.
- REF/ALT normalization.
- GRCh37/GRCh38 handling.
- Multi-sample selection.
- Larger annotation databases.
- Optional Allelix integration.
- CLI and local REST API.
- Extended evidence packs.
- Comparison between two reports or test dates.

## Milestone 6 - Metabolomics and Longitudinal Data

Only after the genomics foundation is stable:

- Import metabolomics and laboratory measurements.
- Map measured biomarkers to the same pathway model.
- Separate genetic predisposition from measured current state.
- Compare reports over time.
- Surface genotype-biomarker agreement and disagreement.
- Generate validation questions rather than unsupported recommendations.

AI interpretation should also wait until this stage. It should be optional, disabled by default, and limited to explaining already retrieved findings rather than inventing annotations.

## Definition of First Credible Release

A v1 release should satisfy all of these:

- A nontechnical user can upload a supported file and understand the first report without documentation.
- One Docker command launches the application.
- Core annotations are immediately available without database setup.
- Default analysis makes no external network calls.
- Raw genotype data never leaves the browser in Lite mode.
- Every finding has a visible source, evidence grade, and limitation.
- Every pathway score has visible signal strength, evidence quality, directional consistency, result support, coverage, stability, model version, and limitations.
- The same file and annotation-pack version always produce the same report.
- Unsupported builds, formats, and alleles fail visibly rather than being guessed.
- Reports export as printable HTML/PDF and structured JSON.
- The complete code is OSI open source.
- Data-source licences are machine-readable and visible in the UI.

## Deliberate v1 Non-Goals

Do not initially chase:

- Large cloud-report breadth.
- AI health coaching.
- Supplement recommendations.
- Polygenic risk scores.
- Global health score.
- Imputation.
- Complex CYP2D6 calling.
- Full clinical diagnosis.
- Cloud accounts or subscriptions.
- Practitioner portals.
- Raw metabolomics pipelines.

The goal is an inspectable pathway model first, not maximum report count.
