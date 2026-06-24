<script lang="ts">
	import {
		calcActivity,
		calcEvent,
		isEventSettled,
		payEventSummary,
		type Participant
	} from '$lib/kkb/settlement';
	import { fmtDate, peso } from '$lib/kkb/format';
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
		HintCard,
		Icon,
		IconButton,
		MenuItem,
		MenuPopover,
		PayEventCard,
		PayProgress,
		Receipt,
		Screen,
		ScreenHead,
		Sheet,
		Tab,
		TabBar,
		Toast,
		scheduleToastHide
	} from '$lib/ui';

	type TabId = 'activities' | 'events' | 'payment';

	interface DemoActivity {
		id: string;
		name: string;
		price: number;
		paidById: string;
		paidByName: string;
		createdAt: string;
		updatedAt?: string;
		settled?: boolean;
	}

	type DemoEvent = Omit<EventDetailData, 'activities'> & {
		createdAt: string;
		activities: DemoActivity[];
	};

	function uid() {
		return Math.random().toString(36).slice(2, 9);
	}

	let tab = $state<TabId>('events');
	let showEmpty = $state(false);
	let detailEventId = $state<string | null>(null);
	let payEventId = $state<string | null>(null);
	let payActivityId = $state<string | null>(null);
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
				{
					id: 'a1',
					name: 'Beachfront Resort (2 nights)',
					price: 8000,
					paidById: 'p1',
					paidByName: 'Mika',
					createdAt: '2026-06-06T14:00:00',
					updatedAt: '2026-06-06T14:05:00',
					settled: true
				},
				{
					id: 'a2',
					name: 'Island Hopping Tour',
					price: 3600,
					paidById: 'p2',
					paidByName: 'Jomar',
					createdAt: '2026-06-07T08:30:00'
				},
				{
					id: 'a3',
					name: 'Tricycles & Transpo',
					price: 1200,
					paidById: 'p4',
					paidByName: 'Paolo',
					createdAt: '2026-06-07T09:10:00'
				},
				{
					id: 'a4',
					name: 'Dinner — Real Coffee & Tea',
					price: 2400,
					paidById: 'p3',
					paidByName: 'Andrea',
					createdAt: '2026-06-07T20:10:00',
					updatedAt: '2026-06-07T20:45:00'
				},
				{
					id: 'a5',
					name: 'Parasailing (2 pax)',
					price: 5000,
					paidById: 'p1',
					paidByName: 'Mika',
					createdAt: '2026-06-08T11:00:00'
				},
				{
					id: 'a6',
					name: 'Sunset Bar Tab',
					price: 2800,
					paidById: 'p2',
					paidByName: 'Jomar',
					createdAt: '2026-06-08T18:45:00',
					updatedAt: '2026-06-08T19:02:00'
				}
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
				{
					id: 'a7',
					name: 'Gas & SLEX Toll',
					price: 1500,
					paidById: 'p6',
					paidByName: 'Jomar',
					createdAt: '2026-06-01T07:00:00'
				},
				{
					id: 'a8',
					name: 'Bulalohan Lunch',
					price: 1800,
					paidById: 'p5',
					paidByName: 'Mika',
					createdAt: '2026-06-01T13:00:00'
				},
				{
					id: 'a9',
					name: 'Coffee — Bag of Beans',
					price: 900,
					paidById: 'p7',
					paidByName: 'Lia',
					createdAt: '2026-06-01T16:00:00'
				}
			]
		}
	]);

	const detailEvent = $derived(events.find((e) => e.id === detailEventId) ?? null);

	const payEvent = $derived.by(() => {
		if (payEventId) return events.find((e) => e.id === payEventId) ?? null;
		if (payActivityId) {
			return events.find((e) => e.activities.some((a) => a.id === payActivityId)) ?? null;
		}
		return null;
	});

	const payActivity = $derived(
		payEvent && payActivityId
			? (payEvent.activities.find((a) => a.id === payActivityId) ?? null)
			: null
	);

	const inSubScreen = $derived(!!detailEventId || !!payEventId || !!payActivityId);

	const appBar = $derived.by(() => {
		if (payActivity && payEvent) {
			return {
				title: payEvent.title,
				subtitle: 'Receipt to screenshot & share',
				back: true
			};
		}
		if (payEventId && payEvent) {
			return {
				title: payEvent.title,
				subtitle: 'Pick an expense to settle',
				back: true
			};
		}
		if (detailEvent) {
			return {
				title: detailEvent.title,
				subtitle: 'Participants & balances',
				back: true
			};
		}
		return {
			title: 'Welcome to Beezy',
			subtitle: 'Split trips, stay friends',
			back: false
		};
	});

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
		!sheetOpen && !inSubScreen && !showEmpty && (tab === 'events' || tab === 'activities')
	);

	function closeMenu() {
		menuOpen = false;
	}

	function clearSubScreens() {
		detailEventId = null;
		payEventId = null;
		payActivityId = null;
	}

	function handleBack() {
		if (payActivityId) {
			payActivityId = null;
			return;
		}
		if (payEventId) {
			payEventId = null;
			return;
		}
		detailEventId = null;
	}

	function openEvent(id: string) {
		clearSubScreens();
		detailEventId = id;
	}

	function openPayEvent(id: string) {
		clearSubScreens();
		tab = 'payment';
		payEventId = id;
	}

	function openPayActivity(activityId: string) {
		payActivityId = activityId;
	}

	function updateEvent(id: string, patch: Partial<DemoEvent>) {
		events = events.map((e) => (e.id === id ? { ...e, ...patch } : e));
	}

	function toggleActivitySettled(eventId: string, activityId: string, settled: boolean) {
		updateEvent(eventId, {
			activities: events
				.find((e) => e.id === eventId)!
				.activities.map((a) =>
					a.id === activityId
						? { ...a, settled, updatedAt: new Date().toISOString() }
						: a
				)
		});
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

	function payCardProps(ev: DemoEvent) {
		const totals = calcEvent(ev.participants, ev.activities);
		return {
			title: ev.title,
			summary: payEventSummary(ev.activities, ev.participants.length, totals.total),
			settled: isEventSettled(ev.activities)
		};
	}

	function allActivitiesFlat() {
		return events.flatMap((ev) =>
			ev.activities.map((a) => ({
				...a,
				eventTitle: ev.title
			}))
		);
	}
</script>

<AppShell>
	<AppBar title={appBar.title} subtitle={appBar.subtitle}>
		{#snippet leading()}
			{#if appBar.back}
				<IconButton aria-label="Back" onclick={handleBack}>
					<Icon name="back" class="back-arrow" />
				</IconButton>
			{/if}
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

	<Screen>
		{#if detailEvent}
			<EventDetail
				event={detailEvent}
				onaddparticipant={(name: string) => {
					updateEvent(detailEvent.id, {
						participants: [...detailEvent.participants, { id: uid(), name }]
					});
					showToast(`Added ${name}`);
				}}
				onfinishparticipants={() => showToast('Participants saved')}
				onremoveparticipant={(id: string) => {
					updateEvent(detailEvent.id, {
						participants: detailEvent.participants.filter((p: Participant) => p.id !== id)
					});
				}}
				onaddexpense={() => showToast('Add expense — Phase 6')}
				onsettleup={() => openPayEvent(detailEvent.id)}
				ondelete={() => {
					events = events.filter((e) => e.id !== detailEvent.id);
					clearSubScreens();
					showToast('Event deleted');
				}}
			/>
		{:else if payActivity && payEvent}
			<Receipt eventTitle={payEvent.title} activity={payActivity} participants={payEvent.participants} />
			<div class="receipt-actions">
				{#if payActivity.settled}
					<Button
						variant="secondary"
						block
						onclick={() => {
							toggleActivitySettled(payEvent.id, payActivity.id, false);
							showToast('Marked unpaid');
						}}
					>
						Mark unpaid
					</Button>
					<Button variant="ghost" block onclick={() => showToast('Copied to clipboard')}>
						<Icon name="copy" />
						Copy receipt text
					</Button>
				{:else}
					<Button
						variant="yellow"
						block
						onclick={() => {
							toggleActivitySettled(payEvent.id, payActivity.id, true);
							showToast('Marked as settled');
						}}
					>
						<Icon name="check" />
						Settle this expense
					</Button>
					<Button variant="ghost" block onclick={() => showToast('Copied to clipboard')}>
						<Icon name="copy" />
						Copy receipt text
					</Button>
				{/if}
			</div>
		{:else if payEvent}
			{@const totals = calcEvent(payEvent.participants, payEvent.activities)}
			{@const settledCount = payEvent.activities.filter((a) => a.settled).length}
			{@const allSettled = isEventSettled(payEvent.activities)}
			{@const pct = payEvent.activities.length
				? Math.round((settledCount / payEvent.activities.length) * 100)
				: 0}

			<PayProgress
				label={payEvent.title}
				detail="{settledCount} of {payEvent.activities.length} settled · {peso(totals.total)} total"
				value={pct}
				done={allSettled}
			/>

			{#if allSettled}
				<HintCard emoji="✅">
					Everyone's square on <strong>{payEvent.title}</strong>. Tap any expense to reopen its
					receipt, or mark one unpaid.
				</HintCard>
			{/if}

			{#each payEvent.activities as activity (activity.id)}
				{@const ac = calcActivity(activity, payEvent.participants)}
				{@const each = ac.n > 0 ? peso(ac.share) : '—'}
				<ActivityRow
					name={activity.name}
					price={activity.price}
					paidByName={activity.paidByName}
					createdAt={activity.createdAt}
					updatedAt={activity.updatedAt}
					variant="payment"
					settled={activity.settled}
					oweLabel={ac.others.length ? `${ac.others.length} owe ${each} each` : 'solo expense'}
					statusLabel={activity.settled
						? `settled ${fmtDate(activity.updatedAt ?? activity.createdAt)}`
						: 'tap to settle →'}
					onclick={() => openPayActivity(activity.id)}
				/>
			{/each}
		{:else}
			<Eyebrow accent>Phase 3 — Payment</Eyebrow>
			<ScreenHead
				title={tabLabels[tab]}
				description={tab === 'payment'
					? 'Pick a trip to generate a receipt everyone can screenshot and share.'
					: tab === 'events'
						? 'Tap an event card to open the detail screen.'
						: 'Every expense, who paid, and when.'}
			/>

			{#if tab === 'events'}
				<label class="demo-toggle">
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
				{#each allActivitiesFlat() as act (act.id)}
					<ActivityRow
						name={act.name}
						price={act.price}
						paidByName={act.paidByName}
						createdAt={act.createdAt}
						updatedAt={act.updatedAt}
						eventTitle={act.eventTitle}
						onclick={() => showToast(`Edit ${act.name}`)}
					/>
				{/each}
			{:else if events.length === 0}
				<EmptyState
					emoji="🧾"
					title="Nothing to settle yet"
					description="Once a trip has expenses, generate a receipt everyone can screenshot."
				>
					{#snippet actions()}
						<Button variant="yellow" onclick={() => (tab = 'events')}>Create an event</Button>
					{/snippet}
				</EmptyState>
			{:else}
				{#each events as ev (ev.id)}
					<PayEventCard {...payCardProps(ev)} onclick={() => openPayEvent(ev.id)} />
				{/each}
			{/if}
		{/if}
	</Screen>

	<Fab aria-label="Add" hidden={!fabVisible} onclick={() => (sheetOpen = true)}>
		<Icon name="plus" />
	</Fab>

	<TabBar>
		<Tab
			label="Activities"
			active={tab === 'activities' && !inSubScreen}
			onclick={() => {
				clearSubScreens();
				tab = 'activities';
			}}
		>
			{#snippet icon()}<Icon name="activities" />{/snippet}
		</Tab>
		<Tab
			label="Events"
			active={tab === 'events' && !inSubScreen}
			onclick={() => {
				clearSubScreens();
				tab = 'events';
			}}
		>
			{#snippet icon()}<Icon name="events" />{/snippet}
		</Tab>
		<Tab
			label="Payment"
			active={tab === 'payment' && !inSubScreen}
			onclick={() => {
				clearSubScreens();
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
	.demo-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 16px;
		font-size: var(--text-sm);
	}
</style>
