<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
	const statusLabel: Record<string, string> = {
		pending_payment: 'Awaiting payment',
		paid: 'Paid (bKash verified)',
		payment_review: 'Needs owner review',
		cancelled: 'Closed',
		expired: 'Hold expired'
	};
</script>

<svelte:head>
	<title>Orders — dathrift</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<header class="admin-header">
		<a class="brand" href="/" aria-label="dathrift home">
			<img src="/brand/dathrift-logo.png" alt="" width="48" height="48" />
			<span>dathrift<span class="brand-period">.</span></span>
		</a>
		<nav class="admin-nav" aria-label="Staff navigation">
			<a href="/admin">Products</a><a href="/admin/orders" aria-current="page">Orders</a>
		</nav>
	</header>
	<main class="admin-main">
		<div class="admin-intro">
			<div>
				<p class="admin-eyebrow">Orders / Staff only</p>
				<h1>Orders</h1>
				<p>Payment state comes only from bKash verification. Fulfillment never changes payment.</p>
			</div>
			<span class="admin-actor"
				>{data.actor === 'local-preview' ? 'Local preview' : data.actor}</span
			>
		</div>
		<section class="admin-panel admin-list" aria-labelledby="orders-title">
			<div class="admin-panel-heading"><h2 id="orders-title">Recent orders</h2></div>
			{#if data.orders.length === 0}
				<p class="admin-list-state">No orders yet.</p>
			{:else}
				<ul>
					{#each data.orders as order (order.id)}
						<li data-status={order.status}>
							<div>
								<strong>{order.reference}</strong>
								<small
									>{order.item_count}
									{order.item_count === 1 ? 'piece' : 'pieces'} · {order.created_at}{order.preview_only
										? ' · TEST ONLY'
										: ''}</small
								>
							</div>
							<div class="admin-row-meta">
								<span>{price(order.total_bdt)}</span>
								<small
									>{statusLabel[order.status] ?? order.status}{order.fulfillment_state
										? ` · ${order.fulfillment_state}`
										: ''}</small
								>
								<a href="/admin/orders/{order.id}" aria-label="Open order {order.reference}"
									>Open ↗</a
								>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</main>
</div>
