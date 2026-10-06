<script lang="ts">
	import Icon, { type IconName } from './Icon.svelte';
	import SwingTag from './SwingTag.svelte';

	const facts: { icon: IconName; title: string; text: string }[] = [
		{
			icon: 'tag',
			title: 'Price',
			text: 'What the piece costs. Delivery is added once, after your address is checked.'
		},
		{
			icon: 'ruler',
			title: 'Measurements',
			text: 'Measured on the garment in inches, not on a body or guessed from the label.'
		},
		{
			icon: 'scan-search',
			title: 'Condition',
			text: 'Every mark, fade and repair we found, written down and photographed.'
		},
		{
			icon: 'shirt',
			title: 'One of one',
			text: 'No restocks. A sold piece keeps its page, marked sold.'
		}
	];

	function backToTop() {
		const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
		document.getElementById('main-content')?.focus({ preventScroll: true });
	}
</script>

<footer class="site-footer">
	<div class="inner">
		<section class="listing" aria-labelledby="footer-listing-title">
			<div class="listing-head">
				<h2 id="footer-listing-title">Read the listing before it’s yours.</h2>
				<p>
					A second life deserves a clear first look. Every piece carries the same four facts,
					written before it goes live.
				</p>
				<a class="button button-gold" href="/shop"
					>Browse the shop <Icon name="arrow-right" size={18} /></a
				>
			</div>

			<!-- The four facts hang from the shop's gold rail, each on its own ivory tag. -->
			<ul class="rail">
				{#each facts as fact (fact.title)}
					<li>
						<SwingTag>
							<span class="fact-icon"><Icon name={fact.icon} size={20} /></span>
							<strong>{fact.title}</strong>
							<span class="fact-text">{fact.text}</span>
						</SwingTag>
					</li>
				{/each}
			</ul>
		</section>

		<div class="base">
			<a class="footer-brand" href="/" aria-label="daThriftShop home">
				<img src="/brand/dathrift-logo.webp" alt="" width="48" height="48" loading="lazy" />
				<span>
					<strong>daThriftShop</strong>
					<span>One piece. One next chapter.</span>
				</span>
			</a>
			<nav class="links" aria-label="Footer">
				<a href="/shop"><Icon name="layout-grid" size={18} />All pieces</a>
				<a href="/shop?available=1"><Icon name="circle-check" size={18} />Available now</a>
				<a href="/cart"><Icon name="shopping-bag" size={18} />Your bag</a>
				<a href="/orders"><Icon name="package" size={18} />Your orders</a>
			</nav>
			<button class="top" type="button" onclick={backToTop}>
				<Icon name="arrow-up" size={18} />Back to top
			</button>
		</div>

		<p class="fine">
			<span>Prices in Bangladeshi taka (৳). One of each, no restocks.</span>
			<span>© {new Date().getFullYear()} daThriftShop</span>
		</p>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: auto;
		padding: clamp(56px, 8vw, 104px) var(--gutter) 24px;
		background: var(--color-ink);
		color: var(--color-ivory);
	}

	.inner {
		max-width: var(--page-max);
		margin: 0 auto;
	}

	.listing-head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
		align-items: end;
		gap: 20px clamp(24px, 4vw, 64px);
	}

	.listing-head h2 {
		max-width: 14ch;
		margin: 0;
		font-size: var(--text-h1);
		font-stretch: 80%;
		font-weight: 780;
		letter-spacing: -0.025em;
		line-height: 1.02;
	}

	.listing-head p {
		max-width: 44ch;
		margin: 0;
		color: rgb(251 235 214 / 0.74);
		line-height: 1.6;
	}

	/* The rail: a gold bar the tags hang from; each tag's thread meets it exactly. */
	.rail {
		--drop: 22px;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		margin: clamp(40px, 6vw, 64px) 0 0;
		padding: 0;
		list-style: none;
	}

	.rail li {
		position: relative;
		display: grid;
		padding: var(--drop) clamp(10px, 1.6vw, 20px) 0;
	}

	.rail li::before {
		position: absolute;
		top: -2px;
		right: 0;
		left: 0;
		height: 4px;
		background: var(--color-gold);
		content: '';
	}

	.rail li:first-child::before {
		border-radius: 4px 0 0 4px;
	}

	.rail li:last-child::before {
		border-radius: 0 4px 4px 0;
	}

	.rail li > :global(.hang),
	.rail li > :global(.hang) > :global(.swinger),
	.rail li > :global(.hang) :global(.tag) {
		height: 100%;
	}

	.rail li :global(.tag) {
		display: grid;
		align-content: start;
		gap: 6px;
	}

	.fact-icon {
		display: grid;
		width: 40px;
		height: 40px;
		margin-bottom: 6px;
		place-items: center;
		border-radius: 50%;
		background: var(--color-bottle);
		color: var(--color-gold);
	}

	.rail strong {
		font-size: var(--text-large);
		font-stretch: 85%;
		font-weight: 760;
	}

	.fact-text {
		color: var(--color-ink-soft);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.base {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 24px 40px;
		margin-top: clamp(48px, 7vw, 80px);
		padding-block: 28px;
		border-block: 1px solid rgb(251 235 214 / 0.14);
	}

	.footer-brand {
		display: inline-flex;
		align-items: center;
		gap: 14px;
		text-decoration: none;
	}

	.footer-brand img {
		border-radius: var(--radius);
	}

	.footer-brand > span {
		display: grid;
		gap: 2px;
	}

	.footer-brand strong {
		font-size: var(--text-h3);
		font-stretch: 108%;
		font-weight: 800;
		letter-spacing: -0.03em;
	}

	.footer-brand span span {
		color: rgb(251 235 214 / 0.66);
		font-size: var(--text-small);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 28px;
	}

	.links a {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		min-height: 44px;
		font-size: var(--text-small);
		font-weight: 600;
		text-decoration: none;
		transition: color 200ms var(--ease-out);
	}

	.links a :global(svg) {
		color: var(--color-gold);
	}

	.links a:hover {
		color: var(--color-gold);
	}

	.top {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 18px 0 14px;
		border: 1.5px solid rgb(251 235 214 / 0.26);
		border-radius: 999px;
		background: none;
		color: var(--color-ivory);
		font: inherit;
		font-size: var(--text-small);
		font-weight: 650;
		cursor: pointer;
		transition:
			border-color 200ms var(--ease-out),
			color 200ms var(--ease-out);
	}

	.top:hover {
		border-color: var(--color-gold);
		color: var(--color-gold);
	}

	.fine {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 8px 24px;
		margin: 0;
		padding-top: 20px;
		color: rgb(251 235 214 / 0.55);
		font-family: var(--font-mono);
		font-size: var(--text-label);
	}

	@media (max-width: 1000px) {
		.listing-head {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.listing-head h2 {
			grid-column: 1 / -1;
			max-width: 18ch;
		}

		.rail {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			row-gap: 40px;
		}
	}

	@media (max-width: 600px) {
		.listing-head {
			grid-template-columns: 1fr;
			justify-items: start;
		}

		.rail {
			--drop: 15px;
			row-gap: 32px;
		}

		.rail li {
			padding-inline: 6px;
		}

		.fact-icon {
			width: 34px;
			height: 34px;
		}

		.rail strong {
			font-size: var(--text-body);
		}

		.fact-text {
			font-size: var(--text-meta);
		}

		.links {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			width: 100%;
			column-gap: 16px;
		}
	}
</style>
