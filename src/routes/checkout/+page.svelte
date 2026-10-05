<script lang="ts">
	import { onMount } from 'svelte';
	import { readCartIds } from '../../lib/cart/browser-cart';
	import { leaveFor } from '../../lib/checkout/navigate';
	import SiteFooter from '../../lib/components/SiteFooter.svelte';
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
	// One key per checkout attempt lets a retried submission reuse the same held order.
	let checkoutKey = crypto.randomUUID();
	let selected = $derived(data.areas.find((area) => `${area.district}/${area.area}` === areaKey));
	let address = $derived({
		name,
		phone,
		line1,
		district: selected?.district ?? '',
		area: selected?.area ?? ''
	});

	onMount(() => {
		ids = readCartIds(window.localStorage);
	});

	async function checkTotal(event: SubmitEvent) {
		event.preventDefault();
		quote = null;
		error = '';
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
			checkoutKey = crypto.randomUUID();
		} catch (failure) {
			error = `${(failure as Error).message} No stock has been held or payment started.`;
		} finally {
			loading = false;
		}
	}

	async function pay() {
		if (!quote || paying) return;
		paying = true;
		error = '';
		try {
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ids, address, checkout_key: checkoutKey })
			});
			if (response.status === 409)
				throw new Error('One of these pieces is no longer available. Please review your bag.');
			if (!response.ok) throw new Error('Payment could not start. No money has been taken.');
			const started = (await response.json()) as { redirect_url: string };
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

<main id="main-content" class="flow-main">
	<a class="flow-back" href="/cart">Back to your bag</a>
	<h1>Checkout</h1>
	<p class="flow-intro">
		Check a fresh price and one delivery charge first. Pieces are held only when you choose to pay
		with bKash.
	</p>
	{#if !ids.length}
		<div class="flow-state">
			<p>Your bag is empty.</p>
			<a class="button button-gold" href="/#shop">Shop the rack</a>
		</div>
	{:else if !data.areas.length}
		<div class="flow-state">
			<p>Delivery areas are not approved yet. Checkout is unavailable.</p>
			<p class="test-banner">Payment is not enabled</p>
			<a class="button button-line" href="/cart">Return to bag</a>
		</div>
	{:else}
		<div class="flow-layout">
			<form class="form-card" onsubmit={checkTotal}>
				<h2>Where should it go?</h2>
				{#if data.areas.some((area) => area.name.startsWith('TEST ONLY'))}
					<p class="test-banner">
						TEST ONLY delivery areas. These are dummy records, not actual courier coverage.
					</p>
				{/if}
				<label for="buyer-name">Name</label><input
					id="buyer-name"
					bind:value={name}
					required
					maxlength="120"
					autocomplete="name"
				/>
				<label for="buyer-phone">Bangladesh phone</label><input
					id="buyer-phone"
					bind:value={phone}
					required
					type="tel"
					inputmode="tel"
					autocomplete="tel"
					placeholder="01712345678"
				/>
				<label for="buyer-address">Address line</label><input
					id="buyer-address"
					bind:value={line1}
					required
					maxlength="300"
					autocomplete="street-address"
				/>
				<label for="buyer-area">Delivery area</label><select
					id="buyer-area"
					bind:value={areaKey}
					required
				>
					<option value="" disabled>Choose an area</option>
					{#each data.areas as area (`${area.district}/${area.area}`)}
						<option value="{area.district}/{area.area}"
							>{area.name} — {price(area.fee_bdt)} delivery</option
						>
					{/each}
				</select>
				<button class="button button-gold" type="submit" disabled={loading || paying}
					>{loading ? 'Checking…' : 'Check total'}</button
				>
			</form>
			<aside class="receipt" aria-label="Order total">
				<h2>Current total</h2>
				{#if quote}
					{#each quote.items as item (item.id)}<div class="receipt-row">
							<span>{item.name}</span><strong>{price(item.price_bdt)}</strong>
						</div>{/each}
					<div class="receipt-row">
						<span>Items</span><strong>{price(quote.subtotal_bdt)}</strong>
					</div>
					<div class="receipt-row">
						<span>Delivery, once</span><strong>{price(quote.shipping_bdt)}</strong>
					</div>
					<div class="receipt-row total">
						<span>Total</span><strong>{price(quote.total_bdt)}</strong>
					</div>
					{#if quote.preview_only}<p class="test-banner">
							TEST ONLY delivery — not an offer to ship.
						</p>{/if}
					{#if data.checkout_enabled}
						<button class="button button-ink" type="button" onclick={pay} disabled={paying}
							>{paying ? 'Opening bKash…' : `Pay ${price(quote.total_bdt)} with bKash`}</button
						>
						<p>Your pieces are held for 15 minutes while bKash confirms payment.</p>
					{/if}
				{:else}<p>Enter your address to see current prices and the delivery charge.</p>{/if}
				{#if !data.checkout_enabled}<p class="receipt-notice">Payment is not enabled</p>{/if}
				{#if error}<p role="alert" class="form-error">{error}</p>{/if}
			</aside>
		</div>
	{/if}
</main>

<SiteFooter />
