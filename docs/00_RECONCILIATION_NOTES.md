# 00 · Reconciliation Notes

This document tracks **deliberate departures from, and elaborations on, the source spec** ([`Barrier Management Bowtie App Spec - English.docx`](https://example.invalid)) so that future readers can see *why* the repo says what it says where it differs from the original brief. The source spec is the starting point; these notes — together with ADRs in [`decisions/`](decisions/) — are the running diff against it.

> The source spec is reproduced (split and lightly normalized) across [`01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md), [`02_DATA_MODEL.md`](02_DATA_MODEL.md), [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md), [`04_UI_UX_AND_REPORTS.md`](04_UI_UX_AND_REPORTS.md), [`05_ARCHITECTURE_SECURITY_ACCEPTANCE.md`](05_ARCHITECTURE_SECURITY_ACCEPTANCE.md), [`07_AI_AGENT.md`](07_AI_AGENT.md). The companion file [`08_PACKAGE_STRUCTURE.md`](08_PACKAGE_STRUCTURE.md) covers stack and folder layout.

---

## 1. Most important design decision (verbatim from the source)

> **Build this as a Barrier Management system with bowtie as visualization, not as a pure bowtie drawing program.**
>
> This means that each visual element in the diagram must be connected to:
> responsibility, status, evidence, performance requirements, risk, measures, revision, events, MOC, and documentation.
>
> The bowtie diagram should be the visualization, but the value lies in the linkage to ownership, evidence, performance requirements, verification, actions, risk acceptance, MOC, incidents, and audit.

This single sentence is load-bearing for every modelling and UI decision in the rest of the docs.

---

## 2. Standards used as professional basis (not reproduced verbatim)

ISO standards are copyrighted; the spec **operationalizes** their principles rather than quoting them. The repo follows the same posture.

| Standard | Used for |
|---|---|
| **ISO 31000:2018** | Holistic risk management framework + process (context → assessment → treatment → monitoring → communication). |
| **IEC 31010:2019** | Selection and use of risk-assessment techniques; positions Bowtie as a qualitative method. |
| **CCPS / Energy Institute — *Bow Ties in Risk Management*** | Canonical bowtie methodology and barrier-management terminology (Hazard, Top Event, Threat, Consequence, Barrier, Degradation Factor, Degradation Control). |
| **IOGP Report 544** | Standardized barrier definitions and process-safety terminology. |
| **IOGP 415, 456** | Barrier health, asset integrity. |
| **DNV — Barrier Management** | Bowtie as the bridge between risk assessment and operational barrier integrity. |
| **IChemE / Hazards 28** | Quality criteria for barriers (effective, independent, auditable) + the *detect–decide–act* model for active barriers. |
| **NORSOK S-001** | Norwegian offshore safety. |
| **IEC 61511 / 61508** | Safety Instrumented Systems / SIL. |
| **IEC 62443** | OT cybersecurity. |
| **ISM Code** | Maritime safety management. |
| **ICAO Annex 19** | Aviation safety management. |

A 50-link reference list curated alongside the spec lives at [`references/50_BOWTIE_ISO31000_LINKS.md`](references/50_BOWTIE_ISO31000_LINKS.md).

---

## 3. Deltas between the source spec and the operating-manual / glossary in this repo

Where the original brief and the repo's [`CLAUDE.md`](../CLAUDE.md) / [`11_GLOSSARY.md`](11_GLOSSARY.md) drift, the repo wins **unless** an item below promotes the source.

### 3.1 Approval lifecycle — 6 stages, not 8

The source spec lists eight states under "Step 12: Review, approval and publish":

> Draft · Internal Review · SME Review · Risk Manager Review · Approved · Published · Under Review · Archived

The repo treats this as **6 stages plus auxiliary states**:

- **Stages:** Draft → Internal Review → SME Review → Risk Manager Review → Approved → Published.
- **Auxiliary states:** Under Revision · Superseded · Archived (per [`11_GLOSSARY.md`](11_GLOSSARY.md)).

The source's "Under Review" maps to **Under Revision**. "Archived" is preserved verbatim. "Superseded" is added because the spec's lifecycle implies it (an approved-then-revised bowtie produces a superseded predecessor) but does not name it.

### 3.2 Roles — 9, not 8

The source lists 8 roles (System Admin, Risk Manager, Bowtie Facilitator, Barrier Owner, Action Owner, Verifier/Auditor, Operations User, Management). The repo splits System Admin into two and adds **Regulator (External)** as a read-only role for published bowties:

- **System Admin** — tenant config, integrations, master data.
- **Tenant Admin** *(added)* — users, roles, risk matrix, approval flow, asset hierarchy.
- **Risk Manager** · **Bowtie Facilitator** · **Barrier Owner** · **Action Owner** · **Verifier / Auditor** · **Operations User** · **Management** — as in the source.
- **Regulator (External)** *(added)* — read-only on Published bowties.

### 3.3 Terminology — never weaken

The repo enforces the modern CCPS/EI vocabulary even where older bowtie literature uses different words:

- ✅ **Degradation Factor** — never *Escalation Factor*.
- ✅ **Degradation Control** — never *Escalation Factor Barrier* / *EFB*.
- ✅ **Top Event** is a **loss-of-control statement**, never a cause and never a consequence.
- ✅ **Bowtie analysis** / **Barrier management**, not "bowtie diagram" when meaning the system.

### 3.4 Risk levels — always 4

The source already specifies four levels (Inherent, Current, Residual, Target). Two-level shortcuts (Inherent + Residual only) are **forbidden** in this repo.

### 3.5 Barrier health — numeric 0–100 plus colour bands

The source proposes:

- 90–100 Green · 70–89 Yellow · 0–69 Red · Unknown Gray

This is preserved exactly. The repo additionally fixes:

- **Compensated red** stays Red with `with_compensatory=true` — it is **never** auto-promoted to Yellow or Green. (The source says "may be shown as red with mitigation"; the repo makes this non-negotiable.)
- **Critical-barrier floors:** if a critical barrier is overdue for verification, has no owner, or has an open critical finding, the calculator clamps to a non-Green band automatically. (Source intent; repo makes it deterministic.)
- The canonical calculator lives in `packages/methodology` with ≥95 % branch-coverage budget — see [`08_PACKAGE_STRUCTURE.md`](08_PACKAGE_STRUCTURE.md) §4.

### 3.6 Documented gap pattern

The source's approval gate ("threats must have at least one … barrier *or documented gap*") becomes a **first-class entity** in this repo:

- A `gap_record` carries owner + target_resolution_date + a linked Action.
- A bare missing barrier never passes the approval gate.
- This is the only methodology-honest way to publish a Bowtie with known gaps.

### 3.7 AI agent — advisory only, gating-aware

The source's section 14 lists tasks the AI agent should perform. The repo adds **non-negotiable guardrails** on top:

- AI never autonomously creates, modifies, or approves safety-critical content. Every accepted suggestion needs a named human reviewer.
- Every AI invocation persists an `ai_suggestion` row (canonical 6-field schema) with `prompt_hash`, `model_id`, full structured output.
- Every accepted suggestion writes `ai_origin_suggestion_id` on the destination entity.
- The approval gate **blocks** when any element on the Bowtie has `ai_origin_suggestion_id` pointing to a suggestion whose `reviewer_decision` is null.
- A tenant may disable the AI agent entirely; the rest of the product must remain fully functional.

### 3.8 Multi-tenancy & cross-tenant isolation

The source mentions "Multi-tenant support" only under section 22 ("Enterprise functionality later"). The repo treats multi-tenancy as **foundational from day one** because it is materially harder to retrofit:

- Postgres Row-Level Security on every tenant-scoped table (`USING (tenant_id = current_setting('app.tenant_id')::uuid)`).
- ORM-level filtering via a tenant-aware Prisma client.
- Cross-tenant access returns **404, not 403**, and emits a security event.

ADR scheduled: `decisions/0001-postgres-rls-as-defense-in-depth.md` (per Sprint 1 backlog).

### 3.9 Stack — Next.js, not NestJS

The source does not mandate a framework. An earlier draft of the architecture doc suggested NestJS for the API; the repo deviates to **Next.js 15 App Router** (Route Handlers serve as the REST API). Rationale and ADR: see [`08_PACKAGE_STRUCTURE.md`](08_PACKAGE_STRUCTURE.md) §1.1 and the planned `decisions/0001-nextjs-instead-of-nestjs.md`.

---

## 4. Translation cleanups applied

The English source was machine-translated from Norwegian. The split docs preserve the source's intent but normalize a handful of obvious artefacts:

| Source phrase | Normalized to | Notes |
|---|---|---|
| "Barriers' page" / "Barrier page" | "Barrier side" (preventive vs mitigative) | `side` in Norwegian = English *side*, mistranslated as *page*. |
| "Pigeon date" | "Due date" | Norwegian *frist*. |
| "Overprint" | "Overpressure" | *Overtrykk*. |
| "Fatigue alarm" | "Alarm fatigue" | Word-order. |
| "Ice human performance factor?" | "Is human-performance factor?" | OCR/ASR garble. |
| "Acceptance criteria / ALARP criteria" + "alarm status" (in Risk Assessment) | "ALARP status" | The source intermittently writes *alarm* for *ALARP*. |
| "near-incident occurs , the user…" | "When a near-incident occurs, the user…" | Missing leading clause. |

These are written down here so reviewers can confirm none of them changes meaning.

---

## 5. Items deferred to ADR

The following are mentioned but not decided in the source. Each will land an ADR before the relevant prompt is executed:

- **0001 — Next.js (not NestJS) for API.** Reason: Vercel-native single deploy unit.
- **0002 — Postgres RLS as defense-in-depth** alongside ORM filtering.
- **0003 — Liveblocks (managed Yjs) for workshop-mode co-editing** in MVP; option to self-host y-websocket later.
- **0004 — Auth.js (NextAuth)** as the auth provider with Credentials + OIDC; SAML deferred.
- **0005 — Anthropic Claude** as the AI provider for the Bowtie Assistant.
- **0006 — BullMQ + Upstash Redis** for background jobs.
- **0007 — Vercel Blob** for evidence storage.

---

## 6. Open methodology questions

These were not resolved by the source spec and need the Risk Manager's call before the relevant sprint:

1. **Risk-matrix dimensionality:** the source mentions a risk matrix and 5×5 is implied by the Sprint 1 seed; confirm whether 4×4 / 5×5 / 6×6 is the org default, and whether different sectors get different matrices per tenant.
2. **ALARP justification format:** the source requires "Risk Manager justification" but does not specify a structure; propose a structured template (driver, alternatives considered, cost / benefit, residual exposure, sign-off).
3. **Periodic-review cadence:** "next review date" is mandatory but the default cadence is unset. Default proposal: 12 months for Approved Bowties, 6 months for any Bowtie with one or more Red barriers, 3 months for Bowties with an open ALARP justification.
4. **Sector templates:** the source mentions a template library and gives maritime + offshore-process examples; confirm which sectors ship with seed templates in MVP (proposal: maritime + offshore-process only).
