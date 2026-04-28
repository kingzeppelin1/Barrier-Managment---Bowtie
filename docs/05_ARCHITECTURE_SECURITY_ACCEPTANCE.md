# 05 · Architecture, Security & Acceptance

> Stack-agnostic architecture, security guardrails, and the acceptance criteria a release must meet to ship. The stack-specific layout (Next.js, pnpm + Turborepo, Vercel, Postgres, BullMQ) is in [`08_PACKAGE_STRUCTURE.md`](08_PACKAGE_STRUCTURE.md).

---

## 1. Architectural principles

1. **Multi-tenancy is foundational, not bolted on.** Every tenant-scoped table is RLS-protected; every API call resolves a single `tenant_id` before any DB access.
2. **Domain logic is pure.** Bowtie validation, barrier health, risk-matrix evaluation, and quality checks live in `packages/methodology` as pure functions with zero I/O. They are deterministic, fully unit-tested (≥ 95 % branches), and the canonical source of truth across the rest of the codebase.
3. **Boundary discipline.** API route handlers are thin controllers; they call services in `apps/web/lib/services/`; services call repositories in `apps/web/lib/repos/`; repositories call Prisma. **No** Prisma calls from a route handler.
4. **Audit by default.** Every mutation is wrapped in `withAudit()`. Skipping the wrapper is a code-review-blocking smell.
5. **Server-side enforcement.** UI hints, never gates. Every state transition, every permission check, every ALARP sign-off is enforced behind the API.
6. **AI is advisory.** No LLM output is ever auto-applied to safety-critical content. See [`07_AI_AGENT.md`](07_AI_AGENT.md).
7. **Workshop mode is opt-in.** Real-time co-edit via Liveblocks; the rest of the product works without it.
8. **No regression of guardrails.** The methodology guardrails enumerated in [`CLAUDE.md`](../CLAUDE.md) §2 are non-negotiable across all sprints.

---

## 2. Logical architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         apps/web (Next.js 15)                │
│ ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│ │  pages   │→ │ route handlers│ →│ services → repos → Prisma│ │
│ │ (RSC)    │  │ (REST)        │  │     ↓                    │ │
│ └──────────┘  └──────────────┘   │ packages/methodology     │ │
│       │            │             │ (pure functions, zod)    │ │
│       │            │             └──────────────────────────┘ │
│       │            └──────────────► withAudit() → audit_log   │
│       └─ packages/ui (React) ─────► packages/shared (zod)     │
└──────────────────────────────────────────────────────────────┘
        ↓ HTTPS                    ↓ pg + RLS               ↓ AI
   Vercel Edge / Node           Postgres 16            Anthropic API
                                                             ↓
                          BullMQ on Upstash Redis ──► apps/worker
                                                       (verification scheduler,
                                                        health re-calc,
                                                        notifications)
                          Liveblocks ──► workshop co-edit
                          Vercel Blob ──► evidence files
                          Resend ──► transactional email
```

### 2.1 Module ownership and import rules

```
apps/web      → packages/* + own lib/
apps/worker   → packages/* + a small subset of apps/web/lib (via aliases)
apps/realtime → packages/shared only
packages/methodology → no external imports beyond stdlib + zod (must be pure)
packages/shared      → no imports from packages/ui, methodology, or apps
packages/ui          → packages/shared only (types) — never methodology or apps
packages/config      → no runtime imports
```

`packages/methodology` is the heart: smallest, most-tested, framework-free. Everything depends on it; it depends on nothing.

---

## 3. Stack — fixed for MVP

| Layer | Choice | Why |
|---|---|---|
| Web + API | **Next.js 15 App Router** (Route Handlers for REST) | Vercel-native; single deploy unit; ADR-0001 (deviation from NestJS suggestion). |
| Database | **Postgres 16 + Prisma + RLS** | RLS gives defense-in-depth on top of ORM filters; Prisma is the productive ORM for TS. |
| Auth | **Auth.js (NextAuth)** — credentials, OIDC, SAML | Pluggable, well-supported in Next.js. |
| Background jobs | **Upstash Redis + BullMQ** in `apps/worker` | Vercel can't run long-lived processes; worker is on Railway / Fly / Render. |
| Real-time co-edit | **Liveblocks** (managed Yjs) for MVP | One-line integration; opt-in (workshop mode). |
| AI | **Anthropic Claude** via API route in `apps/web` | High-quality structured outputs; streaming. |
| Storage | **Vercel Blob** | Native; S3-compatible API where needed. |
| Email | **Resend** | Transactional reliability. |
| Search | Postgres FTS in MVP; **OpenSearch** post-MVP | Defer infra. |

Don't introduce new frameworks or services without an ADR.

---

## 4. Security

### 4.1 Tenancy isolation (defense in depth)

- **Layer 1 — ORM filter:** every Prisma query in `apps/web/lib/repos/` is wrapped in `withTenant(tenantId, fn)`, which sets `app.tenant_id` per request via `SET LOCAL` inside the transaction.
- **Layer 2 — Postgres RLS:** every tenant-scoped table has `USING (tenant_id = current_setting('app.tenant_id', true)::uuid)`. Without `app.tenant_id`, a query returns zero rows.
- **Cross-tenant access returns 404, not 403.** A `security_event` is emitted.
- A "system tenant" client (`withSystemTenant`) exists exclusively for migrations and seeders, tagged with a `// SAFETY:` comment explaining the risk.

### 4.2 Authentication

- Auth.js Credentials provider for dev; OIDC config-driven, enabled per tenant.
- Step-up MFA (TOTP / WebAuthn) is **required** for: Approve, Publish, Sign verification, Accept ALARP, Modify tenant settings.
- Session tokens stored as HttpOnly + Secure + SameSite=Lax cookies.
- Failed-login backoff + IP-based rate limiting on auth endpoints.

### 4.3 Authorization

- `withRBAC(permission, scope)` wraps every API route handler.
- The permissions matrix in [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) §4.2 is the authoritative list.
- A scope check verifies the resource is in the user's permitted scope (tenant / business unit / asset / bowtie).

### 4.4 Audit log

- Every mutation goes through `withAudit(action, entity_type, fn)`.
- The wrapper computes RFC 6902 JSON Patch between before/after and stores it on `audit_log`.
- A Postgres trigger raises `EXCEPTION` on any UPDATE or DELETE of `audit_log`.
- `audit_log` is **partitioned monthly** from day one.

### 4.5 Encryption

- **In transit:** TLS 1.3 (Vercel-managed).
- **At rest:** AES-256 on Postgres (Vercel Postgres / Neon / Supabase).
- Per-tenant KMS key reference (`tenant.kms_key_id`) for envelope encryption of sensitive evidence (post-MVP for full envelope; in MVP, evidence files inherit storage-level encryption).

### 4.6 Secrets

- Vercel env vars / Doppler / 1Password Connect — never the repo. `.env.example` documents the canonical list.
- Secrets are rotated on a schedule; rotation procedure in `docs/guides/SECURITY.md` (placeholder until written).

### 4.7 CSP / web security

- Strict CSP via Next.js middleware. No inline scripts unless nonce-tagged. No third-party scripts beyond the explicitly approved AI / Liveblocks / observability domains.
- `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal.

### 4.8 Webhooks

- Outbound webhooks signed with HMAC-SHA256 + per-tenant secret.
- Replay protection via `nonce` + `timestamp`; 5-minute clock skew tolerance.

### 4.9 Evidence uploads

- Pre-signed Vercel Blob URLs.
- 50 MB cap per file (configurable via `EVIDENCE_MAX_FILE_SIZE_MB`).
- Server-side virus scanning (post-MVP).

### 4.10 Logging & observability

- Structured JSON logs with `tenant_id`, `request_id`, `user_id`.
- No PII in logs (email hashes only).
- Sentry for errors; Datadog / OTLP for metrics + traces.
- A dedicated "security event" stream for cross-tenant attempts, MFA failures, and audit-log trigger violations.

---

## 5. Acceptance criteria (release-blocking)

A release does not ship unless **every** item below is true. Same gate for MVP and every subsequent release.

### 5.1 Methodology

- [ ] The 6-stage approval gate is enforced server-side. Skipping any stage is impossible via UI / API / admin override.
- [ ] The full structural rules + 8-criteria barrier quality gate run on Risk Manager Review → Approved.
- [ ] Approved/Published Bowties are immutable (substantive edits require an MOC link or tenant config exemption).
- [ ] Terminology: only **Degradation Factor** and **Degradation Control** appear in code, comments, UI strings, and docs.
- [ ] All four risk levels (Inherent · Current · Residual · Target) are populated on every published Bowtie.
- [ ] Documented gap pattern works: a `gap_record` with owner + target_resolution_date + linked Action lets a Bowtie publish with a known missing barrier; a bare missing barrier never does.
- [ ] Numerical barrier health (0–100) is the canonical metric, computed by `packages/methodology`.
- [ ] Compensated Red stays Red (with `with_compensatory=true`); never auto-promoted.
- [ ] Every state-changing action writes one immutable audit row.
- [ ] Cross-tenant access returns 404 + emits a security event.

### 5.2 Functional

- [ ] Every endpoint has happy-path + ≥ 1 validation-failure + ≥ 1 RBAC-rejection integration test.
- [ ] Every list/read endpoint has a cross-tenant negative test (asserts 404).
- [ ] Every UI feature has a Playwright test covering the happy path of the user story.
- [ ] Audit log produces a valid RFC 6902 patch for every mutation; a UPDATE/DELETE attempt on audit_log raises a trigger error.

### 5.3 AI

- [ ] Every AI invocation persists an `ai_suggestion` row with `prompt_hash`, `model_id`, structured output (canonical 6-field schema).
- [ ] Every accepted suggestion writes `ai_origin_suggestion_id` on the destination entity.
- [ ] The approval gate **blocks** when any element on the Bowtie has `ai_origin_suggestion_id` whose `reviewer_decision` is null.
- [ ] AI responses that don't conform to the canonical schema are rejected, retried once, and surfaced to the user — never silently swallowed.
- [ ] Disabling the AI agent on a tenant leaves the rest of the product fully functional.

### 5.4 Performance (Lighthouse CI budgets enforced)

- [ ] LCP < 2.5 s
- [ ] INP < 200 ms
- [ ] CLS < 0.1
- [ ] TBT < 200 ms
- [ ] Bowtie open p95 < 1.5 s for ≤ 200 elements
- [ ] Save-patch p95 < 800 ms

### 5.5 Accessibility

- [ ] WCAG 2.1 AA on every page (axe-core CI gate).
- [ ] Keyboard navigation works on the Bowtie canvas (tab order + arrow keys).

### 5.6 Quality / coverage

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build` all green.
- [ ] `packages/methodology` branch coverage ≥ 95 %.
- [ ] No new `// @ts-ignore` or `// eslint-disable` without a justification comment.
- [ ] No `pnpm audit` critical / high findings.
- [ ] Snyk / similar SCA scan green.
- [ ] CODEOWNERS-required reviews satisfied (docs / methodology / auth / audit / prisma).

### 5.7 Operational

- [ ] Runbook for: tenant onboarding · key rotation · audit-log restore-from-backup · incident response · ALARP escalation. (Some land in later sprints; tracked here so they are not forgotten.)
- [ ] Backups verified by quarterly restore drill (post-MVP for the drill cadence; backups themselves from day one).
- [ ] SLOs published: `apps/web` 99.9 % monthly availability target; verification-task latency p95 < 5 min.

---

## 6. Deployment & environments

| Environment | Purpose | URL pattern |
|---|---|---|
| Local | dev loop on the developer's machine | `http://localhost:3000` |
| Preview | per-PR Vercel preview | `https://<branch>.<project>.vercel.app` |
| Staging | shared, mirrors production | `https://staging.<project>.vercel.app` |
| Production | customer-facing | `https://<project>.com` |

- **Production deploy** from `main` is gated behind manual approval (Vercel "Production" + GitHub Environment protection).
- **Worker deploy** to Railway / Fly via deploy hook on merge to `main`.
- **Migrations** run automatically as part of the deploy; rollback uses the Prisma "down" migration paired with point-in-time recovery for data changes.

---

## 7. Disaster-recovery posture

- Postgres point-in-time recovery (Vercel Postgres / Neon native).
- Daily logical backup to a separate region.
- RTO 4 h, RPO 1 h target for MVP; tighter post-MVP.
- Audit-log partitions backed up monthly to immutable storage.

---

## 8. Compliance posture

- **GDPR:** data subject rights honored via tenant-admin tooling (export, erasure subject to retention obligations).
- **SOC 2 Type I** preparation track post-MVP; controls documented in `docs/guides/SECURITY.md` (to be authored).
- **ISO 27001 / 27017 / 27018:** alignment, not certification, in MVP.
- **Sectoral regulators:** Bowtie PDF export designed to be regulator-acceptable (with the caveat that each regulator has their own requirements; the PDF is a faithful, deterministic dump of the model).

---

## 9. Definition of "Sprint Done" (template)

Each sprint adds its own AC; this is the perpetual baseline.

- [ ] All sprint stories merged.
- [ ] CI green on `main`.
- [ ] Vercel preview deploys cleanly; Lighthouse + axe-core budgets met on changed pages.
- [ ] All tests pass; coverage budget met.
- [ ] No open critical / high security findings.
- [ ] ADRs recorded for every structural decision.
- [ ] Sprint retrospective filed in `docs/decisions/` or a sprint folder.
