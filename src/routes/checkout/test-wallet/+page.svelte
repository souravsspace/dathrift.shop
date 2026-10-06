<script lang="ts">
	import { formatBdt as price } from '../../../lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Test wallet | daThriftShop</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main id="main-content" class="flow page">
	<h1 class="page-title">Test wallet</h1>
	<p class="notice notice-test wallet-note">
		TEST ONLY. Local development stand-in for the bKash payment page. No money moves.
	</p>
	<p class="lede">Amount: <strong>{price(data.amount_bdt)}</strong></p>
	<form method="POST" class="wallet-actions">
		<button class="button button-ink" name="decision" value="approved">Approve payment</button>
		<button class="button button-outline" name="decision" value="declined">Decline payment</button>
		<button class="button button-outline" name="decision" value="cancelled">Cancel</button>
	</form>
	<p class="hint mono">Reference {data.paymentId}</p>
</main>

<style>
	.wallet-note {
		margin-top: 16px;
	}

	.wallet-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 24px 0;
	}
</style>
