# Phase 3 — guest cart, validation and server pricing

**Status:** local code complete; exit gate open. Remote D1 integration and the owner's exact delivery-area list and Steadfast terms remain prerequisites.

Local evidence (2026-10-06): ID-only bag, server repricing, maintained delivery areas listed from D1 at checkout (TEST ONLY areas appear only in development builds), one delivery charge per order, and clear 409/422 errors for stale pieces and unsupported areas.

## Contract

The guest cart contains distinct product IDs with quantity fixed to one. Adding to cart never reserves stock. Browser storage never supplies authoritative prices, discounts, stock, shipping or total. Each cart read and checkout attempt rechecks published availability and current integer-BDT price on the server; stale/sold lines are identified for review.

Checkout accepts supported **Bangladesh** addresses only. Proposed customer delivery charges are **৳80** for eligible Dhaka-city areas and **৳130** for other supported areas, once per order. **Steadfast is the intended courier:** its [coverage page](https://www.steadfast.com.bd/coverage) lists all districts/upazilas, but its [terms](https://steadfast.com.bd/terms-and-condition) allow special treatment for remote off-grid locations and its [rates](https://steadfast.com.bd/pricing) vary by route, parcel size/weight and merchant agreement. These customer charges are not automatically the courier's actual bill. The owner must confirm the eligible Dhaka-city list, pickup/merchant terms, off-grid policy and who absorbs any difference before this phase can close. Never accept a cheaper self-declared zone. Show item subtotal, shipping and exact BDT total before payment; no discounts in v1.

## Test-first slices and exit gate

1. Red-test deduplication/quantity-one cart behavior and sold/unpublished/stale lines; implement the smallest ID-only cart state.
2. Red-test server repricing after an admin price change, integer arithmetic and one shipping fee for multi-item orders; implement pure total calculation and Worker validation.
3. Red-test unsupported areas and invalid phone/address input, including a claimed Dhaka zone for an ineligible area; implement maintained-list lookup and clear errors.

**Exit:** the server owns every total and rejects stale or unsupported choices; cart operations create no reservation or payment. Record exact tests run. No launch claim until actual area list and delivery policy are approved.
