# Prompt 02 — Database, Multi-Tenancy, RLS

## Role & Context

You are wiring Postgres into the monorepo with strict multi-tenant isolation. Use **Prisma** for schema and migrations, plus **Postgres Row-Level Security** as defense-in-depth. By the end of this prompt, cross-tenant data leakage must be impossible even if application code has a bug.

This prompt only covers **tenancy infrastructure** — `tenant`, `user`, `role`, `role_assignment`, `audit_log` shells. The full domain schema lands in Prompt 03.

## Read first

- `/CLAUDE.md`.
- `/docs/02_DATA_MODEL.md` — section 2 (foundation tables).
- `/docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md` — security sections.
- `/docs/09_SPRINT_1_BACKLOG.md` — story S1-03.

## Deliverables

### Prisma schema

`apps/web/prisma/schema.prisma`:

- `tenant` — id, slug, name, region, kms_key_id, settings (jsonb), created_at, updated_at, deleted_at.
- `user` — id, tenant_id, email (unique within tenant), name, hashed_password (nullable for OIDC), mfa_enrolled (bool), created_at, updated_at, deleted_at.
- `role` — id, tenant_id, code, name, permissions (text array).
- `role_assignment` — id, tenant_id, user_id, role_id, scope (jsonb: { type: 'tenant' | 'business_unit' | 'asset' | 'bowtie', id }), created_at.
- `audit_log` — id, tenant_id, user_id, request_id, ip_address, action, entity_type, entity_id, before_hash, after_hash, patch (jsonb — RFC 6902), comment, created_at.

Composite indexes per `02_DATA_MODEL.md`. Soft delete (`deleted_at`) on every entity.

### Migrations

- One migration creates the tables.
- A second migration creates **RLS policies** for `user`, `role`, `role_assignment`, and any tenant-scoped table:

```sql
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_tenant_isolation ON "user"
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

- A third migration partitions `audit_log` monthly and adds a Postgres trigger preventing UPDATE/DELETE.

### Tenant-aware Prisma client

`apps/web/lib/db/client.ts`:

- Export `getPrismaClient()` that returns a Prisma client bound to a request context.
- Wrap every transaction with `SET LOCAL app.tenant_id = '<uuid>'` so RLS sees it.
- Helper `withTenant(tenantId, fn)` runs `fn` inside that transaction.
- Helper `withSystemTenant(fn)` runs without RLS — strictly for migrations and seeders. Tagged with a `// SAFETY:` comment explaining when to use it.

### Repository pattern scaffold

`apps/web/lib/repos/`:

- `users.ts` — `findUserById`, `findUserByEmail`, `createUser`. Each calls Prisma through `withTenant`.
- `tenants.ts` — `findTenantBySlug`, `createTenant`. The latter uses `withSystemTenant`.
- `audit.ts` — `appendAuditLog(...)` — append-only insert.

### Seeds

`apps/web/prisma/seed.ts`:

- One demo tenant.
- Default roles per `03_WORKFLOWS_AND_VALIDATION.md` §4: System Admin, Tenant Admin, Risk Manager, Bowtie Facilitator, Barrier Owner, Action Owner, Verifier, Operations User, Management.
- One demo user per role in the demo tenant.
- Idempotent: running twice produces the same result.

### Scripts

In root `package.json`:
- `db:migrate` → `prisma migrate deploy`
- `db:migrate:dev` → `prisma migrate dev`
- `db:seed` → `tsx apps/web/prisma/seed.ts`
- `db:reset` → `prisma migrate reset --force --skip-seed && pnpm db:seed`
- `db:studio` → `prisma studio`

## Acceptance criteria

- [ ] `pnpm db:migrate:dev` creates all tables and policies.
- [ ] `pnpm db:seed` creates the demo tenant and users.
- [ ] `pnpm db:reset` is fully deterministic.
- [ ] A query made through `withTenant(A, ...)` cannot see rows belonging to tenant B.
- [ ] Calling `prisma.user.findMany()` *without* `withTenant` returns 0 rows (RLS without setting blocks reads).
- [ ] Attempting `UPDATE audit_log SET ...` from a SQL client raises a trigger error.
- [ ] `audit_log` partitions exist for current month + next month.

## Tests required

`apps/web/tests/integration/tenancy.test.ts`:

- **Positive isolation:** create user in tenant A; same query in tenant B context returns nothing.
- **Negative isolation (no tenant set):** unsetting `app.tenant_id` returns 0 rows from `user`.
- **Audit immutability:** UPDATE on `audit_log` row throws.
- **Cross-tenant write:** attempting to insert a `role_assignment` in tenant A that points at a user in tenant B is rejected.
- **Soft delete:** deleted users don't appear in normal queries but appear when explicitly included.

Use **Testcontainers** to spin up Postgres for integration tests.

## ADR required

Author `docs/decisions/0001-postgres-rls-as-defense-in-depth.md`:

- Title, status, context, decision, consequences.
- Records the policy text and the rationale for combining RLS with ORM-level filtering.

## Definition of done

- [ ] All deliverables shipped.
- [ ] All acceptance criteria checked.
- [ ] All tests passing in CI (with Testcontainers).
- [ ] ADR-0001 merged.
- [ ] Branch merged to `main`.
- [ ] Summary block per `/CLAUDE.md` §8.
