<script lang="ts">
	import type { PayReceiptMode } from '$lib/beezy/types';

	interface Props {
		mode?: PayReceiptMode;
		onchange?: (mode: PayReceiptMode) => void;
	}

	let { mode = 'expense', onchange }: Props = $props();

	const hint = $derived(
		mode === 'person'
			? 'One receipt for everything a person covered, split fairly.'
			: 'One receipt per expense — who owes for that one.'
	);
</script>

<div class="seg-wrap">
	<div class="seg" role="tablist" aria-label="How to group receipts">
		<button
			type="button"
			role="tab"
			aria-selected={mode === 'expense'}
			onclick={() => onchange?.('expense')}
		>
			Each expense
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={mode === 'person'}
			onclick={() => onchange?.('person')}
		>
			Who paid
		</button>
	</div>
	<p class="seg-hint">{hint}</p>
</div>
