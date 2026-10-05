<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let category = $state('all');
	let visibleProducts = $derived(
		category === 'all'
			? data.products
			: data.products.filter((product) => product.category === category)
	);
	let hasTestPieces = $derived(data.products.some((product) => product.slug.startsWith('test-')));

	const categories = [
		{ value: 'all', label: 'All pieces' },
		{ value: 'tops', label: 'Tops' },
		{ value: 'bottoms', label: 'Bottoms' },
		{ value: 'outerwear', label: 'Outerwear' },
		{ value: 'dresses', label: 'Dresses' }
	];
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
</script>

<svelte:head>
	<title>dathrift — one-of-a-kind pre-loved clothing</title>
	<meta
		name="description"
		content="Explore one-of-a-kind pre-loved clothing with honest condition notes and garment measurements."
	/>
	{#if hasTestPieces}<meta name="robots" content="noindex, nofollow" />{/if}
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

			<div class="category-list" aria-label="Filter by category">
				{#each categories as option (option.value)}
					<button
						type="button"
						class:active={category === option.value}
						aria-pressed={category === option.value}
						onclick={() => (category = option.value)}>{option.label}</button
					>
				{/each}
			</div>

			{#if visibleProducts.length}
				<div class="product-grid">
					{#each visibleProducts as product (product.id)}
						<article class="product-card">
							<a href="/products/{product.slug}" aria-label="View {product.name}">
								<div class="product-image" class:sold={product.stock_state !== 'available'}>
									{#if product.photo_key}
										<img
											src="/media/{product.photo_key}"
											alt={product.photo_alt ?? product.name}
											width="1024"
											height="1280"
											loading="lazy"
										/>
									{:else}
										<span class="image-unavailable">Image unavailable</span>
									{/if}
									{#if product.stock_state !== 'available'}<span class="sold-badge">Sold out</span
										>{/if}
								</div>
								<div class="product-info">
									<span class="product-category"
										>{product.category} · Size {product.size_label ?? '—'}</span
									>
									<h3>{product.name}</h3>
									<div class="product-bottom">
										<span>{price(product.price_bdt)}</span>
										<span aria-hidden="true">↗</span>
									</div>
								</div>
							</a>
						</article>
					{/each}
				</div>
			{:else}
				<p class="empty-state">
					No pieces in this category right now. Try another part of the edit.
				</p>
			{/if}
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
