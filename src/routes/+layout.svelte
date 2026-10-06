<script lang="ts">
	import './layout.css';
	import { onNavigate } from '$app/navigation';

	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	// Native view transitions: pages crossfade and shared garment photos morph between them.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		// Same page, new query (search, filter tab, paging): update in place, no crossfade.
		if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="32x32" />
	<link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32" />
	<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#04241a" />
</svelte:head>

{@render children()}
