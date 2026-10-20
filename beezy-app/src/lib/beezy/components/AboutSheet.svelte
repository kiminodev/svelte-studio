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
		<div class="about-logo">🤗 Beezy</div>
		<p class="muted-block about-tagline">Split trips, stay friends.</p>
		<Divider />
		<ul class="about-list">
			<li>
				<b>Offline-first.</b> Everything is saved on this device in <code>IndexedDB</code>. No
				account, no signal needed.
			</li>
			<li>
				<b>Equal split.</b> Each member's share of an expense = price ÷ number of people.
			</li>
			<li>
				<b>Settle per expense.</b> In Payment, pick an expense, screenshot the receipt, and tap
				<b>Settle</b> once everyone chips in. An event is settled when all its expenses are.
			</li>
			<li>
				<b>Shareable.</b> Screenshot the receipt or copy a text summary into the group chat.
			</li>
		</ul>
		<Divider />
		<p class="muted-block about-foot">Prototype · Hugging Face design direction · ₱ PHP</p>
	{/snippet}
	{#snippet foot()}
		<Button variant="secondary" block onclick={onclose}>Close</Button>
	{/snippet}
</Sheet>
