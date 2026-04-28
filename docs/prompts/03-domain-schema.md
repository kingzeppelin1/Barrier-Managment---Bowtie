# Prompt 03 — Full Domain Schema + Audit Infrastructure

## Role & Context

You are landing the **complete Prisma schema** for every entity in the v2 spec, and you are wiring the `withAudit()` mutation wrapper that every subsequent prompt depends on. After this prompt, no domain mutation in the codebase should ever bypass the audit trail.

## Read first

- `/CLAUDE.md`.
- `/docs/02_DATA_MODEL.md` — sections 3 through 10 (every entity, fields, indexes, seed data).
- `/docs/03_WORKFLOWS_AND_VALIDATION.md` — section 1.1 (state machine).
- `/docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md` — audit and security sections.
- `/docs/11_GLOSSARY.md` — terminology check (Degradation Factor / Degradation Control, never Escalation Factor / EFB).

## Deliverables

### Schema additions to `apps/web/prisma/schema.prisma`

Add every entity from `02_DATA_MODEL.md`:

- `asset` (tree, parent_id self-ref).
- `hazard`.
- `top_event` — independent state machine: `draft / in_review / approved / published / archived`.
- `bowtie` — 9-state machine per spec: `draft / internal_review / sme_review / risk_manager_review / approved / published / under_revision / superseded / archived`.
- `threat`, `consequence`.
- `barrier` — every field including `barrier_type` (5-class enum), `barrier_subtype` (8-class enum), `barrier_function` (11-value enum), all 8 quality flags, `health_score` (int 0–100), `health_status` (enum), `health_status_with_compensatory` (bool), `color_override`.
- `degradation_factor`, `degradation_control`.
- `gap_record`.
- `performance_standard`.
- `verification_regime`, `verification_task`, `verification_evidence`.
- `risk_matrix`, `risk_assessment` (4-level: inherent / current / residual / target).
- `risk_register_entry`, `bowtie_risk_link`.
- `incident_bowtie_link`, `moc_bowtie_link`.
- `workshop_session`, `workshop_decision`, `workshop_parking_item`.
- `ai_suggestion` — with `prompt_hash`, `model_id`, `structured_output` (jsonb), `reviewer_id`, `reviewer_decision`, `reviewer_notes`, `decided_at`.
- `action`, `document_link`, `comment`.

Every tenant-scoped table gets `tenant_id` + RLS policy. Add the composite indexes from `02_DATA_MODEL.md` §11.

### Audit wrapper

`apps/web/lib/audit/with-audit.ts`:

```ts
type AuditContext = {
  userId: string;
  tenantId: string;
  requestId: string;
  ipAddress: string;
  comment?: string;
};

export async function withAudit<T extends { id: string }>(
  ctx: AuditContext,
  action: 'create' | 'update' | 'delete' | 'soft_delete' | 'restore' | 'transition',
  entityType: string,
  fn: () => Promise<{ before: T | null; after: T | null }>
): Promise<T | null>;
```

- Computes RFC 6902 JSON Patch between `before` and `after`.
- Hashes `before` and `after` (sha-256 over canonical JSON).
- Persists one row in `audit_log`.
- Propagates errors but always rolls back atomically with the underlying mutation.
- Exported with `import { withAudit } from '@/lib/audit'`.

`apps/web/lib/audit/diff.ts` — RFC 6902 implementation (use `fast-json-patch` or equivalent; pin dependency).

`apps/web/lib/audit/canonical.ts` — canonical JSON for hashing (sorted keys, no whitespace).

### Audit log read endpoint

`apps/web/app/api/v1/audit-log/route.ts` (GET):

- Query params: `entity_type`, `entity_id`, `from`, `to`, `cursor`, `limit` (max 100).
- Tenant-scoped, RBAC: requires `audit_log:read`.
- Cursor pagination.
- Returns: `{ items, nextCursor }`.
- Each item includes the patch and a human-readable diff summary.

### Reference data seeds

Extend `apps/web/prisma/seed.ts`:

- 5×5 default risk matrix per spec.
- All enum-backed reference data.
- Two example performance standards (gas detection, lifeboat readiness).
- One fully populated example Bowtie:
  - Hazard: heavy load during lifting operation.
  - Top Event: loss of control over suspended load.
  - 3 threats, 2 consequences, 6 barriers (mix of preventive and mitigative across CCPS types and functions), 2 DFs, 2 DCs, 1 gap_record, 4-level risk per consequence.
  - Approved + published, with audit trail showing every transition.
- Sector template skeletons (just metadata, no full Bowties): maritime collision, hydrocarbon LOC, runway incursion, wrong-site surgery, SIS compromise.

### Sample mutation proving the wrapper

`apps/web/app/api/v1/comments/route.ts` (POST):

- Tenant-scoped + RBAC + uses `withAudit`.
- Lets us prove the wrapper works end-to-end without yet shipping the Bowtie domain endpoints.

## Acceptance criteria

- [ ] `pnpm db:migrate:dev` applies cleanly.
- [ ] `pnpm db:reset && pnpm db:seed` produces identical output every run.
- [ ] Every tenant-scoped table has an RLS policy.
- [ ] Creating, updating, soft-deleting, and restoring a `comment` each produce exactly one `audit_log` row with a valid RFC 6902 patch.
- [ ] The `before_hash` and `after_hash` round-trip: hashing the canonical JSON of the entity reproduces the stored hash.
- [ ] `GET /api/v1/audit-log?entity_type=comment&entity_id=...` returns the comment's history.
- [ ] Attempting `UPDATE audit_log` raises an error (Postgres trigger from prompt 02).
- [ ] Cross-tenant audit-log read returns 404, not 403.

## Tests required

`apps/web/tests/integration/audit.test.ts`:

- Round-trip: create → update → soft-delete → restore on `comment`; verify 4 audit rows with patches `[{op: add, ...}], [{op: replace, path: /body, ...}], [{op: replace, path: /deletedAt, ...}], [{op: replace, path: /deletedAt, value: null}]`.
- Cross-tenant read returns 404.
- Unauthorized read returns 401.
- User without `audit_log:read` permission returns 403.

`apps/web/tests/integration/seed.test.ts`:

- After `db:reset && db:seed`, exactly the expected counts of every entity type.
- The seeded example Bowtie has state `published` and a complete audit trail.

## ADR required

`docs/decisions/0002-rfc6902-for-audit-diffs.md` — why JSON Patch, not full snapshots.

## Definition of done

- [ ] All deliverables shipped.
- [ ] All acceptance criteria checked.
- [ ] Tests passing in CI.
- [ ] ADR-0002 merged.
- [ ] Summary block per `/CLAUDE.md` §8.
