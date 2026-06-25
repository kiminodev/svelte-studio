<script lang="ts">
	import { cn } from '$lib/components/cn';

	type Variant = 'default' | 'over' | 'done';

	interface Props {
		/** Fill width 0–100. */
		value: number;
		variant?: Variant;
		labelLeft?: string;
		labelRight?: string;
		/** Style the right label as over-budget (danger). */
		overRight?: boolean;
		class?: string;
	}

	let {
		value,
		variant = 'default',
		labelLeft,
		labelRight,
		overRight = false,
		class: className = ''
	}: Props = $props();

	const pct = $derived(Math.min(100, Math.max(0, value)));
	const fillClass = $derived(
		variant === 'over' ? 'over' : variant === 'done' ? 'done' : ''
	);
</script>

<div class={cn('progress', className)}>
	<div class="progress-track">
		<div class={cn('progress-fill', fillClass)} style:width="{pct}%"></div>
	</div>
	{#if labelLeft || labelRight}
		<div class="progress-row">
			{#if labelLeft}<span>{labelLeft}</span>{:else}<span></span>{/if}
			{#if labelRight}
				<span class={overRight ? 'over-txt' : ''}>{labelRight}</span>
			{/if}
		</div>
	{/if}
</div>
