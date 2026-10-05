# dathrift.shop

A one-of-a-kind thrift shop for Bangladesh: SvelteKit on Cloudflare Workers, D1 (through Drizzle ORM) for products, stock, orders and payments, R2 for product photos and backups, Cloudflare Access for staff, and bKash tokenized checkout.

Every product has exactly one sellable unit. Stock rules are enforced in D1 triggers, and an order is marked paid only from a provider-verified bKash result.

The code runs end to end locally with clearly marked TEST ONLY fixtures and a development-only test wallet. **Nothing is deployed and no live account is connected.**

## Local development

```sh
bun install
cp .env.example .env.local   # fill in values; never commit .env.local
bun run db:local:setup       # local D1 migrations, TEST ONLY seed data and photos
bun run dev
```

- Storefront: <http://localhost:5173>. Staff desk: <http://localhost:5173/admin> (loopback-only local preview).
- Checkout uses the built-in test wallet in development. Set `PAYMENT_PROVIDER=bkash-sandbox` and the `BKASH_*` values to use the bKash sandbox instead.

## Checks

```sh
bun run check          # svelte-check / TypeScript
bun run lint           # Prettier and ESLint
bunx vitest --run      # server, component and local D1 engine tests
npx playwright test    # guest journey on a throwaway local state (.wrangler/e2e)
```
