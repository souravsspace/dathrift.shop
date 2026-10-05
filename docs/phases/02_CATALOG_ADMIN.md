# Phase 2 — dynamic clothing catalog and protected product admin

**Status:** local code complete; exit gate open. Historical PocketBase product migrations/public-access tests do not close this phase.

Local evidence (2026-10-06): staff can create drafts, edit details and centimeter measurements, upload 1–8 photos to private R2 with alt text, publish only complete garments, unpublish available pieces, record audited external sales, and correct a published slug (the old URL 308-redirects through `slug_redirects`). All queries use Drizzle; SQL triggers enforce stock rules. Remote D1/R2 and a real Cloudflare Access staff login are unproven.

## Product model and staff workflow

This is a one-off clothing shop, not a static catalog. Initial categories are tops, bottoms, outerwear and dresses; add accessories only when real stock exists. Each product has a stable slug, name, category, optional brand, price in integer BDT, description, condition/flaws, tagged size, category-specific measurements in **centimeters** (for example chest/length or waist/inseam), free-text fit note, and **1–8 ordered real photos with alt text**. Draft/published/sold presentation and server-owned available/reserved/sold stock must not be conflated. No previous price or discount badge in v1. A slug becomes permanent at first publication; correct a typo via redirect, never a broken public URL or draft leak.

The protected dashboard is planned for `admin.dathrift.shop`. Staff create a draft, upload/order/describe photos, preview, publish, edit, unpublish, or mark an available item sold externally. There is **no hard-delete action** in v1. External-sale marking atomically requires available stock and records actor, reason and time; it cannot mark a website order paid or steal a held item. Sold items stay on their URLs with **Sold out** and no buy action. R2 stores image objects; D1 stores ordered metadata/references. The product-image bucket and admin custom-domain route require specific approval before creation.

The one owner and one moderator use exact Google email allowlisting through Cloudflare Access plus independent Access MFA. Both have the same product permissions. Only the owner manages Access/staff membership outside the dashboard. The owner will put local values into ignored `.env.local`; deployed Access policies/Worker secrets must be configured separately. Every write requires server-side identity/authorization even on alternate URLs. Do not use Better Auth for this small team.

## Test-first slices and exit gate

1. Red-test a versioned D1 migration and product validation using clearly marked **test-only fixtures**; implement one field/behavior at a time. Fixtures must never be published as real inventory.
2. Red-test public catalog reads: only published products and safe fields are returned, drafts stay private, sold products remain readable, and missing/unpublished products return 404/410 rather than an empty 200.
3. Red-test staff create/edit/photo upload/preview/publish/unpublish and slug-redirect behavior. Require price, condition, description, relevant measurements, and photo/alt text before publishing; avoid orphaned image objects on failed writes.
4. Red-test identity denial for anonymous/non-allowlisted users and the audited external-sale versus checkout reservation race. No public product write or hard-delete path.

**Exit:** a staff-created item persists in D1/R2, appears in public catalog reads only after publication, and displays a durable sold state after a valid sale; private fields and drafts never leak. Full storefront UI waits for the concrete editorial-archive design approval. Real content must be owner-supplied before any live catalog launch.
