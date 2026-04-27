# Documentation

This is the **source of truth** for the Barrier Management — Bowtie SaaS module. Read this index, then read the documents in the order shown.

If code disagrees with these documents, the documents win — unless an ADR in [`decisions/`](decisions/) explicitly records the deviation.

---

## Read order

| # | File | Read time | Read this when |
|---|---|---|---|
| 0 | [`00_RECONCILIATION_NOTES.md`](00_RECONCILIATION_NOTES.md) | 5 min | Onboarding — orient yourself on how v2 was assembled |
| 1 | [`01_PRODUCT_SPEC.md`](01_PRODUCT_SPEC.md) | 15 min | Always — vision, FRs, NFRs |
| 2 | [`02_DATA_MODEL.md`](02_DATA_MODEL.md) | 30 min | Schema, migration, repository code |
| 3 | [`03_WORKFLOWS_AND_VALIDATION.md`](03_WORKFLOWS_AND_VALIDATION.md) | 30 min | State machines, validation, RBAC, health calculation |
| 4 | [`04_UI_UX_AND_REPORTS.md`](04_UI_UX_AND_REPORTS.md) | 15 min | UI, dashboards, reports |
| 5 | [`05_ARCHITECTURE_SECURITY_ACCEPTANCE.md`](05_ARCHITECTURE_SECURITY_ACCEPTANCE.md) | 15 min | Architecture, security, acceptance criteria |
| 6 | [`06_ROADMAP_CLAUDE_CODE_PROMPTS.md`](06_ROADMAP_CLAUDE_CODE_PROMPTS.md) | 15 min | Original spec roadmap & prompts (superseded by `prompts/` for execution) |
| 7 | [`07_AI_AGENT.md`](07_AI_AGENT.md) | 10 min | Anything touching the Bowtie Assistant |
| 8 | [`08_PACKAGE_STRUCTURE.md`](08_PACKAGE_STRUCTURE.md) | 10 min | Repo layout, stack decisions, env vars, CI/CD |
| 9 | [`09_SPRINT_1_BACKLOG.md`](09_SPRINT_1_BACKLOG.md) | 10 min | Sprint 1 user stories, AC, story points |
| 10 | [`10_MVP_BUILD_SEQUENCE.md`](10_MVP_BUILD_SEQUENCE.md) | 10 min | Dependency order, sprint-by-sprint plan to MVP |
| 11 | [`11_GLOSSARY.md`](11_GLOSSARY.md) | 5 min | Quick lookup — methodology terms |

---

## Subdirectories

### `prompts/` — Claude Code prompts

Ten ready-to-paste prompts, in execution order. Each is self-contained, references the spec sections it depends on, and produces a tested outcome.

Start at [`prompts/README.md`](prompts/README.md), then run [`prompts/01-foundation.md`](prompts/01-foundation.md) and proceed sequentially.

### `decisions/` — Architecture Decision Records (ADRs)

Every structural deviation from the spec, every framework choice, every database design call lives here. Use [`decisions/0000-template.md`](decisions/0000-template.md) as the starting point.

### `guides/` — Engineering guides

Operational documents — how to contribute, how to test, how to deploy, how to handle security incidents.

---

## When something changes

- **Spec change?** → Edit the relevant numbered file. Bump version in the header. Add a one-line entry to the file's changelog (top of file).
- **Architecture decision?** → Write an ADR in [`decisions/`](decisions/). Don't modify the spec to match — link the ADR and let it be read alongside.
- **Process change?** → Update the relevant guide in [`guides/`](guides/).
- **New methodology term?** → Add to [`11_GLOSSARY.md`](11_GLOSSARY.md) AND the relevant deep-spec file.

---

## Document control

- **Spec version:** 2.0 (merged)
- **Last update:** 2026-04-27
- **Frozen for:** MVP development (Sprints 1–8)
- **Next review:** Before Sprint 9 (post-MVP planning)

For changes to the merged origins, see [`00_RECONCILIATION_NOTES.md`](00_RECONCILIATION_NOTES.md).
