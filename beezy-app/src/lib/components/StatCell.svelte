<script lang="ts">
	import { cn } from '$lib/components/cn';

	interface Props {
		label: string;
		value: string;
		warn?: boolean;
		hint?: string;
		class?: string;
		onclick?: () => void;
	}

	let {
		label,
		value,
		warn = false,
		hint,
		class: className = '',
		onclick
	}: Props = $props();
</script>

{#snippet body()}
	<div class="lbl">{label}</div>
	<div class={cn('val', warn && 'warn')}>{value}</div>
	{#if hint}
		<div class="hint">{hint}</div>
	{/if}
{/snippet}

{#if onclick}
	<button type="button" class={cn('stat-cell', className)} {onclick} aria-label="Edit {label}">
		{@render body()}
	</button>
{:else}
	<div class={cn('stat-cell', className)}>
		{@render body()}
	</div>
{/if}
