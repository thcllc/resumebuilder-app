# Validation Campaign Pack

Use this pack to collect the external evidence required before the project can be called complete.

Do not commit tester receipts, active owner acceptance manifests, or active waiver files.

## Owner Checklist

1. Recruit at least five real testers who are actively applying to jobs.
2. Send each tester the invite below.
3. Store returned `rbv-*.json` files in the local `receipts/` folder.
4. Run the raw cohort audit.
5. Review each receipt id and reject any receipt that is invalid, anonymous, assisted, incomplete, duplicated, or privacy-violating.
6. Write the private owner acceptance manifest with explicit accepted receipt ids.
7. Run the accepted cohort audit.
8. Run the release audit.
9. Continue follow-up until accepted receipts prove ten interview-producing resumes in a seven-day window, or record an explicit owner waiver.

## Tester Invite

Copy and send this message to each tester:

```text
I need a no-account validation run for Resume Builder.

Open https://resumebuilder.app/#validate and click Start new run.

Use your own resume or edit the sample into a usable resume.

Paste a real job description for a role you would apply to.

Review the computed diff, accept the tailored draft only if it is truthful, then export JSON and PDF.

Return to Validate, enter a non-anonymous tester label, check the no-assistance attestation only if you completed the run without help, choose the outcome, add notes if an interview or offer happened, and export the receipt.

Send back only the exported rbv-*.json file unless you explicitly want to share your resume or job description.

The receipt does not include your full resume body or pasted job description body.
```

## Outcome Follow-Up

Send this after the tester applies with an exported resume:

```text
Did the application created with Resume Builder lead to an interview, recruiter screen, offer, rejection, no response, or no submission?

If it led to an interview, recruiter screen, or offer, please open https://resumebuilder.app/#validate, use the same resume/JD context if available, set Outcome to Interview or Offer, add a short outcome note such as "recruiter screen booked June 18", and export a fresh rbv-*.json receipt.
```

## Local Commands

Run these from the repository root.

Audit all returned receipts:

```bash
node app/cli/resume.mjs validate --input receipts --require-completions 5 --require-interviews 10 --window-days 7
```

The audit prints owner review candidate receipt ids. Use the candidate list to review files, not as automatic acceptance.

Write the private owner acceptance manifest after review:

```bash
node app/cli/resume.mjs accept --input receipts --out receipts/ACCEPTED_RECEIPTS.json --owner "OWNER NAME" --receipt-ids rbv-1234abcd,rbv-5678efab
```

Audit only owner-accepted receipts:

```bash
node app/cli/resume.mjs validate --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --require-completions 5 --require-interviews 10 --window-days 7
```

Run the release decision audit:

```bash
node app/cli/resume.mjs release --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --waiver receipts/VALIDATION_WAIVER.md
```

## Tracker

Keep the live tracker in a private note or evidence store. Do not commit tester-identifying details without consent.

| Tester label | Receipt id | Accepted | Outcome | Outcome note present | Follow-up date | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| tester-01 | rbv-________ | no | sent | no | YYYY-MM-DD | pending owner review |
| tester-02 | rbv-________ | no | sent | no | YYYY-MM-DD | pending owner review |
| tester-03 | rbv-________ | no | sent | no | YYYY-MM-DD | pending owner review |
| tester-04 | rbv-________ | no | sent | no | YYYY-MM-DD | pending owner review |
| tester-05 | rbv-________ | no | sent | no | YYYY-MM-DD | pending owner review |

## Acceptance Rules

Accept a receipt only when all of these are true:

- The CLI reports the receipt as structurally valid.
- `completion.coreFlowComplete` is `true`.
- `attestations.noOperatorAssistance` is `true`.
- `tester.label` is non-anonymous.
- The tester actually completed the workflow without operator assistance.
- The receipt id is unique in the evidence folder.
- The owner accepts the receipt as real-user validation evidence.

Count a receipt as interview-producing only when `outcome.status` is `interview` or `offer` and `outcome.notes` states real follow-up evidence.
