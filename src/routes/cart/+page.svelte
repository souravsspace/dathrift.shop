<script lang="ts">
	import { onMount } from 'svelte';
	import { BAG_EVENT, readCartIds, removeCartId } from '../../lib/cart/browser-cart';
	import SiteFooter from '../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../lib/components/SiteHeader.svelte';
	import { formatBdt as price } from '../../lib/site';

	type Quote = {
		items: { id: string; slug: string; name: string; price_bdt: number }[];
		unavailable: string[];
		subtotal_bdt: number | null;
	};

	let ids = $state<string[]>([]);
	let quote = $state<Quote | null>(null);
	let loading = $state(true);
	let failed = $state(false);

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
		window.dispatchEvent(new Event(BAG_EVENT));
	}

	onMount(() => {
		void refresh(readCartIds(window.localStorage));
	});
</script>

<svelte:head>
	<title>Your bag | dathrift</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<SiteHeader current="bag" />

<main id="main-content" class="flow-main">
	<a class="flow-back" href="/#shop">Back to the rack</a>
	<h1>Your bag</h1>
	<p class="flow-intro">
		One of each piece. Prices and availability are checked again from the shop.
	</p>
	{#if loading}
		<p role="status" class="flow-state">Checking your pieces…</p>
	{:else if failed}
		<div class="flow-state" role="alert">
			<p>Unable to refresh your bag right now. No stock has been held.</p>
			<button class="button button-line" type="button" onclick={() => refresh(ids)}
				>Try again</button
			>
		</div>
	{:else if !ids.length}
		<div class="flow-state">
			<p>Your bag is empty.</p>
			<a class="button button-gold" href="/#shop">Shop the rack</a>
		</div>
	{:else if quote}
		<div class="flow-layout">
			<ul class="bag-lines">
				{#each quote.items as item (item.id)}
					<li class="bag-line">
						<div>
							<a href="/products/{item.slug}">{item.name}</a>
							<p>One of one</p>
						</div>
						<div class="bag-line-end">
							<span class="line-price">{price(item.price_bdt)}</span>
							<button class="text-button" type="button" onclick={() => remove(item.id)}
								>Remove</button
							>
						</div>
					</li>
				{/each}
				{#each quote.unavailable as id (id)}
					<li class="bag-line unavailable">
						<div>
							<strong>Unavailable piece</strong>
							<p>{id} is no longer available. Remove it to continue.</p>
						</div>
						<button class="text-button" type="button" onclick={() => remove(id)}>Remove</button>
					</li>
				{/each}
			</ul>
			<aside class="receipt" aria-label="Bag summary">
				<h2>Summary</h2>
				<div class="receipt-row total">
					<span>Item subtotal</span><strong
						>{quote.subtotal_bdt === null ? 'Review bag' : price(quote.subtotal_bdt)}</strong
					>
				</div>
				<p>Delivery is calculated only after an approved address is checked.</p>
				{#if quote.subtotal_bdt !== null}<a class="button button-ink" href="/checkout"
						>Continue to checkout</a
					>{/if}
				<p class="receipt-notice">Nothing is held until you pay.</p>
			</aside>
		</div>
	{/if}
</main>

<SiteFooter />
