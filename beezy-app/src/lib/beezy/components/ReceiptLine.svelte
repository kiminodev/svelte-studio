<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		label: string;
		/** Plain text value when no custom value snippet is provided. */
		text?: string;
		big?: boolean;
		total?: boolean;
		paidBy?: boolean;
		class?: string;
		value?: Snippet;
	}

	let {
		label,
		text,
		big = false,
		total = false,
		paidBy = false,
		class: className = '',
		value
	}: Props = $props();
</script>

<div class={cn('r-line', total && 'r-total', paidBy && 'r-paidby', className)}>
	<span class="k">{label}</span>
	<span class={cn('v', big && 'r-big')}>
		{#if value}
			{@render value()}
		{:else}
			{text}
		{/if}
	</span>
</div>
