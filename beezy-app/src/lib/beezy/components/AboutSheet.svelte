<script lang="ts">
	import { Button, Divider, Icon, IconButton, Sheet } from '$lib/components';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = true, onclose }: Props = $props();
</script>

<Sheet {open}>
	{#snippet head()}
		<div class="sheet-head">
			<IconButton aria-label="Close" onclick={onclose}>
				<Icon name="close" />
			</IconButton>
			<h3>About Beezy</h3>
		</div>
	{/snippet}
	{#snippet body()}
		<div class="about-logo">
			<span class="brand-badge" aria-hidden="true"></span>
			Beezy
		</div>
		<p class="muted-block about-tagline">Split trips, stay friends.</p>
		<Divider />
		<ul class="about-list">
			<li>
				<b>Works without signal.</b> Everything stays on this phone. No account, no internet needed.
			</li>
			<li>
				<b>Split equally.</b> Everyone pays the same share of each expense.
			</li>
			<li>
				<b>Settle one expense at a time.</b> Open a receipt, share a screenshot, and tap
				<b>Settle</b> when everyone has paid. A trip is done when every expense is settled.
			</li>
			<li>
				<b>Easy to share.</b> Screenshot the receipt or copy the summary into the group chat.
			</li>
		</ul>
	{/snippet}
	{#snippet foot()}
		<Button variant="secondary" block onclick={onclose}>Close</Button>
	{/snippet}
</Sheet>
