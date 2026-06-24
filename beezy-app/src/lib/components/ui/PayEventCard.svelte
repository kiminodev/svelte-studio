<script lang="ts">
	import Icon from '$lib/components/ui/icons/Icon.svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		title: string;
		summary: string;
		settled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		title,
		summary,
		settled = false,
		type = 'button',
		disabled = false,
		class: className = '',
		onclick
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	{onclick}
	class={cn('pay-event-card', settled && 'is-settled', className)}
>
	<span class={cn('ri', settled && 'ri-done')}>
		<Icon name={settled ? 'check' : 'receipt'} />
	</span>
	<span class="rt">
		<h3>{title}</h3>
		<p>{summary}</p>
	</span>
	<span class="chev" aria-hidden="true">
		<Icon name="chev" />
	</span>
</button>
