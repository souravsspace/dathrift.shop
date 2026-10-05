<script lang="ts">
	import type { PageData } from './$types';
	import { addCartId } from '../../../lib/cart/browser-cart';
	import { productJsonLd } from '../../../lib/seo';
	import { SITE_ORIGIN } from '../../../lib/site';

	let { data }: { data: PageData } = $props();
	let added = $state(false);
	let activePhoto = $state(0);
	// Split closing tag so the Svelte parser does not end this script block.
	let jsonLdTag = $derived(
		`<script type="application/ld+json">${productJsonLd(data.product)}</` + 'script>'
	);
	let product = $derived(data.product);
	let testPiece = $derived(product.slug.startsWith('test-'));
	const labels: Record<string, string> = {
		chest_cm: 'Chest',
		length_cm: 'Length',
		waist_cm: 'Waist',
		inseam_cm: 'Inseam'
	};
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;

	function addToBag() {
		addCartId(window.localStorage, product.id);
		added = true;
	}
</script>

<svelte:head>
	<title>{product.name} | dathrift</title>
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

<div class="storefront product-page">
	{#if testPiece}<div class="preview-strip">Local preview · test pieces only</div>{/if}
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
		<div class="breadcrumb">
			<a href="/#shop">The edit</a><span aria-hidden="true">/</span><span>{product.category}</span>
		</div>
		<div class="product-layout">
			<div class="detail-media">
				{#if product.photos[activePhoto]}
					<img
						src="/media/{product.photos[activePhoto].key}"
						alt={product.photos[activePhoto].alt}
						width="1024"
						height="1280"
						fetchpriority="high"
					/>
					{#if product.photos.length > 1}
						<div class="detail-thumbs">
							{#each product.photos as photo, index (photo.key)}
								<button
									type="button"
									aria-label="Show photo {index + 1}: {photo.alt}"
									aria-pressed={index === activePhoto}
									onclick={() => (activePhoto = index)}
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
				{:else}
					<div class="image-unavailable">Image unavailable</div>
				{/if}
				{#if testPiece}<span class="image-note">TEST ONLY / LOCAL PREVIEW</span>{/if}
			</div>
			<div class="detail-info">
				<p class="detail-category">{product.category} · One of one</p>
				<h1>{product.name}</h1>
				<p class="detail-price">{price(product.price_bdt)}</p>
				{#if product.stock_state === 'sold'}
					<p class="detail-sold">Sold out</p>
				{:else if product.stock_state === 'reserved'}
					<p class="detail-sold">Currently unavailable</p>
				{:else}
					<button class="bag-button" type="button" onclick={addToBag}
						>{added ? 'Added to bag' : 'Add to bag'}</button
					>
					{#if added}<p class="bag-confirmation">
							Saved in your bag. <a href="/cart">View bag</a>
						</p>{/if}
				{/if}
				<p class="detail-description">{product.description}</p>
				<div class="detail-facts">
					<div>
						<h2>Condition</h2>
						<p>{product.condition_notes}</p>
					</div>
					<div>
						<h2>Tagged size</h2>
						<p>{product.size_label}</p>
					</div>
					<div>
						<h2>Fit notes</h2>
						<p>{product.fit_note}</p>
					</div>
				</div>
				<div class="measurements">
					<h2>Garment measurements</h2>
					<dl>
						{#each Object.entries(product.measurements) as [key, value] (key)}
							<div>
								<dt>{labels[key] ?? key}</dt>
								<dd>{value} cm</dd>
							</div>
						{/each}
					</dl>
					<p>Measurements are of the garment, not the body.</p>
				</div>
			</div>
		</div>
	</main>
	<footer class="site-footer">
		<span>dathrift.</span><span>One piece. One next chapter.</span><a href="/#shop"
			>Back to the edit ↑</a
		>
	</footer>
</div>
