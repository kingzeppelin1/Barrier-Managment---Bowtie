# Prompt 07 — Bowtie Canvas + Side Panel

## Role & Context

You are building the **graphical Bowtie editor** — the canvas that turns the data into a navigable diagram, with the **Side Panel** as the single navigation pattern across every element type. This is what makes the product visually distinctive.

Use **React Flow** for the graph layer. **ELK** for auto-layout. The Side Panel must follow the codified pattern: 8 tabs in a fixed order.

## Read first

- `/CLAUDE.md`.
- `/docs/01_PRODUCT_SPEC.md` — FR-3.
- `/docs/04_UI_UX_AND_REPORTS.md` — sections 2.4 (canvas), 3 (UX principles), 4 (visual language).
- `/docs/02_DATA_MODEL.md` — section 5.

## Deliverables

### Canvas page

`apps/web/app/(app)/bowties/[id]/page.tsx` — read view (Server Component shell + Client canvas).
`apps/web/app/(app)/bowties/[id]/edit/page.tsx` — edit view.

The page hydrates from `loadBowtieFull(id)` and passes the structured data to a client `<BowtieCanvas>` component.

### Canvas component

`apps/web/components/canvas/BowtieCanvas.tsx`:

- React Flow with:
  - Custom nodes per element type: `ThreatNode`, `ConsequenceNode`, `BarrierNode`, `DegradationFactorNode`, `DegradationControlNode`, `GapRecordNode`, `TopEventNode`.
  - Custom edge: `PathwayEdge` with directional arrow.
  - Auto-layout via ELK (`'layered'` direction, threats-left consequences-right).
- Read-only when `bowtie.state ∈ {approved, published}` unless user has `bowtie:revise`.
- Drag-and-drop add (edit mode only).
- Selection opens the Side Panel.

### Node visual encoding

Each node renders:
- The element code (e.g., "B3").
- A short label.
- Type-specific icon (per `04_UI_UX_AND_REPORTS.md` §4): wall (passive), valve (active), operator (human-active), clipboard (procedural), building (organizational).
- A **health dot** for barriers — color-coded with the 6-color palette + numeric score on hover.
- A `with_compensatory` hatched fill for compensated red barriers.

Color palette implemented as design tokens in `packages/ui/src/theme/`:
- `--bowtie-green: #10b981`
- `--bowtie-yellow: #f59e0b`
- `--bowtie-red: #ef4444`
- `--bowtie-gray: #9ca3af`
- `--bowtie-blue: #3b82f6` (information / documented control)
- `--bowtie-purple: #8b5cf6` (human / organizational factor)

### Side Panel

`apps/web/components/canvas/SidePanel.tsx`:

Always 8 tabs in this order: **Details / Owner / Status / Evidence / Comments / Actions / AI Check / History**.

- `<DetailsTab>` — element-type-specific fields (read or editable per state).
- `<OwnerTab>` — assigned user, accountable role, RACI.
- `<StatusTab>` — for barriers: numeric health, last verification, open findings/actions.
- `<EvidenceTab>` — list of linked documents/URLs/checklists with hashes.
- `<CommentsTab>` — threaded comments, @mentions.
- `<ActionsTab>` — open / in-progress / closed actions linked to this element.
- `<AICheckTab>` — placeholder for now (Prompt 09 wires the AI agent).
- `<HistoryTab>` — paginated audit log filtered to this element.

Side Panel is keyboard-navigable (Tab, Arrow keys), aria-labeled, focus-trapped when open.

### Filters (header bar)

Above the canvas:
- "Critical only" toggle.
- "Red only" toggle.
- "Show Degradation Factors" toggle.
- "Show Degradation Controls" toggle.
- "Show Gaps" toggle.
- "Show Actions" toggle.
- "Workshop mode" link (placeholder — wired in a later sprint).
- Zoom controls + fit-to-screen.

### Mini-map and overview

React Flow MiniMap; React Flow Controls. Both styled with our tokens.

### Export

- Export to PNG (via `dom-to-image`).
- Export to SVG (via React Flow's `toSvg`).
- Export to PDF placeholder (Prompt 10 ships the full Bowtie PDF).
- BowTieXP-compatible XML export — best-effort skeleton (just structural mapping; full export is post-MVP).

### Accessibility

- Full keyboard navigation: Tab between nodes, Arrow to move along the pathway, Enter to open Side Panel.
- aria-label per node including code + type + function + criticality + numeric health.
- High-contrast theme variant.
- Color is never the sole signal — paired with shape and icon.

### Live updates

When a barrier's `health.changed` event fires (server-sent events for now; Liveblocks in a later sprint), the dot color updates without page reload.

### Bowtie Library page

`apps/web/app/(app)/bowties/page.tsx`:

- Table view per `04_UI_UX_AND_REPORTS.md` §2.2.
- Filters per same section.
- Bulk export to PDF (placeholder).
- "Compare versions" CTA → side-by-side diff view.

## Acceptance criteria

- [ ] The seeded maritime lifting Bowtie renders correctly.
- [ ] Clicking any node opens the Side Panel; all 8 tabs render real data (AI Check shows the placeholder).
- [ ] Filters work: "Red only" hides green/yellow/gray barriers.
- [ ] Color coding matches the spec: 6 colors, hatched fill for compensated red.
- [ ] Read-only mode prevents canvas edits when state is published.
- [ ] Edit mode allows drag-add of new threats/barriers, persisting via API.
- [ ] Keyboard nav works end-to-end (Tab → Arrow → Enter → Side Panel → Tab through tabs).
- [ ] Lighthouse a11y ≥ 95 on `/bowties/[id]`.
- [ ] Bowtie list page shows all seeded Bowties with filters.
- [ ] Diff view between two versions of the same Bowtie shows additions/removals/changes.

## Tests required

`apps/web/tests/e2e/canvas.spec.ts` (Playwright):
- Open seeded Bowtie; verify all expected nodes present.
- Click a barrier; assert Side Panel opens with 8 tabs.
- Toggle "Red only" → only red barriers visible.
- Try to drag-add a node on a published Bowtie → blocked, edit controls hidden.
- Keyboard-navigate from canvas to Side Panel and back.

`apps/web/tests/e2e/canvas-a11y.spec.ts`:
- axe-core scan returns 0 violations on canvas page.

## Definition of done

- [ ] All deliverables shipped.
- [ ] All AC met.
- [ ] Lighthouse perf ≥ 90, a11y ≥ 95 on canvas pages.
- [ ] Bowtie open p95 < 1.5s for the seeded Bowtie.
- [ ] All tests passing.
- [ ] Summary block per `/CLAUDE.md` §8.
