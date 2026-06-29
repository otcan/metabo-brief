# Product Direction

MetaboBrief should become the easiest self-hosted, open-source way to turn consumer DNA files into transparent, evidence-linked pathway tendency scores without uploading the DNA.

The product formula:

> Local-first consumer DNA parsing + transparent pathway scoring + rigorous annotation provenance + plain-language report hierarchy, with far less operational complexity than full variant-annotation stacks.

The current foundation is suitable for that direction:

- Browser-only raw genotype parsing.
- MIT-licensed application code today.
- A bundled curated panel with 140 SNPs and 494 genotype claims.
- Visible source links, limitations, validation markers, review status, effect direction, actionability, relevance, scoring components, and coverage confidence.
- A pure scoring engine with manifest-backed pathway models covering every current panel pathway family.
- Clear pathway-axis definitions in `data/pathway-definitions.json`.
- Direct rsID/genotype matching with no backend upload.

The current constraints are equally important:

- Direct rsID matching only.
- Limited input formats.
- Initial ZIP/gzip handling is present, but parser fixtures and provider-specific validation still need expansion.
- No genome-build or strand-orientation handling.
- No VCF/gVCF support.
- No REF/ALT-aware matching.
- Starter-reviewed pathway scores are now available for every current panel pathway family. They are release-ready as informational pathway-tendency models, but not expert/clinical reviewed models.
- Current validation metadata makes these limits visible. Pathway scoring is now blocked when provider, genome build, or format confidence is unsafe, but strand normalization and coordinate validation are still future work.

## Positioning

**Upload your DNA. Inspect pathway tendency scores. Keep everything under your control.**

That creates a clear niche:

- Simpler than heavyweight local annotation systems.
- Genuinely open source, unlike source-available non-commercial application models.
- Private and self-hostable, unlike account-based cloud report platforms.
- Useful immediately, without requiring a first-time user to download multi-GB annotation databases.

## Product Principles

1. Understandable before comprehensive.

   Every pathway score and finding should answer:

   - What did MetaboBrief find?
   - What might it mean?
   - What score did the model calculate?
   - How strong is the evidence?
   - How much of the model was covered?
   - What are the limitations?
   - What could confirm or contextualize it?

2. Local by default.

   Consumer DNA files should be parsed and annotated inside the browser. No account, backend upload, analytics, or cloud service should be required for the default application.

3. Annotations work immediately.

   The default installation must include a compact, useful annotation pack. First use should not require downloading large external databases.

4. Every conclusion is inspectable.

   Each finding must expose its source, evidence grade, source release date, genome build, interpretation method, known limitations, and pack version.

5. Truly open source.

   Deana is a useful local-first implementation reference, but its README currently says the application is not OSI open source under its current licence and is source-available for non-commercial use. Allelix is a stronger open-source licensing reference because its repository ships under the GNU Affero General Public License v3.0.

## Intended User

The primary user is a nontechnical owner of a consumer DNA file who wants a private, understandable report. The report should be informational, not diagnostic.

Technical users should still be able to inspect the evidence and export structured JSON.

## Experience Target

The main flow should fit on one screen:

1. Drop a DNA file.
2. Detect the provider, format, and likely genome build.
3. Show a short validation state explaining what can and cannot be analyzed.
4. Start annotation automatically.
5. Open the report with pathway scores first, then finding contributors.
6. Keep technical evidence behind "Show details".
7. Export as HTML/PDF or JSON.

## Report Hierarchy

The report should lead with pathway tendency scores, then categories, then SNP-level contributors:

- Pathway tendency score.
- Signal strength.
- Evidence quality.
- Directional consistency.
- Result support.
- Coverage.
- Stability.

Category summaries should remain visible:

- Medication response.
- Clinically important variants.
- Metabolism and nutrition.
- Traits and tendencies.
- Findings needing confirmation.
- Coverage and limitations.

The current analyzer has started this hierarchy with an at-a-glance section, plain-language finding cards, and scoreability gating. It still needs stronger provider, build, and orientation detection before validation can be considered robust across consumer exports.

Finding cards should follow this shape:

```text
Possible reduced caffeine clearance

Your file contains CYP1A2 rs762551 AC. Some studies associate this genotype
with intermediate caffeine metabolism.

Evidence: Moderate
Practical meaning: Caffeine may remain active longer, but sleep, medication use,
and caffeine habits may matter more.
Next step: Compare caffeine timing with sleep quality.
Source and technical details: Expand
```

Technical detail should expose:

- Observed genotype.
- File orientation.
- Genome build.
- Source record.
- Study or guideline.
- Population studied.
- Effect size.
- Evidence grade.
- Conflicting evidence.
- Pack and source versions.
- Interpretation limitations.

## Scoring Policy

Numeric scoring is part of the product core. The analyzer should expose scores as transparent, versioned pathway tendency models, not as biological risk, pathway performance, treatment scores, or population percentiles.

Report findings and pathway scores should pair:

- Evidence grade.
- Actionability.
- Effect direction.
- Clinical relevance.
- Replication status.
- Coverage confidence.
- Variant contribution.
- Pathway tendency score.
- Signal strength.
- Evidence quality.
- Directional consistency.
- Result support.
- Score stability.

The legacy variant contribution model is preserved as `metabobrief-variant-contribution` / `legacy-v0`. Formal pathway models carry separate schema, model, algorithm, variant-contribution, and compatible-panel versions.

Pathway scores must define their negative pole, positive pole, biological question, included mechanisms, excluded mechanisms, explicit accepted claim IDs, axis mappings, contribution states, coverage threshold, and limitations.

See [scoring-architecture.md](scoring-architecture.md).

## Licensing Direction

The current repository remains MIT until the maintainer explicitly changes `LICENSE`.

Recommended direction for a complete v1 application:

- Evaluate AGPL-3.0-only or AGPL-3.0-or-later for the complete application and annotation compiler.
- Keep evidence packs under their source-specific licences.
- Avoid SNPedia-derived content in the default unrestricted pack because SNPedia-derived content is commonly treated as non-commercial. If supported later, make it an explicitly optional non-commercial add-on.
- If the browser client stays MIT while a local annotation service becomes AGPL, document the boundary clearly.

Do not mix source-available, non-commercial, or copyleft code into this repository without a deliberate licence decision.

## References Checked

- Deana README: <https://github.com/DeanaDNA/deana>
- Allelix README and license: <https://github.com/allelix/allelix>
- ClinVar disclaimer: <https://www.ncbi.nlm.nih.gov/clinvar/>
- GWAS Catalog documentation: <https://www.ebi.ac.uk/gwas/docs/faq>
