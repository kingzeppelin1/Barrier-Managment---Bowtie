# 04 · UI / UX and Reports

> Information architecture, page-level UX, the Bowtie canvas, the side-panel pattern, workshop mode, and the regulator-ready PDF export. Implementation prompts: [`prompts/06-12step-wizard.md`](prompts/06-12step-wizard.md), [`prompts/07-bowtie-canvas.md`](prompts/07-bowtie-canvas.md), [`prompts/10-pdf-export.md`](prompts/10-pdf-export.md).

---

## 1. Top-level navigation

A persistent left rail in the authenticated app:

- Dashboard
- Bowtie Library
- New Bowtie
- Barrier Register
- Barrier Health
- Performance Standards
- Risk Register
- Actions
- Verifications
- Incidents & Learnings
- MOC Impact
- Audits
- Reports
- Templates
- Settings

Each item maps to an `app/(app)/<segment>/` route in [`apps/web/app/`](../apps/web/app/).

---

## 2. UX principles

### 2.1 Guide the user

Most errors in bowtie work happen because users mix up concepts. The app actively teaches:

- What is a Hazard?
- What is a Top Event?
- What is a Threat?
- What is a Consequence?
- What is a Barrier?
- What is a Degradation Factor?
- What is an Action?

Surface these with inline help tooltips, the AI Agent's quality-check explanations, and "what is this?" links from every Wizard step.

### 2.2 Side panel pattern

When the user clicks an element on the bowtie canvas, a right-hand side panel opens containing tabs:

- **Details** — name, description, type/function, links
- **Owner** — owner profile + delegate
- **Status** — health band, last verification, next due
- **Evidence** — files, drawings, procedure links
- **Comments** — threaded discussion
- **Actions** — open / closed Actions linked to this element
- **AI check** — last AI quality finding for this element
- **History** — audit-log slice for this element

Side panel is non-modal; the canvas remains visible and editable. Keyboard: `Esc` closes.

### 2.3 Workshop mode

A fullscreen mode for facilitator-led workshops:

- Big visual bowtie (canvas occupies most of the viewport).
- Simple "Add to threat / barrier / consequence" buttons.
- **Parking lot** for unresolved points (each becomes a `workshop_parking_item`).
- Participant list (each becomes a row in `workshop_session.participants`).
- **Decision log** (`workshop_decision`).
- AI suggestions inline (always advisory).
- Export of workshop minutes (Markdown + PDF).

Workshop mode is real-time co-edited via Liveblocks (managed Yjs) for MVP.

---

## 3. Dashboard

### 3.1 Cards (top of page)

- Number of active Bowties.
- Number of Top Events per area / vessel / facility / project / process.
- Barriers by status: green / yellow / red / gray.
- **Critical barriers without verification.**
- **Overdue barrier verifications.**
- Open Actions / CAPA.
- Bowties needing review (`next_review_date <= today`).
- Risk before vs after barriers (delta indicator).

### 3.2 Tables

- Top 10 weak barriers (lowest health score).
- Top 10 threats without sufficient preventive barriers.
- Top 10 consequences without sufficient mitigative barriers.

### 3.3 Filters (apply to every card and table)

Asset / vessel / facility · Department · Process · Operation · Risk category · Risk owner · Barrier owner · Status · Criticality · Last updated.

### 3.4 Performance budget

Initial dashboard render p95 < 1.5 s. Filters debounce; pagination on every table (default 25, max 100).

---

## 4. Bowtie Library

A list of every Bowtie the user can read.

### 4.1 Columns

- Bowtie ID
- Title
- Hazard
- Top Event
- Asset / process
- Owner
- Status (color-coded chip)
- Risk before barriers
- Risk after barriers
- # preventive barriers
- # mitigative barriers
- # red / yellow barriers
- Last revised
- Next review date

### 4.2 Row actions

- Open
- Create new Bowtie
- Copy as template
- Import from template library
- Compare versions (diff against any prior `version_chain_id` row)
- Archive
- Export to PDF

### 4.3 Bulk actions

- Export selected to PDF
- Mark for review
- Reassign owner

---

## 5. Bowtie Builder Wizard

The 12-step Wizard from [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §3. UX rules:

- Stepper component shows position + completion state for each step.
- Save on every blur — drafts never lost.
- Inline help on every field, with "what is this?" explanation modals.
- AI suggestions appear as advisory cards next to relevant fields, never as autocomplete.
- "Next" is disabled with a tooltip listing the unmet validation rules.
- "Back" never destroys data.

---

## 6. Graphic Bowtie Editor

The headline visualization. Implementation prompt: [`prompts/07-bowtie-canvas.md`](prompts/07-bowtie-canvas.md).

### 6.1 Layout

- **Left side:** Threats · Preventive barriers · Degradation Factors · Degradation Controls.
- **Center:** Hazard · Top Event.
- **Right side:** Mitigative barriers · Consequences · Degradation Factors · Degradation Controls.

### 6.2 Features

- Drag-and-drop arrangement; layout is auto-laid (Sugiyama or similar) with snap-to-grid.
- Click on any element opens the [side panel](#22-side-panel-pattern).
- Color codes for barrier status (see [§6.4](#64-color-codes)).
- Filter toggles: show/hide Degradation Factors · show/hide actions · show only Red barriers · show only Critical barriers.
- Zoom (pinch + ⌘/Ctrl-+/-).
- Export the visible canvas to PDF / SVG / PNG.
- Workshop mode (full-screen).
- Version comparison overlay (diff highlight per element).

### 6.3 Performance

- p95 open < 1.5 s for ≤ 200 elements.
- Pan / zoom keep at ≥ 60 fps for ≤ 500 elements.
- Save patch (any single edit) p95 < 800 ms.

### 6.4 Color codes

| Color | Meaning |
|---|---|
| **Green** | Barrier works and is verified (health 90–100). |
| **Yellow** | Weakness, uncertainty, or impending degradation (70–89). |
| **Red** | Barrier fails, is missing, or is unverified (0–69). |
| **Red (compensated)** | Red with hatched fill — never auto-promoted, even if compensatory measures exist. |
| **Gray** | No inputs — unknown status. |
| **Blue** | Informational / documented control (not a live barrier). |
| **Purple** | Human / organizational factor (HOF). |

---

## 7. Barrier Register

A list of every barrier — independent of any single Bowtie.

### 7.1 Fields visible in list

Barrier ID · Name · Category · Type · Function · Criticality · Owner · Asset / location · Linked bowties (count) · Health · Last verification · Next verification · Open findings · Open actions.

### 7.2 Detail page

- All fields from [`02_DATA_MODEL.md`](02_DATA_MODEL.md) §4.1.
- Linked Bowties · Linked threats / consequences · Linked procedures · Linked equipment · Linked maintenance tasks · Linked competence requirements.
- Performance Standard summary card.
- Verification regime summary card with the next 5 due tasks.
- Health-score sparkline (last 12 months).
- Evidence archive (paginated).
- Audit log (the slice for this barrier).

### 7.3 Barrier-quality checks

The system shows whether the barrier is:

- Specific · Effective · Independent · Auditable · Owned · Verifiable · Documented · Supported.

Each rendered as a green / yellow / red chip with the failing criterion's reason on hover.

---

## 8. Performance Standards

A list + detail UI for `performance_standard` rows. Each PS shows:

- Linked barriers (and a warning if the PS has changed since last barrier verification).
- Functional, performance, availability, reliability, survivability, response-time, capacity requirements.
- Acceptance criteria.
- Inspection / test requirements.
- Verification frequency.

Editing a PS triggers an MOC review on every referencing barrier (per [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §7).

---

## 9. Barrier Health Monitoring

A canonical 0–100 score per barrier with bands. The full algorithm lives in [`packages/methodology/src/barrier-health/`](../packages/methodology/src/barrier-health/) per [`prompts/08-barrier-health.md`](prompts/08-barrier-health.md).

### 9.1 Inputs

- Last verification + outcome.
- Overdue verifications.
- Open findings.
- Open actions.
- Incidents / near-misses linked to the barrier.
- Maintenance backlog.
- Competence status (training records).
- Document status (procedure / drawing valid?).
- MOC impact.
- Optional manual assessment by the Barrier Owner.

### 9.2 Bands

| Band | Score | Notes |
|---|---|---|
| Green | 90 – 100 | Works and is verified. |
| Yellow | 70 – 89 | Weakness, uncertainty, impending degradation. |
| Red | 0 – 69 | Fails, missing, or unverified. |
| Gray | n/a | No inputs / status unknown. |
| Red (compensated) | 0 – 69 | Red with `with_compensatory=true` — rendered with hatched fill, never auto-promoted. |

### 9.3 Automatic floors (cannot be overridden by manual score)

- Critical barrier overdue for verification → at least Yellow.
- Critical test fails → Red.
- Barrier without owner → Yellow if non-critical, Red if critical.
- Barrier with an open critical finding → Red.
- Compensatory measures exist → Red (with `with_compensatory=true`); never auto-promoted.

---

## 10. Actions

A list + detail UI of `action` rows.

### 10.1 Filters

By source type · by owner · by priority · by status · by linked entity · by due-date window.

### 10.2 Detail

Action source (typed link to the originating barrier / bowtie / risk / audit / incident / MOC / DF) · evidence · effectiveness review.

### 10.3 Effectiveness review

When an action is closed, a **separate** verifier (not the Action Owner) reviews effectiveness with: rating · rationale · sign-off date. This becomes part of `action.effectiveness_review`.

---

## 11. Verifications

A worker-driven inbox of `verification_task` rows.

### 11.1 Verifier flow

- Open task → review barrier + PS → record method, result, comments → upload evidence file → submit.
- Submission requires step-up MFA (per [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §1.3).
- On submit, barrier health is recomputed.

### 11.2 Lists

- My queue (assigned to me, due first).
- Overdue (across the tenant — Risk Manager / Verifier view).
- Recently signed (audit trail).

---

## 12. Incidents & Learnings

The UI counterpart of the workflow in [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §6. Key UI elements:

- "Link incident to Bowtie" wizard (3 steps: pick top event, mark threats/barriers worked/failed, propose DFs/actions).
- Lessons-learned panel.
- Heatmap of barrier failure rates over time.

---

## 13. MOC Impact

The form-driven workflow from [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §7. Standard MOC questionnaire visible inline; recommendations rendered as actionable cards (each card spawns the relevant workflow when clicked).

---

## 14. Audits

A scenario-based audit module driven by the question banks in [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §8. Each finding becomes an Action (tagged `source_type = audit_finding`).

---

## 15. Reports

### 15.1 Standard reports

1. Bowtie report
2. Barrier register report
3. Barrier health report
4. Critical barriers report
5. Overdue verification report
6. Open actions report
7. Risk exposure report
8. ALARP justification report
9. Bowtie quality report
10. Audit readiness report
11. Management summary

Every report is exportable to PDF and CSV. Reports are server-rendered for deterministic output.

### 15.2 Bowtie PDF (regulator-ready)

The signature output. Implementation: [`prompts/10-pdf-export.md`](prompts/10-pdf-export.md). Mandatory sections:

1. Cover (Bowtie title · status · approval log summary · publish date · version · tenant logo).
2. Scope and context (Wizard step 1).
3. Hazard and Top Event.
4. Graphic bowtie (rendered server-side, deterministic layout).
5. Threats (table with category + credibility + likelihood).
6. Consequences (table with severity + impact dimensions).
7. Preventive barriers (table with type / function / owner / health / next verification).
8. Mitigative barriers (same).
9. Degradation Factors and Controls.
10. Risk assessment (4-level table + ALARP justification when present).
11. Actions (open + closed last 12 months).
12. Approval log (chronological audit_log slice).
13. Audit history (chronological audit_log slice for the bowtie).

Footer on every page: tenant name · Bowtie ID · version · "Regulator copy" watermark when exported by a Regulator user.

### 15.3 Workshop minutes export

A Markdown + PDF export per workshop session: participants, decision log, parking-lot items, AI suggestions accepted/rejected, Bowtie state delta.

---

## 16. Templates

A library of sector-seed Bowtie templates. Maritime + offshore-process ship in MVP (per [`00_RECONCILIATION_NOTES.md`](00_RECONCILIATION_NOTES.md) §6.4).

---

## 17. Settings

Configuration UI surfacing every setting from [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §9. Two tabs: **Tenant** (Tenant Admin) and **Methodology** (Risk Manager).

---

## 18. Accessibility, theming, browser support

- WCAG 2.1 AA: keyboard navigation, focus order, ARIA on canvas elements, axe-core CI gate.
- High-contrast theme switchable per user.
- Last 2 versions of Chrome / Edge / Firefox / Safari.
- Mobile: read-only Bowtie viewer + verification capture in MVP.

---

## 19. Empty / loading / error states

- **Empty:** every list page has a contextual empty state with a primary action (e.g. "Create your first Bowtie", "Import templates").
- **Loading:** skeletons, never spinners.
- **Error:** never silent. Every error renders a structured panel with: what failed, what to do, a "copy diagnostic" button (request id + correlation id), and a way back.
