# Data Safety

MetaboBrief is designed as a local-first SNP analyzer and static communication template. Raw genotype files are sensitive personal data. The default analyzer reads files locally in the browser and does not upload them.

## Default behavior

- No backend.
- No uploads.
- No analytics.
- No contact form.
- No checkout.
- Local storage is used only for the cookie-banner preference.
- Raw SNP files are not stored by the default app.

## Public demo checklist

Before publishing a fork:

- Use synthetic or clearly redistributable example data.
- Remove names, photos, dates of birth, emails, raw genotype files, raw metabolomics files, and unredacted reports.
- Attribute every evidence source used in example claims.
- Separate hypotheses from recommendations.
- Include limitations and validation markers.
- Update `privacy.html` and `terms.html` if any behavior changes.

## If you add data processing

Document:

- What data is collected.
- Where it is stored.
- Who can access it.
- How users can delete it.
- Which third-party processors receive it.
- Whether outputs may contain sensitive health or genotype information.

Do not rely on this analyzer as clinical software without the validation, review, and regulatory work required for your use case.
