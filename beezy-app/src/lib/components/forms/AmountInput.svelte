<script lang="ts">
	import { cn } from '$lib/components/cn';

	interface Props {
		id?: string;
		name?: string;
		value?: string | number;
		placeholder?: string;
		disabled?: boolean;
		required?: boolean;
		currency?: string;
		class?: string;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
	}

	let {
		id,
		name,
		value = $bindable(''),
		placeholder = '0',
		disabled = false,
		required = false,
		currency = '₱',
		class: className = '',
		oninput,
		onchange
	}: Props = $props();
</script>

<div class="amount-wrap">
	<span class="cur" aria-hidden="true">{currency}</span>
	<input
		{id}
		{name}
		type="text"
		inputmode="numeric"
		bind:value
		{placeholder}
		{disabled}
		{required}
		class={cn('input amount', className)}
		{oninput}
		{onchange}
	/>
</div>
