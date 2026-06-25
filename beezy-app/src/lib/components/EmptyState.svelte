<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		emoji: string;
		title: string;
		description?: string;
		class?: string;
		/** CTA slot — typically a Button. */
		actions?: Snippet;
	}

	let { emoji, title, description, class: className = '', actions }: Props = $props();
</script>

<div class={cn('empty', className)}>
	<div class="empty-badge" aria-hidden="true">{emoji}</div>
	<h3>{title}</h3>
	{#if description}<p>{description}</p>{/if}
	{#if actions}
		{@render actions()}
	{/if}
</div>
