<footer class="site-footer">
	<!-- The page ends on the rack's rail: a gold bar with empty hooks waiting for the next pieces. -->
	<div class="rail" aria-hidden="true">
		{#each [1, 2, 3, 4, 5, 6, 7] as hook (hook)}<span class="hook"></span>{/each}
	</div>
	<div class="footer-row">
		<a class="footer-brand" href="/" aria-label="daThriftShop home">
			<img src="/brand/dathrift-logo.webp" alt="" width="36" height="36" loading="lazy" />
			<span>daThriftShop</span>
		</a>
		<p>One piece. One next chapter.</p>
		<nav aria-label="Footer">
			<a href="/#shop">Shop the rack</a>
			<a href="/cart">Your bag</a>
			<a href="#main-content">Back to top</a>
		</nav>
	</div>
</footer>

<style>
	.site-footer {
		padding: 0 var(--gutter) 28px;
		background: var(--color-ink);
		color: var(--color-ivory);
	}

	.rail {
		position: relative;
		display: flex;
		justify-content: space-around;
		height: 44px;
		margin-bottom: 28px;
		border-top: 4px solid var(--color-gold);
	}

	.hook {
		width: 14px;
		height: 22px;
		margin-top: -2px;
		border: 2px solid rgb(211 176 127 / 0.55);
		border-top: 0;
		border-radius: 0 0 8px 8px;
	}

	.footer-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px 28px;
		font-size: var(--text-ui);
	}

	.footer-brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: var(--text-lead);
		font-stretch: 112%;
		font-weight: 800;
		text-decoration: none;
	}

	.footer-brand img {
		border-radius: 8px;
	}

	.footer-row p {
		margin: 0;
		color: rgb(251 235 214 / 0.72);
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 22px;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		text-underline-offset: 5px;
	}
</style>
