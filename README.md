# resume/

Local-first resume and job-application workspace.

Current production status: [PRODUCTION_STATUS.md](PRODUCTION_STATUS.md).

Real-user validation protocol: [VALIDATION.md](VALIDATION.md).

## App

```bash
cd app
pnpm install
pnpm dev
```

Production checks:

```bash
pnpm typecheck
pnpm test:smoke
pnpm build
```

Deploy to Cloudflare Pages:

```bash
pnpm deploy:pages
```

## CLI

Score a JSON Resume:

```bash
cd app
node cli/resume.mjs score --input resume.json
```

Export normalized JSON and PDF:

```bash
node cli/resume.mjs export --input resume.json --out exports --json --pdf
```

Audit exported validation receipts:

```bash
node app/cli/resume.mjs validate --input receipts --require-completions 5 --require-interviews 10 --window-days 7
```

Audit the release decision gate:

```bash
node app/cli/resume.mjs release --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --waiver receipts/VALIDATION_WAIVER.md
```

## Docker

```bash
cd app
docker build -t resumebuilderapp .
docker run --rm -p 3210:80 resumebuilderapp
```

Open `http://localhost:3210`.

## Plugin SDK

Templates can be defined with `defineTemplate` from `app/src/lib/plugins.ts`.

```ts
import { defineTemplate } from "./src/lib/plugins";

export const plain = defineTemplate({
  id: "plain",
  name: "Plain",
  description: "Plain text resume renderer.",
  render: (resume) => `${resume.basics.name}\n${resume.summary}`,
});
```

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`.

Current required checks are typecheck, Playwright smoke tests, production build, and Docker image build.

## Validation

The app has a local Validate page that exports `rbv-*.json` receipts after a tester completes the core resume/JD/diff/export loop. Receipts are tester-controlled, include a run id plus integrity digest, and do not include the full resume body or pasted job description body. Put receipts in [receipts](receipts) and run `node app/cli/resume.mjs validate --input receipts --json` to audit a cohort. List owner-accepted receipt ids in `receipts/ACCEPTED_RECEIPTS.json`, then run `node app/cli/resume.mjs release --input receipts --accepted receipts/ACCEPTED_RECEIPTS.json --waiver receipts/VALIDATION_WAIVER.md --json` to prove whether the external validation gate is satisfied by accepted receipts or an explicit owner waiver.

## License

MIT.
