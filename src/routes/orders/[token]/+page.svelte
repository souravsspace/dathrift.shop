<script lang="ts">
	import SiteFooter from '../../../lib/components/SiteFooter.svelte';
	import Icon, { type IconName } from '../../../lib/components/Icon.svelte';
	import SiteHeader from '../../../lib/components/SiteHeader.svelte';
	import { saveOrder } from '../../../lib/orders/device-orders';
	import { onMount } from 'svelte';
	import { formatBdt as price } from '../../../lib/site';
	import type { PageData } from './$types';

	type Status = PageData['order']['status'];
	let { data }: { data: PageData } = $props();
	let order = $derived(data.order);

	// Each visit refreshes this device's copy, so the "Your orders" list shows the latest status.
	onMount(() => {
		if (!data.token) return;
		saveOrder(window.localStorage, {
			token: data.token,
			reference: order.reference,
			status: order.status,
			total_bdt: order.total_bdt,
			items: order.items.map((item) => ({ name: item.name, slug: item.slug })),
			created_at: order.created_at.includes('T')
				? order.created_at
				: `${order.created_at.replace(' ', 'T')}Z`
		});
	});
	const statusIcon: Record<Status, IconName> = {
		pending_payment: 'clock',
		paid: 'circle-check',
		payment_review: 'scan-search',
		cancelled: 'circle-x',
		expired: 'timer-off'
	};
	const steps = [
		{ state: 'preparing', label: 'Preparing', icon: 'package' },
		{ state: 'dispatched', label: 'Dispatched', icon: 'truck' },
		{ state: 'delivered', label: 'Delivered', icon: 'circle-check' }
	] as const;
	let reached = $derived(
		order.fulfillment ? steps.findIndex((step) => step.state === order.fulfillment?.state) : -1
	);
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

<main id="main-content" class="flow page">
	<header class="flow-head">
		<a class="back-link" href="/orders"><Icon name="arrow-left" size={18} />Your orders</a>
		<h1 class="page-title">Order {order.reference}</h1>
	</header>
	<div class="status card" data-status={order.status} role="status">
		<span class="status-icon"><Icon name={statusIcon[order.status]} size={26} /></span>
		<div>
			<strong>{statusCopy[order.status].title}</strong>
			<p>{statusCopy[order.status].note}</p>
		</div>
	</div>
	{#if order.preview_only}
		<p class="notice notice-test spaced">TEST ONLY order — no real delivery.</p>
	{/if}
	<div class="flow-layout spaced">
		<div class="details">
			{#if order.status === 'paid'}
				<section class="card block" aria-labelledby="order-progress">
					<h2 id="order-progress">Delivery progress</h2>
					<ol class="progress">
						{#each steps as step, index (step.state)}
							<li class:done={index <= reached}>
								<span class="progress-icon"><Icon name={step.icon} size={18} /></span>
								<span>{step.label}</span>
							</li>
						{/each}
					</ol>
					{#if order.fulfillment}
						<p class="current">
							<strong>{fulfillmentCopy[order.fulfillment.state] ?? order.fulfillment.state}</strong>
							{#if order.fulfillment.tracking_code}
								<br />{order.fulfillment.courier ?? 'Courier'} tracking:
								<code>{order.fulfillment.tracking_code}</code>
							{/if}
						</p>
					{:else}
						<p class="hint">We will contact you when your parcel is being prepared.</p>
					{/if}
				</section>
			{/if}
			<section class="card block" aria-labelledby="order-pieces">
				<h2 id="order-pieces">Pieces</h2>
				<ul class="items">
					{#each order.items as item (item.slug)}
						<li>
							<a href="/products/{item.slug}">{item.name}</a><span class="price"
								>{price(item.price_bdt)}</span
							>
						</li>
					{/each}
				</ul>
			</section>
			<section class="card block" aria-labelledby="order-delivery">
				<h2 id="order-delivery">Delivery</h2>
				<p class="delivery">
					<Icon name="map-pin" size={18} />{order.area} · Phone ending {order.phone_hint.slice(-3)}
				</p>
				{#if order.fulfillment && order.status !== 'paid'}
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
		<aside class="summary card" aria-label="Order total">
			<h2>Total</h2>
			<div class="summary-row"><span>Items</span><strong>{price(order.subtotal_bdt)}</strong></div>
			<div class="summary-row">
				<span>Delivery, once</span><strong>{price(order.shipping_bdt)}</strong>
			</div>
			<div class="summary-row total">
				<span>Total</span><strong>{price(order.total_bdt)}</strong>
			</div>
			<p class="summary-note">
				<Icon name="lock" size={16} />Keep this page link private. It is the only way to view this
				order. This device remembers it under Your orders.
			</p>
		</aside>
	</div>
</main>

<SiteFooter />

<style>
	.status {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		max-width: 760px;
		padding: clamp(18px, 3vw, 26px);
	}

	.status-icon {
		display: grid;
		flex: none;
		width: 52px;
		height: 52px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-ivory);
		color: var(--color-gold-deep);
	}

	[data-status='paid'] .status-icon {
		background: var(--color-bottle);
		color: var(--color-paper);
	}

	[data-status='cancelled'] .status-icon,
	[data-status='expired'] .status-icon {
		background: rgb(166 61 38 / 0.1);
		color: var(--color-rust);
	}

	.status strong {
		display: block;
		font-size: var(--text-h3);
		font-stretch: 85%;
		font-weight: 750;
		line-height: 1.2;
	}

	.status p {
		margin: 6px 0 0;
		color: var(--color-ink-soft);
		line-height: 1.55;
	}

	.spaced {
		margin-top: 24px;
	}

	.details {
		display: grid;
		gap: 16px;
	}

	.block {
		padding: clamp(18px, 3vw, 24px);
	}

	.block h2 {
		margin: 0 0 14px;
		font-size: var(--text-body);
		font-weight: 750;
	}

	.block p {
		margin: 0;
		line-height: 1.6;
	}

	.progress {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		margin: 0 0 16px;
		padding: 0;
		list-style: none;
	}

	.progress li {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding-top: 4px;
		border-top: 3px solid var(--line);
		color: var(--color-ink-soft);
		font-size: var(--text-small);
		font-weight: 600;
		text-align: center;
	}

	.progress li.done {
		border-color: var(--color-moss);
		color: var(--color-ink);
	}

	.progress-icon {
		display: grid;
		width: 36px;
		height: 36px;
		margin-top: 8px;
		place-items: center;
		border-radius: 50%;
		background: rgb(4 36 26 / 0.06);
	}

	.done .progress-icon {
		background: var(--color-moss);
		color: var(--color-paper);
	}

	.items {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.items li {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 0;
		border-top: 1px solid var(--line);
	}

	.items li:first-child {
		border-top: 0;
		padding-top: 0;
	}

	.items a {
		font-weight: 600;
		text-underline-offset: 4px;
	}

	.delivery {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	code {
		font-family: var(--font-mono);
		font-size: var(--text-meta);
	}
</style>
