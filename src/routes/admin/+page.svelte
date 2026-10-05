<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	type ProductRow = {
		id: string;
		slug: string;
		name: string;
		category: string;
		price_bdt: number;
		publication_state: 'draft' | 'published';
		stock_state: 'available' | 'reserved' | 'sold';
	};

	let { data }: { data: PageData } = $props();
	let products = $state<ProductRow[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let message = $state('');
	let error = $state('');
	let name = $state('');
	let slug = $state('');
	let category = $state('tops');
	let price = $state('');

	async function loadProducts() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/admin/api/products');
			if (!response.ok) throw new Error('Could not load products.');
			products = await response.json();
		} catch {
			error = 'Could not load products. Retry to refresh the desk.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadProducts();
	});

	async function createDraft(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		message = '';
		error = '';
		try {
			const response = await fetch('/admin/api/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, slug, category, price_bdt: Number(price) })
			});
			if (!response.ok) throw new Error('Could not create draft.');
			name = '';
			slug = '';
			price = '';
			message = 'Draft created';
			await loadProducts();
		} catch {
			error = 'Could not create draft. Check the fields and try again.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Product desk — dathrift</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<header class="admin-header">
		<a class="brand" href="/" aria-label="dathrift home">
			<img src="/brand/dathrift-logo.png" alt="" width="48" height="48" />
			<span>dathrift<span class="brand-period">.</span></span>
		</a>
		<span class="admin-private">Private product desk</span>
	</header>

	<main class="admin-main">
		<div class="admin-intro">
			<div>
				<p class="admin-eyebrow">Inventory / Staff only</p>
				<h1>Product desk</h1>
				<p>Create drafts before adding details and publishing. Nothing here reserves stock.</p>
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

		<div class="admin-columns">
			<section class="admin-panel" aria-labelledby="create-title">
				<div class="admin-panel-heading">
					<span>01 / Add a piece</span>
					<h2 id="create-title">New draft</h2>
				</div>
				<form onsubmit={createDraft}>
					<label for="draft-name">Name</label>
					<input
						id="draft-name"
						bind:value={name}
						maxlength="160"
						required
						placeholder="e.g. TEST ONLY — Linen shirt"
					/>
					<label for="draft-slug">Slug</label>
					<input
						id="draft-slug"
						bind:value={slug}
						maxlength="160"
						required
						pattern="[a-z0-9]+(-[a-z0-9]+)*"
						placeholder="e.g. test-linen-shirt"
					/>
					<p class="admin-hint">
						Lowercase letters, numbers and hyphens. Permanent after publishing.
					</p>
					<div class="admin-form-pair">
						<div>
							<label for="draft-category">Category</label>
							<select id="draft-category" bind:value={category}>
								<option value="tops">Tops</option>
								<option value="bottoms">Bottoms</option>
								<option value="outerwear">Outerwear</option>
								<option value="dresses">Dresses</option>
							</select>
						</div>
						<div>
							<label for="draft-price">Price in BDT</label>
							<input
								id="draft-price"
								type="number"
								min="1"
								step="1"
								bind:value={price}
								required
								placeholder="1200"
							/>
						</div>
					</div>
					<button type="submit" disabled={saving}
						>{saving ? 'Creating…' : 'Create draft'} <span aria-hidden="true">↗</span></button
					>
					{#if message}<p class="admin-success" role="status">{message}</p>{/if}
					{#if error}<p class="admin-error" role="alert">{error}</p>{/if}
				</form>
			</section>

			<section class="admin-panel admin-list" aria-labelledby="list-title">
				<div class="admin-panel-heading admin-list-heading">
					<div>
						<span>02 / Current inventory</span>
						<h2 id="list-title">All pieces</h2>
					</div>
					<button type="button" onclick={loadProducts} disabled={loading}>Refresh</button>
				</div>
				{#if loading}
					<p class="admin-list-state">Loading inventory…</p>
				{:else if products.length === 0}
					<p class="admin-list-state">No pieces yet. Create the first draft.</p>
				{:else}
					<ul>
						{#each products as product (product.id)}
							<li>
								<div>
									<strong>{product.name}</strong>
									<small>{product.category} / {product.slug}</small>
								</div>
								<div class="admin-row-meta">
									<span>৳{new Intl.NumberFormat('en-BD').format(product.price_bdt)}</span>
									<small>{product.publication_state} · {product.stock_state}</small>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	</main>
</div>
