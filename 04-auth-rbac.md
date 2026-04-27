# =============================================================================
# Barrier Management — Bowtie · Environment configuration
# Copy to .env.local for local dev. Never commit .env.local.
# =============================================================================

# ----- Database -----
# Vercel Postgres / Neon / Supabase Postgres connection strings
DATABASE_URL="postgresql://user:pass@localhost:5432/bowtie_dev?schema=public"
DIRECT_URL="postgresql://user:pass@localhost:5432/bowtie_dev?schema=public"

# ----- Redis (Upstash) -----
REDIS_URL=""
REDIS_TOKEN=""

# ----- Auth (Auth.js / NextAuth) -----
AUTH_SECRET=""              # generate with `openssl rand -base64 32`
AUTH_URL="http://localhost:3000"

# Optional: per-tenant OIDC config can override these defaults
OIDC_ISSUER=""
OIDC_CLIENT_ID=""
OIDC_CLIENT_SECRET=""

# ----- AI agent (Anthropic) -----
ANTHROPIC_API_KEY=""
AI_AGENT_DEFAULT_MODEL="claude-opus-4-7"
AI_AGENT_DEFAULT_MAX_TOKENS="2000"

# ----- Real-time co-editing (Liveblocks) -----
LIVEBLOCKS_SECRET_KEY=""

# ----- File storage (Vercel Blob) -----
BLOB_READ_WRITE_TOKEN=""

# ----- Email (Resend) -----
RESEND_API_KEY=""
EMAIL_FROM="noreply@example.com"

# ----- Observability -----
SENTRY_DSN=""
DATADOG_API_KEY=""
OTEL_EXPORTER_OTLP_ENDPOINT=""

# ----- Feature flags -----
FEATURE_AI_AGENT_ENABLED="true"
FEATURE_WORKSHOP_MODE_ENABLED="true"
FEATURE_PORTFOLIO_AI_SCAN_ENABLED="false"

# ----- Tenancy -----
DEFAULT_TENANT_ID=""        # uuid of the seeded demo tenant for local dev

# ----- Security -----
WEBHOOK_HMAC_SECRET=""      # generate with `openssl rand -hex 32`
EVIDENCE_MAX_FILE_SIZE_MB="50"

# ----- Dev seed credentials -----
# These are populated by the seed script; document for clarity.
SEED_RISK_MANAGER_EMAIL="risk.manager@demo.bowtie.local"
SEED_RISK_MANAGER_PASSWORD="ChangeMe123!"
SEED_FACILITATOR_EMAIL="facilitator@demo.bowtie.local"
SEED_FACILITATOR_PASSWORD="ChangeMe123!"
