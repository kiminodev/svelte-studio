<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		emoji?: string;
		class?: string;
		children?: Snippet;
	}

	let { emoji, class: className = '', children }: Props = $props();
</script>

<div class={cn('hint-card', className)}>
	{#if emoji}<span class="h-emoji" aria-hidden="true">{emoji}</span>{/if}
	<span>
		{@render children?.()}
	</span>
</div>
