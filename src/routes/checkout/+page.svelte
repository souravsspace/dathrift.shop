<script lang="ts">
	import { onMount } from 'svelte';
	import { readCartIds } from '../../lib/cart/browser-cart';
	import { addressSchema } from '../../lib/checkout/address';
	import { leaveFor } from '../../lib/checkout/navigate';
	import {
		forgetAddress,
		readSavedAddress,
		saveAddress,
		type SavedAddress
	} from '../../lib/checkout/saved-address';
	import { saveOrder } from '../../lib/orders/device-orders';
	import SiteFooter from '../../lib/components/SiteFooter.svelte';
	import Icon from '../../lib/components/Icon.svelte';
	import SiteHeader from '../../lib/components/SiteHeader.svelte';
	import { formatBdt as price } from '../../lib/site';
	import type { PageData } from './$types';

	type Quote = {
		items: { id: string; slug: string; name: string; price_bdt: number }[];
		subtotal_bdt: number;
		shipping_bdt: number;
		total_bdt: number;
		preview_only: boolean;
	};

	let { data }: { data: PageData } = $props();
	let ids = $state<string[]>([]);
	let name = $state('');
	let phone = $state('');
	let line1 = $state('');
	let areaKey = $state('');
	let quote = $state<Quote | null>(null);
	let loading = $state(false);
	let paying = $state(false);
	let error = $state('');
	let errors = $state<Partial<Record<Field, string>>>({});
	// The address the current quote was checked against; payment sends exactly this.
	let checked = $state<Address | null>(null);
	// One key per checkout attempt lets a retried submission reuse the same held order.
	let checkoutKey = crypto.randomUUID();

	type Field = 'name' | 'phone' | 'line1' | 'areaKey';
	type Address = { name: string; phone: string; line1: string; district: string; area: string };

	// A delivery address kept on this device, and whether to fill it in by itself.
	let saved = $state<SavedAddress | null>(null);
	let autofill = $state(true);
	let savedNote = $state('');

	onMount(() => {
		ids = readCartIds(window.localStorage);
		const stored = readSavedAddress(window.localStorage);
		if (!stored) return;
		saved = stored.address;
		autofill = stored.autofill;
		if (
			stored.autofill &&
			data.areas.some((area) => `${area.district}/${area.area}` === stored.address.areaKey)
		) {
			useSaved();
			savedNote = 'Filled in from your saved address.';
		}
	});

	function useSaved() {
		if (!saved) return;
		({ name, phone, line1 } = saved);
		areaKey = data.areas.some((area) => `${area.district}/${area.area}` === saved?.areaKey)
			? saved.areaKey
			: '';
		errors = {};
		quote = null;
		savedNote = 'Filled in from your saved address.';
	}

	function keepAddress() {
		const result = validate();
		if (!result.success) {
			savedNote = '';
			return;
		}
		saved = saveAddress(window.localStorage, result.data, autofill).address;
		savedNote = 'Address saved on this device.';
	}

	function setAutofill() {
		if (saved) saveAddress(window.localStorage, saved, autofill);
	}

	function forgetSaved() {
		forgetAddress(window.localStorage);
		saved = null;
		savedNote = 'Saved address removed from this device.';
	}

	let savedArea = $derived(
		saved
			? data.areas.find((area) => `${area.district}/${area.area}` === saved?.areaKey)?.name
			: undefined
	);

	function validate(only?: Field) {
		const result = addressSchema.safeParse({ name, phone, line1, areaKey });
		const found: Partial<Record<Field, string>> = {};
		if (!result.success)
			for (const issue of result.error.issues) {
				const field = issue.path[0] as Field;
				found[field] ??= issue.message;
			}
		errors = only ? { ...errors, [only]: found[only] } : found;
		return result;
	}

	// A field is checked when the buyer leaves it, unless they are pressing a button: an error
	// appearing then would shift the button away mid-tap, and submitting checks every field anyway.
	const leave = (field: Field, value: () => string) => (event: FocusEvent) => {
		if (value() && !(event.relatedTarget instanceof HTMLButtonElement)) validate(field);
	};

	// As the buyer fixes a field that showed an error, it is checked again.
	const recheck = (field: Field) => () => {
		quote = null;
		if (errors[field]) validate(field);
	};

	async function checkTotal(event: SubmitEvent) {
		event.preventDefault();
		quote = null;
		checked = null;
		error = '';
		const result = validate();
		if (!result.success) {
			const first = (['name', 'phone', 'line1', 'areaKey'] as const).find((field) => errors[field]);
			document.getElementById(`buyer-${first}`)?.focus();
			return;
		}
		const area = data.areas.find((item) => `${item.district}/${item.area}` === result.data.areaKey);
		const address = {
			name: result.data.name,
			phone: result.data.phone,
			line1: result.data.line1,
			district: area?.district ?? '',
			area: area?.area ?? ''
		};
		loading = true;
		try {
			const response = await fetch('/api/checkout/quote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids, address })
			});
			if (response.status === 409) throw new Error('One of these pieces is no longer available.');
			if (response.status === 422) throw new Error('We cannot deliver to that area yet.');
			if (!response.ok) throw new Error('Check your name, phone and address, then try again.');
			quote = await response.json();
			checked = address;
			phone = address.phone;
			checkoutKey = crypto.randomUUID();
		} catch (failure) {
			error = `${(failure as Error).message} No stock has been held or payment started.`;
		} finally {
			loading = false;
		}
	}

	async function pay() {
		if (!quote || !checked || paying) return;
		paying = true;
		error = '';
		try {
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids, address: checked, checkout_key: checkoutKey })
			});
			if (response.status === 409)
				throw new Error('One of these pieces is no longer available. Please review your bag.');
			if (!response.ok) throw new Error('Payment could not start. No money has been taken.');
			const started = (await response.json()) as { redirect_url: string; status_url?: string };
			const token = started.status_url?.split('/').pop();
			// Remembered on this device only, so the buyer can find the order page again.
			if (token)
				saveOrder(window.localStorage, {
					token,
					reference: '',
					status: 'pending_payment',
					total_bdt: quote.total_bdt,
					items: quote.items.map((item) => ({ name: item.name, slug: item.slug })),
					created_at: new Date().toISOString()
				});
			window.localStorage.setItem('dathrift-cart', '[]');
			leaveFor(started.redirect_url);
		} catch (failure) {
			error = (failure as Error).message;
			paying = false;
		}
	}
</script>

<svelte:head>
	<title>Checkout | daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<SiteHeader current="bag" />

<main id="main-content" class="flow page">
	<header class="flow-head">
		<a class="back-link" href="/cart"><Icon name="arrow-left" size={18} />Back to your bag</a>
		<h1 class="page-title">Checkout</h1>
		<ol class="steps" aria-label="Checkout steps">
			<li class="done"><Icon name="check" size={16} />Bag</li>
			<li aria-current="step"><span class="step-dot">2</span>Delivery</li>
			<li><span class="step-dot">3</span>Pay with bKash</li>
		</ol>
		<p class="lede">
			Check a fresh price and one delivery charge first. Pieces are held only when you choose to pay
			with bKash.
		</p>
	</header>
	{#if !ids.length}
		<div class="empty-state">
			<span class="empty-icon"><Icon name="shopping-bag" size={26} /></span>
			<h2>Your bag is empty.</h2>
			<a class="button button-ink" href="/shop"
				>Browse the shop <Icon name="arrow-right" size={18} /></a
			>
		</div>
	{:else if !data.areas.length}
		<div class="empty-state">
			<span class="empty-icon"><Icon name="truck" size={26} /></span>
			<p>Delivery areas are not approved yet. Checkout is unavailable.</p>
			<p class="notice notice-test">Payment is not enabled</p>
			<a class="button button-outline" href="/cart">Return to bag</a>
		</div>
	{:else}
		<div class="flow-layout">
			<form class="address card" onsubmit={checkTotal} novalidate>
				<h2><Icon name="map-pin" size={20} />Where should it go?</h2>
				{#if saved}
					<div class="saved wide">
						<span class="saved-icon"><Icon name="bookmark-check" size={20} /></span>
						<div class="saved-text">
							<strong>Saved address</strong>
							<span>{saved.name} · {saved.phone}</span>
							<span
								>{saved.line1}{#if savedArea}, {savedArea}{/if}</span
							>
						</div>
						<div class="saved-actions">
							<button class="button button-outline small" type="button" onclick={useSaved}
								>Use this address</button
							>
							<button class="text-button" type="button" onclick={forgetSaved}
								><Icon name="trash-2" size={16} />Forget</button
							>
						</div>
					</div>
				{/if}
				{#if savedNote}<p class="saved-note wide" role="status">
						<Icon name="circle-check" size={16} />{savedNote}
					</p>{/if}
				{#if data.areas.some((area) => area.name.startsWith('TEST ONLY'))}
					<p class="notice notice-test">
						TEST ONLY delivery areas. These are dummy records, not actual courier coverage.
					</p>
				{/if}
				<div class="field">
					<label for="buyer-name">Name</label><input
						class="input"
						id="buyer-name"
						bind:value={name}
						oninput={recheck('name')}
						onblur={leave('name', () => name)}
						required
						maxlength="120"
						autocomplete="name"
						placeholder="Full name"
						aria-invalid={errors.name ? 'true' : undefined}
						aria-describedby={errors.name ? 'name-error' : undefined}
					/>
					{#if errors.name}<p class="field-error" id="name-error">
							<Icon name="circle-x" size={16} />{errors.name}
						</p>{/if}
				</div>
				<div class="field">
					<label for="buyer-phone">Phone</label><input
						class="input"
						id="buyer-phone"
						bind:value={phone}
						oninput={recheck('phone')}
						onblur={leave('phone', () => phone)}
						required
						type="tel"
						inputmode="tel"
						autocomplete="tel"
						placeholder="01712345678"
						aria-invalid={errors.phone ? 'true' : undefined}
						aria-describedby={errors.phone ? 'phone-error' : undefined}
					/>
					{#if errors.phone}<p class="field-error" id="phone-error">
							<Icon name="circle-x" size={16} />{errors.phone}
						</p>{/if}
				</div>
				<div class="field wide">
					<label for="buyer-line1">Address line</label><input
						class="input"
						id="buyer-line1"
						bind:value={line1}
						oninput={recheck('line1')}
						onblur={leave('line1', () => line1)}
						required
						maxlength="300"
						autocomplete="street-address"
						placeholder="House, road, area"
						aria-invalid={errors.line1 ? 'true' : undefined}
						aria-describedby={errors.line1 ? 'line1-error' : undefined}
					/>
					{#if errors.line1}<p class="field-error" id="line1-error">
							<Icon name="circle-x" size={16} />{errors.line1}
						</p>{/if}
				</div>
				<div class="field wide">
					<label for="buyer-areaKey">Delivery area</label>
					<div class="select">
						<select
							class="input"
							id="buyer-areaKey"
							bind:value={areaKey}
							onchange={recheck('areaKey')}
							required
							aria-invalid={errors.areaKey ? 'true' : undefined}
							aria-describedby={errors.areaKey ? 'area-error' : undefined}
						>
							<option value="" disabled>Choose an area</option>
							{#each data.areas as area (`${area.district}/${area.area}`)}
								<option value="{area.district}/{area.area}"
									>{area.name} — {price(area.fee_bdt)} delivery</option
								>
							{/each}
						</select>
						<Icon name="chevron-down" size={18} />
					</div>
					{#if errors.areaKey}<p class="field-error" id="area-error">
							<Icon name="circle-x" size={16} />{errors.areaKey}
						</p>{/if}
				</div>
				<div class="keep wide">
					<button class="button button-outline small" type="button" onclick={keepAddress}>
						<Icon name="bookmark" size={18} />{saved ? 'Update saved address' : 'Save this address'}
					</button>
					<label class="auto">
						<input type="checkbox" bind:checked={autofill} onchange={setAutofill} />
						<span>Fill it in automatically next time</span>
					</label>
				</div>
				<button class="button button-ink wide" type="submit" disabled={loading || paying}
					>{loading ? 'Checking…' : 'Check total'}</button
				>
			</form>
			<aside class="summary card" aria-label="Order total">
				<h2>Current total</h2>
				{#if quote}
					{#each quote.items as item (item.id)}<div class="summary-row">
							<span>{item.name}</span><strong>{price(item.price_bdt)}</strong>
						</div>{/each}
					<div class="summary-row">
						<span>Items</span><strong>{price(quote.subtotal_bdt)}</strong>
					</div>
					<div class="summary-row">
						<span>Delivery, once</span><strong>{price(quote.shipping_bdt)}</strong>
					</div>
					<div class="summary-row total">
						<span>Total</span><strong>{price(quote.total_bdt)}</strong>
					</div>
					{#if quote.preview_only}<p class="notice notice-test">
							TEST ONLY delivery — not an offer to ship.
						</p>{/if}
					{#if data.checkout_enabled}
						<button
							class="button button-ink button-block"
							type="button"
							onclick={pay}
							disabled={paying}
							><Icon name="lock" size={18} />{paying
								? 'Opening bKash…'
								: `Pay ${price(quote.total_bdt)} with bKash`}</button
						>
						<p class="summary-note">
							<Icon name="clock" size={16} />Your pieces are held for 15 minutes while bKash
							confirms payment.
						</p>
					{/if}
				{:else}<p class="summary-note">
						<Icon name="info" size={16} />Enter your address to see current prices and the delivery
						charge.
					</p>{/if}
				{#if !data.checkout_enabled}<p class="summary-note strong">
						<Icon name="lock" size={16} />Payment is not enabled
					</p>{/if}
				{#if error}<p role="alert" class="form-error">
						<Icon name="circle-x" size={18} />{error}
					</p>{/if}
			</aside>
		</div>
	{/if}
</main>

<SiteFooter />

<style>
	.steps {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
		margin: 16px 0 0;
		padding: 0;
		color: var(--color-ink-soft);
		font-size: var(--text-small);
		font-weight: 600;
		list-style: none;
	}

	.steps li {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.steps li[aria-current='step'] {
		color: var(--color-ink);
	}

	.steps .done {
		color: var(--color-moss);
	}

	.step-dot {
		display: grid;
		width: 22px;
		height: 22px;
		place-items: center;
		border: 1.5px solid currentColor;
		border-radius: 50%;
		font-family: var(--font-mono);
		font-size: var(--text-label);
	}

	[aria-current='step'] .step-dot {
		border-color: var(--color-ink);
		background: var(--color-ink);
		color: var(--color-paper);
	}

	.address {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px 16px;
		padding: clamp(20px, 3vw, 32px);
	}

	.address h2 {
		display: flex;
		grid-column: 1 / -1;
		align-items: center;
		gap: 10px;
		margin: 0;
		font-size: var(--text-h3);
		font-stretch: 85%;
		font-weight: 750;
	}

	.address h2 :global(svg) {
		color: var(--color-bottle);
	}

	.address .notice,
	.wide {
		grid-column: 1 / -1;
	}

	.select {
		position: relative;
	}

	.select select {
		padding-right: 44px;
		appearance: none;
		background-image: none;
	}

	.select :global(svg) {
		position: absolute;
		top: 50%;
		right: 14px;
		pointer-events: none;
		translate: 0 -50%;
	}

	.field-error {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin: 0;
		color: var(--color-rust);
		font-size: var(--text-small);
		font-weight: 600;
		line-height: 1.45;
	}

	.field-error :global(svg) {
		margin-top: 2px;
	}

	.input[aria-invalid='true'] {
		border-color: var(--color-rust);
	}

	.saved {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 12px 14px;
		padding: 14px 16px;
		border-radius: var(--radius);
		background: var(--color-ivory);
	}

	.saved-icon {
		color: var(--color-bottle);
	}

	.saved-text {
		display: grid;
		gap: 2px;
		min-width: 0;
		font-size: var(--text-small);
	}

	.saved-text span {
		overflow-wrap: anywhere;
		color: var(--color-ink-soft);
	}

	.saved-actions {
		display: flex;
		flex-wrap: wrap;
		grid-column: 2;
		align-items: center;
		gap: 4px 12px;
	}

	.small {
		min-height: 44px;
		padding: 0 16px;
		font-size: var(--text-small);
	}

	.text-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 0 4px;
		border: 0;
		background: none;
		color: var(--color-ink-soft);
		font: inherit;
		font-size: var(--text-small);
		font-weight: 600;
		cursor: pointer;
	}

	.text-button:hover {
		color: var(--color-rust);
	}

	.saved-note {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0;
		color: var(--color-moss);
		font-size: var(--text-small);
		font-weight: 600;
	}

	.keep {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 18px;
		padding-top: 4px;
	}

	.auto {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		min-height: 44px;
		font-size: var(--text-small);
		cursor: pointer;
	}

	.auto input {
		width: 20px;
		height: 20px;
		border-color: var(--line-strong);
		border-radius: 5px;
		color: var(--color-moss);
	}

	.summary-note.strong {
		color: var(--color-ink);
		font-weight: 700;
	}

	@media (max-width: 600px) {
		.address {
			grid-template-columns: 1fr;
		}
	}
</style>
