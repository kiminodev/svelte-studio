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
		/** Associates a footer submit with a form in the sheet body. */
		form?: string;
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
		form,
		disabled = false,
		class: className = '',
		onclick,
		children
	}: Props = $props();
</script>

<button
	{type}
	{form}
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
