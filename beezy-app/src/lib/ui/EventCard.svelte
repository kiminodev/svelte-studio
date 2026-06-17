<script lang="ts">
	import { peso, fmtDate } from '$lib/kkb/format';
	import Eyebrow from '$lib/ui/Eyebrow.svelte';
	import ProgressBar from '$lib/ui/ProgressBar.svelte';
	import { cn } from '$lib/ui/cn';

	interface Props {
		title: string;
		createdAt: string;
		budget: number;
		paxCount: number;
		activityCount: number;
		spent: number;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		title,
		createdAt,
		budget,
		paxCount,
		activityCount,
		spent,
		type = 'button',
		disabled = false,
		class: className = '',
		onclick
	}: Props = $props();

	const pct = $derived(budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0);
	const overBudget = $derived(spent > budget);
	const progressVariant = $derived(overBudget ? 'over' : 'default');
	const rightLabel = $derived(
		overBudget ? `${peso(spent - budget)} over` : `${peso(budget - spent)} left`
	);
</script>

<button {type} {disabled} {onclick} class={cn('event-card', className)}>
	<div class="event-card-top">
		<div>
			<h3>{title}</h3>
			<Eyebrow>{fmtDate(createdAt)}</Eyebrow>
		</div>
		<span class="event-budget-tag">Budget {peso(budget)}</span>
	</div>
	<div class="event-meta">
		<span><b>{paxCount}</b> pax</span>
		<span><b>{activityCount}</b> activities</span>
		<span>Spent <b>{peso(spent)}</b></span>
	</div>
	<ProgressBar
		value={pct}
		variant={progressVariant}
		labelLeft={`${pct}% of budget`}
		labelRight={rightLabel}
		overRight={overBudget}
	/>
</button>
