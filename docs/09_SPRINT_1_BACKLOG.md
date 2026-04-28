# Sprint 1 Backlog — Foundation

**Sprint goal:** Stand up the monorepo, multi-tenant database, auth, audit log infrastructure, and seed data — so that Sprint 2 can start building Bowtie domain logic on a solid foundation.

**Duration:** 2 weeks.
**Team assumption:** 2–3 engineers + 1 reviewer (or Claude Code + 1 human reviewer).
**Definition of "done":** Code merged to `main`, CI green, deployed to a Vercel preview, smoke-tested.

---

## Sprint capacity

Story points use Fibonacci 1–13. Capacity guideline for a 2-engineer sprint: ~30 points. Below totals 28.

---

## Stories

### S1-01 — Repository bootstrap (5 pts)

**As** the team
**I want** a working pnpm + Turborepo monorepo with all apps and packages scaffolded
**So that** every subsequent story has a place to land code

**Acceptance criteria:**
- [ ] Monorepo created with `pnpm-workspace.yaml` listing `apps/*` and `packages/*`.
- [ ] Turborepo configured with `build`, `dev`, `lint`, `test`, `typecheck` pipelines.
- [ ] Path aliases per [`08_PACKAGE_STRUCTURE.md`](08_PACKAGE_STRUCTURE.md) §5 work in all apps.
- [ ] `apps/web` is a Next.js 15 (App Router) app that boots and renders a "Hello" page.
- [ ] `apps/worker` is a Node service that logs "worker ready".
- [ ] `packages/shared`, `packages/ui`, `packages/methodology`, `packages/config` exist with empty index files and a passing test each.
- [ ] `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all succeed.
- [ ] README placeholder at root + each app/package.

**Prompt:** [`prompts/01-foundation.md`](prompts/01-foundation.md)

---

### S1-02 — Vercel deployment + preview URLs (3 pts)

**As** a reviewer
**I want** every PR to deploy a preview to Vercel
**So that** I can visually verify changes before merging

**Acceptance criteria:**
- [ ] `apps/web` linked to a Vercel project.
- [ ] `vercel.json` in `infra/vercel/` configured for monorepo build.
- [ ] GitHub Action `.github/workflows/deploy-preview.yml` posts the preview URL on PR.
- [ ] Production deploy from `main` is blocked behind manual approval (Vercel "Production" environment + GitHub Environment protection).

---

### S1-03 — Database, multi-tenancy, RLS (8 pts)

**As** the platform
**I want** Postgres with Prisma, tenant scoping, and Row-Level Security enforced at the database level
**So that** cross-tenant data leakage is impossible even if application code has a bug

**Acceptance criteria:**
- [ ] Postgres 16 connected (Vercel Postgres / Neon / Supabase).
- [ ] `prisma/schema.prisma` includes `tenant`, `user`, `role`, `role_assignment`, `audit_log` (this story scope only — full schema in S1-05).
- [ ] Every tenant-scoped table has `tenant_id` not-null FK.
- [ ] Postgres RLS policy on every tenant-scoped table: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
- [ ] Prisma client wrapped to set `app.tenant_id` per request via `SET LOCAL`.
- [ ] Test: a query made with tenant A's context cannot read tenant B's rows (positive + negative test).
- [ ] Test: bypassing the wrapper to call `prisma.<model>.findMany()` directly returns 0 rows due to RLS.
- [ ] `pnpm db:migrate` and `pnpm db:seed` work locally.

**Prompt:** [`prompts/02-database-and-tenancy.md`](prompts/02-database-and-tenancy.md)

---

### S1-04 — Authentication + role-based access (5 pts)

**As** a user
**I want** to log in with credentials (and OIDC-ready scaffold)
**So that** I can access the app and the system knows my tenant + roles

**Acceptance criteria:**
- [ ] Auth.js (NextAuth) configured with Credentials provider for dev.
- [ ] OIDC provider scaffolded (config-driven; can be enabled per tenant).
- [ ] Login + Logout pages.
- [ ] Middleware in `apps/web/middleware.ts` resolves the user, attaches `tenantId` and `roleAssignments` to the request.
- [ ] `withRBAC(permission, scope)` helper for route handlers; throws `404` (not `403`) on cross-tenant access.
- [ ] Step-up auth helper scaffolded (placeholder; full TOTP/WebAuthn in a later sprint).
- [ ] Test: an unauthenticated request to `/api/v1/*` returns 401.
- [ ] Test: a user without permission `bowtie:read` cannot list bowties (403).
- [ ] Test: a user from tenant A querying a tenant B record sees 404.

**Prompt:** [`prompts/04-auth-rbac.md`](prompts/04-auth-rbac.md)

---

### S1-05 — Full Prisma schema (8 pts)

**As** the team
**I want** the complete Prisma schema covering every entity in [`02_DATA_MODEL.md`](02_DATA_MODEL.md)
**So that** Sprint 2 can build endpoints against a stable schema

**Acceptance criteria:**
- [ ] `prisma/schema.prisma` includes every entity from [`02_DATA_MODEL.md`](02_DATA_MODEL.md): hazard, top_event, bowtie, threat, consequence, barrier, degradation_factor, degradation_control, gap_record, performance_standard, verification_regime, verification_task, verification_evidence, risk_matrix, risk_assessment, risk_register_entry, bowtie_risk_link, incident_bowtie_link, moc_bowtie_link, workshop_session, workshop_decision, workshop_parking_item, ai_suggestion, action, document_link, audit_log, comment.
- [ ] All enums declared per spec (6-stage bowtie state, 4-level risk, 11 barrier functions, 6 colors, etc.).
- [ ] Composite indexes per [`02_DATA_MODEL.md`](02_DATA_MODEL.md) §11.
- [ ] Soft delete via `deleted_at` on every entity.
- [ ] Migration generated and committed.
- [ ] Seed script creates: 1 demo tenant, default 5×5 risk matrix, all enum-backed reference data, baseline roles, one fully populated example Bowtie (3 threats, 2 consequences, 6 barriers, 2 DFs, 2 DCs, 1 gap_record, 4-level risk per consequence).
- [ ] `pnpm db:reset && pnpm db:seed` produces the same result deterministically.

**Prompt:** [`prompts/03-domain-schema.md`](prompts/03-domain-schema.md)

---

### S1-06 — Audit log infrastructure (5 pts)

**As** a compliance officer
**I want** every state-changing action to write an immutable audit row
**So that** we can answer "who changed what and when" for any record forever

**Acceptance criteria:**
- [ ] `withAudit(action, entityType, fn)` wrapper in `apps/web/lib/audit/`.
- [ ] Wrapper computes RFC 6902 JSON Patch between before/after and stores it.
- [ ] Audit row includes: tenant_id, user_id, request_id, ip_address, action, entity_type, entity_id, before_hash, after_hash, patch, comment, created_at.
- [ ] Postgres trigger or app-layer guard prevents UPDATE/DELETE on `audit_log`.
- [ ] Test: a CRUD operation produces exactly one audit row with a valid RFC 6902 patch.
- [ ] Test: attempting to UPDATE an audit_log row fails.
- [ ] `GET /api/v1/audit-log?entity_type=&entity_id=` returns the history for that entity, paginated.

---

### S1-07 — Shared schemas and methodology package skeleton (3 pts)

**As** the team
**I want** the canonical zod schemas and a stub for the methodology package
**So that** API and UI share types, and Sprint 2 can land the first pure functions

**Acceptance criteria:**
- [ ] `packages/shared/src/schemas/` has zod schemas for: `tenant`, `user`, `role`, `audit-log`, `ai-suggestion` (canonical 6-field schema).
- [ ] All schemas re-exported from `@bowtie/shared`.
- [ ] `packages/methodology/src/index.ts` exports stub `calculateBarrierHealth` returning a fixed value with a TODO marker (real implementation in Sprint 3).
- [ ] `packages/methodology` has its own vitest config and a passing test.
- [ ] CI enforces: any change to `packages/methodology` requires a test in the same PR.

---

### S1-08 — CI/CD pipelines (3 pts)

**As** the team
**I want** automated checks on every PR
**So that** broken code can't reach `main`

**Acceptance criteria:**
- [ ] `.github/workflows/ci.yml` runs lint, typecheck, test:unit, test:integration, build.
- [ ] Integration tests use Testcontainers Postgres.
- [ ] Coverage report uploaded to Codecov; budget enforced for `packages/methodology` (≥ 95%).
- [ ] PR blocked if CI fails.
- [ ] CODEOWNERS file requires a review for `docs/` changes.
- [ ] Dependabot configured for npm + GitHub Actions.

---

## Out of scope for Sprint 1 (deliberate)

These are deferred to keep the sprint focused on foundation:

- ❌ Bowtie / barrier endpoints — Sprint 2.
- ❌ 12-step Wizard UI — Sprint 3.
- ❌ Bowtie canvas — Sprint 4.
- ❌ Barrier health calculator — Sprint 3.
- ❌ AI agent — Sprint 5.
- ❌ Worker job scheduling — Sprint 4.
- ❌ Real-time co-editing — Sprint 6.
- ❌ Production deployment — only Vercel preview deploys this sprint.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| RLS policy bug allows cross-tenant reads | Required negative tests in S1-03; ADR records the policy text |
| OIDC integration drags into MVP | Scaffold only in Sprint 1; full integration in Sprint 7 |
| Prisma schema requires rework after S1-05 | Lock the schema with [`02_DATA_MODEL.md`](02_DATA_MODEL.md); any deviation requires an ADR |
| Audit log performance | Partitioned monthly from day one (per spec); review at 100k rows |

---

## Definition of Sprint Done

- [ ] All stories above merged.
- [ ] CI green on `main`.
- [ ] Vercel preview deploys cleanly.
- [ ] All tests pass; coverage budget met.
- [ ] No open critical/high security findings (`pnpm audit`, Snyk).
- [ ] ADRs recorded for: NestJS deviation, Liveblocks choice, Auth.js choice, RLS policy.
- [ ] Sprint 2 prompts ([`prompts/05-bowtie-api.md`](prompts/05-bowtie-api.md), etc.) reviewed and ready.
