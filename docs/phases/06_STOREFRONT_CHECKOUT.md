# Phase 6 — approved storefront, checkout and fulfillment

**Status:** not started. Do not build storefront UI before the owner approves a concrete visual concept and supplies real product content for launch.

## Design and experience gate

The owner selected an **editorial thrift archive** direction. Ground it in `static/brand/dathrift-logo.png` (dark bottle green, warm ivory, muted gold), not an invented identity or generic discount grid. Apply **Impeccable** (`init`/`shape`) and **ui-ux-pro-max** before UI work; present a concrete responsive concept for approval. Product photography and honest condition/fit details are primary. Check contrast, focus, touch targets, reduced motion, loading/empty/error/sold states and mobile usability. Clearly marked test-only fixtures may be used for development, never published as live merchandise.

## Customer and staff flows

Build responsive browse/product/cart/checkout/status pages on SvelteKit Workers. Public browse offers category, size, price and availability filters plus newest-first sorting, only where real published stock supports them. Defer full-text search and brand filtering. Product pages show 1–8 genuine photos, centimeter measurements, fit notes, condition/flaws and price; sold pages remain public with **Sold out** and no buy button. Multi-item checkout shows server-verified prices and one Bangladesh delivery charge before sending the buyer to bKash.

The status page reports provider-verified payment with a scoped reference; no customer data in public caches. Staff contact customers manually as needed; automated SMS/email is out of v1 scope. Protected admin operations include paid-order list/detail, fulfillment state and tracking entry. Both staff can fulfill; only the owner resolves ambiguous payments/refunds. No manual paid toggle. No order/fulfillment screens should be mistaken for payment proof.

## Test-first slices and exit gate

Red-test observable server-rendered product and cart states before components. Then test the guest journey in Playwright from a published fixture through multi-item cart, shipping, sandbox/mock bKash return, verified status and sold product page. Include keyboard/mobile error handling, stale price, sold-while-in-cart and duplicate submission. **Exit:** the approved concept works at desktop/mobile widths and the journey passes without a stale-price charge or double sale; real content/policy approval remains a separate release gate.
