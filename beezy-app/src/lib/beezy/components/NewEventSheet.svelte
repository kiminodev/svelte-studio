<script lang="ts">
	import type { CreateEventInput } from '$lib/beezy/store';
	import {
		AmountInput,
		Button,
		Field,
		Icon,
		IconButton,
		Input,
		Sheet
	} from '$lib/components';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onsave?: (input: CreateEventInput) => void;
		oninvalid?: (message: string) => void;
	}

	let { open = true, onclose, onsave, oninvalid }: Props = $props();

	let title = $state('');
	let budget = $state<string | number>('');

	const formId = 'form-event';

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const trimmed = title.trim();
		const amount = Number(budget);
		if (!trimmed || Number.isNaN(amount) || amount < 0) {
			oninvalid?.('Add a title and budget');
			return;
		}
		onsave?.({ title: trimmed, budget: amount });
	}
</script>

<Sheet {open}>
	{#snippet head()}
		<div class="sheet-head">
			<IconButton aria-label="Close" onclick={onclose}>
				<Icon name="close" />
			</IconButton>
			<h3>New event</h3>
		</div>
	{/snippet}
	{#snippet body()}
		<form id={formId} onsubmit={handleSubmit}>
			<Field label="Event title" for="event-title" required>
				<Input
					id="event-title"
					name="title"
					bind:value={title}
					placeholder="e.g. Palawan Escape"
					required
					autocomplete="off"
				/>
			</Field>
			<Field
				label="Total budget"
				for="event-budget"
				required
				hint="This is a planning target. You'll split actual spending equally later."
			>
				<AmountInput
					id="event-budget"
					name="budget"
					bind:value={budget}
					required
				/>
			</Field>
			<p class="muted-block sheet-note">
				After creating, tap the trip to add friends and log expenses.
			</p>
		</form>
	{/snippet}
	{#snippet foot()}
		<Button variant="secondary" block onclick={onclose}>Cancel</Button>
		<Button variant="yellow" block type="submit" form={formId}>Add event</Button>
	{/snippet}
</Sheet>
