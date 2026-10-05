<script lang="ts">
	import BrowseFilters from '../../../lib/components/BrowseFilters.svelte';
	import ProductGrid from '../../../lib/components/ProductGrid.svelte';
	import { SITE_ORIGIN, categoryLabels } from '../../../lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let label = $derived(categoryLabels[data.category] ?? data.category);
	let hasTestPieces = $derived(data.products.some((product) => product.slug.startsWith('test-')));
</script>

<svelte:head>
	<title>{label} — one-of-a-kind pre-loved {label.toLowerCase()} | dathrift</title>
	<meta
		name="description"
		content="Pre-loved {label.toLowerCase()} with honest condition notes and garment measurements. One of each."
	/>
	<link rel="canonical" href="{SITE_ORIGIN}/shop/{data.category}" />
	{#if hasTestPieces}<meta name="robots" content="noindex, nofollow" />
	{:else if data.filtered}<meta name="robots" content="noindex, follow" />{/if}
</svelte:head>

<div class="storefront">
	{#if hasTestPieces}<div class="preview-strip">Local preview · test pieces only</div>{/if}
	<header class="site-header">
		<a class="brand" href="/" aria-label="dathrift home">
			<img src="/brand/dathrift-logo.png" alt="" width="52" height="52" />
			<span>dathrift<span class="brand-period">.</span></span>
		</a>
		<nav aria-label="Main navigation">
			<a href="/#shop">Shop the edit</a><a href="/cart">Bag</a>
		</nav>
	</header>
	<main id="main-content">
		<section class="shop-section" aria-labelledby="category-title">
			<div class="section-heading">
				<div>
					<h1 id="category-title">{label}</h1>
					<p>Individual finds. Honest details. Just one of each.</p>
				</div>
				<span>{data.products.length} {data.products.length === 1 ? 'piece' : 'pieces'}</span>
			</div>
			<BrowseFilters
				action="/shop/{data.category}"
				categories={data.facets.categories}
				sizes={data.facets.sizes}
				filters={data.filters}
				current={data.category}
			/>
			<ProductGrid products={data.products} empty="No pieces match these filters." />
		</section>
	</main>
	<footer class="site-footer">
		<span>dathrift.</span><span>One piece. One next chapter.</span><a href="#main-content"
			>Back to top ↑</a
		>
	</footer>
</div>
