# Phase 0 — starter baseline

**Status:** complete as of 2026-10-05. This is a historical local baseline, not evidence for D1/R2 production durability.

## Observable behavior and evidence

- SvelteKit source, tests and supported tool configuration use TypeScript; `tsconfig.json` replaces `jsconfig.json`. Historical `pb_migrations/*.js` remain JavaScript because PocketBase executes JavaScript migrations directly; generated Worker JavaScript is output, not source.
- The Svelte type-check, lint, Vitest server/browser, Playwright starter e2e, and local Cloudflare Worker preview passed after the starter fixes. Browser and Docker localhost tests needed sandbox escalation for loopback binding; the source was not changed to hide that environment restriction.
- The local PocketBase restart/restore experiment and PocketBase product public-access tests passed, but PocketBase is retired from the production architecture. Do not count these tests toward Phase 1 or D1 catalog gates.

## Ongoing regression gate

Rerun affected checks after each small slice. Report the commands and results actually observed rather than copying this historical result forward. Keep the storefront visual direction unchanged until the owner approves a concrete concept.
