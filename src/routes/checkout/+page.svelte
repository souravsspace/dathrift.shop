<script lang="ts">
	import { onMount } from 'svelte';
	import { readCartIds } from '../../lib/cart/browser-cart';

	type Quote = {
		items: { id: string; slug: string; name: string; price_bdt: number }[];
		subtotal_bdt: number;
		shipping_bdt: number;
		total_bdt: number;
		preview_only: boolean;
	};

	const localPreview = import.meta.env.DEV;
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
	let ids = $state<string[]>([]);
	let name = $state('');
	let phone = $state('');
	let line1 = $state('');
	let district = $state('test-dhaka');
	let area = $derived(district === 'test-dhaka' ? 'test-central' : 'test-town');
	let quote = $state<Quote | null>(null);
	let loading = $state(false);
	let error = $state('');

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
				body: JSON.stringify({ ids, address: { name, phone, line1, district, area } })
			});
			if (!response.ok) throw new Error('Quote unavailable');
			quote = await response.json();
		} catch {
			error = 'Unable to verify this bag and address. No stock has been held or payment started.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Delivery preview | dathrift</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="storefront bag-page checkout-page">
	<header class="site-header">
		<a class="brand" href="/" aria-label="dathrift home"
			><img src="/brand/dathrift-logo.png" alt="" width="52" height="52" /><span
				>dathrift<span class="brand-period">.</span></span
			></a
		>
		<nav aria-label="Main navigation"><a href="/cart">Back to bag</a></nav>
	</header>
	<main id="main-content">
		<a class="bag-back" href="/cart">← Back to your bag</a>
		<p class="checkout-eyebrow">Local preview / No payment</p>
		<h1>Delivery preview</h1>
		<p class="bag-intro">
			See a fresh price and one delivery charge. This step never holds a piece or starts payment.
		</p>
		{#if !ids.length}
			<div class="bag-state">
				<p>Your bag is empty.</p>
				<a href="/#shop">Explore the edit</a>
			</div>
		{:else if !localPreview}
			<div class="bag-state">
				<p>Delivery areas are not approved yet. Checkout is unavailable.</p>
				<a href="/cart">Return to bag</a>
			</div>
		{:else}
			<div class="checkout-layout">
				<form class="checkout-form" onsubmit={checkTotal}>
					<div class="checkout-form-title">
						<span>01 / Delivery</span>
						<h2>Where would it go?</h2>
					</div>
					<p class="checkout-test-note">
						TEST ONLY delivery preview. These are dummy area records, not actual courier coverage.
					</p>
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
					<label for="buyer-district">Test district</label><select
						id="buyer-district"
						bind:value={district}
						><option value="test-dhaka">TEST ONLY — Dhaka example</option><option value="test-other"
							>TEST ONLY — Other example</option
						></select
					>
					<p class="checkout-area">
						Area: {district === 'test-dhaka'
							? 'TEST ONLY — Central area'
							: 'TEST ONLY — Other town'}
					</p>
					<button type="submit" disabled={loading}
						>{loading ? 'Checking…' : 'Check total'} <span aria-hidden="true">↗</span></button
					>
				</form>
				<aside class="bag-summary checkout-summary" aria-label="Delivery total">
					<h2>Current total</h2>
					{#if quote}
						{#each quote.items as item (item.id)}<div>
								<span>{item.name}</span><strong>{price(item.price_bdt)}</strong>
							</div>{/each}
						<div><span>Items</span><strong>{price(quote.subtotal_bdt)}</strong></div>
						<div><span>Delivery, once</span><strong>{price(quote.shipping_bdt)}</strong></div>
						<div class="checkout-total">
							<span>Total</span><strong>{price(quote.total_bdt)}</strong>
						</div>
						{#if quote.preview_only}<p class="checkout-test-note">
								TEST ONLY delivery preview — not an offer to ship.
							</p>{/if}
					{:else}<p>Enter a test address to see current prices and a delivery example.</p>{/if}
					<p class="checkout-notice">Payment is not enabled</p>
					{#if error}<p role="alert" class="checkout-error">{error}</p>{/if}
				</aside>
			</div>
		{/if}
	</main>
	<footer class="site-footer">
		<span>dathrift.</span><span>One piece. One next chapter.</span><a href="/cart">Back to bag ↑</a>
	</footer>
</div>
