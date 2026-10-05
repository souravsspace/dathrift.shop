<script lang="ts">
	import { onMount } from 'svelte';
	import AdminHeader from '../../../../lib/components/AdminHeader.svelte';
	import StatusStamp from '../../../../lib/components/StatusStamp.svelte';
	import { toWebp } from '../../../../lib/images/to-webp';
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
		featured: boolean;
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
	let photoPreview = $state('');
	let photoNote = $state('');
	let converting = $state(false);
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

	const megabytes = (bytes: number) =>
		bytes >= 1024 * 1024
			? `${(bytes / 1024 / 1024).toFixed(1)} MB`
			: `${Math.round(bytes / 1024)} KB`;

	// Any readable image is converted to WebP here, so the server only ever stores WebP.
	async function choosePhoto(file: File | undefined) {
		if (photoPreview) URL.revokeObjectURL(photoPreview);
		photoFile = null;
		photoPreview = photoNote = error = '';
		if (!file) return;
		converting = true;
		try {
			const converted = await toWebp(file);
			photoFile = converted.file;
			photoPreview = URL.createObjectURL(converted.file);
			photoNote = `${megabytes(file.size)} → ${megabytes(converted.file.size)} WebP · ${converted.width} × ${converted.height}`;
		} catch (reason) {
			error = reason instanceof Error ? reason.message : 'Could not read that image.';
		} finally {
			converting = false;
		}
	}

	async function setFeatured(featured: boolean) {
		if (!product) return;
		busy = true;
		message = error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}/feature`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ featured })
			});
			if (!response.ok) throw new Error('Feature failed.');
			product = { ...product, featured };
			message = featured ? 'Now leading the home page' : 'Removed from the home page';
		} catch {
			error = 'Could not change the home page. Only published, available pieces can lead it.';
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
			await choosePhoto(undefined);
			photoAlt = '';
			message = 'Photo uploaded';
		} catch {
			error = 'Could not upload photo. Check your connection and try again.';
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
	<title>{product?.name ?? 'Product editor'} — daThriftShop desk</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="admin-shell">
	<AdminHeader current="products" />
	<main class="admin-main admin-editor">
		<a class="admin-back" href="/admin">Back to products</a>
		{#if loading}
			<p>Loading piece…</p>
		{:else if product}
			<div class="admin-intro">
				<div>
					<h1>{product.name}</h1>
					<p>/{product.slug}</p>
					<div class="admin-stamps">
						<StatusStamp kind={product.publication_state} />
						{#if product.stock_state !== 'available'}<StatusStamp
								kind={product.stock_state === 'sold' ? 'sold' : 'reserved'}
							/>{/if}
						{#if product.featured}<span class="admin-chip">Home hero</span>{/if}
					</div>
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
								>Save details</button
							>{/if}
					</form>
				</section>
				<div class="admin-editor-side">
					<section class="admin-panel" aria-labelledby="photos-title">
						<div class="admin-panel-heading">
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
								<input
									id="photo-file"
									class="admin-drop-input"
									type="file"
									accept="image/*"
									onchange={(event) => choosePhoto(event.currentTarget.files?.[0])}
									required
								/><label class="admin-drop" for="photo-file">
									{#if photoPreview}<img src={photoPreview} alt="" />{/if}
									<span aria-live="polite">
										<strong>Add photo</strong>
										{converting
											? 'Converting to WebP…'
											: photoNote || 'Any image up to 10 MB. It is resized and converted to WebP.'}
									</span>
								</label><label for="photo-alt">Photo description</label><input
									id="photo-alt"
									bind:value={photoAlt}
									required
									maxlength="240"
									placeholder="e.g. Repaired hem on cream skirt"
								/><button type="submit" disabled={busy || converting || !photoFile}
									>Upload photo</button
								>
							</form>{/if}
					</section>
					<section class="admin-panel" aria-labelledby="publish-title">
						<div class="admin-panel-heading">
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
								rel="noopener">View public page</a
							>
							{#if product.featured}
								<p class="admin-success">Leads the home page</p>
								<button
									class="admin-action admin-action-outline"
									type="button"
									disabled={busy}
									onclick={() => setFeatured(false)}>Remove from home page</button
								>
							{:else if product.stock_state === 'available'}
								<button
									class="admin-action"
									type="button"
									disabled={busy}
									onclick={() => setFeatured(true)}>Feature on home page</button
								>
							{/if}
							<button
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
								<button type="submit" disabled={busy}>Mark sold externally</button>
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
