<script lang="ts">
	import { reveal } from '../motion';
	import { categoryLabels, formatBdt } from '../site';
	import StatusStamp from './StatusStamp.svelte';
	import SwingTag from './SwingTag.svelte';

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
	// A slight alternating hang keeps identical tags reading as a physical rack.
	const tilts = [-2.5, 1.5, -1, 2.5];
</script>

{#if products.length}
	<ul class="rack" {@attach reveal}>
		{#each products as product, index (product.id)}
			<li data-reveal>
				<a class="piece" href="/products/{product.slug}" aria-label="View {product.name}">
					<div
						class="photo"
						class:unavailable={product.stock_state !== 'available'}
						style:view-transition-name="photo-{product.slug}"
					>
						{#if product.photo_key}
							<img
								src="/media/{product.photo_key}"
								alt={product.photo_alt ?? product.name}
								width="1024"
								height="1280"
								loading={index < 4 ? 'eager' : 'lazy'}
							/>
						{:else}
							<span class="no-photo">Photo coming</span>
						{/if}
					</div>
					<div class="piece-tag">
						<SwingTag tilt={tilts[index % tilts.length]}>
							<p class="tag-meta">
								{categoryLabels[product.category] ?? product.category} · {product.size_label ??
									'Size not listed'}
							</p>
							<p class="tag-price">{formatBdt(product.price_bdt)}</p>
							<h3 class="tag-name">{product.name}</h3>
							{#if product.stock_state !== 'available'}
								<div class="tag-stamp">
									<StatusStamp kind={product.stock_state === 'sold' ? 'sold' : 'reserved'} />
								</div>
							{/if}
						</SwingTag>
					</div>
				</a>
			</li>
		{/each}
	</ul>
{:else}
	<p class="rack-empty">{empty}</p>
{/if}

<style>
	.rack {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
		gap: 72px clamp(20px, 2.6vw, 40px);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.piece {
		display: block;
		text-decoration: none;
	}

	.photo {
		position: relative;
		display: grid;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		place-items: center;
		border-radius: 4px;
		background: var(--color-bottle);
	}

	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition:
			scale 700ms var(--ease-out),
			filter 400ms var(--ease-out);
	}

	.piece:hover .photo img {
		scale: 1.035;
	}

	.photo.unavailable img {
		filter: saturate(0.45) brightness(0.88);
	}

	.no-photo {
		color: rgb(251 235 214 / 0.7);
		font-family: var(--font-mono);
		font-size: 0.72rem;
	}

	.piece-tag {
		position: relative;
		width: 82%;
		margin: -64px 6% 0 auto;
	}

	.tag-meta {
		margin: 0 0 8px;
		color: var(--color-ink-soft);
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.tag-price {
		margin: 0;
		font-size: clamp(2.3rem, 3.6vw, 3rem);
		font-stretch: 62%;
		font-weight: 850;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
		line-height: 0.9;
	}

	.tag-name {
		margin: 10px 0 0;
		font-size: 0.95rem;
		font-weight: 550;
		line-height: 1.3;
		text-wrap: balance;
	}

	.tag-stamp {
		position: absolute;
		top: 30%;
		right: 14px;
	}

	.rack-empty {
		padding: 56px 0;
		color: rgb(251 235 214 / 0.78);
		font-size: 1.05rem;
	}

	@media (max-width: 600px) {
		.rack {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 48px 14px;
		}

		.piece-tag {
			width: 94%;
			margin: -38px 3% 0;
		}

		.tag-price {
			font-size: 1.9rem;
		}

		.tag-name {
			font-size: 0.8rem;
		}

		.tag-meta {
			font-size: 0.58rem;
		}

		.tag-stamp {
			position: static;
			margin-top: 10px;
		}
	}
</style>
