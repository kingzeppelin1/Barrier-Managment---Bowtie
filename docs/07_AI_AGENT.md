# 07 · AI Agent — Bowtie Assistant

> The advisory AI agent that helps users build and quality-check Bowtie analyses. It **never** writes safety-critical content autonomously. Every suggestion is logged; every accepted suggestion needs a named human reviewer; the approval gate **blocks** if any AI-originated element has not been decided.
>
> Implementation prompt: [`prompts/09-ai-agent.md`](prompts/09-ai-agent.md). Provider: Anthropic Claude.

---

## 1. Identity

- **Display name:** Bowtie Assistant. (Internal alias acceptable: *Barrier Coach*.)
- **Voice:** practical, methodology-honest, never authoritative on safety judgments.
- **Disclaimer everywhere:** every suggestion card carries a one-line "advisory only — must be reviewed by a named human" label.

---

## 2. Non-negotiable guardrails

These are restated from [`CLAUDE.md`](../CLAUDE.md) §3 because they are the entire safety story for the AI feature.

1. **Never autonomous.** AI never creates, modifies, or approves safety-critical content. Every accepted suggestion requires a named human reviewer.
2. **Always logged.** Every AI invocation persists an `ai_suggestion` row with `prompt_hash`, `model_id`, full structured output, and `reviewer_decision = pending`.
3. **Always traceable.** Every accepted suggestion writes `ai_origin_suggestion_id` on the destination entity. The audit log records the acceptance.
4. **Approval-gating.** The 6-stage approval gate **blocks** when any element on the Bowtie has `ai_origin_suggestion_id` whose `reviewer_decision` is null. The user must accept, modify, or reject every AI-origin element before the Bowtie can be approved.
5. **Strict schema.** Responses must conform to the canonical 6-field schema (see §4). Malformed responses → reject, retry once, surface error to the user. **Never silent failure.**
6. **Permission-scoped.** AI never sees data outside the invoking user's permission scope. Prompts are constructed from records the user is already allowed to read; integration tests prove this with positive and negative cases.
7. **Disable-able.** A tenant may disable the AI agent entirely; the rest of the product remains fully functional.
8. **No PII to the model beyond minimum necessary.** No emails, no employee identifiers, no customer-protected data are sent to the model unless the prompt explicitly needs them and the tenant has consented.

---

## 3. Capabilities

The Bowtie Assistant supports these invocations. Each invocation type maps to a specific prompt template + Wizard-step entry point.

### 3.1 Suggest

| Invocation type | Trigger / context | Returns |
|---|---|---|
| `suggest_hazards` | Wizard step 1–2 with asset / process selected | List of candidate Hazards. |
| `suggest_top_event` | Wizard step 3 with hazard chosen | Top Event wording (loss-of-control), with rationale. |
| `suggest_threats` | Wizard step 4 with top event chosen | List of candidate Threats. |
| `suggest_consequences` | Wizard step 5 | List of candidate Consequences. |
| `suggest_preventive_barriers` | Wizard step 6, per Threat | Candidate barriers + classification (type / function). |
| `suggest_mitigative_barriers` | Wizard step 7, per Consequence | Same. |
| `suggest_degradation_factors` | Wizard step 8, per critical Barrier | Candidate DFs. |
| `suggest_degradation_controls` | Wizard step 9, per DF | Candidate DCs. |
| `suggest_performance_standards` | Per critical Barrier without a PS | A draft PS (functional / performance / availability / reliability / response-time / acceptance). |
| `suggest_workshop_agenda` | Workshop mode setup | A timed agenda for a workshop session. |
| `draft_report` | Reports module | A draft narrative for a Bowtie report. |
| `draft_executive_summary` | Reports module | A 1-page executive summary. |

### 3.2 Quality-check

The Quality-check invocations run on demand and on `submit_for_*_review` transitions. Each returns one or more findings.

| Invocation type | What it checks |
|---|---|
| `qc_top_event_shape` | Top Event is a loss-of-control statement (not a cause; not a consequence). |
| `qc_pathway_sides` | Threats are on the left side; Consequences are on the right side; preventive vs mitigative classification matches side. |
| `qc_barrier_vs_action` | Heuristic: a "barrier" titled "Investigate cause", "Review the …", "Train …" is probably an Action — flag it. |
| `qc_barrier_specificity` | Barrier name is specific and verifiable (not "Safety culture", not "Good housekeeping"). |
| `qc_barrier_independence` | Barriers on the same pathway don't share a common-cause failure path. |
| `qc_too_many_generic_barriers` | Heuristic for over-broad barrier reuse. |
| `qc_critical_dfs` | Every critical Barrier has at least one DF (or an explicit "no DF" justification). |
| `qc_critical_owners_and_verification` | Every critical Barrier has owner + verification regime + Performance Standard. |
| `qc_alarp_required` | Residual > Target → ALARP record exists with accepted state. |

A quality-check finding is **never** auto-applied. It is rendered as an advisory card the user can accept (creating an Action), modify, or dismiss.

---

## 4. Canonical 6-field response schema (zod)

Every AI response, regardless of invocation type, must conform to this shape. The schema lives in [`packages/shared/src/schemas/ai.ts`](../packages/shared/src/schemas/ai.ts).

```ts
import { z } from 'zod';

export const aiSuggestionResponse = z.object({
  proposal: z.string().min(1),                       // the concrete suggestion
  justification: z.string().min(1),                  // why this is plausible (one short paragraph)
  uncertainty: z.array(z.object({                    // what the AI is unsure about
    aspect: z.string(),
    reason: z.string(),
  })),
  questions: z.array(z.string()),                    // questions the AI wants the user to answer
  recommended_action: z.enum([
    'apply_as_is',
    'apply_with_review',
    'discuss_in_workshop',
    'discard',
  ]),
  fillable_fields: z.record(z.string(), z.unknown()), // structured key/value the UI can prefill
});

export type AiSuggestionResponse = z.infer<typeof aiSuggestionResponse>;
```

### 4.1 Validation

- The route handler validates every model response against the schema.
- On schema failure: log the failure (with the raw response truncated to a fixed length), retry once with a "your previous response did not conform — return JSON matching this schema" preface, then if still failing return `502` to the UI with a structured error. Surface an in-app error message; never silent failure.

### 4.2 Storage

The `ai_suggestion` row stores `structured_output = <the parsed object>`. The 6 fields are the same across every invocation type — they're general enough that they fit suggestions, quality-checks, and drafts.

---

## 5. Prompt construction

### 5.1 What is sent to the model

For each invocation, the API builds a prompt from:

1. A **system prompt** that establishes role, methodology guardrails, schema, and disclaimer requirements.
2. A **methodology context** block: the Top Event, current Bowtie shape, current Risk Manager-configured ALARP rules, and the relevant performance-standard catalogue.
3. The **specific call** with its parameters (e.g. "Suggest preventive barriers for threat <id>: <title> on Bowtie <id>").
4. A **few-shot examples** block showing the expected response shape for similar invocations.
5. A **closing instruction** restating the schema and "advisory only" requirement.

### 5.2 What is *not* sent

- Personally identifiable user data (no emails, no employee IDs).
- Tenant identifiers beyond an opaque label.
- Records the invoking user is not allowed to read.
- Data from other tenants.

### 5.3 Determinism + caching

- Every prompt is hashed (sha-256) → `ai_suggestion.prompt_hash`. Identical prompts in the same tenant within a configurable window (default 1 h) reuse the prior response (cache hit). Cache is opt-out via UI; quality-checks bypass cache by default.
- Anthropic prompt caching (system prompt + few-shot block) is used to reduce token cost.

---

## 6. UI integration

### 6.1 Where suggestions appear

- **Wizard steps:** advisory card next to the relevant fields. Buttons: *Apply* · *Apply with edits* · *Dismiss* · *Discuss in workshop*.
- **Side panel — AI check tab:** for any element, shows the most recent quality-check findings.
- **Workshop mode:** AI suggestions appear inline; the facilitator decides which to discuss; outcome (accepted / modified / rejected) is logged.
- **Reports module:** "Generate draft" button; the resulting draft is saved as an `ai_suggestion` and edited inline before publishing.

### 6.2 What happens on Apply

1. The destination entity is created or updated with the proposed values.
2. `ai_origin_suggestion_id` on the destination is set to the `ai_suggestion.id`.
3. `ai_suggestion.reviewer_decision = accepted`, `reviewer_id = current user`, `reviewed_at = now()`.
4. An audit log row records the accept-with-AI-origin event.

### 6.3 What happens on Apply with edits

Same as Apply, but `reviewer_decision = modified` and the `audit_log.patch` shows the edits the reviewer made on top of the AI proposal.

### 6.4 What happens on Dismiss

`reviewer_decision = rejected`. No destination entity is modified. No `ai_origin_suggestion_id` link is created.

### 6.5 What happens on Discuss in workshop

A `workshop_parking_item` is created and the suggestion stays `pending`. The next workshop session decides.

---

## 7. Approval gate interaction

The block is implemented in [`packages/methodology/src/validation/bowtie-structural.ts`](../packages/methodology/src/validation/bowtie-structural.ts). Pseudocode:

```ts
function blockOnAiOriginPending(bowtie: Bowtie): Violation[] {
  const elements = collectAllAiOriginElements(bowtie);
  return elements
    .filter(el => el.ai_origin_suggestion?.reviewer_decision == null)
    .map(el => ({
      rule: 'ai_origin_pending_review',
      severity: 'block',
      entity_type: el.entity_type,
      entity_id: el.id,
    }));
}
```

UI surfaces the violations on the Approve action with a list of "elements awaiting human review".

---

## 8. Failure modes & observability

| Failure | Behavior |
|---|---|
| Anthropic API timeout | Retry once with 2 s back-off; second failure → surface error; don't store anything. |
| Anthropic API rate limit (429) | Honor `retry-after`; surface "AI is busy, try again in N seconds". |
| Schema-non-conforming response | Retry once with schema reminder; second failure → surface error; record failure with a non-PII excerpt of the raw response in observability (not in `ai_suggestion`). |
| Permission-scope leak detected | Hard fail; do not return the response to the user; emit a security event; alert. |
| Tenant disabled AI | Endpoint returns 404 (the feature does not exist for that tenant). |

Metrics exported:

- `ai_suggestion_total{tenant, invocation_type, decision}` (counter, partitioned).
- `ai_invocation_latency_seconds` (histogram).
- `ai_schema_failure_total` (counter).
- `ai_origin_pending_violations_total` (counter, on every approval-gate run).

---

## 9. Cost / model selection

- **Default model:** `claude-opus-4-7` (configurable via `AI_AGENT_DEFAULT_MODEL`).
- **Default max tokens:** 2000 (configurable via `AI_AGENT_DEFAULT_MAX_TOKENS`).
- **Per-tenant budget:** soft cap on monthly tokens; alerts at 70 % / 90 %; hard cap returns a friendly error ("This tenant has reached its monthly AI budget — contact your admin").
- **Workshop mode** uses the same model with a higher temperature for divergent suggestions; quality-checks use a lower temperature for deterministic output.

---

## 10. Evaluation harness (planned post-MVP)

A small set of golden Bowties + expected AI outputs lives under `apps/web/tests/ai/golden/`. Regression-tests run on every PR that touches `apps/web/lib/ai/`. The eval covers:

- Top-Event-shape detection (positive + negative).
- Barrier-vs-Action heuristic (positive + negative).
- ALARP detection (positive + negative).
- Schema-conformance under deliberately-noisy prompts.

Minimum acceptance to merge a prompt change: the eval matches the prior baseline on every test case.
