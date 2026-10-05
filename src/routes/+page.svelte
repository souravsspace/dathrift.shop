<script lang="ts">
	import BrowseFilters from '../lib/components/BrowseFilters.svelte';
	import ProductGrid from '../lib/components/ProductGrid.svelte';
	import { SITE_ORIGIN } from '../lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let hasTestPieces = $derived(data.products.some((product) => product.slug.startsWith('test-')));
</script>

<svelte:head>
	<title>dathrift — one-of-a-kind pre-loved clothing</title>
	<meta
		name="description"
		content="Explore one-of-a-kind pre-loved clothing with honest condition notes and garment measurements."
	/>
	<link rel="canonical" href="{SITE_ORIGIN}/" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="dathrift — one-of-a-kind pre-loved clothing" />
	<meta property="og:url" content="{SITE_ORIGIN}/" />
	<meta property="og:image" content="{SITE_ORIGIN}/brand/dathrift-logo.png" />
	{#if hasTestPieces}<meta name="robots" content="noindex, nofollow" />
	{:else if data.filtered}<meta name="robots" content="noindex, follow" />{/if}
</svelte:head>

<div class="storefront">
	{#if hasTestPieces}
		<div class="preview-strip">Local preview · test pieces only</div>
	{/if}
	<header class="site-header">
		<a class="brand" href="/" aria-label="dathrift home">
			<img src="/brand/dathrift-logo.png" alt="" width="52" height="52" />
			<span>dathrift<span class="brand-period">.</span></span>
		</a>
		<nav aria-label="Main navigation">
			<a href="#shop">Shop the edit</a>
			<a href="#our-approach">Our approach</a>
		</nav>
	</header>

	<main id="main-content">
		<section class="hero" aria-labelledby="hero-title">
			<div class="hero-copy">
				<h1 id="hero-title">One of a kind.<br /><em>Found again.</em></h1>
				<p>
					Pre-loved clothing, picked piece by piece. Every mark, measurement, and detail belongs to
					its story.
				</p>
				<a class="hero-link" href="#shop">Explore the edit <span aria-hidden="true">↗</span></a>
				<span class="hero-index">Clothing with a past. Room for what’s next.</span>
			</div>
			<div class="hero-visual">
				{#if hasTestPieces}
					<img
						src="/media/test-only/cream-dress.webp"
						alt="Generated test-only visual of a cream midi dress on a hanger"
						width="1024"
						height="1280"
						fetchpriority="high"
					/>
					<span class="image-note">TEST ONLY / LOCAL PREVIEW</span>
				{:else}
					<div class="hero-mark" aria-hidden="true">
						<img src="/brand/dathrift-logo.png" alt="" width="320" height="320" />
					</div>
				{/if}
			</div>
		</section>

		<section class="shop-section" id="shop" aria-labelledby="shop-title">
			<div class="section-heading">
				<div>
					<h2 id="shop-title">The current edit</h2>
					<p>Individual finds. Honest details. Just one of each.</p>
				</div>
				<span>{data.products.length} {data.products.length === 1 ? 'piece' : 'pieces'}</span>
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
					: 'No pieces in the edit right now. Check back soon.'}
			/>
		</section>

		<section class="approach" id="our-approach" aria-labelledby="approach-title">
			<div class="approach-symbol" aria-hidden="true">✳</div>
			<div>
				<h2 id="approach-title">Know the piece<br /><em>before it’s yours.</em></h2>
				<p>
					A second life deserves a clear first look. Each listing describes its condition, fit, and
					garment measurements, so you can decide with care.
				</p>
			</div>
		</section>
	</main>

	<footer class="site-footer">
		<span>dathrift.</span>
		<span>One piece. One next chapter.</span>
		<a href="#main-content">Back to top ↑</a>
	</footer>
</div>
