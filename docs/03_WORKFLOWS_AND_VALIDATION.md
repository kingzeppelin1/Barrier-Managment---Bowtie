# 03 · Workflows, State Machines, Validation, RBAC

> Operational rules: how a Bowtie advances through its lifecycle, what the system blocks, what each role may do, and what the 12-step Wizard validates at each step. Implementation prompts: [`prompts/04-auth-rbac.md`](prompts/04-auth-rbac.md), [`prompts/05-bowtie-api.md`](prompts/05-bowtie-api.md), [`prompts/06-12step-wizard.md`](prompts/06-12step-wizard.md).

---

## 1. Bowtie lifecycle (state machine)

### 1.1 States

```
        ┌─────────┐
        │  Draft  │
        └────┬────┘
             │ submit_for_internal_review
             ▼
   ┌─────────────────┐
   │ Internal Review │
   └────┬────────────┘
        │ submit_for_sme_review              reject_to_draft
        ▼                                          ▲
    ┌─────────────┐                                │
    │ SME Review  │────────────────────────────────┘
    └────┬────────┘
         │ submit_for_risk_manager_review
         ▼
   ┌────────────────────────┐
   │ Risk Manager Review    │
   └────┬───────────────────┘
        │ approve  (step-up MFA)
        ▼
    ┌──────────┐  publish (step-up MFA)   ┌───────────┐
    │ Approved │ ───────────────────────▶ │ Published │
    └────┬─────┘                          └─────┬─────┘
         │                                      │ revise
         │                                      ▼
         │                              ┌───────────────┐
         └─────────────revise──────────▶│ Under Revision│
                                        └────┬──────────┘
                                             │ supersede
                                             ▼
                                        ┌────────────┐
                                        │ Superseded │
                                        └────┬───────┘
                                             │ archive
                                             ▼
                                        ┌──────────┐
                                        │ Archived │
                                        └──────────┘
```

### 1.2 Stage rules

| Stage | Required role to enter | Exit transitions | MFA required to exit? |
|---|---|---|---|
| `draft` | any author with `bowtie:write` | submit_for_internal_review | no |
| `internal_review` | Bowtie Facilitator | submit_for_sme_review · reject_to_draft | no |
| `sme_review` | Verifier / Auditor or designated SME | submit_for_risk_manager_review · reject_to_draft | no |
| `risk_manager_review` | Risk Manager | approve · reject_to_draft | **yes** (approve) |
| `approved` | Risk Manager | publish · revise | **yes** (publish) |
| `published` | Risk Manager / Tenant Admin | revise (→ under_revision) | **yes** when sign-of-life is needed (e.g. reissue) |
| `under_revision` | author with `bowtie:write` | submit_for_internal_review · supersede | no |
| `superseded` | system-only after a successor reaches `approved` | archive | no |
| `archived` | terminal | — | — |

### 1.3 Server-side enforcement

- The state transition is **enforced by the API**. UI is a hint, not the gate.
- Skipping a stage is impossible — there is no transition from `draft` directly to `approved`, even for tenant admins.
- Step-up MFA is required for **approve · publish · sign verification · accept ALARP · modify tenant settings**. The token exchange is logged in `audit_log` as a separate row.

---

## 2. Approval gate (server-side, no bypass)

The gate runs whenever `risk_manager_review` → `approved` is attempted. **Every** clause must pass.

### 2.1 Structural rules (Bowtie shape)

1. The Bowtie has exactly one Hazard.
2. The Bowtie has exactly one Top Event, formulated as a loss-of-control statement (validated by [`packages/methodology`](../packages/methodology) `validation/bowtie-structural`).
3. There is at least one Threat.
4. There is at least one Consequence.
5. **Every Threat** has at least one Preventive Barrier OR exactly one open `gap_record` linked to it.
6. **Every Consequence** has at least one Mitigative Barrier OR exactly one open `gap_record` linked to it.
7. **Every barrier on the same pathway is independent** of the others (no shared common-cause failure path; warning-level rule but blocks if any pathway has zero independent barriers).
8. The Bowtie has a `next_review_date`.
9. The risk matrix referenced exists and matches the Bowtie's tenant.

### 2.2 Barrier quality gate (8 criteria, all required for critical barriers)

A barrier passes the quality gate only if **all** of these are demonstrably true:

1. **Specific** — names the threat(s) / consequence(s) it addresses.
2. **Effective** — proven sufficient at the relevant severity.
3. **Independent** — no shared common-cause failure path with another barrier on the same pathway.
4. **Auditable** — effectiveness can be evidenced through inspection, test, drill, or audit.
5. **Owned** — has a named `owner_id`.
6. **Verifiable** — has a defined `verification_regime_id`.
7. **Documented** — references a `performance_standard_id` and a procedure / drawing / competence requirement.
8. **Supported** — competence, maintenance, and procedure systems behind it are in place.

For non-critical barriers, criteria 1–4 are mandatory; 5–8 are warnings.

### 2.3 Risk + ALARP

- All four risk levels (Inherent · Current · Residual · Target) are populated.
- If `residual_risk > target_risk`, an ALARP justification record (`alarp_status = accepted`, `accepted_by`, `alarp_justification`) is required and is signed by the Risk Manager with step-up MFA.

### 2.4 AI-origin block

The gate blocks while any element on the Bowtie has an `ai_origin_suggestion_id` whose `ai_suggestion.reviewer_decision` is null. Once every AI-origin element is `accepted` / `modified` / `rejected` (and re-authored) by a named human reviewer, the gate proceeds.

### 2.5 Failure mode

A failed gate returns `422 Unprocessable Entity` with a structured violation list:

```json
{
  "violations": [
    { "rule": "threat_without_barrier_or_gap", "threat_id": "...", "severity": "block" },
    { "rule": "barrier_quality_owner_missing", "barrier_id": "...", "severity": "warn" }
  ]
}
```

UI surfaces them inline next to the offending element.

---

## 3. The 12-step Wizard

Each step is a route under `/bowties/new/<step>`. Each step has its own server validation; navigating "next" without passing returns the user to the same step with messages.

| # | Step | Validation highlights |
|---|---|---|
| 1 | Scope and context | Title, asset, scope-in / scope-out, risk-matrix selected. |
| 2 | Hazard | Name + category selected from enum-backed reference data; energy source non-empty. |
| 3 | Top Event | Loss-of-control statement passes structural validation (verb shape, no cause/consequence wording). |
| 4 | Threats | At least one threat; each has category + credibility. |
| 5 | Consequences | At least one consequence with severity. |
| 6 | Preventive barriers | At least one preventive barrier per Threat OR an open Gap Record linked to that threat. |
| 7 | Mitigative barriers | Same as 6, on the consequence side. |
| 8 | Degradation factors | Each critical barrier has at least one DF *or* an explicit "no DF" justification. |
| 9 | Degradation controls | Every DF has at least one DC *or* an open Action linked to it. |
| 10 | Risk assessment | All four levels populated; ALARP record exists when Residual > Target. |
| 11 | Actions / treatment plan | Every Red barrier has at least one open Action; every gap_record references an Action. |
| 12 | Review, approval, publish | Triggers the [Approval gate](#2-approval-gate-server-side-no-bypass). |

A draft can be saved at any step. Step n cannot be marked complete unless step n−1 is complete.

---

## 4. Roles and permissions

### 4.1 Role definitions

| Role | Primary responsibilities |
|---|---|
| **System Admin** | Tenant config, integrations, master data. |
| **Tenant Admin** | Users, roles, risk matrix, approval flow, asset hierarchy. |
| **Risk Manager** | Methodology, quality, approval, reporting. Sign-off on ALARP and Approve / Publish transitions. |
| **Bowtie Facilitator** | Leads workshops; builds bowtie analyses; moves draft → review. |
| **Barrier Owner** | Owns one or more barriers; signs verification + action close-out for owned barriers. |
| **Action Owner** | Owns CAPA / treatment actions; provides evidence of effectiveness. |
| **Verifier / Auditor** | Independent verification; audit findings; SME review stage. |
| **Operations User** | Read; reports observations and degradation flags. |
| **Management** | Reads dashboards and reports. |
| **Regulator (External)** | Read-only on Published Bowties. |

### 4.2 Permissions matrix (high level)

A read = "can list and view"; W = "can create / edit own"; ✓ = "can act" (approve, publish, sign, etc.).

| Permission | Sys Admin | Tenant Admin | Risk Mgr | Facilitator | Barrier Owner | Action Owner | Verifier | Ops | Mgmt | Regulator |
|---|---|---|---|---|---|---|---|---|---|---|
| `tenant:configure` | ✓ | ✓ | – | – | – | – | – | – | – | – |
| `users:manage` | – | ✓ | – | – | – | – | – | – | – | – |
| `risk_matrix:edit` | – | ✓ | ✓ | – | – | – | – | – | – | – |
| `bowtie:read` | A | A | A | A | A | A | A | A | A | A (Published only) |
| `bowtie:write` | – | – | ✓ | ✓ | – | – | – | – | – | – |
| `bowtie:submit_review` | – | – | ✓ | ✓ | – | – | – | – | – | – |
| `bowtie:sme_review` | – | – | – | – | – | – | ✓ | – | – | – |
| `bowtie:risk_manager_review` | – | – | ✓ | – | – | – | – | – | – | – |
| `bowtie:approve` | – | – | ✓ (MFA) | – | – | – | – | – | – | – |
| `bowtie:publish` | – | – | ✓ (MFA) | – | – | – | – | – | – | – |
| `barrier:write` | – | – | ✓ | ✓ | W (own) | – | – | – | – | – |
| `verification:sign` | – | – | – | – | – | – | ✓ (MFA) | – | – | – |
| `verification:read` | A | A | A | A | A | A | A | A | A | – |
| `action:write` | – | – | ✓ | ✓ | – | W (own) | – | – | – | – |
| `action:close_out` | – | – | ✓ | – | – | ✓ | – | – | – | – |
| `alarp:accept` | – | – | ✓ (MFA) | – | – | – | – | – | – | – |
| `audit_log:read` | A | A | A | A | (own entities) | (own entities) | A | – | A | – |

### 4.3 Cross-tenant access

A user from tenant B querying a record in tenant A receives **404, not 403**. Returning 403 leaks the existence of the resource. A `security_event` row is also written.

The middleware in `apps/web/middleware.ts` resolves the user, attaches `tenantId` and `roleAssignments` to the request, and the `withRBAC(permission, scope)` helper applies these rules per route handler.

---

## 5. Validation rules (system-wide warnings/blocks)

The system stops or warns the user when:

| Severity | Rule |
|---|---|
| **block** | Bowtie missing Hazard. |
| **block** | Bowtie missing Top Event. |
| **block** | Top Event formulated as a Cause or Consequence (structural validation). |
| **block** | Threat lacks a preventive barrier *and* lacks a documented Gap Record. |
| **block** | Consequence lacks a mitigative barrier *and* lacks a documented Gap Record. |
| **block** | Critical barrier missing owner. |
| **block** | Critical barrier missing verification method. |
| **block** | Critical barrier missing performance standard. |
| **block** | Red barrier lacking an open Action. |
| **block** | Residual risk > Target risk without an accepted ALARP justification. |
| **block** | Bowtie published without a `next_review_date`. |
| warn | A barrier is on the wrong side of the Top Event (preventive on the right, mitigative on the left). |
| warn | A barrier is suspected of being an Action (heuristic: contains verbs like "investigate", "review the cause"). |
| warn | A pathway has only one barrier (single point of failure). |
| warn | "Safety culture" or similar non-specific terms are used as a barrier name. |
| warn | A DF exists with no DC and no linked open Action. |
| warn | A barrier references a Performance Standard whose `verification_frequency` is overdue. |

These rules are implemented as pure functions in [`packages/methodology/src/validation/`](../packages/methodology/src/validation/). Each has a unit test with positive and negative cases, and ≥ 95 % branch coverage is enforced in CI.

---

## 6. Incident integration workflow

When an incident or near-miss occurs:

1. The Operations User opens the related Bowtie and clicks "Link incident".
2. They mark which Threat materialized, which barriers worked, which failed, and which Degradation Factors were present.
3. The system suggests creating one or more new Degradation Factors based on root-cause categories.
4. The system creates one or more Actions (CAPA) tagged `source_type = incident`.
5. The system recomputes barrier health for every barrier referenced.
6. The system marks the Bowtie for review (`bowtie.next_review_date = now()`) if any preventive barrier was marked failed.

Audit log captures every step; the incident is linked back via `incident_bowtie_link`.

---

## 7. MOC integration workflow

When an MOC record is created or updated:

1. The system asks the standard MOC questions (see [`prompts/05-bowtie-api.md`](prompts/05-bowtie-api.md) for the canonical list — Does the change affect existing hazards? new hazards? Top Event? preventive barriers? mitigative barriers? performance standards? procedures, skills, or maintenance?).
2. If **any** answer is yes, the system creates a `moc_bowtie_link` and recommends one or more of:
   - Bowtie review (transitions affected Bowties to `under_revision`),
   - Barrier impact assessment,
   - Temporary compensatory measures (creates a Degradation Control flagged `temporary`),
   - Risk Register update,
   - Risk Manager / Barrier Owner approval.
3. The link participates in the approval gate of the affected Bowties — they cannot return to `published` until the MOC link's `recommendation` is acknowledged.

---

## 8. Audit & assurance workflow

### 8.1 Audit types

- Bowtie quality audit
- Barrier verification audit
- Performance standards audit
- Field verification
- Procedure compliance audit
- Emergency response assurance
- Human-factors review

### 8.2 Standard audit questions

The Audit module ships with the following question bank, used as templates:

- Is the Bowtie up to date?
- Are Hazards and Top Events correctly defined (loss-of-control wording)?
- Do all Threats have relevant barriers (or documented gaps)?
- Do all Consequences have relevant barriers (or documented gaps)?
- Are critical barriers verified? Is there evidence?
- Are barrier owners aware of their accountability?
- Are performance requirements defined?
- Have degradation factors been considered?
- Are there any open actions (overdue or stale)?

Findings flow to Actions tagged `source_type = audit_finding`.

---

## 9. Configuration

A Tenant Admin can configure:

- Risk matrices (default 5×5; per-business-unit overrides allowed).
- Consequence categories.
- Likelihood scale.
- Severity scale.
- Acceptance criteria + ALARP rules.
- Barrier types (within the canonical 5).
- Barrier statuses (within the canonical 4 + `red_compensated`).
- Verification frequency presets.
- Roles (within the canonical 10 codes; permission grants editable).
- Approval flow (within the canonical 6-stage shape; SME-review stage may be configured to require ≥ N reviewers).
- Review frequency defaults (12 mo / 6 mo / 3 mo per [`00_RECONCILIATION_NOTES.md`](00_RECONCILIATION_NOTES.md) §6).
- Asset structure / process hierarchy.
- Template library (sector seed packs).

Every config change writes an `audit_log` row.
