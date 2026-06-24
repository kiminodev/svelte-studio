<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		label: string;
		active?: boolean;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		icon?: Snippet;
	}

	let {
		label,
		active = false,
		type = 'button',
		disabled = false,
		class: className = '',
		onclick,
		icon
	}: Props = $props();
</script>

<button {type} {disabled} {onclick} class={cn('tab', active && 'active', className)}>
	{@render icon?.()}
	<span class="tab-label">{label}</span>
</button>
