# resume/

Local-first resume and job-application workspace.

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

Current required checks are typecheck, Playwright smoke tests, and production build.
