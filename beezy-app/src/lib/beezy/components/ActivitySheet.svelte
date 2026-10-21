<script lang="ts">
	import { untrack } from 'svelte';
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
		Sheet
	} from '$lib/components';

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

	const startEventId = untrack(() => initialEventId());
	let name = $state(untrack(() => activity?.name ?? ''));
	let price = $state<string | number>(untrack(() => activity?.price ?? ''));
	let eventId = $state(startEventId);
	let paidById = $state(untrack(() => initialPaidById(startEventId)));

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

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const trimmed = name.trim();
		const amount = Number(price);
		const payer = participants.find((p) => p.id === paidById);
		if (!trimmed || Number.isNaN(amount) || amount < 0 || !eventId || !payer) {
			oninvalid?.('Fill all fields');
			return;
		}
		onsave?.({
			name: trimmed,
			price: amount,
			eventId,
			paidById: payer.id
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
				{@const activityId = activity.id}
				<IconButton
					aria-label="Delete"
					class="icon-btn-danger"
					onclick={() => ondelete?.(activityId)}
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
