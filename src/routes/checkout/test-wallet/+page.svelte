<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const price = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`;
</script>

<svelte:head>
	<title>Test wallet | dathrift</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="storefront bag-page">
	<main id="main-content" class="test-wallet">
		<p class="checkout-eyebrow">Local development only</p>
		<h1>Test wallet</h1>
		<p class="checkout-test-note">
			TEST ONLY. This page stands in for the bKash payment page. No money moves.
		</p>
		<p class="test-wallet-amount">Amount: <strong>{price(data.amount_bdt)}</strong></p>
		<form method="POST" class="test-wallet-actions">
			<button name="decision" value="approved">Approve payment</button>
			<button name="decision" value="declined">Decline payment</button>
			<button name="decision" value="cancelled">Cancel</button>
		</form>
		<p class="order-private-note">Reference {data.paymentId}</p>
	</main>
</div>
