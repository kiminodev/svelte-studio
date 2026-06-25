<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	type Variant = 'paid' | 'event' | 'settled' | 'default';

	interface Props {
		variant?: Variant;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'default', class: className = '', children }: Props = $props();

	const variantClass = $derived(
		variant === 'paid'
			? 'chip-paid'
			: variant === 'event'
				? 'chip-event'
				: variant === 'settled'
					? 'chip-settled'
					: ''
	);
</script>

<span class={cn('chip', variantClass, className)}>
	{@render children?.()}
</span>
