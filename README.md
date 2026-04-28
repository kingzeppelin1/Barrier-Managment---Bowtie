# Barrier Management — Bowtie

ISO 31000-aligned bowtie & barrier-management SaaS module. Multi-tenant, methodology-honest, audit-traceable.

> ⚠️ **Status:** Sprint 1 (Foundation). Story S1-01 scaffolding lands here — domain logic, the 12-step Wizard, the canvas, and the AI assistant arrive in later sprints. See [`docs/09_SPRINT_1_BACKLOG.md`](docs/09_SPRINT_1_BACKLOG.md) and [`docs/10_MVP_BUILD_SEQUENCE.md`](docs/10_MVP_BUILD_SEQUENCE.md).

## Read first

1. [`CLAUDE.md`](CLAUDE.md) — operating manual for any contributor (human or Claude Code).
2. [`docs/08_PACKAGE_STRUCTURE.md`](docs/08_PACKAGE_STRUCTURE.md) — repo layout and stack decisions.
3. [`docs/09_SPRINT_1_BACKLOG.md`](docs/09_SPRINT_1_BACKLOG.md) — current sprint stories.
4. [`docs/11_GLOSSARY.md`](docs/11_GLOSSARY.md) — methodology terminology (Hazard, Top Event, Barrier, DF/DC, …).
5. [`docs/guides/CONTRIBUTING.md`](docs/guides/CONTRIBUTING.md) — how to land changes.

The 10 sequential implementation prompts live in [`docs/prompts/`](docs/prompts/).

## Stack (fixed for MVP)

- **Web + API:** Next.js 15 (App Router) — `apps/web`
- **Worker:** Node 20 + BullMQ — `apps/worker`
- **Domain logic:** pure TypeScript — `packages/methodology`
- **Schemas / types:** zod — `packages/shared`
- **UI primitives:** React 19 — `packages/ui`
- **Database:** Postgres 16 + Prisma + RLS (per-tenant)
- **Tooling:** pnpm + Turborepo + Vitest + Playwright

## Repository layout

```
apps/
  web/         # Next.js 15 App Router (Hello page today)
  worker/      # BullMQ worker (logs `worker ready` today)
packages/
  shared/      # zod schemas + types
  ui/          # shared React components
  methodology/ # pure-function domain logic — heart of the codebase
  config/      # eslint / prettier / tsconfig fragments
docs/
  prompts/     # 10 sequential Claude Code prompts
  decisions/   # ADRs
  guides/      # CONTRIBUTING etc.
infra/vercel/  # Vercel monorepo build config
.github/       # workflows, CODEOWNERS not-yet-relocated, templates
```

## Prerequisites

- **Node 20** (use `nvm use` or [Volta](https://volta.sh/))
- **pnpm 9** (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)
- **Postgres 16** (only needed once Sprint 1 story S1-03 lands)

## Quickstart

```bash
pnpm install                  # install workspace dependencies
pnpm typecheck                # tsc across the monorepo
pnpm test                     # vitest across the monorepo
pnpm dev --filter web         # Next.js at http://localhost:3000
pnpm dev --filter worker      # logs "worker ready (env=development)"
```

`pnpm build` runs the full Turborepo pipeline (`apps/web` produces a Next.js build; packages typecheck).

## Spec documents

The full spec (split from the original Word brief) lives under [`docs/`](docs/):

- [`00_RECONCILIATION_NOTES.md`](docs/00_RECONCILIATION_NOTES.md) — what we kept from the brief, what we changed, why.
- [`01_PRODUCT_SPEC.md`](docs/01_PRODUCT_SPEC.md) — purpose, FRs, NFRs, MVP scope.
- [`02_DATA_MODEL.md`](docs/02_DATA_MODEL.md) — entities, relationships, indexes.
- [`03_WORKFLOWS_AND_VALIDATION.md`](docs/03_WORKFLOWS_AND_VALIDATION.md) — state machines, validation rules, RBAC.
- [`04_UI_UX_AND_REPORTS.md`](docs/04_UI_UX_AND_REPORTS.md) — IA, the canvas, side panel, PDF export.
- [`05_ARCHITECTURE_SECURITY_ACCEPTANCE.md`](docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md) — architecture, security, release-blocking AC.
- [`07_AI_AGENT.md`](docs/07_AI_AGENT.md) — Bowtie Assistant guardrails + canonical 6-field schema.
- [`08_PACKAGE_STRUCTURE.md`](docs/08_PACKAGE_STRUCTURE.md), [`09_SPRINT_1_BACKLOG.md`](docs/09_SPRINT_1_BACKLOG.md), [`10_MVP_BUILD_SEQUENCE.md`](docs/10_MVP_BUILD_SEQUENCE.md), [`11_GLOSSARY.md`](docs/11_GLOSSARY.md).
- [`references/50_BOWTIE_ISO31000_LINKS.md`](docs/references/50_BOWTIE_ISO31000_LINKS.md) — curated bibliography.

Position number 06 is reserved (the original brief had a roadmap section, now superseded by [`docs/prompts/`](docs/prompts/) and [`docs/10_MVP_BUILD_SEQUENCE.md`](docs/10_MVP_BUILD_SEQUENCE.md)).

## License

TBD — see [`LICENSE`](LICENSE).
