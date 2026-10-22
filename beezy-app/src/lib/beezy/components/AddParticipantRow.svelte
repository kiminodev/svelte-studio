<script lang="ts">
	import { GCASH_LENGTH, normalizeGcashInput } from '$lib/beezy/gcash';
	import { Button, Input, cn } from '$lib/components';

	interface Props {
		/** Input id so create-event can focus this field after save (mockup `#pax-name`). */
		inputId?: string;
		value?: string;
		gcash?: string;
		placeholder?: string;
		class?: string;
		onadd?: () => void;
	}

	let {
		inputId = 'pax-name',
		value = $bindable(''),
		gcash = $bindable(''),
		placeholder = 'e.g. Mika',
		class: className = '',
		onadd
	}: Props = $props();

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			onadd?.();
		}
	}

	/** Keep the name field focused when tapping Add so the next friend is one keystroke away. */
	function keepInputFocus(event: MouseEvent) {
		event.preventDefault();
	}

	function onGcashInput(event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		gcash = normalizeGcashInput(el.value);
	}
</script>

<div class={cn('add-pax-block', className)}>
	<div class="add-pax">
		<Input id={inputId} bind:value {placeholder} autocomplete="off" {onkeydown} />
		<Button
			variant="yellow"
			size="sm"
			type="button"
			onmousedown={keepInputFocus}
			onclick={onadd}
		>
			Add
		</Button>
	</div>
	<Input
		id="pax-gcash"
		bind:value={gcash}
		placeholder="GCash number (optional)"
		inputmode="numeric"
		maxlength={GCASH_LENGTH}
		autocomplete="off"
		aria-label="GCash number, optional, 11 digits"
		oninput={onGcashInput}
		{onkeydown}
	/>
</div>
