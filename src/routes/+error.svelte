<script lang="ts">
	import { page } from '$app/state';
	import SiteHeader from '../lib/components/SiteHeader.svelte';
	import SwingTag from '../lib/components/SwingTag.svelte';

	let missing = $derived(page.status === 404);
	let title = $derived(
		missing ? 'Not found' : page.status >= 500 ? 'Temporarily unavailable' : 'Something went wrong'
	);
</script>

<svelte:head>
	<title>{title} | dathrift</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteHeader />

<main id="main-content" class="flow-main">
	<div class="error-layout">
		<div>
			<h1>{title}</h1>
			<p class="flow-intro">
				{#if missing}
					This page or piece is not on the rack. Sold pieces keep their pages, so it may never have
					been published.
				{:else}
					The shop could not load this page right now. Nothing was charged and no piece was held
					because of this error. Please try again shortly.
				{/if}
			</p>
			<a class="button button-gold" href="/#shop">Back to the rack</a>
		</div>
		<div aria-hidden="true">
			<SwingTag>
				<p class="tag-meta">Error · {page.status}</p>
				<p class="tag-price">{page.status}</p>
				<p class="tag-name">{missing ? 'Not on the rack' : 'Rack closed for a moment'}</p>
			</SwingTag>
		</div>
	</div>
</main>
