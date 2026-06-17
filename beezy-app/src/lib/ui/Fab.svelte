<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/ui/cn';

	interface Props {
		'aria-label': string;
		hidden?: boolean;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		'aria-label': ariaLabel,
		hidden = false,
		type = 'button',
		disabled = false,
		class: className = '',
		onclick,
		children
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	{onclick}
	class={cn('fab', className)}
	aria-label={ariaLabel}
	style:display={hidden ? 'none' : 'grid'}
>
	{@render children?.()}
</button>
