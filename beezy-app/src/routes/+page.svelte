<script lang="ts">
	import {
		AppBar,
		AppShell,
		Button,
		Eyebrow,
		Fab,
		Icon,
		IconButton,
		MenuItem,
		MenuPopover,
		Screen,
		ScreenHead,
		Sheet,
		Tab,
		TabBar,
		Toast,
		scheduleToastHide
	} from '$lib/ui';

	type TabId = 'activities' | 'events' | 'payment';

	let tab = $state<TabId>('events');
	let hasEvents = $state(true);
	let sheetOpen = $state(false);
	let menuOpen = $state(false);
	let toastOpen = $state(false);
	let toastMessage = $state('');

	function showToast(message: string) {
		toastMessage = message;
		toastOpen = true;
		scheduleToastHide((open) => (toastOpen = open));
	}

	const tabLabels: Record<TabId, string> = {
		activities: 'Activities',
		events: 'Events',
		payment: 'Payment'
	};

	/** Mockup FAB rules: no sheet/sub-screen; events always; activities when events exist. */
	const fabVisible = $derived(
		!sheetOpen && (tab === 'events' || (tab === 'activities' && hasEvents))
	);

	function closeMenu() {
		menuOpen = false;
	}
</script>

<AppShell>
	<AppBar title="Welcome to Beezy" subtitle="Split trips, stay friends">
		{#snippet brand()}🤗{/snippet}
		{#snippet trailing()}
			<IconButton
				aria-label="More"
				class="menu-trigger"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<Icon name="more" />
			</IconButton>
		{/snippet}
	</AppBar>

	<Screen>
		<Eyebrow accent>Phase 2 — App shell</Eyebrow>
		<ScreenHead
			title={tabLabels[tab]}
			description="Phase 2 complete — shell, toast, menu, and shared icons. Next: Phase 3 cards."
		/>
		<p style="color: var(--muted); font-size: var(--text-sm); margin-top: 8px">
			Active tab: <span class="mono">{tab}</span> · FAB: <span class="mono">{fabVisible ? 'visible' : 'hidden'}</span>
		</p>
		<label style="display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: var(--text-sm)">
			<input type="checkbox" bind:checked={hasEvents} />
			Has events (Activities tab FAB rule)
		</label>
		<Button variant="secondary" class="mt-3" onclick={() => showToast('Event created')}>
			Show toast
		</Button>
	</Screen>

	<Fab aria-label="Add" hidden={!fabVisible} onclick={() => (sheetOpen = true)}>
		<Icon name="plus" />
	</Fab>

	<TabBar>
		<Tab label="Activities" active={tab === 'activities'} onclick={() => (tab = 'activities')}>
			{#snippet icon()}<Icon name="activities" />{/snippet}
		</Tab>
		<Tab label="Events" active={tab === 'events'} onclick={() => (tab = 'events')}>
			{#snippet icon()}<Icon name="events" />{/snippet}
		</Tab>
		<Tab label="Payment" active={tab === 'payment'} onclick={() => (tab = 'payment')}>
			{#snippet icon()}<Icon name="payment" />{/snippet}
		</Tab>
	</TabBar>

	<MenuPopover open={menuOpen} onclose={closeMenu}>
		<MenuItem
			label="About Beezy"
			onclick={() => {
				closeMenu();
				showToast('About sheet — Phase 6');
			}}
		>
			{#snippet icon()}<Icon name="info" />{/snippet}
		</MenuItem>
		<MenuItem
			label="Reset demo data"
			onclick={() => {
				closeMenu();
				showToast('Demo data restored');
			}}
		>
			{#snippet icon()}<Icon name="refresh" />{/snippet}
		</MenuItem>
	</MenuPopover>

	<Sheet open={sheetOpen}>
		{#snippet head()}
			<div class="sheet-head">
				<IconButton aria-label="Close" onclick={() => (sheetOpen = false)}>
					<Icon name="close" />
				</IconButton>
				<h3>New event</h3>
			</div>
		{/snippet}
		{#snippet body()}
			<p style="color: var(--muted); font-size: 13px">
				Sheet body slot — forms and detail content go here.
			</p>
		{/snippet}
		{#snippet foot()}
			<Button variant="secondary" block onclick={() => (sheetOpen = false)}>Cancel</Button>
			<Button
				variant="yellow"
				block
				onclick={() => {
					sheetOpen = false;
					showToast('Event created');
				}}
			>
				Add event
			</Button>
		{/snippet}
	</Sheet>

	<Toast message={toastMessage} open={toastOpen} />
</AppShell>
