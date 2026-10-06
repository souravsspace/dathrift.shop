<script lang="ts">
	// Newest first, twenty at a time. Links when the page lives in the URL, buttons otherwise.
	let {
		page,
		pageSize,
		total,
		label,
		href,
		onchange
	}: {
		page: number;
		pageSize: number;
		total: number;
		label: string;
		href?: (page: number) => string;
		onchange?: (page: number) => void;
	} = $props();

	let pages = $derived(Math.max(1, Math.ceil(total / pageSize)));
	let first = $derived(total === 0 ? 0 : (page - 1) * pageSize + 1);
	let last = $derived(Math.min(total, page * pageSize));
</script>

{#if total > pageSize}
	<nav class="admin-pager" aria-label="{label} pages">
		<p>{first}–{last} of {total}</p>
		<div>
			{#each [{ to: page - 1, text: 'Newer', show: page > 1 }, { to: page + 1, text: 'Older', show: page < pages }] as step (step.text)}
				{#if !step.show}<span class="admin-pager-step" aria-disabled="true">{step.text}</span>
				{:else if href}<a class="admin-pager-step" href={href(step.to)}>{step.text}</a>
				{:else}<button type="button" class="admin-pager-step" onclick={() => onchange?.(step.to)}
						>{step.text}</button
					>{/if}
			{/each}
		</div>
	</nav>
{/if}
