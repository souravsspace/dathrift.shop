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

<nav class="category-list" aria-label="Shop by category">
	<a href="/#shop" aria-current={current ? undefined : 'page'}>All pieces</a>
	{#each categories as category (category)}
		<a href="/shop/{category}" aria-current={current === category ? 'page' : undefined}
			>{categoryLabels[category] ?? category}</a
		>
	{/each}
</nav>

<form class="browse-filters" method="GET" {action}>
	<label for="filter-size">Size</label>
	<select id="filter-size" name="size">
		<option value="">Any size</option>
		{#each sizes as size (size)}
			<option value={size} selected={filters.size === size}>{size}</option>
		{/each}
	</select>
	<label for="filter-price">Price up to</label>
	<select id="filter-price" name="max_price">
		<option value="">Any price</option>
		{#each prices as price (price)}
			<option value={price} selected={filters.maxPrice === price}>৳{price}</option>
		{/each}
	</select>
	<label class="browse-check"
		><input type="checkbox" name="available" value="1" checked={filters.availableOnly} /> Available only</label
	>
	<button type="submit">Apply</button>
	{#if filters.size || filters.maxPrice || filters.availableOnly}
		<a href={action}>Clear</a>
	{/if}
</form>
