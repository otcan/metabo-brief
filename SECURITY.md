# Security Policy

## Reporting a vulnerability

Please report security issues through GitHub private vulnerability reporting for this repository. Do not open a public issue for vulnerabilities involving data exposure, unsafe handling of health data, or deployment misconfiguration.

## Scope

In scope:

- Static-site behavior that could expose user-entered or embedded sensitive data.
- Unsafe defaults in privacy notes, demo pages, or deployment instructions.
- Supply-chain or GitHub Pages configuration issues in this repository.

Out of scope:

- Scientific correctness of third-party sources used by downstream forks.
- Clinical interpretation, diagnosis, or treatment decisions made outside this template.
- Private deployments that add backends, uploads, analytics, accounts, or forms not present in this repository.

## Sensitive data

MetaboBrief does not process uploads by default. If a fork adds data processing, treat genotype, metabolomics, and report outputs as sensitive personal data and document retention, deletion, access control, and processor behavior.
