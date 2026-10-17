<script lang="ts">
	import { onMount } from 'svelte';
	import { formatBdt } from '../site';
	import { SOCIAL_FORMATS, type SocialFormat, type SocialFormatId } from '../social/formats';
	import {
		CAPTION_VARIANTS,
		INSTAGRAM_CAPTION_LIMIT,
		generatedText,
		marketplaceFields,
		parseMarketplaceText,
		type CaptionPiece,
		type CaptionVariant
	} from '../social/captions';
	import { frameFor, loadPhoto, renderSocialImage, type TagFacts } from '../social/render';
	import { canShareFiles, saveBlob, shareFiles, zipFiles } from '../social/download';

	type Piece = {
		id: string;
		code: string | null;
		slug: string;
		name: string;
		brand: string | null;
		category_name: string | null;
		size_label: string | null;
		measurements_json: string | null;
		condition_notes: string | null;
		description: string | null;
		fit_note: string | null;
		price_bdt: number;
		publication_state: 'draft' | 'published';
		photos: { r2_key: string }[];
	};
	type Saved = { format: string; variant: string; caption: string; basis: string };
	type Preview = { key: string; url: string; failed: boolean; width: number; height: number };
	type FileType = 'image/jpeg' | 'image/png';

	let {
		product,
		onmessage,
		onerror
	}: { product: Piece; onmessage: (text: string) => void; onerror: (text: string) => void } =
		$props();

	const platforms = [
		{ id: 'instagram', name: 'Instagram' },
		{ id: 'facebook', name: 'Facebook' },
		{ id: 'any', name: 'Any platform' }
	] as const;
	const sizeLabel = (format: SocialFormat) =>
		format.kind === 'original' ? 'up to 2000 px' : `${format.width}×${format.height}`;
	const shortLabel = (format: SocialFormat) => {
		const label = format.label.replace(/^(Instagram|Facebook) /, '');
		return label[0].toUpperCase() + label.slice(1);
	};

	let active = $state<SocialFormatId>('ig-square');
	let fileType = $state<FileType>('image/jpeg');
	let showTag = $state(true);
	let variant = $state<CaptionVariant>('classic');
	let saved = $state<Record<string, Saved>>({});
	let drafts = $state<Record<string, string>>({});
	let working = $state(false);
	let canShare = $state(false);
	let previews = $state<Preview[]>([]);

	let format = $derived(SOCIAL_FORMATS.find((item) => item.id === active) ?? SOCIAL_FORMATS[0]);
	let piece = $derived<CaptionPiece>({
		code: product.code,
		slug: product.slug,
		name: product.name,
		brand: product.brand,
		category_name: product.category_name,
		size_label: product.size_label,
		measurements: parseMeasurements(product.measurements_json),
		condition_notes: product.condition_notes,
		description: product.description,
		fit_note: product.fit_note,
		price_bdt: product.price_bdt
	});
	// Post captions come in variants; stories and Marketplace have one text, kept as classic.
	let hasVariants = $derived(format.kind === 'post' || format.kind === 'original');
	let activeVariant = $derived<CaptionVariant>(hasVariants ? variant : 'classic');
	let slot = $derived(`${active}:${activeVariant}`);
	let generated = $derived(generatedText(format, piece, activeVariant));
	let savedPost = $derived<Saved | undefined>(saved[slot]);
	let text = $derived(drafts[slot] ?? savedPost?.caption ?? generated);
	let unsaved = $derived(text !== (savedPost?.caption ?? generated));
	// The listing changed after this caption was edited and saved.
	let stale = $derived(!!savedPost && savedPost.basis !== generated);
	let market = $derived(marketplaceFields(piece));
	let marketText = $derived(parseMarketplaceText(text));
	let extension = $derived(fileType === 'image/png' ? 'png' : 'jpg');
	let typeName = $derived(fileType === 'image/png' ? 'PNG' : 'JPEG');
	let count = $derived(product.photos.length);

	function parseMeasurements(json: string | null): Record<string, number> {
		try {
			const value = JSON.parse(json ?? '{}');
			return value && typeof value === 'object' ? value : {};
		} catch {
			return {};
		}
	}

	const tagFacts = (target: SocialFormat): TagFacts => ({
		price: formatBdt(product.price_bdt),
		size: product.size_label?.trim() ? `Size ${product.size_label.trim()}` : '',
		code: product.code ?? '',
		cta: target.platform === 'instagram' ? 'Link in bio · DM to order' : 'Inbox to order'
	});
	const tagFor = (target: SocialFormat, index: number) =>
		showTag && index === 0 ? tagFacts(target) : null;
	const savedIn = (formatId: string) =>
		Object.keys(saved).some((key) => key.startsWith(`${formatId}:`));

	// Each photo is fetched once and reused for every format.
	const bitmaps: Record<string, Promise<ImageBitmap>> = {};
	function bitmap(key: string) {
		if (!bitmaps[key]) {
			bitmaps[key] = loadPhoto(`/media/${key}`);
			bitmaps[key].catch(() => delete bitmaps[key]);
		}
		return bitmaps[key];
	}

	const fileName = (target: SocialFormat, index: number) =>
		`${(product.code ?? product.slug).toLowerCase()}-${target.id}-${index + 1}.${extension}`;

	async function renderFile(target: SocialFormat, index: number) {
		const key = product.photos[index].r2_key;
		const blob = await renderSocialImage(
			target,
			await bitmap(key),
			tagFor(target, index),
			fileType
		);
		return new File([blob], fileName(target, index), { type: fileType });
	}

	// Previews draw the same image at 40% size, so staff see exactly what they will download.
	$effect(() => {
		const target = format;
		const keys = product.photos.map((photo) => photo.r2_key);
		const tags = keys.map((_, index) => tagFor(target, index));
		const urls: string[] = [];
		let cancelled = false;
		// Original-size images take each photo's own shape once it loads; 4:5 until then.
		const shape = { width: target.width || 4, height: target.height || 5 };
		previews = keys.map((key) => ({ key, url: '', failed: false, ...shape }));
		void (async () => {
			for (const [index, key] of keys.entries()) {
				try {
					const photo = await bitmap(key);
					const blob = await renderSocialImage(target, photo, tags[index], 'image/jpeg', 0.85, 0.4);
					if (cancelled) return;
					const url = URL.createObjectURL(blob);
					urls.push(url);
					const { width, height } = frameFor(target, photo);
					previews[index] = { key, url, failed: false, width, height };
				} catch {
					if (cancelled) return;
					previews[index] = { key, url: '', failed: true, ...shape };
				}
			}
		})();
		return () => {
			cancelled = true;
			urls.forEach((url) => URL.revokeObjectURL(url));
		};
	});

	onMount(() => {
		canShare = canShareFiles([new File([''], 'post.jpg', { type: 'image/jpeg' })]);
		void (async () => {
			try {
				const response = await fetch(`/admin/api/products/${product.id}/social`);
				if (!response.ok) return;
				const rows = (await response.json()) as Saved[];
				saved = Object.fromEntries(rows.map((row) => [`${row.format}:${row.variant}`, row]));
			} catch {
				// Generated captions still show; only saved edits are missing.
			}
		})();
	});

	async function downloadOne(index: number) {
		working = true;
		try {
			const file = await renderFile(format, index);
			saveBlob(file, file.name);
		} catch {
			onerror('Could not make that image. Refresh the page and try again.');
		} finally {
			working = false;
		}
	}

	async function allFiles() {
		const files: File[] = [];
		for (const index of product.photos.keys()) files.push(await renderFile(format, index));
		return files;
	}

	async function downloadAll() {
		working = true;
		try {
			const files = await allFiles();
			if (files.length === 1) saveBlob(files[0], files[0].name);
			else
				saveBlob(
					await zipFiles(files),
					`${(product.code ?? product.slug).toLowerCase()}-${format.id}.zip`
				);
			onmessage(files.length === 1 ? 'Image downloaded' : `${files.length} images downloaded`);
		} catch {
			onerror('Could not make the images. Refresh the page and try again.');
		} finally {
			working = false;
		}
	}

	async function share() {
		working = true;
		try {
			await shareFiles(await allFiles());
		} catch {
			onerror('This phone could not share the images. Use Download instead.');
		} finally {
			working = false;
		}
	}

	async function copy(value: string, what: string) {
		try {
			await navigator.clipboard.writeText(value);
			onmessage(`${what} copied`);
		} catch {
			onerror('Could not copy. Select the text and copy it by hand.');
		}
	}

	function edit(value: string) {
		drafts[slot] = value;
	}

	function editMarket(field: 'title' | 'description', value: string) {
		drafts[slot] = JSON.stringify({ ...marketText, [field]: value });
	}

	async function save() {
		const target = slot;
		working = true;
		try {
			const response = await fetch(`/admin/api/products/${product.id}/social`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					format: active,
					variant: activeVariant,
					caption: text,
					basis: generated
				})
			});
			if (!response.ok) throw new Error(await response.text());
			saved[target] = await response.json();
			delete drafts[target];
			onmessage('Caption saved');
		} catch (reason) {
			onerror(
				reason instanceof Error && reason.message === 'Invalid caption'
					? 'A caption cannot be empty or longer than 5,000 characters.'
					: 'Could not save the caption. Check your connection and try again.'
			);
		} finally {
			working = false;
		}
	}

	async function reset() {
		const target = slot;
		if (!saved[target]) {
			delete drafts[target];
			return;
		}
		working = true;
		try {
			const response = await fetch(`/admin/api/products/${product.id}/social`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ format: active, variant: activeVariant })
			});
			if (!response.ok) throw new Error('Reset failed');
			delete saved[target];
			delete drafts[target];
			onmessage('Caption reset to the listing');
		} catch {
			onerror('Could not reset the caption. Refresh and try again.');
		} finally {
			working = false;
		}
	}
</script>

{#snippet copyIcon()}<svg viewBox="0 0 24 24" aria-hidden="true"
		><rect x="9" y="9" width="13" height="13" rx="2" /><path
			d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
		/></svg
	>{/snippet}
{#snippet downloadIcon()}<svg viewBox="0 0 24 24" aria-hidden="true"
		><path d="M12 15V3M7 10l5 5 5-5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></svg
	>{/snippet}

<section class="admin-panel social" aria-labelledby="social-title">
	<div class="admin-panel-head">
		<h2 id="social-title">Social posts</h2>
		<p>{SOCIAL_FORMATS.length} formats · {count} {count === 1 ? 'photo' : 'photos'}</p>
	</div>
	<p class="admin-hint">
		Images and captions ready for Instagram and Facebook. Every photo is fitted whole, never
		cropped; the price tag on the cover can be turned off.
	</p>
	{#if product.publication_state === 'draft'}<p class="social-note">
			This piece is a draft. Its shop link starts working once you publish it.
		</p>{/if}

	<div class="social-formats">
		{#each platforms as platform (platform.id)}<div
				class="social-group"
				role="group"
				aria-labelledby="social-{platform.id}"
			>
				<span class="social-group-name" id="social-{platform.id}">{platform.name}</span>
				<div class="social-tabs">
					{#each SOCIAL_FORMATS.filter((item) => item.platform === platform.id) as item (item.id)}<button
							type="button"
							aria-pressed={active === item.id}
							aria-label="{item.label}, {sizeLabel(item).replace('×', ' by ')}{savedIn(item.id)
								? ', edited caption saved'
								: ''}"
							onclick={() => (active = item.id)}
							>{shortLabel(item)}<small>{sizeLabel(item)}</small>{#if savedIn(item.id)}<span
									class="social-edited"
									aria-hidden="true"
								></span>{/if}</button
						>{/each}
				</div>
			</div>{/each}
	</div>

	<div class="social-body">
		<div class="social-images">
			<h3>
				Images <small
					>{format.kind === 'original'
						? 'stored size, up to 2000 px'
						: `${format.width} × ${format.height} px`}</small
				>
			</h3>
			{#if !count}<p class="social-empty">Add a photo above to make post images.</p>
			{:else}
				<div class="social-toolbar">
					<div class="social-type" role="group" aria-label="Price tag on the cover">
						<span class="social-type-name" aria-hidden="true">Tag</span><button
							type="button"
							aria-pressed={showTag}
							onclick={() => (showTag = true)}>On</button
						><button type="button" aria-pressed={!showTag} onclick={() => (showTag = false)}
							>Off</button
						>
					</div>
					<div class="social-type" role="group" aria-label="File type">
						<button
							type="button"
							aria-pressed={fileType === 'image/jpeg'}
							onclick={() => (fileType = 'image/jpeg')}>JPEG</button
						><button
							type="button"
							aria-pressed={fileType === 'image/png'}
							onclick={() => (fileType = 'image/png')}>PNG</button
						>
					</div>
					<button type="button" class="admin-action" disabled={working} onclick={downloadAll}
						>{@render downloadIcon()}{count === 1
							? `Download ${typeName}`
							: `Download all ${count} (ZIP)`}</button
					>
					{#if canShare}<button
							type="button"
							class="admin-action admin-action-outline"
							disabled={working}
							onclick={share}>Share or save to phone</button
						>{/if}
				</div>
				<p class="social-type-hint">
					{fileType === 'image/png'
						? 'PNG is lossless and larger.'
						: 'JPEG at 95% quality: just as sharp, much smaller.'}
					{showTag ? 'Photo 1 carries the price tag.' : 'No price tag on any photo.'}
				</p>
				<ol class="social-previews" class:social-previews-wide={format.width > format.height}>
					{#each previews as preview, index (preview.key)}<li>
							<div class="social-frame" style:aspect-ratio="{preview.width} / {preview.height}">
								{#if preview.url}<img
										src={preview.url}
										alt="{shortLabel(format)} image {index + 1} of {count}"
									/>{:else if preview.failed}<span>Preview unavailable</span>{:else}<span
										class="social-loading">Drawing…</span
									>{/if}
							</div>
							<div class="social-frame-foot">
								<span
									>{index + 1}{index === 0 ? ' · Cover' : ''}{format.kind === 'original' &&
									preview.url
										? ` · ${preview.width}×${preview.height}`
										: ''}</span
								>
								<button
									type="button"
									class="social-icon-button"
									disabled={working}
									aria-label="Download image {index + 1} as {typeName}"
									onclick={() => downloadOne(index)}>{@render downloadIcon()}</button
								>
							</div>
						</li>{/each}
				</ol>
			{/if}
		</div>

		<div class="social-text">
			{#if format.kind === 'marketplace'}
				<h3>Listing fields</h3>
				<p class="admin-hint">Marketplace asks for each field separately. Copy them one by one.</p>
				<div class="social-field">
					<label for="social-title-field">Title</label>
					<div class="social-copy-row">
						<input
							id="social-title-field"
							value={marketText.title}
							maxlength="100"
							oninput={(event) => editMarket('title', event.currentTarget.value)}
						/>
						<button
							type="button"
							class="social-icon-button"
							aria-label="Copy title"
							onclick={() => copy(marketText.title, 'Title')}>{@render copyIcon()}</button
						>
					</div>
				</div>
				{#each [{ label: 'Price', value: market.price, shown: formatBdt(product.price_bdt) }, { label: 'Condition', value: market.condition, shown: market.condition }, { label: 'Category', value: market.category, shown: market.category }] as field (field.label)}<div
						class="social-field"
					>
						<span class="social-field-label">{field.label}</span>
						<div class="social-copy-row">
							<output>{field.shown}</output>
							<button
								type="button"
								class="social-icon-button"
								aria-label="Copy {field.label.toLowerCase()}"
								onclick={() => copy(field.value, field.label)}>{@render copyIcon()}</button
							>
						</div>
					</div>{/each}
				<div class="social-field">
					<label for="social-description">Description</label>
					<textarea
						id="social-description"
						rows="8"
						value={marketText.description}
						oninput={(event) => editMarket('description', event.currentTarget.value)}></textarea>
					<button
						type="button"
						class="admin-cover-button social-copy"
						onclick={() => copy(marketText.description, 'Description')}
						>{@render copyIcon()}Copy description</button
					>
				</div>
			{:else}
				<h3>{format.kind === 'story' ? 'Sticker text' : 'Caption'}</h3>
				{#if hasVariants}<div class="social-variants" role="group" aria-label="Caption style">
						{#each CAPTION_VARIANTS as option (option.id)}<button
								type="button"
								aria-pressed={variant === option.id}
								aria-label="{option.label}{saved[`${active}:${option.id}`]
									? ', edited caption saved'
									: ''}"
								onclick={() => (variant = option.id)}
								>{option.label}{#if saved[`${active}:${option.id}`]}<span
										class="social-edited"
										aria-hidden="true"
									></span>{/if}</button
							>{/each}
					</div>
					<p class="admin-hint">
						{CAPTION_VARIANTS.find((option) => option.id === variant)?.hint}
					</p>{/if}
				{#if format.kind === 'story'}<p class="admin-hint">
						Stories have no caption. The image shows a bigger tag; paste this as a text or link
						sticker.
					</p>{/if}
				<label class="social-sr" for="social-caption"
					>{format.kind === 'story' ? 'Sticker text' : 'Caption'} for {format.label}</label
				>
				<textarea
					id="social-caption"
					rows={format.kind === 'story' ? 3 : 16}
					value={text}
					oninput={(event) => edit(event.currentTarget.value)}></textarea>
				{#if format.platform === 'instagram' && format.kind === 'post'}<p
						class="social-count"
						class:social-over={text.length > INSTAGRAM_CAPTION_LIMIT}
					>
						{text.length.toLocaleString('en')} / {INSTAGRAM_CAPTION_LIMIT.toLocaleString('en')}
					</p>{/if}
				<button
					type="button"
					class="admin-cover-button social-copy"
					onclick={() => copy(text, format.kind === 'story' ? 'Sticker text' : 'Caption')}
					>{@render copyIcon()}{format.kind === 'story'
						? 'Copy sticker text'
						: 'Copy caption'}</button
				>
			{/if}

			{#if stale}<div class="social-stale" role="status">
					<p>The listing changed after this caption was saved. Check the price and size.</p>
					<button type="button" class="admin-cover-button" disabled={working} onclick={reset}
						>Reset to listing</button
					>
				</div>{/if}
			<div class="social-savebar">
				<p class:editor-unsaved={unsaved}>
					{unsaved
						? 'Unsaved changes'
						: savedPost
							? 'Your edit is saved'
							: 'Written from the listing'}
				</p>
				{#if (savedPost || unsaved) && !stale}<button
						type="button"
						class="social-text-button"
						disabled={working}
						onclick={reset}>Reset to listing</button
					>{/if}
				<button
					type="button"
					class="admin-action admin-action-outline"
					disabled={working || !unsaved}
					onclick={save}>Save text</button
				>
			</div>
		</div>
	</div>
</section>
