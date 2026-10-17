<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AdminHeader from '../../../../lib/components/AdminHeader.svelte';
	import AdminToast from '../../../../lib/components/AdminToast.svelte';
	import SocialPosts from '../../../../lib/components/SocialPosts.svelte';
	import StatusStamp from '../../../../lib/components/StatusStamp.svelte';
	import { toWebp } from '../../../../lib/images/to-webp';
	import { slugInput, slugify } from '../../../../lib/slug';
	import type { PageData } from './$types';

	type Photo = { position: number; r2_key: string; alt_text: string };
	// A picked photo waits in the tray until it is converted and uploaded.
	type Pending = {
		id: string;
		name: string;
		status: 'converting' | 'ready' | 'uploading' | 'failed';
		webp: File | null;
		preview: string;
		note: string;
	};
	type MeasurementSet = 'top' | 'bottom' | 'none';
	type Category = { slug: string; name: string; measurement_set: MeasurementSet };
	type Product = {
		id: string;
		code: string | null;
		slug: string;
		name: string;
		category: string;
		category_name: string | null;
		measurement_set: MeasurementSet | null;
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
		// Sold, ordered or sold elsewhere: such a piece is archived, never deleted.
		has_history: boolean;
		photos: Photo[];
	};

	const MAX_PHOTOS = 10;

	let { data }: { data: PageData } = $props();
	let product = $state<Product | null>(null);
	let categories = $state<Category[]>([]);
	let loading = $state(true);
	let busy = $state(false);
	let message = $state('');
	let error = $state('');
	let name = $state('');
	let category = $state('');
	// Measurements follow the category picked in the form, before it is saved.
	let measurementSet = $derived<MeasurementSet | null>(
		categories.find((item) => item.slug === category)?.measurement_set ??
			(category === product?.category ? (product?.measurement_set ?? null) : null)
	);
	let categoryLabel = $derived(
		categories.find((item) => item.slug === category)?.name ?? product?.category_name ?? category
	);
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
	let pending = $state<Pending[]>([]);
	let dragging = $state(false);
	let converting = $derived(pending.some((item) => item.status === 'converting'));
	let uploading = $derived(pending.some((item) => item.status === 'uploading'));
	let ready = $derived(pending.filter((item) => item.webp && item.status !== 'uploading'));
	let room = $derived(MAX_PHOTOS - (product?.photos.length ?? 0) - pending.length);
	let saleReason = $state('');
	let newSlug = $state('');
	let draftSlug = $state('');
	let confirmingPhoto = $state('');
	let confirmingRemoval = $state(false);
	// A unit held in someone's checkout must not change under them.
	let held = $derived(product?.stock_state === 'reserved');
	let live = $derived(product?.publication_state === 'published');
	// The save bar says when the form differs from what was last loaded or saved.
	let fields = $derived(
		JSON.stringify([
			name,
			category,
			price,
			brand,
			description,
			condition,
			size,
			fit,
			chest,
			length,
			waist,
			inseam
		])
	);
	let savedFields = $state('');
	let unsaved = $derived(!!product && fields !== savedFields);

	function assignProduct(value: Product) {
		product = value;
		draftSlug = value.slug;
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
			chest = measurements.chest_in ? String(measurements.chest_in) : '';
			length = measurements.length_in ? String(measurements.length_in) : '';
			waist = measurements.waist_in ? String(measurements.waist_in) : '';
			inseam = measurements.inseam_in ? String(measurements.inseam_in) : '';
		} catch {
			chest = length = waist = inseam = '';
		}
		savedFields = fields;
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

	async function loadCategories() {
		try {
			const response = await fetch('/admin/api/categories');
			if (response.ok) categories = await response.json();
		} catch {
			// The current category still shows; only switching categories needs the list.
		}
	}

	onMount(() => {
		void loadProduct();
		void loadCategories();
	});

	async function saveDetails(event: SubmitEvent) {
		event.preventDefault();
		if (!product) return;
		busy = true;
		message = error = '';
		const measurements =
			measurementSet === 'bottom'
				? { waist_in: Number(waist), inseam_in: Number(inseam) }
				: measurementSet === 'top'
					? { chest_in: Number(chest), length_in: Number(length) }
					: null;
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
					measurements_json: measurements && JSON.stringify(measurements),
					fit_note: fit || null
				})
			});
			if (!response.ok) throw new Error(await response.text());
			product = {
				...product,
				name: name.trim(),
				category,
				category_name: categoryLabel,
				measurement_set: measurementSet,
				price_bdt: Number(price),
				brand: brand || null,
				description: description || null,
				condition_notes: condition || null,
				size_label: size || null,
				measurements_json: measurements && JSON.stringify(measurements),
				fit_note: fit || null
			};
			savedFields = fields;
			message = live ? 'Live page updated' : 'Draft details saved';
		} catch (reason) {
			const text = reason instanceof Error ? reason.message : '';
			error =
				text === 'Incomplete product'
					? 'A live piece needs a name, price, the measurements in half inches and a photo. Fill in what is missing, or unpublish the piece first.'
					: text === 'Product held'
						? heldMessage
						: 'Could not save details. Check fields and retry.';
		} finally {
			busy = false;
		}
	}

	const heldMessage =
		'A buyer is paying for this piece right now. Editing, photos and removal unlock when the hold ends.';

	const megabytes = (bytes: number) =>
		bytes >= 1024 * 1024
			? `${(bytes / 1024 / 1024).toFixed(1)} MB`
			: `${Math.round(bytes / 1024)} KB`;

	// Any readable image is converted to WebP here, so the server only ever stores WebP. Photos
	// convert one at a time: HEIC decoding is heavy and phones run out of memory doing several.
	async function addPhotos(files: File[]) {
		if (!product || held || !files.length) return;
		message = error = '';
		const taken = files.slice(0, Math.max(0, room));
		if (taken.length < files.length)
			error =
				room > 0
					? `A piece holds ${MAX_PHOTOS} photos, so only the first ${taken.length} were added.`
					: `A piece holds ${MAX_PHOTOS} photos. Remove one before adding more.`;
		const added = taken.map((file) => ({
			id: crypto.randomUUID(),
			name: file.name,
			status: 'converting' as const,
			webp: null,
			preview: '',
			note: ''
		}));
		pending.push(...added);
		for (const [index, file] of taken.entries()) {
			const item = pending.find((entry) => entry.id === added[index].id);
			if (!item) continue;
			try {
				const converted = await toWebp(file);
				item.webp = converted.file;
				item.preview = URL.createObjectURL(converted.file);
				item.note = `${converted.width} × ${converted.height} · ${megabytes(converted.file.size)}`;
				item.status = 'ready';
			} catch (reason) {
				item.status = 'failed';
				item.note = reason instanceof Error ? reason.message : 'Could not read that image.';
			}
		}
	}

	function dropPending(id: string) {
		const item = pending.find((entry) => entry.id === id);
		if (item?.preview) URL.revokeObjectURL(item.preview);
		pending = pending.filter((entry) => entry.id !== id);
	}

	// Uploads run in order because each photo takes the next position; a failed one stays in the
	// tray with a Retry while the rest carry on.
	async function uploadPhotos(items: Pending[]) {
		if (!product) return;
		busy = true;
		message = error = '';
		let done = 0;
		let failed = 0;
		for (const item of items) {
			if (!product || !item.webp) continue;
			item.status = 'uploading';
			const body = new FormData();
			body.set('photo', item.webp);
			body.set('position', String(product.photos.length + 1));
			try {
				const response = await fetch(`/admin/api/products/${data.id}/photos`, {
					method: 'POST',
					body
				});
				if (response.status === 409) {
					item.status = 'failed';
					item.note = 'Held by a buyer';
					error = heldMessage;
					break;
				}
				if (!response.ok) throw new Error('Upload failed');
				product = { ...product, photos: [...product.photos, await response.json()] };
				dropPending(item.id);
				done += 1;
			} catch {
				item.status = 'failed';
				item.note = 'Upload failed';
				failed += 1;
			}
		}
		if (failed)
			error = `${failed === 1 ? 'One photo' : `${failed} photos`} did not upload. Check your connection, then tap Retry.`;
		else if (done) message = done === 1 ? 'Photo uploaded' : `${done} photos uploaded`;
		busy = false;
	}

	function dropFiles(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		void addPhotos([...(event.dataTransfer?.files ?? [])]);
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

	async function makeCover(photo: Photo) {
		if (!product) return;
		busy = true;
		message = error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}/photos/cover`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ r2_key: photo.r2_key })
			});
			if (!response.ok) throw new Error('Cover failed.');
			product = { ...product, photos: await response.json() };
			message = 'Cover photo changed';
		} catch {
			error = 'Could not change the cover photo. Refresh and try again.';
		} finally {
			busy = false;
		}
	}

	async function removePhoto(photo: Photo) {
		if (!product) return;
		busy = true;
		message = error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}/photos`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ r2_key: photo.r2_key })
			});
			if (!response.ok) throw new Error(await response.text());
			product = { ...product, photos: await response.json() };
			message = 'Photo removed';
		} catch (reason) {
			const text = reason instanceof Error ? reason.message : '';
			error =
				text === 'Last photo'
					? 'A live piece keeps at least one photo. Add another first, or unpublish the piece.'
					: text === 'Product held'
						? heldMessage
						: 'Could not remove the photo. Refresh and try again.';
		} finally {
			confirmingPhoto = '';
			busy = false;
		}
	}

	async function removePiece() {
		if (!product) return;
		busy = true;
		message = error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}`, { method: 'DELETE' });
			if (!response.ok) throw new Error(await response.text());
			await goto('/admin');
		} catch (reason) {
			error =
				reason instanceof Error && reason.message === 'Product held'
					? heldMessage
					: 'Could not remove the piece. Refresh and try again.';
			confirmingRemoval = false;
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
					? 'Save the measurements in half inches and add at least one photo before publishing.'
					: reason instanceof Error && reason.message === 'Product held'
						? heldMessage
						: 'Could not change publication. Refresh and try again.';
		} finally {
			busy = false;
		}
	}

	async function changeSlug(event: SubmitEvent) {
		event.preventDefault();
		if (!product) return;
		const draft = product.publication_state === 'draft';
		const slug = slugify(draft ? draftSlug : newSlug);
		if (!slug) {
			error = 'Type a slug with English letters or numbers, like green-linen-shirt.';
			return;
		}
		busy = true;
		message = error = '';
		try {
			const response = await fetch(`/admin/api/products/${data.id}/slug`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug })
			});
			if (!response.ok) throw new Error(await response.text());
			product = { ...product, slug: ((await response.json()) as { slug: string }).slug };
			draftSlug = product.slug;
			newSlug = '';
			message = draft ? 'Slug changed' : 'Slug corrected. The old URL now redirects here.';
		} catch (reason) {
			error =
				reason instanceof Error && reason.message === 'Slug unavailable'
					? 'That slug is already used or reserved by a redirect.'
					: 'Could not change the slug. Use lowercase letters, numbers and hyphens.';
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
		<a class="admin-back" href="/admin"
			><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>Back to
			products</a
		>
		{#if loading}
			<p>Loading piece…</p>
		{:else if product}
			<header class="admin-head">
				<h1>{product.name}</h1>
				<p class="admin-head-meta">
					{#if product.code}<span class="editor-code">{product.code}</span>{/if}
					<span class="admin-head-path">/products/{product.slug}</span>
					{#if data.actor !== 'local-preview'}<span class="admin-actor">{data.actor}</span>{/if}
				</p>
				<div class="admin-stamps">
					<StatusStamp kind={product.publication_state} />
					{#if product.stock_state !== 'available'}<StatusStamp
							kind={product.stock_state === 'sold' ? 'sold' : 'reserved'}
						/>{/if}
					{#if product.featured}<span class="admin-chip">Home hero</span>{/if}
				</div>
			</header>
			{#if data.actor === 'local-preview'}<div class="admin-local-note">
					Local preview · test data only. Do not use as live merchandise.
				</div>{/if}
			{#if held}<p class="admin-held-note" role="status">{heldMessage}</p>{/if}
			<div class="admin-layout">
				<div class="admin-layout-main">
					<section class="admin-panel" aria-labelledby="photos-title">
						<div class="admin-panel-head">
							<h2 id="photos-title">Photos</h2>
							<p>
								{product.photos.length} of {MAX_PHOTOS} photos{pending.length
									? ` · ${pending.length} new`
									: ''}
							</p>
						</div>
						<p class="admin-hint">The cover shows first in the shop. Show every flaw.</p>
						<div
							class="editor-photos"
							class:editor-dragging={dragging}
							role="group"
							aria-label="Photos of this piece"
							ondragover={(event) => {
								if (held || room <= 0) return;
								event.preventDefault();
								dragging = true;
							}}
							ondragleave={(event) => {
								if (!event.currentTarget.contains(event.relatedTarget as Node)) dragging = false;
							}}
							ondrop={dropFiles}
						>
							{#each product.photos as photo (photo.r2_key)}<figure class="editor-photo">
									<div class="editor-photo-frame">
										<img
											src="/media/{photo.r2_key}"
											alt={photo.alt_text || `${product.name}, photo ${photo.position}`}
										/>
										{#if photo.position === 1}<span class="admin-chip editor-cover-chip">Cover</span
											>{/if}
										{#if !held}
											{#if confirmingPhoto === photo.r2_key}<div class="editor-photo-confirm">
													<button
														type="button"
														class="admin-danger-button"
														disabled={busy}
														aria-label="Confirm removing photo {photo.position}"
														onclick={() => removePhoto(photo)}>Remove</button
													><button
														type="button"
														class="editor-keep-button"
														aria-label="Keep photo {photo.position}"
														onclick={() => (confirmingPhoto = '')}>Keep</button
													>
												</div>{:else}<button
													type="button"
													class="editor-photo-remove"
													disabled={busy || (live && product.photos.length === 1)}
													aria-label="Remove photo {photo.position}"
													onclick={() => (confirmingPhoto = photo.r2_key)}
													><svg viewBox="0 0 16 16" aria-hidden="true"
														><path d="M4 4l8 8M12 4l-8 8" /></svg
													></button
												>{/if}
										{/if}
									</div>
									{#if photo.position !== 1}<button
											type="button"
											class="admin-cover-button"
											disabled={busy || held}
											aria-label="Make photo {photo.position} the cover"
											onclick={() => makeCover(photo)}>Make cover</button
										>{/if}
								</figure>{/each}
							{#each pending as item (item.id)}<figure
									class="editor-photo editor-pending"
									data-status={item.status}
								>
									<div class="editor-photo-frame">
										{#if item.preview}<img
												src={item.preview}
												alt="New photo {item.name}"
											/>{:else}<span class="editor-pending-blank" aria-hidden="true"></span>{/if}
										<span class="editor-pending-state" role="status"
											>{item.status === 'converting'
												? 'Converting…'
												: item.status === 'uploading'
													? 'Uploading…'
													: item.status === 'ready'
														? 'Ready'
														: item.webp
															? 'Not uploaded'
															: 'Unreadable'}</span
										>
										{#if item.status !== 'uploading'}<button
												type="button"
												class="editor-photo-remove"
												disabled={busy}
												aria-label="Drop new photo {item.name}"
												onclick={() => dropPending(item.id)}
												><svg viewBox="0 0 16 16" aria-hidden="true"
													><path d="M4 4l8 8M12 4l-8 8" /></svg
												></button
											>{/if}
									</div>
									{#if item.status === 'failed' && item.webp}<button
											type="button"
											class="admin-cover-button"
											disabled={busy}
											onclick={() => uploadPhotos([item])}>Retry</button
										>{:else if item.status === 'failed'}<small class="editor-pending-note"
											>{item.note}</small
										>{/if}
								</figure>{/each}
							{#if !held && room > 0}<input
									id="photo-file"
									class="admin-drop-input"
									type="file"
									accept="image/*,.heic,.heif"
									multiple
									onchange={(event) => {
										void addPhotos([...(event.currentTarget.files ?? [])]);
										event.currentTarget.value = '';
									}}
								/><label class="editor-add" for="photo-file">
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
									<span>Add photos</span>
								</label>{/if}
						</div>
						{#if live && !held && product.photos.length === 1}<p class="admin-hint">
								A live piece keeps at least one photo.
							</p>{/if}
						{#if !held}<div class="editor-upload">
								<p aria-live="polite">
									{converting
										? 'Converting to WebP…'
										: uploading
											? 'Uploading in order, one at a time…'
											: ready.length
												? `${ready.length} new ${ready.length === 1 ? 'photo' : 'photos'} ready. Tap X to drop one before uploading.`
												: 'Pick several photos at once, or drop them here. Up to 10 MB each, iPhone HEIC included; each is resized and converted to WebP.'}
								</p>
								{#if pending.length}<button
										type="button"
										class="admin-action"
										disabled={busy || converting || !ready.length}
										onclick={() => uploadPhotos(ready)}
										>{uploading
											? 'Uploading…'
											: ready.length > 1
												? `Upload all ${ready.length}`
												: 'Upload photo'}</button
									>{/if}
							</div>{/if}
					</section>
					<section class="admin-panel" aria-labelledby="details-title">
						<div class="admin-panel-head">
							<h2 id="details-title">Details & fit</h2>
						</div>
						<form class="editor-form" onsubmit={saveDetails}>
							<fieldset>
								<legend>Basics</legend>
								<label for="edit-name">Name</label><input
									id="edit-name"
									bind:value={name}
									required
									maxlength="160"
									disabled={held}
								/>
								<div class="admin-form-pair">
									<div>
										<label for="edit-category">Category</label><select
											id="edit-category"
											bind:value={category}
											disabled={held}
										>
											{#each categories.length ? categories : [{ slug: product.category, name: categoryLabel }] as item (item.slug)}
												<option value={item.slug}>{item.name}</option>
											{/each}
										</select>
									</div>
									<div>
										<label for="edit-price">Price (৳)</label>
										<div class="admin-affix">
											<span aria-hidden="true">৳</span>
											<input
												id="edit-price"
												type="number"
												inputmode="numeric"
												min="1"
												step="1"
												bind:value={price}
												disabled={held}
											/>
										</div>
									</div>
								</div>
								<label for="edit-brand">Brand <span class="editor-optional">(optional)</span></label
								><input id="edit-brand" bind:value={brand} disabled={held} />
							</fieldset>
							<fieldset>
								<legend>Size and measurements</legend>
								<label for="edit-size"
									>Tagged size <span class="editor-optional">(optional)</span></label
								><input id="edit-size" bind:value={size} disabled={held} />
								{#if measurementSet === 'none'}
									<p class="admin-hint">{categoryLabel} need no measurements.</p>
								{:else}
									<div class="admin-form-pair">
										{#if measurementSet === 'bottom'}<div>
												<label for="edit-waist">Waist (in)</label><input
													id="edit-waist"
													type="number"
													inputmode="decimal"
													min="0.5"
													step="0.5"
													bind:value={waist}
													disabled={held}
												/>
											</div>
											<div>
												<label for="edit-inseam">Inseam (in)</label><input
													id="edit-inseam"
													type="number"
													inputmode="decimal"
													min="0.5"
													step="0.5"
													bind:value={inseam}
													disabled={held}
												/>
											</div>{:else}<div>
												<label for="edit-chest">Chest (in)</label><input
													id="edit-chest"
													type="number"
													inputmode="decimal"
													min="0.5"
													step="0.5"
													bind:value={chest}
													disabled={held}
												/>
											</div>
											<div>
												<label for="edit-length">Length (in)</label><input
													id="edit-length"
													type="number"
													inputmode="decimal"
													min="0.5"
													step="0.5"
													bind:value={length}
													disabled={held}
												/>
											</div>{/if}
									</div>
									<p class="admin-hint">
										Needed to publish. Measured on the garment, to the nearest half inch.
									</p>
								{/if}
							</fieldset>
							<fieldset>
								<legend>Notes for buyers</legend>
								<label for="edit-description"
									>Description <span class="editor-optional">(optional)</span></label
								><textarea id="edit-description" bind:value={description} rows="3" disabled={held}
								></textarea>
								<label for="edit-condition"
									>Condition and flaws <span class="editor-optional">(optional)</span></label
								><textarea id="edit-condition" bind:value={condition} rows="3" disabled={held}
								></textarea>
								<label for="edit-fit"
									>Fit note <span class="editor-optional">(optional)</span></label
								><textarea id="edit-fit" bind:value={fit} rows="2" disabled={held}></textarea>
							</fieldset>
							{#if !held}<div class="editor-savebar">
									<p class:editor-unsaved={unsaved}>
										{unsaved
											? 'Unsaved changes'
											: live
												? 'Live page is up to date'
												: 'Draft is up to date'}
									</p>
									<button type="submit" disabled={busy}
										>{live ? 'Save live page' : 'Save details'}</button
									>
								</div>{/if}
						</form>
					</section>
				</div>
				<aside class="admin-layout-side">
					<section class="admin-panel" aria-labelledby="publish-title">
						<div class="admin-panel-head">
							<h2 id="publish-title">Publication</h2>
						</div>
						{#if product.publication_state === 'draft'}
							<p class="admin-hint">
								Publishing makes this one piece visible. It does not reserve or sell it.
							</p>
							<button
								class="admin-action"
								type="button"
								disabled={busy || product.stock_state !== 'available'}
								onclick={() => setPublication('published')}>Publish piece</button
							>
						{:else}
							<div class="admin-actions">
								<a
									class="admin-action admin-action-outline"
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
										class="admin-action admin-action-outline"
										type="button"
										disabled={busy}
										onclick={() => setFeatured(true)}>Feature on home page</button
									>
								{/if}
								<button
									class="admin-action admin-action-outline"
									type="button"
									disabled={busy || held}
									onclick={() => setPublication('draft')}>Unpublish piece</button
								>
							</div>
						{/if}
					</section>
					<section class="admin-panel editor-more" aria-labelledby="more-title">
						<div class="admin-panel-head">
							<h2 id="more-title">Other actions</h2>
						</div>
						<details>
							<summary>Page link</summary>
							{#if product.publication_state === 'draft'}<form
									class="editor-disclosure"
									onsubmit={changeSlug}
								>
									<label for="draft-slug">Slug</label>
									<div class="admin-affix">
										<span aria-hidden="true">/products/</span>
										<input
											id="draft-slug"
											bind:value={draftSlug}
											oninput={() => (draftSlug = slugInput(draftSlug))}
											required
											maxlength="160"
											autocapitalize="none"
											spellcheck="false"
										/>
									</div>
									<p class="admin-hint">
										Change it freely until publishing. After that, a change keeps the old link
										redirecting here.
									</p>
									<button type="submit" disabled={busy || draftSlug === product.slug}
										>Change slug</button
									>
								</form>{:else}<form class="editor-disclosure" onsubmit={changeSlug}>
									<label for="corrected-slug">Corrected slug</label>
									<input
										id="corrected-slug"
										bind:value={newSlug}
										oninput={() => (newSlug = slugInput(newSlug))}
										required
										maxlength="160"
										autocapitalize="none"
										spellcheck="false"
										placeholder={product.slug}
									/>
									<p class="admin-hint">
										For typo fixes only. The current URL keeps redirecting to the new one.
									</p>
									<button type="submit" disabled={busy}>Correct slug</button>
								</form>{/if}
						</details>
						<details>
							<summary>Sold elsewhere</summary>
							<div class="editor-disclosure">
								<p class="admin-hint">
									Only use after a completed sale outside this website. This permanently consumes
									the one sellable unit; it never marks a website order paid.
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
							</div>
						</details>
						<details class="editor-danger">
							<summary>Remove piece</summary>
							<div class="editor-disclosure">
								{#if product.has_history}<p class="admin-hint">
										This piece has sales or order history, so it is archived: taken off the shop and
										this desk, with its sale and order records kept.
									</p>{:else}<p class="admin-hint">
										Deletes this piece and its photos for good. It never sold, so no records are
										lost.
									</p>{/if}
								{#if held}<p class="admin-list-state">Unavailable while a buyer is paying.</p>
								{:else if confirmingRemoval}<div class="admin-confirm admin-confirm-wide">
										<button
											type="button"
											class="admin-danger-button"
											disabled={busy}
											onclick={removePiece}
											>{product.has_history ? 'Archive it' : 'Delete for good'}</button
										><button
											type="button"
											class="admin-cover-button"
											disabled={busy}
											onclick={() => (confirmingRemoval = false)}>Cancel</button
										>
									</div>{:else}<button
										type="button"
										class="admin-action admin-action-danger"
										disabled={busy}
										onclick={() => (confirmingRemoval = true)}
										>{product.has_history ? 'Archive piece' : 'Delete piece'}</button
									>{/if}
							</div>
						</details>
					</section>
				</aside>
			</div>
			<!-- Sold pieces are not advertised, so they get no post kit. -->
			{#if product.stock_state !== 'sold'}<SocialPosts
					{product}
					onmessage={(text) => ((error = ''), (message = text))}
					onerror={(text) => ((message = ''), (error = text))}
				/>{/if}
			{#if error}<AdminToast kind="error" text={error} onclose={() => (error = '')} />
			{:else if message}<AdminToast text={message} onclose={() => (message = '')} />{/if}
		{:else}
			<h1>Piece unavailable</h1>
			<p>{error}</p>
			<a href="/admin">Return to product desk</a>
		{/if}
	</main>
</div>
