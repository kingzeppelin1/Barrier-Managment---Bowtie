# Prompt 10 — Regulator PDF Export + Final Hardening

## Role & Context

You are shipping the **regulator-ready PDF** and finalizing MVP hardening: performance budgets enforced via Lighthouse CI, a11y at WCAG 2.1 AA, pen-test fixes, documentation review. After this prompt, the MVP is shippable.

## Read first

- `/CLAUDE.md`.
- `/docs/04_UI_UX_AND_REPORTS.md` — section 2.15 (Bowtie report structure).
- `/docs/01_PRODUCT_SPEC.md` — FR-9.
- `/docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md` — performance, a11y, security AC.

## Deliverables

### PDF generation

`apps/web/lib/pdf/`:

- Use `@react-pdf/renderer` (server-side React → PDF).
- `BowtiePdf.tsx` — full report:
  - **Cover** — tenant logo, Bowtie title, version, status, approval lineage, classification.
  - **Scope** — asset hierarchy, business unit, sector template applied.
  - **Hazard** — full description, category, references.
  - **Top Event** — statement, definition, any AI-suggested rephrasings (declined or accepted).
  - **Bowtie graphic** — rasterized SVG export of the canvas at 300 DPI.
  - **Threats** — table with codes, descriptions, criticality.
  - **Consequences** — table with codes, descriptions, severity, target audiences.
  - **Preventive barriers** — per pathway: code, name, type, subtype, function, owner, performance standard, last verification, current health (numeric + band), 8 quality criteria status.
  - **Mitigative barriers** — same shape.
  - **Degradation factors and controls** — paired listing.
  - **Gap records** — pathway, reason, owner, target_resolution_date, linked Action.
  - **Risk assessment** — 4-level table per consequence, ALARP justification where applicable.
  - **Action plan** — open and recently closed actions, by severity.
  - **Approval log** — every state transition with actor, timestamp, comment.
  - **Audit history** — paginated, filtered to Bowtie + descendants.
  - **Evidence appendix** — list of all evidence references with hashes (links, not embedded files).
  - **AI involvement summary** — AI suggestions: count by decision, list of accepted suggestions with reviewer name + date.

`apps/web/app/api/v1/bowties/[id]/pdf/route.ts` (GET):

- Streams the PDF.
- RBAC: `bowtie:read` and `bowtie:export`.
- Tenant config: optional watermark on draft / under-revision Bowties.
- Query params: `include_audit=true|false`, `language=en|no`.

### Performance hardening

- **Lighthouse CI** in `.github/workflows/`:
  - Runs against the Vercel preview URL on every PR.
  - Budget: LCP < 2.5s, INP < 200ms, CLS < 0.1, TBT < 200ms.
  - Fails the PR if budget breached.
- Server Components everywhere they fit. Client Components only for forms, canvas, real-time fragments.
- Image optimization: `next/image` for tenant logos and any uploaded illustrations.
- API route caching: `Cache-Control: private, max-age=10` on read-only `GET` routes that are tenant-scoped.
- Bundle analysis: `pnpm analyze` runs `@next/bundle-analyzer` and the PR comment shows bundle delta.

### Accessibility hardening

- WCAG 2.1 AA pass on every MVP page:
  - `/dashboard`, `/bowties`, `/bowties/[id]`, `/bowties/new`, `/barriers`, `/verifications`, `/actions`, `/reports`, `/settings/*`.
- `axe-core` automated scan in CI; 0 violations allowed.
- Keyboard navigation works without a mouse on every page.
- Screen reader smoke test (NVDA on Windows, VoiceOver on macOS) — checklist documented in `docs/guides/A11Y_TEST_CHECKLIST.md`.
- Color contrast ≥ 4.5:1 on text; ≥ 3:1 on icons + interactive elements.
- High-contrast theme variant available.

### Security hardening

- CSP headers via Next.js middleware: `default-src 'self'`, no inline scripts (use nonce-based for Next.js bundles).
- HSTS with `max-age=31536000; includeSubDomains; preload`.
- All API responses include `Cache-Control: no-store` for tenant-scoped writes.
- Penetration test fixes — apply remediations from latest pen test report (track in `docs/decisions/00XX-pen-test-remediation.md`).
- Webhook delivery: HMAC-SHA256 signed, replay-protected (timestamp + nonce window of 5 min).
- Evidence file uploads: max 50 MB; mime-type allowlist; AV scan via ClamAV (defer ClamAV deployment to post-MVP, but the upload pipeline is structured for it — `// TODO(post-mvp)` markers).

### Documentation review

- Walk every spec file (`docs/00`–`docs/11`) and ensure it matches what we shipped.
- For every deviation, ensure an ADR exists in `docs/decisions/`.
- Update `docs/00_RECONCILIATION_NOTES.md` with the "What we built vs. what we specified" delta — if any.
- Update `docs/guides/DEPLOYMENT.md` with concrete production deploy steps.

### Operational readiness

- Sentry wired for `apps/web` and `apps/worker`. Error → Sentry; PII scrubbed.
- OpenTelemetry SDK exporting to OTLP endpoint.
- Datadog dashboards committed in `infra/datadog/dashboards.json` (or similar).
- Runbook in `docs/guides/RUNBOOK.md`: how to handle health-check failures, queue backlog, AI errors, RLS misconfiguration alarms.
- Backup verification: a CI job that monthly restores the latest backup to a scratch DB and runs a smoke test.

## Acceptance criteria

- [ ] PDF generation: produces a complete, regulator-shaped report for the seeded maritime lifting Bowtie.
- [ ] PDF export of an approved Bowtie matches the on-screen Bowtie state byte-for-byte (semantic match, not visual).
- [ ] Lighthouse CI green on every MVP page; budget enforced.
- [ ] axe-core scan: 0 violations on every MVP page.
- [ ] Pen-test high/critical findings: 0 open.
- [ ] Sentry receives a synthetic error from each app and reports it.
- [ ] Runbook covers the top 5 expected operational issues.
- [ ] Documentation walk-through is signed off.

## Tests required

`apps/web/tests/integration/pdf.test.ts`:
- PDF for the seeded Bowtie generates without error and is non-empty.
- Snapshot test on the structural metadata extracted from the PDF.

`apps/web/tests/e2e/perf.spec.ts`:
- Lighthouse run on canvas page meets budgets.

`apps/web/tests/e2e/a11y.spec.ts`:
- axe-core scan on every MVP page returns 0 violations.

## Definition of done

- [ ] All deliverables shipped.
- [ ] All AC met.
- [ ] All tests passing.
- [ ] All performance and a11y budgets green in CI.
- [ ] Documentation walk-through signed off.
- [ ] **MVP shippable** — production deploy approved.
- [ ] Stakeholder demo on the seeded tenant.
- [ ] Summary block per `/CLAUDE.md` §8.
