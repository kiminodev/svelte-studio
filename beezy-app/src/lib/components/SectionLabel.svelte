<script lang="ts">
	import type { Snippet } from 'svelte';
	import Eyebrow from '$lib/components/ui/Eyebrow.svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		left: string;
		right?: string;
		class?: string;
		/** Custom right content instead of eyebrow text. */
		trailing?: Snippet;
	}

	let { left, right, class: className = '', trailing }: Props = $props();
</script>

<div class={cn('section-label', className)}>
	<Eyebrow>{left}</Eyebrow>
	{#if trailing}
		{@render trailing()}
	{:else if right}
		<Eyebrow>{right}</Eyebrow>
	{/if}
</div>
