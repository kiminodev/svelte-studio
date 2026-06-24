<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		label: string;
		danger?: boolean;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		icon?: Snippet;
	}

	let {
		label,
		danger = false,
		type = 'button',
		disabled = false,
		class: className = '',
		onclick,
		icon
	}: Props = $props();
</script>

<button {type} {disabled} {onclick} class={cn('menu-item', danger && 'danger', className)}>
	{@render icon?.()}
	{label}
</button>
