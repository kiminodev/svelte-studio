<script lang="ts">
	import { peso } from '$lib/beezy/format';
	import { parseGcash } from '$lib/beezy/gcash';
	import {
		canRemoveParticipant,
		calcEvent,
		calcOutstanding,
		isEventSettled,
		participantNameTaken,
		type ActivityLike,
		type Participant
	} from '$lib/beezy/settlement';
	import AddParticipantRow from './AddParticipantRow.svelte';
	import ParticipantRow from './ParticipantRow.svelte';
	import {
		Button,
		ConfirmSheet,
		Divider,
		HintCard,
		Icon,
		SectionLabel,
		StatCell,
		StatGrid
	} from '$lib/components';

	export interface EventDetailData {
		id: string;
		title: string;
		budget: number;
		participants: Participant[];
		activities: ActivityLike[];
	}

	interface Props {
		event: EventDetailData;
		onaddparticipant?: (name: string, gcash?: string) => void;
		onduplicate?: (name: string) => void;
		oninvalid?: (message: string) => void;
		onremoveparticipant?: (id: string) => void;
		onaddexpense?: () => void;
		onsettleup?: () => void;
		onedit?: () => void;
		ondelete?: () => void;
	}

	let {
		event,
		onaddparticipant,
		onduplicate,
		oninvalid,
		onremoveparticipant,
		onaddexpense,
		onsettleup,
		onedit,
		ondelete
	}: Props = $props();

	let paxName = $state('');
	let paxGcash = $state('');
	let pendingDelete = $state<
		| null
		| { kind: 'event' }
		| { kind: 'person'; id: string; name: string }
		| { kind: 'person-blocked'; name: string }
	>(null);

	const confirmMessage = $derived.by(() => {
		if (pendingDelete?.kind === 'person-blocked') {
			return `${pendingDelete.name} already paid for an activity, settle up first`;
		}
		if (pendingDelete?.kind === 'person') {
			return `${pendingDelete.name} will be taken off this trip. You can add them again later.`;
		}
		return 'This deletes the trip and every expense in it. You cannot undo this.';
	});
	const confirmLabel = $derived(
		pendingDelete?.kind === 'person-blocked'
			? ''
			: pendingDelete?.kind === 'person'
				? 'Remove'
				: 'Delete trip'
	);

	const full = $derived(calcEvent(event, event.activities));
	const outstanding = $derived(calcOutstanding(event, event.activities));
	const overBudget = $derived(full.total > event.budget);
	const allSettled = $derived(isEventSettled(event, event.activities));
	const noParticipants = $derived(event.participants.length === 0);

	function outstandingRow(id: string) {
		return outstanding.rows.find((r) => r.id === id);
	}

	function handleAdd() {
		const name = paxName.trim();
		if (!name) return;
		if (participantNameTaken(event.participants, name)) {
			onduplicate?.(name);
			return;
		}
		const gcash = parseGcash(paxGcash);
		if (!gcash.ok) {
			oninvalid?.('GCash must be 11 digits, or leave it blank.');
			return;
		}
		onaddparticipant?.(name, gcash.value);
		paxName = '';
		paxGcash = '';
	}

	function requestRemovePerson(id: string, name: string) {
		if (!canRemoveParticipant(id, event.activities)) {
			pendingDelete = { kind: 'person-blocked', name };
			return;
		}
		pendingDelete = { kind: 'person', id, name };
	}

	function handleConfirmDelete() {
		const pending = pendingDelete;
		pendingDelete = null;
		if (!pending) return;
		if (pending.kind === 'person-blocked') return;
		if (pending.kind === 'person') {
			onremoveparticipant?.(pending.id);
			return;
		}
		ondelete?.();
	}
</script>

<StatGrid>
	<StatCell
		label="Budget"
		hint="tap to edit"
		value={peso(event.budget)}
		onclick={onedit}
	/>
	<StatCell label="Spent" value={peso(full.total)} />
	<StatCell
		label="Each person"
		value={full.n ? peso(full.share) : '—'}
		warn={overBudget}
	/>
</StatGrid>

{#if noParticipants}
	<HintCard emoji="👋">
		No one on this trip yet. Add everyone below — the bill splits equally.
	</HintCard>
{/if}

<SectionLabel
	left="Add friends"
	right={event.participants.length ? `${event.participants.length} added` : undefined}
/>

<AddParticipantRow bind:value={paxName} bind:gcash={paxGcash} onadd={handleAdd} />

{#if event.participants.length > 0}
	<SectionLabel left="Who's in" />

	{#each event.participants as p (p.id)}
		{@const row = outstandingRow(p.id)}
		<ParticipantRow
			name={p.name}
			balance={row?.balance ?? 0}
			gcash={p.gcash}
			onremove={() => requestRemovePerson(p.id, p.name)}
		/>
	{/each}

	<p class="muted-block pax-balance-note">
		What's left to settle. Green means the group owes them; red means they still need to pay.{#if allSettled}
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

<Button variant="danger" size="sm" type="button" onclick={() => (pendingDelete = { kind: 'event' })}>
	<Icon name="trash" />
	Delete event
</Button>

<ConfirmSheet
	open={pendingDelete !== null}
	title="Are you sure?"
	message={confirmMessage}
	confirmLabel={confirmLabel}
	oncancel={() => (pendingDelete = null)}
	onconfirm={handleConfirmDelete}
/>
