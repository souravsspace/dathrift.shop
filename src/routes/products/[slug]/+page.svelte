<script lang="ts">
	import type { PageData } from './$types';
	import { BAG_EVENT, addCartId, readCartIds } from '../../../lib/cart/browser-cart';
	import SiteFooter from '../../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../../lib/components/SiteHeader.svelte';
	import StatusStamp from '../../../lib/components/StatusStamp.svelte';
	import SwingTag from '../../../lib/components/SwingTag.svelte';
	import { productJsonLd } from '../../../lib/seo';
	import { SITE_ORIGIN, formatBdt } from '../../../lib/site';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();
	let added = $state(false);
	let inBag = $state(false);
	let activePhoto = $state(0);
	let track = $state<HTMLElement>();

	function showPhoto(index: number) {
		activePhoto = index;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		track?.scrollTo({ left: index * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
	}

	function syncPhoto() {
		if (!track?.clientWidth) return;
		activePhoto = Math.round(track.scrollLeft / track.clientWidth);
	}
	// Split closing tag so the Svelte parser does not end this script block.
	let jsonLdTag = $derived(
		`<script type="application/ld+json">${productJsonLd({ ...data.product, category: data.product.category_name })}</` +
			'script>'
	);
	let product = $derived(data.product);
	let testPiece = $derived(product.slug.startsWith('test-'));
	const labels: Record<string, string> = {
		chest_in: 'Chest',
		length_in: 'Length',
		waist_in: 'Waist',
		inseam_in: 'Inseam'
	};

	onMount(() => {
		inBag = readCartIds(window.localStorage).includes(product.id);
	});

	function addToBag() {
		addCartId(window.localStorage, product.id);
		added = inBag = true;
		window.dispatchEvent(new Event(BAG_EVENT));
	}
</script>

<svelte:head>
	<title>{product.name} | daThriftShop</title>
	<meta name="description" content={product.description ?? product.name} />
	<link rel="canonical" href="{SITE_ORIGIN}/products/{product.slug}" />
	<meta property="og:type" content="product" />
	<meta property="og:title" content={product.name} />
	<meta property="og:description" content={product.description ?? product.name} />
	<meta property="og:url" content="{SITE_ORIGIN}/products/{product.slug}" />
	{#if product.photos[0]}<meta
			property="og:image"
			content="{SITE_ORIGIN}/media/{product.photos[0].key}"
		/>{/if}
	<meta name="twitter:card" content="summary_large_image" />
	{#if testPiece}<meta name="robots" content="noindex, nofollow" />{/if}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- escaped JSON-LD built from server data -->
	{@html jsonLdTag}
</svelte:head>

<SiteHeader preview={testPiece} />

<main id="main-content" class="product-main">
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href="/#shop">The rack</a><span aria-hidden="true">/</span><a href="/shop/{product.category}"
			>{product.category_name}</a
		>
	</nav>
	<div class="product-layout">
		<div class="gallery">
			<div class="gallery-main" style:view-transition-name="photo-{product.slug}">
				{#if product.photos.length}
					<!-- Every photo sits in one scroll-snap track: phones swipe, thumbnails jump. -->
					<div
						class="gallery-track"
						role="region"
						aria-label="Photos of {product.name}"
						tabindex="-1"
						bind:this={track}
						onscroll={syncPhoto}
					>
						{#each product.photos as photo, index (photo.key)}
							<img
								src="/media/{photo.key}"
								alt={photo.alt}
								width="1024"
								height="1280"
								loading={index === 0 ? 'eager' : 'lazy'}
								fetchpriority={index === 0 ? 'high' : 'auto'}
							/>
						{/each}
					</div>
					{#if product.photos.length > 1}
						<span class="photo-count" aria-hidden="true"
							>{activePhoto + 1} / {product.photos.length}</span
						>
					{/if}
				{:else}
					<div class="gallery-empty">Photo coming</div>
				{/if}
				{#if testPiece}<span class="test-note">Test only / local preview</span>{/if}
			</div>
			{#if product.photos.length > 1}
				<div class="thumbs">
					{#each product.photos as photo, index (photo.key)}
						<button
							type="button"
							aria-label="Show photo {index + 1}: {photo.alt}"
							aria-pressed={index === activePhoto}
							onclick={() => showPhoto(index)}
							><img
								src="/media/{photo.key}"
								alt=""
								width="96"
								height="120"
								loading="lazy"
							/></button
						>
					{/each}
				</div>
			{/if}
		</div>

		<div class="detail">
			<SwingTag size="detail" swing={false}>
				<p class="tag-meta">
					{product.category_name} · Size {product.size_label ?? 'not listed'} · 1 of 1
				</p>
				<p class="tag-price">{formatBdt(product.price_bdt)}</p>
				<h1>{product.name}</h1>
				{#if product.stock_state === 'sold'}
					<p class="detail-status">
						<StatusStamp kind="sold" /> This piece has found its next home.
					</p>
				{:else if product.stock_state === 'reserved'}
					<p class="detail-status"><StatusStamp kind="reserved" /> Currently unavailable</p>
				{:else if inBag}
					<p class="detail-status">
						<StatusStamp kind="bag" pressed={added} />
						<span class="bag-confirmation">Saved in your bag. <a href="/cart">View bag</a></span>
					</p>
				{:else}
					<div class="detail-buy">
						<button class="button button-ink" type="button" onclick={addToBag}>Add to bag</button>
					</div>
				{/if}
				{#if product.description}<p class="tag-section">{product.description}</p>{/if}
				<section class="tag-section" aria-labelledby="condition-title">
					<h2 id="condition-title">Condition</h2>
					<p>{product.condition_notes ?? 'Not recorded'}</p>
				</section>
				<section class="tag-section" aria-labelledby="measure-title">
					<h2 id="measure-title">Garment measurements</h2>
					{#if Object.keys(product.measurements).length}
						<dl>
							{#each Object.entries(product.measurements) as [key, value] (key)}
								<div>
									<dt>{labels[key] ?? key}</dt>
									<dd>{value} in</dd>
								</div>
							{/each}
						</dl>
					{:else}
						<p>Not measured</p>
					{/if}
					<p class="fine">Measured on the garment, not the body.</p>
				</section>
				<section class="tag-section" aria-labelledby="fit-title">
					<h2 id="fit-title">Fit notes</h2>
					<p>{product.fit_note ?? 'Not recorded'}</p>
				</section>
			</SwingTag>
		</div>
	</div>
</main>

<SiteFooter />
