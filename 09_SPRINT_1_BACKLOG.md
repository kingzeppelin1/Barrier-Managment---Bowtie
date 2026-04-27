# Prompt 04 — Authentication & RBAC

## Role & Context

You are wiring user authentication, tenant resolution, role-based access control, and a step-up MFA scaffold. By the end of this prompt, every API route is gated by RBAC and every cross-tenant access returns 404 with a security event logged.

## Read first

- `/CLAUDE.md`.
- `/docs/01_PRODUCT_SPEC.md` — section 4.3 (permissions).
- `/docs/03_WORKFLOWS_AND_VALIDATION.md` — section 4 (full permission matrix).
- `/docs/05_ARCHITECTURE_SECURITY_ACCEPTANCE.md` — auth and security sections.

## Deliverables

### Auth.js setup

`apps/web/lib/auth/`:

- `config.ts` — Auth.js (NextAuth v5) config:
  - **Credentials provider** for dev (email + password against `user` table; bcrypt hashed).
  - **OIDC provider** scaffold — config-driven, can be enabled per tenant via `tenant.settings.oidc`.
  - **SAML provider** placeholder (not configured for MVP; just leave a clean extension point).
- Session strategy: JWT with rotating secret. Token includes `userId`, `tenantId`, `roleAssignmentIds`, `mfaSatisfied`.
- Session lifetime: 12 h, with 1 h refresh window.

`apps/web/app/(auth)/login/page.tsx` — minimal login form using shadcn/ui or our `@bowtie/ui` primitives.
`apps/web/app/(auth)/logout/page.tsx` — calls signOut.

### Middleware: tenant + auth resolution

`apps/web/middleware.ts`:

- For all `/api/v1/*` and `/(app)/*` routes:
  - Resolve session.
  - If unauthenticated → redirect (UI) or 401 (API).
  - Look up the user; resolve `tenantId`.
  - Attach `tenantId`, `userId`, `roleAssignments`, `requestId`, `ipAddress` to request context.

### RBAC helpers

`apps/web/lib/auth/rbac.ts`:

```ts
export async function requirePermission(
  permission: string,           // e.g. 'bowtie:approve'
  scope?: { type: 'tenant' | 'business_unit' | 'asset' | 'bowtie'; id?: string }
): Promise<AuthContext>;

export async function requireStepUp(): Promise<void>;
```

- Reads context from middleware-attached headers.
- Resolves the user's role assignments and aggregated permissions.
- For scoped permissions, walks the asset tree.
- Throws structured errors:
  - 401 if not authenticated.
  - 403 if authenticated but missing permission.
  - **404 if cross-tenant** (and emits a security event to `audit_log` with `action='security.cross_tenant_attempt'`).

### Step-up MFA scaffold

`apps/web/lib/auth/step-up.ts`:

- `requireStepUp()` checks `session.mfaSatisfied` AND that step-up was within last 5 minutes.
- If not satisfied, throws a `StepUpRequiredError(returnUrl)` with HTTP 401 and a structured payload `{ error: 'step_up_required', method: 'totp' | 'webauthn', return_url }`.
- Endpoint `POST /api/v1/auth/step-up/verify` accepts a TOTP code (use `otplib`) and updates the session.
- Full TOTP/WebAuthn enrollment UI is **out of scope** — leave a `// TODO(sprint-7)` marker for full enrollment flow. Hard-code one TOTP secret in the seed for testing.

### Permission seeding

Update `apps/web/prisma/seed.ts`:

- For each role from `03_WORKFLOWS_AND_VALIDATION.md` §4, populate `role.permissions` per the matrix.
- Assign each demo user the corresponding role at tenant scope.
- Also create one demo user with `bowtie:read` only at a single asset scope (for scoping tests).

### `/api/v1/me` endpoint

`apps/web/app/api/v1/me/route.ts` (GET):

- Returns `{ user, tenant, roles, permissions, mfaSatisfied }`.
- Used by the web app on boot.

### Wire RBAC into the existing comment endpoint

Update `apps/web/app/api/v1/comments/route.ts` to use `requirePermission('comment:create')` and propagate the resolved `AuthContext` into the `withAudit` wrapper.

## Acceptance criteria

- [ ] Login with seeded credentials returns a valid session.
- [ ] `GET /api/v1/me` returns the user's tenant, roles, permissions.
- [ ] `GET /api/v1/comments` without a session → 401.
- [ ] User without `comment:read` → 403.
- [ ] User from tenant A reading tenant B's resource → 404 + security event in audit log.
- [ ] An attempt to call a step-up-protected route without recent MFA → 401 with structured `step_up_required` payload.
- [ ] After successful `/auth/step-up/verify`, the same call succeeds.
- [ ] Session JWT does not contain raw permissions list — only `roleAssignmentIds`. Permissions are resolved server-side per request.

## Tests required

`apps/web/tests/integration/auth.test.ts`:

- Login happy path.
- Login with wrong password.
- `/me` returns the right tenant and aggregated permissions.

`apps/web/tests/integration/rbac.test.ts`:

- Permission grant/deny per role for sample endpoints.
- Cross-tenant returns 404 + audit row with `action='security.cross_tenant_attempt'`.
- Asset-scoped permission denies access outside the scope.
- Step-up flow blocks then allows after verify.

## ADR required

`docs/decisions/0003-authjs-over-clerk-or-supabase.md` — why Auth.js, what we trade off.

## Definition of done

- [ ] All deliverables shipped.
- [ ] All acceptance criteria checked.
- [ ] Tests passing in CI.
- [ ] ADR-0003 merged.
- [ ] Summary block per `/CLAUDE.md` §8.
