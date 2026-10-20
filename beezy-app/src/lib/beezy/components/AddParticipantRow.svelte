<script lang="ts">
	import { Button, Input, cn } from '$lib/components';

	interface Props {
		/** Input id so create-event can focus this field after save (mockup `#pax-name`). */
		inputId?: string;
		value?: string;
		placeholder?: string;
		class?: string;
		onadd?: () => void;
		onfinish?: () => void;
	}

	let {
		inputId = 'pax-name',
		value = $bindable(''),
		placeholder = 'Name (keeps adding until Finish)',
		class: className = '',
		onadd,
		onfinish
	}: Props = $props();

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			onadd?.();
		}
	}
</script>

<div class={cn('add-pax', className)}>
	<Input id={inputId} bind:value {placeholder} autocomplete="off" {onkeydown} />
	<Button variant="secondary" size="sm" type="button" onclick={onadd}>Add</Button>
	<Button variant="yellow" size="sm" type="button" onclick={onfinish}>Finish</Button>
</div>
