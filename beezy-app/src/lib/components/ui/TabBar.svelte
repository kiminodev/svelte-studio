<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		columns?: number;
		class?: string;
		children?: Snippet;
	}

	let { columns = 3, class: className = '', children }: Props = $props();
</script>

<nav class={cn('tabbar', className)} style="grid-template-columns: repeat({columns}, 1fr)">
	{@render children?.()}
</nav>
