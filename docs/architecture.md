# Architecture Direction

MetaboBrief should use one shared report contract across a browser-only application and an optional full local annotation mode.

```text
DNA file
  -> local parser and format detection
  -> variant normalization
  -> versioned annotation packs
  -> evidence and interpretation engine
  -> plain-language report
       -> browser view
       -> printable HTML/PDF
       -> structured JSON
```

## MetaboBrief Lite

Lite is the browser-first default application and hosted demo.

It should support:

- 23andMe.
- AncestryDNA.
- MyHeritage.
- FamilyTreeDNA.
- Generic rsID tables.
- ZIP, TXT, CSV, and TSV files.
- Provider and genome-build detection.
- Browser web-worker processing.
- Optional local report storage.
- No server-side upload.

Lite should continue to work as a static site or PWA. It should not require a backend for normal consumer genotype files.

## Runtime Modules

The parsing and report logic should be independent of UI code:

- `parser`: format detection, streaming/worker parsing, ZIP handling, duplicate/no-call policy.
- `normalizer`: rsID normalization, genotype normalization, build/orientation metadata, future allele harmonization.
- `pack-loader`: manifest loading, shard selection, checksum verification.
- `interpreter`: deterministic evidence matching and report entry generation.
- `report-schema`: shared JSON schema for browser, CLI, and service outputs.
- `exporters`: JSON, printable HTML, and browser-print/PDF output.
- `storage`: optional IndexedDB report library for Lite.

## Annotation-Pack System

Move from one hand-maintained `data/snp-panel.json` file to independently versioned evidence packs.

Recommended initial packs:

| Pack | Purpose | Default |
|---|---|---|
| Core | Curated, understandable consumer-genetics findings | Enabled |
| Clinical context | ClinVar classifications with review status and conflicts | Optional |
| Pharmacogenomics | Carefully supported CPIC/ClinPGx findings | Optional |
| Traits | Selected, replicated GWAS associations | Optional |
| Metabolic pathways | MetaboBrief methylation, nutrient, and metabolism layer | Enabled when mature |
| Experimental | Lower-confidence or research-only findings | Disabled |

The runtime should never depend on live third-party APIs. Pack artifacts should be generated in GitHub Actions or a separate pack-building repository from upstream release files.

Each pack must include:

- Pack version.
- Build date.
- Source release dates.
- Source and data licences.
- SHA-256 checksum.
- Supported genome builds.
- Schema version.
- Evidence grading rules.
- Reproducible build metadata.

## Full Self-Hosted Mode

Full mode is optional and for larger or more technical inputs:

- VCF and gVCF.
- WES/WGS files.
- Position-based lookups.
- GRCh37 and GRCh38.
- REF/ALT-aware matching.
- Larger SQLite annotation databases.
- Optional gnomAD, AlphaMissense, and CADD enrichment.
- Command-line and local API access.

This mode can initially use Allelix as an optional AGPL service or adapter instead of rebuilding a full variant-annotation stack immediately. The browser version and full service should produce the same shared report schema.

## Deployment

Two deployment paths should be official.

Static/PWA:

```bash
docker run -p 8080:80 ghcr.io/otcan/metabo-brief:latest
```

This serves the browser-only application and bundled core evidence pack.

Full Docker Compose:

```bash
docker compose up -d
```

This adds:

- Web interface.
- Local annotation service.
- Evidence-pack storage.
- Optional scheduled pack updater.
- Health check.
- Persistent local volume.

No external service, API key, cloud database, or account system should be required for either default path.

## AI Boundary

AI interpretation should wait until the genomics foundation is trustworthy and longitudinal/metabolomics data exists.

When added, AI should be:

- Optional.
- Disabled by default.
- Limited to explaining already retrieved findings.
- Blocked from inventing annotations or unsupported recommendations.
