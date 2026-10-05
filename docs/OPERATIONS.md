# dathrift.shop — operations runbook (draft)

This runbook is a draft for the Phase 8 release gate. It has not been rehearsed against production, and nothing here authorizes a deployment or a live-account change.

## Roles

- **Owner:** the only person who may resolve held or ambiguous payments, record refunds, and manage staff Access membership.
- **Moderator:** equal product permissions with the owner and can record fulfillment. Cannot resolve payments.
- Neither role can mark a website order paid by hand. An order becomes `paid` only from a provider-verified bKash result.

## Order and payment states

| Order status      | Meaning                                                                      | Stock                         |
| ----------------- | ---------------------------------------------------------------------------- | ----------------------------- |
| `pending_payment` | Pieces held for 15 minutes while the buyer is at bKash                       | Held by this order            |
| `paid`            | bKash execute or query returned `Completed` with matching amount and invoice | Sold                          |
| `payment_review`  | Provider answer was missing, mismatched, or arrived after the hold expired   | Held if still held, else none |
| `cancelled`       | Payment failed or was cancelled, or the owner closed a review                | Released                      |
| `expired`         | Hold expired and bKash confirmed the payment was never executed              | Released                      |

Fulfillment (`preparing → dispatched → delivered`) is separate. It exists only for paid orders, only moves forward, and dispatch requires a tracking code.

## Daily checks

1. Open `/admin/orders` and look for **Needs owner review**. Resolve each one the same day.
2. For paid orders, record fulfillment and tracking as parcels move.
3. Confirm the latest backup alert e-mail or dashboard shows a fresh export (see Phase 1).

## Resolving a payment review (owner only)

1. Open the order. Note the payment ID and transaction ID, if one exists.
2. Press **Recheck with bKash**. This asks bKash again. If bKash reports `Completed` with the correct amount and invoice, and the pieces are still held by this order, the order becomes `paid` automatically.
3. If the recheck leaves the order in review:
   - Look up the payment ID in the bKash merchant portal.
   - **No completed charge:** tick "I checked bKash records" and press **Close order and release pieces**.
   - **Completed charge but the pieces were already released or sold** (late success): refund the buyer in the bKash portal for the full amount, keep the refund transaction ID, then close the order. Contact the buyer manually with the outcome.
4. Never close a review while a completed charge stands unrefunded.

## Incident response

- **Checkout misbehaving (wrong totals, double holds, provider errors):** set the Worker variable `PAYMENT_PROVIDER=off` (checkout disappears; browsing keeps working), then investigate. Re-enable only after the cause is fixed and verified.
- **D1 errors:** pages return 503 rather than an empty shop. Check the Cloudflare status page and D1 metrics before acting.
- **Suspected credential leak:** rotate the bKash app secret/password with bKash and the Cloudflare API token; delete the cached row in `payment_tokens` so a fresh token is granted.
- **Restore from backup:** follow the isolated restore drill in Phase 1. After any restore, keep checkout off and reconcile every order created after the backup point against bKash records before re-enabling.

## Rollback

1. Roll back the Worker to the previous deployment in the Cloudflare dashboard (`wrangler rollback` needs separate approval).
2. Migrations are forward-only. Before deploying a migration, take a D1 export and confirm a Time Travel restore point. If a migration must be undone, restore to an isolated database first and verify it.
3. After rollback, re-run the smoke checks below.

## Post-deploy smoke checks

- Home, a category page, an available product and a sold product render without JavaScript. The sold page shows **Sold out** and no purchase control.
- `robots.txt` and `sitemap.xml` load. The sitemap contains no `test-` pages.
- `/admin` from an anonymous browser is denied. An allowlisted staff login through Access succeeds.
- `/checkout/test-wallet` returns 404 in production.
- A forged `/checkout/callback?paymentID=…&status=success` does not change any order.
