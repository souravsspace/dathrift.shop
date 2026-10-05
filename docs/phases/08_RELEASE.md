# Phase 8 — production release and operations

**Status:** not started. A local preview, sandbox payment or Phase 1 nonproduction proof is not production approval. A draft [operations runbook](../OPERATIONS.md) covers incident response, rollback and payment reconciliation.

## Preconditions

- Phase 1 remote access/durability/backup-recovery proof is complete, and production D1/R2/Worker/Access resources, bindings and secrets have separate explicit authorization. Dev/staging/prod are isolated; no probe/debug endpoint ships.
- Real product photography, measurements, condition notes, category availability and editorial-archive design are owner-approved. No test-only fixture is published as merchandise.
- Exact supported Dhaka areas, Steadfast merchant/pickup/remote-area terms, customer delivery charges, delivery timing, customer support, returns/refund rules and any policy markup are approved by owner/operations/legal.
- bKash sandbox contract and all-or-nothing D1 reservation races are proven. Merchant production credentials/product version and live checkout receive fresh explicit approval.
- Production backup schedule, 48-hour hourly/30-day daily retention, owner-email failure alerts and isolated restore are actually observed against approved recovery targets; an incident/rollback and bKash reconciliation procedure exists. R2 is same-provider backup, not cross-provider recovery.

## Verification and launch gate

Run and record actual `bun run check`, `bun run lint`, affected unit/integration/e2e tests, Worker production build/preview, no-secret scan, authorized Access-positive and anonymous-negative tests, sandbox purchase/cancel/failure/retry/late-success/race tests, backup/alert/restore drill, and desktop/mobile accessibility/SEO checks. Verify no payment/order data leaks into public caches or metadata. After any specifically approved deployment, crawl pages without JavaScript, validate Product/Offer JSON-LD, robots/sitemap/canonicals, sold-page controls and live health/alerts. Stop or roll back on a failed gate; pause checkout after uncertain restore until owner reconciliation.

**Exit:** every prerequisite and actual result is documented, the owner grants specific production deployment/live-account approval, and post-deploy smoke checks pass. Never report launch complete from configuration or mock tests alone.
