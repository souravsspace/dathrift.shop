<script lang="ts">
	import { page } from '$app/state';
	import Icon from '../lib/components/Icon.svelte';
	import SiteHeader from '../lib/components/SiteHeader.svelte';
	import SwingTag from '../lib/components/SwingTag.svelte';

	let missing = $derived(page.status === 404);
	let title = $derived(
		missing ? 'Not found' : page.status >= 500 ? 'Temporarily unavailable' : 'Something went wrong'
	);
</script>

<svelte:head>
	<title>{title} | daThriftShop</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteHeader />

<main id="main-content" class="flow page">
	<div class="error-layout">
		<div>
			<h1 class="page-title">{title}</h1>
			<p class="lede">
				{#if missing}
					This page or piece is not in the shop. Sold pieces keep their pages, so it may never have
					been published.
				{:else}
					The shop could not load this page right now. Nothing was charged and no piece was held
					because of this error. Please try again shortly.
				{/if}
			</p>
			<div class="actions">
				<a class="button button-ink" href="/shop"
					><Icon name="arrow-left" size={18} />Back to the rack</a
				>
				<a class="button button-outline" href="/">Home</a>
			</div>
		</div>
		<div class="error-tag" aria-hidden="true">
			<SwingTag>
				<p class="tag-price">{page.status}</p>
				<p class="tag-name">{missing ? 'Not on the rack' : 'Rack closed for a moment'}</p>
			</SwingTag>
		</div>
	</div>
</main>

<style>
	.error-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(200px, 260px);
		align-items: center;
		gap: clamp(28px, 6vw, 96px);
		min-height: 50svh;
		padding-top: 40px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 28px;
	}

	@media (max-width: 700px) {
		.error-layout {
			grid-template-columns: 1fr;
		}

		.error-tag {
			width: min(70%, 240px);
			margin: 0 auto;
		}
	}
</style>
