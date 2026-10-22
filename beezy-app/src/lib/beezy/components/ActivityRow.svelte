<script lang="ts">
	import { fmtDate, peso } from '$lib/beezy/format';
	import { Avatar, Chip, cn } from '$lib/components';

	interface Props {
		name: string;
		price: number;
		paidByName: string;
		createdAt: string;
		updatedAt?: string;
		eventTitle?: string;
		variant?: 'default' | 'payment';
		settled?: boolean;
		/** Payment variant: e.g. "3 owe ₱600 each". */
		oweLabel?: string;
		/** Payment variant: overrides date line (e.g. "tap to settle →"). */
		statusLabel?: string;
		/** Hide the "paid · name" chip (Who paid list already names the payer). */
		showPaidBy?: boolean;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		name,
		price,
		paidByName,
		createdAt,
		updatedAt,
		eventTitle,
		variant = 'default',
		settled = false,
		oweLabel,
		statusLabel,
		showPaidBy = true,
		type = 'button',
		disabled = false,
		class: className = '',
		onclick
	}: Props = $props();

	const edited = $derived(updatedAt && updatedAt !== createdAt);
	const dateLabel = $derived(
		fmtDate(createdAt) + (edited && updatedAt ? ` · edited ${fmtDate(updatedAt)}` : '')
	);
	const footerLabel = $derived(statusLabel ?? dateLabel);
</script>

<button
	{type}
	{disabled}
	{onclick}
	class={cn('act-row', variant === 'payment' && 'pay-act', settled && 'is-settled', className)}
>
	<span class="act-name">
		<Avatar name={paidByName} />
		<span class="act-title">{name}</span>
		{#if settled}
			<Chip variant="settled">settled</Chip>
		{/if}
	</span>
	<span class="act-price">{peso(price)}</span>
	<span class="act-sub">
		{#if showPaidBy}
			<Chip variant="paid">paid · {paidByName}</Chip>
		{/if}
		{#if variant === 'payment' && oweLabel}
			<span>{oweLabel}</span>
		{:else if eventTitle}
			<Chip variant="event">{eventTitle}</Chip>
		{/if}
	</span>
	<span class="act-edited">{footerLabel}</span>
</button>
