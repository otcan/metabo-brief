# Evidence and Report Contract

This document defines the direction for annotation packs and report output. It is stricter than the current `data/snp-panel.json` prototype and should guide future schema work.

## Evidence Rules

Every conclusion must be inspectable.

Every finding should include:

- Source.
- Evidence grade.
- Source release date.
- Genome build.
- Interpretation method.
- Known limitations.
- Pack version.
- Source licence.

Records without source links, limitations, and a known licence should not ship in a default pack.

## Source Policy

Default packs should prioritize sources that can be redistributed in an open-source self-hosted application.

ClinVar can provide clinical context, but ClinVar's own disclaimer must be represented in the UI: its website warns that the information is not intended for direct diagnostic use or medical decision-making without review by a genetics professional, and that individuals should not change health behavior solely on that information.

GWAS Catalog data can support trait associations, but records should be filtered and displayed with:

- Ancestry context.
- Sample size.
- Effect size.
- P-value.
- Replication context.
- Publication/source identifiers.

SNPedia-derived content should not be included in the default unrestricted pack. If supported later, make it an explicitly optional non-commercial add-on with clear licence gating.

## Evidence Grades

Use explicit grades instead of opaque numeric scores.

Suggested initial scale:

| Grade | Meaning |
|---|---|
| Strong | Guideline, expert-reviewed, replicated, or clinically curated evidence with clear limitations. |
| Moderate | Multiple supporting sources or replicated associations, but not sufficient for clinical action. |
| Limited | Early, small, context-dependent, or weakly replicated evidence. |
| Conflicting | Credible sources disagree or classify the same variant differently. |
| Research | Plausible but experimental; disabled by default unless the user opts in. |

Actionability should be separate from evidence strength:

- Informational.
- Contextualize with symptoms, habits, labs, or medication list.
- Confirm with measured biomarkers.
- Confirm clinically before action.
- Not actionable.

## Report JSON Shape

The shared report schema should be deterministic and reusable by the browser, CLI, and local service.

Draft top-level shape:

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-06-22T00:00:00.000Z",
  "input": {
    "provider": "23andMe",
    "format": "raw-rsid-table",
    "detectedGenomeBuild": "GRCh37",
    "buildConfidence": "medium",
    "variantCount": 0,
    "noCallCount": 0,
    "duplicateCount": 0
  },
  "packs": [
    {
      "id": "core",
      "version": "0.1.0",
      "schemaVersion": "1.0.0",
      "sha256": "..."
    }
  ],
  "categories": [],
  "findings": [],
  "coverage": {},
  "warnings": []
}
```

Draft finding shape:

```json
{
  "id": "core:cyp1a2-rs762551-ac",
  "category": "Metabolism and nutrition",
  "title": "Possible reduced caffeine clearance",
  "summary": "Your file contains CYP1A2 rs762551 AC.",
  "plainLanguageMeaning": "Some studies associate this genotype with intermediate caffeine metabolism.",
  "nextStep": "Compare caffeine timing with sleep quality.",
  "evidenceGrade": "Moderate",
  "actionability": "Contextualize with habits or biomarkers",
  "clinicalRelevance": "Informational",
  "effectDirection": "possible decrease",
  "replicationStatus": "replicated association",
  "coverageConfidence": "direct genotype match",
  "observed": {
    "rsid": "rs762551",
    "gene": "CYP1A2",
    "genotype": "AC",
    "rawGenotype": "AC",
    "orientation": "unknown",
    "genomeBuild": "GRCh37"
  },
  "technical": {
    "sourceRecord": "...",
    "studyOrGuideline": "...",
    "populationStudied": "...",
    "effectSize": "...",
    "conflictingEvidence": [],
    "limitations": []
  },
  "provenance": {
    "packId": "core",
    "packVersion": "0.1.0",
    "sourceReleaseDate": "2026-01-01",
    "sourceLicence": "..."
  }
}
```

## Pack Manifest Shape

Each pack should ship a manifest alongside shards:

```json
{
  "id": "core",
  "name": "MetaboBrief Core",
  "version": "0.1.0",
  "schemaVersion": "1.0.0",
  "buildDate": "2026-06-22",
  "sourceReleaseDates": {},
  "supportedGenomeBuilds": ["GRCh37", "GRCh38"],
  "licences": [],
  "sha256": "...",
  "shards": [],
  "evidenceGradingRules": "...",
  "build": {
    "repository": "https://github.com/otcan/metabo-brief",
    "commit": "...",
    "workflow": "..."
  }
}
```

## Validation Requirements

Every default-pack record must pass checks:

- Source resolves.
- Alleles and builds are explicit.
- Evidence grade is assigned.
- Language is understandable.
- Limitations are present.
- Licence is known.
- Tests cover expected genotypes.
- Contradictory interpretations are represented.

Unsupported builds, formats, alleles, and ambiguous orientations should fail visibly rather than being guessed.
