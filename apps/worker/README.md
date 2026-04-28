# apps/worker

BullMQ-driven background worker. Runs verification scheduling, barrier-health re-calc, notifications, and periodic-review reminders. Deployed to Railway / Fly.io / Render — Vercel does not run long-lived processes.

The current foundation logs `worker ready (env=<env>)` on boot and exits cleanly on `SIGTERM`. Real jobs land in Sprint 4 — see [`docs/prompts/`](../../docs/prompts/).

See [`docs/08_PACKAGE_STRUCTURE.md`](../../docs/08_PACKAGE_STRUCTURE.md) §2.
