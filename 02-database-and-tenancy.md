# Claude Code Prompts

Ten sequential, self-contained prompts that take the repo from empty to MVP-shipped. Run them in order. Each prompt:

- Begins by telling Claude Code which spec sections to read.
- States a clear goal and scope boundary.
- Lists deliverables and acceptance criteria.
- Specifies the tests required.
- Ends with a "definition of done" checklist.

---

## How to use

1. **Always read [`/CLAUDE.md`](../../CLAUDE.md) first.** This is non-negotiable.
2. Pick the prompt for the sprint you're in (see [`10_MVP_BUILD_SEQUENCE.md`](../10_MVP_BUILD_SEQUENCE.md)).
3. Paste the prompt verbatim into Claude Code.
4. Let it work; review output; iterate within the same prompt scope.
5. Don't move to the next prompt until the current one's "Definition of done" is checked off and merged.

---

## Prompts

| # | Prompt | Sprint | Builds |
|---|---|---|---|
| 1 | [`01-foundation.md`](01-foundation.md) | 1 | Monorepo + Vercel + CI |
| 2 | [`02-database-and-tenancy.md`](02-database-and-tenancy.md) | 1 | Postgres + Prisma + RLS + tenant scoping |
| 3 | [`03-domain-schema.md`](03-domain-schema.md) | 2 | Full domain schema + audit log infrastructure |
| 4 | [`04-auth-rbac.md`](04-auth-rbac.md) | 3 | Auth.js + RBAC middleware + step-up auth scaffold |
| 5 | [`05-bowtie-api.md`](05-bowtie-api.md) | 3 | Hazard / Top Event / Bowtie / Threat / Consequence endpoints + 6-stage approval state machine |
| 6 | [`06-12step-wizard.md`](06-12step-wizard.md) | 4 | 12-step Wizard UI + Barrier / DF / DC / Gap Record endpoints |
| 7 | [`07-bowtie-canvas.md`](07-bowtie-canvas.md) | 5 | React Flow canvas + Side Panel (8 tabs) + 6-color encoding + filters |
| 8 | [`08-barrier-health.md`](08-barrier-health.md) | 6 | Numeric 0–100 health calculator + verification + worker job |
| 9 | [`09-ai-agent.md`](09-ai-agent.md) | 7 | Bowtie Assistant in Wizard + Side Panel + approval-gate enforcement |
| 10 | [`10-pdf-export.md`](10-pdf-export.md) | 8 | Regulator-pack PDF + performance + a11y + final hardening |

---

## Prompt anatomy

Every prompt follows this structure:

```
ROLE & CONTEXT
- One paragraph naming the goal and scope.

READ FIRST
- /CLAUDE.md
- /docs/<relevant spec sections>

DELIVERABLES
- Concrete file list with purpose.

ACCEPTANCE CRITERIA
- Bullet list of testable outcomes.

TESTS REQUIRED
- Unit, integration, e2e — in scope.

DEFINITION OF DONE
- Checklist Claude Code uses to self-verify before claiming completion.
```

Keep prompts narrow. If a prompt blows past one feature, split it.

---

## When a prompt fails

If Claude Code can't satisfy a prompt:

1. Don't expand the scope — narrow it.
2. Don't weaken acceptance criteria — split them across prompts.
3. Don't skip tests — write them first if needed.
4. If the spec itself is the problem, **write an ADR** explaining the deviation and link it from the prompt.

---

## After MVP

Sprints 9+ get their own prompt set. Build them following the same anatomy. The 14-sprint roadmap is in [`10_MVP_BUILD_SEQUENCE.md`](../10_MVP_BUILD_SEQUENCE.md).
