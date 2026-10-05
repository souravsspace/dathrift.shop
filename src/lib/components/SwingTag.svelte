<script lang="ts">
	import type { Snippet } from 'svelte';
	import { swing as swingOnHover } from '../motion';

	let {
		size = 'card',
		swing = true,
		children
	}: {
		size?: 'card' | 'hero' | 'detail';
		swing?: boolean;
		children: Snippet;
	} = $props();
</script>

<!-- A die-cut ivory tag hanging from a thread through a gold eyelet. -->
<div class="hang hang-{size}">
	<div class="swinger" {@attach swing ? swingOnHover : undefined}>
		<span class="thread" aria-hidden="true"></span>
		<div class="tag">
			{@render children()}
		</div>
		<span class="eyelet" aria-hidden="true"></span>
	</div>
</div>

<style>
	.hang {
		--cut: 18px;
		--hole: 7px;
		--hole-top: 22px;
		position: relative;
		filter: drop-shadow(0 10px 14px rgb(2 20 14 / 0.35)) drop-shadow(0 2px 3px rgb(2 20 14 / 0.3));
	}

	.swinger {
		position: relative;
		transform-origin: 50% var(--hole-top);
	}

	.thread {
		position: absolute;
		bottom: calc(100% - var(--hole-top));
		left: 50%;
		width: 1.5px;
		height: 44px;
		background: linear-gradient(var(--color-gold-deep), var(--color-gold));
		translate: -50% 0;
	}

	.tag {
		position: relative;
		padding: calc(var(--hole-top) + var(--hole) + 16px) 22px 22px;
		background: var(--color-ivory);
		color: var(--color-ink);
		clip-path: polygon(
			var(--cut) 0,
			calc(100% - var(--cut)) 0,
			100% var(--cut),
			100% 100%,
			0 100%,
			0 var(--cut)
		);
		mask: radial-gradient(
			circle at 50% var(--hole-top),
			transparent var(--hole),
			#000 calc(var(--hole) + 0.5px)
		);
	}

	.eyelet {
		position: absolute;
		top: calc(var(--hole-top) - var(--hole) - 3px);
		left: 50%;
		width: calc(var(--hole) * 2 + 6px);
		aspect-ratio: 1;
		border: 3px solid var(--color-gold);
		border-radius: 50%;
		translate: -50% 0;
		box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.35);
	}

	.hang-hero {
		--cut: 26px;
		--hole: 9px;
		--hole-top: 30px;
	}

	.hang-hero .tag {
		padding: calc(var(--hole-top) + var(--hole) + 22px) clamp(22px, 3vw, 34px)
			clamp(24px, 3vw, 34px);
	}

	.hang-detail {
		--cut: 24px;
		--hole: 8px;
		--hole-top: 28px;
	}

	.hang-detail .tag {
		padding: calc(var(--hole-top) + var(--hole) + 22px) clamp(20px, 3.4vw, 40px)
			clamp(24px, 3.4vw, 40px);
	}

	@media (max-width: 600px) {
		.hang-card {
			--cut: 12px;
			--hole: 5px;
			--hole-top: 15px;
		}

		.hang-card .tag {
			padding: calc(var(--hole-top) + var(--hole) + 10px) 12px 14px;
		}

		.hang-card .thread {
			height: 30px;
		}
	}
</style>
