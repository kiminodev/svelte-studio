<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { cn } from '$lib/ui/cn';

	interface Props {
		value?: string;
		placeholder?: string;
		class?: string;
		onadd?: () => void;
		onfinish?: () => void;
	}

	let {
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
	<Input bind:value {placeholder} autocomplete="off" {onkeydown} />
	<Button variant="secondary" size="sm" type="button" onclick={onadd}>Add</Button>
	<Button variant="yellow" size="sm" type="button" onclick={onfinish}>Finish</Button>
</div>
