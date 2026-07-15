<script lang="ts">
	import { onMount } from 'svelte';
	import {
		calcActivity,
		calcEvent,
		isEventSettled,
		payEventSummary
	} from '$lib/beezy/settlement';
	import { fmtDate, peso } from '$lib/beezy/format';
	import {
		addParticipant,
		deleteEvent,
		loadStore,
		removeParticipant,
		resetDemo,
		settleActivity,
		unsettleActivity
	} from '$lib/beezy/store';
	import { defaultViewState, loadView, saveView } from '$lib/beezy/view';
	import type { Activity, Event, TabId, ViewState } from '$lib/beezy/types';
	import {
		ActivityRow,
		AppBar,
		AppShell,
		Button,
		EmptyState,
		EventCard,
		EventDetail,
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
		Tab,
		TabBar,
		Toast,
		scheduleToastHide
	} from '$lib';

	type LoadStatus = 'loading' | 'ready' | 'error';

	let events = $state<Event[]>([]);
	let activities = $state<Activity[]>([]);
	let view = $state<ViewState>(defaultViewState());
	let loadStatus = $state<LoadStatus>('loading');
	let loadError = $state('');
	let toastOpen = $state(false);
	let toastMessage = $state('');
	/** Avoid writing default view to sessionStorage before hydrate. */
	let viewHydrated = $state(false);

	onMount(() => {
		const restored = { ...loadView(), sheet: null };
		view = restored;
		viewHydrated = true;

		loadStore()
			.then((store) => {
				events = store.events;
				activities = store.activities;
				view = sanitizeView(view, store.events, store.activities);
				loadStatus = 'ready';
			})
			.catch((err: unknown) => {
				loadStatus = 'error';
				loadError =
					err instanceof Error ? err.message : 'Could not open offline storage';
			});
	});

	$effect(() => {
		if (!viewHydrated) return;
		// Track fields so effect re-runs on any view change.
		const snapshot: ViewState = {
			tab: view.tab,
			sub: view.sub,
			sheet: view.sheet,
			menu: view.menu
		};
		saveView(snapshot);
	});

	/**
	 * If detail (or other) sub points at a missing record, clear it so we return to tab home.
	 * Mirrors mockup `viewEventDetail()` when `eventById` is null.
	 */
	$effect(() => {
		if (loadStatus !== 'ready' || !viewHydrated) return;
		const cleaned = sanitizeView(view, events, activities);
		if (
			cleaned.sub !== view.sub ||
			cleaned.sheet !== view.sheet
		) {
			view = cleaned;
		}
	});

	const detailEvent = $derived.by(() => {
		if (view.sub?.type !== 'detail') return null;
		const ev = eventById(view.sub.id);
		if (!ev) return null;
		return { ...ev, activities: activitiesFor(ev.id) };
	});

	const payEvent = $derived.by(() => {
		const sub = view.sub;
		if (!sub) return null;
		const id = sub.type === 'pay-event' ? sub.id : sub.type === 'pay-activity' ? sub.eventId : null;
		if (!id) return null;
		const ev = eventById(id);
		if (!ev) return null;
		return { ...ev, activities: activitiesFor(ev.id) };
	});

	const payActivity = $derived.by(() => {
		const sub = view.sub;
		if (sub?.type !== 'pay-activity' || !payEvent) return null;
		return payEvent.activities.find((a) => a.id === sub.activityId) ?? null;
	});

	const inSubScreen = $derived(view.sub !== null);

	const appBar = $derived.by(() => {
		if (view.sub?.type === 'pay-activity' && payActivity && payEvent) {
			return {
				title: payEvent.title,
				subtitle: 'Receipt to screenshot & share',
				back: true
			};
		}
		if (view.sub?.type === 'pay-event' && payEvent) {
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

	const tabLabels: Record<TabId, string> = {
		activities: 'Activities',
		events: 'Events',
		payment: 'Payment'
	};

	const fabVisible = $derived(
		!view.sub &&
			!view.sheet &&
			(view.tab === 'events' || (view.tab === 'activities' && events.length > 0))
	);

	function eventById(id: string): Event | null {
		return events.find((e) => e.id === id) ?? null;
	}

	function activitiesFor(eventId: string): Activity[] {
		return activities.filter((a) => a.eventId === eventId);
	}

	/** Activities newest-first with event title (mirrors getAllActivities + join). */
	function allActivitiesFlat() {
		return activities
			.slice()
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.map((a) => ({
				...a,
				eventTitle: eventById(a.eventId)?.title ?? ''
			}));
	}

	/**
	 * Drop sub-screens that point at deleted/missing records after store hydrate.
	 */
	function sanitizeView(v: ViewState, evs: Event[], acts: Activity[]): ViewState {
		const next: ViewState = { ...v, sheet: null };
		const sub = next.sub;
		if (!sub) return next;

		if (sub.type === 'detail') {
			if (!evs.some((e) => e.id === sub.id)) next.sub = null;
		} else if (sub.type === 'pay-event') {
			if (!evs.some((e) => e.id === sub.id)) next.sub = null;
		} else if (sub.type === 'pay-activity') {
			const { eventId, activityId } = sub;
			const hasEvent = evs.some((e) => e.id === eventId);
			const hasAct = acts.some((a) => a.id === activityId && a.eventId === eventId);
			if (!hasEvent || !hasAct) next.sub = null;
		}

		return next;
	}

	function patchView(patch: Partial<ViewState>) {
		view = { ...view, ...patch };
	}

	function showToast(message: string) {
		toastMessage = message;
		toastOpen = true;
		scheduleToastHide((open) => (toastOpen = open));
	}

	function closeMenu() {
		patchView({ menu: false });
	}

	function setTab(tab: TabId) {
		patchView({ tab, sub: null, sheet: null, menu: false });
	}

	function handleBack() {
		const sub = view.sub;
		if (!sub) return;
		if (sub.type === 'pay-activity') {
			patchView({ sub: { type: 'pay-event', id: sub.eventId } });
			return;
		}
		patchView({ sub: null });
	}

	function openEvent(id: string) {
		patchView({ sub: { type: 'detail', id }, menu: false });
	}

	/** Open payment tab on a trip's expense picker (mockup `goPayEvent`). */
	function goPayEvent(id: string) {
		patchView({
			tab: 'payment',
			sub: { type: 'pay-event', id },
			sheet: null,
			menu: false
		});
	}

	function openPayEvent(id: string) {
		goPayEvent(id);
	}

	function openPayActivity(eventId: string, activityId: string) {
		patchView({
			sub: { type: 'pay-activity', eventId, activityId },
			menu: false
		});
	}

	function eventCardProps(ev: Event) {
		const acts = activitiesFor(ev.id);
		const totals = calcEvent(ev, acts);
		return {
			title: ev.title,
			createdAt: ev.createdAt,
			budget: ev.budget,
			paxCount: ev.participants.length,
			activityCount: acts.length,
			spent: totals.total
		};
	}

	function payCardProps(ev: Event) {
		const acts = activitiesFor(ev.id);
		const totals = calcEvent(ev, acts);
		return {
			title: ev.title,
			summary: payEventSummary(acts, ev.participants.length, totals.total),
			settled: isEventSettled(ev, acts)
		};
	}

	async function refreshFromStore() {
		const store = await loadStore();
		events = store.events;
		activities = store.activities;
		view = sanitizeView(view, store.events, store.activities);
	}

	async function handleAddParticipant(eventId: string, name: string) {
		const participant = await addParticipant(eventId, name);
		if (!participant) return;
		await refreshFromStore();
		showToast(`Added ${name}`);
	}

	async function handleRemoveParticipant(eventId: string, participantId: string) {
		const ok = await removeParticipant(eventId, participantId);
		if (!ok) return;
		await refreshFromStore();
	}

	async function handleDeleteEvent(eventId: string) {
		if (!confirm('Delete this event and all its expenses?')) return;
		const ok = await deleteEvent(eventId);
		if (!ok) return;
		patchView({ sub: null });
		await refreshFromStore();
		showToast('Event deleted');
	}

	async function handleToggleSettled(activityId: string, settled: boolean) {
		const updated = settled
			? await settleActivity(activityId)
			: await unsettleActivity(activityId);
		if (!updated) return;
		await refreshFromStore();
		showToast(settled ? 'Marked as settled' : 'Marked unpaid');
	}

	async function handleResetDemo() {
		closeMenu();
		const store = await resetDemo();
		events = store.events;
		activities = store.activities;
		patchView({ sub: null, sheet: null, tab: 'events' });
		showToast('Demo data restored');
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
				onclick={() => patchView({ menu: !view.menu })}
			>
				<Icon name="more" />
			</IconButton>
		{/snippet}
	</AppBar>

	<Screen>
		{#if loadStatus === 'loading'}
			<p class="load-status">Loading trips…</p>
		{:else if loadStatus === 'error'}
			<EmptyState
				emoji="⚠️"
				title="Storage unavailable"
				description={loadError ||
					'Beezy needs IndexedDB to save trips offline. Try leaving private browsing or freeing disk space.'}
			/>
		{:else if detailEvent}
			<EventDetail
				event={detailEvent}
				onaddparticipant={(name: string) => handleAddParticipant(detailEvent.id, name)}
				onfinishparticipants={() => showToast('Participants saved')}
				onremoveparticipant={(id: string) => handleRemoveParticipant(detailEvent.id, id)}
				onaddexpense={() => showToast('Add expense — Phase 6')}
				onsettleup={() => goPayEvent(detailEvent.id)}
				ondelete={() => handleDeleteEvent(detailEvent.id)}
			/>
		{:else if payActivity && payEvent && view.sub?.type === 'pay-activity'}
			<Receipt
				eventTitle={payEvent.title}
				activity={payActivity}
				participants={payEvent.participants}
			/>
			<div class="receipt-actions">
				{#if payActivity.settled}
					<Button
						variant="secondary"
						block
						onclick={() => handleToggleSettled(payActivity.id, false)}
					>
						Mark unpaid
					</Button>
					<Button variant="ghost" block onclick={() => showToast('Copy receipt — Phase 7')}>
						<Icon name="copy" />
						Copy receipt text
					</Button>
				{:else}
					<Button
						variant="yellow"
						block
						onclick={() => handleToggleSettled(payActivity.id, true)}
					>
						<Icon name="check" />
						Settle this expense
					</Button>
					<Button variant="ghost" block onclick={() => showToast('Copy receipt — Phase 7')}>
						<Icon name="copy" />
						Copy receipt text
					</Button>
				{/if}
			</div>
		{:else if payEvent && view.sub?.type === 'pay-event'}
			{@const totals = calcEvent(payEvent, payEvent.activities)}
			{@const settledCount = payEvent.activities.filter((a) => a.settled).length}
			{@const allSettled = isEventSettled(payEvent, payEvent.activities)}
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

			{#if payEvent.activities.length === 0}
				<EmptyState
					emoji="🧾"
					title="No expenses yet"
					description="Add expenses on the Activities tab, then come back to settle up."
				>
					{#snippet actions()}
						<Button variant="yellow" onclick={() => setTab('activities')}>Go to Activities</Button>
					{/snippet}
				</EmptyState>
			{:else}
				{#each payEvent.activities as activity (activity.id)}
					{@const ac = calcActivity(activity, payEvent)}
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
						onclick={() => openPayActivity(payEvent.id, activity.id)}
					/>
				{/each}
			{/if}
		{:else}
			{#if view.tab === 'events'}
				{#if events.length === 0}
					<EmptyState
						emoji="🤗"
						title="Welcome to Beezy"
						description="Track shared expenses, split them fairly, and settle up in seconds — even with no signal."
					>
						{#snippet actions()}
							<Button variant="yellow" onclick={() => showToast('New event — Phase 6')}>
								<Icon name="plus" />
								Create your first event
							</Button>
						{/snippet}
					</EmptyState>
				{:else}
					<ScreenHead
						title="Your trips"
						description="Pick an event to manage participants or settle up."
					/>
					{#each events as ev (ev.id)}
						<EventCard {...eventCardProps(ev)} onclick={() => openEvent(ev.id)} />
					{/each}
				{/if}
			{:else if view.tab === 'activities'}
				<ScreenHead
					title={tabLabels.activities}
					description="Every expense, who paid, and when."
				/>
				{#if events.length === 0}
					<EmptyState
						emoji="📝"
						title="No trips yet"
						description="Create an event first, then log shared expenses here."
					>
						{#snippet actions()}
							<Button variant="yellow" onclick={() => setTab('events')}>Go to Events</Button>
						{/snippet}
					</EmptyState>
				{:else if activities.length === 0}
					<EmptyState
						emoji="🧾"
						title="No expenses yet"
						description="Add your first shared expense for a trip."
					>
						{#snippet actions()}
							<Button variant="yellow" onclick={() => showToast('New activity — Phase 6')}>
								Add first expense
							</Button>
						{/snippet}
					</EmptyState>
				{:else}
					{#each allActivitiesFlat() as act (act.id)}
						<ActivityRow
							name={act.name}
							price={act.price}
							paidByName={act.paidByName}
							createdAt={act.createdAt}
							updatedAt={act.updatedAt}
							eventTitle={act.eventTitle}
							onclick={() => showToast(`Edit ${act.name} — Phase 6`)}
						/>
					{/each}
				{/if}
			{:else}
				<ScreenHead
					title={tabLabels.payment}
					description="Pick a trip to generate a receipt everyone can screenshot and share."
				/>
				{#if events.length === 0}
					<EmptyState
						emoji="🧾"
						title="Nothing to settle yet"
						description="Once a trip has expenses, generate a receipt everyone can screenshot."
					>
						{#snippet actions()}
							<Button variant="yellow" onclick={() => setTab('events')}>Create an event</Button>
						{/snippet}
					</EmptyState>
				{:else}
					{#each events as ev (ev.id)}
						<PayEventCard {...payCardProps(ev)} onclick={() => openPayEvent(ev.id)} />
					{/each}
				{/if}
			{/if}
		{/if}
	</Screen>

	<Fab
		aria-label="Add"
		hidden={!fabVisible || loadStatus !== 'ready'}
		onclick={() => showToast(view.tab === 'events' ? 'New event — Phase 6' : 'New activity — Phase 6')}
	>
		<Icon name="plus" />
	</Fab>

	<TabBar>
		<Tab
			label="Activities"
			active={view.tab === 'activities' && !inSubScreen}
			onclick={() => setTab('activities')}
		>
			{#snippet icon()}<Icon name="activities" />{/snippet}
		</Tab>
		<Tab
			label="Events"
			active={view.tab === 'events' && !inSubScreen}
			onclick={() => setTab('events')}
		>
			{#snippet icon()}<Icon name="events" />{/snippet}
		</Tab>
		<Tab
			label="Payment"
			active={view.tab === 'payment' && !inSubScreen}
			onclick={() => setTab('payment')}
		>
			{#snippet icon()}<Icon name="payment" />{/snippet}
		</Tab>
	</TabBar>

	<MenuPopover open={view.menu} onclose={closeMenu}>
		<MenuItem
			label="About Beezy"
			onclick={() => {
				closeMenu();
				showToast('About sheet — Phase 6');
			}}
		>
			{#snippet icon()}<Icon name="info" />{/snippet}
		</MenuItem>
		<MenuItem label="Reset demo data" onclick={handleResetDemo}>
			{#snippet icon()}<Icon name="refresh" />{/snippet}
		</MenuItem>
	</MenuPopover>

	<Toast message={toastMessage} open={toastOpen} />
</AppShell>

<style>
	.load-status {
		margin: 24px 0;
		color: var(--muted);
		font-size: var(--text-sm);
		text-align: center;
	}
</style>
