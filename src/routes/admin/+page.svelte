<script lang="ts">
	import { goto } from '$app/navigation';
	import AdminHeader from '../../lib/components/AdminHeader.svelte';
	import { slugify } from '../../lib/slug';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	type ProductRow = {
		id: string;
		slug: string;
		name: string;
		category: string;
		category_name: string | null;
		price_bdt: number;
		publication_state: 'draft' | 'published';
		stock_state: 'available' | 'reserved' | 'sold';
		featured?: boolean;
		size_label?: string | null;
		cover_key?: string | null;
	};
	type Status = 'draft' | 'live' | 'sold' | 'held';
	type MeasurementSet = 'top' | 'bottom' | 'none';
	type Category = { slug: string; name: string; measurement_set: MeasurementSet };

	const measurementLabels: Record<MeasurementSet, string> = {
		top: 'Chest and length',
		bottom: 'Waist and inseam',
		none: 'No measurements'
	};

	let { data }: { data: PageData } = $props();
	let products = $state<ProductRow[]>([]);
	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let listError = $state('');
	let saving = $state(false);
	let error = $state('');
	let name = $state('');
	let slug = $state('');
	// The slug follows the name until staff type their own.
	let slugTouched = $state(false);
	let category = $state('');
	let price = $state('');
	let categoryName = $state('');
	let measurementSet = $state<MeasurementSet>('top');
	let addingCategory = $state(false);
	let categoryMessage = $state('');
	let categoryError = $state('');
	let filter = $state<Status | 'all'>('all');
	let query = $state('');

	// One state per piece, in the order staff act on them.
	const statusOf = (product: ProductRow): Status =>
		product.stock_state === 'reserved'
			? 'held'
			: product.stock_state === 'sold'
				? 'sold'
				: product.publication_state === 'published'
					? 'live'
					: 'draft';
	const statusLabels: Record<Status, string> = {
		draft: 'Draft',
		live: 'Live',
		sold: 'Sold',
		held: 'Held'
	};
	const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
	const taka = new Intl.NumberFormat('en-BD');

	let counts = $derived(
		products.reduce(
			(total, product) => ({ ...total, [statusOf(product)]: total[statusOf(product)] + 1 }),
			{ draft: 0, live: 0, sold: 0, held: 0 } as Record<Status, number>
		)
	);
	let filters = $derived(
		(['all', 'draft', 'live', 'sold', 'held'] as const).filter(
			(key) => key === 'all' || key !== 'held' || counts.held > 0
		)
	);
	let shown = $derived(
		products.filter(
			(product) =>
				(filter === 'all' || statusOf(product) === filter) &&
				product.name.toLowerCase().includes(query.trim().toLowerCase())
		)
	);
	let summary = $derived(
		[
			plural(products.length, 'piece'),
			`${counts.live} live`,
			plural(counts.draft, 'draft'),
			`${counts.sold} sold`,
			...(counts.held ? [`${counts.held} held`] : [])
		].join(' · ')
	);

	async function loadProducts() {
		loading = true;
		listError = '';
		try {
			const response = await fetch('/admin/api/products');
			if (!response.ok) throw new Error('Could not load products.');
			products = await response.json();
		} catch {
			listError = 'Could not load pieces. Refresh to try again.';
		} finally {
			loading = false;
		}
	}

	async function loadCategories() {
		try {
			const response = await fetch('/admin/api/categories');
			if (!response.ok) throw new Error('Could not load categories.');
			categories = await response.json();
			if (!categories.some((item) => item.slug === category)) category = categories[0]?.slug ?? '';
		} catch {
			categoryError = 'Could not load categories. Refresh to try again.';
		}
	}

	onMount(() => {
		void loadProducts();
		void loadCategories();
	});

	function nameInput() {
		if (!slugTouched) slug = slugify(name);
	}

	async function createDraft(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		error = '';
		try {
			const response = await fetch('/admin/api/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, slug, category, price_bdt: Number(price) })
			});
			if (!response.ok) {
				const reason = await response.text();
				error =
					reason === 'Slug unavailable'
						? 'That slug is already used. Change it and try again.'
						: reason === 'Unknown category'
							? 'That category no longer exists. Pick another one.'
							: 'Could not create draft. Check the fields and try again.';
				return;
			}
			const draft = (await response.json()) as { id: string };
			await goto(`/admin/products/${draft.id}`);
		} catch {
			error = 'Could not create draft. Check your connection and try again.';
		} finally {
			saving = false;
		}
	}

	async function addCategory(event: SubmitEvent) {
		event.preventDefault();
		addingCategory = true;
		categoryMessage = categoryError = '';
		try {
			const response = await fetch('/admin/api/categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: categoryName, measurement_set: measurementSet })
			});
			if (!response.ok) {
				const reason = await response.text();
				categoryError =
					reason === 'Category exists'
						? 'A category with that name already exists.'
						: 'Use a name of 1–60 characters with at least one English letter or number.';
				return;
			}
			const added = (await response.json()) as Category;
			categories = [...categories, added].sort((a, b) => a.name.localeCompare(b.name));
			category = added.slug;
			categoryName = '';
			categoryMessage = `${added.name} added`;
		} catch {
			categoryError = 'Could not add the category. Check your connection and try again.';
		} finally {
			addingCategory = false;
		}
	}
</script>

<svelte:head>
	<title>Product desk — daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<AdminHeader current="products" />

	<main class="admin-main">
		<div class="admin-intro">
			<div>
				<h1>Product desk</h1>
				<p class="desk-summary">{loading ? 'Counting the rack…' : summary}</p>
			</div>
			<span class="admin-actor"
				>{data.actor === 'local-preview' ? 'Local preview' : data.actor}</span
			>
		</div>

		{#if data.actor === 'local-preview'}
			<div class="admin-local-note">
				Local preview · test data only. Do not use as live merchandise.
			</div>
		{/if}

		<div class="desk">
			<section class="admin-panel desk-new" aria-labelledby="create-title">
				<div class="admin-panel-heading">
					<h2 id="create-title">New piece</h2>
					<p>Start with the basics. Photos, measurements and the rest come next.</p>
				</div>
				<form onsubmit={createDraft}>
					<label for="draft-name">Name</label>
					<input
						id="draft-name"
						bind:value={name}
						oninput={nameInput}
						maxlength="160"
						required
						placeholder="e.g. Green linen shirt"
					/>
					<label for="draft-slug">Slug</label>
					<div class="admin-affix">
						<span aria-hidden="true">/products/</span>
						<input
							id="draft-slug"
							bind:value={slug}
							oninput={() => (slugTouched = true)}
							maxlength="160"
							required
							pattern="[a-z0-9]+(-[a-z0-9]+)*"
							autocapitalize="none"
							spellcheck="false"
							aria-describedby="draft-slug-hint"
						/>
					</div>
					<p class="admin-hint" id="draft-slug-hint">
						Made from the name. Change it freely until the piece goes live.
					</p>
					<div class="admin-form-pair">
						<div>
							<label for="draft-category">Category</label>
							<select id="draft-category" bind:value={category} required>
								{#each categories as item (item.slug)}
									<option value={item.slug}>{item.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="draft-price">Price (৳)</label>
							<div class="admin-affix">
								<span aria-hidden="true">৳</span>
								<input
									id="draft-price"
									type="number"
									inputmode="numeric"
									min="1"
									step="1"
									bind:value={price}
									required
									placeholder="1200"
								/>
							</div>
						</div>
					</div>
					<button type="submit" disabled={saving || !category}
						>{saving ? 'Creating…' : 'Create draft'}</button
					>
					{#if error}<p class="admin-error" role="alert">{error}</p>{/if}
				</form>
			</section>

			<section class="admin-panel desk-list" aria-labelledby="list-title">
				<div class="desk-toolbar">
					<h2 id="list-title">Pieces</h2>
					<input
						class="desk-search"
						type="search"
						aria-label="Find a piece"
						placeholder="Find a piece"
						bind:value={query}
					/>
					<button type="button" class="desk-refresh" onclick={loadProducts} disabled={loading}
						>Refresh</button
					>
				</div>
				<div class="desk-filters" role="group" aria-label="Show pieces">
					{#each filters as key (key)}
						<button type="button" aria-pressed={filter === key} onclick={() => (filter = key)}
							>{key === 'all' ? 'All' : statusLabels[key]}
							<span>{key === 'all' ? products.length : counts[key]}</span></button
						>
					{/each}
				</div>
				{#if loading}
					<p class="admin-list-state">Loading the rack…</p>
				{:else if listError}
					<p class="admin-error" role="alert">{listError}</p>
				{:else if products.length === 0}
					<p class="admin-list-state">No pieces yet. Create the first draft.</p>
				{:else if shown.length === 0}
					<p class="admin-list-state">No pieces match.</p>
				{:else}
					<ul class="desk-rows">
						{#each shown as product (product.id)}
							<li>
								<a
									class="desk-row"
									href="/admin/products/{product.id}"
									aria-label="Edit {product.name}"
								>
									{#if product.cover_key}<img
											src="/media/{product.cover_key}"
											alt={product.name}
											width="56"
											height="70"
											loading="lazy"
										/>{:else}<span class="desk-no-photo">No photo</span>{/if}
									<span class="desk-row-text">
										<strong>{product.name}</strong>
										<small>{product.category_name ?? product.category} / {product.slug}</small>
									</span>
									<span class="desk-row-price">৳{taka.format(product.price_bdt)}</span>
									<span class="desk-row-state">
										{#if product.featured}<span class="admin-chip">Home hero</span>{/if}
										<span class="desk-status desk-status-{statusOf(product)}"
											>{statusLabels[statusOf(product)]}</span
										>
									</span>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="admin-panel desk-categories" aria-labelledby="categories-title">
				<div class="admin-panel-heading">
					<h2 id="categories-title">Categories</h2>
					<p>Each one asks for the measurements its pieces need before going live.</p>
				</div>
				<ul class="admin-categories">
					{#each categories as item (item.slug)}
						<li>
							<strong>{item.name}</strong>
							<small>{measurementLabels[item.measurement_set]}</small>
						</li>
					{/each}
				</ul>
				<form onsubmit={addCategory}>
					<label for="category-name">Category name</label>
					<input
						id="category-name"
						bind:value={categoryName}
						maxlength="60"
						required
						placeholder="e.g. Sarees"
					/>
					<fieldset class="admin-choices">
						<legend>Measurements</legend>
						{#each Object.entries(measurementLabels) as [set, label] (set)}
							<label class="admin-choice">
								<input
									type="radio"
									name="measurement-set"
									value={set}
									bind:group={measurementSet}
								/>
								<span>{label}</span>
							</label>
						{/each}
					</fieldset>
					<button type="submit" class="admin-action-outline" disabled={addingCategory}
						>{addingCategory ? 'Adding…' : 'Add category'}</button
					>
					{#if categoryMessage}<p class="admin-success" role="status">{categoryMessage}</p>{/if}
					{#if categoryError}<p class="admin-error" role="alert">{categoryError}</p>{/if}
				</form>
			</section>
		</div>
	</main>
</div>
