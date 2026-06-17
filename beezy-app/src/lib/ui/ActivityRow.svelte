<script lang="ts">
	import { fmtDate, peso } from '$lib/kkb/format';
	import Avatar from '$lib/ui/Avatar.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import { cn } from '$lib/ui/cn';

	interface Props {
		name: string;
		price: number;
		paidByName: string;
		createdAt: string;
		updatedAt?: string;
		eventTitle?: string;
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
		type = 'button',
		disabled = false,
		class: className = '',
		onclick
	}: Props = $props();

	const edited = $derived(updatedAt && updatedAt !== createdAt);
	const dateLabel = $derived(
		fmtDate(createdAt) + (edited && updatedAt ? ` · edited ${fmtDate(updatedAt)}` : '')
	);
</script>

<button {type} {disabled} {onclick} class={cn('act-row', className)}>
	<span class="act-name">
		<Avatar name={paidByName} />
		{name}
	</span>
	<span class="act-price">{peso(price)}</span>
	<span class="act-sub">
		<Chip variant="paid">paid · {paidByName}</Chip>
		{#if eventTitle}
			<Chip variant="event">{eventTitle}</Chip>
		{/if}
	</span>
	<span class="act-edited">{dateLabel}</span>
</button>
