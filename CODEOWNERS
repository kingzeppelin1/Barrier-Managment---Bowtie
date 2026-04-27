# Prompt 09 — AI Agent (Bowtie Assistant)

## Role & Context

You are wiring the **advisory AI agent** into the product. The Bowtie Assistant suggests methodology improvements (Top Event format, missing barrier types, barriers misclassified as actions, etc.) but **never** writes safety-critical content autonomously. Every suggestion is logged, every accepted suggestion needs a named human reviewer, and the approval gate **blocks** if any AI-originated element has not been decided.

Read this prompt carefully — the guardrails are non-negotiable.

## Read first

- `/CLAUDE.md` — section 3 is the AI guardrails.
- `/docs/07_AI_AGENT.md` — full agent spec, capabilities, schema, audit, boundaries.
- `/docs/01_PRODUCT_SPEC.md` — FR-13.
- `/docs/03_WORKFLOWS_AND_VALIDATION.md` — section 1.1 (state machine; approval gate behavior).
- `/docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md` — AC-AI-Advisory-Only, AC-AI-Audit-Trail.

## Deliverables

### Canonical output schema

`packages/shared/src/schemas/ai.ts`:

```ts
export const aiSuggestionOutputSchema = z.object({
  proposal: z.string().min(1).max(2000),
  justification: z.string().min(1).max(4000),
  uncertainty: z.enum(['low', 'medium', 'high']),
  questions: z.array(z.string()).max(10),
  recommended_action: z.enum(['accept', 'reject', 'review_with_facilitator', 'gather_more_evidence']),
  fields: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
});
```

Strict validation — malformed → reject (no auto-fix), retry once, surface error to user.

### AI client

`apps/web/lib/ai/client.ts`:

- Anthropic SDK wrapper.
- Reads `ANTHROPIC_API_KEY` and `AI_AGENT_DEFAULT_MODEL` from env.
- Function: `invokeBowtieAssistant(intent, context, ctx)`.
- Always sets `system` prompt that:
  - States the assistant is advisory only.
  - Mandates the canonical 6-field output JSON.
  - Provides the methodology terminology (Degradation Factor / Degradation Control; never Escalation Factor).
  - Forbids the assistant from instructing the user to bypass any guardrail.
- Computes `prompt_hash` (sha-256 over canonical-JSON of the messages).
- Persists an `ai_suggestion` row before calling the API (status: `pending`); updates with `structured_output`, `model_id`, `latency_ms`, `tokens_used` after response.

### Intents

`apps/web/lib/ai/intents/`:

- `top-event-format.ts` — checks Top Event title for cause/consequence drift; returns suggested rewrite.
- `barrier-vs-action.ts` — given a proposed barrier, determines if it is actually an Action.
- `missing-barrier-types.ts` — given a pathway with N barriers, suggests barrier types (CCPS) that are absent.
- `independence-check.ts` — given a pathway, suggests whether two barriers share common-cause failure.
- `risk-assessment-coach.ts` — explains the difference between current and residual risk in the user's context.
- `pdf-summary.ts` — generates a regulator-pack summary (used in Prompt 10).

Each intent: well-defined input shape, well-defined system prompt, returns parsed canonical output.

### API endpoint

`apps/web/app/api/v1/ai/suggest/route.ts` (POST):

- Body: `{ intent: string; context: object }`.
- RBAC: `ai:invoke` permission required.
- Tenant feature flag: if `tenant.settings.ai_agent_enabled === false` → 403.
- Calls intent, persists `ai_suggestion`, returns `{ suggestion_id, output }`.
- Rate-limited: 30 requests / minute / user.

`apps/web/app/api/v1/ai/suggestions/[id]/decide/route.ts` (POST):

- Body: `{ decision: 'accept' | 'reject' | 'modified_accept'; notes: string; modifications?: object }`.
- Updates the `ai_suggestion` row with `reviewer_id`, `reviewer_decision`, `reviewer_notes`, `decided_at`.
- If `accept` or `modified_accept`, returns the canonical patch to apply to the destination entity. The actual mutation is performed by the caller (the Wizard or Side Panel UI) which writes `ai_origin_suggestion_id` on the destination entity in the same transaction.

`apps/web/app/api/v1/ai/suggestions/route.ts` (GET):

- List suggestions filtered by `entity_type`, `entity_id`, `decision_status`, `created_at`.

### Approval-gate enforcement

Update `apps/web/lib/services/bowtie-service.ts` `approve()`:

- Before validation runs, query: any element on this Bowtie with `ai_origin_suggestion_id` IS NOT NULL whose `ai_suggestion.reviewer_decision` IS NULL?
- If yes → reject with `error_code: 'ai_undecided_blocking_approval'` listing the offending suggestion ids.

This **blocks approval** until reviewers have decided every AI-originated element.

### Wizard AI Coach pane

Replace the placeholder from Prompt 06 with the real component:

`apps/web/components/wizard/AICoach.tsx`:

- Right-rail panel.
- "Check this step with AI" button → calls relevant intent for the current step.
- Renders the canonical output as 6 sections.
- "Accept", "Reject", "Modified accept" buttons → calls `/decide` endpoint.
- Shows uncertainty badge.
- Disabled if the tenant has `ai_agent_enabled=false`.

### Side Panel AI Check tab

`apps/web/components/canvas/SidePanel.tsx` — `<AICheckTab>`:

- Lists all AI suggestions for this element (decided + undecided).
- Highlights undecided ones (these block approval).
- "Run AI check now" button.
- Decision UI same as Wizard.

### Worker job: portfolio AI scan (deferred)

Stub-only in this prompt. Real implementation post-MVP.
- `apps/worker/src/jobs/portfolio-ai-scan.ts` — placeholder. Scheduled but no-ops with a `// TODO(post-mvp)` comment.

### Audit

Every AI invocation, every decision, every mutation that carries `ai_origin_suggestion_id` writes to `audit_log` via `withAudit`. Action codes: `'ai.suggestion.created'`, `'ai.suggestion.decided'`, `'<entity>.created.from_ai'`.

## Acceptance criteria

- [ ] Calling AI on a Top Event titled "Crane fails" returns a suggestion to rephrase as a loss-of-control statement.
- [ ] Accepting the suggestion writes `ai_origin_suggestion_id` on the Top Event in the same transaction.
- [ ] An AI-originated element with no reviewer decision **blocks Bowtie approval** with `error_code: 'ai_undecided_blocking_approval'`.
- [ ] Disabling the tenant feature flag makes the AI Coach pane disappear and `/api/v1/ai/suggest` return 403.
- [ ] Malformed AI output triggers one retry; a second malformation returns a structured error to the user (no silent failure).
- [ ] Cross-tenant AI suggestion read returns 404.
- [ ] Every AI invocation has a corresponding `ai_suggestion` row with `prompt_hash`, `model_id`, full output.
- [ ] AI never sees data outside the invoking user's permission scope (verified by negative integration test).

## Tests required

`apps/web/tests/integration/ai-agent.test.ts`:
- Top Event format intent: input "Crane fails" → output's `recommended_action` is `accept` and `proposal` is a loss-of-control restatement.
- Decision flow: invoke → accept → element gets `ai_origin_suggestion_id`.
- Undecided suggestion blocks approval.
- Feature flag off → 403.
- Rate limit: 31st request within 60s → 429.

`apps/web/tests/integration/ai-permissions.test.ts`:
- A user with read access only to Asset A cannot invoke AI on a Bowtie under Asset B → 404.

`packages/shared/tests/ai-schema.test.ts`:
- Canonical schema rejects missing fields, extra fields, wrong enums.

`apps/web/tests/e2e/wizard-ai.spec.ts`:
- In the Wizard, run AI on Step 3; accept; advance to Step 4; verify the Top Event has `ai_origin_suggestion_id`.

## Definition of done

- [ ] All deliverables shipped.
- [ ] AC-AI-Advisory-Only met.
- [ ] AC-AI-Audit-Trail met.
- [ ] Approval-gate enforcement demonstrably blocks undecided suggestions.
- [ ] All tests passing.
- [ ] Summary block per `/CLAUDE.md` §8.
