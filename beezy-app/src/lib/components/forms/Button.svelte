<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	type Variant = 'primary' | 'yellow' | 'secondary' | 'ghost' | 'danger';
	type Size = 'default' | 'sm';

	interface Props {
		variant?: Variant;
		size?: Size;
		block?: boolean;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		variant = 'secondary',
		size = 'default',
		block = false,
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
	class={cn(
		'btn',
		`btn-${variant}`,
		size === 'sm' && 'btn-sm',
		block && 'btn-block',
		className
	)}
>
	{@render children?.()}
</button>
