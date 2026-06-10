# Production Status

Last verified: 2026-06-10 11:52 UTC.

## Live App

Production URL: `https://resumebuilder.app`.

Cloudflare Pages project: `resumebuilderapp`.

Latest verified Pages deployment: `https://58e1934a.resumebuilderapp.pages.dev`.

GitHub repository: `https://github.com/thcllc/resumebuilder-app`.

Production source: `app/`.

The root JSX files are retained only as historical design reference. Do not treat root prototype files as production code.

## Implemented Surfaces

- Editor: local resume editing, local persistence, template switching, JSON import, JSON export, and deterministic PDF export.
- Tailor: local deterministic JD analysis, weighted keyword gaps, computed patch-shaped edits, draft preview, and explicit accept.
- Diff: computed before/after receipts from the current resume and JD.
- Versions: local application-specific forks with status, restore, delete, JD, resume, template, and match score.
- Letter: generated locally from the current resume and JD.
- Outreach: generated locally from the current resume and JD with clipboard copy.
- Social: generated local audit for LinkedIn, GitHub, portfolio, and old public-post cleanup.
- Interview: generated local interview prep from the current resume and JD.
- Validate: local tester-controlled validation runs, live validation campaign invite and follow-up text, tester handoff instructions, non-anonymous tester labels, no-assistance attestations, owner review candidate receipt ids, owner acceptance manifest writer handoff, release decision command, and semantically checked integrity receipts for five-user completion and interview-producing outcome evidence.
- Self-host: documented Cloudflare Pages, Docker, local CLI, validation receipt audit, semantic receipt-forgery rejection, owner review candidate receipt ids, owner acceptance writer, owner-accepted release decision audit, local receipt collection, CI, and plugin SDK paths.
- Validation campaign: copy-paste tester invite, outcome follow-up text, owner checklist, private tracker format, and evidence commands in [receipts/CAMPAIGN.md](receipts/CAMPAIGN.md).

## Verification

Latest code-bearing commit verified by CI and deployed to Pages: `de60374490b8f58f53a3e091a4f0174069038695`.

Latest branch-tip commit verified by CI before this status update: `de60374490b8f58f53a3e091a4f0174069038695`.

GitHub Actions CI: `https://github.com/thcllc/resumebuilder-app/actions/runs/27274196437`.

CI status: success. The `app` job passed install, typecheck, Chromium browser install, Playwright smoke tests, and production build. The `docker` job passed the Docker image build.

Cloudflare Pages deployment: `https://58e1934a.resumebuilderapp.pages.dev`.

Local required commands:

```bash
pnpm -C app typecheck
pnpm -C app test:smoke
pnpm -C app build
```

Live smoke command:

```bash
PLAYWRIGHT_BASE_URL=https://resumebuilder.app pnpm -C app test:smoke
```

Live custom-domain check:

```bash
curl -I https://resumebuilder.app
```

Result: HTTP 200 from Cloudflare.

Live smoke status: 31 Playwright tests passed against both `https://resumebuilder.app` and `https://58e1934a.resumebuilderapp.pages.dev`.

Release decision audit:

```bash
node app/cli/resume.mjs release --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --waiver receipts/VALIDATION_WAIVER.md
```

Result: fail. The audit is fail-closed because `receipts/ACCEPTED_RECEIPTS.json` is absent, there are zero owner-accepted receipt JSON files, and no active owner waiver file exists.

Local Playwright preview defaults to port `49217`; override with `PLAYWRIGHT_PORT` if that port is occupied. Local and deployed Playwright artifacts are separated under `test-results/local` and `test-results/deployed`.

Current smoke suite covers:

- ATS scoring corpus.
- Deterministic PDF generation.
- CLI scoring, JSON/PDF export, validation receipt cohort audit, required-checklist enforcement, semantic rejection for integrity-valid forged receipts, outcome contradiction rejection, owner review candidate receipt ids, shell-safe acceptance command templates, owner acceptance manifest writer, owner-accepted receipt manifest audit, release decision audit, tamper rejection, assisted-run de-counting, anonymous-receipt rejection, missing-acceptance fail-closed behavior, accepted-receipt pass, waiver-gate pass, and placeholder waiver or acceptance rejection.
- Template plugin SDK.
- Validation receipt generation with run metadata, non-anonymous tester-label requirement, no-assistance attestation, integrity digest, and no embedded full resume or JD bodies.
- Full browser path from edit through JD tailoring, diff accept, versions, JSON/PDF export, letter, outreach, interview, social, validation tester handoff, live campaign invite and outcome follow-up, validation intake, owner review candidate receipt ids, owner acceptance writer, owner-accepted release commands, non-anonymous tester label, no-assistance attestation, disabled export until countable, validation receipt export, and self-host release audit surfaces.

## Known External Verification Gaps

- Local Docker build was not run because the current environment has no `docker`, `podman`, `nerdctl`, or `buildah` binary. Docker image build is verified by GitHub Actions CI run `27274196437`.
- Product-market validation remains external to the repo: five-user completion and interview-producing-resume metrics require real users.
- The live Validate page, `node app/cli/resume.mjs validate`, `node app/cli/resume.mjs accept`, `node app/cli/resume.mjs release`, [receipts](receipts), [receipts/CAMPAIGN.md](receipts/CAMPAIGN.md), and [VALIDATION.md](VALIDATION.md) now define the fresh-run workflow, receipt format, non-anonymous tester-label requirement, no-assistance attestation, integrity and semantic receipt checks, tester invite, outcome follow-up, local receipt collection, owner review candidate receipt ids, owner acceptance manifest writer, cohort auditor, release decision auditor, waiver format, and protocol for collecting that evidence, but no real-user receipt cohort, owner acceptance manifest, or owner waiver has been accepted in this repository.

## Release Gate

Do not call the project complete unless all of these are true:

- `git status --short --branch` is clean.
- Local typecheck, smoke tests, and build pass.
- Live custom-domain smoke tests pass against `https://resumebuilder.app`.
- Docker build is verified either locally or by GitHub Actions.
- A remote repository exists and CI is green.
- The owner has accepted enough external validation receipts to satisfy [VALIDATION.md](VALIDATION.md), or explicitly waived that evidence gate.
