<script lang="ts">
	import Browse from '../../../lib/components/Browse.svelte';
	import SiteFooter from '../../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../../lib/components/SiteHeader.svelte';
	import { SITE_ORIGIN } from '../../../lib/site';
	import { collectionJsonLd } from '../../../lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let label = $derived(data.categoryName ?? 'All pieces');
	let path = $derived(data.category ? `/shop/${data.category}` : '/shop');
	let hasTestPieces = $derived(data.products.some((product) => product.slug.startsWith('test-')));
	let noun = $derived(data.categoryName?.toLowerCase());
	let title = $derived(
		noun
			? `Thrift ${noun} in Bangladesh — one-of-a-kind pre-loved ${noun} | daThriftShop`
			: 'Shop thrift clothing in Bangladesh — every pre-loved piece | daThriftShop'
	);
	let summary = $derived(
		noun
			? `Thrift ${noun} in Bangladesh: one-of-a-kind pre-loved ${noun} with honest condition notes and measurements in inches. Pay by bKash, delivered across the country.`
			: 'Browse every one-of-a-kind pre-loved piece at daThriftShop, a thrift clothing shop in Bangladesh: search by name or brand, filter by size, price and measurements in inches.'
	);
	// Split closing tag so the Svelte parser does not end this script block.
	let jsonLdTag = $derived(
		`<script type="application/ld+json">${collectionJsonLd({
			name: data.categoryName ?? 'Shop',
			path,
			description: summary,
			items: data.products
		})}</` + 'script>'
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={summary} />
	<link rel="canonical" href="{SITE_ORIGIN}{path}" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={summary} />
	<meta property="og:url" content="{SITE_ORIGIN}{path}" />
	{#if data.products[0]?.photo_key}<meta
			property="og:image"
			content="{SITE_ORIGIN}/media/{data.products[0].photo_key}"
		/>{/if}
	<meta name="twitter:card" content="summary_large_image" />
	{#if hasTestPieces}<meta name="robots" content="noindex, nofollow" />
	{:else if data.filtered}<meta name="robots" content="noindex, follow" />{/if}
	{#if !data.filtered}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- escaped JSON-LD built from server data -->
		{@html jsonLdTag}
	{/if}
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
