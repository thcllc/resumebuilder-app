# Receipt Collection Runbook

Use this runbook when collecting real-user validation evidence. Do not commit tester receipt JSON files.

## Tester Handoff

Send each tester these instructions:

1. Open `https://resumebuilder.app`.
2. Go to Validate and click `Start new run`.
3. Import or edit a usable resume.
4. Paste a real job description.
5. Review the computed diff and accept the tailored draft.
6. Export JSON and PDF.
7. Return to Validate, enter a non-anonymous tester label, check the no-assistance attestation if true, choose the outcome, add notes if a real interview or offer happened, and click `Export receipt`.
8. Send only the exported `rbv-*.json` receipt unless you explicitly consent to sharing the resume or job description.

## Owner Intake

Place returned receipts in the repository root `receipts/` folder.

Receipt JSON files in this folder are ignored by Git. Keep accepted and rejected receipts locally or in a private evidence store.

Audit the cohort:

```bash
node app/cli/resume.mjs validate --input receipts --require-completions 5 --require-interviews 10 --window-days 7
```

Produce machine-readable output:

```bash
node app/cli/resume.mjs validate --input receipts --json
```

## Acceptance Rules

Accept a completion receipt only when the CLI reports it as valid, `completion.coreFlowComplete` is `true`, `attestations.noOperatorAssistance` is `true`, and the tester completed the flow without operator assistance.

Accept an interview-producing receipt only when the completion receipt is valid, `outcome.status` is `interview` or `offer`, and `outcome.notes` states the real follow-up evidence.

Reject a receipt when the CLI reports a structural error, the integrity digest is invalid, the tester label is anonymous, the receipt duplicates another receipt id, the full resume or job description was embedded, or the tester needed operator assistance.

## Completion Decision

The project can be called complete only after the owner accepts enough real receipts to satisfy `VALIDATION.md`, or explicitly waives the external validation gate in writing.

Audit the completion decision:

```bash
node app/cli/resume.mjs release --input receipts --waiver receipts/VALIDATION_WAIVER.md
```

Use `VALIDATION_WAIVER.example.md` as the waiver format. Do not treat the example file as an active waiver.
