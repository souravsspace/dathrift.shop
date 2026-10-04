# Phase 5 — bKash PGW sandbox and payment reconciliation

**Status:** not started. No live merchant or checkout changes are authorized. Use the merchant product/version actually provisioned; the owner's private sandbox documentation is the contract.

## Payment and order contract

Worker server code obtains/refreshes the token, creates one payment for the **server-calculated** total after successful reservation, redirects to bKash, then executes/queries status per merchant documentation. Validate invoice, amount, BDT currency, payment ID, transaction ID and final status server-side. A redirect query string, customer screenshot, moderator action, or manual dashboard toggle never marks an order paid. Credentials and tokens stay in Worker secrets, never browser bundles, Git or chat. No personal-wallet “send money” workaround.

An ambiguous callback/status holds the reservation for `payment_review`; do **not** auto-release one-off inventory while charge status is unknown. Only the owner resolves payment/refund cases after checking bKash records. Payment state and fulfillment state remain separate. A guest status URL uses an unguessable scoped token and reveals no other customer's address/phone.

## Test-first slices and exit gate

1. Red-test merchant-version token/create/execute/query responses using documented sandbox fixtures; implement a narrow server adapter with explicit response validation.
2. Red-test duplicate/reordered callbacks, browser redirect without verified payment, mismatched amount/currency/invoice/IDs, timeout and retries; implement idempotent reconciliation.
3. Rehearse sandbox success, cancel, failure and unknown states against the real sandbox. Prove reservation release only after safe cancellation/failure and owner-only review for unknown/late success.

**Exit:** recorded sandbox contract and end-to-end payment tests pass with no duplicate charge/sale. Do not use live credentials or enable production checkout without fresh explicit approval and the Phase 1/4 gates.
