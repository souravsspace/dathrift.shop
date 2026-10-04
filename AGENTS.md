# AGENTS.md

Read and follow [CLAUDE.md](CLAUDE.md) and [the implementation plan](docs/IMPLEMENTATION_PLAN.md) before implementation.

- This is a one-of-a-kind thrift shop: one sellable unit per product. Never treat a client-side sold-out label as inventory enforcement.
- Work test-first: agree on the public behavior/seam, write one failing test, implement the smallest passing slice, then repeat. Report which tests actually ran.
- Use Impeccable and ui-ux-pro-max for storefront design. The supplied logo is the brand source; do not invent a conflicting visual identity.
- Keep bKash credentials and PocketBase privileged credentials server-only. Never mark an order paid from a browser redirect alone.
- Commit each changed file separately with conventional, human-readable messages. Do not add AI or assistant attribution to files or commits.
- Do not push, deploy, or alter live accounts without explicit authorization for the specific action.

The `graphify` skill is triggered when the user types `/graphify`; follow its installed instructions first in that case.
