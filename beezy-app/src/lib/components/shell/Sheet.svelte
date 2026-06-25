<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		open?: boolean;
		title?: string;
		class?: string;
		head?: Snippet;
		body?: Snippet;
		foot?: Snippet;
	}

	let { open = false, title, class: className = '', head, body, foot }: Props = $props();
</script>

<div class={cn('overlay', !open && 'hidden', className)}>
	{#if head}
		{@render head()}
	{:else if title}
		<div class="sheet-head">
			<h3>{title}</h3>
		</div>
	{/if}
	{#if body}
		<div class="sheet-body">
			{@render body()}
		</div>
	{/if}
	{#if foot}
		<div class="sheet-foot">
			{@render foot()}
		</div>
	{/if}
</div>
