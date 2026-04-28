# Prompt 01 — Foundation

## Role & Context

You are setting up the empty repository for **Barrier Management — Bowtie**. The goal is a working pnpm + Turborepo monorepo with Next.js + worker apps and shared packages, deployable to Vercel preview, with CI green from day one.

Stay strictly inside the foundation scope — no domain logic, no UI work beyond a "Hello" page.

## Read first

- `/CLAUDE.md` — operating manual.
- `/docs/08_PACKAGE_STRUCTURE.md` — folder layout, stack decisions, env vars, CI/CD pipeline.
- `/docs/09_SPRINT_1_BACKLOG.md` — story S1-01, S1-02, S1-08.

## Deliverables

### Root config

- `package.json` (root) — workspace declaration, scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `db:reset`, `db:studio`.
- `pnpm-workspace.yaml` listing `apps/*` and `packages/*`.
- `turbo.json` with the task pipeline from `08_PACKAGE_STRUCTURE.md` §7.
- `tsconfig.base.json` with path aliases per `08_PACKAGE_STRUCTURE.md` §5.
- `.nvmrc` → Node 20.
- `.gitignore` — node, build artifacts, env files, prisma cache, vercel, turbo cache, OS files.
- `.env.example` populated with the canonical env-var list from `08_PACKAGE_STRUCTURE.md` §6.
- `LICENSE` placeholder (TBD — note in file).

### Apps

- `apps/web/` — Next.js 15 (App Router), TypeScript strict, Tailwind, App Router. Renders "Hello" at `/`. Has a `tests/` folder with one passing Playwright test that checks the "Hello" text.
- `apps/worker/` — Node 20 service that logs `worker ready (env=<env>)` and exits cleanly on SIGTERM. Has a `tests/` folder with one passing test.
- `apps/realtime/` — minimal Express server that returns `{ status: "ok" }` at `/health`. Optional for MVP, but scaffold it.

### Packages

- `packages/shared/` — empty `index.ts`, vitest config, one passing test.
- `packages/ui/` — empty `index.ts`, vitest config, one passing test.
- `packages/methodology/` — empty `index.ts`, vitest config, one passing test.
- `packages/config/` — eslint preset, prettier config, shared tsconfig fragments. Each as its own subfolder with a `package.json`.

### CI

- `.github/workflows/ci.yml` — on PR + push to main: lint, typecheck, test, build. Use Node 20 + pnpm cache.
- `.github/workflows/deploy-preview.yml` — leverage Vercel's GitHub integration; ensure preview URL is commented on PR.
- `.github/PULL_REQUEST_TEMPLATE.md` — a template that asks: linked story, AC met, tests added, ADR needed, screenshots if UI.
- `.github/CODEOWNERS` — `/docs/` requires review.
- `.github/dependabot.yml` — npm + GitHub Actions, weekly.

### Vercel

- `infra/vercel/vercel.json` — monorepo build config: build `apps/web`, install with pnpm.

### README placeholders

- `apps/web/README.md`, `apps/worker/README.md`, `apps/realtime/README.md`, `packages/*/README.md` — one paragraph each describing the package's purpose and pointing to `/docs/08_PACKAGE_STRUCTURE.md`.

## Acceptance criteria

- [ ] `pnpm install` succeeds from clean clone.
- [ ] `pnpm dev` starts `apps/web` at `http://localhost:3000` showing "Hello".
- [ ] `pnpm dev --filter worker` starts the worker which logs `worker ready`.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass.
- [ ] Path aliases (`@bowtie/shared`, `@bowtie/ui`, `@bowtie/methodology`, `@/lib/*`, `@/components/*`) resolve in `apps/web` and `apps/worker`.
- [ ] CI pipeline runs and passes on a sample PR.
- [ ] Vercel preview URL appears as a PR comment.
- [ ] No `// @ts-ignore`, no `eslint-disable` without a justification comment.

## Tests required

- 1 vitest unit test per package and per app (proves the test runner works).
- 1 Playwright e2e test for `apps/web` proving the "Hello" page renders.
- CI runs all of the above on every PR.

## Definition of done

- [ ] All deliverables shipped.
- [ ] All acceptance criteria checked.
- [ ] All tests passing locally and in CI.
- [ ] Branch merged to `main`.
- [ ] Vercel preview accessible.
- [ ] Summary block per `/CLAUDE.md` §8.
