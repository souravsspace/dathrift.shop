<script lang="ts">
	import AdminHeader from '../../../lib/components/AdminHeader.svelte';
	import AdminPager from '../../../lib/components/AdminPager.svelte';
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
	const pageHref = (page: number) => {
		const parts = [
			data.query ? `q=${encodeURIComponent(data.query)}` : '',
			page > 1 ? `page=${page}` : ''
		].filter(Boolean);
		return parts.length ? `/admin/orders?${parts.join('&')}` : '/admin/orders';
	};
</script>

<svelte:head>
	<title>Orders — daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<AdminHeader current="orders" />
	<main class="admin-main">
		<div class="admin-intro">
			<div>
				<h1>Orders</h1>
				<p>Payment state comes only from bKash verification. Fulfillment never changes payment.</p>
			</div>
			<span class="admin-actor"
				>{data.actor === 'local-preview' ? 'Local preview' : data.actor}</span
			>
		</div>
		<section class="admin-panel desk-list" aria-labelledby="orders-title">
			<div class="desk-toolbar">
				<h2 id="orders-title">{data.query ? 'Matching orders' : 'Recent orders'}</h2>
				<form class="desk-search-form" method="GET" action="/admin/orders" role="search">
					<input
						class="desk-search"
						type="search"
						name="q"
						value={data.query}
						aria-label="Find an order"
						placeholder="Reference, buyer, phone, address or piece"
						maxlength="100"
					/>
					<button type="submit" class="desk-refresh">Search</button>
				</form>
			</div>
			{#if data.query}<p class="admin-hint">
					{data.total}
					{data.total === 1 ? 'order matches' : 'orders match'} “{data.query}”.
					<a class="admin-public-link" href="/admin/orders">Show all orders</a>
				</p>{/if}
			{#if data.items.length === 0}
				<p class="admin-list-state">{data.query ? 'No orders match.' : 'No orders yet.'}</p>
			{:else}
				<ul class="desk-rows">
					{#each data.items as order (order.id)}
						<li>
							<a
								class="desk-row order-row"
								href="/admin/orders/{order.id}"
								aria-label="Open order {order.reference}"
							>
								<span class="order-ref">{order.reference}</span>
								<span class="desk-row-text">
									<strong>{order.customer_name ?? 'Unknown buyer'}</strong>
									<small
										>{order.phone ?? ''}{order.area ? ` · ${order.area}` : ''} · {order.item_count}
										{order.item_count === 1 ? 'piece' : 'pieces'} · {order.created_at}{order.preview_only
											? ' · TEST ONLY'
											: ''}</small
									>
								</span>
								<span class="desk-row-price">{price(order.total_bdt)}</span>
								<span class="desk-row-state">
									<span class="desk-status order-status-{order.status}"
										>{statusLabel[order.status] ?? order.status}</span
									>
									{#if order.fulfillment_state}<span class="admin-chip"
											>{order.fulfillment_state}</span
										>{/if}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
			<AdminPager
				page={data.page}
				pageSize={data.page_size}
				total={data.total}
				label="Orders"
				href={pageHref}
			/>
		</section>
	</main>
</div>
