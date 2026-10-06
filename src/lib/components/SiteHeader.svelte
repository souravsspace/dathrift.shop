<script lang="ts">
	import { onMount } from 'svelte';
	import { BAG_EVENT, readCartIds } from '../cart/browser-cart';

	let { preview = false, current }: { preview?: boolean; current?: 'shop' | 'bag' } = $props();
	let count = $state(0);

	onMount(() => {
		const refresh = () => (count = readCartIds(window.localStorage).length);
		refresh();
		window.addEventListener(BAG_EVENT, refresh);
		window.addEventListener('storage', refresh);
		return () => {
			window.removeEventListener(BAG_EVENT, refresh);
			window.removeEventListener('storage', refresh);
		};
	});
</script>

<a class="skip-link" href="#main-content">Skip to content</a>
{#if preview}<div class="preview-strip">
		{import.meta.env.DEV ? 'Local preview · test pieces only' : 'Test pieces · not for sale'}
	</div>{/if}
<header class="site-header">
	<a class="brand" href="/" aria-label="daThriftShop home">
		<img src="/brand/dathrift-logo.webp" alt="" width="40" height="40" />
		<span>daThriftShop</span>
	</a>
	<nav aria-label="Main navigation">
		<a href="/#shop" aria-current={current === 'shop' ? 'page' : undefined}>Shop</a>
		<a
			class="bag-link"
			href="/cart"
			aria-current={current === 'bag' ? 'page' : undefined}
			aria-label={count ? `Bag, ${count} ${count === 1 ? 'piece' : 'pieces'}` : 'Bag'}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"
				><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg
			>
			<span class="bag-label">Bag</span>
			{#if count}<span class="bag-count" aria-hidden="true">{count}</span>{/if}
		</a>
	</nav>
</header>

<style>
	.skip-link {
		position: absolute;
		top: -100px;
		left: 16px;
		z-index: 50;
		padding: 10px 14px;
		background: var(--color-gold);
		color: var(--color-ink);
		font-weight: 700;
	}

	.skip-link:focus {
		top: 12px;
	}

	.preview-strip {
		padding: 7px 16px;
		background: var(--color-gold);
		color: var(--color-ink);
		font-family: var(--font-mono);
		font-size: var(--text-label);
		letter-spacing: 0.04em;
		text-align: center;
		text-transform: uppercase;
	}

	.site-header {
		position: sticky;
		top: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 12px var(--gutter);
		border-bottom: 1px solid rgb(251 235 214 / 0.12);
		background: var(--color-ink);
		color: var(--color-ivory);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: var(--text-heading);
		font-stretch: 112%;
		font-weight: 800;
		letter-spacing: -0.03em;
		text-decoration: none;
	}

	.brand img {
		width: 40px;
		height: 40px;
		border-radius: 8px;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 14px;
		border-radius: 999px;
		font-size: var(--text-ui);
		font-weight: 600;
		text-decoration: none;
		transition: background-color 200ms var(--ease-out);
	}

	nav a:hover,
	nav a[aria-current='page'] {
		background: rgb(251 235 214 / 0.1);
	}

	.bag-link svg {
		width: 20px;
		height: 20px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linejoin: round;
	}

	.bag-count {
		display: grid;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		place-items: center;
		border-radius: 999px;
		background: var(--color-gold);
		color: var(--color-ink);
		font-family: var(--font-mono);
		font-size: var(--text-label);
		font-weight: 700;
	}

	@media (max-width: 480px) {
		.brand {
			font-size: var(--text-lead);
		}

		.brand img {
			width: 34px;
			height: 34px;
		}

		nav a {
			padding: 0 10px;
		}
	}

	/* The smallest phones keep the full name; the bag shows its icon and count, and its
	   accessible name still says "Bag". */
	@media (max-width: 380px) {
		.site-header {
			gap: 8px;
		}

		.brand {
			gap: 8px;
			font-stretch: 100%;
		}

		.brand img {
			width: 30px;
			height: 30px;
		}

		nav {
			gap: 2px;
		}

		nav a {
			padding: 0 10px;
		}

		.bag-label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}
</style>
