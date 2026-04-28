# Prompt 05 — Bowtie API + 6-Stage Approval

## Role & Context

You are shipping the core domain endpoints — Hazard, Top Event, Bowtie, Threat, Consequence — and the **6-stage approval state machine** that gates Bowtie publishing. The state machine is the single most important piece of business logic in the product. Get it right.

Barriers, Degradation Factors, Degradation Controls and Gap Records come in Prompt 06 (with the Wizard).

## Read first

- `/CLAUDE.md` — methodology guardrails.
- `/docs/01_PRODUCT_SPEC.md` — FR-1, FR-2, FR-10.
- `/docs/02_DATA_MODEL.md` — sections 3, 4.
- `/docs/03_WORKFLOWS_AND_VALIDATION.md` — section 1.1 (state machine), section 2 (validation), section 4 (permissions).
- `/docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md` — API endpoints, AC-Six-Stage-Approval.

## Deliverables

### Domain logic in `packages/methodology`

`packages/methodology/src/validation/`:

- `bowtie-structural.ts` — pure function `validateBowtieStructural(bowtie, related)` returning `{ ok: boolean; failures: ValidationFailure[] }`. Implements every rule in `03_WORKFLOWS_AND_VALIDATION.md` §2.2.
- `barrier-quality.ts` — pure function `validateBarrierQuality(barrier, evidence)` returning per-criterion pass/fail. Implements all 8 criteria in §2.3.
- `top-event-format.ts` — pure heuristic flagging Top Event titles that look like causes ("X fails", "broken X") or consequences ("X happens", "X occurs"). Returns `{ severity: 'ok' | 'warn'; suggestion?: string }`.

100% branch coverage required.

### State machine

`apps/web/lib/services/bowtie-state-machine.ts`:

- Pure function `evaluateTransition(currentState, action, context)` returning `{ allowed: boolean; nextState?: BowtieState; reason?: string }`.
- Encodes the table in `03_WORKFLOWS_AND_VALIDATION.md` §1.1.
- Stateless; no database access.

### Repositories

`apps/web/lib/repos/`:

- `hazards.ts`, `top-events.ts`, `bowties.ts`, `threats.ts`, `consequences.ts`.
- Each: `findById`, `list`, `create`, `update`, `softDelete`.
- `bowties.ts` adds `loadBowtieFull(id)` that returns the Bowtie with all related collections (threats, consequences, barriers, DFs, DCs, gap_records, risk_assessments).

### API endpoints under `apps/web/app/api/v1/`

- `hazards/route.ts` — list, create.
- `hazards/[id]/route.ts` — get, update, soft-delete.
- `top-events/route.ts` — list, create.
- `top-events/[id]/route.ts` — get, update, soft-delete.
- `top-events/[id]/transitions/route.ts` — POST `{ action }` — own state machine for Top Event (simpler 5-state).
- `bowties/route.ts` — list (with filters), create.
- `bowties/[id]/route.ts` — get, update (only if state allows), soft-delete.
- `bowties/[id]/transitions/route.ts` — POST `{ action, comment }` — drives the 6-stage state machine. Step-up MFA required for `approve` and `publish`.
- `bowties/[id]/threats/route.ts` — list, create.
- `bowties/[id]/threats/[threatId]/route.ts` — get, update, delete.
- `bowties/[id]/consequences/route.ts`, `bowties/[id]/consequences/[consequenceId]/route.ts` — same shape.
- `bowties/[id]/preflight/route.ts` (GET) — returns the full validation report (structural + barrier-quality) without transitioning. Used by the UI to show what needs to be fixed before approve.

Each endpoint: zod input validation (schemas in `packages/shared`), `requirePermission`, `withAudit`, structured error responses (`{ error_code, message, fields?: { field: message[] } }`).

### Services

`apps/web/lib/services/bowtie-service.ts`:

- `submitForReview(id, ctx)` — guards: state must be `draft`; Wizard exit criteria for steps 1–5 met (per §1.2).
- `progressReview(id, ctx)` — handles internal → SME → risk_manager.
- `approve(id, ctx)` — runs full structural + quality validation; requires step-up; sets `approved_at`, `approved_by`.
- `publish(id, ctx)` — guards: state must be `approved`; sets `published_at`, `effective_from`.
- `revise(id, ctx)` — guards: state must be `published`; checks MOC link or scheduled review trigger.
- Every method calls the state machine first, then runs validation, then performs the mutation under `withAudit`.

### Documented gap pattern (preview)

For now, just expose a **read** for `gap_record` so the preflight validator can include them. Full `gap_record` CRUD lands in Prompt 06.

## Acceptance criteria

- [ ] CRUD on Hazard, Top Event, Bowtie, Threat, Consequence with full RBAC + audit.
- [ ] Bowtie state machine enforces all transitions per `03_WORKFLOWS_AND_VALIDATION.md` §1.1.
- [ ] Submitting a draft missing Step 5 (consequences) fails with structured error pointing at the missing exit criteria.
- [ ] Approving a Bowtie without all 4 levels of risk for every consequence fails (acceptance criterion AC-Four-Level-Risk).
- [ ] Approving without step-up MFA fails with 401 + `step_up_required`.
- [ ] After Approve, attempting to PATCH the Bowtie content fails (immutability).
- [ ] `GET /api/v1/bowties/{id}/preflight` returns the structured validation report.
- [ ] Cross-tenant access returns 404.
- [ ] Audit log shows every transition with actor, timestamp, comment.

## Tests required

`packages/methodology/tests/`:
- 100% branch coverage on `validateBowtieStructural`, `validateBarrierQuality`, `evaluateTransition`.

`apps/web/tests/integration/bowtie.test.ts`:
- Full lifecycle happy path: create → submit → progress through 6 stages → approve → publish.
- Skip-stage attempt (e.g., draft directly to approved) fails.
- Cross-tenant 404.
- Step-up enforcement on approve.
- Edit-after-approval fails with structured error.

`apps/web/tests/e2e/bowtie-lifecycle.spec.ts` (Playwright):
- A facilitator user creates a draft Bowtie via API (UI comes in next prompt).
- Submits, internal reviewer approves, SME approves, Risk Manager approves with step-up, publishes.
- Audit log UI shows the full transition history.

## Definition of done

- [ ] All deliverables shipped.
- [ ] AC-Six-Stage-Approval (from `05_ARCHITECTURE_SECURITY_ACCEPTANCE.md`) demonstrably met.
- [ ] AC-Four-Level-Risk demonstrably met.
- [ ] All tests passing.
- [ ] OpenAPI spec auto-generated and accessible at `/api/v1/docs`.
- [ ] Summary block per `/CLAUDE.md` §8.
