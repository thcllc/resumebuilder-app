# Production Status

Last verified: 2026-06-10.

## Live App

Production URL: `https://resumebuilder.app`.

Cloudflare Pages project: `resumebuilderapp`.

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
- Self-host: documented Cloudflare Pages, Docker, local CLI, CI, and plugin SDK paths.

## Verification

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

Current smoke suite covers:

- ATS scoring corpus.
- Deterministic PDF generation.
- CLI scoring and JSON/PDF export.
- Template plugin SDK.
- Full browser path from edit through JD tailoring, diff accept, versions, JSON/PDF export, letter, outreach, interview, social, and self-host surfaces.

## Known External Verification Gaps

- Dockerfile is present and covered by GitHub Actions Docker build configuration, but local Docker build was not run because the current environment has no `docker`, `podman`, `nerdctl`, or `buildah` binary.
- GitHub Actions cannot run until this local repository is pushed to a remote GitHub repository; no Git remote is configured in this workspace.
- Product-market validation remains external to the repo: five-user completion and interview-producing-resume metrics require real users.

## Release Gate

Do not call the project complete unless all of these are true:

- `git status --short --branch` is clean.
- Local typecheck, smoke tests, and build pass.
- Live custom-domain smoke tests pass against `https://resumebuilder.app`.
- Docker build is verified either locally or by GitHub Actions.
- A remote repository exists and CI is green.
- The owner has accepted external user-validation evidence or explicitly waived it.
