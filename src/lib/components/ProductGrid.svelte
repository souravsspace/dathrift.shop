<script lang="ts">
	import { reveal } from '../motion';
	import { formatBdt } from '../site';

	type Listing = {
		id: string;
		slug: string;
		name: string;
		brand?: string | null;
		category_name: string;
		price_bdt: number;
		stock_state: 'available' | 'reserved' | 'sold';
		size_label: string | null;
		measurements?: Record<string, number>;
		photo_key: string | null;
		photo_alt: string | null;
	};

	let {
		products,
		empty = 'No pieces here yet.',
		eager = 4
	}: { products: Listing[]; empty?: string; eager?: number } = $props();

	const shortLabels: Record<string, string> = {
		chest_in: 'Chest',
		waist_in: 'Waist',
		length_in: 'Length',
		inseam_in: 'Inseam'
	};

	// The number that decides fit (chest or waist) leads the card, in inches.
	const fitLine = (measurements: Record<string, number> = {}) =>
		Object.entries(measurements)
			.slice(0, 1)
			.map(([key, value]) => `${shortLabels[key] ?? key} ${value} in`)
			.join(' · ');
</script>

{#if products.length}
	<ul class="grid" {@attach reveal}>
		{#each products as product, index (product.id)}
			<li data-reveal>
				<a class="piece" href="/products/{product.slug}">
					<div
						class="photo"
						class:unavailable={product.stock_state !== 'available'}
						style:view-transition-name="photo-{product.slug}"
					>
						{#if product.photo_key}
							<img
								src="/media/{product.photo_key}"
								alt={product.photo_alt || product.name}
								width="1024"
								height="1280"
								loading={index < eager ? 'eager' : 'lazy'}
							/>
						{:else}
							<span class="no-photo mono">Photo coming</span>
						{/if}
						{#if product.stock_state === 'sold'}
							<span class="badge badge-sold state">Sold out</span>
						{:else if product.stock_state === 'reserved'}
							<span class="badge badge-held state">On hold</span>
						{/if}
					</div>
					<div class="info">
						<div class="top-line">
							<span class="price">{formatBdt(product.price_bdt)}</span>
							{#if product.size_label}<span class="size"
									><span class="visually-hidden">Size</span>{product.size_label}</span
								>{/if}
						</div>
						<h3 class="name">{product.name}</h3>
						{#if fitLine(product.measurements)}
							<p class="mono fit">{fitLine(product.measurements)}</p>
						{:else}
							<p class="mono fit">{product.brand || product.category_name}</p>
						{/if}
					</div>
				</a>
			</li>
		{/each}
	</ul>
{:else}
	<p class="grid-empty">{empty}</p>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 228px), 1fr));
		gap: clamp(28px, 3.4vw, 44px) clamp(14px, 2vw, 24px);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.piece {
		display: grid;
		gap: 12px;
		text-decoration: none;
	}

	.photo {
		position: relative;
		display: grid;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		place-items: center;
		border-radius: var(--radius);
		background: var(--color-well);
	}

	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition:
			scale 600ms var(--ease-out),
			filter 400ms var(--ease-out);
	}

	.piece:hover .photo img {
		scale: 1.04;
	}

	.photo.unavailable img {
		filter: saturate(0.4) brightness(0.92);
	}

	.no-photo {
		color: var(--color-ink-soft);
	}

	.state {
		position: absolute;
		top: 10px;
		left: 10px;
	}

	.info {
		display: grid;
		gap: 4px;
	}

	.top-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.top-line .price {
		font-size: var(--text-h3);
		line-height: 1.1;
	}

	/* The size wears a little tag shape: a notched left edge with a punched hole. */
	.size {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-width: 34px;
		height: 24px;
		padding: 0 8px 0 15px;
		background: color-mix(in srgb, var(--color-ivory), var(--color-gold) 45%);
		color: var(--color-ink);
		font-family: var(--font-mono);
		font-size: var(--text-label);
		font-weight: 600;
		clip-path: polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%);
		border-radius: 0 4px 4px 0;
	}

	.size::before {
		position: absolute;
		top: 50%;
		left: 7px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--color-paper);
		content: '';
		translate: 0 -50%;
	}

	.name {
		display: -webkit-box;
		margin: 0;
		overflow: hidden;
		font-size: var(--text-body);
		font-weight: 550;
		line-height: 1.35;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.fit {
		margin: 0;
		color: var(--color-ink-soft);
	}

	.grid-empty {
		margin: 0;
		padding: 48px 0;
		color: var(--color-ink-soft);
	}

	@media (max-width: 600px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 26px 12px;
		}

		.top-line .price {
			font-size: var(--text-large);
		}

		.name {
			font-size: var(--text-small);
		}

		.fit {
			font-size: var(--text-label);
		}
	}
</style>
