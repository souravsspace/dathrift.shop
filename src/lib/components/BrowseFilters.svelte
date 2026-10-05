<script lang="ts">
	import { categoryLabels } from '../site';

	type Filters = { category?: string; size?: string; maxPrice?: number; availableOnly?: boolean };

	let {
		action,
		categories,
		sizes,
		filters,
		current
	}: {
		action: string;
		categories: string[];
		sizes: string[];
		filters: Filters;
		current?: string;
	} = $props();
	const prices = [500, 1000, 1500, 2500];
</script>

<div class="browse">
	<nav class="categories" aria-label="Shop by category">
		<a href="/#shop" aria-current={current ? undefined : 'page'}>All pieces</a>
		{#each categories as category (category)}
			<a href="/shop/{category}" aria-current={current === category ? 'page' : undefined}
				>{categoryLabels[category] ?? category}</a
			>
		{/each}
	</nav>

	<form class="filters" method="GET" {action}>
		<div class="field">
			<label for="filter-size">Size</label>
			<select id="filter-size" name="size">
				<option value="">Any size</option>
				{#each sizes as size (size)}
					<option value={size} selected={filters.size === size}>{size}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="filter-price">Price up to</label>
			<select id="filter-price" name="max_price">
				<option value="">Any price</option>
				{#each prices as price (price)}
					<option value={price} selected={filters.maxPrice === price}>৳{price}</option>
				{/each}
			</select>
		</div>
		<label class="check">
			<input type="checkbox" name="available" value="1" checked={filters.availableOnly} />
			<span>Available only</span>
		</label>
		<button type="submit">Apply</button>
		{#if filters.size || filters.maxPrice || filters.availableOnly}
			<a class="clear" href={action}>Clear</a>
		{/if}
	</form>
</div>

<style>
	.browse {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 18px 28px;
		margin: 28px 0 64px;
		padding: 14px 0;
		border-top: 1px solid rgb(251 235 214 / 0.14);
		border-bottom: 1px solid rgb(251 235 214 / 0.14);
	}

	.categories {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.categories a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 18px;
		border: 1px solid rgb(251 235 214 / 0.22);
		border-radius: 999px;
		font-size: var(--text-ui);
		font-weight: 600;
		text-decoration: none;
		transition:
			background-color 200ms var(--ease-out),
			color 200ms var(--ease-out),
			border-color 200ms var(--ease-out);
	}

	.categories a:hover {
		border-color: var(--color-gold);
	}

	.categories a[aria-current='page'] {
		border-color: var(--color-ivory);
		background: var(--color-ivory);
		color: var(--color-ink);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		font-size: var(--text-ui);
	}

	.field,
	.check {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
	}

	.field label {
		color: rgb(251 235 214 / 0.75);
	}

	select {
		min-height: 40px;
		padding: 6px 34px 6px 12px;
		border: 1px solid rgb(251 235 214 / 0.22);
		border-radius: 8px;
		background-color: var(--color-bottle);
		color: var(--color-ivory);
		font: inherit;
	}

	.check input {
		width: 20px;
		height: 20px;
		border-color: rgb(251 235 214 / 0.5);
		border-radius: 4px;
		background-color: transparent;
		color: var(--color-gold);
	}

	button {
		min-height: 40px;
		padding: 0 18px;
		border: 0;
		border-radius: 999px;
		background: var(--color-ivory);
		color: var(--color-ink);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		transition: background-color 200ms var(--ease-out);
	}

	button:hover {
		background: var(--color-gold);
	}

	.clear {
		padding: 0 6px;
		text-underline-offset: 4px;
	}

	@media (max-width: 600px) {
		.browse {
			margin: 22px 0 44px;
		}

		.categories {
			flex-wrap: nowrap;
			overflow-x: auto;
			width: calc(100% + 2 * var(--gutter));
			margin: 0 calc(-1 * var(--gutter));
			padding: 0 var(--gutter) 4px;
			scrollbar-width: none;
		}

		.categories a {
			flex: 0 0 auto;
		}
	}
</style>
