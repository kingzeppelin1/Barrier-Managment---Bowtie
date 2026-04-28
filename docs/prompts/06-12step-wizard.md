# Prompt 06 — 12-Step Wizard + Barrier / DF / DC / Gap Record

## Role & Context

You are building the **methodology spine** of the product — the 12-step Bowtie Builder Wizard — and shipping the remaining domain endpoints (Barrier, Degradation Factor, Degradation Control, Gap Record). The Wizard enforces correct methodology by structuring the workflow; the API enforces it server-side regardless of which client is used.

## Read first

- `/CLAUDE.md`.
- `/docs/01_PRODUCT_SPEC.md` — FR-2 (Wizard), FR-4 (Barrier Register).
- `/docs/02_DATA_MODEL.md` — sections 5 (barriers, DFs, DCs, gap_record), 7 (risk_assessment).
- `/docs/03_WORKFLOWS_AND_VALIDATION.md` — section 1.2 (Wizard exit criteria), section 2.2-2.3 (rules).
- `/docs/04_UI_UX_AND_REPORTS.md` — section 2.3 (Wizard screen design).
- `/docs/11_GLOSSARY.md` — terminology.

## Deliverables

### Domain endpoints

`apps/web/app/api/v1/bowties/[id]/`:

- `barriers/route.ts` (list, create) and `barriers/[barrierId]/route.ts` (get, update, delete).
- `gap-records/route.ts`, `gap-records/[id]/route.ts`.

`apps/web/app/api/v1/barriers/[id]/`:

- `degradation-factors/route.ts`, `degradation-factors/[id]/route.ts`.
- `quality-check/route.ts` (GET) — runs the 8-criteria validator.

`apps/web/app/api/v1/degradation-factors/[id]/`:

- `degradation-controls/route.ts`, `degradation-controls/[id]/route.ts`.

`apps/web/app/api/v1/bowties/[id]/risk-assessments/`:

- POST/PATCH per consequence — 4-level (inherent / current / residual / target). ALARP justification required when residual > target.

All with zod validation, RBAC, `withAudit`, RLS-scoped, cross-tenant-safe.

### Wizard exit-criteria validator

`packages/methodology/src/validation/wizard.ts`:

- `evaluateWizardStep(step: 1..12, bowtie, related)` returning `{ passed: boolean; missing: string[] }`.
- Each step's criteria from `03_WORKFLOWS_AND_VALIDATION.md` §1.2.
- Used by both the UI (to show exit checklist) and the API (to gate Submit).

### Wizard UI

`apps/web/app/(app)/bowties/new/page.tsx` and `apps/web/app/(app)/bowties/[id]/wizard/page.tsx`:

- Server Component shell + Client Component stepper.
- Vertical stepper component in `packages/ui` (`<Stepper steps={...} currentStep={...}>`).
- Each step is its own client component under `apps/web/components/wizard/steps/`:
  - `Step01ScopeContext.tsx`
  - `Step02Hazard.tsx`
  - `Step03TopEvent.tsx`
  - `Step04Threats.tsx`
  - `Step05Consequences.tsx`
  - `Step06PreventiveBarriers.tsx`
  - `Step07MitigativeBarriers.tsx`
  - `Step08DegradationFactors.tsx`
  - `Step09DegradationControls.tsx`
  - `Step10RiskAssessment.tsx` (4-level)
  - `Step11Actions.tsx`
  - `Step12ReviewPublish.tsx`

For each step:
- Form fields per `04_UI_UX_AND_REPORTS.md` §2.3.
- **Methodology hint** at the top (collapsible) — "What is a Top Event?", etc. Hint copy lives in `apps/web/lib/wizard/hints.ts`.
- **Exit-criteria checklist** on the right with green checks and red gaps.
- Save & Continue button disabled until exit criteria pass.
- Save as Draft works at any time.
- AI Coach pane is a **stub** in this prompt — placeholder card that says "AI Coach — coming in Prompt 09". Slot defined; integration deferred.

### Barrier form details

The barrier form (used in steps 6 & 7) supports:
- All fields from `02_DATA_MODEL.md` §5.1.
- The **8 quality criteria** as a sub-form with rationale per criterion.
- Pathway selection (which threat or consequence).
- Live preview of the barrier as it will appear on the canvas.

### Documented-gap UX

In step 6 and 7, each pathway has a "No barrier — document a gap" CTA. This opens the gap_record form: reason, compensatory measure, owner, target_resolution_date, linked Action (creates an Action inline if none exists).

### Risk assessment UX (step 10)

Per consequence:
- Inherent: likelihood × severity → computed risk level.
- Current: with existing barriers at current health.
- Residual: with planned new measures (referenced Actions).
- Target: aspirational.
- ALARP justification field appears when Residual > Target.

### Step 12: Review & Publish

- Shows the full preflight validation report (from `bowties/{id}/preflight`).
- "Submit for Internal Review" CTA.
- After submission, page becomes a read-only review view.

## Acceptance criteria

- [ ] A user can complete all 12 steps for the maritime lifting example end-to-end through the UI.
- [ ] Trying to leave step N before exit criteria pass is blocked with a visible reason.
- [ ] The "documented gap" path works: a pathway with no barrier but a `gap_record` + Action can pass step 6/7.
- [ ] All 4 risk levels mandatory for every consequence before step 10 passes.
- [ ] ALARP field appears and is required when residual > target.
- [ ] Submit at step 12 calls `POST /api/v1/bowties/{id}/transitions { action: "submit" }` and the Bowtie state moves to `internal_review`.
- [ ] Wizard view and Canvas view of the same Bowtie display the same data (single source of truth).
- [ ] `GET /api/v1/bowties/{id}/preflight` matches what the wizard's exit-criteria checklists show.

## Tests required

`packages/methodology/tests/wizard.test.ts`:
- Each step's evaluator: positive + negative cases. 100% branch coverage.

`apps/web/tests/integration/barriers.test.ts`:
- Barrier CRUD with quality-check endpoint.
- DF/DC nested creation.
- Gap record requires linked Action; rejected without one.

`apps/web/tests/e2e/wizard.spec.ts` (Playwright):
- Walk through 12 steps for the maritime lifting Bowtie.
- Try to skip step 5 → blocked.
- Try to submit step 12 with residual > target and no ALARP → blocked.
- Add a documented gap on step 6 → passes step 6.

## Definition of done

- [ ] All deliverables shipped.
- [ ] All AC met.
- [ ] AC-Documented-Gap from `05_ARCHITECTURE_SECURITY_ACCEPTANCE.md` demonstrably met.
- [ ] All tests passing.
- [ ] Lighthouse a11y score ≥ 95 on Wizard pages.
- [ ] Summary block per `/CLAUDE.md` §8.
