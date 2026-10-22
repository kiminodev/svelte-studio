<script lang="ts">
	import { peso, receiptDateLabel } from '$lib/beezy/format';
	import { calcActivity, type ActivityLike, type Participant } from '$lib/beezy/settlement';
	import { Avatar, Icon, cn } from '$lib/components';
	import ReceiptLine from './ReceiptLine.svelte';
	import ReceiptMember from './ReceiptMember.svelte';

	export interface ReceiptActivity extends ActivityLike {
		name: string;
		createdAt: string;
		updatedAt?: string;
		paidByName: string;
	}

	interface Props {
		eventTitle: string;
		activity: ReceiptActivity;
		participants: Participant[];
		settled?: boolean;
		class?: string;
	}

	let {
		eventTitle,
		activity,
		participants,
		settled = activity.settled ?? false,
		class: className = ''
	}: Props = $props();

	const breakdown = $derived(calcActivity(activity, { participants }));
	const payerName = $derived(breakdown.payer?.name ?? activity.paidByName);
	const payerGcash = $derived(breakdown.payer?.gcash);
	const collectTotal = $derived(breakdown.others.length * breakdown.share);
	const dateLabel = $derived(receiptDateLabel(activity.createdAt, activity.updatedAt));
	const thanks = $derived(
		settled ? 'All square on this one 🤗' : 'Send this to the group 🤗'
	);
</script>

<div class={cn('receipt', settled && 'receipt-done', className)}>
	<div class="receipt-strip"></div>
	<div class="receipt-body">
		<div class="receipt-head">
			<div class="r-brand">
				<span class="r-brand-mark" aria-hidden="true"></span>
				Beezy
			</div>
			<div class="r-title">{eventTitle}</div>
			<div class="r-activity">{activity.name}</div>
			<div class="r-date">{dateLabel}</div>
			{#if settled}
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
			<ReceiptLine label="Total expense" text={peso(breakdown.total)} big />
			<ReceiptLine
				label="Split between"
				text={`${breakdown.n} ${breakdown.n === 1 ? 'person' : 'people'}`}
			/>
			<ReceiptLine label="Each pays" text={breakdown.n ? peso(breakdown.share) : '—'} />

			{#if breakdown.others.length > 0}
				<hr class="r-divider" />
				<div class="r-section-title">{payerName} collects</div>
				{#each breakdown.others as member (member.id)}
					<ReceiptMember
						name={member.name}
						owesTo={payerName}
						amount={breakdown.share}
					/>
				{/each}
				<ReceiptLine label="Total to collect" text={peso(collectTotal)} total />
				<p class="muted-block receipt-collect-note">
					{payerName}'s own share is {peso(breakdown.share)} — already covered, since they paid
					the full {peso(breakdown.total)}.
				</p>
			{:else}
				<hr class="r-divider" />
				<p class="muted-block" style="font-size: 12px">
					Solo expense — only {payerName} is in this event, so there's nothing to split.
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
</style>
