<script lang="ts">
	import { tick } from 'svelte';
	import { formatAmountInput, normalizeAmountDigits } from '$lib/beezy/format';
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

	let inputEl: HTMLInputElement | undefined = $state();
	let display = $state(formatAmountInput(value));

	$effect(() => {
		display = formatAmountInput(value);
	});

	/** Place the caret after `digitCount` digits, skipping commas. */
	function caretFromDigitCount(formatted: string, digitCount: number): number {
		if (digitCount <= 0) return 0;
		let seen = 0;
		for (let i = 0; i < formatted.length; i++) {
			if (formatted[i] >= '0' && formatted[i] <= '9') {
				seen += 1;
				if (seen === digitCount) return i + 1;
			}
		}
		return formatted.length;
	}

	async function handleInput(event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		const caretDigits = el.value.slice(0, el.selectionStart ?? 0).replace(/\D/g, '').length;
		const digits = normalizeAmountDigits(el.value);
		display = formatAmountInput(digits);
		value = digits;
		await tick();
		const pos = caretFromDigitCount(display, caretDigits);
		inputEl?.setSelectionRange(pos, pos);
		oninput?.(event);
	}
</script>

<div class="amount-wrap">
	<span class="cur" aria-hidden="true">{currency}</span>
	<input
		bind:this={inputEl}
		{id}
		{name}
		type="text"
		inputmode="numeric"
		autocomplete="off"
		value={display}
		{placeholder}
		{disabled}
		{required}
		class={cn('input amount', className)}
		oninput={handleInput}
		{onchange}
	/>
</div>
