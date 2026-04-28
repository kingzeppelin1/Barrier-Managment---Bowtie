# Glossary

A one-page quick reference for the methodology terminology used throughout this codebase. When in doubt, this page wins. When this page disagrees with a deeper section of the spec, the deeper section wins.

---

## Core entities

**Hazard** — A source of potential harm: stored energy, hazardous material, or hazardous situation. *Example: hydrocarbon under pressure; load suspended from a crane.*

**Top Event** — The point at which control over the Hazard is lost. Phrased as a **loss-of-control statement**, never as a cause and never as a consequence. *Example: "Loss of control over hydrocarbon containment"; "Loss of control over suspended load".*

**Threat** — A credible cause that could realize the Top Event. *Example: corrosion; bad rigging.*

**Consequence** — A possible outcome if the Top Event is not controlled. *Example: gas leak; personal injury.*

**Barrier** — A control that, when present and effective, prevents a Threat from realizing the Top Event (preventive) or limits the Consequence once the Top Event has occurred (mitigative). Must be **specific, effective, independent, auditable, owned, verifiable, documented, supported**.

**Degradation Factor (DF)** — A condition that weakens a Barrier's ability to perform its function. *Example: maintenance backlog; missing competence; alarm fatigue.* (Replaces the older term "Escalation Factor".)

**Degradation Control (DC)** — A measure that prevents, detects or corrects a Degradation Factor. *Example: inspection programme; competence assessment; alarm review.* (Replaces the older term "Escalation Factor Barrier" / "EFB".)

**Gap Record** — A first-class object that documents a pathway with no barrier, owned and time-bound, with a linked Action. Allows methodology-honest "we know we don't have one yet" without breaking the approval gate.

**Performance Standard (PS)** — A reusable, structured definition of what a barrier must achieve. Many barriers may reference the same PS. PS changes trigger MOC review on every referencing barrier.

**Action** — A treatment or corrective task: title, owner, due date, evidence, effectiveness review.

---

## Barrier classification

**Type** (CCPS/EI canonical, 5 classes):
- Hardware – Passive
- Hardware – Active
- Human – Active
- Human – Procedural
- Organizational

**Subtype** (operational, 8 classes — for richer tagging):
Passive technical / Active technical / Active technical+human / Human / Organizational / Procedural / Emergency response / Continuous.

**Function** (what the barrier does on its pathway):
- Preventive: prevent / detect / control / isolate / stop / warn
- Mitigative: detect / respond / contain / evacuate / recover / mitigate

---

## Risk model

**Inherent risk** — risk with no barriers in place.
**Current risk** — risk with existing barriers operating at current health.
**Residual risk** — risk with planned new measures fully effective.
**Target risk** — the risk level the organization aims for.

**ALARP** — As Low As Reasonably Practicable. Required when Residual > Target. Demonstrated with structured justification, signed by Risk Manager.

---

## Health and color

**Health score** — numeric 0–100, computed from verifications, findings, actions, incidents, maintenance, competence, document status, MOC, optional manual assessment.

**Bands:**
- **Green** 90–100 — works and is verified.
- **Yellow** 70–89 — weakness, uncertainty, impending degradation.
- **Red** 0–69 — fails, missing, or unverified.
- **Gray** — no inputs, status unknown.

**Compensated red** — a Red barrier that has documented compensatory measures. Renders Red with a hatched fill; never auto-promoted to Green or Yellow.

**Additional canvas colors:**
- **Blue** — informational / documented control (not a live barrier).
- **Purple** — human / organizational factor (HOF).

---

## Approval lifecycle

Six stages, no skipping:

```
Draft → Internal Review → SME Review → Risk Manager Review → Approved → Published
```

Plus auxiliary states: **Under Revision**, **Superseded**, **Archived**.

Step-up MFA required on Approve, Publish, Sign verification, Accept ALARP.

---

## Quality criteria for a barrier (8 checks)

A barrier passes the **Quality Gate** only if all of these are demonstrably true:

1. **Specific** — names the threat(s) / consequence(s) it addresses.
2. **Effective** — proven sufficient to prevent or limit the scenario at the relevant severity.
3. **Independent** — does not share a common-cause failure path with another barrier on the same pathway.
4. **Auditable** — effectiveness can be evidenced through inspection, test, drill, or audit.
5. **Owned** — has a named owner accountable for performance.
6. **Verifiable** — defined verification method, frequency, and acceptance criteria.
7. **Documented** — references a Performance Standard and the relevant procedure / drawing / competence requirement.
8. **Supported** — competence, maintenance and procedure systems behind it are in place.

---

## Roles

**System Admin** — tenant config, integrations, master data.
**Tenant Admin** — users, roles, risk matrix, approval flow, asset hierarchy.
**Risk Manager** — methodology, quality, approval, reporting.
**Bowtie Facilitator** — workshops, Bowtie construction, draft → review.
**Barrier Owner** — owns one or more barriers; signs verification, action close-out.
**Action Owner** — owns CAPA / treatment actions.
**Verifier / Auditor** — independent verification, audit findings.
**Operations User** — read; reports observations and degradation flags.
**Management** — reads dashboards and reports.
**Regulator (External)** — read-only on Published Bowties.

---

## Standards anchors

| Standard | Used for |
|---|---|
| **ISO 31000:2018** | Risk management framework and process |
| **IEC 31010:2019** | Risk assessment techniques (Bowtie, LOPA) |
| **CCPS / Energy Institute** | *Bow Ties in Risk Management* methodology |
| **IOGP 544** | Standardization of barrier definitions |
| **IOGP 415, 456** | Barrier health, asset integrity |
| **NORSOK S-001** | Norwegian offshore safety |
| **IEC 61511 / 61508** | Safety Instrumented Systems / SIL |
| **IEC 62443** | OT cybersecurity |
| **ISM Code** | Maritime safety management |
| **ICAO Annex 19** | Aviation safety management |

---

## Words we don't use

- ❌ "Escalation Factor" → ✅ Degradation Factor
- ❌ "Escalation Factor Barrier" / "EFB" → ✅ Degradation Control
- ❌ "Bowtie diagram" (when meaning the system) → ✅ Bowtie analysis / Barrier management
- ❌ "Safety culture" as a barrier → ✅ It's not specific or auditable. Decompose into specific organizational barriers.
- ❌ "Investigate the cause" as a barrier → ✅ It's an Action. Move it to the action plan.
