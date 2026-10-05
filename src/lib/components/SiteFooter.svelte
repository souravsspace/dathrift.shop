<footer class="site-footer">
	<p class="footer-mark" aria-hidden="true">dathrift</p>
	<div class="footer-row">
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
		overflow: hidden;
		padding: 64px var(--gutter) 28px;
		background: var(--color-ink);
		color: var(--color-ivory);
	}

	.footer-mark {
		margin: 0 0 20px;
		color: var(--color-bottle);
		font-size: clamp(5rem, 21vw, 19rem);
		font-stretch: 62%;
		font-weight: 900;
		letter-spacing: -0.04em;
		line-height: 0.78;
		user-select: none;
	}

	.footer-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px 28px;
		padding-top: 20px;
		border-top: 1px solid rgb(251 235 214 / 0.14);
		font-size: 0.86rem;
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

	a {
		text-underline-offset: 5px;
	}
</style>
