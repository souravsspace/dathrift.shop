<script lang="ts">
	import { onMount } from 'svelte';
	import { BAG_EVENT, readCartIds, removeCartId } from '../../lib/cart/browser-cart';
	import SiteFooter from '../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../lib/components/SiteHeader.svelte';
	import Icon from '../../lib/components/Icon.svelte';
	import { formatBdt as price } from '../../lib/site';

	type Quote = {
		items: {
			id: string;
			slug: string;
			name: string;
			price_bdt: number;
			size_label?: string | null;
			photo_key?: string | null;
			photo_alt?: string | null;
		}[];
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
	<title>Your bag | daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<SiteHeader current="bag" />

<main id="main-content" class="flow page">
	<header class="flow-head">
		<div class="head-links">
			<a class="back-link" href="/shop"><Icon name="arrow-left" size={18} />Keep shopping</a>
			<a class="text-link" href="/orders"><Icon name="package" size={16} />Your orders</a>
		</div>
		<h1 class="page-title">Your bag</h1>
		<p class="lede">One of each piece. Prices and availability are checked again from the shop.</p>
	</header>
	{#if loading}
		<p role="status" class="hint">Checking your pieces…</p>
	{:else if failed}
		<div class="empty-state" role="alert">
			<span class="empty-icon"><Icon name="info" size={26} /></span>
			<p>Unable to refresh your bag right now. No stock has been held.</p>
			<button class="button button-outline" type="button" onclick={() => refresh(ids)}
				>Try again</button
			>
		</div>
	{:else if !ids.length}
		<div class="empty-state">
			<span class="empty-icon"><Icon name="shopping-bag" size={26} /></span>
			<h2>Your bag is empty.</h2>
			<p>Every piece is one of one. Add the ones you love before someone else does.</p>
			<a class="button button-ink" href="/shop"
				>Browse the shop <Icon name="arrow-right" size={18} /></a
			>
		</div>
	{:else if quote}
		<div class="flow-layout">
			<ul class="lines card">
				{#each quote.items as item (item.id)}
					<li class="line">
						<a class="thumb" href="/products/{item.slug}" tabindex="-1" aria-hidden="true">
							{#if item.photo_key}<img
									src="/media/{item.photo_key}"
									alt=""
									width="300"
									height="375"
									loading="lazy"
								/>{/if}
						</a>
						<div class="line-text">
							<a class="line-name" href="/products/{item.slug}">{item.name}</a>
							<p class="mono line-meta">
								{#if item.size_label}Size {item.size_label} ·{/if} 1 of 1
							</p>
							<p class="price line-price">{price(item.price_bdt)}</p>
						</div>
						<button
							class="remove"
							type="button"
							onclick={() => remove(item.id)}
							aria-label="Remove {item.name}"><Icon name="trash-2" size={18} /></button
						>
					</li>
				{/each}
				{#each quote.unavailable as id (id)}
					<li class="line unavailable">
						<span class="thumb thumb-gone"><Icon name="circle-x" size={22} /></span>
						<div class="line-text">
							<strong>Unavailable piece</strong>
							<p class="hint">{id} is no longer available. Remove it to continue.</p>
						</div>
						<button
							class="remove"
							type="button"
							onclick={() => remove(id)}
							aria-label="Remove unavailable piece"><Icon name="trash-2" size={18} /></button
						>
					</li>
				{/each}
			</ul>
			<aside class="summary card" aria-label="Bag summary">
				<h2>Summary</h2>
				<div class="summary-row">
					<span>Pieces</span><span>{quote.items.length}</span>
				</div>
				<div class="summary-row"><span>Delivery</span><span>At checkout</span></div>
				<div class="summary-row total">
					<span>Item subtotal</span><strong
						>{quote.subtotal_bdt === null ? 'Review bag' : price(quote.subtotal_bdt)}</strong
					>
				</div>
				{#if quote.subtotal_bdt !== null}<a class="button button-ink button-block" href="/checkout"
						>Continue to checkout <Icon name="arrow-right" size={18} /></a
					>{/if}
				<p class="summary-note"><Icon name="lock" size={16} />Nothing is held until you pay.</p>
				<p class="summary-note">
					<Icon name="truck" size={16} />Delivery is calculated only after an approved address is
					checked.
				</p>
			</aside>
		</div>
	{/if}
</main>

<SiteFooter />

<style>
	.head-links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px 16px;
	}

	.lines {
		margin: 0;
		padding: 0 clamp(16px, 2.6vw, 24px);
		list-style: none;
	}

	.line {
		display: grid;
		grid-template-columns: 88px minmax(0, 1fr) auto;
		align-items: center;
		gap: 16px;
		padding: 18px 0;
	}

	.line + .line {
		border-top: 1px solid var(--line);
	}

	.thumb {
		display: block;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		border-radius: var(--radius-sm);
		background: var(--color-well);
	}

	.thumb img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb-gone {
		display: grid;
		place-items: center;
		color: var(--color-rust);
	}

	.line-text {
		display: grid;
		gap: 4px;
		min-width: 0;
	}

	.line-name {
		font-weight: 650;
		line-height: 1.35;
		text-decoration: none;
	}

	.line-name:hover {
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.line-meta {
		margin: 0;
		color: var(--color-ink-soft);
	}

	.line-price {
		margin: 4px 0 0;
		font-size: var(--text-h3);
	}

	.remove {
		display: grid;
		width: 44px;
		height: 44px;
		place-items: center;
		border: 1.5px solid var(--line);
		border-radius: 50%;
		background: var(--color-surface);
		color: var(--color-ink-soft);
		cursor: pointer;
		transition:
			color 200ms var(--ease-out),
			border-color 200ms var(--ease-out);
	}

	.remove:hover {
		border-color: var(--color-rust);
		color: var(--color-rust);
	}

	@media (max-width: 600px) {
		.line {
			grid-template-columns: 72px minmax(0, 1fr) auto;
			gap: 12px;
		}
	}
</style>
