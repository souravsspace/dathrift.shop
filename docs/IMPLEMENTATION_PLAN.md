# dathrift.shop — implementation plan

## Product thesis and launch scope

A carefully edited thrift drop, not a generic endless catalog. Each product is a photographed, measured, one-off piece with one sellable unit. The site should make condition and fit clear, make price and delivery transparent, and preserve an item's page after sale with an unmistakable **Sold out** state.

**Planning assumption, not approval:** launch with guest checkout and one item per order. This avoids a cart reserving several unique items at once. A multi-item cart can be considered only after the single-item flow is sound.

## Customer journey

1. Browse a drop or category; filter by type, size, brand, condition, price, and availability where the actual catalog supports it.
2. Open a permanent product page: several real photos, brand, condition/flaws, tagged size, actual garment measurements or size chart, price in BDT, discount only when a real previous price exists, and delivery estimate/policy.
3. Select **Inside Dhaka — ৳80** or **Outside Dhaka — ৳130**. Show item price, shipping, and final total before payment.
4. Enter name, phone, full address, and optional email. Confirm the order, then continue to bKash-hosted payment.
5. Return to a status page that verifies payment on the server, then shows a reference and receipt details. A cancellation/failure releases the product only after payment status is safely reconciled.
6. A paid item remains on its URL with **Sold out** and no purchase action. Related available pieces offer a next step.

Admin scope for v1: use PocketBase's own dashboard to add, edit, unpublish, or remove products and upload images. Do **not** build a separate admin UI unless the dashboard proves insufficient. Prefer unpublish/archive to hard deletion of products referenced by orders.

## Architecture

- **SvelteKit:** server-rendered browse and product pages, checkout form action/server endpoints, bKash callback/status endpoints, accessible UI. Keep a server runtime; a static-only deployment cannot safely handle checkout.
- **PocketBase:** product photos and catalog records, order/payment records, private customer data. Version collection definitions in `pb_migrations`. Public rules may read published products only; client write rules stay closed. Use server-only privileged access for orders and a narrowly scoped, atomic reservation/finalization boundary. Never share a mutable authenticated PocketBase SDK instance across customer requests.
- **bKash PGW:** use the merchant product and version actually provisioned at onboarding. Server obtains/refreshes its token, creates payment for the server-calculated total, redirects to the bKash payment URL, then executes/queries payment according to that contract. Validate merchant invoice, amount, currency, payment ID, transaction ID, and final status server-side. The redirect query string is not proof of payment. No personal-wallet “send money” workaround.
- **Zod:** add for untrusted checkout input, environment configuration, and external payment responses if it keeps validation explicit. **Zustand: do not add now**; Svelte 5 state/context and SvelteKit `load`/form actions cover this scope without a React-oriented global store. Reconsider only if a concrete shared-client-state need appears.
- **Money:** store and calculate integer taka for the current whole-taka pricing; display `৳` and BDT consistently. Do not calculate totals from browser-provided prices or discounts.

PocketBase's own guidance says SSR meta-framework use needs care, especially around shared SDK auth state. The implementation should use server-only access with explicit request isolation or a deliberately unauthenticated read client, then test for cross-request leakage. PocketBase supports migrations and database transactions; use the transaction inside PocketBase for reservation state changes, not a read-then-write pair from the browser. [PocketBase usage](https://pocketbase.io/docs/how-to-use/) · [migrations](https://pocketbase.io/docs/js-migrations/) · [transactions](https://pocketbase.io/docs/js-database/)

## Proposed data and stock lifecycle

`products`: stable slug; title; category; brand; description; condition and flaws; tagged size; measurements/size-chart content; image files and alt text; `price_taka`; optional `old_price_taka` (must exceed current price); publication state; stock state (`available`, `reserved`, `sold`); reservation expiry/reference; timestamps. A discount badge is **derived** from valid old/current prices, not an independently editable flag that can disagree.

`orders`: opaque public reference; product and immutable item/price snapshot; shipping zone and fee snapshot; address/contact; total; lifecycle (`pending_payment`, `paid`, `cancelled`, `expired`, `payment_review`); reservation expiry; merchant invoice/payment/transaction IDs. Never expose all order fields through public PocketBase list/view rules.

**Invariant:** one product can belong to at most one live reservation or paid order. At checkout start, atomically change `available → reserved` and create the order. Only then create the bKash payment. A failed create releases the reservation if no payment can have occurred. Successful verified payment atomically changes `reserved → sold` and `pending_payment → paid`, idempotently. On callback timeout/ambiguity, query bKash before release; if status remains unknown, retain/reconcile the reservation rather than risk a second charge. Expired reservations release only after safe reconciliation. A late successful payment after expiry enters `payment_review` for refund/manual resolution, never silently sells a second time. Keep network calls **outside** the PocketBase DB transaction.

This is the highest-risk part of the project. The exact PocketBase transaction route/hook and bKash expiry behavior must be proven with sandbox tests before live use.

## Visual direction to explore with the user

Use the provided `static/brand/dathrift-logo.png` as the identity source. Its dark bottle green, warm ivory, and muted gold suggest a more editorial **curated wardrobe archive** than a discount marketplace. Do not simply put the square logo image in every header: prepare an appropriate cropped/transparent mark variant for small use while retaining the supplied original; check legibility and permission before altering the mark itself.

Candidate experience: a first viewport with one exceptionally photographed garment as the focus, a restrained archive index/drop marker, and sharp typographic contrast; product pages like a collector's garment record with tactile image sequence, measurement diagram, honest wear notes, and a highly legible purchase panel. Use typographic scale, asymmetry, negative space, and purposeful reveals rather than a generic card grid, neon sale badges, or decorative clutter. Keep product photos dominant and truthful. Motion must respect reduced-motion preferences.

Before UI code: apply **Impeccable** (`init`/`shape` and new-work direction selection) and **ui-ux-pro-max** to settle a direction and check responsive behavior, contrast, focus, forms, touch targets, loading, and sold-out states. The user should approve the art direction and real product content; do not fabricate inventory or claims. Verify desktop and mobile renders against the selected concept.

## SEO and performance

- Keep catalog and product pages server-rendered with descriptive, unique titles and descriptions; use stable human-readable product URLs, canonicals, Open Graph images, and a generated sitemap of published products.
- Output `Product`/`Offer` structured data from actual product values: BDT price, real brand/condition, and `InStock` or `SoldOut`. Do not invent ratings or reviews. Sold pages remain useful and accurately marked rather than becoming fake 404s.
- Exclude checkout, order status, customer data, and unpublished items from indexing. Keep `robots.txt` and sitemap aligned with this policy.
- Serve appropriately sized responsive product images, reserve their dimensions, lazy-load below the fold, and measure mobile Core Web Vitals.

SvelteKit documents default SSR, per-page metadata, and dynamic sitemaps as its SEO path. Google documents `SoldOut` availability for product structured data. [SvelteKit SEO](https://svelte.dev/docs/kit/seo) · [SvelteKit page options](https://svelte.dev/docs/kit/page-options) · [Google Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)

## Test-first implementation slices

For each slice: agree on the observable seam, write a failing test, implement the minimum to pass, then run the relevant suite. No broad test suite of imagined internals.

1. **Catalog and schema** → migration smoke test; public queries return published items, not drafts/private data; product page handles available and sold items.
2. **Pricing and checkout input** → unit tests for ৳80/৳130 and exact totals, discount validity, invalid phone/address/zone, server-side price recomputation.
3. **Exclusive reservation** → integration tests against real PocketBase for two simultaneous buyers; exactly one reservation wins; no two paid orders for one item.
4. **bKash sandbox adapter** → contract tests for token/create/execute/query responses, retries, duplicate callbacks, cancellation, mismatch and ambiguous outcomes; credentials only in server environment.
5. **Checkout journey** → Playwright test from browse to sandbox/mock payment and sold-out page; keyboard/mobile error states; no duplicate submission or stale-price charge.
6. **SEO/design** → rendered HTML metadata/JSON-LD/sitemap tests and desktop/mobile visual/accessibility checks. Check a sold item emits `SoldOut` and no purchase button.
7. **Release gate** → `bun run check`, `bun run lint`, unit/integration/e2e suites, production build, sandbox purchase/cancel/retry/race rehearsal, backup/restore test, and no-secret scan. Record actual results, not assumptions.

## Decisions needed before payment implementation

1. Do you already have bKash **online-business/PGW sandbox credentials**, and which checkout product/version did bKash enable? Their [business page](https://www.bkash.com/en/business) lists payment gateway and tokenized checkout as separate services. The public developer portal was not accessible during this planning pass, so request/response details must be confirmed against your merchant documentation before coding.
2. Is **guest, one-item checkout** correct for launch? If not, define cart behavior and how long unique pieces may be reserved.
3. Does “inside Dhaka” mean **Dhaka city only** or the entire Dhaka district? What are the return/refund, delivery timing, and customer-support policies we may state publicly?
4. Where will SvelteKit and PocketBase run, and what is the production domain? They need durable PocketBase storage/backups and a public HTTPS callback URL.
5. Provide a few actual product photos, descriptions, sizes, and condition notes before approving final design/copy; the logo alone cannot establish realistic merchandise layouts.

## Explicitly out of scope for v1

Accounts, loyalty points, wishlists, promo codes, multi-vendor selling, live chat, a custom admin panel, and a multi-item cart are not included without a new requirement. A launch site must not claim checkout works until bKash merchant access and sandbox proof exist.
