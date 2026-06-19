<script lang="ts">
	import { calcEvent } from '$lib/kkb/settlement';
	import {
		ActivityRow,
		AppBar,
		AppShell,
		Button,
		EmptyState,
		EventCard,
		EventDetail,
		type EventDetailData,
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
	type DemoEvent = EventDetailData & { createdAt: string };

	function uid() {
		return Math.random().toString(36).slice(2, 9);
	}

	let tab = $state<TabId>('events');
	let showEmpty = $state(false);
	let detailEventId = $state<string | null>(null);
	let sheetOpen = $state(false);
	let menuOpen = $state(false);
	let toastOpen = $state(false);
	let toastMessage = $state('');

	let events = $state<DemoEvent[]>([
		{
			id: 'e1',
			title: 'Boracay Getaway',
			createdAt: '2026-06-05T20:00:00',
			budget: 24000,
			participants: [
				{ id: 'p1', name: 'Mika' },
				{ id: 'p2', name: 'Jomar' },
				{ id: 'p3', name: 'Andrea' },
				{ id: 'p4', name: 'Paolo' }
			],
			activities: [
				{ price: 8000, paidById: 'p1' },
				{ price: 3600, paidById: 'p2' },
				{ price: 1200, paidById: 'p4' },
				{ price: 2400, paidById: 'p3' },
				{ price: 5000, paidById: 'p1' },
				{ price: 2800, paidById: 'p2' }
			]
		},
		{
			id: 'e2',
			title: 'Tagaytay Roadtrip',
			createdAt: '2026-05-29T19:00:00',
			budget: 6000,
			participants: [
				{ id: 'p5', name: 'Mika' },
				{ id: 'p6', name: 'Jomar' },
				{ id: 'p7', name: 'Lia' }
			],
			activities: [
				{ price: 1500, paidById: 'p6' },
				{ price: 1800, paidById: 'p5' },
				{ price: 900, paidById: 'p7' }
			]
		}
	]);

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

	const detailEvent = $derived(events.find((e) => e.id === detailEventId) ?? null);

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
		!sheetOpen &&
			!detailEventId &&
			!showEmpty &&
			(tab === 'events' || tab === 'activities')
	);

	function closeMenu() {
		menuOpen = false;
	}

	function openEvent(id: string) {
		detailEventId = id;
	}

	function backFromDetail() {
		detailEventId = null;
	}

	function updateEvent(id: string, patch: Partial<DemoEvent>) {
		events = events.map((e) => (e.id === id ? { ...e, ...patch } : e));
	}

	function eventCardProps(ev: DemoEvent) {
		const totals = calcEvent(ev.participants, ev.activities);
		return {
			title: ev.title,
			createdAt: ev.createdAt,
			budget: ev.budget,
			paxCount: ev.participants.length,
			activityCount: ev.activities.length,
			spent: totals.total
		};
	}
</script>

<AppShell>
	{#if detailEvent}
		<AppBar title={detailEvent.title} subtitle="Participants & balances">
			{#snippet leading()}
				<IconButton aria-label="Back" onclick={backFromDetail}>
					<Icon name="back" class="back-arrow" />
				</IconButton>
			{/snippet}
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
	{:else}
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
	{/if}

	<Screen>
		{#if detailEvent}
			<EventDetail
				event={detailEvent}
				onaddparticipant={(name) => {
					updateEvent(detailEvent.id, {
						participants: [...detailEvent.participants, { id: uid(), name }]
					});
					showToast(`Added ${name}`);
				}}
				onfinishparticipants={() => showToast('Participants saved')}
				onremoveparticipant={(id) => {
					updateEvent(detailEvent.id, {
						participants: detailEvent.participants.filter((p) => p.id !== id)
					});
				}}
				onaddexpense={() => showToast('Add expense — Phase 6')}
				onsettleup={() => showToast('Settle up — Phase 7')}
				ondelete={() => {
					events = events.filter((e) => e.id !== detailEvent.id);
					backFromDetail();
					showToast('Event deleted');
				}}
			/>
		{:else}
			<Eyebrow accent>Phase 3 — Event detail</Eyebrow>
			<ScreenHead
				title={tabLabels[tab]}
				description="Tap an event card to open the detail screen with live participant editing."
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
							<Button variant="yellow" onclick={() => (sheetOpen = true)}>
								<Icon name="plus" />
								Create your first event
							</Button>
						{/snippet}
					</EmptyState>
				{:else}
					{#each events as ev (ev.id)}
						<EventCard {...eventCardProps(ev)} onclick={() => openEvent(ev.id)} />
					{/each}
				{/if}
			{:else if tab === 'activities'}
				{#each demoActivities as act (act.name)}
					<ActivityRow {...act} onclick={() => showToast(`Edit ${act.name}`)} />
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
				</div>
			{/if}
		{/if}
	</Screen>

	<Fab aria-label="Add" hidden={!fabVisible} onclick={() => (sheetOpen = true)}>
		<Icon name="plus" />
	</Fab>

	<TabBar>
		<Tab
			label="Activities"
			active={tab === 'activities' && !detailEventId}
			onclick={() => {
				detailEventId = null;
				tab = 'activities';
			}}
		>
			{#snippet icon()}<Icon name="activities" />{/snippet}
		</Tab>
		<Tab
			label="Events"
			active={tab === 'events' && !detailEventId}
			onclick={() => {
				detailEventId = null;
				tab = 'events';
			}}
		>
			{#snippet icon()}<Icon name="events" />{/snippet}
		</Tab>
		<Tab
			label="Payment"
			active={tab === 'payment' && !detailEventId}
			onclick={() => {
				detailEventId = null;
				tab = 'payment';
			}}
		>
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
