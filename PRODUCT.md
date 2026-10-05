# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Bangladesh-based shoppers browsing one-of-a-kind pre-loved clothing; one owner and one moderator managing the catalog and orders.

## Product Purpose

Show the actual condition, fit and measurements of each unique garment, then let guests buy available pieces without a double sale.

## Operating Context

SvelteKit on Cloudflare Workers, D1 for product/order state, R2 for product photos, Cloudflare Access for staff, and bKash PGW for eventual checkout. Local development may show unmistakably test-only fixtures. Live payments and delivery terms remain gated.

## Capabilities and Constraints

- One sellable unit per product; cart addition never reserves stock.
- Published sold items remain readable; draft items stay private.
- Staff enter honest condition notes, measurements in half inches (the set each category requires: chest and length, waist and inseam, or none) and photo alt text. Staff manage categories and choose each piece's cover photo (up to ten photos).
- Bangladesh delivery areas and courier terms need owner approval before live claims.
- A browser payment redirect cannot mark an order paid.

## Brand Commitments

Use the supplied `static/brand/dathrift-logo.png`; its bottle green, ivory and muted gold are the brand colors and it is the favicon source. On 2026-10-06 the owner replaced the earlier editorial serif look with the "swing tag" world: each piece wears an ivory die-cut tag (price, size, measurements, flaws) on a deep green ground, condensed Archivo figures with Martian Mono tag data, spring-based tag motion, and a mobile-first two-column rack. The owner chooses the featured home piece.

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
