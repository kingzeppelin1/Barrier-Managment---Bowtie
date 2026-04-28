# 02 · Data Model

> Canonical entity definitions for the Barrier Management — Bowtie module. Field names use `snake_case` to match the Postgres + Prisma convention used by `apps/web`. The Prisma schema in [`apps/web/prisma/schema.prisma`](../apps/web/prisma/schema.prisma) is generated from this document — when they disagree, **this document wins** unless an ADR records the deviation.
>
> Implementation prompts: [`prompts/02-database-and-tenancy.md`](prompts/02-database-and-tenancy.md), [`prompts/03-domain-schema.md`](prompts/03-domain-schema.md).

---

## 1. Conventions (apply to every entity)

Every table carries:

- `id uuid PRIMARY KEY` (default `gen_random_uuid()`)
- `tenant_id uuid NOT NULL REFERENCES tenant(id)` — except for the `tenant` table itself
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `created_by uuid NOT NULL REFERENCES "user"(id)` (nullable on seed-only rows)
- `updated_by uuid NOT NULL REFERENCES "user"(id)` (nullable on seed-only rows)
- `deleted_at timestamptz NULL` — soft delete; default queries filter `deleted_at IS NULL`

Tenant-scoped tables additionally have a Postgres Row-Level Security policy:

```sql
USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
```

Foreign-key references that cross entities are always within the same `tenant_id`; the application layer enforces this and the `role_assignment` integration test in [`prompts/02-database-and-tenancy.md`](prompts/02-database-and-tenancy.md) proves it.

`audit_log` is **partitioned monthly** and cannot be UPDATE-ed or DELETE-d.

---

## 2. Foundation entities

### 2.1 `tenant`

Represents an isolated customer environment.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| slug | text | unique, URL-safe |
| name | text |  |
| region | text | e.g. `eu-north`, `eu-west`, `us-east` — selects DB host |
| kms_key_id | text | per-tenant KMS key reference for envelope encryption |
| settings | jsonb | feature flags, ALARP rules, default review cadence, etc. |
| created_at, updated_at, deleted_at | timestamptz |  |

### 2.2 `user`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenant |
| email | citext | unique within tenant |
| name | text |  |
| hashed_password | text | nullable (OIDC-only users) |
| mfa_enrolled | boolean |  |
| last_login_at | timestamptz |  |

### 2.3 `role`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK → tenant |
| code | text | one of: `system_admin`, `tenant_admin`, `risk_manager`, `bowtie_facilitator`, `barrier_owner`, `action_owner`, `verifier`, `operations_user`, `management`, `regulator_external` |
| name | text | human-readable |
| permissions | text[] | `bowtie:read`, `bowtie:write`, `barrier:approve`, etc. |

### 2.4 `role_assignment`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | FK |
| user_id | uuid | FK |
| role_id | uuid | FK |
| scope | jsonb | `{ type: 'tenant' \| 'business_unit' \| 'asset' \| 'bowtie', id: uuid }` |

### 2.5 `audit_log` (append-only, partitioned by month)

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid |  |
| user_id | uuid | actor |
| request_id | text | per-request correlation id |
| ip_address | inet |  |
| action | text | `create` / `update` / `delete` / `approve` / … |
| entity_type | text | e.g. `bowtie`, `barrier` |
| entity_id | uuid |  |
| before_hash | text | sha-256 of pre-state |
| after_hash | text | sha-256 of post-state |
| patch | jsonb | RFC 6902 JSON Patch |
| comment | text | nullable |
| created_at | timestamptz |  |

A Postgres trigger on `audit_log` raises `EXCEPTION` on UPDATE or DELETE.

---

## 3. Bowtie core

### 3.1 `hazard`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid |  |
| name | text |  |
| description | text |  |
| category | text | enum-backed reference data |
| energy_source | text | e.g. *kinetic*, *thermal*, *chemical* |
| location | text | asset / area reference |
| normal_control_condition | text | what "normal" looks like |

### 3.2 `top_event`

A **loss-of-control statement** — never a cause and never a consequence.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid |  |
| hazard_id | uuid | FK → hazard |
| title | text | short label |
| loss_of_control_statement | text | required, validated structurally |
| description | text |  |
| boundary_conditions | text |  |
| triggering_conditions | text |  |
| immediate_state_after_loc | text |  |

### 3.3 `bowtie`

The unit of approval. State machine: see [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §1.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid |  |
| title | text |  |
| description | text |  |
| asset_id | uuid | nullable; FK → asset (post-MVP) |
| process_id | uuid | nullable |
| scope_in | text |  |
| scope_out | text |  |
| context | text |  |
| risk_matrix_id | uuid | FK → risk_matrix |
| hazard_id | uuid | FK |
| top_event_id | uuid | FK |
| owner_id | uuid | FK → user |
| status | enum | `draft`, `internal_review`, `sme_review`, `risk_manager_review`, `approved`, `published`, `under_revision`, `superseded`, `archived` |
| version | int | monotonically increasing per bowtie chain |
| version_chain_id | uuid | groups versions of the same bowtie |
| approved_by | uuid | nullable |
| approved_at | timestamptz | nullable |
| published_at | timestamptz | nullable |
| next_review_date | date | required when status ≥ `approved` |

### 3.4 `threat`

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| bowtie_id | uuid | FK |
| title | text |  |
| description | text |  |
| category | text |  |
| credibility | enum | `credible`, `not_credible`, `needs_review` |
| likelihood | int | from the chosen risk matrix |
| frequency_estimate | text | free text or scale value |
| linked_incidents | uuid[] | FK[] → incident |

### 3.5 `consequence`

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| bowtie_id | uuid | FK |
| title, description, category | text |  |
| severity | int | matrix value |
| impact_people, impact_environment, impact_asset, impact_operation, impact_reputation, impact_regulatory | int | each on the same severity scale |

---

## 4. Barriers, DFs, DCs, gaps

### 4.1 `barrier`

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| name, description | text |  |
| barrier_type | enum | 5 canonical: `hardware_passive`, `hardware_active`, `human_active`, `human_procedural`, `organizational` |
| barrier_subtype | enum | 8 operational tags (see [`01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md) §3.2) |
| barrier_function | enum | 11 values: preventive `prevent / detect / control / isolate / stop / warn`, mitigative `detect / respond / contain / evacuate / recover / mitigate` |
| side | enum | `preventive` (left) or `mitigative` (right) |
| linked_threat_id | uuid | nullable; one of `linked_threat_id` / `linked_consequence_id` is set |
| linked_consequence_id | uuid | nullable |
| criticality | enum | `critical`, `important`, `routine` |
| owner_id | uuid | FK → user |
| performance_standard_id | uuid | FK |
| effectiveness_score | int | 0–100 |
| independence_score | int | 0–100 |
| auditability_score | int | 0–100 |
| reliability_confidence | int | 0–100 |
| health_status | enum | `green`, `yellow`, `red`, `gray`, `red_compensated` (alias for Red with `with_compensatory=true`) |
| with_compensatory | boolean | when true, barrier renders Red with hatched fill — never auto-promoted |
| verification_regime_id | uuid | FK |
| last_verified_date | date |  |
| next_verification_date | date |  |
| ai_origin_suggestion_id | uuid | nullable; set when this barrier originated from an accepted AI suggestion |

### 4.2 `degradation_factor` (DF)

A condition that weakens a barrier's ability to perform its function. **Never** *Escalation Factor*.

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| barrier_id | uuid | FK |
| title, description | text |  |
| category | text |  |
| likelihood | int |  |
| impact_on_barrier | int |  |
| is_organizational_factor | boolean |  |
| is_human_performance_factor | boolean |  |
| detection_method | text |  |
| status | enum | `open`, `controlled`, `closed` |

### 4.3 `degradation_control` (DC)

A measure that prevents, detects, or corrects a degradation factor. **Never** *Escalation Factor Barrier* / *EFB*.

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| degradation_factor_id | uuid | FK |
| title, description | text |  |
| control_type | text |  |
| owner_id | uuid | FK |
| frequency | text |  |
| evidence_required | text |  |
| verification_method | text |  |
| status | enum | `active`, `failing`, `failed` |
| linked_action_id | uuid | nullable; FK → action |

### 4.4 `gap_record`

A first-class object that documents a **pathway with no barrier**. Required to publish a Bowtie when a structural barrier is missing — a bare missing barrier never passes the approval gate.

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| bowtie_id | uuid | FK |
| pathway | enum | `threat`, `consequence` |
| linked_threat_id | uuid | nullable |
| linked_consequence_id | uuid | nullable |
| description | text |  |
| owner_id | uuid | FK |
| target_resolution_date | date | required |
| linked_action_id | uuid | FK → action; required |
| status | enum | `open`, `closed` |

---

## 5. Performance standards & verification

### 5.1 `performance_standard`

Reusable. Many barriers may reference the same Performance Standard. PS changes trigger MOC review on every referencing barrier.

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| code, name, purpose | text |  |
| functional_requirement | text |  |
| performance_requirement | text |  |
| availability_requirement | text |  |
| reliability_requirement | text |  |
| survivability_requirement | text |  |
| response_time | text |  |
| capacity | text |  |
| inspection_requirement | text |  |
| test_requirements | text |  |
| acceptance_criteria | text |  |
| responsible_role_code | text |  |
| evidence_type | text |  |
| verification_frequency | text |  |

### 5.2 `verification_regime`

Defines *how* verification is done for a barrier (method, frequency, acceptance).

### 5.3 `verification_task`

A scheduled instance produced by the regime. Owned by `apps/worker`.

### 5.4 `verification_evidence`

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| verification_task_id | uuid |  |
| barrier_id | uuid |  |
| verifier_id | uuid |  |
| method | text |  |
| result | enum | `pass`, `fail`, `partial`, `not_executed` |
| evidence_blob_url | text | Vercel Blob reference |
| comments | text |  |
| signed_at | timestamptz | step-up MFA-gated when present |
| next_due_date | date |  |

---

## 6. Risk

### 6.1 `risk_matrix`

Configurable per tenant; default seed is 5×5.

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| name | text |  |
| dimensions | jsonb | `{ likelihood: [...], severity: [...] }` |
| cells | jsonb | mapping `(likelihood, severity)` → band |

### 6.2 `risk_assessment`

The 4-level risk record per Bowtie / per (threat × consequence).

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| bowtie_id | uuid |  |
| threat_id | uuid | nullable |
| consequence_id | uuid | nullable |
| inherent_likelihood, inherent_severity, inherent_risk | int | matrix-derived |
| current_likelihood, current_severity, current_risk | int |  |
| residual_likelihood, residual_severity, residual_risk | int |  |
| target_risk | int |  |
| alarp_status | enum | `not_required`, `pending_justification`, `accepted`, `rejected` |
| alarp_justification | text |  |
| accepted_by | uuid | FK → user |
| accepted_at | timestamptz |  |

### 6.3 `risk_register_entry` & `bowtie_risk_link`

Bowties link bidirectionally to enterprise risk register entries.

---

## 7. Cross-domain links

### 7.1 `incident_bowtie_link`

Tie real events to bowties.

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| incident_id | uuid |  |
| bowtie_id | uuid |  |
| top_event_realized | boolean |  |
| threats_materialized | uuid[] |  |
| barriers_worked | uuid[] |  |
| barriers_failed | uuid[] |  |
| degradation_factors_present | uuid[] |  |
| triggers_revision | boolean |  |

### 7.2 `moc_bowtie_link`

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| moc_id | uuid |  |
| bowtie_id | uuid |  |
| affects_hazard | boolean |  |
| affects_top_event | boolean |  |
| affects_preventive | boolean |  |
| affects_mitigative | boolean |  |
| affects_performance_standards | boolean |  |
| affects_procedures_skills_maintenance | boolean |  |
| recommendation | enum | `no_change`, `barrier_impact_assessment`, `temporary_compensatory`, `revise_bowtie`, `risk_register_update` |

---

## 8. Workshop mode

### 8.1 `workshop_session`

Per-workshop record. Stores participants, decisions, and parking-lot items.

### 8.2 `workshop_decision`

### 8.3 `workshop_parking_item`

Detailed UI in [`04_UI_UX_AND_REPORTS.md`](04_UI_UX_AND_REPORTS.md) §6.

---

## 9. AI suggestions

### 9.1 `ai_suggestion` (canonical 6-field schema)

Every AI invocation persists exactly one row. The 6 canonical fields are: **proposal**, **justification**, **uncertainty**, **questions**, **recommended_action**, **fillable_fields**.

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| invoking_user_id | uuid |  |
| prompt_hash | text | sha-256 of resolved prompt |
| model_id | text | e.g. `claude-opus-4-7` |
| invocation_type | text | `suggest_top_event`, `suggest_threats`, `quality_check`, … |
| context_entity_type, context_entity_id | text, uuid | the bowtie / barrier the call referenced |
| structured_output | jsonb | the canonical 6-field response (proposal · justification · uncertainty · questions · recommended_action · fillable_fields) |
| reviewer_decision | enum | `pending`, `accepted`, `rejected`, `modified` |
| reviewer_id | uuid | nullable until reviewed |
| reviewed_at | timestamptz |  |

When `reviewer_decision` is `accepted` or `modified`, the destination entity stores `ai_origin_suggestion_id = ai_suggestion.id`. The approval gate **blocks** while any element on the Bowtie has an `ai_origin_suggestion_id` whose `reviewer_decision` is null.

Full AI guardrails: [`07_AI_AGENT.md`](07_AI_AGENT.md).

---

## 10. Actions, comments, documents

### 10.1 `action`

A treatment / corrective task.

| Field | Type | Notes |
|---|---|---|
| id, tenant_id | uuid |  |
| title, description | text |  |
| source_type | enum | `barrier_gap`, `weak_barrier`, `red_health`, `missing_verification`, `high_residual_risk`, `audit_finding`, `incident`, `moc`, `degradation_factor` |
| source_id | uuid |  |
| linked_bowtie_id, linked_barrier_id, linked_risk_id | uuid | nullable |
| owner_id | uuid | FK → user |
| due_date | date |  |
| priority | enum | `low`, `medium`, `high`, `critical` |
| status | enum | `open`, `in_progress`, `pending_verification`, `closed`, `cancelled` |
| evidence_blob_url | text |  |
| effectiveness_review | jsonb | reviewer + verdict + rationale |

### 10.2 `comment`

Generic threaded comments on any entity (bowtie, barrier, action, …).

### 10.3 `document_link`

Reference to an external governing document (procedure, drawing, competence requirement) — the canonical document store is out of scope; this is a typed pointer.

---

## 11. Indexes (composite, mandatory)

These are the indexes promised to Sprint 1. Every list / search hits one of them.

| Table | Index | Reason |
|---|---|---|
| `bowtie` | `(tenant_id, status, next_review_date)` | dashboard "needs review" widget |
| `bowtie` | `(tenant_id, asset_id, status)` | library filter by asset |
| `barrier` | `(tenant_id, criticality, health_status)` | "critical red" widget |
| `barrier` | `(tenant_id, owner_id)` | barrier-owner inbox |
| `barrier` | `(tenant_id, next_verification_date)` | overdue verifications |
| `verification_task` | `(tenant_id, due_at, status)` | worker scheduling |
| `action` | `(tenant_id, owner_id, status, due_date)` | action-owner inbox |
| `action` | `(tenant_id, source_type, status)` | "open CAPA by source" |
| `audit_log` | `(tenant_id, entity_type, entity_id, created_at)` | history view |
| `risk_assessment` | `(tenant_id, bowtie_id)` | open-bowtie hot path |
| `ai_suggestion` | `(tenant_id, context_entity_type, context_entity_id, reviewer_decision)` | approval-gate block check |

All tenant-scoped composite indexes lead with `tenant_id` so RLS does not blow query plans.

---

## 12. Soft delete + immutability summary

- **Every** tenant-scoped entity has `deleted_at`. List/read queries filter it.
- `audit_log` has no `deleted_at` and is **append-only** (trigger-protected).
- A `bowtie` whose status is `approved` or `published` is **immutable** at the application layer; substantive edits require either an MOC link or a tenant config that allows non-substantive (cosmetic) edits, with diff classification deciding which.
- Soft-deleting a barrier owned by an `approved` bowtie is forbidden — the bowtie must transition to `under_revision` first.
