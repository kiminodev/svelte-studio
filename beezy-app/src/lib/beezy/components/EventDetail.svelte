<script lang="ts">
	import { peso } from '$lib/beezy/format';
	import {
		canRemoveParticipant,
		calcEvent,
		calcOutstanding,
		isEventSettled,
		type ActivityLike,
		type Participant
	} from '$lib/beezy/settlement';
	import AddParticipantRow from '$lib/components/ui/AddParticipantRow.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import HintCard from '$lib/components/ui/HintCard.svelte';
	import Icon from '$lib/components/ui/icons/Icon.svelte';
	import ParticipantRow from '$lib/components/ui/ParticipantRow.svelte';
	import SectionLabel from '$lib/components/ui/SectionLabel.svelte';
	import StatCell from '$lib/components/ui/StatCell.svelte';
	import StatGrid from '$lib/components/ui/StatGrid.svelte';

	export interface EventDetailData {
		id: string;
		title: string;
		budget: number;
		participants: Participant[];
		activities: ActivityLike[];
	}

	interface Props {
		event: EventDetailData;
		onaddparticipant?: (name: string) => void;
		onfinishparticipants?: () => void;
		onremoveparticipant?: (id: string) => void;
		onaddexpense?: () => void;
		onsettleup?: () => void;
		ondelete?: () => void;
	}

	let {
		event,
		onaddparticipant,
		onfinishparticipants,
		onremoveparticipant,
		onaddexpense,
		onsettleup,
		ondelete
	}: Props = $props();

	let paxName = $state('');

	const full = $derived(calcEvent(event.participants, event.activities));
	const outstanding = $derived(calcOutstanding(event.participants, event.activities));
	const overBudget = $derived(full.total > event.budget);
	const allSettled = $derived(isEventSettled(event.activities));
	const noParticipants = $derived(event.participants.length === 0);

	function paidForParticipant(id: string): number {
		return full.rows.find((r) => r.id === id)?.paid ?? 0;
	}

	function outstandingRow(id: string) {
		return outstanding.rows.find((r) => r.id === id);
	}

	function handleAdd() {
		const name = paxName.trim();
		if (!name) return;
		onaddparticipant?.(name);
		paxName = '';
	}

	function handleFinish() {
		if (paxName.trim()) handleAdd();
		onfinishparticipants?.();
	}
</script>

<StatGrid>
	<StatCell label="Budget" value={peso(event.budget)} />
	<StatCell label="Spent" value={peso(full.total)} />
	<StatCell
		label="Share / pax"
		value={full.n ? peso(full.share) : '—'}
		warn={overBudget}
	/>
</StatGrid>

{#if noParticipants}
	<HintCard emoji="👋">
		No participants yet. Add everyone below — the budget splits equally once you're done.
	</HintCard>
{/if}

<SectionLabel
	left="Add participants"
	right={event.participants.length ? `${event.participants.length} added` : undefined}
/>

<AddParticipantRow
	bind:value={paxName}
	onadd={handleAdd}
	onfinish={handleFinish}
/>

{#if event.participants.length > 0}
	<SectionLabel left="Participants & balances" />

	{#each event.participants as p (p.id)}
		{@const row = outstandingRow(p.id)}
		<ParticipantRow
			name={p.name}
			paid={paidForParticipant(p.id)}
			balance={row?.balance ?? 0}
			removable={canRemoveParticipant(p.id, event.activities)}
			onremove={() => onremoveparticipant?.(p.id)}
		/>
	{/each}

	<p class="muted-block pax-balance-note">
		Outstanding balance across unsettled expenses. Positive = owed money, negative = owes.{#if allSettled}
			Everyone's settled up ✅{/if}
	</p>

	<div class="pax-actions">
		<Button variant="secondary" size="sm" type="button" onclick={onaddexpense}>
			+ Add an expense
		</Button>
		<Button variant="yellow" size="sm" type="button" onclick={onsettleup}>Settle up →</Button>
	</div>
{/if}

<Divider />

<Button variant="danger" size="sm" type="button" onclick={ondelete}>
	<Icon name="trash" />
	Delete event
</Button>
