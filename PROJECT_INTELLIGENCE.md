# Project Intelligence: `resumebuilder-app`

Open this file before changing code.

## Current Status Update: 2026-06-10

The findings below were the original intelligence pass, not the current implementation state.

Current production status lives in `PRODUCTION_STATUS.md`.

The core fake/static findings below have been remediated in `app/`: tailoring, diff, ATS scoring, versions, PDF export, cover letter, outreach, social, interview, self-host, CLI, plugin SDK, and CI now have executable implementations and tests.

Do not use the "Current Reality" section below as current truth without first checking `PRODUCTION_STATUS.md` and the current source tree.

## Most Surprising Discovery

The product’s most valuable next milestone excludes most of the product the prototype already shows.

The root prototype correctly defines a broad job-application workspace, but the deployed app has already copied that breadth before proving the one loop that can make the product defensible: paste a job description, generate truthful resume edits with visible receipts, accept the edits, and export the result.

Any new work that expands cover letters, outreach, social profile polish, interview prep, self-hosting, Docker, CLI, plugins, or mobile-specific surfaces before dynamic JD tailoring works will increase product theater.

## True Mission

Build a local-first, no-account job application workspace where JSON Resume is the owned source of truth, the user pastes a job description, the app produces an application-specific resume draft with transparent before/after receipts, and the user exports a truthful PDF/JSON package without surrendering data to a hosted account system.

The mission is not “make a beautiful resume builder.”

The mission is not “recreate every prototype screen.”

The mission is “help a job seeker turn an existing resume into a role-specific application package that improves interview odds and remains portable.”

## Current Reality

The production app lives in `/app`.

The original design canvas lives at the repo root and must be treated as a visual and intent spec.

The workspace is not a Git repository; no commit history exists in `/data/code/resumebuilder-app`.

The deployed app is a Vite React SPA with hash routes for Home, Editor, Tailor, AI diff, Templates, Versions, Letter, Outreach, Social, Interview, and Self-host.

The editor has real local editing, local persistence, JSON import, JSON export, template switching, and browser print.

The tailoring loop is fake because it uses static keywords, static diff rows, and a hardcoded Vercel/Maya rewrite path.

The ATS score is fake as a hiring signal because it is five boolean checks: contact, summary length, experience count, numeric bullet, and skills count.

The versions page is fake because it renders constants instead of stored application forks.

The cover letter, outreach, social, interview, and self-host pages are presentation surfaces because their outputs are static and disconnected from resume/JD state.

The PDF action is browser print, not deterministic PDF generation.

The root prototype contains dead or misleading implementation signals, including undefined template components, a missing `.design-canvas.state.json`, and Babel/CDN development runtime usage.

The app has Playwright installed but no test script or test files.

The app emits public source maps through `vite.config.ts`.

The repo has Cloudflare Pages residue in `.wrangler/cache/pages.json` but no `wrangler.toml`.

## Drift Verdict

The drift from the April prototype to the May Vite app was learning because it created a deployable app shell, local persistence, JSON import/export, a resume preview, and Cloudflare Pages deployment.

The drift became decay when the app copied the prototype’s surface area without implementing the underlying behavior behind Tailor, AI diff, Versions, Outreach, Self-host, and profile polish.

The current failure mode is breadth-first mimicry.

The correction is a hard milestone gate: no new surface area until deterministic JD tailoring produces patch-shaped edits from arbitrary resume/JD input.

## Critical Path

Milestone: ship a local MVP where a user can paste an arbitrary JD, get computed keyword gaps and patch-shaped resume edits, accept the draft, and export JSON/PDF.

1. Create `app/src/lib/tailoring.ts`.

2. Implement a pure function with this contract:

```ts
analyzeTailoring(resume: ResumeData, jd: string): {
  job: { title: string; company: string; source: "parsed" | "unknown" };
  keywords: Array<{ label: string; hit: boolean; weight: "high" | "medium" | "low" }>;
  score: { base: number; tailored: number; delta: number };
  patches: Array<{ target: string; reason: string; before: string; after: string }>;
  draftResume: ResumeData;
}
```

3. Replace the static `keywords`, static `diffRows`, and hardcoded `applyTailoredDraft` in `app/src/App.tsx`.

4. Make Tailor preview `draftResume` from the current JD.

5. Make AI diff render computed patches.

6. Make Accept all apply `draftResume` only after the user clicks.

7. Replace hardcoded Vercel-specific labels when parsing fails.

8. Expose all eight templates from the editor sidebar or route the user to Templates.

9. Rename PDF to Print until deterministic PDF generation exists.

10. Add `typecheck`, `test:smoke`, and `build` scripts.

11. Add a Playwright smoke test for this path: edit basics, paste non-Vercel JD, see computed missing keyword, accept draft, export JSON, trigger print.

12. Disable or label non-real surfaces as “prototype” until they consume actual workspace state.

## Explicit Exclusions

Do not add more homepage sections.

Do not add more templates.

Do not expand social profile polish.

Do not expand cover letters.

Do not expand outreach.

Do not expand interview prep.

Do not build Docker.

Do not build CLI.

Do not build plugin SDK.

Do not add accounts.

Do not add analytics.

Do not add cloud sync.

Do not integrate Anthropic until deterministic local tailoring proves the UX contract.

Do not build PDF import.

Do not build LinkedIn import.

Do not polish the root design canvas.

Do not treat `app/dist` as source.

## Kill Criteria

Kill or pause the project on 2026-06-17 if the active roadmap is not narrowed to editor plus real JD tailoring.

Kill or pause the project on 2026-07-01 if arbitrary pasted JDs do not produce computed keywords, computed diffs, and resume edits without hardcoded Vercel, Maya, or Figma strings.

Kill or pause the project on 2026-07-08 if ATS scoring is not backed by a local fixture corpus and repeatable scoring tests.

Kill or pause the project on 2026-07-15 if five users cannot import or edit a resume, paste a JD, accept a tailored draft, and export JSON/PDF without operator assistance.

Kill or pause the project on 2026-08-31 if opt-in users do not report at least ten interview-producing resumes per week.

## Execution Pack

### Prompt 1: Local Tailoring Engine

In `/data/code/resumebuilder-app/app`, add `src/lib/tailoring.ts`. Implement `analyzeTailoring(resume: ResumeData, jd: string)` as a pure local function. Extract role/company when obvious, extract weighted keywords from the JD, compare against resume text, compute base and tailored scores, generate patch-shaped edits for summary, one relevant work bullet, and skills, and return `draftResume`. Do not call external APIs. Do not edit UI files. Add small exported helpers only if they keep the function testable.

### Prompt 2: Tailor UI Wiring

In `/data/code/resumebuilder-app/app/src/App.tsx`, replace static `keywords`, static `diffRows`, and hardcoded `applyTailoredDraft` with `analyzeTailoring(resume, jd)`. Tailor must show computed job labels, keyword hits, score delta, suggestions, and `draftResume`. Accept all must apply `draftResume` only after a click. Keep existing import/export/print behavior intact.

### Prompt 3: Diff Receipts

In `/data/code/resumebuilder-app/app/src/App.tsx`, make the AI diff page consume computed patches from the current tailoring result. Render target, reason, before, and after for each patch. Remove static Vercel/Maya assumptions from the diff page. Keep the visual style.

### Prompt 4: Smoke Tests

In `/data/code/resumebuilder-app/app`, add Playwright smoke tests and package scripts. The test must load the app, edit the resume name, paste a non-Vercel JD, verify at least one computed missing keyword appears, accept the tailored draft, export JSON, and trigger print. The test must fail if the Tailor page still shows only fixed Vercel/Maya/Figma output.

### Prompt 5: Truthful Labels

In `/data/code/resumebuilder-app/app`, audit user-facing labels that imply live behavior. Rename PDF to Print until deterministic PDF exists. Mark Versions, Letter, Outreach, Social, Interview, and Self-host as prototype surfaces unless they consume workspace state. Do not remove routes. Do not add new features.

### Prompt 6: Deployment Hygiene

In `/data/code/resumebuilder-app/app`, disable public production source maps, add a `wrangler.toml` or documented deploy command for Cloudflare Pages, and ensure generated build artifacts are ignored. Do not commit `dist` as source. Keep `pnpm build` passing.

## Standing Context Anchor

Every future agent must preserve this invariant: the only milestone that matters next is a truthful local JD-tailoring loop that turns arbitrary resume/JD input into patch-shaped edits the user can inspect, accept, and export.

Any task outside that invariant must name the kill criterion it advances.

Any UI that does not consume real resume/JD/workspace state must be labeled as prototype or removed from the critical path.

Any AI feature must return structured patches with before, after, target, and reason.

Any export must preserve JSON Resume as the owned canonical format.

Any product claim must be backed by executable behavior or a failing test.

## Evidence Index

- Original intent: `strategy.jsx`, `landing.jsx`, `extras.jsx`, root `index.html`.
- Production app: `app/src/App.tsx`, `app/src/lib/resume.ts`, `app/src/styles.css`.
- Current package scripts: `app/package.json`.
- Deployment residue: `.wrangler/cache/pages.json`.
- Prototype runtime: root `index.html`.
- Dead prototype signals: `data.jsx`, `design-canvas.jsx`.
