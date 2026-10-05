<script lang="ts">
	import BrowseFilters from '../../../lib/components/BrowseFilters.svelte';
	import ProductGrid from '../../../lib/components/ProductGrid.svelte';
	import SiteFooter from '../../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../../lib/components/SiteHeader.svelte';
	import { SITE_ORIGIN, categoryLabels } from '../../../lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let label = $derived(categoryLabels[data.category] ?? data.category);
	let hasTestPieces = $derived(data.products.some((product) => product.slug.startsWith('test-')));
</script>

<svelte:head>
	<title>{label} — one-of-a-kind pre-loved {label.toLowerCase()} | daThriftShop</title>
	<meta
		name="description"
		content="Pre-loved {label.toLowerCase()} with honest condition notes and garment measurements. One of each."
	/>
	<link rel="canonical" href="{SITE_ORIGIN}/shop/{data.category}" />
	{#if hasTestPieces}<meta name="robots" content="noindex, nofollow" />
	{:else if data.filtered}<meta name="robots" content="noindex, follow" />{/if}
</svelte:head>

<SiteHeader preview={hasTestPieces} current="shop" />

<main id="main-content" class="rack-section">
	<div class="rack-heading">
		<h1 id="category-title">{label}</h1>
		<p>{data.products.length} {data.products.length === 1 ? 'piece' : 'pieces'}, one of each</p>
	</div>
	<BrowseFilters
		action="/shop/{data.category}"
		categories={data.facets.categories}
		sizes={data.facets.sizes}
		filters={data.filters}
		current={data.category}
	/>
	<ProductGrid products={data.products} empty="No pieces match these filters." />
</main>

<SiteFooter />
