# Default reviewers — replace with real GitHub handles before going public.
* @your-org/maintainers

# The spec is sacred: doc changes need extra review.
/docs/ @your-org/maintainers @your-org/risk-team

# Methodology code is doubly sacred.
/packages/methodology/ @your-org/maintainers @your-org/risk-team

# Auth, audit, and DB are reviewed by security.
/apps/web/lib/auth/ @your-org/maintainers @your-org/security
/apps/web/lib/audit/ @your-org/maintainers @your-org/security
/apps/web/prisma/ @your-org/maintainers @your-org/security

# ADRs need risk + maintainers.
/docs/decisions/ @your-org/maintainers @your-org/risk-team

# Infra changes go to platform.
/infra/ @your-org/maintainers @your-org/platform
/.github/ @your-org/maintainers @your-org/platform
