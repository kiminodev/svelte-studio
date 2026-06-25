<script lang="ts">
	import { cn } from '$lib/components/cn';

	interface Props {
		id?: string;
		name?: string;
		type?: string;
		value?: string | number;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		autocomplete?: HTMLInputElement['autocomplete'];
		inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
		class?: string;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
	}

	let {
		id,
		name,
		type = 'text',
		value = $bindable(''),
		placeholder,
		disabled = false,
		required = false,
		autocomplete,
		inputmode,
		class: className = '',
		oninput,
		onchange,
		onkeydown
	}: Props = $props();
</script>

<input
	{id}
	{name}
	{type}
	bind:value
	{placeholder}
	{disabled}
	{required}
	{autocomplete}
	{inputmode}
	class={cn('input', className)}
	{oninput}
	{onchange}
	{onkeydown}
/>
