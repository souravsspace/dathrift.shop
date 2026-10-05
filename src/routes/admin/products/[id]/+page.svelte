<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	type Photo = { position: number; r2_key: string; alt_text: string };
	type Product = {
		id: string;
		slug: string;
		name: string;
		category: 'tops' | 'bottoms' | 'outerwear' | 'dresses';
		price_bdt: number;
		publication_state: 'draft' | 'published';
		stock_state: 'available' | 'reserved' | 'sold';
		brand: string | null;
		description: string | null;
		condition_notes: string | null;
		size_label: string | null;
		measurements_json: string | null;
		fit_note: string | null;
		photos: Photo[];
	};

	let { data }: { data: PageData } = $props();
	let product = $state<Product | null>(null);
	let loading = $state(true);
	let busy = $state(false);
	let message = $state('');
	let error = $state('');
	let name = $state('');
	let category = $state<Product['category']>('tops');
	let price = $state('');
	let brand = $state('');
	let description = $state('');
	let condition = $state('');
	let size = $state('');
	let fit = $state('');
	let chest = $state('');
	let length = $state('');
	let waist = $state('');
	let inseam = $state('');
	let photoFile = $state<File | null>(null);
	let photoAlt = $state('');
	let saleReason = $state('');
	let newSlug = $state('');

	function assignProduct(value: Product) {
		product = value;
		name = value.name;
		category = value.category;
		price = String(value.price_bdt);
		brand = value.brand ?? '';
		description = value.description ?? '';
		condition = value.condition_notes ?? '';
		size = value.size_label ?? '';
		fit = value.fit_note ?? '';
		try {
			const measurements = JSON.parse(value.measurements_json ?? '{}') as Record<string, number>;
			chest = measurements.chest_cm ? String(measurements.chest_cm) : '';
			length = measurements.length_cm ? String(measurements.length_cm) : '';
			waist = measurements.waist_cm ? String(measurements.waist_cm) : '';
			inseam = measurements.inseam_cm ? String(measurements.inseam_cm) : '';
		} catch {
			chest = length = waist = inseam = '';
		}
	}

	async function loadProduct() {
		loading = true;
		error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}`);
			if (!response.ok) throw new Error('Could not load piece.');
			assignProduct(await response.json());
		} catch {
			error = 'Could not load this piece. Return to the desk and try again.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadProduct();
	});

	async function saveDetails(event: SubmitEvent) {
		event.preventDefault();
		if (!product) return;
		busy = true;
		message = error = '';
		const measurements =
			category === 'bottoms'
				? { waist_cm: Number(waist), inseam_cm: Number(inseam) }
				: { chest_cm: Number(chest), length_cm: Number(length) };
		try {
			const response = await fetch(`/admin/api/products/${data.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					category,
					price_bdt: Number(price),
					brand: brand || null,
					description: description || null,
					condition_notes: condition || null,
					size_label: size || null,
					measurements_json: JSON.stringify(measurements),
					fit_note: fit || null
				})
			});
			if (!response.ok) throw new Error('Save failed.');
			message = 'Draft details saved';
		} catch {
			error = 'Could not save details. Check fields and retry.';
		} finally {
			busy = false;
		}
	}

	async function uploadPhoto(event: SubmitEvent) {
		event.preventDefault();
		if (!product || !photoFile) return;
		busy = true;
		message = error = '';
		const body = new FormData();
		body.set('photo', photoFile);
		body.set('alt_text', photoAlt);
		body.set('position', String(product.photos.length + 1));
		try {
			const response = await fetch(`/admin/api/products/${data.id}/photos`, {
				method: 'POST',
				body
			});
			if (!response.ok) throw new Error('Upload failed.');
			product = { ...product, photos: [...product.photos, await response.json()] };
			photoFile = null;
			photoAlt = '';
			message = 'Photo uploaded';
		} catch {
			error = 'Could not upload photo. Use JPEG, PNG or WebP under 8 MB.';
		} finally {
			busy = false;
		}
	}

	async function setPublication(state: 'draft' | 'published') {
		if (!product) return;
		busy = true;
		message = error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}/publication`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ state })
			});
			if (!response.ok) throw new Error(await response.text());
			product = { ...product, publication_state: state };
			message = state === 'published' ? 'Piece published' : 'Piece unpublished';
		} catch (reason) {
			error =
				reason instanceof Error && reason.message === 'Incomplete product'
					? 'Complete details, measurements and at least one photo before publishing.'
					: 'Could not change publication. Refresh and try again.';
		} finally {
			busy = false;
		}
	}

	async function correctSlug(event: SubmitEvent) {
		event.preventDefault();
		if (!product) return;
		busy = true;
		message = error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}/slug`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: newSlug })
			});
			if (!response.ok) throw new Error(await response.text());
			product = { ...product, slug: ((await response.json()) as { slug: string }).slug };
			newSlug = '';
			message = 'Slug corrected. The old URL now redirects here.';
		} catch (reason) {
			error =
				reason instanceof Error && reason.message === 'Slug unavailable'
					? 'That slug is already used or reserved by a redirect.'
					: 'Could not correct the slug. Use lowercase letters, numbers and hyphens.';
		} finally {
			busy = false;
		}
	}

	async function recordExternalSale(event: SubmitEvent) {
		event.preventDefault();
		if (!product || product.stock_state !== 'available') return;
		busy = true;
		message = error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}/external-sale`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason: saleReason })
			});
			if (!response.ok) throw new Error('Sale unavailable');
			product = { ...product, stock_state: 'sold' };
			saleReason = '';
			message = 'Recorded as sold externally';
		} catch {
			error =
				'Could not record sale. The piece may already be held or sold; refresh before retrying.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{product?.name ?? 'Product editor'} — dathrift desk</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<header class="admin-header">
		<a class="brand" href="/" aria-label="dathrift home"
			><img src="/brand/dathrift-logo.png" alt="" width="48" height="48" /><span
				>dathrift<span class="brand-period">.</span></span
			></a
		>
		<a class="admin-back" href="/admin">← Product desk</a>
	</header>
	<main class="admin-main admin-editor">
		{#if loading}
			<p>Loading piece…</p>
		{:else if product}
			<div class="admin-intro">
				<div>
					<p class="admin-eyebrow">Edit piece / {product.slug}</p>
					<h1>{product.name}</h1>
					<p>{product.publication_state} · {product.stock_state} · One sellable unit</p>
				</div>
				<span class="admin-actor"
					>{data.actor === 'local-preview' ? 'Local preview' : data.actor}</span
				>
			</div>
			{#if data.actor === 'local-preview'}<div class="admin-local-note">
					Local preview · test data only. Do not use as live merchandise.
				</div>{/if}
			<div class="admin-columns">
				<section class="admin-panel" aria-labelledby="details-title">
					<div class="admin-panel-heading">
						<span>01 / Garment record</span>
						<h2 id="details-title">Details & fit</h2>
					</div>
					<form onsubmit={saveDetails}>
						<label for="edit-name">Name</label><input
							id="edit-name"
							bind:value={name}
							required
							maxlength="160"
							disabled={product.publication_state !== 'draft'}
						/>
						<div class="admin-form-pair">
							<div>
								<label for="edit-category">Category</label><select
									id="edit-category"
									bind:value={category}
									disabled={product.publication_state !== 'draft'}
									><option value="tops">Tops</option><option value="bottoms">Bottoms</option><option
										value="outerwear">Outerwear</option
									><option value="dresses">Dresses</option></select
								>
							</div>
							<div>
								<label for="edit-price">Price in BDT</label><input
									id="edit-price"
									type="number"
									min="1"
									step="1"
									bind:value={price}
									disabled={product.publication_state !== 'draft'}
								/>
							</div>
						</div>
						<label for="edit-brand">Brand (optional)</label><input
							id="edit-brand"
							bind:value={brand}
							disabled={product.publication_state !== 'draft'}
						/>
						<label for="edit-description">Description</label><textarea
							id="edit-description"
							bind:value={description}
							rows="4"
							disabled={product.publication_state !== 'draft'}></textarea>
						<label for="edit-condition">Condition and flaws</label><textarea
							id="edit-condition"
							bind:value={condition}
							rows="3"
							disabled={product.publication_state !== 'draft'}></textarea>
						<label for="edit-size">Tagged size</label><input
							id="edit-size"
							bind:value={size}
							disabled={product.publication_state !== 'draft'}
						/>
						<div class="admin-form-pair">
							{#if category === 'bottoms'}<div>
									<label for="edit-waist">Waist (cm)</label><input
										id="edit-waist"
										type="number"
										min="0"
										step="0.1"
										bind:value={waist}
										disabled={product.publication_state !== 'draft'}
									/>
								</div>
								<div>
									<label for="edit-inseam">Inseam (cm)</label><input
										id="edit-inseam"
										type="number"
										min="0"
										step="0.1"
										bind:value={inseam}
										disabled={product.publication_state !== 'draft'}
									/>
								</div>{:else}<div>
									<label for="edit-chest">Chest (cm)</label><input
										id="edit-chest"
										type="number"
										min="0"
										step="0.1"
										bind:value={chest}
										disabled={product.publication_state !== 'draft'}
									/>
								</div>
								<div>
									<label for="edit-length">Length (cm)</label><input
										id="edit-length"
										type="number"
										min="0"
										step="0.1"
										bind:value={length}
										disabled={product.publication_state !== 'draft'}
									/>
								</div>{/if}
						</div>
						<label for="edit-fit">Fit note</label><textarea
							id="edit-fit"
							bind:value={fit}
							rows="2"
							disabled={product.publication_state !== 'draft'}></textarea>
						{#if product.publication_state === 'draft'}<button type="submit" disabled={busy}
								>Save details <span aria-hidden="true">↗</span></button
							>{/if}
					</form>
				</section>
				<div class="admin-editor-side">
					<section class="admin-panel" aria-labelledby="photos-title">
						<div class="admin-panel-heading">
							<span>02 / Visual record</span>
							<h2 id="photos-title">Photos</h2>
						</div>
						<p class="admin-hint">
							1–8 ordered photos. Show every flaw; describe the image for accessibility.
						</p>
						<div class="admin-photo-grid">
							{#each product.photos as photo (photo.position)}<figure>
									<img src="/media/{photo.r2_key}" alt={photo.alt_text} />
									<figcaption>
										{String(photo.position).padStart(2, '0')} / {photo.alt_text}
									</figcaption>
								</figure>{/each}
						</div>
						{#if product.publication_state === 'draft' && product.photos.length < 8}<form
								onsubmit={uploadPhoto}
							>
								<label for="photo-file">Add photo</label><input
									id="photo-file"
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onchange={(event) => (photoFile = event.currentTarget.files?.[0] ?? null)}
									required
								/><label for="photo-alt">Photo description</label><input
									id="photo-alt"
									bind:value={photoAlt}
									required
									maxlength="240"
									placeholder="e.g. Repaired hem on cream skirt"
								/><button type="submit" disabled={busy || !photoFile}
									>Upload photo <span aria-hidden="true">↗</span></button
								>
							</form>{/if}
					</section>
					<section class="admin-panel" aria-labelledby="publish-title">
						<div class="admin-panel-heading">
							<span>03 / Visibility</span>
							<h2 id="publish-title">Publication</h2>
						</div>
						<p class="admin-hint">
							Publishing makes this one piece visible. It does not reserve or sell it.
						</p>
						{#if product.publication_state === 'draft'}<button
								class="admin-action"
								type="button"
								disabled={busy || product.stock_state !== 'available'}
								onclick={() => setPublication('published')}>Publish piece</button
							>{:else}<a
								class="admin-public-link"
								href="/products/{product.slug}"
								target="_blank"
								rel="noopener">View public page ↗</a
							><button
								class="admin-action admin-action-outline"
								type="button"
								disabled={busy || product.stock_state !== 'available'}
								onclick={() => setPublication('draft')}>Unpublish piece</button
							>
							<form class="admin-slug-form" onsubmit={correctSlug}>
								<label for="corrected-slug">Corrected slug</label>
								<input
									id="corrected-slug"
									bind:value={newSlug}
									required
									maxlength="160"
									pattern="[a-z0-9]+(-[a-z0-9]+)*"
									placeholder={product.slug}
								/>
								<p class="admin-hint">
									For typo fixes only. The current URL keeps redirecting to the new one.
								</p>
								<button type="submit" disabled={busy}>Correct slug</button>
							</form>{/if}
					</section>
					<section class="admin-panel" aria-labelledby="external-sale-title">
						<div class="admin-panel-heading">
							<span>04 / Offline sale</span>
							<h2 id="external-sale-title">Sold elsewhere</h2>
						</div>
						<p class="admin-hint">
							Only use after a completed sale outside this website. This permanently consumes the
							one sellable unit; it never marks a website order paid.
						</p>
						{#if product.stock_state === 'available'}
							<form onsubmit={recordExternalSale}>
								<label for="external-sale-reason">External sale reason</label>
								<input
									id="external-sale-reason"
									bind:value={saleReason}
									required
									maxlength="1000"
									placeholder="Where and why this piece sold"
								/>
								<button type="submit" disabled={busy}
									>Mark sold externally <span aria-hidden="true">↗</span></button
								>
							</form>
						{:else}
							<p class="admin-list-state">
								This piece is {product.stock_state}; external sale unavailable.
							</p>
						{/if}
					</section>
				</div>
			</div>
			{#if message}<p class="admin-success admin-feedback" role="status">{message}</p>{/if}
			{#if error}<p class="admin-error admin-feedback" role="alert">{error}</p>{/if}
		{:else}
			<h1>Piece unavailable</h1>
			<p>{error}</p>
			<a href="/admin">Return to product desk</a>
		{/if}
	</main>
</div>
