<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		id?: string;
		name?: string;
		value?: string;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		onchange?: (event: Event) => void;
		children?: Snippet;
	}

	let {
		id,
		name,
		value = $bindable(''),
		disabled = false,
		required = false,
		class: className = '',
		onchange,
		children
	}: Props = $props();
</script>

<select
	{id}
	{name}
	bind:value
	{disabled}
	{required}
	class={cn('select', className)}
	{onchange}
>
	{@render children?.()}
</select>
