<!--
  Pull-request template — keep it short, keep it honest.
-->

## Linked story / prompt

- Story: <!-- e.g. S1-01, S2-04 -->
- Prompt: <!-- e.g. docs/prompts/01-foundation.md -->

## What changed

<!-- One paragraph. The "why" matters more than the "what". -->

## Acceptance criteria

<!-- Copy the AC list from the story / prompt and tick what this PR covers. -->

- [ ] …

## Tests

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated (with Testcontainers where DB is touched)
- [ ] E2E (Playwright) added/updated for UI changes
- [ ] Cross-tenant negative test (lists/reads only)
- [ ] Approval-gate test (state-dependent endpoints only)

## ADR

- [ ] No structural decision was made
- [ ] An ADR was added/updated under `docs/decisions/`

## Screenshots / recordings

<!-- Required for any UI change. Drop a Vercel preview URL too. -->

## Checklist

- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass locally
- [ ] No new `// @ts-ignore` or `// eslint-disable` without a justification comment
- [ ] Touched docs are updated in the same PR
- [ ] Audit log + RLS untouched, OR change reviewed by security
