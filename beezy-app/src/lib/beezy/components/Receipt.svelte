<script lang="ts">
	import { peso, receiptDateLabel } from '$lib/beezy/format';
	import { gcashReceiptLabel } from '$lib/beezy/gcash';
	import {
		calcActivity,
		splitBetweenLabel,
		type ActivityLike,
		type Participant
	} from '$lib/beezy/settlement';
	import { Avatar, Icon, cn } from '$lib/components';
	import ReceiptLine from './ReceiptLine.svelte';

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
				<ReceiptLine label={gcashReceiptLabel(payerName)} text={payerGcash} />
			{/if}
			<ReceiptLine label="Total expense" text={peso(breakdown.total)} big />
			<ReceiptLine
				class="r-split"
				label="Split between"
				text={splitBetweenLabel(breakdown)}
			/>

			{#if breakdown.others.length > 0}
				<hr class="r-divider" />
				<ReceiptLine
					class="r-each-pays"
					label="Each pays"
					text={breakdown.n ? peso(breakdown.share) : '—'}
				/>
				<ReceiptLine label="{payerName} collects" text={peso(collectTotal)} big />
				<p class="muted-block receipt-collect-note">
					{payerName}'s own share is {peso(breakdown.share)} — already covered, since they paid
					the full {peso(breakdown.total)}.
				</p>
			{:else}
				<hr class="r-divider" />
				<p class="muted-block" style="font-size: 12px">
					{#if breakdown.splitEveryone}
						Solo expense — only {payerName} is in this event, so there's nothing to split.
					{:else}
						Only {payerName} is on this split, so there's nothing to collect.
					{/if}
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
