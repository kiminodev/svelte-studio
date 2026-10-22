<script lang="ts">
	import type { Participant } from '$lib/beezy/types';

	export type SplitMode = 'everyone' | 'choose';

	interface Props {
		participants: Participant[];
		paidById: string;
		mode?: SplitMode;
		selectedIds?: string[];
	}

	let {
		participants,
		paidById,
		mode = $bindable<SplitMode>('everyone'),
		selectedIds = $bindable<string[]>([])
	}: Props = $props();

	const canChoose = $derived(participants.length >= 2);
	const hint = $derived(
		mode === 'choose'
			? 'Tap who shares this expense. The person who paid stays on the split.'
			: 'Split equally with everyone on this trip.'
	);

	function setMode(next: SplitMode) {
		if (next === mode) return;
		if (next === 'choose') {
			selectedIds = participants.map((p) => p.id);
		}
		mode = next;
	}

	function isChecked(id: string): boolean {
		return selectedIds.includes(id) || id === paidById;
	}

	function toggleFriend(id: string, on: boolean) {
		if (id === paidById) return;
		if (on) {
			if (!selectedIds.includes(id)) selectedIds = [...selectedIds, id];
			return;
		}
		selectedIds = selectedIds.filter((item) => item !== id);
	}
</script>

{#if canChoose}
	<div class="split-by">
		<div class="seg" role="radiogroup" aria-label="Split by">
			<button
				type="button"
				role="radio"
				aria-checked={mode === 'everyone'}
				onclick={() => setMode('everyone')}
			>
				Everyone
			</button>
			<button
				type="button"
				role="radio"
				aria-checked={mode === 'choose'}
				onclick={() => setMode('choose')}
			>
				Choose friends
			</button>
		</div>
		<p class="seg-hint">{hint}</p>

		{#if mode === 'choose'}
			<div class="split-picks" role="group" aria-label="Friends on this split">
				{#each participants as person (person.id)}
					{@const paid = person.id === paidById}
					<label class="split-pick">
						<input
							type="checkbox"
							checked={isChecked(person.id)}
							disabled={paid}
							onchange={(event) =>
								toggleFriend(person.id, event.currentTarget.checked)}
						/>
						<span class="split-pick-name">{person.name}</span>
						{#if paid}
							<span class="split-pick-tag">paid</span>
						{/if}
					</label>
				{/each}
			</div>
		{/if}
	</div>
{/if}
