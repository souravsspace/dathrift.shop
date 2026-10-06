<script lang="ts">
	import { onMount } from 'svelte';
	import Icon, { type IconName } from '../../lib/components/Icon.svelte';
	import SiteFooter from '../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../lib/components/SiteHeader.svelte';
	import { readSavedOrders, type SavedOrder } from '../../lib/orders/device-orders';
	import { formatBdt as price } from '../../lib/site';

	let orders = $state<SavedOrder[] | null>(null);

	onMount(() => {
		orders = readSavedOrders(window.localStorage);
	});

	const statusLabel: Record<string, { label: string; icon: IconName }> = {
		pending_payment: { label: 'Waiting for payment', icon: 'clock' },
		paid: { label: 'Paid', icon: 'circle-check' },
		payment_review: { label: 'Payment being checked', icon: 'scan-search' },
		cancelled: { label: 'Closed', icon: 'circle-x' },
		expired: { label: 'Hold expired', icon: 'timer-off' }
	};

	const placed = (value: string) =>
		new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			timeZone: 'Asia/Dhaka'
		}).format(new Date(value));
</script>

<svelte:head>
	<title>Your orders | daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<SiteHeader current="orders" />

<main id="main-content" class="flow page">
	<header class="flow-head">
		<h1 class="page-title">Your orders</h1>
		<p class="lede">
			Orders placed from this device. They are saved only in this browser; clearing its data removes
			the list, but each order link keeps working.
		</p>
	</header>

	{#if orders && !orders.length}
		<div class="empty-state">
			<span class="empty-icon"><Icon name="package" size={26} /></span>
			<h2>No orders on this device yet.</h2>
			<p>When you pay for an order here, it appears in this list.</p>
			<a class="button button-ink" href="/shop"
				>Browse the shop <Icon name="arrow-right" size={18} /></a
			>
		</div>
	{:else if orders}
		<ul class="orders">
			{#each orders as order (order.token)}
				{@const status = statusLabel[order.status] ?? { label: order.status, icon: 'info' }}
				<li>
					<a class="order card" href="/orders/{order.token}">
						<span class="status-icon" data-status={order.status}
							><Icon name={status.icon} size={22} /></span
						>
						<span class="order-text">
							<strong>{order.reference ? `Order ${order.reference}` : 'Order'}</strong>
							<span class="order-status">{status.label} · {placed(order.created_at)}</span>
							<span class="order-items">{order.items.map((item) => item.name).join(', ')}</span>
						</span>
						<span class="order-total">
							<span class="price">{price(order.total_bdt)}</span>
							<Icon name="chevron-right" size={20} />
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<SiteFooter />

<style>
	.orders {
		display: grid;
		gap: 12px;
		max-width: 820px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.order {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 16px;
		padding: 16px 18px;
		text-decoration: none;
		transition: border-color 200ms var(--ease-out);
	}

	.order:hover {
		border-color: var(--line-strong);
	}

	.status-icon {
		display: grid;
		width: 46px;
		height: 46px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-ivory);
		color: var(--color-gold-deep);
	}

	.status-icon[data-status='paid'] {
		background: var(--color-bottle);
		color: var(--color-paper);
	}

	.status-icon[data-status='cancelled'],
	.status-icon[data-status='expired'] {
		background: rgb(166 61 38 / 0.1);
		color: var(--color-rust);
	}

	.order-text {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.order-text strong {
		font-size: var(--text-large);
		font-stretch: 85%;
		font-weight: 750;
	}

	.order-status {
		color: var(--color-ink-soft);
		font-size: var(--text-small);
	}

	.order-items {
		overflow: hidden;
		color: var(--color-ink-soft);
		font-size: var(--text-small);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.order-total {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: var(--text-large);
	}

	@media (max-width: 600px) {
		.order {
			grid-template-columns: auto minmax(0, 1fr);
			gap: 12px;
			padding: 14px;
		}

		.order-total {
			grid-column: 2;
		}

		.order-total :global(svg) {
			display: none;
		}
	}
</style>
