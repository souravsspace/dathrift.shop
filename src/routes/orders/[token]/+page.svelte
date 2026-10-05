<script lang="ts">
	import SiteFooter from '../../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../../lib/components/SiteHeader.svelte';
	import { formatBdt as price } from '../../../lib/site';
	import type { PageData } from './$types';

	type Status = PageData['order']['status'];
	let { data }: { data: PageData } = $props();
	let order = $derived(data.order);
	const statusCopy: Record<Status, { title: string; note: string }> = {
		pending_payment: {
			title: 'Waiting for payment',
			note: 'Your pieces are held briefly while bKash confirms payment. Nothing is charged until bKash confirms it.'
		},
		paid: {
			title: 'Payment confirmed by bKash',
			note: 'Thank you. We will contact you about dispatch.'
		},
		payment_review: {
			title: 'Payment being checked',
			note: 'We are holding your pieces while the shop checks this payment with bKash. Keep this link to follow the result.'
		},
		cancelled: {
			title: 'Order closed',
			note: 'This order is closed. No pieces are held for it.'
		},
		expired: {
			title: 'Hold expired',
			note: 'Payment was not confirmed in time, so the pieces were released.'
		}
	};
	const fulfillmentCopy: Record<string, string> = {
		preparing: 'Preparing your parcel',
		dispatched: 'Dispatched',
		delivered: 'Delivered'
	};
</script>

<svelte:head>
	<title>Order {order.reference} | daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<SiteHeader />

<main id="main-content" class="flow-main">
	<h1>Order {order.reference}</h1>
	<div class="order-card" data-status={order.status} role="status">
		<strong>{statusCopy[order.status].title}</strong>
		<p>{statusCopy[order.status].note}</p>
	</div>
	{#if order.preview_only}
		<p class="test-banner order-section">TEST ONLY order — no real delivery.</p>
	{/if}
	<div class="flow-layout order-section">
		<div>
			<section aria-labelledby="order-pieces">
				<h2 id="order-pieces">Pieces</h2>
				<ul class="order-items">
					{#each order.items as item (item.slug)}
						<li>
							<a href="/products/{item.slug}">{item.name}</a><span>{price(item.price_bdt)}</span>
						</li>
					{/each}
				</ul>
			</section>
			<section class="order-section" aria-labelledby="order-delivery">
				<h2 id="order-delivery">Delivery</h2>
				<p>{order.area} · Phone ending {order.phone_hint.slice(-3)}</p>
				{#if order.fulfillment}
					<p>
						<strong>{fulfillmentCopy[order.fulfillment.state] ?? order.fulfillment.state}</strong>
						{#if order.fulfillment.tracking_code}
							<br />{order.fulfillment.courier ?? 'Courier'} tracking:
							<code>{order.fulfillment.tracking_code}</code>
						{/if}
					</p>
				{/if}
			</section>
		</div>
		<aside class="receipt" aria-label="Order total">
			<h2>Total</h2>
			<div class="receipt-row"><span>Items</span><strong>{price(order.subtotal_bdt)}</strong></div>
			<div class="receipt-row">
				<span>Delivery, once</span><strong>{price(order.shipping_bdt)}</strong>
			</div>
			<div class="receipt-row total">
				<span>Total</span><strong>{price(order.total_bdt)}</strong>
			</div>
		</aside>
	</div>
	<p class="order-fine">Keep this page link private. It is the only way to view this order.</p>
</main>

<SiteFooter />
