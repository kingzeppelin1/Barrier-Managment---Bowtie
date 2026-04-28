# 01 · Product Specification

> Module name: **Barrier Management — Bowtie**
> Source of truth: this file, plus the companion documents listed in [`README.md`](README.md). Departures from the original brief are tracked in [`00_RECONCILIATION_NOTES.md`](00_RECONCILIATION_NOTES.md).

---

## 1. Purpose

Barrier Management — Bowtie is a module for systematic risk management, barrier management and visualization of incident scenarios. The module helps the business to:

- identify hazards, threats, top events, and consequences;
- establish preventive and mitigative barriers;
- assess barrier effectiveness, independence, weaknesses, and health status;
- link barriers to responsibilities, performance requirements, inspections, procedures, and verification;
- follow the **ISO 31000** logic for risk management — context, risk assessment, risk treatment, monitoring, communication, and reporting;
- make risks and barriers understandable to operational personnel, management, audit, and regulators.

> **The module is not a diagramming tool.** It is a management system for risk, barriers, measures, responsibility, and compliance. The bowtie is the visualization on top.

See [`00_RECONCILIATION_NOTES.md`](00_RECONCILIATION_NOTES.md) §1 — this is the **most important design decision**.

---

## 2. Core idea

A bowtie shows how a hazard can develop into an unwanted event and what barriers should prevent or limit the development. The basic structure is:

```
Hazard → Threats → Preventive Barriers → Top Event → Mitigative / Recovery Barriers → Consequences
```

The module additionally supports:

- **Degradation Factors** — conditions that weaken a barrier.
- **Degradation Controls** — measures that prevent the barrier from being weakened.
- **Barrier health** — status of whether the barrier is functioning as expected.
- **Performance Standards** — requirements for what the barrier must achieve.
- **Verification** — proof that the barrier has been tested, inspected, or operated.
- **Action management** — actions when barriers are missing, weak, or not working.

For terminology, see [`11_GLOSSARY.md`](11_GLOSSARY.md).

---

## 3. Functional scope (top level)

### 3.1 Modules in the app

The full set of top-level modules. UI surfacing of each is detailed in [`04_UI_UX_AND_REPORTS.md`](04_UI_UX_AND_REPORTS.md).

| Module | Purpose |
|---|---|
| Dashboard | Quick overview of risk and barrier status across the portfolio. |
| Bowtie Library | All bowtie analyses, filterable, with status and risk-before/after. |
| Bowtie Builder / Wizard | Guided 12-step workflow that prevents common methodology errors. |
| Graphic Bowtie Editor | Drag-and-drop visual editor with a context side panel. |
| Barrier Register | All barriers, decoupled from any specific bowtie. |
| Performance Standards | Reusable, structured requirements for what each critical barrier must achieve. |
| Barrier Health Monitoring | Continuously calculated 0–100 score per barrier with color band. |
| Risk Register integration | Bowties link bidirectionally to enterprise risk register entries. |
| Incident & Near-Miss Learning | Tie real events to bowties; mark which barriers worked / failed. |
| MOC Impact | Management-of-change form that triggers bowtie / barrier review. |
| Audit & Assurance | Scenario-based audits and barrier-verification audits. |
| Actions / Treatment plan | Source-tagged CAPA with owner, due date, evidence, effectiveness review. |
| Reports | Ten standard reports + a regulator-ready Bowtie PDF. |
| AI Agent (Bowtie Assistant) | **Advisory** suggestions for hazards, top events, threats, consequences, barriers, DFs, performance standards, workshop agendas, draft reports. Always human-reviewed. See [`07_AI_AGENT.md`](07_AI_AGENT.md). |
| Configuration | Risk matrices, scales, ALARP rules, barrier types, roles, approval flow, asset hierarchy, template library. |

### 3.2 Five-class barrier classification (CCPS / EI canonical)

Every barrier carries:

- **Type** (5 canonical classes): Hardware – Passive · Hardware – Active · Human – Active · Human – Procedural · Organizational.
- **Subtype** (8 operational classes for richer tagging): Passive technical · Active technical · Active technical+human · Human · Organizational · Procedural · Emergency response · Continuous.
- **Function:**
  - **Preventive:** prevent · detect · control · isolate · stop · warn.
  - **Mitigative:** detect · respond · contain · evacuate · recover · mitigate.

### 3.3 Risk model (4 levels — never collapse to 2)

- **Inherent risk** — risk with no barriers in place.
- **Current risk** — risk with existing barriers operating at current health.
- **Residual risk** — risk with planned new measures fully effective.
- **Target risk** — the risk level the organization aims for.

ALARP is required when Residual > Target and is signed by the Risk Manager.

### 3.4 Roles (high level)

System Admin · Tenant Admin · Risk Manager · Bowtie Facilitator · Barrier Owner · Action Owner · Verifier / Auditor · Operations User · Management · Regulator (External, read-only on Published).

Detailed responsibilities and access matrix: [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §4.

---

## 4. Non-functional requirements (NFRs)

| Area | Requirement |
|---|---|
| **Multi-tenancy** | Strict per-tenant isolation enforced by Postgres Row-Level Security + ORM filter. Cross-tenant access returns 404 and emits a security event. |
| **Auditability** | Every state-changing action writes an immutable audit row (RFC 6902 patch + actor + IP + request-id). The `audit_log` table cannot be updated or deleted by any application path. |
| **Approval enforcement** | The 6-stage approval gate is enforced server-side; UI / API / admin override cannot bypass it. Step-up MFA on Approve, Publish, Sign verification, Accept ALARP. |
| **Performance** | Bowtie open p95 < 1.5 s for ≤ 200 elements. Save patch p95 < 800 ms. Lighthouse: LCP < 2.5 s, INP < 200 ms, CLS < 0.1, TBT < 200 ms. |
| **Accessibility** | WCAG 2.1 AA. axe-core checks in CI. |
| **Internationalization** | English MVP; per-tenant locale planned post-MVP. |
| **Browser support** | Last 2 versions of Chrome / Edge / Firefox / Safari. |
| **Data residency** | Choose Postgres host per tenant region (Vercel Postgres EU / Neon / Supabase). |
| **Encryption** | TLS 1.3 in transit; AES-256 at rest. |
| **Evidence size cap** | 50 MB per file (configurable). |
| **Webhook signing** | HMAC-SHA256, per-tenant secret. |
| **Mobile** | Read-only Bowtie viewer + verification capture in MVP; full mobile app post-MVP. |

Full acceptance criteria: [`05_ARCHITECTURE_SECURITY_ACCEPTANCE.md`](05_ARCHITECTURE_SECURITY_ACCEPTANCE.md).

---

## 5. Minimum Viable Product (MVP)

### 5.1 In scope

- Bowtie Library
- Bowtie Builder Wizard (12 steps)
- Graphical bowtie view (with side panel)
- Barrier Register
- Barrier health status (0–100 + colour bands)
- Actions
- Risk matrix (configurable, 5×5 default)
- Approval flow (6 stages)
- PDF export (regulator-ready)
- AI quality check (advisory)

### 5.2 MVP can wait

- Full maintenance integration (CMMS).
- Advanced equipment connection.
- Live sensor / IoT data.
- Full ERP integration.
- Automatic update from incidents.
- Advanced BI / analytics.

---

## 6. Enterprise functionality (post-MVP)

- SSO (OIDC + SAML).
- Full RBAC at every CRUD endpoint.
- Audit trail UI (the data is captured from day one; the cross-entity timeline UI is post-MVP).
- Public REST API + OpenAPI spec.
- Bulk import / export.
- Multi-tenant with full data residency control.
- Asset hierarchy editor.
- Integrations: CMMS / ERP / incident management / document management / MOC.
- Power BI connector.
- Offline field verification.
- Mobile app for verification.
- QR code on equipment / barrier.
- AI-assisted bowtie portfolio scan.

---

## 7. Sector examples (illustrative)

The seed library ships with two end-to-end examples — see [`docs/prompts/03-domain-schema.md`](prompts/03-domain-schema.md) for the seed deliverable.

### 7.1 Maritime — Lifting operation

- **Hazard:** Heavy load during lifting operation.
- **Top Event:** Loss of control over suspended load.
- **Threats:** Wrong rigging · Crane failure · Overload · Bad weather · Poor communication · Personnel in danger zone.
- **Preventive barriers:** Lifting plan · Certified lifting equipment · Competent rigger · Pre-lift meeting · Weather restrictions · Restricted area · Communication protocol.
- **Consequences:** Personal injury · Equipment damage · Damage to vessel · Operational downtime.
- **Mitigative barriers:** Emergency stop · Evacuation procedure · First-aid preparedness · Emergency alert · Incident response plan.
- **Degradation factors:** Lack of inspection of lifting equipment · Unclear responsibility · Time pressure · Inexperienced personnel · Bad weather assessment.
- **Degradation controls:** Periodic inspection · Competency matrix · Toolbox talk · Stop Work Authority · Pre-lift checklist.

### 7.2 Offshore process — Hydrocarbon containment

- **Hazard:** Hydrocarbon under pressure.
- **Top Event:** Loss of hydrocarbon containment.
- **Threats:** Corrosion · Incorrect valve position · Overpressure · Mechanical damage · Improper maintenance · Design weakness.
- **Preventive barriers:** Material selection · Corrosion monitoring · Pressure relief · Inspection program · Work permit · Isolation procedure · Maintenance program.
- **Consequences:** Gas leak · Fire · Explosion · Personal injury · Environmental emissions · Production stoppage.
- **Mitigative barriers:** Gas detection · ESD · Fire-and-gas system · Deluge · Evacuation · Emergency plan.

---

## 8. Build prompt (verbatim from the source — for archival reference)

The original brief contained a "Base44 / Claude prompt" intended to be pasted into a build tool. It is reproduced here so future readers can see the original elevator pitch:

> Build a web application module named "Barrier Management — Bowtie". The module shall support ISO 31000-aligned risk management and bowtie-based barrier management. It must include a dashboard, bowtie library, guided bowtie builder, graphical bowtie editor, barrier register, barrier health monitoring, performance standards, risk matrix, action management, verification records, approval workflow, audit trail, reports, and AI-assisted quality checks. The bowtie model must include Hazard, Top Event, Threats, Consequences, Preventive Barriers, Mitigative Barriers, Degradation Factors, and Degradation Controls. Each barrier must have owner, type, function, criticality, performance standard, verification method, evidence, health status, and linked actions. The app must guide users step-by-step and prevent common bowtie errors such as mixing threats with consequences, confusing barriers with actions, publishing critical barriers without owners, and accepting high residual risk without approval. Use a clean enterprise UI with left navigation, dashboard cards, tables, side panels, and a visual bowtie canvas. Include role-based access, lifecycle status, version history, and export to PDF.

The repo has since superseded this with the structured prompt set in [`prompts/`](prompts/) and the sprint backlog in [`09_SPRINT_1_BACKLOG.md`](09_SPRINT_1_BACKLOG.md) → [`10_MVP_BUILD_SEQUENCE.md`](10_MVP_BUILD_SEQUENCE.md).
