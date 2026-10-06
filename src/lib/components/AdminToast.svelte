<script lang="ts">
	let {
		text,
		kind = 'success',
		onclose
	}: { text: string; kind?: 'success' | 'error'; onclose: () => void } = $props();

	// A confirmation leaves on its own; an error stays until staff close it.
	$effect(() => {
		if (kind !== 'success' || !text) return;
		const timer = setTimeout(onclose, 5000);
		return () => clearTimeout(timer);
	});
</script>

<div class="admin-toast admin-toast-{kind}" role={kind === 'error' ? 'alert' : 'status'}>
	<svg class="admin-toast-icon" viewBox="0 0 20 20" aria-hidden="true">
		{#if kind === 'error'}<path d="M10 5.5v5.5M10 14.5v.01" />{:else}<path
				d="M5.5 10.5l3 3 6-7"
			/>{/if}
	</svg>
	<p>{text}</p>
	<button type="button" class="admin-toast-close" aria-label="Dismiss message" onclick={onclose}>
		<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
	</button>
</div>
