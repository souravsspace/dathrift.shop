# Phase 4 — atomic one-off inventory reservation

**Status:** local code complete; exit gate open until the race is repeated on remote D1.

Local evidence (2026-10-06): migration `0008_order_lifecycle.sql` records which order holds each unit (`inventory.reserved_order_id`) and guards every order status transition with triggers; paid sells only that order's held units, close/expiry releases only its own holds, and a late provider success after release goes to `payment_review` without selling twice. Retried submissions reuse one order through `checkout_key`. Tests prove one winner among eight concurrent checkouts and an external sale racing a checkout, on SQLite and on the local workerd D1 engine (`workerd-race.spec.ts`). Expiry runs when checkout starts and when a pending status page is read; there is no scheduled sweep yet.

## Invariant and data lifecycle

One product can belong to at most one live reservation or paid order. At checkout start, deduplicate/sort product IDs, reprice from D1, and atomically change **all** `available → reserved` while creating one order with immutable product/price and shipping snapshots. If any line is unavailable, roll back the whole operation: no partial hold, order or payment. A browser cart never reserves.

Only after the reservation transaction commits may one bKash payment be created for the entire order. A failed create releases all items only when it is certain no payment can have occurred. Verified successful payment atomically changes every `reserved → sold` and order `pending_payment → paid`, idempotently. Expired/cancelled reservations release only after safe provider reconciliation. If a late success occurs after expiry, enter `payment_review` for owner resolution rather than selling an item twice. Network calls stay **outside** the D1 transaction.

External-sale marking uses the same stock guard: it may change only `available → sold` with actor/reason/timestamp. It cannot take a reserved or already sold item, and never creates/marks a website order paid. D1 `batch()` transactional behavior is a useful primitive, **not proof** that the complete conditional multi-item race is safe.

## Test-first slices and exit gate

1. Red-test two concurrent carts sharing one item against real D1; implement a conditional single-item reservation and prove exactly one winner.
2. Red-test a multi-item cart with one unavailable item; prove no item stays reserved and no order/payment is created. Add transactional constraints/rollback only as needed.
3. Red-test checkout versus an external-sale action, duplicate checkout, timeout/expiry and repeated payment confirmation; implement guarded idempotent transitions.

**Exit:** observed real-D1 race/rollback tests show no double sale, partial order or payment for a failed reservation, including retries and external sales. Keep checkout disabled if any ambiguity remains.
