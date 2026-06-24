<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/ui/cn';

	interface Props {
		title?: string;
		subtitle?: string;
		class?: string;
		leading?: Snippet;
		brand?: Snippet;
		trailing?: Snippet;
		/** Full custom row content; overrides title/subtitle/leading/brand/trailing slots. */
		row?: Snippet;
	}

	let {
		title,
		subtitle,
		class: className = '',
		leading,
		brand,
		trailing,
		row
	}: Props = $props();
</script>

<header class={cn('appbar', className)}>
	<div class="appbar-row">
		{#if row}
			{@render row()}
		{:else}
			{@render leading?.()}
			{#if brand}
				<span class="brand-badge">
					{@render brand()}
				</span>
			{/if}
			{#if title || subtitle}
				<div class="appbar-titles">
					{#if title}<div class="appbar-title">{title}</div>{/if}
					{#if subtitle}<div class="appbar-sub">{subtitle}</div>{/if}
				</div>
			{/if}
			{@render trailing?.()}
		{/if}
	</div>
</header>
