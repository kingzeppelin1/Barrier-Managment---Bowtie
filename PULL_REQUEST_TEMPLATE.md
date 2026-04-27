# CLAUDE.md — Operating Manual for Claude Code

You are Claude Code, working on the **Barrier Management — Bowtie** SaaS module. This file is the first thing you read in every session. It points to the authoritative documents, the guardrails you must respect, and the workflows you should follow.

---

## 1. Read these first (every session, every task)

In order. Don't skip.

1. This file (`CLAUDE.md`) — your operating manual.
2. [`docs/01_PRODUCT_SPEC.md`](docs/01_PRODUCT_SPEC.md) — vision, scope, FRs, NFRs.
3. [`docs/02_DATA_MODEL.md`](docs/02_DATA_MODEL.md) — entities and relationships.
4. [`docs/03_WORKFLOWS_AND_VALIDATION.md`](docs/03_WORKFLOWS_AND_VALIDATION.md) — state machines, validation rules, RBAC.
5. [`docs/08_PACKAGE_STRUCTURE.md`](docs/08_PACKAGE_STRUCTURE.md) — repo layout and stack decisions.

For UI work, also read [`docs/04_UI_UX_AND_REPORTS.md`](docs/04_UI_UX_AND_REPORTS.md).
For AI work, also read [`docs/07_AI_AGENT.md`](docs/07_AI_AGENT.md).
For acceptance criteria, also read [`docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md`](docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md).

**The documents are the source of truth.** If code disagrees with the documents, the documents win unless an ADR in [`docs/decisions/`](docs/decisions/) explicitly records the deviation.

---

## 2. Methodology guardrails — never weaken these

These are non-negotiable. They are how this product creates safety value, and breaking them creates real-world risk.

1. **Bowtie approval gate is enforced server-side.** Every Approval transition runs the full structural rules in `03_WORKFLOWS_AND_VALIDATION.md` §2.2 + the 8-criteria barrier quality gate in §2.3. No bypass via UI, API, or admin override.

2. **6-stage approval lifecycle cannot be skipped.** Draft → Internal Review → SME Review → Risk Manager Review → Approved → Published. Each stage requires the right role and (for Approve / Publish) step-up MFA.

3. **Approved/Published Bowties are immutable.** Edits require an MOC link OR a tenant config that allows non-substantive (cosmetic) edits. Determine which via diff classification.

4. **Terminology:** **Degradation Factor** and **Degradation Control**. Never "Escalation Factor" or "EFB". The spec is aligned with the current CCPS/EI / CGE methodology corpus.

5. **Four-level risk:** Inherent → Current → Residual → Target. Two-level shortcuts (inherent + residual only) are forbidden.

6. **Documented gap pattern is allowed** but only with: a `gap_record` carrying owner + target_resolution_date + linked Action. A bare missing barrier never passes the approval gate.

7. **Numerical barrier health (0–100)** is the canonical metric. The pure-function calculator in `packages/methodology` is the single source. Automatic floors for critical barriers are not optional.

8. **Compensated red stays red.** A Red barrier with documented compensatory measures is rendered as Red with a `with_compensatory` flag. Never auto-promoted to Green or Yellow.

9. **Audit log is append-only and immutable.** Every state-changing action writes a row with actor, timestamp, RFC 6902 patch diff, comment, IP, request id. No application path may edit or delete audit log rows.

10. **Cross-tenant isolation is defense-in-depth.** Postgres RLS + ORM filter. Cross-tenant access returns 404, not 403, and emits a security event.

---

## 3. AI Agent guardrails

The Bowtie Assistant is **advisory only**. Never weaken these:

1. AI never autonomously creates, modifies, or approves safety-critical content. Every AI suggestion requires a named human reviewer to accept it.
2. Every AI invocation persists an `ai_suggestion` row with `prompt_hash`, `model_id`, full structured output.
3. Every accepted suggestion writes `ai_origin_suggestion_id` on the destination entity.
4. Approval gate **blocks** when any element on the Bowtie has `ai_origin_suggestion_id` pointing to a suggestion whose `reviewer_decision` is null.
5. AI responses must conform strictly to the canonical 6-field schema in `07_AI_AGENT.md` §4. Malformed responses → reject, retry once, then surface error to user. No silent failure.
6. AI never sees data outside the invoking user's permission scope. Verify with positive and negative integration tests.
7. A tenant may disable the AI agent entirely; the rest of the product must remain fully functional.

---

## 4. Engineering guardrails

### 4.1 Stack — fixed for MVP

- **Web + API:** Next.js 15 App Router (Route Handlers for API).
- **Database:** Postgres + Prisma (Vercel Postgres / Neon / Supabase).
- **Auth:** Auth.js (NextAuth) — credentials, OIDC, SAML.
- **Queues:** Upstash Redis + BullMQ.
- **Worker:** Separate `apps/worker` deployed to Railway / Fly / Render.
- **Real-time:** Liveblocks (managed Yjs) for MVP; self-hosted y-websocket optional.
- **AI:** Anthropic Claude via API route in `apps/web`.
- **Storage:** Vercel Blob for evidence files.

Don't introduce new frameworks or services without an ADR.

### 4.2 Repo conventions

- **Monorepo:** pnpm workspaces + Turborepo.
- **Imports:** absolute paths via `@bowtie/*` aliases (configured in `packages/config`).
- **Schemas:** define once in `packages/shared` (zod), generate TypeScript types from there.
- **Domain logic:** put pure functions in `packages/methodology`. They must be deterministic, fully tested, no I/O.
- **API routes:** thin controllers in `apps/web/app/api/**`. Push business logic to service classes in `apps/web/lib/services/`. Push pure logic to `packages/methodology`.
- **Database access:** through Prisma client wrapped in repository functions in `apps/web/lib/repos/`. Never call Prisma directly from a route handler.
- **Audit:** every mutation goes through the `withAudit()` wrapper. If you find yourself writing a mutation outside the wrapper, stop and use the wrapper.

### 4.3 Testing — required, not optional

For every feature you implement, deliver:

- **Unit tests** — pure functions in `packages/methodology` get 100% branch coverage.
- **Integration tests** — every API route has happy-path + at least one validation-failure path + at least one RBAC-rejection path.
- **E2E tests** — Playwright. Required for every UI feature in the MVP backlog. At minimum: the happy path of the user story.
- **Cross-tenant negative tests** — for every list/read endpoint, test that a user from tenant B cannot see tenant A's data. Asserts 404 (not 403).
- **Approval-gate tests** — for any endpoint that depends on Bowtie state, test the rejection path when state is wrong.

Run `pnpm test` and `pnpm test:e2e` before committing. CI will reject PRs that drop coverage.

### 4.4 Database conventions

- Every table: `id` (uuid PK), `tenant_id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete).
- Every tenant-scoped table: RLS policy enforcing `tenant_id = current_setting('app.tenant_id')::uuid`.
- Every migration: reviewed, one logical change per file, named `<timestamp>_<verb>_<noun>.sql`.
- Never destructive migrations on production data without an ADR + dry-run on a snapshot.

### 4.5 Security — non-negotiable

- TLS 1.3 in transit, AES-256 at rest. Vercel handles transit; configure encrypted-at-rest on Vercel Postgres / Neon / Supabase.
- Secrets in Vercel env vars / Doppler / 1Password Connect — never in the repo.
- Step-up MFA for: approve, publish, sign verification, accept ALARP, modify tenant settings.
- Rate-limit auth endpoints. Cap evidence-upload size at 50 MB per file (config).
- All CSP headers configured via Next.js middleware. No inline scripts unless nonce-tagged.
- Webhook delivery is HMAC-SHA256 signed with a per-tenant secret.

### 4.6 Performance

- Server Components by default. Client Components only when needed (forms, canvas, real-time).
- Lighthouse CI budget: LCP < 2.5s, INP < 200ms, CLS < 0.1, TBT < 200ms.
- Bowtie open p95: < 1.5s for ≤ 200 elements.
- Save patch p95: < 800ms.
- Use Vercel Edge runtime where the route is read-only and tenant-scoped read; Node runtime for everything that touches Prisma or BullMQ.

---

## 5. Workflow

For any task:

1. Read this file.
2. Read the prompt being given to you (in `docs/prompts/`).
3. Read the spec sections the prompt references.
4. Restate to yourself: what entity, which file, what AC, what tests.
5. Plan: list the files you'll create or change. Show the plan.
6. Implement: smallest meaningful unit at a time.
7. Test: write tests at the same level you wrote code; run them.
8. Verify: run the full test suite; run linter; run typecheck.
9. Commit: one logical change per commit. Conventional commits: `feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`, `docs(scope): ...`, `test(scope): ...`.
10. Document: if you made a structural decision, write or update an ADR in `docs/decisions/`.

If you're stuck, **stop and ask**. Don't invent methodology, don't invent acceptance criteria, don't pick a different stack. The spec wins.

---

## 6. Commands you'll use

```bash
# Install
pnpm install

# Database
pnpm db:migrate         # run pending migrations
pnpm db:seed            # seed reference data
pnpm db:studio          # open Prisma Studio

# Dev
pnpm dev                # all apps (web, worker, realtime)
pnpm dev --filter web   # just the web app
pnpm dev --filter worker

# Test
pnpm test               # unit + integration
pnpm test:watch
pnpm test:e2e           # Playwright
pnpm test:cov

# Quality
pnpm lint
pnpm typecheck
pnpm format

# Build
pnpm build

# Run a specific package's commands
pnpm --filter @bowtie/methodology test
```

---

## 7. Common pitfalls — don't do these

- ❌ Calling Prisma directly from a route handler. → ✅ Use `lib/repos/`.
- ❌ Putting business rules in a route handler. → ✅ Push to `lib/services/` or `packages/methodology`.
- ❌ Skipping the audit wrapper "just for this one mutation." → ✅ Always wrap.
- ❌ Reading or writing across tenants in code. → ✅ Always scope by `tenantId`. Trust the wrappers.
- ❌ Returning 403 on cross-tenant access. → ✅ Return 404 + emit security event.
- ❌ Adding a column without RLS update. → ✅ Same migration adds the column and updates the RLS policy if needed.
- ❌ Auto-accepting AI suggestions. → ✅ Always require human review.
- ❌ Promoting a Red barrier to Green when compensatory measures exist. → ✅ Stays Red, sets `with_compensatory=true`.
- ❌ Using "Escalation Factor" anywhere in code, comments, UI strings, or docs. → ✅ Always "Degradation Factor / Degradation Control".

---

## 8. When you finish a task

Produce a short summary in this shape:

```
SUMMARY
- What I built: <one line>
- Files added: <list>
- Files changed: <list>
- Tests: <number unit / integration / e2e; coverage delta>
- Migrations: <list, or "none">
- Decisions: <ADR(s) added, or "none">
- Open questions: <list, or "none">
- Next prompt to run: <prompt id>
```

Don't celebrate. Don't pad. Don't say "I have successfully completed..." — just the summary.

---

## 9. Escalation

If any of the following happens, **stop and ask the human**:

- The spec is ambiguous on a methodology point.
- Two parts of the spec contradict each other.
- A test you can't make pass without weakening a guardrail.
- A migration that would lose data.
- A request to add a framework, vendor, or service not in the stack list.
- A request to change the approval lifecycle, the risk model, or the AI advisory model.
