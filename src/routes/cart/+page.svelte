<script lang="ts">
	import { onMount } from 'svelte';
	import { readCartIds, removeCartId } from '../../lib/cart/browser-cart';

	type Quote = {
		items: { id: string; slug: string; name: string; price_bdt: number }[];
		unavailable: string[];
		subtotal_bdt: number | null;
	};

	let ids = $state<string[]>([]);
	let quote = $state<Quote | null>(null);
	let loading = $state(true);
	let failed = $state(false);
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;

	async function refresh(nextIds: string[]) {
		ids = nextIds;
		quote = null;
		failed = false;
		if (!ids.length) {
			loading = false;
			return;
		}
		loading = true;
		try {
			const response = await fetch('/api/cart/quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids })
			});
			if (!response.ok) throw new Error('Quote failed');
			quote = (await response.json()) as Quote;
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	}

	function remove(id: string) {
		void refresh(removeCartId(window.localStorage, id));
	}

	onMount(() => {
		void refresh(readCartIds(window.localStorage));
	});
</script>

<svelte:head>
	<title>Your bag | dathrift</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="storefront bag-page">
	<header class="site-header">
		<a class="brand" href="/" aria-label="dathrift home">
			<img src="/brand/dathrift-logo.png" alt="" width="52" height="52" />
			<span>dathrift<span class="brand-period">.</span></span>
		</a>
		<nav aria-label="Main navigation"><a href="/#shop">Keep exploring</a></nav>
	</header>
	<main id="main-content">
		<a class="bag-back" href="/#shop">← Back to the edit</a>
		<h1>Your bag</h1>
		<p class="bag-intro">
			One of each piece. Prices and availability are checked again from the shop.
		</p>
		{#if loading}
			<p role="status" class="bag-state">Checking your pieces…</p>
		{:else if failed}
			<div class="bag-state" role="alert">
				<p>Unable to refresh your bag right now. No stock has been held.</p>
				<button type="button" onclick={() => refresh(ids)}>Try again</button>
			</div>
		{:else if !ids.length}
			<div class="bag-state">
				<p>Your bag is empty.</p>
				<a href="/#shop">Explore the edit</a>
			</div>
		{:else if quote}
			<div class="bag-layout">
				<div class="bag-lines">
					{#each quote.items as item (item.id)}
						<div class="bag-line">
							<div>
								<a href="/products/{item.slug}">{item.name}</a>
								<p>One piece</p>
							</div>
							<div>
								<strong>{price(item.price_bdt)}</strong><button
									type="button"
									onclick={() => remove(item.id)}>Remove</button
								>
							</div>
						</div>
					{/each}
					{#each quote.unavailable as id (id)}
						<div class="bag-line unavailable-line">
							<div>
								<strong>Unavailable piece</strong>
								<p>{id} is no longer available. Remove it to continue.</p>
							</div>
							<button type="button" onclick={() => remove(id)}>Remove</button>
						</div>
					{/each}
				</div>
				<aside class="bag-summary" aria-label="Bag summary">
					<h2>Summary</h2>
					<div>
						<span>Item subtotal</span><strong
							>{quote.subtotal_bdt === null ? 'Review bag' : price(quote.subtotal_bdt)}</strong
						>
					</div>
					<p>Delivery is calculated only after an approved address is checked.</p>
					<p class="checkout-notice">Checkout is not available yet</p>
				</aside>
			</div>
		{/if}
	</main>
	<footer class="site-footer">
		<span>dathrift.</span><span>One piece. One next chapter.</span><a href="/#shop"
			>Back to the edit ↑</a
		>
	</footer>
</div>
