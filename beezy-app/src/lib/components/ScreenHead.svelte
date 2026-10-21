<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		title: string;
		description?: string;
		class?: string;
		actions?: Snippet;
	}

	let { title, description, class: className = '', actions }: Props = $props();
</script>

<div class={cn('screen-head', className)}>
	{#if actions}
		<div class="screen-head-row">
			<h2>{title}</h2>
			{@render actions()}
		</div>
	{:else}
		<h2>{title}</h2>
	{/if}
	{#if description}<p>{description}</p>{/if}
</div>
