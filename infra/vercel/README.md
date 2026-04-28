# infra/vercel

Vercel project configuration for the monorepo. The Vercel project is linked to `apps/web`; the build command runs Turborepo so workspace packages compile together.

## Required env vars (per environment)

Mirror [`.env.example`](../../.env.example). Use the Vercel UI (or `vercel env` CLI) — never commit secrets.

## Promotion

- Preview: every PR (auto).
- Production: manual approval via Vercel "Production" environment + GitHub Environment protection (per S1-02).
