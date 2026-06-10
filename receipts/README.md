# Validation Receipts

Put exported `rbv-*.json` tester receipts in this folder when auditing real-user validation evidence.

Receipt JSON files are ignored by Git so private tester evidence is not committed by accident. The active owner acceptance manifest, `ACCEPTED_RECEIPTS.json`, is also ignored by Git.

Run the audit from the repository root:

```bash
node app/cli/resume.mjs validate --input receipts --require-completions 5 --require-interviews 10 --window-days 7
```

For machine-readable output:

```bash
node app/cli/resume.mjs validate --input receipts --json
```

To audit only receipt ids accepted by the owner, copy [ACCEPTED_RECEIPTS.example.json](ACCEPTED_RECEIPTS.example.json) to `ACCEPTED_RECEIPTS.json`, list accepted receipt ids, then run:

```bash
node app/cli/resume.mjs validate --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --require-completions 5 --require-interviews 10 --window-days 7
```

Collection instructions: [COLLECTION.md](COLLECTION.md).

Waiver format: [VALIDATION_WAIVER.example.md](VALIDATION_WAIVER.example.md).

The project is not complete until the owner accepts enough real receipts to satisfy `VALIDATION.md`, or explicitly waives that evidence gate.
