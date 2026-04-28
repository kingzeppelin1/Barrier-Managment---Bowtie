# Package Structure & Stack Decisions

This document defines the **physical layout** of the repository and the **stack decisions** that translate the v2 specification into a concrete Vercel-deployable codebase.

It is the bridge between [`05_ARCHITECTURE_SECURITY_ACCEPTANCE.md`](05_ARCHITECTURE_SECURITY_ACCEPTANCE.md) (which is stack-agnostic) and the actual files under [`apps/`](../apps/), [`packages/`](../packages/) and [`infra/`](../infra/).

---

## 1. Stack decisions

### 1.1 Deviation from the v2 spec

The v2 spec (file 05) suggested NestJS for the API. We deviate:

- **Choice:** Next.js 15 App Router serves both UI and API.
- **Rationale:** Vercel-native, single deploy unit, fewer moving parts for MVP, App Router Route Handlers are well-suited to REST endpoints.
- **What we keep from NestJS philosophy:** clean architecture (controller → service → repository) is enforced by directory convention, not by a framework.
- **ADR:** [`decisions/0001-nextjs-instead-of-nestjs.md`](decisions/0001-nextjs-instead-of-nestjs.md) (to be authored in Sprint 0).

### 1.2 Hosting topology

| Service | Runs on | Why |
|---|---|---|
| `apps/web` (Next.js) | **Vercel** | Edge for read-mostly routes; Node for Prisma/BullMQ-touching routes. |
| `apps/worker` (BullMQ scheduler) | **Railway** or **Fly.io** or **Render** | Long-running process — Vercel does not run workers. |
| `apps/realtime` (y-websocket) | **Liveblocks** (managed) for MVP; self-hostable on Railway later | WebSockets unsuitable for Vercel functions. |
| Postgres | **Vercel Postgres** (Neon-backed) for MVP; Supabase or AWS RDS for enterprise | Native integration; switch if data residency demands it. |
| Redis | **Upstash** | Serverless-friendly; works with Vercel + worker. |
| File storage | **Vercel Blob** | Native; S3-compatible API where needed. |
| Email | **Resend** or **Postmark** | Transactional reliability. |
| Search | **Postgres FTS** for MVP; **OpenSearch** post-MVP | Defer infra. |

### 1.3 Why this is correct for v1.0 MVP

- All MVP features are CRUD + workflow + canvas + AI calls. None of them require dedicated microservices.
- Background scheduling (verification tasks, health re-calc) is the only non-Vercel piece — that's what `apps/worker` exists for.
- Real-time co-editing is opt-in (workshop mode) — Liveblocks is a 1-line integration.
- We can extract a separate API service later (split `apps/web` into `apps/web` + `apps/api`) without touching domain logic, since domain logic lives in `packages/methodology`.

---

## 2. Folder structure

```
barrier-management-bowtie/
│
├── README.md                          # project landing page
├── CLAUDE.md                          # operating manual for Claude Code
├── LICENSE                            # TBD (suggest BUSL-1.1)
├── .gitignore
├── .nvmrc                             # Node 20
├── .env.example                       # all env vars documented
├── package.json                       # root - workspaces declaration
├── pnpm-workspace.yaml
├── turbo.json                         # task pipeline
├── tsconfig.base.json
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # lint, typecheck, test, build
│   │   ├── e2e.yml                    # Playwright on PR
│   │   └── deploy-preview.yml         # Vercel preview comment
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   └── dependabot.yml
│
├── docs/                              # SOURCE OF TRUTH — read before coding
│   ├── 00_RECONCILIATION_NOTES.md
│   ├── 01_PRODUCT_SPEC.md
│   ├── 02_DATA_MODEL.md
│   ├── 03_WORKFLOWS_AND_VALIDATION.md
│   ├── 04_UI_UX_AND_REPORTS.md
│   ├── 05_ARCHITECTURE_SECURITY_ACCEPTANCE.md
│   ├── 06_ROADMAP_CLAUDE_CODE_PROMPTS.md
│   ├── 07_AI_AGENT.md
│   ├── 08_PACKAGE_STRUCTURE.md       # this file
│   ├── 09_SPRINT_1_BACKLOG.md
│   ├── 10_MVP_BUILD_SEQUENCE.md
│   ├── 11_GLOSSARY.md
│   ├── decisions/                    # ADRs
│   │   ├── 0000-template.md
│   │   ├── 0001-nextjs-instead-of-nestjs.md
│   │   ├── 0002-liveblocks-for-realtime.md
│   │   └── ...
│   ├── prompts/                      # ready-to-paste Claude Code prompts
│   │   ├── README.md                 # prompt index + usage
│   │   ├── 01-foundation.md
│   │   ├── 02-database-and-tenancy.md
│   │   ├── 03-domain-schema.md
│   │   ├── 04-auth-rbac.md
│   │   ├── 05-bowtie-api.md
│   │   ├── 06-12step-wizard.md
│   │   ├── 07-bowtie-canvas.md
│   │   ├── 08-barrier-health.md
│   │   ├── 09-ai-agent.md
│   │   └── 10-pdf-export.md
│   └── guides/
│       ├── CONTRIBUTING.md
│       ├── TESTING.md
│       ├── SECURITY.md
│       └── DEPLOYMENT.md
│
├── apps/
│   ├── web/                          # Next.js — UI + API
│   │   ├── app/                      # App Router
│   │   │   ├── (auth)/               # login, signup
│   │   │   ├── (app)/                # authenticated app
│   │   │   │   ├── dashboard/
│   │   │   │   ├── bowties/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   ├── new/          # 12-step wizard
│   │   │   │   │   └── page.tsx      # library
│   │   │   │   ├── barriers/
│   │   │   │   ├── verifications/
│   │   │   │   ├── actions/
│   │   │   │   ├── risk-register/
│   │   │   │   ├── audits/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   ├── api/                  # Route Handlers
│   │   │   │   └── v1/
│   │   │   │       ├── hazards/
│   │   │   │       ├── top-events/
│   │   │   │       ├── bowties/
│   │   │   │       ├── barriers/
│   │   │   │       ├── degradation-factors/
│   │   │   │       ├── degradation-controls/
│   │   │   │       ├── gap-records/
│   │   │   │       ├── verifications/
│   │   │   │       ├── ai/
│   │   │   │       ├── webhooks/
│   │   │   │       └── audit-log/
│   │   │   └── layout.tsx
│   │   ├── components/               # React components (UI fragments)
│   │   ├── lib/
│   │   │   ├── auth/                 # Auth.js config, RBAC helpers
│   │   │   ├── db/                   # Prisma client + tenant scoping
│   │   │   ├── repos/                # repository layer (DB access)
│   │   │   ├── services/             # business logic
│   │   │   ├── audit/                # withAudit wrapper, RFC 6902 diff
│   │   │   ├── ai/                   # Anthropic client, prompt builder
│   │   │   ├── events/               # event bus (BullMQ producer)
│   │   │   └── pdf/                  # PDF generation
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── public/
│   │   ├── tests/
│   │   │   ├── integration/
│   │   │   └── e2e/                  # Playwright
│   │   ├── middleware.ts             # tenant resolution + auth
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── worker/                       # BullMQ worker — separate deploy
│   │   ├── src/
│   │   │   ├── jobs/
│   │   │   │   ├── verification-scheduler.ts
│   │   │   │   ├── barrier-health-recalc.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── periodic-review-reminder.ts
│   │   │   ├── index.ts              # worker bootstrap
│   │   │   └── lib/                  # shares Prisma client + repos via @bowtie/* aliases
│   │   ├── tests/
│   │   ├── Dockerfile                # for Railway/Fly/Render
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── realtime/                     # OPTIONAL self-hosted y-websocket
│       ├── src/
│       │   └── server.ts
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared/                       # zod schemas, TypeScript types, enums
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   │   ├── bowtie.ts
│   │   │   │   ├── barrier.ts
│   │   │   │   ├── degradation.ts
│   │   │   │   ├── risk.ts
│   │   │   │   ├── ai.ts             # canonical 6-field schema
│   │   │   │   └── ...
│   │   │   ├── enums/
│   │   │   ├── constants/
│   │   │   └── index.ts
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── ui/                           # shared React components (atoms/molecules)
│   │   ├── src/
│   │   │   ├── primitives/           # Button, Input, Select, etc.
│   │   │   ├── compounds/            # SidePanel, Stepper, HealthDot, RiskDot
│   │   │   └── theme/
│   │   └── package.json
│   │
│   ├── methodology/                  # PURE FUNCTIONS — domain logic
│   │   ├── src/
│   │   │   ├── barrier-health/
│   │   │   │   ├── calculate.ts      # the canonical 0-100 calculator
│   │   │   │   └── floors.ts         # automatic floors
│   │   │   ├── validation/
│   │   │   │   ├── bowtie-structural.ts
│   │   │   │   ├── barrier-quality.ts
│   │   │   │   └── pathway-independence.ts
│   │   │   ├── risk/
│   │   │   │   └── matrix.ts         # 4-level evaluation
│   │   │   └── index.ts
│   │   ├── tests/                    # 100% branch coverage required
│   │   └── package.json
│   │
│   └── config/                       # shared eslint, tsconfig, prettier
│       ├── eslint-preset/
│       ├── tsconfig/
│       └── package.json
│
├── infra/
│   ├── terraform/                    # Vercel project, Postgres, Upstash, OpenSearch
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── modules/
│   ├── vercel/
│   │   └── vercel.json
│   └── README.md
│
└── scripts/                          # one-off scripts
    ├── seed-templates.ts             # sector seed templates
    └── generate-api-docs.ts
```

---

## 3. Where the 9 spec files live

| Spec file | Path |
|---|---|
| Reconciliation Notes | [`docs/00_RECONCILIATION_NOTES.md`](00_RECONCILIATION_NOTES.md) |
| Product Spec | [`docs/01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md) |
| Data Model | [`docs/02_DATA_MODEL.md`](02_DATA_MODEL.md) |
| Workflows & Validation | [`docs/03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) |
| UI/UX & Reports | [`docs/04_UI_UX_AND_REPORTS.md`](04_UI_UX_AND_REPORTS.md) |
| Architecture, Security & AC | [`docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md`](05_ARCHITECTURE_SECURITY_ACCEPTANCE.md) |
| Roadmap & Original Prompts | [`docs/06_ROADMAP_CLAUDE_CODE_PROMPTS.md`](06_ROADMAP_CLAUDE_CODE_PROMPTS.md) |
| AI Agent | [`docs/07_AI_AGENT.md`](07_AI_AGENT.md) |
| Package Structure (this file) | [`docs/08_PACKAGE_STRUCTURE.md`](08_PACKAGE_STRUCTURE.md) |

---

## 4. Module ownership and import rules

```
apps/web      → can import from packages/* and from its own lib/
apps/worker   → can import from packages/* and a small subset of apps/web/lib (via aliases)
apps/realtime → can import from packages/shared only
packages/methodology → no external imports beyond stdlib + zod (must be pure)
packages/shared → no imports from packages/ui, methodology, or apps
packages/ui    → can import from packages/shared (types) but never from methodology or apps
packages/config → no runtime imports
```

The rule of thumb: **`packages/methodology` is the heart**. It is the smallest, most-tested, framework-free module. Everything depends on it; it depends on nothing.

---

## 5. Path aliases

In `tsconfig.base.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@bowtie/shared": ["packages/shared/src"],
      "@bowtie/shared/*": ["packages/shared/src/*"],
      "@bowtie/ui": ["packages/ui/src"],
      "@bowtie/ui/*": ["packages/ui/src/*"],
      "@bowtie/methodology": ["packages/methodology/src"],
      "@bowtie/methodology/*": ["packages/methodology/src/*"],
      "@/lib/*": ["apps/web/lib/*"],
      "@/components/*": ["apps/web/components/*"]
    }
  }
}
```

---

## 6. Environment variables (canonical list)

Documented in `.env.example` at root. Any new env var must be added there + the deploy environments + `docs/guides/DEPLOYMENT.md`.

```
# Database
DATABASE_URL=
DIRECT_URL=

# Redis (Upstash)
REDIS_URL=
REDIS_TOKEN=

# Auth
AUTH_SECRET=
AUTH_URL=
OIDC_ISSUER=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=
AI_AGENT_DEFAULT_MODEL=claude-opus-4-7
AI_AGENT_DEFAULT_MAX_TOKENS=2000

# Real-time
LIVEBLOCKS_SECRET_KEY=

# Storage
BLOB_READ_WRITE_TOKEN=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Observability
SENTRY_DSN=
DATADOG_API_KEY=
OTEL_EXPORTER_OTLP_ENDPOINT=

# Feature flags
FEATURE_AI_AGENT_ENABLED=true
FEATURE_WORKSHOP_MODE_ENABLED=true
FEATURE_PORTFOLIO_AI_SCAN_ENABLED=false

# Tenancy
DEFAULT_TENANT_ID=

# Security
WEBHOOK_HMAC_SECRET=
EVIDENCE_MAX_FILE_SIZE_MB=50
```

---

## 7. CI/CD pipeline

```
PR opened/updated
   ├── lint                 (eslint + prettier)
   ├── typecheck            (tsc --noEmit)
   ├── test:unit            (vitest)
   ├── test:integration     (vitest + testcontainers postgres)
   ├── test:e2e             (Playwright against vercel preview)
   ├── build                (turbo build)
   └── vercel preview       (auto-comment with URL)

Merge to main
   ├── all of the above
   ├── deploy preview → production (Vercel)
   ├── deploy worker (Railway via deploy hook)
   └── deploy realtime (Liveblocks config push if changed)

Tag release
   ├── changelog
   ├── publish OpenAPI spec to /api/v1/docs
   └── notify Slack
```

CI gates that **must** be green for merge:
- All lint/typecheck/test commands pass.
- Coverage on `packages/methodology` ≥ 95%.
- No new `// @ts-ignore` or `// eslint-disable` without justification comment.
- Lighthouse CI budgets met on changed pages.
- A11y check passes (axe-core).
