<script lang="ts">
	import type { PageData } from './$types';
	import { addCartId } from '../../../lib/cart/browser-cart';

	let { data }: { data: PageData } = $props();
	let added = $state(false);
	let product = $derived(data.product);
	let testPiece = $derived(product.slug.startsWith('test-'));
	const testImages: Record<string, string> = {
		'test-olive-cotton-shirt': '/test-only/olive-shirt.webp',
		'test-cream-midi-dress': '/test-only/cream-dress.webp',
		'test-sold-denim-jacket': '/test-only/denim-jacket.webp'
	};
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
	{#if testPiece}<meta name="robots" content="noindex, nofollow" />{/if}
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
				{#if testImages[product.slug]}
					<img
						src={testImages[product.slug]}
						alt={product.photos[0]?.alt ?? product.name}
						width="1024"
						height="1280"
					/>
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
