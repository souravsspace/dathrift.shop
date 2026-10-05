<script lang="ts">
	import BrowseFilters from '../lib/components/BrowseFilters.svelte';
	import ProductGrid from '../lib/components/ProductGrid.svelte';
	import SiteFooter from '../lib/components/SiteFooter.svelte';
	import SiteHeader from '../lib/components/SiteHeader.svelte';
	import SwingTag from '../lib/components/SwingTag.svelte';
	import { hang } from '../lib/motion';
	import { SITE_ORIGIN, categoryLabels, formatBdt } from '../lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let hero = $derived(data.hero);
	let hasTestPieces = $derived(
		[...data.products, ...(hero ? [hero] : [])].some((product) => product.slug.startsWith('test-'))
	);
</script>

<svelte:head>
	<title>daThriftShop — one-of-a-kind pre-loved clothing</title>
	<meta
		name="description"
		content="Explore one-of-a-kind pre-loved clothing with honest condition notes and garment measurements."
	/>
	<link rel="canonical" href="{SITE_ORIGIN}/" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="daThriftShop — one-of-a-kind pre-loved clothing" />
	<meta property="og:url" content="{SITE_ORIGIN}/" />
	<meta property="og:image" content="{SITE_ORIGIN}/brand/dathrift-logo.png" />
	{#if hasTestPieces}<meta name="robots" content="noindex, nofollow" />
	{:else if data.filtered}<meta name="robots" content="noindex, follow" />{/if}
</svelte:head>

<SiteHeader preview={hasTestPieces} current="shop" />

<main id="main-content">
	<section class="hero" aria-labelledby="hero-title">
		<div class="hero-copy">
			<h1 id="hero-title">Every piece here is <span>one of one.</span></h1>
			<p>
				Pre-loved clothing, each piece tagged with its real measurements and every flaw we found.
				When it is gone, it is gone.
			</p>
			<div class="hero-actions">
				<a class="button button-gold" href="#shop">Shop the rack</a>
				{#if hero}<a
						class="button button-line"
						href="/products/{hero.slug}"
						aria-label="See the {hero.name}">See this piece</a
					>{/if}
			</div>
		</div>

		<div class="hero-piece">
			{#if hero}
				<a
					class="hero-photo"
					href="/products/{hero.slug}"
					tabindex="-1"
					style:view-transition-name="photo-{hero.slug}"
				>
					{#if hero.photo_key}
						<img
							src="/media/{hero.photo_key}"
							alt={hero.photo_alt ?? hero.name}
							width="1024"
							height="1280"
							fetchpriority="high"
						/>
					{/if}
				</a>
				<div class="hero-tag" {@attach hang}>
					<SwingTag size="hero">
						<p class="tag-meta">
							{categoryLabels[hero.category] ?? hero.category} · {hero.size_label ??
								'Size not listed'}
						</p>
						<p class="tag-price">{formatBdt(hero.price_bdt)}</p>
						<p class="tag-name">{hero.name}</p>
						<p class="tag-one">1 of 1</p>
					</SwingTag>
				</div>
				{#if hasTestPieces}<span class="test-note">Test only / local preview</span>{/if}
			{:else}
				<img class="hero-mark" src="/brand/dathrift-logo.webp" alt="" width="640" height="640" />
			{/if}
		</div>
	</section>

	<section class="rack-section" id="shop" aria-labelledby="shop-title">
		<div class="rack-heading">
			<h2 id="shop-title">The rack</h2>
			<p>{data.products.length} {data.products.length === 1 ? 'piece' : 'pieces'}, one of each</p>
		</div>
		<BrowseFilters
			action="/"
			categories={data.facets.categories}
			sizes={data.facets.sizes}
			filters={data.filters}
		/>
		<ProductGrid
			products={data.products}
			empty={data.filtered
				? 'No pieces match these filters.'
				: 'The rack is empty right now. Check back soon.'}
		/>
	</section>

	<section class="read-tag" aria-labelledby="read-tag-title">
		<div class="read-tag-copy">
			<h2 id="read-tag-title">Read the tag before it’s yours.</h2>
			<p>
				A second life deserves a clear first look. Every tag on the rack carries the same four
				facts, written before the piece goes live.
			</p>
		</div>
		<ol class="tag-legend">
			<li>
				<strong>Price</strong>
				<span>What the piece costs. Delivery is added once, after your address is checked.</span>
			</li>
			<li>
				<strong>Measurements</strong>
				<span>Measured on the garment in centimetres, not on a body or guessed from the label.</span
				>
			</li>
			<li>
				<strong>Condition</strong>
				<span>Every mark, fade and repair we found, written down and photographed.</span>
			</li>
			<li>
				<strong>One of one</strong>
				<span>No restocks. A sold piece keeps its page, stamped sold.</span>
			</li>
		</ol>
	</section>
</main>

<SiteFooter />
