<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class={cn('summary-grid', className)}>
	{@render children?.()}
</div>
