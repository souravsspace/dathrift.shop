<script lang="ts">
	import { formatBdt as price } from '../../../lib/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Test wallet | dathrift</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main id="main-content" class="flow-main">
	<h1>Test wallet</h1>
	<p class="test-banner">
		TEST ONLY. Local development stand-in for the bKash payment page. No money moves.
	</p>
	<p class="flow-intro">Amount: <strong>{price(data.amount_bdt)}</strong></p>
	<form method="POST" class="wallet-actions">
		<button class="button button-gold" name="decision" value="approved">Approve payment</button>
		<button class="button button-line" name="decision" value="declined">Decline payment</button>
		<button class="button button-line" name="decision" value="cancelled">Cancel</button>
	</form>
	<p class="order-fine">Reference {data.paymentId}</p>
</main>
