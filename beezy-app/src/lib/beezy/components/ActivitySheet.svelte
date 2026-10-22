<script lang="ts">
	import { untrack } from 'svelte';
	import { parseAmount } from '$lib/beezy/format';
	import type { CreateActivityInput } from '$lib/beezy/store';
	import type { Activity, Event } from '$lib/beezy/types';
	import {
		AmountInput,
		Button,
		Field,
		HintCard,
		Icon,
		IconButton,
		Input,
		Select,
		Sheet,
		ConfirmSheet
	} from '$lib/components';
	import SplitByPicker, { type SplitMode } from './SplitByPicker.svelte';

	interface Props {
		open?: boolean;
		events: Event[];
		activity?: Activity | null;
		presetEventId?: string | null;
		onclose?: () => void;
		onsave?: (input: CreateActivityInput) => void;
		ondelete?: (id: string) => void;
		oninvalid?: (message: string) => void;
	}

	let {
		open = true,
		events,
		activity = null,
		presetEventId = null,
		onclose,
		onsave,
		ondelete,
		oninvalid
	}: Props = $props();

	const editing = $derived(Boolean(activity));
	const formId = 'form-activity';
	let confirmDelete = $state(false);

	function initialEventId(): string {
		return activity?.eventId ?? presetEventId ?? events[0]?.id ?? '';
	}

	function initialPaidById(eventId: string): string {
		const ev = events.find((e) => e.id === eventId);
		if (activity && ev?.participants.some((p) => p.id === activity.paidById)) {
			return activity.paidById;
		}
		return ev?.participants[0]?.id ?? '';
	}

	function participantIdsFor(eventId: string): string[] {
		return events.find((e) => e.id === eventId)?.participants.map((p) => p.id) ?? [];
	}

	function initialSplitMode(): SplitMode {
		return activity?.splitWithIds?.length ? 'choose' : 'everyone';
	}

	function initialSelectedIds(eventId: string): string[] {
		const all = participantIdsFor(eventId);
		const stored = activity?.splitWithIds ?? [];
		if (!stored.length) return all;
		const valid = stored.filter((id) => all.includes(id));
		return valid.length ? valid : all;
	}

	const startEventId = untrack(() => initialEventId());
	let name = $state(untrack(() => activity?.name ?? ''));
	let price = $state<string | number>(untrack(() => activity?.price ?? ''));
	let eventId = $state(startEventId);
	let paidById = $state(untrack(() => initialPaidById(startEventId)));
	let splitMode = $state<SplitMode>(untrack(() => initialSplitMode()));
	let selectedIds = $state<string[]>(untrack(() => initialSelectedIds(startEventId)));
	let lastEventId = $state(startEventId);

	const selectedEvent = $derived(events.find((e) => e.id === eventId) ?? null);
	const participants = $derived(selectedEvent?.participants ?? []);
	const noParticipants = $derived(participants.length === 0);

	/** Paid-by options must follow the selected event's participant list. */
	$effect(() => {
		const ids = participants.map((p) => p.id);
		if (paidById && ids.includes(paidById)) return;
		const next = ids[0] ?? '';
		if (paidById !== next) paidById = next;
	});

	/** Changing trips resets the split to everyone on the new event. */
	$effect(() => {
		if (eventId === lastEventId) return;
		lastEventId = eventId;
		splitMode = 'everyone';
		selectedIds = participants.map((p) => p.id);
	});

	/** The person who paid is always on the split. */
	$effect(() => {
		if (!paidById || selectedIds.includes(paidById)) return;
		selectedIds = [...selectedIds, paidById];
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const trimmed = name.trim();
		const amount = parseAmount(price);
		const payer = participants.find((p) => p.id === paidById);
		if (!trimmed || Number.isNaN(amount) || amount < 0 || !eventId || !payer) {
			oninvalid?.('Fill all fields');
			return;
		}
		onsave?.({
			name: trimmed,
			price: amount,
			eventId,
			paidById: payer.id,
			splitWithIds: splitMode === 'choose' ? selectedIds : undefined
		});
	}
</script>

<Sheet {open}>
	{#snippet head()}
		<div class="sheet-head">
			<IconButton aria-label="Close" onclick={onclose}>
				<Icon name="close" />
			</IconButton>
			<h3>{editing ? 'Edit activity' : 'New activity'}</h3>
			{#if activity}
				<IconButton
					aria-label="Delete"
					class="icon-btn-danger"
					onclick={() => (confirmDelete = true)}
				>
					<Icon name="trash" />
				</IconButton>
			{/if}
		</div>
	{/snippet}
	{#snippet body()}
		<form id={formId} onsubmit={handleSubmit}>
			<Field label="What was it?" for="activity-name" required>
				<Input
					id="activity-name"
					name="name"
					bind:value={name}
					placeholder="e.g. Dinner at Real Coffee"
					required
					autocomplete="off"
				/>
			</Field>
			<Field label="Price" for="activity-price" required>
				<AmountInput id="activity-price" name="price" bind:value={price} required />
			</Field>
			<Field label="Event" for="act-event" required>
				<Select id="act-event" name="eventId" bind:value={eventId} required>
					{#if events.length === 0}
						<option value="">— create an event first —</option>
					{:else}
						{#each events as ev (ev.id)}
							<option value={ev.id}>{ev.title}</option>
						{/each}
					{/if}
				</Select>
			</Field>
			<Field label="Paid by" for="act-paidby" required>
				<Select id="act-paidby" name="paidById" bind:value={paidById} required>
					{#if noParticipants}
						<option value="">— add friends first —</option>
					{:else}
						{#each participants as p (p.id)}
							<option value={p.id}>{p.name}</option>
						{/each}
					{/if}
				</Select>
			</Field>
			{#if participants.length >= 2}
				<Field label="Split by">
					<SplitByPicker
						{participants}
						{paidById}
						bind:mode={splitMode}
						bind:selectedIds
					/>
				</Field>
			{/if}
			{#if noParticipants}
				<HintCard emoji="💡">
					This trip has no one on it yet. Add friends from the trip screen so Beezy can split the bill.
				</HintCard>
			{/if}
		</form>
	{/snippet}
	{#snippet foot()}
		<Button variant="secondary" block onclick={onclose}>Cancel</Button>
		<Button variant="yellow" block type="submit" form={formId}>
			{editing ? 'Save changes' : 'Add activity'}
		</Button>
	{/snippet}
</Sheet>

<ConfirmSheet
	open={confirmDelete}
	title="Are you sure?"
	message="This expense will be gone for good. You cannot undo this."
	confirmLabel="Delete expense"
	oncancel={() => (confirmDelete = false)}
	onconfirm={() => {
		const activityId = activity?.id;
		confirmDelete = false;
		if (activityId) ondelete?.(activityId);
	}}
/>
