# Prompt 08 — Barrier Health Calculator + Verification

## Role & Context

You are shipping the **canonical numeric barrier health calculator** (0–100), the verification regime/task/evidence system that feeds it, and the BullMQ worker job that runs verification scheduling nightly. Health is the single most-watched metric in the product; the calculator must be deterministic, fully covered, and auditable.

## Read first

- `/CLAUDE.md`.
- `/docs/01_PRODUCT_SPEC.md` — FR-5 (verification), FR-6 (health).
- `/docs/03_WORKFLOWS_AND_VALIDATION.md` — section 3 (health calculation rules in full).
- `/docs/02_DATA_MODEL.md` — section 6 (verification entities), section 5 (barrier health fields).
- `/docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md` — performance budgets.

## Deliverables

### Pure calculator

`packages/methodology/src/barrier-health/`:

- `calculate.ts` — `calculateBarrierHealth(inputs: BarrierHealthInputs): BarrierHealthResult`.
  - Inputs: last verification result, days_overdue, open findings (severity counts), open actions (overdue counts), recent incidents touching this barrier, maintenance backlog %, competence coverage %, document validity, MOC pending, manual override (Risk Manager).
  - Output: `{ score: number; status: 'green' | 'yellow' | 'red' | 'gray'; with_compensatory: boolean; reasons: ReasonCode[] }`.
- `floors.ts` — automatic floors:
  - **Critical barrier never above 89** until verified within its window.
  - **Critical barrier with overdue verification > 30 days** → cap at 49 (Red).
  - **Barrier with severity-1 finding open** → cap at 49.
  - Compensated red: status stays Red, `with_compensatory=true`.
- `penalties.ts` — explicit penalty table per `03_WORKFLOWS_AND_VALIDATION.md` §3:
  - `failed_verification`: −40
  - `partial_verification`: −15
  - `never_verified`: −25
  - `verification_overdue`: −1 per day after grace, max −30
  - `open_finding_sev1`: −25 each
  - `open_finding_sev2`: −10 each
  - `open_finding_sev3`: −3 each
  - `overdue_action_sev1`: −15
  - `incident_in_last_90d_touching_barrier`: −20
  - `maintenance_backlog_pct > 20`: −10
  - `competence_coverage_pct < 80`: −10
  - `document_expired`: −10
  - `moc_pending_affecting_barrier`: −5
  - `manual_override`: applied last, can move within bands but not flip Red→Green
- `index.ts` — barrel export.

100% branch coverage required.

### Verification endpoints

`apps/web/app/api/v1/`:

- `verification-regimes/route.ts` — list, create.
- `verification-regimes/[id]/route.ts` — get, update, delete.
- `verification-tasks/route.ts` — list (filters: barrier, owner, status, due window), create (manual ad-hoc).
- `verification-tasks/[id]/route.ts` — get.
- `verification-tasks/[id]/complete/route.ts` — POST: result (`pass`, `partial`, `fail`), notes, evidence references. Step-up MFA required for `pass` on critical barriers.
- `verification-tasks/[id]/evidence/route.ts` — POST: upload to Vercel Blob, store hash + metadata.

All zod-validated, RBAC-gated, audit-wrapped.

### Service layer

`apps/web/lib/services/barrier-health-service.ts`:

- `recalculateBarrierHealth(barrierId, ctx)` — gathers inputs, calls `calculateBarrierHealth`, persists `health_score`, `health_status`, `health_status_with_compensatory`, `health_calculated_at`, `health_reasons` (jsonb).
- Wraps in `withAudit` so every recalculation is auditable (action: `'barrier.health.recalculated'`).
- Emits `barrier.health.changed` event to the BullMQ event bus when status band changes.

`apps/web/lib/services/verification-service.ts`:

- `completeTask(taskId, result, ctx)` — persists task; if result is `fail` or `partial`:
  - Creates an `Action` (severity per result) auto-linked to the barrier.
  - Calls `recalculateBarrierHealth`.
  - If result is `fail` and barrier is critical, dispatches notification to barrier owner + Risk Manager.

### Materialized view for health rollup

Migration: `barrier_health_rollup` materialized view aggregating per-Bowtie health (counts by band, weighted average). Refreshed nightly by the worker; on-demand refresh available.

### Worker jobs

`apps/worker/src/jobs/`:

- `verification-scheduler.ts` — runs nightly at 02:00 tenant-local time. For each active verification regime, generates the next due `verification_task` if none open within window. Uses BullMQ repeatable jobs.
- `barrier-health-recalc.ts` — runs nightly at 03:00. Recalculates health for every barrier (idempotent). Refreshes the materialized view.
- `notifications.ts` — listens on the event bus; for `barrier.health.changed` events into Red, sends email + in-app notification.

`apps/worker/src/index.ts` — bootstraps BullMQ workers, connects to Upstash Redis, registers all jobs.

### Health badge component

`packages/ui/src/compounds/HealthDot.tsx` — given `{ score, status, with_compensatory }` renders the colored dot with hatched fill for compensated red. Used by canvas, tables, and dashboards.

### Dashboard fragment

`apps/web/app/(app)/dashboard/page.tsx` — KPI tiles:
- Bowties published, draft, in review.
- Barriers Red / Yellow / Green / Gray (counts).
- Top 10 lowest-health critical barriers.
- Open critical actions count.

## Acceptance criteria

- [ ] `calculateBarrierHealth` is pure, deterministic, fully covered.
- [ ] Failing a verification turns a healthy barrier Red; an Action is auto-created; Bowtie canvas color updates.
- [ ] A critical barrier never shows Green if last verification > 30 days overdue.
- [ ] Compensated red stays Red with `with_compensatory=true` — never auto-promoted to Yellow or Green.
- [ ] `health_reasons` is human-readable on the Side Panel Status tab.
- [ ] Worker job `verification-scheduler` generates new tasks on schedule.
- [ ] Worker job `barrier-health-recalc` runs nightly and is idempotent.
- [ ] Manual override by Risk Manager is allowed within bands and recorded in audit log.

## Tests required

`packages/methodology/tests/barrier-health/`:
- Coverage table: every penalty, every floor, every band boundary, manual override, compensated red.
- Property test: score is always 0–100; status band always matches score except when floor or compensated-red rules apply.
- 100% branch coverage.

`apps/web/tests/integration/verification.test.ts`:
- Complete task as `pass` → barrier stays/becomes Green.
- Complete task as `fail` → barrier Red, Action created, audit row written.
- Critical barrier without verification window → floor applied.
- Cross-tenant verification task access → 404.

`apps/worker/tests/verification-scheduler.test.ts`:
- Run scheduler against a seeded regime; verify next task generated within window.
- Run twice → second run is a no-op (idempotency).

## Definition of done

- [ ] All deliverables shipped.
- [ ] All AC met.
- [ ] All tests passing.
- [ ] Worker deployed to Railway/Fly preview.
- [ ] Dashboard tiles render real data on the seeded tenant.
- [ ] Summary block per `/CLAUDE.md` §8.
