# Production Status

Last verified: 2026-06-10 10:20 UTC.

## Live App

Production URL: `https://resumebuilder.app`.

Cloudflare Pages project: `resumebuilderapp`.

Latest verified Pages deployment: `https://3ef046fe.resumebuilderapp.pages.dev`.

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
- Validate: local tester-controlled validation runs with integrity-checked receipts for five-user completion and interview-producing outcome evidence.
- Self-host: documented Cloudflare Pages, Docker, local CLI, validation receipt audit, local receipt collection, CI, and plugin SDK paths.

## Verification

Latest code-bearing commit verified by CI and deployed to Pages: `5b74eb1e9667851f123bdc6fae74047296351dbd`.

GitHub Actions CI: `https://github.com/thcllc/resumebuilder-app/actions/runs/27269505902`.

CI status: success. The `app` job passed install, typecheck, Chromium browser install, Playwright smoke tests, and production build. The `docker` job passed the Docker image build.

Cloudflare Pages deployment: `https://3ef046fe.resumebuilderapp.pages.dev`.

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

Live smoke status: 15 Playwright tests passed against both `https://resumebuilder.app` and `https://3ef046fe.resumebuilderapp.pages.dev`.

Local Playwright preview defaults to port `49217`; override with `PLAYWRIGHT_PORT` if that port is occupied. Local and deployed Playwright artifacts are separated under `test-results/local` and `test-results/deployed`.

Current smoke suite covers:

- ATS scoring corpus.
- Deterministic PDF generation.
- CLI scoring, JSON/PDF export, and validation receipt cohort audit.
- Template plugin SDK.
- Validation receipt generation with run metadata, integrity digest, and no embedded full resume or JD bodies.
- Full browser path from edit through JD tailoring, diff accept, versions, JSON/PDF export, letter, outreach, interview, social, validation receipt export, and self-host surfaces.

## Known External Verification Gaps

- Local Docker build was not run because the current environment has no `docker`, `podman`, `nerdctl`, or `buildah` binary. Docker image build is verified by GitHub Actions CI run `27269505902`.
- Product-market validation remains external to the repo: five-user completion and interview-producing-resume metrics require real users.
- The Validate page, `node app/cli/resume.mjs validate`, [receipts](receipts), and [VALIDATION.md](VALIDATION.md) now define the fresh-run workflow, receipt format, integrity checks, local receipt collection, cohort auditor, and protocol for collecting that evidence, but no real-user receipt cohort has been accepted in this repository.

## Release Gate

Do not call the project complete unless all of these are true:

- `git status --short --branch` is clean.
- Local typecheck, smoke tests, and build pass.
- Live custom-domain smoke tests pass against `https://resumebuilder.app`.
- Docker build is verified either locally or by GitHub Actions.
- A remote repository exists and CI is green.
- The owner has accepted enough external validation receipts to satisfy [VALIDATION.md](VALIDATION.md), or explicitly waived that evidence gate.
