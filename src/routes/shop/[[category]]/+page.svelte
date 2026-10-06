<script lang="ts">
	import Browse from '../../../lib/components/Browse.svelte';
	import SiteFooter from '../../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../../lib/components/SiteHeader.svelte';
	import { SITE_ORIGIN } from '../../../lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let label = $derived(data.categoryName ?? 'All pieces');
	let path = $derived(data.category ? `/shop/${data.category}` : '/shop');
	let hasTestPieces = $derived(data.products.some((product) => product.slug.startsWith('test-')));
</script>

<svelte:head>
	{#if data.category}
		<title>{label} — one-of-a-kind pre-loved {label.toLowerCase()} | daThriftShop</title>
		<meta
			name="description"
			content="Pre-loved {label.toLowerCase()} with honest condition notes and garment measurements. One of each."
		/>
	{:else}
		<title>Shop all pieces — one-of-a-kind pre-loved clothing | daThriftShop</title>
		<meta
			name="description"
			content="Browse every one-of-a-kind pre-loved piece: search by name or brand, filter by size, price and measurements in inches."
		/>
	{/if}
	<link rel="canonical" href="{SITE_ORIGIN}{path}" />
	{#if hasTestPieces}<meta name="robots" content="noindex, nofollow" />
	{:else if data.filtered}<meta name="robots" content="noindex, follow" />{/if}
</svelte:head>

<SiteHeader preview={hasTestPieces} current="shop" />

<main id="main-content">
	<Browse
		action={path}
		title={label}
		products={data.products}
		total={data.total}
		page={data.page}
		facets={data.facets}
		filters={data.filters}
		current={data.category ?? undefined}
	/>
</main>

<SiteFooter />
