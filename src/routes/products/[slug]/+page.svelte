<script lang="ts">
	import type { PageData } from './$types';
	import { BAG_EVENT, addCartId, readCartIds } from '../../../lib/cart/browser-cart';
	import Icon from '../../../lib/components/Icon.svelte';
	import ProductGrid from '../../../lib/components/ProductGrid.svelte';
	import SiteFooter from '../../../lib/components/SiteFooter.svelte';
	import SiteHeader from '../../../lib/components/SiteHeader.svelte';
	import { stampPress } from '../../../lib/motion';
	import { productJsonLd } from '../../../lib/seo';
	import { SITE_ORIGIN, formatBdt } from '../../../lib/site';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();
	let added = $state(false);
	let inBag = $state(false);
	let activePhoto = $state(0);
	let track = $state<HTMLElement>();

	function showPhoto(index: number) {
		const last = product.photos.length - 1;
		activePhoto = Math.max(0, Math.min(last, index));
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		track?.scrollTo({
			left: activePhoto * track.clientWidth,
			behavior: reduce ? 'auto' : 'smooth'
		});
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
	let related = $derived(data.related ?? []);
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

<SiteHeader preview={testPiece} current="shop" />

<main id="main-content" class="product page">
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href="/shop">Shop</a><Icon name="chevron-right" size={14} /><a
			href="/shop/{product.category}">{product.category_name}</a
		>
	</nav>

	<div class="layout">
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
						<span class="photo-count mono" aria-hidden="true"
							>{activePhoto + 1} / {product.photos.length}</span
						>
						<button
							class="step step-back"
							type="button"
							onclick={() => showPhoto(activePhoto - 1)}
							disabled={activePhoto === 0}
							aria-label="Previous photo"><Icon name="chevron-left" size={22} /></button
						>
						<button
							class="step step-next"
							type="button"
							onclick={() => showPhoto(activePhoto + 1)}
							disabled={activePhoto === product.photos.length - 1}
							aria-label="Next photo"><Icon name="chevron-right" size={22} /></button
						>
					{/if}
				{:else}
					<div class="gallery-empty mono">Photo coming</div>
				{/if}
				{#if testPiece}<span class="badge badge-test test-note"
						>{import.meta.env.DEV ? 'Test only / local preview' : 'Test piece · not for sale'}</span
					>{/if}
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

		<div class="info">
			<p class="meta mono">
				<span>{product.category_name}</span>
				{#if product.size_label}<span class="size-pill">Size {product.size_label}</span>{/if}
				<span>1 of 1</span>
			</p>
			<h1>{product.name}</h1>
			{#if product.brand}<p class="brand">{product.brand}</p>{/if}
			<p class="price big-price">{formatBdt(product.price_bdt)}</p>

			<div class="buy">
				{#if product.stock_state === 'sold'}
					<p class="status">
						<span class="badge badge-sold">Sold out</span> This piece has found its next home.
					</p>
				{:else if product.stock_state === 'reserved'}
					<p class="status">
						<span class="badge badge-held">On hold</span> Someone is paying for it right now.
					</p>
				{:else if inBag}
					<p class="status in-bag">
						<span class="added" {@attach added ? stampPress : undefined}
							><Icon name="circle-check" size={20} /> Saved in your bag</span
						>
						<a class="button button-outline" href="/cart"
							>View bag <Icon name="arrow-right" size={18} /></a
						>
					</p>
				{:else}
					<button class="button button-ink button-block" type="button" onclick={addToBag}>
						<Icon name="shopping-bag" size={20} /> Add to bag
					</button>
				{/if}
			</div>

			<ul class="assurances">
				<li><Icon name="tag" size={18} />Only one exists. No restocks.</li>
				<li><Icon name="lock" size={18} />Nothing is held until you pay.</li>
				<li><Icon name="truck" size={18} />Delivery is added once your address is checked.</li>
			</ul>

			{#if product.code}<p class="piece-id">
					Piece ID <span>{product.code}</span>
				</p>{/if}

			<section class="detail-section" aria-labelledby="measure-title">
				<h2 id="measure-title"><Icon name="ruler" size={18} />Garment measurements</h2>
				{#if Object.keys(product.measurements).length}
					<dl class="measurements">
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
				<p class="hint">Measured on the garment, not the body.</p>
			</section>
			{#if product.condition_notes}<section
					class="detail-section"
					aria-labelledby="condition-title"
				>
					<h2 id="condition-title"><Icon name="scan-search" size={18} />Condition</h2>
					<p>{product.condition_notes}</p>
				</section>{/if}
			{#if product.fit_note}<section class="detail-section" aria-labelledby="fit-title">
					<h2 id="fit-title"><Icon name="shirt" size={18} />Fit notes</h2>
					<p>{product.fit_note}</p>
				</section>{/if}
			{#if product.description}<section class="detail-section" aria-labelledby="about-title">
					<h2 id="about-title"><Icon name="info" size={18} />About this piece</h2>
					<p>{product.description}</p>
				</section>{/if}
		</div>
	</div>

	{#if related.length}
		<section class="related" aria-labelledby="related-title">
			<div class="related-head">
				<h2 class="section-title" id="related-title">More {product.category_name.toLowerCase()}</h2>
				<a class="text-link" href="/shop/{product.category}"
					>See all <Icon name="arrow-right" size={16} /></a
				>
			</div>
			<ProductGrid products={related} eager={0} />
		</section>
	{/if}
</main>

<SiteFooter />

<style>
	.product {
		padding-block: 16px clamp(56px, 8vw, 96px);
	}

	.breadcrumb {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-bottom: 16px;
		color: var(--color-ink-soft);
		font-size: var(--text-small);
	}

	.breadcrumb a {
		display: inline-flex;
		align-items: center;
		min-height: 36px;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		color: var(--color-ink);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
		align-items: start;
		gap: clamp(28px, 5vw, 72px);
	}

	.gallery {
		display: grid;
		gap: 12px;
	}

	.gallery-main {
		position: relative;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		border-radius: var(--radius-lg);
		background: var(--color-well);
	}

	.gallery-track {
		display: flex;
		height: 100%;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}

	.gallery-track::-webkit-scrollbar {
		display: none;
	}

	.gallery-track img {
		display: block;
		flex: 0 0 100%;
		width: 100%;
		height: 100%;
		object-fit: cover;
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}

	.photo-count {
		position: absolute;
		right: 14px;
		bottom: 14px;
		padding: 6px 10px;
		border-radius: 999px;
		background: rgb(4 36 26 / 0.72);
		color: var(--color-paper);
		font-variant-numeric: tabular-nums;
		pointer-events: none;
	}

	.step {
		position: absolute;
		top: 50%;
		display: grid;
		width: 46px;
		height: 46px;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-surface) 90%, transparent);
		color: var(--color-ink);
		box-shadow: 0 2px 10px rgb(4 36 26 / 0.18);
		cursor: pointer;
		translate: 0 -50%;
		transition:
			opacity 200ms var(--ease-out),
			scale 160ms var(--ease-out);
	}

	.step:active:not(:disabled) {
		scale: 0.94;
	}

	.step:disabled {
		opacity: 0;
		pointer-events: none;
	}

	.step-back {
		left: 14px;
	}

	.step-next {
		right: 14px;
	}

	.gallery-empty {
		display: grid;
		height: 100%;
		place-items: center;
		color: var(--color-ink-soft);
	}

	.test-note {
		position: absolute;
		top: 14px;
		left: 14px;
	}

	.thumbs {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 2px;
		scrollbar-width: thin;
	}

	.thumbs button {
		flex: 0 0 auto;
		width: 72px;
		padding: 0;
		overflow: hidden;
		border: 2px solid transparent;
		border-radius: var(--radius-sm);
		background: var(--color-well);
		cursor: pointer;
		opacity: 0.6;
		transition:
			opacity 200ms var(--ease-out),
			border-color 200ms var(--ease-out);
	}

	.thumbs button:hover,
	.thumbs button[aria-pressed='true'] {
		opacity: 1;
	}

	.thumbs button[aria-pressed='true'] {
		border-color: var(--color-ink);
	}

	.thumbs img {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
	}

	.info {
		position: sticky;
		top: calc(var(--header-h) + 20px);
		display: grid;
		gap: 0;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 12px;
		margin: 0;
		color: var(--color-ink-soft);
		text-transform: uppercase;
	}

	.size-pill {
		padding: 3px 9px;
		border-radius: 999px;
		background: var(--color-ink);
		color: var(--color-paper);
		font-weight: 600;
	}

	h1 {
		margin: 14px 0 0;
		font-size: var(--text-h2);
		font-stretch: 85%;
		font-weight: 720;
		letter-spacing: -0.02em;
		line-height: 1.12;
	}

	.brand {
		margin: 6px 0 0;
		color: var(--color-ink-soft);
		font-weight: 600;
	}

	.big-price {
		margin: 14px 0 0;
		font-size: var(--text-h1);
		font-stretch: 72%;
		line-height: 1;
	}

	.buy {
		margin-top: 22px;
	}

	.status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 12px;
		min-height: 50px;
		margin: 0;
		padding: 12px 16px;
		border-radius: var(--radius);
		background: var(--color-surface);
		border: 1px solid var(--line);
		color: var(--color-ink-soft);
		font-size: var(--text-small);
	}

	.in-bag {
		justify-content: space-between;
		padding: 8px 8px 8px 16px;
	}

	.added {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--color-moss);
		font-weight: 700;
	}

	.in-bag .button {
		min-height: 44px;
	}

	.assurances {
		display: grid;
		gap: 10px;
		margin: 20px 0 0;
		padding: 0;
		color: var(--color-ink-soft);
		font-size: var(--text-small);
		list-style: none;
	}

	.assurances li {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.assurances :global(svg) {
		color: var(--color-bottle);
	}

	.piece-id {
		margin: 20px 0 0;
		color: var(--color-ink-soft);
		font-family: var(--font-mono);
		font-size: var(--text-meta);
		text-transform: uppercase;
	}

	.piece-id span {
		color: var(--color-ink);
		font-weight: 600;
		user-select: all;
	}

	.detail-section {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid var(--line);
	}

	.detail-section h2 {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 0 10px;
		font-size: var(--text-body);
		font-weight: 750;
	}

	.detail-section h2 :global(svg) {
		color: var(--color-bottle);
	}

	.detail-section p {
		margin: 0;
		line-height: 1.6;
	}

	.measurements {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 8px;
		margin: 0 0 10px;
	}

	.measurements div {
		display: grid;
		gap: 2px;
		padding: 12px 14px;
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		border: 1px solid var(--line);
	}

	.measurements dt {
		color: var(--color-ink-soft);
		font-size: var(--text-small);
	}

	.measurements dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-large);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.related {
		margin-top: clamp(56px, 8vw, 96px);
	}

	.related-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 24px;
	}

	@media (hover: none) {
		.step {
			display: none;
		}
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}

		.info {
			position: static;
		}

		.gallery-main {
			margin-inline: calc(var(--gutter) * -1);
			border-radius: 0;
		}

		.thumbs button {
			width: 56px;
		}
	}
</style>
