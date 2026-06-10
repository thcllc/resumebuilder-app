# Production Status

Last verified: 2026-06-10 09:48 UTC.

## Live App

Production URL: `https://resumebuilder.app`.

Cloudflare Pages project: `resumebuilderapp`.

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
- Validate: local tester-controlled receipts for five-user completion and interview-producing outcome evidence.
- Self-host: documented Cloudflare Pages, Docker, local CLI, CI, and plugin SDK paths.

## Verification

Verified implementation and CI workflow commit: `5e88ed81a48984bcec0ebd436a08c6bbd08eb987`.

GitHub Actions CI: `https://github.com/thcllc/resumebuilder-app/actions/runs/27267849706`.

CI status: success. The `app` job passed install, typecheck, Chromium browser install, Playwright smoke tests, and production build. The `docker` job passed the Docker image build.

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

Local Playwright preview defaults to port `49217`; override with `PLAYWRIGHT_PORT` if that port is occupied. Local and deployed Playwright artifacts are separated under `test-results/local` and `test-results/deployed`.

Current smoke suite covers:

- ATS scoring corpus.
- Deterministic PDF generation.
- CLI scoring and JSON/PDF export.
- Template plugin SDK.
- Validation receipt generation without embedding full resume or JD bodies.
- Full browser path from edit through JD tailoring, diff accept, versions, JSON/PDF export, letter, outreach, interview, social, validation receipt export, and self-host surfaces.

## Known External Verification Gaps

- Local Docker build was not run because the current environment has no `docker`, `podman`, `nerdctl`, or `buildah` binary. Docker image build is verified by GitHub Actions CI run `27267849706`.
- Product-market validation remains external to the repo: five-user completion and interview-producing-resume metrics require real users.
- The Validate page and [VALIDATION.md](VALIDATION.md) now define the receipt format and protocol for collecting that evidence, but no real-user receipt cohort has been accepted in this repository.

## Release Gate

Do not call the project complete unless all of these are true:

- `git status --short --branch` is clean.
- Local typecheck, smoke tests, and build pass.
- Live custom-domain smoke tests pass against `https://resumebuilder.app`.
- Docker build is verified either locally or by GitHub Actions.
- A remote repository exists and CI is green.
- The owner has accepted enough external validation receipts to satisfy [VALIDATION.md](VALIDATION.md), or explicitly waived that evidence gate.
