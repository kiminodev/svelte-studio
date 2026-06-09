<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/ui/cn';

	interface Props {
		accent?: boolean;
		class?: string;
		children?: Snippet;
	}

	let { accent = false, class: className = '', children }: Props = $props();
</script>

<span class={cn('eyebrow', accent && 'eyebrow-accent', className)}>
	{@render children?.()}
</span>
