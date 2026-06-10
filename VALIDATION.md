# Validation Protocol

Purpose: collect real-user evidence for the two remaining product gates without adding accounts, analytics, or cloud sync.

## Five-User Completion Gate

Deadline from project intelligence: 2026-07-15.

A tester counts only when all of these are true:

- The tester starts a fresh validation run from the Validate page.
- The tester imports or edits a usable resume.
- The tester pastes a real job description.
- The app computes keyword gaps and patch-shaped edits.
- The tester reviews the diff.
- The tester accepts the tailored draft.
- The tester exports JSON Resume.
- The tester exports PDF.
- The tester attests that the run was completed without operator assistance.
- The tester enters a non-anonymous tester label.
- The tester exports a validation receipt from the Validate page.
- The tester completed the flow without operator assistance.

Collect five exported `rbv-*.json` receipts where `completion.coreFlowComplete` is `true`.

Put exported receipts in `receipts/` at the repository root. Receipt JSON files are ignored by Git in that folder.

Use [receipts/COLLECTION.md](receipts/COLLECTION.md) as the tester handoff and owner intake runbook.

Use [receipts/CAMPAIGN.md](receipts/CAMPAIGN.md) for the copy-paste tester invite, outcome follow-up, owner checklist, and private tracker format.

Audit the receipt folder locally:

```bash
node app/cli/resume.mjs validate --input receipts --require-completions 5 --require-interviews 0
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
node app/cli/resume.mjs validate --input receipts --require-completions 5 --require-interviews 10 --window-days 7
```

The audit command exits non-zero until both gates pass and every receipt is structurally valid.

## Receipt Privacy

Validation receipts are local JSON files exported by the tester. They include a validation run id, timestamps, pass/fail criteria, scores, patch targets, fingerprints, and an integrity digest.

Receipts do not include the full resume body or pasted job description body.

The CLI auditor rejects receipts when the integrity digest does not match the receipt body, when a receipt id is duplicated, when the required checklist is incomplete, when completion counts do not match checklist state, or when target, metric, export, patch, or outcome fields contradict each other.

The CLI auditor counts a completion receipt only when `attestations.noOperatorAssistance` is `true`.

## Owner Acceptance

Raw receipt audits prove whether files are structurally valid and countable. Release readiness requires owner acceptance of specific receipt ids.

Review the audit output, then write the private acceptance manifest with explicit receipt ids:

```bash
node app/cli/resume.mjs accept --input receipts --out receipts/ACCEPTED_RECEIPTS.json --owner "OWNER NAME" --receipt-ids rbv-1234abcd,rbv-5678efab
```

The `accept` command refuses missing, duplicate, malformed, structurally invalid, incomplete, anonymous, or assisted receipt ids. Use [receipts/ACCEPTED_RECEIPTS.example.json](receipts/ACCEPTED_RECEIPTS.example.json) only as the schema reference.

`receipts/ACCEPTED_RECEIPTS.json` is private evidence and is ignored by Git.

Use `--accepted` to audit only owner-accepted receipts:

```bash
node app/cli/resume.mjs validate --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --require-completions 5 --require-interviews 10 --window-days 7
```

## Audit Output

Use `--json` to produce machine-readable audit output:

```bash
node app/cli/resume.mjs validate --input receipts --json
```

The audit reports:

- Valid and invalid receipt counts.
- Unique completion users.
- Interview-producing receipt count.
- Best interview-producing window for the configured `--window-days`.
- Owner review candidate receipt ids and an acceptance command template.
- Per-receipt errors for malformed or contradictory receipts.

## Owner Decision

The project can be called complete only after the owner accepts enough real receipts to satisfy both gates or explicitly waives those gates in writing.

Audit that decision gate locally:

```bash
node app/cli/resume.mjs release --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --waiver receipts/VALIDATION_WAIVER.md
```

The release audit exits zero only when the owner-accepted receipt cohort passes or the waiver file is explicit and structurally valid. Use [receipts/VALIDATION_WAIVER.example.md](receipts/VALIDATION_WAIVER.example.md) as the required waiver format.
