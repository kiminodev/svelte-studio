<script lang="ts">
	import {
		ActivityRow,
		AppBar,
		AppShell,
		Button,
		EmptyState,
		EventCard,
		Eyebrow,
		Fab,
		Icon,
		IconButton,
		MenuItem,
		MenuPopover,
		ProgressBar,
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
	let showEmpty = $state(false);
	let sheetOpen = $state(false);
	let menuOpen = $state(false);
	let toastOpen = $state(false);
	let toastMessage = $state('');

	const demoEvents = [
		{
			title: 'Boracay Getaway',
			createdAt: '2026-06-05T20:00:00',
			budget: 24000,
			paxCount: 4,
			activityCount: 6,
			spent: 23000
		},
		{
			title: 'Tagaytay Roadtrip',
			createdAt: '2026-05-29T19:00:00',
			budget: 6000,
			paxCount: 3,
			activityCount: 3,
			spent: 4200
		}
	] as const;

	const demoActivities = [
		{
			name: 'Beachfront Resort (2 nights)',
			price: 8000,
			paidByName: 'Mika',
			createdAt: '2026-06-06T14:00:00',
			updatedAt: '2026-06-06T14:05:00',
			eventTitle: 'Boracay Getaway'
		},
		{
			name: 'Island Hopping Tour',
			price: 3600,
			paidByName: 'Jomar',
			createdAt: '2026-06-07T08:30:00',
			eventTitle: 'Boracay Getaway'
		},
		{
			name: 'Gas & SLEX Toll',
			price: 1500,
			paidByName: 'Jomar',
			createdAt: '2026-06-01T07:00:00',
			eventTitle: 'Tagaytay Roadtrip'
		}
	] as const;

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

	const fabVisible = $derived(
		!sheetOpen && !showEmpty && (tab === 'events' || tab === 'activities')
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
		<Eyebrow accent>Phase 3 — Batch A</Eyebrow>
		<ScreenHead
			title={tabLabels[tab]}
			description="EmptyState, ProgressBar, EventCard, ActivityRow — seed data from the mockup."
		/>

		{#if tab === 'events'}
			<label
				style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: var(--text-sm)"
			>
				<input type="checkbox" bind:checked={showEmpty} />
				Show empty state
			</label>
			{#if showEmpty}
				<EmptyState
					emoji="🤗"
					title="Welcome to Beezy"
					description="Track shared expenses, split them fairly, and settle up in seconds — even with no signal."
				>
					{#snippet actions()}
						<Button variant="yellow" onclick={() => showToast('Create event — Phase 6')}>
							<Icon name="plus" />
							Create your first event
						</Button>
					{/snippet}
				</EmptyState>
			{:else}
				{#each demoEvents as ev (ev.title)}
					<EventCard
						{...ev}
						onclick={() => showToast(`Open ${ev.title}`)}
					/>
				{/each}
			{/if}
		{:else if tab === 'activities'}
			{#each demoActivities as act (act.name)}
				<ActivityRow
					{...act}
					onclick={() => showToast(`Edit ${act.name}`)}
				/>
			{/each}
		{:else}
			<EmptyState
				emoji="🧾"
				title="Nothing to settle yet"
				description="Once a trip has expenses, generate a receipt everyone can screenshot."
			>
				{#snippet actions()}
					<Button variant="yellow" onclick={() => (tab = 'events')}>Create an event</Button>
				{/snippet}
			</EmptyState>
			<div style="margin-top: 24px">
				<Eyebrow>ProgressBar variants</Eyebrow>
				<ProgressBar
					class="mt-2"
					value={72}
					labelLeft="72% of budget"
					labelRight="₱6,600 left"
				/>
				<ProgressBar
					class="mt-2"
					value={100}
					variant="over"
					labelLeft="100% of budget"
					labelRight="₱2,000 over"
					overRight
				/>
				<ProgressBar
					class="mt-2"
					value={100}
					variant="done"
					labelLeft="6 of 6 settled"
					labelRight="100%"
				/>
			</div>
		{/if}
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

<style>
	:global(.mt-2) {
		margin-top: 11px;
	}
</style>
