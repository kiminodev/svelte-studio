<script lang="ts">
	import { AppBar, AppShell, Eyebrow, Fab, IconButton, Screen, ScreenHead, Tab, TabBar } from '$lib/ui';

	type TabId = 'activities' | 'events' | 'payment';

	let tab = $state<TabId>('events');
	let hasEvents = $state(true);

	const tabLabels: Record<TabId, string> = {
		activities: 'Activities',
		events: 'Events',
		payment: 'Payment'
	};

	/** Mockup FAB rules: events always; activities only when events exist; never on payment. */
	const fabVisible = $derived(
		tab === 'events' || (tab === 'activities' && hasEvents)
	);
</script>

<AppShell>
	<AppBar title="Welcome to Beezy" subtitle="Split trips, stay friends">
		{#snippet brand()}🤗{/snippet}
		{#snippet trailing()}
			<IconButton aria-label="More">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
					<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
					<circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
				</svg>
			</IconButton>
		{/snippet}
	</AppBar>

	<Screen>
		<Eyebrow accent>Phase 2 — App shell</Eyebrow>
		<ScreenHead
			title={tabLabels[tab]}
			description="FAB hides on Payment; on Activities only when no events. Next: Sheet."
		/>
		<p style="color: var(--muted); font-size: var(--text-sm); margin-top: 8px">
			Active tab: <span class="mono">{tab}</span> · FAB: <span class="mono">{fabVisible ? 'visible' : 'hidden'}</span>
		</p>
		<label style="display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: var(--text-sm)">
			<input type="checkbox" bind:checked={hasEvents} />
			Has events (Activities tab FAB rule)
		</label>
	</Screen>

	<Fab aria-label="Add" hidden={!fabVisible}>
		<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
	</Fab>

	<TabBar>
		<Tab label="Activities" active={tab === 'activities'} onclick={() => (tab = 'activities')}>
			{#snippet icon()}
				<svg viewBox="0 0 24 24">
					<rect x="5" y="4" width="14" height="17" rx="2" />
					<path d="M9 3.5h6v3H9z" />
					<path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5" />
				</svg>
			{/snippet}
		</Tab>
		<Tab label="Events" active={tab === 'events'} onclick={() => (tab = 'events')}>
			{#snippet icon()}
				<svg viewBox="0 0 24 24">
					<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
					<circle cx="12" cy="9" r="2.4" />
				</svg>
			{/snippet}
		</Tab>
		<Tab label="Payment" active={tab === 'payment'} onclick={() => (tab = 'payment')}>
			{#snippet icon()}
				<svg viewBox="0 0 24 24">
					<path d="M6 3h12v18l-2.2-1.3-2 1.3-1.8-1.3L9.8 21 8 19.7 6 21V3Z" />
					<path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
				</svg>
			{/snippet}
		</Tab>
	</TabBar>
</AppShell>
