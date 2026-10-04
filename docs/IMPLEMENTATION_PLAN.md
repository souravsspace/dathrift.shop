# dathrift.shop — implementation plan

## Verified implementation status (2026-10-05)

| Phase                       | Status          | Evidence and remaining gate                                                                                                                                                                                                                                                 |
| --------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Starter                  | Complete        | Svelte type-check and Vitest server/browser tests passed after the starter fixes.                                                                                                                                                                                           |
| 1. Durable deployment spike | **Incomplete**  | Local PocketBase mounted-volume restart/restore and local Worker preview passed. Remote authenticated HTTPS or private Worker-to-PocketBase access, remote admin protection, and off-host backup/recovery have **not** been proven. No production deployment is authorized. |
| 2. Catalog and schema       | **In progress** | Initial products and description migrations passed a disposable real-PocketBase public-access test. Product detail behavior, remaining merchandising fields, and Worker catalog reads remain unproven.                                                                      |
| 3–8                         | Not started     | No cart, reservation, payment, storefront, SEO, or release gate is complete.                                                                                                                                                                                                |

The application, test, and supported tool configuration sources use TypeScript (`.ts` and `<script lang="ts">`); `tsconfig.json` replaces `jsconfig.json`. PocketBase migration files are an intentional `.js` exception because PocketBase executes JavaScript migrations directly. Generated Worker output is JavaScript and is not source. This conversion changes no storefront visual direction.

**Next local-only slice:** prove one server-side product read through a Worker route, including a published product and a draft/absent product, without building storefront UI or exposing privileged PocketBase credentials. Keep the Phase 1 gate open while the owner chooses the persistent host, region, domain, and acceptable off-host recovery target. Do not start UI until visual direction and real product content are approved.

## Product thesis and launch scope

A carefully edited thrift drop, not a generic endless catalog. Each product is a photographed, measured, one-off piece with one sellable unit. The site should make condition and fit clear, make price and delivery transparent, and preserve an item's page after sale with an unmistakable **Sold out** state.

**Confirmed launch scope:** guest checkout with a multi-item cart; English-first product content, with Bangla added only when human-reviewed translations exist. Every cart line is a different physical item with quantity fixed to one. Adding to a cart does **not** reserve stock.

## Customer journey

1. Browse a drop or category; filter by type, size, brand, condition, price, and availability where the actual catalog supports it.
2. Open a permanent product page: several real photos, brand, condition/flaws, tagged size, actual garment measurements or size chart, price in BDT, discount only when a real previous price exists, and delivery estimate/policy.
3. Add one or more distinct items to a guest cart. Recheck availability and current prices on every cart view and at checkout; clearly identify any item sold since it was added.
4. Choose a delivery area: **Dhaka city — ৳80** or **outside Dhaka city — ৳130**. This is one shipping charge per order, not per item. Calculate the zone from a maintained area list rather than trusting a cheaper self-declared option. Show each item, shipping, and final BDT total before payment.
5. Enter name, phone, full address, and optional email. Atomically reserve **every** item; if any is unavailable, create no payment, change no stock, and ask the buyer to review the cart. Otherwise continue to bKash-hosted payment.
6. Return to a status page that verifies payment on the server, then shows a reference and receipt details. A cancellation/failure releases all items only after payment status is safely reconciled.
7. Paid items remain on their URLs with **Sold out** and no purchase action. Related available pieces offer a next step.

Admin scope for v1: use PocketBase's own dashboard to add, edit, unpublish, or remove products and upload images. Do **not** build a separate admin UI unless the dashboard proves insufficient. Prefer unpublish/archive to hard deletion of products referenced by orders.

## Architecture

- **SvelteKit on Cloudflare Workers:** use `@sveltejs/adapter-cloudflare` for server-rendered browse/product pages, checkout actions/endpoints, bKash callback/status endpoints, and static assets. Pin Wrangler compatibility settings and validate the Worker runtime locally and in preview; do not deploy as a static-only site. Use Worker runtime secret bindings, not client/public environment variables, for merchant credentials. [Cloudflare SvelteKit guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/sveltekit/)
- **PocketBase in Docker on a persistent host:** this is the user's chosen production path after reviewing Cloudflare Container storage. Pin the PocketBase version/image; mount `pb_data` on a durable volume; keep one writable PocketBase instance; version collection definitions in `pb_migrations`; use R2-compatible object storage for product files and a separate backup destination; rehearse restore. Public rules may read published products only; client write rules stay closed. Admin access needs both PocketBase authentication and network/access protection. Never share a mutable authenticated SDK instance across Worker requests. [PocketBase production guidance](https://pocketbase.io/docs/going-to-production/) · [file storage](https://pocketbase.io/docs/files-handling/)
- **Worker-to-PocketBase path:** the browser talks to the Worker for catalog and checkout, not to privileged PocketBase APIs. The Worker reaches PocketBase over an authenticated HTTPS origin or a private Cloudflare networking option proven in a deployment spike. Do not assume Cloudflare service bindings directly address an external Docker host. Product images may be delivered from a cacheable R2/custom-domain path after access and SEO checks.
- **bKash PGW:** use the merchant product and version actually provisioned at onboarding. Server obtains/refreshes its token, creates payment for the server-calculated total, redirects to the bKash payment URL, then executes/queries payment according to that contract. Validate merchant invoice, amount, currency, payment ID, transaction ID, and final status server-side. The redirect query string is not proof of payment. No personal-wallet “send money” workaround.
- **Zod:** add for untrusted checkout input, environment configuration, and external payment responses if it keeps validation explicit. **Zustand: do not add now**; Svelte 5 state/context and SvelteKit `load`/form actions cover the guest cart without a React-oriented global store. Keep only product IDs in client cart storage; the server owns prices, stock and totals.
- **Money:** store and calculate integer taka for the current whole-taka pricing; display `৳` and BDT consistently. Do not calculate totals from browser-provided prices or discounts.

PocketBase's own guidance says SSR meta-framework use needs care, especially around shared SDK auth state. The implementation should use server-only access with explicit request isolation or a deliberately unauthenticated read client, then test for cross-request leakage. PocketBase supports migrations and database transactions; use the transaction inside PocketBase for reservation state changes, not a read-then-write pair from the browser. [PocketBase usage](https://pocketbase.io/docs/how-to-use/) · [migrations](https://pocketbase.io/docs/js-migrations/) · [transactions](https://pocketbase.io/docs/js-database/)

### Why PocketBase is not on Cloudflare Containers for production

The original target was Dockerized PocketBase on Cloudflare Containers. Cloudflare documents that container disk is **ephemeral** on sleep/restart, and immutable snapshots are point-in-time, image-bound, and expire after 30 days; neither is a continuously durable SQLite primary volume. Cloudflare's R2 FUSE example explicitly lacks full POSIX filesystem semantics, so placing PocketBase's live SQLite database on that mount is not an acceptable payment-data plan. The Durable Object's own SQLite storage is persistent but is **not** a mounted SQLite file PocketBase can use unchanged. Thus a Docker image may be tested on Containers, but no live inventory/order/payment state may depend on its filesystem. The user chose a persistent Docker host for PocketBase and Workers for the web app. [Container FAQ](https://developers.cloudflare.com/containers/faq/) · [snapshots](https://developers.cloudflare.com/containers/guides/snapshots/) · [R2 FUSE example](https://developers.cloudflare.com/containers/examples/r2-fuse-mount/)

### Deployment and recovery proof

Before launch, produce `pocketbase/Dockerfile` (pinned version), local Docker Compose with a named or host-mounted persistent `pb_data` volume, a production deployment recipe for the chosen persistent host, Worker/Wrangler configuration, health checks, and separate development/staging/production secrets. Prefer a single PocketBase writer; do not horizontally duplicate a local SQLite DB. Back up PocketBase to a separate R2 bucket on a schedule, retain multiple restore points, monitor backup age/failures, and run a restore drill into an isolated environment. Define an acceptable recovery point/time with the owner; periodic backups alone do not guarantee zero lost orders. After any restore or uncertain outage, pause checkout and reconcile bKash transactions against orders before reopening. Never deploy or configure live Cloudflare/bKash accounts from the planning phase.

## Proposed data and stock lifecycle

`products`: stable slug; title; category; brand; description; condition and flaws; tagged size; measurements/size-chart content; image files and alt text; `price_taka`; optional `old_price_taka` (must exceed current price); publication state; stock state (`available`, `reserved`, `sold`); reservation expiry/reference; timestamps. A discount badge is **derived** from valid old/current prices, not an independently editable flag that can disagree.

`orders`: opaque public reference; line-item relations plus immutable product/price snapshots; one shipping-zone/fee snapshot; address/contact; total; lifecycle (`pending_payment`, `paid`, `cancelled`, `expired`, `payment_review`); reservation expiry; merchant invoice/payment/transaction IDs. Never expose all order fields through public PocketBase list/view rules. A guest order-status URL needs an unguessable, scoped token and must not reveal address/phone to other customers.

**Invariant:** one product can belong to at most one live reservation or paid order. Cart actions never reserve. At checkout start, deduplicate and sort product IDs, recalculate each current price, and atomically change **all** `available → reserved` while creating one order. If any item fails, roll back the whole operation and show the unavailable lines; never create a partial-charge order. Only after the transaction commits, create one bKash payment for the entire order. A failed create releases all reservations if no payment can have occurred. Successful verified payment atomically changes every `reserved → sold` and `pending_payment → paid`, idempotently. On callback timeout/ambiguity, query bKash before release; if status remains unknown, retain/reconcile the reservation rather than risk a second charge. Expired reservations release only after safe reconciliation. A late successful payment after expiry enters `payment_review` for refund/manual resolution, never silently sells an item twice. Keep network calls **outside** the PocketBase DB transaction.

This is the highest-risk part of the project. The exact PocketBase transaction route/hook and bKash expiry behavior must be proven with sandbox tests before live use.

## Visual direction to explore with the user

Use the provided `static/brand/dathrift-logo.png` as the identity source. Its dark bottle green, warm ivory, and muted gold suggest a more editorial **curated wardrobe archive** than a discount marketplace. Do not simply put the square logo image in every header: prepare an appropriate cropped/transparent mark variant for small use while retaining the supplied original; check legibility and permission before altering the mark itself.

Candidate experience: a first viewport with one exceptionally photographed garment as the focus, a restrained archive index/drop marker, and sharp typographic contrast; product pages like a collector's garment record with tactile image sequence, measurement diagram, honest wear notes, and a highly legible purchase panel. Use typographic scale, asymmetry, negative space, and purposeful reveals rather than a generic card grid, neon sale badges, or decorative clutter. Keep product photos dominant and truthful. Motion must respect reduced-motion preferences.

Before UI code: apply **Impeccable** (`init`/`shape` and new-work direction selection) and **ui-ux-pro-max** to settle a direction and check responsive behavior, contrast, focus, forms, touch targets, loading, and sold-out states. The user should approve the art direction and real product content; do not fabricate inventory or claims. Verify desktop and mobile renders against the selected concept.

## SEO is a launch feature, not a polish task

| Surface                                                                  | Indexing and content contract                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home, shop and real category pages                                       | SSR HTML with meaningful copy, crawlable links, one clear heading, unique title/description and canonical URL. Do not create empty SEO category pages.                                                                                                       |
| Product page                                                             | Permanent descriptive slug; unique title and human-written description using actual brand, measurements, condition, flaws and photos. Available and meaningfully detailed sold items return 200; sold markup says `SoldOut` and purchase controls disappear. |
| Cart, checkout, payment return, order status, search/filter combinations | No indexing; no customer data in metadata, JSON-LD or public caches. Keep query-param duplicates canonical to the unfiltered collection where appropriate.                                                                                                   |
| Unpublished/deleted product                                              | True 404 or 410, not an empty 200. A temporary PocketBase outage returns an error/503, never a fake empty shop that search engines could index.                                                                                                              |

- Build titles/descriptions, canonical URLs, Open Graph/Twitter cards, and image alt text from actual content. Do not generate keyword-stuffed or duplicate copy. English is the launch language; add `bn-BD` pages and reciprocal `hreflang` only after real Bangla translations exist.
- Generate `sitemap.xml` on the Worker from published, indexable URLs, with truthful `lastmod` for significant content changes; link it from `robots.txt`. Keep meaningful sold product pages discoverable. Avoid shipping drafts, admin, cart, checkout and order URLs in the sitemap.
- Emit valid `Product` + `Offer` JSON-LD on product pages with BDT price, actual brand if known, `UsedCondition`, and `InStock`/`SoldOut`; no invented reviews, GTINs or ratings. Add `OnlineStore`/organization and shipping/return policy markup only after the underlying policies are approved and accurately represent Dhaka-area rates. Rich-result eligibility is not a ranking or display guarantee. [Google merchant listing guidance](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) · [organization markup](https://developers.google.com/search/docs/appearance/structured-data/organization)
- `noindex` private/utility pages by response header or meta tag; protect truly private data with access control, not `robots.txt`. Do not robots-block a page whose `noindex` Google must read. [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- Serve responsive, correctly sized product photos, stable dimensions, descriptive filenames/alt text, and lazy loading below the fold. Keep the first product image high priority. Cache versioned assets aggressively, but do not cache checkout/payment responses and never rely on a cached stock label for purchase eligibility.
- Before launch, inspect server-rendered HTML with JavaScript disabled, validate JSON-LD using Google's Rich Results Test, submit the sitemap and inspect sample URLs in Search Console, check mobile Lighthouse/Core Web Vitals, and verify that a sold item updates both visible text and structured data. Re-check these after deployment, not only locally. [SvelteKit SEO](https://svelte.dev/docs/kit/seo) · [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

## Test-first implementation slices

For each slice: agree on the observable seam, write a failing test, implement the minimum to pass, then run the relevant suite. No broad test suite of imagined internals.

0. **Starter gate** → identify and repair the existing Svelte check and Vitest browser bind failures test-first; do not call the scaffold healthy until both pass.
1. **Durable deployment spike** → Docker/PocketBase mounted-volume restart test and isolated backup/restore test; Worker-to-origin HTTPS/private-access test; fail the project gate if data disappears or privileged routes are public.
2. **Catalog and schema** → migration smoke test; public queries return published items, not drafts/private data; product page handles available and sold items.
3. **Guest cart and pricing** → tests for distinct item IDs, stale/sold cart lines, whole-order ৳80/৳130 shipping, exact totals, discount validity, invalid phone/address/area, and server-side price recomputation. The cart stores IDs, never trusted prices.
4. **All-or-nothing reservation** → integration tests against real PocketBase for two simultaneous carts sharing an item; exactly one wins, no partial holds, no payment for a failed cart, no two paid orders for one item.
5. **bKash sandbox adapter** → contract tests against the merchant-supplied product/version documentation and sandbox for token/create/execute/query responses, retries, duplicate callbacks, cancellation, mismatch and ambiguous outcomes; credentials only in Worker secrets.
6. **Checkout journey** → Playwright test from browse through multi-item cart to sandbox/mock payment and sold-out pages; keyboard/mobile error states; no duplicate submission or stale-price charge.
7. **SEO/design** → rendered HTML metadata/canonical/JSON-LD/sitemap/robots/noindex tests; desktop/mobile visual and accessibility checks. Check a sold item emits `SoldOut`, keeps useful content, and has no purchase button.
8. **Release gate** → `bun run check`, `bun run lint`, unit/integration/e2e suites, Worker production build/preview, sandbox purchase/cancel/retry/race rehearsal, backup/restore test, no-secret scan, and post-deploy crawl/SEO smoke. Record actual results, not assumptions.

## Proposed customer policy — draft for owner and legal/operations approval

**Do not publish this draft as final terms yet.** Bangladesh's [Digital Commerce Operation Guidelines](https://mincom.gov.bd/pages/static-pages/694032dc35ce18e1c0563903) and applicable consumer rights should be checked against the final text by someone responsible for the business. The following is proposed customer-facing substance, not a legal conclusion:

> Every dathrift.shop piece is pre-loved and one of a kind. We photograph and describe its condition, including visible wear or flaws, and provide garment measurements so you can choose carefully. Each piece can be purchased only once. If an item becomes unavailable before your payment starts, we will ask you to review your cart rather than charge you for a substitute.
>
> Delivery costs **৳80 for eligible Dhaka city addresses** and **৳130 elsewhere in Bangladesh**, charged once per order. The eligible Dhaka city areas will be listed before checkout. Your full delivery charge and order total will be shown before you pay. We will confirm dispatch and provide tracking/contact details when available. **Dispatch and delivery timeframes: to be approved from the courier's actual service levels.**
>
> If we send the wrong item, an item arrives damaged in transit, or its condition materially differs from what we disclosed, contact **[approved support channel]** with your order reference and photos. We will review the issue and arrange the appropriate remedy under our final policy and applicable law. **Report window, change-of-mind/fit terms, return shipping responsibility, and refund timing: to be approved before launch.**

Approval checklist: exact Dhaka area list, courier/service coverage, delivery estimates, support address/phone, return-claim window and evidence, refund method/timing under bKash merchant terms, treatment of fit/change-of-mind for one-off used goods, and legal review. Do not add shipping/returns structured data until the public policy is final and consistent with checkout.

## Decisions needed before payment implementation

1. **Confirmed:** bKash PGW sandbox credentials and merchant documentation exist. The owner must provide the product/version and safe test credentials through a secret channel when implementation begins; do not paste secrets into Git or this plan. The public developer portal was not accessible during planning, so the merchant's contract is the source of truth. [bKash business options](https://www.bkash.com/en/business)
2. **Confirmed:** guest multi-item cart, English-first catalog, Workers web deployment, persistent Docker host for PocketBase, and Dhaka **city** as the ৳80 zone.
3. **Still needed:** which persistent Docker host/region and domain, exact Dhaka city delivery-area list/courier, bKash callback domain, acceptable backup recovery point/time, and approved support/returns/delivery policy.
4. **Still needed:** real product photos, descriptions, measurements, size data, condition notes, and logo usage approval before final visual direction/copy. The logo alone cannot establish realistic merchandise layouts.

## Explicitly out of scope for v1

Accounts, loyalty points, wishlists, promo codes, multi-vendor selling, live chat, and a custom admin panel are not included without a new requirement. Cloudflare Containers may be used only for a nonproduction PocketBase experiment until a safe primary-storage design is proven. A launch site must not claim checkout works until bKash sandbox proof and the durability/recovery gates pass.
