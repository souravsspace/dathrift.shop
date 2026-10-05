<script lang="ts">
	import { stampPress } from '../motion';

	let {
		kind,
		pressed = false
	}: { kind: 'sold' | 'reserved' | 'bag' | 'published' | 'draft'; pressed?: boolean } = $props();
	const labels = {
		sold: 'Sold out',
		reserved: 'On hold',
		bag: 'In your bag',
		published: 'Published',
		draft: 'Draft'
	};
</script>

<!-- Status marks land once with a press and then stay still. -->
<span class="stamp stamp-{kind}" {@attach pressed ? stampPress : undefined}>{labels[kind]}</span>

<style>
	.stamp {
		display: inline-block;
		padding: 5px 10px 4px;
		border: 2px solid currentColor;
		outline: 1px solid currentColor;
		outline-offset: 2px;
		font-size: var(--text-stamp);
		font-stretch: 75%;
		font-weight: 800;
		letter-spacing: 0.08em;
		line-height: 1;
		text-transform: uppercase;
		white-space: nowrap;
		rotate: -8deg;
		mix-blend-mode: multiply;
	}

	.stamp-sold {
		color: var(--color-rust);
	}

	.stamp-reserved {
		color: var(--color-gold-deep);
	}

	.stamp-bag,
	.stamp-published {
		color: var(--color-bottle);
	}

	.stamp-draft {
		color: var(--color-ink-soft);
	}
</style>
