<script lang="ts">
	import Icon from '../lib/components/Icon.svelte';
	import ProductGrid from '../lib/components/ProductGrid.svelte';
	import SiteFooter from '../lib/components/SiteFooter.svelte';
	import SiteHeader from '../lib/components/SiteHeader.svelte';
	import SwingTag from '../lib/components/SwingTag.svelte';
	import { hang } from '../lib/motion';
	import { SITE_ORIGIN, formatBdt } from '../lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let hero = $derived(data.hero);
	let hasTestPieces = $derived(
		[...data.products, ...(hero ? [hero] : [])].some((product) => product.slug.startsWith('test-'))
	);
	let total = $derived(data.facets.categories.reduce((sum, item) => sum + item.count, 0));
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
	{#if hasTestPieces}<meta name="robots" content="noindex, nofollow" />{/if}
</svelte:head>

<SiteHeader preview={hasTestPieces} current="home" />

<main id="main-content">
	<section class="hero page" aria-labelledby="hero-title">
		<div class="hero-copy">
			<h1 id="hero-title">Every piece here is <span>one of one.</span></h1>
			<p class="lede">
				Pre-loved clothing, each piece measured by hand in inches and listed with every flaw we
				found. When it is gone, it is gone.
			</p>
			<form class="hero-search" method="GET" action="/shop" role="search">
				<Icon name="search" size={20} />
				<input
					type="search"
					name="q"
					aria-label="Search pieces, brands or piece IDs"
					placeholder="Search pieces, brands or piece IDs"
					maxlength="80"
					enterkeyhint="search"
				/>
				<button type="submit" aria-label="Search"><Icon name="arrow-right" size={20} /></button>
			</form>
			<div class="hero-actions">
				<a class="button button-ink" href="/shop"
					>Shop all {total || ''} pieces <Icon name="arrow-right" size={18} /></a
				>
				{#if hero}<a
						class="button button-outline"
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
							alt={hero.photo_alt || hero.name}
							width="1024"
							height="1280"
							fetchpriority="high"
						/>
					{/if}
				</a>
				<div class="hero-tag" {@attach hang}>
					<SwingTag size="hero">
						<p class="tag-price">{formatBdt(hero.price_bdt)}</p>
						<p class="tag-name"><a href="/products/{hero.slug}">{hero.name}</a></p>
						<p class="tag-meta">
							{hero.category_name}{#if hero.size_label}&nbsp;· Size {hero.size_label}{/if}
						</p>
					</SwingTag>
				</div>
				{#if hasTestPieces}<span class="badge badge-test test-note"
						>{import.meta.env.DEV ? 'Test only / local preview' : 'Test piece · not for sale'}</span
					>{/if}
			{:else}
				<img class="hero-mark" src="/brand/dathrift-logo.webp" alt="" width="640" height="640" />
			{/if}
		</div>
	</section>

	<ul class="promises page" aria-label="What every listing tells you">
		<li><Icon name="ruler" size={22} /><span><strong>Measured by hand</strong> in inches</span></li>
		<li>
			<Icon name="scan-search" size={22} /><span
				><strong>Every flaw</strong> written and photographed</span
			>
		</li>
		<li><Icon name="tag" size={22} /><span><strong>One of each</strong>, no restocks</span></li>
		<li>
			<Icon name="lock" size={22} /><span><strong>Nothing is held</strong> until you pay</span>
		</li>
	</ul>

	{#if data.facets.categories.length}
		<section class="section page" aria-labelledby="categories-title">
			<div class="section-head">
				<h2 class="section-title" id="categories-title">Shop by category</h2>
			</div>
			<ul class="categories">
				{#each data.facets.categories as category (category.slug)}
					<li>
						<a href="/shop/{category.slug}">
							<span class="category-photo">
								{#if category.photo_key}<img
										src="/media/{category.photo_key}"
										alt=""
										width="600"
										height="750"
										loading="lazy"
									/>{/if}
							</span>
							<span class="category-label">
								<span>
									<strong>{category.name}</strong>
									<span class="mono"
										>{category.count} {category.count === 1 ? 'piece' : 'pieces'}</span
									>
								</span>
								<Icon name="arrow-right" size={20} />
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="section page" aria-labelledby="new-title">
		<div class="section-head">
			<h2 class="section-title" id="new-title">New in</h2>
			{#if data.products.length}<a class="text-link" href="/shop"
					>See all <Icon name="arrow-right" size={16} /></a
				>{/if}
		</div>
		<ProductGrid products={data.products} empty="The shop is empty right now. Check back soon." />
	</section>
</main>

<SiteFooter />

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
		align-items: center;
		gap: clamp(32px, 5vw, 80px);
		padding-block: clamp(28px, 5vw, 72px) clamp(32px, 5vw, 64px);
	}

	.hero h1 {
		max-width: 14ch;
		margin: 0;
		font-size: var(--text-hero);
		font-stretch: 76%;
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 0.95;
	}

	/* "one of one" is underlined in gold like a hand-marked tag. */
	.hero h1 span {
		white-space: nowrap;
		text-decoration: underline;
		text-decoration-color: var(--color-gold);
		text-decoration-thickness: 0.12em;
		text-decoration-skip-ink: none;
		text-underline-offset: 0.12em;
	}

	.hero .lede {
		margin-top: 22px;
	}

	.hero-search {
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: 520px;
		min-height: 56px;
		margin-top: 28px;
		padding: 0 6px 0 18px;
		border: 1.5px solid var(--line-strong);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-ink-soft);
		transition:
			border-color 160ms var(--ease-out),
			box-shadow 160ms var(--ease-out);
	}

	.hero-search:focus-within {
		border-color: var(--color-moss);
		box-shadow: 0 0 0 3px rgb(29 92 68 / 0.16);
	}

	.hero-search input {
		flex: 1;
		min-width: 0;
		min-height: 48px;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		font: inherit;
		font-size: 16px;
		outline: none;
		box-shadow: none;
	}

	.hero-search button {
		display: grid;
		width: 44px;
		height: 44px;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: var(--color-ink);
		color: var(--color-paper);
		cursor: pointer;
		transition: background-color 200ms var(--ease-out);
	}

	.hero-search button:hover {
		background: var(--color-moss);
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 16px;
	}

	.hero-piece {
		position: relative;
		display: grid;
		justify-items: end;
		padding-bottom: 56px;
	}

	.hero-photo {
		display: block;
		width: min(100%, 500px);
		aspect-ratio: 4 / 5;
		overflow: hidden;
		border-radius: var(--radius-lg);
		background: var(--color-well);
	}

	.hero-photo img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero-tag {
		position: absolute;
		bottom: 0;
		left: max(0px, calc(100% - 500px - 40px));
		width: min(52%, 250px);
	}

	/* The tag's name is the featured piece's link; the gold underline marks it as one. */
	.tag-name a {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: var(--color-gold);
		text-decoration-thickness: 2px;
		text-underline-offset: 0.2em;
	}

	.tag-name a:hover {
		text-decoration-color: currentColor;
	}

	.hero-tag .tag-meta {
		white-space: nowrap;
	}

	.hero-mark {
		width: min(80%, 380px);
		height: auto;
		border-radius: var(--radius-lg);
	}

	.test-note {
		position: absolute;
		top: 14px;
		right: 14px;
	}

	.promises {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1px;
		margin-block: 0 clamp(40px, 6vw, 72px);
		list-style: none;
	}

	.promises li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 18px;
		border-block: 1px solid var(--line);
		color: var(--color-ink-soft);
		font-size: var(--text-small);
		line-height: 1.4;
	}

	.promises li :global(svg) {
		color: var(--color-bottle);
	}

	.promises strong {
		color: var(--color-ink);
	}

	.section {
		padding-block: 0 clamp(48px, 7vw, 88px);
	}

	.section-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: clamp(18px, 3vw, 28px);
	}

	.categories {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
		gap: clamp(12px, 2vw, 20px);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.categories a {
		display: grid;
		gap: 12px;
		text-decoration: none;
	}

	.category-photo {
		display: block;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		border-radius: var(--radius);
		background: var(--color-well);
	}

	.category-photo img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: scale 600ms var(--ease-out);
	}

	.categories a:hover img {
		scale: 1.04;
	}

	.category-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.category-label > span {
		display: grid;
		gap: 2px;
	}

	.category-label strong {
		font-size: var(--text-h3);
		font-stretch: 85%;
		font-weight: 750;
		line-height: 1.15;
	}

	.category-label .mono {
		color: var(--color-ink-soft);
	}

	.category-label :global(svg) {
		transition: translate 200ms var(--ease-out);
	}

	.categories a:hover .category-label :global(svg) {
		translate: 4px 0;
	}

	@media (max-width: 900px) {
		.hero {
			grid-template-columns: 1fr;
		}

		.hero-piece {
			justify-items: center;
			padding-bottom: 48px;
		}

		.hero-photo {
			width: min(100%, 440px);
		}

		.hero-tag {
			left: max(0px, calc(50% - 220px - 16px));
			width: min(54%, 220px);
		}

		.promises {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 600px) {
		.hero {
			padding-top: 20px;
		}

		.hero-actions .button {
			flex: 1 1 auto;
		}

		/* On phones the header and tab bar already search, and the tag links the piece,
		   so the photo and its price can reach the first screen. */
		.hero-search,
		.hero-actions .button-outline {
			display: none;
		}

		.hero-photo {
			aspect-ratio: 1;
		}

		.promises li {
			padding: 14px 6px;
			gap: 10px;
		}

		.categories {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.category-label strong {
			font-size: var(--text-large);
		}
	}
</style>
