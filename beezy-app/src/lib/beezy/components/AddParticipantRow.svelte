<script lang="ts">
	import { Button, Input, cn } from '$lib/components';

	interface Props {
		/** Input id so create-event can focus this field after save (mockup `#pax-name`). */
		inputId?: string;
		value?: string;
		placeholder?: string;
		class?: string;
		onadd?: () => void;
	}

	let {
		inputId = 'pax-name',
		value = $bindable(''),
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
</script>

<div class={cn('add-pax', className)}>
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
