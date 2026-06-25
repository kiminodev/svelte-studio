<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		label: string;
		for?: string;
		required?: boolean;
		hint?: string;
		class?: string;
		children?: Snippet;
	}

	let {
		label,
		for: htmlFor,
		required = false,
		hint,
		class: className = '',
		children
	}: Props = $props();
</script>

<div class={cn('field', className)}>
	<label for={htmlFor}>
		{label}
		{#if required}<span class="req"> *</span>{/if}
	</label>
	{@render children?.()}
	{#if hint}<p class="field-hint">{hint}</p>{/if}
</div>
