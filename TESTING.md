# Contributing

Thanks for working on Barrier Management — Bowtie. This document is the **shortest possible** path to making contributions land cleanly.

## Before you start

1. Read [`/CLAUDE.md`](../../CLAUDE.md) — even if you're a human. It's the operating manual.
2. Read [`/docs/README.md`](../README.md) — the doc index.
3. Read the spec section relevant to your change.

## Branching

- `main` is protected. Production deploys from `main`.
- Feature branches: `feat/<scope>-<short-name>`.
- Fix branches: `fix/<scope>-<short-name>`.
- Doc-only branches: `docs/<scope>-<short-name>`.

## Commits

Conventional Commits. One logical change per commit.

```
feat(bowtie): add 6-stage approval state machine
fix(audit): handle null before-snapshot on create
chore(deps): bump zod to 3.23
docs(adr): add ADR-0007 for liveblocks
test(methodology): add property tests for health calculator
```

## Pull requests

Every PR must:

- Link the story / prompt / issue it addresses.
- Show acceptance criteria coverage.
- Include tests at the appropriate level (unit / integration / e2e).
- Pass CI: lint, typecheck, all test suites, build, Lighthouse, axe-core.
- Not drop coverage below thresholds — see [`TESTING.md`](TESTING.md).
- Have an ADR if the PR makes a structural decision.

The PR template will prompt you for these.

## Code style

- TypeScript strict everywhere.
- ESLint + Prettier; auto-fix runs in `pnpm lint`.
- Imports use the `@bowtie/*` aliases.
- No `any`. No `// @ts-ignore` without a justification comment.
- Component and file naming: `PascalCase.tsx` for components, `kebab-case.ts` for utilities.

## Methodology

If a change touches methodology — barriers, risk, approval, AI — the spec wins. If you think the spec is wrong, **stop and write an ADR** before changing code. Don't sneak methodology drift into a "small" feature PR.

Words that get rejected at review:

- "Escalation Factor" / "EFB" → use **Degradation Factor / Degradation Control**.
- 2-level risk shortcuts → always 4 levels.
- Auto-promoting a compensated red barrier → it stays Red.
- "AI auto-approves" → AI is advisory only, ever.

## Testing

See [`TESTING.md`](TESTING.md). The short version: tests in the same PR as the code, never deferred.

## Review

Two human reviewers required for:

- `packages/methodology/**`
- `apps/web/lib/services/**`
- `apps/web/lib/auth/**`
- `apps/web/middleware.ts`
- `apps/web/prisma/schema.prisma` and migrations
- Anything in `docs/decisions/`

One reviewer is fine for everything else, but Risk-Manager-equivalent sign-off is needed for changes that touch the approval gate, the health calculator, or the AI guardrails.

## Releases

- Tag releases: `v<MAJOR>.<MINOR>.<PATCH>`.
- Changelog auto-generated from Conventional Commits.
- Production deploy is gated behind manual approval after CI green on `main`.
