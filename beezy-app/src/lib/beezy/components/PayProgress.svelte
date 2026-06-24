<script lang="ts">
	import { ProgressBar, cn } from '$lib/components';

	interface Props {
		label: string;
		detail: string;
		/** Fill width 0–100. */
		value: number;
		done?: boolean;
		class?: string;
	}

	let { label, detail, value, done = false, class: className = '' }: Props = $props();

	const pct = $derived(Math.min(100, Math.max(0, Math.round(value))));
</script>

<div class={cn('pay-progress', className)}>
	<div class="pay-progress-top">
		<div>
			<div class="pp-label">{label}</div>
			<div class="pp-val">{detail}</div>
		</div>
		<div class={cn('pp-pct', done && 'done')}>{pct}%</div>
	</div>
	<div class="progress-track">
		<div
			class={cn('progress-fill', done && 'done')}
			style:width="{pct}%"
		></div>
	</div>
</div>
