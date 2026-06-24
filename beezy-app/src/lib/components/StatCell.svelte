<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		label: string;
		value: string;
		warn?: boolean;
		class?: string;
	}

	let { label, value, warn = false, class: className = '' }: Props = $props();
</script>

<div class={cn('stat-cell', className)}>
	<div class="lbl">{label}</div>
	<div class={cn('val', warn && 'warn')}>{value}</div>
</div>
