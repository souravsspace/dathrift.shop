<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, untrack, type ComponentProps } from 'svelte';
	import { activeFilterCount, browseQuery, type BrowseFilters } from '../browse-query';
	import { formatBdt } from '../site';
	import Icon from './Icon.svelte';
	import ProductGrid from './ProductGrid.svelte';

	type Category = {
		slug: string;
		name: string;
		measurement_set: 'top' | 'bottom' | 'none';
		count: number;
	};

	let {
		action,
		title,
		products,
		total,
		page,
		facets,
		filters,
		current
	}: {
		action: string;
		title: string;
		products: ComponentProps<typeof ProductGrid>['products'];
		total: number;
		page: number;
		facets: { categories: Category[]; sizes: string[]; price: { min: number; max: number } };
		filters: BrowseFilters;
		current?: string;
	} = $props();

	let form = $state<HTMLFormElement>();
	let panel = $state<HTMLElement>();
	let searchBox = $state<HTMLInputElement>();
	let enhanced = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	// Seeded for the server render; the effect keeps it in step without fighting the typist.
	let typed = $state(untrack(() => filters.query ?? ''));
	$effect(() => {
		const query = filters.query ?? '';
		if (document.activeElement !== searchBox) typed = query;
	});

	let sets = $derived(
		new Set(
			(current ? facets.categories.filter((item) => item.slug === current) : facets.categories).map(
				(item) => item.measurement_set
			)
		)
	);
	let narrowed = $derived(activeFilterCount(filters));
	let allCount = $derived(facets.categories.reduce((sum, item) => sum + item.count, 0));
	let shown = $derived(products.length);
	let href = (next: BrowseFilters, nextPage = 1) => `${action}${browseQuery(next, nextPage)}`;
	const without = (key: keyof BrowseFilters, value?: string) => {
		const next = { ...filters };
		if (key === 'sizes' && value) next.sizes = filters.sizes?.filter((size) => size !== value);
		else delete next[key];
		return href(next);
	};
	const inches = (min?: number, max?: number) =>
		min && max ? `${min}–${max} in` : min ? `${min} in or more` : `up to ${max} in`;
	let chips = $derived([
		...(filters.query ? [{ label: `“${filters.query}”`, href: without('query') }] : []),
		...(filters.sizes ?? []).map((size) => ({
			label: `Size ${size}`,
			href: without('sizes', size)
		})),
		...(filters.minPrice || filters.maxPrice
			? [
					{
						label:
							filters.minPrice && filters.maxPrice
								? `${formatBdt(filters.minPrice)}–${formatBdt(filters.maxPrice)}`
								: filters.minPrice
									? `From ${formatBdt(filters.minPrice)}`
									: `Up to ${formatBdt(filters.maxPrice ?? 0)}`,
						href: href({ ...filters, minPrice: undefined, maxPrice: undefined })
					}
				]
			: []),
		...(filters.chestMin || filters.chestMax
			? [
					{
						label: `Chest ${inches(filters.chestMin, filters.chestMax)}`,
						href: href({ ...filters, chestMin: undefined, chestMax: undefined })
					}
				]
			: []),
		...(filters.waistMin || filters.waistMax
			? [
					{
						label: `Waist ${inches(filters.waistMin, filters.waistMax)}`,
						href: href({ ...filters, waistMin: undefined, waistMax: undefined })
					}
				]
			: []),
		...(filters.availableOnly ? [{ label: 'Available only', href: without('availableOnly') }] : [])
	]);

	onMount(() => (enhanced = true));

	// The form is a plain GET form (works without JavaScript); with it, results follow each change.
	function currentHref() {
		if (!form) return action;
		const parts: string[] = [];
		for (const [key, value] of new FormData(form)) {
			const text = String(value).trim();
			if (text) parts.push(`${key}=${encodeURIComponent(text).replace(/%20/g, '+')}`);
		}
		return parts.length ? `${action}?${parts.join('&')}` : action;
	}

	function apply(delay = 0) {
		clearTimeout(timer);
		timer = setTimeout(() => goto(currentHref(), { replace: true, reset: false }), delay);
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		clearTimeout(timer);
		void goto(currentHref(), { reset: false });
		if (panel?.matches(':popover-open')) panel.hidePopover();
	}
</script>

<div class="browse page" id="browse">
	<header class="browse-head">
		<h1 class="page-title">{title}</h1>
		<p class="lede">
			{total}
			{total === 1 ? 'piece' : 'pieces'}{filters.query || narrowed ? ' match' : ''}, one of each.
		</p>
	</header>

	<nav class="categories" aria-label="Shop by category">
		<a href="/shop" data-sveltekit-reset="false" aria-current={current ? undefined : 'page'}
			>All pieces <span class="mono">{allCount}</span></a
		>
		{#each facets.categories as category (category.slug)}
			<a
				href="/shop/{category.slug}"
				data-sveltekit-reset="false"
				aria-current={current === category.slug ? 'page' : undefined}
				>{category.name} <span class="mono">{category.count}</span></a
			>
		{/each}
	</nav>

	<form
		class="filters"
		method="GET"
		{action}
		bind:this={form}
		onsubmit={submit}
		onchange={(event) => {
			if ((event.target as HTMLElement).getAttribute('name') !== 'q') apply();
		}}
		data-sveltekit-reset="false"
	>
		<div class="toolbar">
			<label class="search">
				<Icon name="search" size={18} />
				<span class="visually-hidden">Search pieces</span>
				<input
					type="search"
					name="q"
					bind:this={searchBox}
					bind:value={typed}
					oninput={() => apply(300)}
					placeholder="Name, brand or piece ID"
					maxlength="80"
					enterkeyhint="search"
				/>
			</label>
			<button class="filter-toggle" type="button" popovertarget="filter-panel">
				<Icon name="sliders-horizontal" size={18} />
				Filters
				{#if narrowed}<span class="count">{narrowed}</span>{/if}
			</button>
			<label class="sort">
				<Icon name="arrow-up-down" size={16} />
				<span class="visually-hidden">Sort</span>
				<select name="sort">
					<option value="" selected={!filters.sort}>Newest first</option>
					<option value="price-asc" selected={filters.sort === 'price-asc'}
						>Price: low to high</option
					>
					<option value="price-desc" selected={filters.sort === 'price-desc'}
						>Price: high to low</option
					>
				</select>
				<Icon name="chevron-down" size={16} />
			</label>
		</div>

		<div class="body">
			<aside class="panel" id="filter-panel" popover="auto" bind:this={panel} aria-label="Filters">
				<div class="panel-head">
					<h2>Filters</h2>
					<button
						class="panel-close"
						type="button"
						popovertarget="filter-panel"
						popovertargetaction="hide"
						aria-label="Close filters"><Icon name="x" size={20} /></button
					>
				</div>

				<div class="panel-scroll">
					{#if facets.sizes.length}
						<fieldset>
							<legend><Icon name="tag" size={16} />Size</legend>
							<div class="sizes">
								{#each facets.sizes as size (size)}
									<label class="size-chip">
										<input
											type="checkbox"
											name="size"
											value={size}
											checked={filters.sizes?.includes(size) ?? false}
										/>
										<span>{size}</span>
									</label>
								{/each}
							</div>
						</fieldset>
					{/if}

					<fieldset>
						<legend><Icon name="wallet" size={16} />Price</legend>
						<div class="range">
							<label>
								<span class="hint">Min</span>
								<input
									class="input"
									type="number"
									name="min_price"
									inputmode="numeric"
									min="1"
									step="1"
									value={filters.minPrice ?? ''}
									placeholder={facets.price.min ? String(facets.price.min) : '0'}
								/>
							</label>
							<span class="dash" aria-hidden="true">–</span>
							<label>
								<span class="hint">Max</span>
								<input
									class="input"
									type="number"
									name="max_price"
									inputmode="numeric"
									min="1"
									step="1"
									value={filters.maxPrice ?? ''}
									placeholder={facets.price.max ? String(facets.price.max) : 'Any'}
								/>
							</label>
						</div>
					</fieldset>

					{#if sets.has('top') || sets.has('bottom')}
						<fieldset>
							<legend><Icon name="ruler" size={16} />Fits me</legend>
							<p class="hint">Match the garment’s own measurements, in inches.</p>
							{#if sets.has('top')}
								<div class="range">
									<label>
										<span class="hint">Chest from</span>
										<input
											class="input"
											type="number"
											name="chest_min"
											inputmode="decimal"
											min="1"
											step="0.5"
											value={filters.chestMin ?? ''}
											placeholder="36"
										/>
									</label>
									<span class="dash" aria-hidden="true">–</span>
									<label>
										<span class="hint">to</span>
										<input
											class="input"
											type="number"
											name="chest_max"
											inputmode="decimal"
											min="1"
											step="0.5"
											value={filters.chestMax ?? ''}
											placeholder="42"
										/>
									</label>
								</div>
							{/if}
							{#if sets.has('bottom')}
								<div class="range">
									<label>
										<span class="hint">Waist from</span>
										<input
											class="input"
											type="number"
											name="waist_min"
											inputmode="decimal"
											min="1"
											step="0.5"
											value={filters.waistMin ?? ''}
											placeholder="28"
										/>
									</label>
									<span class="dash" aria-hidden="true">–</span>
									<label>
										<span class="hint">to</span>
										<input
											class="input"
											type="number"
											name="waist_max"
											inputmode="decimal"
											min="1"
											step="0.5"
											value={filters.waistMax ?? ''}
											placeholder="34"
										/>
									</label>
								</div>
							{/if}
						</fieldset>
					{/if}

					<fieldset>
						<legend class="visually-hidden">Availability</legend>
						<label class="switch">
							<span>
								<span class="switch-label">Available only</span>
								<span class="hint">Hide sold and on-hold pieces</span>
							</span>
							<input type="checkbox" name="available" value="1" checked={filters.availableOnly} />
						</label>
					</fieldset>
				</div>

				<div class="panel-foot" class:enhanced>
					{#if narrowed}<a
							class="text-link"
							href={href({ query: filters.query, sort: filters.sort })}>Clear filters</a
						>{/if}
					<button class="button button-ink apply" type="submit">
						<span class="apply-phone">Show {total} {total === 1 ? 'piece' : 'pieces'}</span>
						<span class="apply-desk">Apply</span>
					</button>
				</div>
			</aside>

			<section class="results" aria-label="Pieces">
				{#if chips.length}
					<ul class="chips" aria-label="Active filters">
						{#each chips as chip (chip.label)}
							<li>
								<a href={chip.href} data-sveltekit-reset="false" aria-label="Remove {chip.label}"
									>{chip.label}<Icon name="x" size={14} /></a
								>
							</li>
						{/each}
						{#if chips.length > 1}<li>
								<a class="clear-all" href={action} data-sveltekit-reset="false">Clear all</a>
							</li>{/if}
					</ul>
				{/if}

				{#if products.length}
					<ProductGrid {products} />
				{:else}
					<div class="empty-state">
						<span class="empty-icon"><Icon name="search" size={26} /></span>
						<h2>No pieces match</h2>
						<p>
							Try fewer filters or a shorter search. New pieces arrive often, and each one is the
							only one.
						</p>
						<a class="button button-outline" href={action} data-sveltekit-reset="false">Clear all</a
						>
					</div>
				{/if}

				{#if shown < total}
					<div class="more">
						<p class="hint">Showing {shown} of {total}</p>
						<a
							class="button button-outline"
							href={href(filters, page + 1)}
							data-sveltekit-reset="false"
							data-sveltekit-replacestate>Show more pieces <Icon name="chevron-down" size={18} /></a
						>
					</div>
				{/if}
			</section>
		</div>
	</form>
</div>

<style>
	.browse {
		padding-block: clamp(20px, 4vw, 44px) clamp(56px, 8vw, 96px);
		/* Clear the sticky header when a page load jumps to #browse. */
		scroll-margin-top: var(--header-h);
	}

	.browse-head .lede {
		margin-top: 8px;
		font-size: var(--text-body);
	}

	.categories {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 22px 0 18px;
	}

	.categories a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 16px;
		border: 1.5px solid var(--line);
		border-radius: 999px;
		background: var(--color-surface);
		font-size: var(--text-small);
		font-weight: 650;
		text-decoration: none;
		transition:
			border-color 200ms var(--ease-out),
			background-color 200ms var(--ease-out),
			color 200ms var(--ease-out);
	}

	.categories a:hover {
		border-color: var(--line-strong);
	}

	.categories a .mono {
		color: var(--color-ink-soft);
		font-size: var(--text-label);
	}

	.categories a[aria-current='page'] {
		border-color: var(--color-ink);
		background: var(--color-ink);
		color: var(--color-paper);
	}

	.categories a[aria-current='page'] .mono {
		color: var(--color-gold);
	}

	/* Search, filters and sort stay in reach while the grid scrolls. */
	.toolbar {
		position: sticky;
		top: var(--header-h);
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0 calc(var(--gutter) * -1);
		padding: 10px var(--gutter);
		border-bottom: 1px solid var(--line);
		background: rgb(250 247 241 / 0.94);
		backdrop-filter: saturate(1.4) blur(14px);
	}

	.search {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 10px;
		max-width: 520px;
		min-height: 48px;
		padding: 0 16px;
		border: 1.5px solid var(--line-strong);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-ink-soft);
		transition:
			border-color 160ms var(--ease-out),
			box-shadow 160ms var(--ease-out);
	}

	.search:focus-within {
		border-color: var(--color-moss);
		box-shadow: 0 0 0 3px rgb(29 92 68 / 0.16);
	}

	.search input {
		flex: 1;
		min-width: 0;
		min-height: 44px;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--color-ink);
		font: inherit;
		font-size: 16px;
		outline: none;
		box-shadow: none;
	}

	.search input::placeholder {
		color: rgb(61 90 77 / 0.75);
	}

	.filter-toggle {
		display: none;
	}

	.sort {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 48px;
		margin-left: auto;
		padding: 0 12px 0 16px;
		border: 1.5px solid var(--line);
		border-radius: 999px;
		background: var(--color-surface);
		font-size: var(--text-small);
		font-weight: 650;
	}

	.sort select {
		min-height: 44px;
		padding: 0 4px;
		border: 0;
		background: none;
		color: var(--color-ink);
		font: inherit;
		font-size: 16px;
		appearance: none;
		cursor: pointer;
		box-shadow: none;
	}

	.body {
		display: grid;
		grid-template-columns: 248px minmax(0, 1fr);
		align-items: start;
		gap: clamp(24px, 3vw, 44px);
		margin-top: 24px;
	}

	/* Desktop: the panel is a quiet sidebar. Phones: the same panel opens as a bottom sheet. */
	.panel {
		position: sticky;
		top: calc(var(--header-h) + 92px);
		display: block;
		inset: auto;
		width: auto;
		height: auto;
		margin: 0;
		padding: 0;
		overflow: visible;
		border: 0;
		background: none;
		color: inherit;
	}

	.panel-head {
		display: none;
	}

	fieldset {
		display: grid;
		gap: 12px;
		margin: 0;
		padding: 0 0 22px;
		border: 0;
		border-bottom: 1px solid var(--line);
	}

	fieldset + fieldset {
		padding-top: 20px;
	}

	fieldset:last-child {
		border-bottom: 0;
	}

	legend {
		display: flex;
		align-items: center;
		gap: 8px;
		float: left;
		width: 100%;
		margin-bottom: 12px;
		padding: 0;
		font-size: var(--text-small);
		font-weight: 750;
	}

	legend + * {
		clear: left;
	}

	.sizes {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.size-chip {
		position: relative;
	}

	.size-chip input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.size-chip span {
		display: grid;
		min-width: 48px;
		height: 44px;
		padding: 0 12px;
		place-items: center;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-family: var(--font-mono);
		font-size: var(--text-meta);
		font-weight: 600;
		cursor: pointer;
		transition:
			border-color 160ms var(--ease-out),
			background-color 160ms var(--ease-out),
			color 160ms var(--ease-out);
	}

	.size-chip:hover span {
		border-color: var(--color-ink);
	}

	.size-chip input:checked + span {
		border-color: var(--color-ink);
		background: var(--color-ink);
		color: var(--color-paper);
	}

	.size-chip input:focus-visible + span {
		outline: 2px solid var(--color-moss);
		outline-offset: 2px;
	}

	.range {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: end;
		gap: 8px;
	}

	.range label {
		display: grid;
		gap: 4px;
	}

	.range .input {
		min-height: 44px;
		padding: 8px 12px;
	}

	.dash {
		padding-bottom: 12px;
		color: var(--color-ink-soft);
	}

	.switch {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 44px;
		cursor: pointer;
	}

	.switch > span {
		display: grid;
		gap: 2px;
	}

	.switch-label {
		font-size: var(--text-small);
		font-weight: 750;
	}

	.switch input {
		position: relative;
		flex: none;
		width: 46px;
		height: 28px;
		margin: 0;
		border: 0;
		border-radius: 999px;
		background: rgb(4 36 26 / 0.18);
		appearance: none;
		cursor: pointer;
		transition: background-color 200ms var(--ease-out);
	}

	.switch input::after {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--color-surface);
		box-shadow: 0 1px 3px rgb(4 36 26 / 0.3);
		content: '';
		transition: translate 200ms var(--ease-out);
	}

	.switch input:checked {
		background: var(--color-moss);
	}

	.switch input:checked::after {
		translate: 18px 0;
	}

	.panel-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-top: 16px;
	}

	.apply-phone {
		display: none;
	}

	/* With JavaScript, desktop filters apply on change, so the Apply button steps aside. */
	.panel-foot.enhanced .apply {
		display: none;
	}

	.results {
		min-width: 0;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0 0 20px;
		padding: 0;
		list-style: none;
	}

	.chips a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 36px;
		padding: 0 10px 0 14px;
		border-radius: 999px;
		background: var(--color-ivory);
		font-size: var(--text-small);
		font-weight: 600;
		text-decoration: none;
		transition: background-color 160ms var(--ease-out);
	}

	.chips a:hover {
		background: color-mix(in srgb, var(--color-ivory), var(--color-gold) 35%);
	}

	.chips .clear-all {
		padding: 0 12px;
		background: none;
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.more {
		display: grid;
		justify-items: center;
		gap: 12px;
		margin-top: 44px;
	}

	.count {
		display: grid;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		place-items: center;
		border-radius: 999px;
		background: var(--color-gold);
		color: var(--color-ink);
		font-family: var(--font-mono);
		font-size: var(--text-label);
		font-weight: 700;
	}

	@media (max-width: 900px) {
		.body {
			grid-template-columns: 1fr;
			margin-top: 18px;
		}

		.filter-toggle {
			display: inline-flex;
			flex: none;
			align-items: center;
			gap: 8px;
			min-height: 48px;
			padding: 0 16px;
			border: 1.5px solid var(--line-strong);
			border-radius: 999px;
			background: var(--color-surface);
			color: var(--color-ink);
			font: inherit;
			font-size: var(--text-small);
			font-weight: 650;
			cursor: pointer;
		}

		.search {
			max-width: none;
		}

		.panel:not(:popover-open) {
			display: none;
		}

		.panel {
			position: fixed;
			inset: auto 0 0;
			z-index: 50;
			max-height: 88svh;
			overflow: hidden;
			border-radius: var(--radius-lg) var(--radius-lg) 0 0;
			background: var(--color-surface);
			box-shadow: var(--lift);
		}

		.panel:popover-open {
			display: flex;
			flex-direction: column;
			animation: sheet-up 260ms var(--ease-out);
		}

		.panel::backdrop {
			background: rgb(4 36 26 / 0.42);
		}

		@keyframes sheet-up {
			from {
				translate: 0 40px;
				opacity: 0;
			}
		}

		.panel-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10px 10px 10px 20px;
			border-bottom: 1px solid var(--line);
		}

		.panel-head h2 {
			margin: 0;
			font-size: var(--text-h3);
			font-stretch: 85%;
			font-weight: 750;
		}

		.panel-close {
			display: grid;
			width: 44px;
			height: 44px;
			place-items: center;
			border: 0;
			border-radius: 50%;
			background: rgb(4 36 26 / 0.06);
			color: var(--color-ink);
			cursor: pointer;
		}

		.panel-scroll {
			flex: 1;
			overflow-y: auto;
			overscroll-behavior: contain;
			padding: 18px 20px;
		}

		.panel-foot {
			padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0px));
			border-top: 1px solid var(--line);
		}

		.panel-foot.enhanced .apply {
			display: inline-flex;
		}

		.apply {
			flex: 1;
		}

		.apply-phone {
			display: inline;
		}

		.apply-desk {
			display: none;
		}
	}

	@media (max-width: 600px) {
		.toolbar {
			flex-wrap: wrap;
			gap: 8px;
		}

		.search {
			flex-basis: 100%;
		}

		.filter-toggle {
			flex: 1;
			justify-content: center;
		}

		.sort {
			flex: 1;
			justify-content: center;
			margin-left: 0;
			padding: 0 10px;
		}

		.sort select {
			max-width: 100%;
			text-overflow: ellipsis;
		}

		.categories a {
			padding: 0 14px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.panel:popover-open {
			animation: none;
		}
	}
</style>
