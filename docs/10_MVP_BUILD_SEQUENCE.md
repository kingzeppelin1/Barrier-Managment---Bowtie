# MVP Build Sequence

This document is the **dependency-ordered plan** to take the repo from empty to MVP-shipped. It maps to the 10 prompts in [`prompts/`](prompts/) and the sprint backlog in [`09_SPRINT_1_BACKLOG.md`](09_SPRINT_1_BACKLOG.md).

> **MVP scope** (per [`01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md) §3.1): Bowtie Library, 12-step Wizard, Graphical Bowtie editor, Barrier Register, Barrier Health, Action management, Risk matrix, 6-stage Approval flow, PDF export, AI quality check, Audit trail, RBAC.

---

## At a glance

```
Sprint 1: Foundation              ─── prompt 01, 02
Sprint 2: Domain schema + audit   ─── prompt 03
Sprint 3: Auth + Bowtie API       ─── prompt 04, 05
Sprint 4: 12-step Wizard          ─── prompt 06
Sprint 5: Bowtie Canvas           ─── prompt 07
Sprint 6: Barrier Health          ─── prompt 08
Sprint 7: AI Agent                ─── prompt 09
Sprint 8: PDF + hardening         ─── prompt 10
```

**MVP delivery: end of Sprint 8 (~16 weeks).**

---

## Dependency graph

```
                    ┌─────────────────────────┐
                    │ 01 Foundation (S1)      │
                    │ monorepo, vercel, ci    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 02 DB + Tenancy + RLS   │
                    │ (S1)                    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 03 Domain Schema (S2)   │
                    │ all entities + audit    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 04 Auth + RBAC (S3)     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ 05 Bowtie API (S3)      │
                    │ CRUD + 6-stage approval │
                    └─────┬────────────┬──────┘
                          │            │
              ┌───────────▼──┐    ┌────▼────────────┐
              │ 06 12-step   │    │ 08 Barrier      │
              │ Wizard (S4)  │    │ Health (S6)     │
              └───────┬──────┘    └────┬────────────┘
                      │                │
              ┌───────▼─────────────┐  │
              │ 07 Canvas (S5)      │◄─┘  health renders on canvas
              └───────┬─────────────┘
                      │
              ┌───────▼─────────────┐
              │ 09 AI Agent (S7)    │  used in wizard + canvas
              └───────┬─────────────┘
                      │
              ┌───────▼─────────────┐
              │ 10 PDF + harden(S8) │
              └─────────────────────┘
```

---

## Sprint-by-sprint plan

### Sprint 1 — Foundation (2 weeks)

**Goal:** Empty monorepo → working CI/CD with Postgres + Auth scaffold + audit log.

| Story | Prompt |
|---|---|
| Repo bootstrap | [`01-foundation.md`](prompts/01-foundation.md) |
| Vercel + CI | (within prompt 01) |
| DB + RLS + multi-tenancy | [`02-database-and-tenancy.md`](prompts/02-database-and-tenancy.md) |

**Exit:** [`09_SPRINT_1_BACKLOG.md`](09_SPRINT_1_BACKLOG.md) Definition of Sprint Done.

### Sprint 2 — Domain schema + audit infrastructure (2 weeks)

**Goal:** Full Prisma schema, every entity from spec; `withAudit()` wrapper proven on a sample mutation.

| Story | Prompt |
|---|---|
| Full domain schema + migrations + seed | [`03-domain-schema.md`](prompts/03-domain-schema.md) |
| Audit log wrapper + RFC 6902 patch + immutability | (within prompt 03) |
| Reference data seeders (sector templates skeleton) | (within prompt 03) |

**Exit:** Database can be reset and seeded deterministically. Sample mutation creates an audit row with a valid patch. Tests cover positive + cross-tenant negative.

### Sprint 3 — Auth + Bowtie API (2 weeks)

**Goal:** Users can log in. Bowties, hazards, top-events, threats, consequences are full CRUD with the 6-stage approval state machine.

| Story | Prompt |
|---|---|
| Auth.js + RBAC middleware | [`04-auth-rbac.md`](prompts/04-auth-rbac.md) |
| Hazard, Top Event, Bowtie, Threat, Consequence endpoints | [`05-bowtie-api.md`](prompts/05-bowtie-api.md) |
| 6-stage approval state machine + validation gate | (within prompt 05) |

**Exit:** Postman/curl proves: create draft → progress through 6 stages → cannot skip → cannot edit Approved without MOC → audit trail complete.

### Sprint 4 — 12-step Wizard (2 weeks)

**Goal:** Users can build a Bowtie end-to-end through the methodology-enforcing Wizard.

| Story | Prompt |
|---|---|
| 12-step Wizard UI (server components + client steps) | [`06-12step-wizard.md`](prompts/06-12step-wizard.md) |
| Barrier + Degradation Factor + Degradation Control + Gap Record endpoints | (within prompt 06) |
| Wizard exit criteria enforced server-side | (within prompt 06) |

**Exit:** A user can complete all 12 steps for the maritime lifting example and submit for review. Cannot skip steps. Audit log shows every transition.

### Sprint 5 — Bowtie Canvas (2 weeks)

**Goal:** Users can see the Bowtie as a graph, click any element to open the Side Panel, filter by criticality / health.

| Story | Prompt |
|---|---|
| React Flow canvas with all node types | [`07-bowtie-canvas.md`](prompts/07-bowtie-canvas.md) |
| Side Panel with 8 tabs (per `04_UI_UX_AND_REPORTS.md` §2.4) | (within prompt 07) |
| 6-color visual encoding + filters | (within prompt 07) |
| Read-only mode for Approved/Published | (within prompt 07) |

**Exit:** Open the seeded Bowtie at `/bowties/<id>`; visually correct; all 8 Side Panel tabs render real data; filters work; cannot edit a published Bowtie.

### Sprint 6 — Barrier Health calculator + verification (2 weeks)

**Goal:** Numeric 0–100 barrier health computed deterministically from inputs; verification regimes generate tasks; failed verification turns barriers Red and creates Actions.

| Story | Prompt |
|---|---|
| `calculateBarrierHealth` pure function with all penalties + floors | [`08-barrier-health.md`](prompts/08-barrier-health.md) |
| Verification regime + task + evidence endpoints | (within prompt 08) |
| BullMQ worker job: nightly verification scheduler | (within prompt 08) |
| Action creation on failed verification | (within prompt 08) |
| Health rollup materialized view | (within prompt 08) |

**Exit:** A failed verification recalculates health to Red (or floor 69), creates an Action, dispatches a notification, and the canvas dot color updates within one event-loop tick.

### Sprint 7 — AI Agent (2 weeks)

**Goal:** Bowtie Assistant available in the Wizard and the Side Panel "AI Check" tab; suggestions are advisory, audited, and gate-blocking until reviewed.

| Story | Prompt |
|---|---|
| AI agent route handler in `apps/web/app/api/v1/ai/` | [`09-ai-agent.md`](prompts/09-ai-agent.md) |
| Anthropic client + canonical 6-field output schema | (within prompt 09) |
| `ai_suggestion` table integration; `ai_origin_suggestion_id` writes | (within prompt 09) |
| Wizard AI Coach pane | (within prompt 09) |
| Side Panel "AI Check" tab | (within prompt 09) |
| Approval-gate enforcement: cannot approve with undecided AI suggestions | (within prompt 09) |

**Exit:** "Crane drops load" as Top Event triggers the AI to suggest "Loss of control over suspended load". Acceptance writes `ai_origin_suggestion_id`. Trying to approve before reviewer decision is blocked with a clear error.

### Sprint 8 — PDF export + hardening (2 weeks)

**Goal:** Regulator-ready PDF; performance budget met; pen test fixes; v1.0 MVP shipped.

| Story | Prompt |
|---|---|
| Bowtie PDF (full report per `04_UI_UX_AND_REPORTS.md` §2.15) | [`10-pdf-export.md`](prompts/10-pdf-export.md) |
| Performance budget enforcement + Lighthouse CI | (within prompt 10) |
| A11y pass (WCAG 2.1 AA) | (within prompt 10) |
| Pen test fixes | (manual) |
| Documentation review + ADR backlog cleared | (manual) |

**Exit:** MVP shippable. Stakeholder demo. Regulator pack PDF reviewed by Risk Manager.

---

## Post-MVP backlog (Sprints 9–14)

Per [`01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md) §3.1 (post-MVP):

| Sprint | Theme |
|---|---|
| 9 | Reports library + Regulator pack export |
| 10 | Risk Register module (bidirectional) |
| 11 | Incident → Bowtie linkage + overlay |
| 12 | MOC integration with FR-12 questionnaire |
| 13 | Workshop mode (Liveblocks + parking + decision log) |
| 14 | Webhooks + outbound API + Audit programmes |

---

## What we deliberately defer

- Mobile field inspection app — v1.1.
- QR codes on equipment — v1.1.
- IoT signal → barrier degradation — v1.2.
- Power BI native connector — v1.2.
- Sector-trained ML for barrier suggestions — v1.2.
- Quantitative LOPA calculator — v1.2.
- Dynamic Bayesian Bowtie — v2.0.

---

## Sequencing rules

1. **Don't start a downstream item before its upstream is merged.** The dependency graph above is binding, not a suggestion.
2. **The methodology package leads.** Any UI or API work that depends on validation rules or health calculation waits for the methodology function to land first (and to be 95%+ covered).
3. **Audit before features.** S1-06 (audit log) ships in Sprint 1 because every subsequent mutation needs to wrap.
4. **Tests in the same PR.** No "tests in a follow-up" — CI rejects PRs that drop coverage.
5. **ADRs before deviations.** If a stack or architecture deviation looks tempting, write the ADR first.
