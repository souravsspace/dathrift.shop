<script lang="ts">
	import type { PageData } from './$types';

	type Status = PageData['order']['status'];
	let { data }: { data: PageData } = $props();
	let order = $derived(data.order);
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
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
	<title>Order {order.reference} | dathrift</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="storefront bag-page order-page">
	<header class="site-header">
		<a class="brand" href="/" aria-label="dathrift home">
			<img src="/brand/dathrift-logo.png" alt="" width="52" height="52" />
			<span>dathrift<span class="brand-period">.</span></span>
		</a>
		<nav aria-label="Main navigation"><a href="/#shop">Shop the edit</a></nav>
	</header>
	<main id="main-content">
		<p class="checkout-eyebrow">Order status</p>
		<h1>Order {order.reference}</h1>
		<div class="order-status" data-status={order.status} role="status">
			<strong>{statusCopy[order.status].title}</strong>
			<p>{statusCopy[order.status].note}</p>
		</div>
		{#if order.preview_only}
			<p class="checkout-test-note">TEST ONLY order — no real delivery.</p>
		{/if}
		<div class="checkout-layout">
			<section class="order-detail" aria-labelledby="order-pieces">
				<h2 id="order-pieces">Pieces</h2>
				<ul class="order-items">
					{#each order.items as item (item.slug)}
						<li>
							<a href="/products/{item.slug}">{item.name}</a><span>{price(item.price_bdt)}</span>
						</li>
					{/each}
				</ul>
				<h2>Delivery</h2>
				<p>{order.area} · Phone ending {order.phone_hint.slice(-3)}</p>
				{#if order.fulfillment}
					<p class="order-fulfillment">
						<strong>{fulfillmentCopy[order.fulfillment.state] ?? order.fulfillment.state}</strong>
						{#if order.fulfillment.tracking_code}
							<span
								>{order.fulfillment.courier ?? 'Courier'} tracking:
								<code>{order.fulfillment.tracking_code}</code></span
							>
						{/if}
					</p>
				{/if}
			</section>
			<aside class="bag-summary checkout-summary" aria-label="Order total">
				<h2>Total</h2>
				<div><span>Items</span><strong>{price(order.subtotal_bdt)}</strong></div>
				<div><span>Delivery, once</span><strong>{price(order.shipping_bdt)}</strong></div>
				<div class="checkout-total">
					<span>Total</span><strong>{price(order.total_bdt)}</strong>
				</div>
			</aside>
		</div>
		<p class="order-private-note">
			Keep this page link private. It is the only way to view this order.
		</p>
	</main>
	<footer class="site-footer">
		<span>dathrift.</span><span>One piece. One next chapter.</span><a href="/#shop"
			>Back to the edit ↑</a
		>
	</footer>
</div>
