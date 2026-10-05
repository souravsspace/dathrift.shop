<script lang="ts">
	import { formatBdt } from '../site';

	type Listing = {
		id: string;
		slug: string;
		name: string;
		category: string;
		price_bdt: number;
		stock_state: 'available' | 'reserved' | 'sold';
		size_label: string | null;
		photo_key: string | null;
		photo_alt: string | null;
	};

	let { products, empty }: { products: Listing[]; empty: string } = $props();
</script>

{#if products.length}
	<div class="product-grid">
		{#each products as product, index (product.id)}
			<article class="product-card">
				<a href="/products/{product.slug}" aria-label="View {product.name}">
					<div class="product-image" class:sold={product.stock_state !== 'available'}>
						{#if product.photo_key}
							<img
								src="/media/{product.photo_key}"
								alt={product.photo_alt ?? product.name}
								width="1024"
								height="1280"
								loading={index < 2 ? 'eager' : 'lazy'}
							/>
						{:else}
							<span class="image-unavailable">Image unavailable</span>
						{/if}
						{#if product.stock_state === 'sold'}<span class="sold-badge">Sold out</span>
						{:else if product.stock_state === 'reserved'}<span class="sold-badge">On hold</span
							>{/if}
					</div>
					<div class="product-info">
						<span class="product-category"
							>{product.category} · Size {product.size_label ?? '—'}</span
						>
						<h3>{product.name}</h3>
						<div class="product-bottom">
							<span>{formatBdt(product.price_bdt)}</span>
							<span aria-hidden="true">↗</span>
						</div>
					</div>
				</a>
			</article>
		{/each}
	</div>
{:else}
	<p class="empty-state">{empty}</p>
{/if}
