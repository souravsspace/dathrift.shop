<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { BAG_EVENT, readCartIds } from '../cart/browser-cart';
	import { formatBdt } from '../site';
	import Icon from './Icon.svelte';

	type Suggestion = {
		slug: string;
		name: string;
		category_name: string;
		price_bdt: number;
		size_label: string | null;
		stock_state: 'available' | 'reserved' | 'sold';
		photo_key: string | null;
		photo_alt: string | null;
	};

	let {
		preview = false,
		current
	}: { preview?: boolean; current?: 'home' | 'shop' | 'bag' | 'orders' } = $props();
	let count = $state(0);
	let sheet = $state<HTMLDialogElement>();
	let query = $state('');
	let results = $state<{ total: number; items: Suggestion[] } | null>(null);
	let searching = $state(false);
	let failed = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: AbortController | undefined;
	let bagLabel = $derived(count ? `Bag, ${count} ${count === 1 ? 'piece' : 'pieces'}` : 'Bag');

	onMount(() => {
		const refresh = () => (count = readCartIds(window.localStorage).length);
		refresh();
		window.addEventListener(BAG_EVENT, refresh);
		window.addEventListener('storage', refresh);
		return () => {
			window.removeEventListener(BAG_EVENT, refresh);
			window.removeEventListener('storage', refresh);
		};
	});

	// Following a result, or submitting the search, closes the sheet behind the new page.
	afterNavigate(() => sheet?.close());

	function openSearch(event: MouseEvent) {
		if (!sheet) return;
		event.preventDefault();
		sheet.showModal();
	}

	function suggest() {
		clearTimeout(timer);
		pending?.abort();
		const typed = query.trim();
		if (!typed) {
			results = null;
			searching = failed = false;
			return;
		}
		searching = true;
		timer = setTimeout(async () => {
			pending = new AbortController();
			try {
				const response = await fetch(`/api/search?q=${encodeURIComponent(typed)}`, {
					signal: pending.signal
				});
				if (!response.ok) throw new Error('Search failed');
				results = await response.json();
				failed = false;
			} catch (problem) {
				if ((problem as Error).name === 'AbortError') return;
				failed = true;
			}
			searching = false;
		}, 180);
	}

	function closeOnBackdrop(event: MouseEvent) {
		if (event.target === sheet) sheet?.close();
	}
</script>

<a class="skip-link" href="#main-content">Skip to content</a>
{#if preview}<div class="preview-strip">
		{import.meta.env.DEV ? 'Local preview · test pieces only' : 'Test pieces · not for sale'}
	</div>{/if}
<header class="site-header">
	<div class="bar">
		<a class="brand" href="/" aria-label="daThriftShop home">
			<img src="/brand/dathrift-logo.webp" alt="" width="40" height="40" />
			<span>daThriftShop</span>
		</a>
		<a class="search-field" href="/shop#browse" onclick={openSearch}>
			<Icon name="search" size={18} />
			<span>Search pieces, brands or piece IDs</span>
		</a>
		<nav class="header-nav" aria-label="Main navigation">
			<a href="/shop" aria-current={current === 'shop' ? 'page' : undefined}>
				<Icon name="layout-grid" size={18} />Shop
			</a>
			<a href="/orders" aria-current={current === 'orders' ? 'page' : undefined}>
				<Icon name="package" size={18} />Orders
			</a>
			<a
				class="bag-link"
				href="/cart"
				aria-current={current === 'bag' ? 'page' : undefined}
				aria-label={bagLabel}
			>
				<Icon name="shopping-bag" size={18} />
				<span>Bag</span>
				{#if count}<span class="count" aria-hidden="true">{count}</span>{/if}
			</a>
		</nav>
		<a class="search-icon" href="/shop#browse" onclick={openSearch} aria-label="Search the shop">
			<Icon name="search" size={22} />
		</a>
	</div>
</header>

<!-- Phones: the four places a shopper goes, in thumb reach. -->
<nav class="tabbar" aria-label="Shortcuts">
	<a href="/" aria-current={current === 'home' ? 'page' : undefined}>
		<Icon name="house" size={22} /><span>Home</span>
	</a>
	<a href="/shop" aria-current={current === 'shop' ? 'page' : undefined}>
		<Icon name="layout-grid" size={22} /><span>Shop</span>
	</a>
	<a href="/shop#browse" onclick={openSearch}>
		<Icon name="search" size={22} /><span>Search</span>
	</a>
	<a
		href="/cart"
		aria-current={current === 'bag' ? 'page' : undefined}
		aria-label={bagLabel}
		class="tab-bag"
	>
		<span class="tab-icon">
			<Icon name="shopping-bag" size={22} />
			{#if count}<span class="count" aria-hidden="true">{count}</span>{/if}
		</span>
		<span>Bag</span>
	</a>
</nav>

<dialog
	class="search-sheet"
	bind:this={sheet}
	aria-label="Search the shop"
	onclick={closeOnBackdrop}
	onclose={() => clearTimeout(timer)}
>
	<div class="sheet-inner">
		<form class="sheet-form" method="GET" action="/shop" role="search">
			<Icon name="search" size={20} />
			<input
				type="search"
				name="q"
				bind:value={query}
				oninput={suggest}
				aria-label="Search pieces, brands or piece IDs"
				placeholder="Search pieces, brands or piece IDs"
				autocomplete="off"
				enterkeyhint="search"
				maxlength="80"
			/>
			<button
				type="button"
				class="sheet-close"
				onclick={() => sheet?.close()}
				aria-label="Close search"
			>
				<Icon name="x" size={20} />
			</button>
		</form>

		<div class="sheet-body" aria-live="polite">
			{#if !query.trim()}
				<p class="sheet-hint">Type a piece name, a brand, or a piece ID like OC2026001.</p>
			{:else if failed}
				<p class="sheet-hint">Suggestions are unavailable. Press Enter to search the shop.</p>
			{:else if results && !results.items.length && !searching}
				<p class="sheet-hint">No pieces match “{query.trim()}”.</p>
			{:else if results}
				<ul class="suggestions">
					{#each results.items as item (item.slug)}
						<li>
							<a href="/products/{item.slug}">
								<span class="thumb">
									{#if item.photo_key}<img
											src="/media/{item.photo_key}"
											alt=""
											width="48"
											height="60"
											loading="lazy"
										/>{/if}
								</span>
								<span class="suggestion-text">
									<span class="suggestion-name">{item.name}</span>
									<span class="mono suggestion-meta"
										>{item.category_name}{#if item.size_label}
											· {item.size_label}{/if}</span
									>
								</span>
								<span class="suggestion-price">
									{#if item.stock_state !== 'available'}<span class="badge badge-sold">Sold</span>
									{:else}<span class="price">{formatBdt(item.price_bdt)}</span>{/if}
								</span>
							</a>
						</li>
					{/each}
				</ul>
				<a class="see-all" href="/shop?q={encodeURIComponent(query.trim())}">
					See all {results.total}
					{results.total === 1 ? 'result' : 'results'}
					<Icon name="arrow-right" size={18} />
				</a>
			{/if}
		</div>
	</div>
</dialog>

<style>
	.skip-link {
		position: absolute;
		top: -100px;
		left: 16px;
		z-index: 60;
		padding: 10px 14px;
		border-radius: 8px;
		background: var(--color-ink);
		color: var(--color-paper);
		font-weight: 700;
	}

	.skip-link:focus {
		top: 12px;
	}

	.preview-strip {
		padding: 7px 16px;
		background: var(--color-gold);
		color: var(--color-ink);
		font-family: var(--font-mono);
		font-size: var(--text-label);
		letter-spacing: 0.04em;
		text-align: center;
		text-transform: uppercase;
	}

	.site-header {
		position: sticky;
		top: 0;
		z-index: 40;
		border-bottom: 1px solid var(--line);
		background: rgb(250 247 241 / 0.92);
		backdrop-filter: saturate(1.4) blur(14px);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 16px;
		max-width: calc(var(--page-max) + 2 * var(--gutter));
		height: var(--header-h);
		margin: 0 auto;
		padding: 0 var(--gutter);
	}

	.brand {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 10px;
		font-size: var(--text-h3);
		font-stretch: 108%;
		font-weight: 800;
		letter-spacing: -0.03em;
		text-decoration: none;
	}

	.brand img {
		width: 38px;
		height: 38px;
		border-radius: var(--radius-sm);
	}

	.search-field {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 10px;
		max-width: 460px;
		min-height: 44px;
		margin: 0 auto;
		padding: 0 16px;
		border: 1.5px solid var(--line);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-ink-soft);
		font-size: var(--text-small);
		text-decoration: none;
		transition: border-color 200ms var(--ease-out);
	}

	.search-field:hover {
		border-color: var(--line-strong);
	}

	.search-field span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.header-nav a {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 14px;
		border-radius: 999px;
		font-size: var(--text-small);
		font-weight: 650;
		text-decoration: none;
		transition: background-color 200ms var(--ease-out);
	}

	.header-nav a:hover,
	.header-nav a[aria-current='page'] {
		background: rgb(4 36 26 / 0.06);
	}

	.count {
		display: grid;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		place-items: center;
		border-radius: 999px;
		background: var(--color-gold);
		color: var(--color-ink);
		font-family: var(--font-mono);
		font-size: var(--text-label);
		font-weight: 700;
		line-height: 1;
	}

	.search-icon {
		display: none;
		width: 44px;
		height: 44px;
		margin-left: auto;
		place-items: center;
		border-radius: 50%;
		color: var(--color-ink);
	}

	.tabbar {
		display: none;
	}

	/* The search sheet: a white panel over a dimmed page. */
	.search-sheet {
		width: min(640px, calc(100vw - 32px));
		max-width: none;
		max-height: min(640px, 80svh);
		margin: 10svh auto auto;
		padding: 0;
		border: 0;
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-ink);
		box-shadow: var(--lift);
	}

	.search-sheet::backdrop {
		background: rgb(4 36 26 / 0.42);
		backdrop-filter: blur(2px);
	}

	.search-sheet[open] {
		animation: sheet-in 220ms var(--ease-out);
	}

	@keyframes sheet-in {
		from {
			opacity: 0;
			translate: 0 -8px;
		}
	}

	.sheet-form {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 8px 8px 18px;
		border-bottom: 1px solid var(--line);
	}

	.sheet-form input {
		flex: 1;
		min-width: 0;
		min-height: 52px;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		font: inherit;
		font-size: var(--text-large);
		outline: none;
		box-shadow: none;
	}

	.sheet-form input::-webkit-search-cancel-button {
		display: none;
	}

	.sheet-close {
		display: grid;
		width: 44px;
		height: 44px;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: rgb(4 36 26 / 0.06);
		color: var(--color-ink);
		cursor: pointer;
	}

	.sheet-body {
		padding: 8px;
	}

	.sheet-hint {
		margin: 0;
		padding: 18px 12px 22px;
		color: var(--color-ink-soft);
		font-size: var(--text-small);
	}

	.suggestions {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.suggestions a {
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr) auto;
		align-items: center;
		gap: 14px;
		padding: 8px 10px;
		border-radius: var(--radius);
		text-decoration: none;
	}

	.suggestions a:hover,
	.suggestions a:focus-visible {
		background: rgb(4 36 26 / 0.05);
	}

	.thumb {
		display: block;
		width: 48px;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		border-radius: 6px;
		background: var(--color-well);
	}

	.thumb img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.suggestion-text {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	.suggestion-name {
		overflow: hidden;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.suggestion-meta {
		color: var(--color-ink-soft);
	}

	.see-all {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 48px;
		margin-top: 6px;
		border-top: 1px solid var(--line);
		font-size: var(--text-small);
		font-weight: 700;
		text-decoration: none;
	}

	@media (max-width: 960px) {
		.search-field span {
			display: none;
		}

		.search-field {
			flex: none;
			width: 44px;
			margin: 0 0 0 auto;
			padding: 0;
			justify-content: center;
			border-radius: 50%;
		}
	}

	@media (max-width: 760px) {
		.search-field,
		.header-nav {
			display: none;
		}

		.search-icon {
			display: grid;
		}

		.brand {
			font-size: var(--text-large);
		}

		.brand img {
			width: 34px;
			height: 34px;
		}

		.tabbar {
			position: fixed;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 45;
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			height: var(--tabbar-h);
			padding-bottom: env(safe-area-inset-bottom, 0px);
			border-top: 1px solid var(--line);
			background: color-mix(in srgb, var(--color-surface) 94%, transparent);
			backdrop-filter: saturate(1.4) blur(14px);
		}

		.tabbar a {
			position: relative;
			display: grid;
			align-content: center;
			justify-items: center;
			gap: 3px;
			color: var(--color-ink-soft);
			font-size: var(--text-meta);
			font-weight: 600;
			text-decoration: none;
		}

		.tabbar a[aria-current='page'] {
			color: var(--color-ink);
		}

		/* The current place wears a short gold rail on top, like the admin tabs. */
		.tabbar a[aria-current='page']::before {
			position: absolute;
			top: -1px;
			width: 28px;
			height: 3px;
			border-radius: 0 0 3px 3px;
			background: var(--color-gold);
			content: '';
		}

		.tab-icon {
			position: relative;
		}

		.tab-icon .count {
			position: absolute;
			top: -6px;
			right: -12px;
		}

		.search-sheet {
			width: 100vw;
			max-height: 100svh;
			height: 100svh;
			margin: 0;
			border-radius: 0;
		}

		.search-sheet[open] {
			animation: none;
		}
	}
</style>
