<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		'aria-label': string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		'aria-label': ariaLabel,
		type = 'button',
		disabled = false,
		class: className = '',
		onclick,
		children
	}: Props = $props();
</script>

<button {type} {disabled} {onclick} class={cn('icon-btn', className)} aria-label={ariaLabel}>
	{@render children?.()}
</button>
