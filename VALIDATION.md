# Validation Protocol

Purpose: collect real-user evidence for the two remaining product gates without adding accounts, analytics, or cloud sync.

## Five-User Completion Gate

Deadline from project intelligence: 2026-07-15.

A tester counts only when all of these are true:

- The tester imports or edits a usable resume.
- The tester pastes a real job description.
- The app computes keyword gaps and patch-shaped edits.
- The tester reviews the diff.
- The tester accepts the tailored draft.
- The tester exports JSON Resume.
- The tester exports PDF.
- The tester exports a validation receipt from the Validate page.
- The tester completed the flow without operator assistance.

Collect five exported `rbv-*.json` receipts where `completion.coreFlowComplete` is `true`.

Audit a receipt folder locally:

```bash
cd app
node cli/resume.mjs validate --input ../receipts --require-completions 5 --require-interviews 0
```

The five-user gate passes only when the audit reports at least five unique non-anonymous tester labels with complete receipts.

## Interview-Producing Resume Gate

Deadline from project intelligence: 2026-08-31.

A receipt counts toward this gate only when:

- `completion.coreFlowComplete` is `true`.
- `outcome.status` is `interview` or `offer`.
- `outcome.notes` states the real follow-up evidence, such as recruiter screen booked or interview scheduled.

Do not count `sent`, `no-response`, `rejected`, or `not-sent` as interview-producing evidence.

The original project kill criterion requires at least ten interview-producing resumes per week by 2026-08-31. Audit that with:

```bash
cd app
node cli/resume.mjs validate --input ../receipts --require-completions 5 --require-interviews 10 --window-days 7
```

The audit command exits non-zero until both gates pass and every receipt is structurally valid.

## Receipt Privacy

Validation receipts are local JSON files exported by the tester. They include timestamps, pass/fail criteria, scores, patch targets, and fingerprints.

Receipts do not include the full resume body or pasted job description body.

## Audit Output

Use `--json` to produce machine-readable audit output:

```bash
cd app
node cli/resume.mjs validate --input ../receipts --json
```

The audit reports:

- Valid and invalid receipt counts.
- Unique completion users.
- Interview-producing receipt count.
- Best interview-producing window for the configured `--window-days`.
- Per-receipt errors for malformed or contradictory receipts.

## Owner Decision

The project can be called complete only after the owner accepts enough real receipts to satisfy both gates or explicitly waives those gates in writing.
