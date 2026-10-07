# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Bangladesh-based shoppers browsing one-of-a-kind pre-loved clothing; one owner and one moderator managing the catalog and orders.

## Product Purpose

Show the actual condition, fit and measurements of each unique garment, then let guests buy available pieces without a double sale.

## Operating Context

SvelteKit on Cloudflare Workers, D1 for product/order state, R2 for product photos, Cloudflare Access for staff, and manual bKash Send Money for checkout until merchant API access arrives (staff confirm each payment; the bKash PGW adapter stays sandbox-only). Delivery charges follow Steadfast Regular rates for all 64 districts. Local development may show unmistakably test-only fixtures.

## Capabilities and Constraints

- One sellable unit per product; cart addition never reserves stock.
- Published sold items remain readable; draft items stay private.
- Staff enter honest condition notes, measurements in half inches (the set each category requires: chest and length, waist and inseam, or none) and photo alt text. Staff manage categories and choose each piece's cover photo (up to ten photos).
- Bangladesh delivery areas and courier terms need owner approval before live claims.
- A browser payment redirect cannot mark an order paid.

## Brand Commitments

Use the supplied `static/brand/dathrift-logo.png`; its bottle green, ivory and muted gold are the brand colors and it is the favicon source. On 2026-10-07 the owner replaced the dark "swing tag" storefront with a light, photo-first shop: warm paper ground, white cards, logo ink for text and the one solid action, gold only for counts and accents, rust for sold and errors. Archivo and Martian Mono stay; the ivory swing tag survives only on the home hero, the error page and the footer rail. Shoppers get search, filters (size, price, fit in inches, available only) and a phone tab bar, since most of them shop on phones. Staff admin keeps the ivory ledger look. The owner chooses the featured home piece.

## Evidence on Hand

- `static/brand/dathrift-logo.png` is the identity source.
- `db/seed/local.sql` and `db/seed/assets/` are synthetic local fixtures, not real merchandise or product photography.
- Real product imagery, final customer policy and approved courier coverage are not yet supplied.

## Product Principles

1. Show the actual garment and its flaws before a purchase decision.
2. Make one-off availability authoritative on the server.
3. Keep test-only material visibly separate from live stock.
4. Never claim a payment or delivery promise without verification.

## Accessibility & Inclusion

Keyboard and mobile use, descriptive image alternatives, visible focus, readable contrast and reduced-motion support are required.
