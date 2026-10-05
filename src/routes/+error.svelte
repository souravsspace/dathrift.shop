<script lang="ts">
	import { page } from '$app/state';

	let missing = $derived(page.status === 404);
	let title = $derived(
		missing ? 'Not found' : page.status >= 500 ? 'Temporarily unavailable' : 'Something went wrong'
	);
</script>

<svelte:head>
	<title>{title} | dathrift</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="storefront bag-page">
	<header class="site-header">
		<a class="brand" href="/" aria-label="dathrift home">
			<img src="/brand/dathrift-logo.png" alt="" width="52" height="52" />
			<span>dathrift<span class="brand-period">.</span></span>
		</a>
	</header>
	<main id="main-content">
		<p class="checkout-eyebrow">Error {page.status}</p>
		<h1>{title}</h1>
		<p class="bag-intro">
			{#if missing}
				This page or piece is not here. Sold pieces keep their pages, so it may never have been
				published.
			{:else}
				The shop could not load this page right now. Nothing was charged and no piece was held
				because of this error. Please try again shortly.
			{/if}
		</p>
		<div class="bag-state"><a href="/#shop">Back to the edit</a></div>
	</main>
</div>
