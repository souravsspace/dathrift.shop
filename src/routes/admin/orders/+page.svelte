<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import AdminHeader from '../../../lib/components/AdminHeader.svelte';
	import AdminPager from '../../../lib/components/AdminPager.svelte';
	import { bangladeshTime } from '../../../lib/admin-time';
	import {
		ORDER_FILTERS,
		filterLabels,
		orderStage,
		stageLabels,
		type OrderFilter
	} from '../../../lib/order-stage';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
	let allCount = $derived(Object.values(data.counts).reduce((sum, count) => sum + count, 0));

	const href = (filter: OrderFilter | 'all', page = 1, query = data.query) => {
		const parts = [
			query.trim() ? `q=${encodeURIComponent(query)}` : '',
			filter !== 'all' ? `status=${filter}` : '',
			page > 1 ? `page=${page}` : ''
		].filter(Boolean);
		return parts.length ? `/admin/orders?${parts.join('&')}` : '/admin/orders';
	};

	// Results follow the typing after a short pause; the Search button still submits at once.
	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let searchBox = $state<HTMLInputElement>();
	// Seeded for the server render; the effect below keeps it in step afterwards.
	let typed = $state(untrack(() => data.query));
	// Follow the URL (tabs, Clear search) without overwriting what staff are typing right now.
	$effect(() => {
		const query = data.query;
		if (document.activeElement !== searchBox) typed = query;
	});
	function searchAsYouType() {
		const query = typed;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(
			() => goto(href(data.filter, 1, query), { replace: true, reset: false }),
			300
		);
	}
</script>

<svelte:head>
	<title>Orders — daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<AdminHeader current="orders" />
	<main class="admin-main">
		<header class="admin-head">
			<h1>Orders</h1>
			<p class="admin-head-meta">
				<span>Payment state comes only from bKash. Fulfillment never changes payment.</span>
				{#if data.actor !== 'local-preview'}<span class="admin-actor">{data.actor}</span>{/if}
			</p>
		</header>
		<section class="admin-panel desk-list" aria-labelledby="orders-title">
			<div class="desk-toolbar">
				<h2 id="orders-title">{data.query ? 'Matching orders' : 'Recent orders'}</h2>
				<form class="desk-search-form" method="GET" action="/admin/orders" role="search">
					{#if data.filter !== 'all'}<input type="hidden" name="status" value={data.filter} />{/if}
					<input
						class="desk-search"
						type="search"
						name="q"
						bind:this={searchBox}
						bind:value={typed}
						oninput={searchAsYouType}
						aria-label="Find an order"
						placeholder="Reference, buyer, phone, address or piece"
						maxlength="100"
					/>
					<button type="submit" class="desk-refresh">Search</button>
				</form>
			</div>
			<nav class="desk-filters" aria-label="Show orders">
				<a href={href('all')} aria-current={data.filter === 'all' ? 'page' : undefined}
					>All <span>{allCount}</span></a
				>
				{#each ORDER_FILTERS as key (key)}
					<a href={href(key)} aria-current={data.filter === key ? 'page' : undefined}
						>{filterLabels[key]} <span>{data.counts[key]}</span></a
					>
				{/each}
			</nav>
			{#if data.query}<p class="admin-hint">
					{data.total}
					{data.total === 1 ? 'order matches' : 'orders match'} “{data.query}”.
					<a class="admin-public-link" href={href(data.filter)}>Clear search</a>
				</p>{/if}
			{#if data.items.length === 0}
				<p class="admin-list-state">
					{data.query || data.filter !== 'all' ? 'No orders match.' : 'No orders yet.'}
				</p>
			{:else}
				<ul class="desk-rows">
					{#each data.items as order (order.id)}
						{@const stage = orderStage(order.status, order.fulfillment_state)}
						<li>
							<a
								class="order-row"
								href="/admin/orders/{order.id}"
								aria-label="Open order {order.reference}"
							>
								<span class="order-row-buyer">
									<strong>{order.customer_name ?? 'Unknown buyer'}</strong>
									<small
										>{order.reference}{order.area ? ` · ${order.area}` : ''} · {order.item_count}
										{order.item_count === 1 ? 'piece' : 'pieces'}</small
									>
								</span>
								<span class="order-row-time">{bangladeshTime(order.created_at)}</span>
								<span class="order-row-stage"
									><span class="desk-status order-stage-{stage}">{stageLabels[stage]}</span></span
								>
								<span class="order-row-total">{price(order.total_bdt)}</span>
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
				href={(page) => href(data.filter, page)}
			/>
		</section>
	</main>
</div>
