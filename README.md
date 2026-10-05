# dathrift.shop

A planned, one-of-a-kind thrift shop for Bangladesh. The storefront will use SvelteKit on Cloudflare Workers, D1 will manage product and order data, R2 will hold files and backups, and bKash will handle online payments.

The project is currently the `sv create` starter plus planning and brand assets. No checkout or product inventory is implemented yet. See [the implementation plan](docs/IMPLEMENTATION_PLAN.md) before building.

## Local starter

```sh
bun install
bun run dev
```

The starter includes Vitest and Playwright. Product behavior will be built test-first in small slices.
