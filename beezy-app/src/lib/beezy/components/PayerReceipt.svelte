<script lang="ts">
	import { bundleReceiptDateLabel, peso, sortNewestFirst } from '$lib/beezy/format';
	import { calcPayerBundle } from '$lib/beezy/settlement';
	import type { Activity, Participant } from '$lib/beezy/types';
	import { Avatar, Icon, cn } from '$lib/components';
	import ReceiptLine from './ReceiptLine.svelte';
	import ReceiptMember from './ReceiptMember.svelte';

	interface Props {
		eventTitle: string;
		paidById: string;
		activities: Activity[];
		participants: Participant[];
		class?: string;
	}

	let {
		eventTitle,
		paidById,
		activities,
		participants,
		class: className = ''
	}: Props = $props();

	const bundle = $derived(calcPayerBundle(activities, paidById, { participants }));
	const payerName = $derived(bundle.payer?.name ?? '—');
	const payerGcash = $derived(bundle.payer?.gcash);
	const collectTotal = $derived(bundle.others.length * bundle.share);
	const openCount = $derived(bundle.activities.filter((a) => !a.settled).length);
	const countLabel = $derived.by(() => {
		const n = bundle.activities.length;
		const all = n === 1 ? '1 expense' : `${n} expenses`;
		if (bundle.settled) return `${all} · all settled`;
		if (openCount < n) return `${openCount} of ${n} still open`;
		return all;
	});
	const totalLabel = $derived(openCount < bundle.activities.length ? 'Still open' : 'Total expense');
	const items = $derived(sortNewestFirst(bundle.activities));
	const dateLabel = $derived(bundleReceiptDateLabel(items));
	const thanks = $derived(
		bundle.settled ? 'All square on this one 🤗' : 'Send this to the group 🤗'
	);
</script>

<div class={cn('receipt', bundle.settled && 'receipt-done', className)}>
	<div class="receipt-strip"></div>
	<div class="receipt-body">
		<div class="receipt-head">
			<div class="r-brand">
				<span class="r-brand-mark" aria-hidden="true"></span>
				Beezy
			</div>
			<div class="r-title">{eventTitle}</div>
			<div class="r-activity">{payerName}'s expenses</div>
			{#if dateLabel}
				<div class="r-date">{dateLabel}</div>
			{/if}
			<div class="r-date">{countLabel}</div>
			{#if bundle.settled}
				<div class="r-settled">
					<Icon name="check" />
					Settled
				</div>
			{/if}
		</div>

		<div class="receipt-lines">
			<ReceiptLine label="Paid by" paidBy>
				{#snippet value()}
					<Avatar name={payerName} size="sm" />
					<span class="receipt-payer-name">{payerName}</span>
				{/snippet}
			</ReceiptLine>
			{#if payerGcash}
				<ReceiptLine label="Send to" text={payerGcash} />
			{/if}
			<ReceiptLine
				label="Split between"
				text={`${bundle.n} ${bundle.n === 1 ? 'person' : 'people'}`}
			/>

			<hr class="r-divider" />
			<div class="r-section-title">They covered</div>
			{#each items as item (item.id)}
				<ReceiptLine
					class={item.settled ? 'r-settled-item' : ''}
					label={item.name}
					text={peso(item.price)}
				/>
			{/each}
			<ReceiptLine label={totalLabel} text={peso(bundle.total)} big />
			<ReceiptLine
				class="r-each-pays"
				label="Each pays"
				text={bundle.n ? peso(bundle.share) : '—'}
			/>

			{#if bundle.settled}
				<hr class="r-divider" />
				<p class="muted-block" style="font-size: 12px">
					Nothing left to collect — these expenses are already settled.
				</p>
			{:else if bundle.others.length > 0}
				<hr class="r-divider" />
				<div class="r-section-title">{payerName} collects</div>
				{#each bundle.others as member (member.id)}
					<ReceiptMember name={member.name} owesTo={payerName} amount={bundle.share} />
				{/each}
				<ReceiptLine label="Total to collect" text={peso(collectTotal)} total />
				<p class="muted-block receipt-collect-note">
					{payerName}'s own share is {peso(bundle.share)} — already covered, since they paid
					the full {peso(bundle.total)}.
				</p>
			{:else}
				<hr class="r-divider" />
				<p class="muted-block" style="font-size: 12px">
					Solo trip — only {payerName} is on this event, so there's nothing to split.
				</p>
			{/if}
		</div>
	</div>
	<div class="receipt-foot">
		<div class="r-thanks">{thanks}</div>
		<div class="r-meta">Made with Beezy · saved on this phone</div>
	</div>
	<div class="receipt-tear"></div>
</div>

<style>
	.receipt-payer-name {
		margin-left: 6px;
	}

	.receipt :global(.r-each-pays .k),
	.receipt :global(.r-each-pays .v) {
		color: var(--success);
	}
</style>
