<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		calcActivity,
		calcEvent,
		calcPayerBundle,
		isEventSettled,
		listPayerIds,
		payEventSummary
	} from '$lib/beezy/settlement';
	import { fmtDate, peso, sortNewestFirst } from '$lib/beezy/format';
	import {
		addParticipant,
		createActivity,
		createEvent,
		deleteActivity,
		deleteEvent,
		loadStore,
		removeParticipant,
		setActivitiesSettledByPayer,
		settleActivity,
		unsettleActivity,
		updateActivity,
		type CreateActivityInput,
		type CreateEventInput
	} from '$lib/beezy/store';
	import { copyActivitySummary, copyPayerSummary } from '$lib/beezy/activitySummary';
	import { defaultViewState, loadView, saveView } from '$lib/beezy/view';
	import { applyTheme, loadTheme, saveTheme, type ThemeId } from '$lib/beezy/theme';
	import type { Activity, Event, PayReceiptMode, TabId, ViewState } from '$lib/beezy/types';
	import {
		AboutSheet,
		ActivityRow,
		ActivitySheet,
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
		NewEventSheet,
		PayEventCard,
		PayerReceipt,
		PayProgress,
		Receipt,
		ReceiptModeToggle,
		Screen,
		ScreenHead,
		Tab,
		TabBar,
		ThemePicker,
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
	let theme = $state<ThemeId>('yellow');

	onMount(() => {
		const restoredTheme = loadTheme();
		theme = restoredTheme;
		applyTheme(restoredTheme);

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
			.catch(() => {
				loadStatus = 'error';
				loadError =
					"Beezy couldn't save on this phone. Turn off private browsing if it's on, or free up some space, then try again.";
			});
	});

	$effect(() => {
		if (!viewHydrated) return;
		// Track fields so effect re-runs on any view change.
		const snapshot: ViewState = {
			tab: view.tab,
			sub: view.sub,
			sheet: view.sheet,
			menu: view.menu,
			hideDone: view.hideDone,
			payReceiptMode: view.payReceiptMode
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
		const id =
			sub.type === 'pay-event'
				? sub.id
				: sub.type === 'pay-activity' || sub.type === 'pay-person'
					? sub.eventId
					: null;
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

	const payPersonId = $derived.by(() => {
		const sub = view.sub;
		if (sub?.type !== 'pay-person' || !payEvent) return null;
		return sub.paidById;
	});

	const payPersonBundle = $derived.by(() => {
		if (!payPersonId || !payEvent) return null;
		const bundle = calcPayerBundle(payEvent.activities, payPersonId, payEvent);
		if (bundle.activities.length === 0) return null;
		return bundle;
	});

	const payPayers = $derived.by(() => {
		if (!payEvent) return [];
		return listPayerIds(payEvent.activities).map((paidById) => {
			const bundle = calcPayerBundle(payEvent.activities, paidById, payEvent);
			const sample = payEvent.activities.find((a) => a.paidById === paidById);
			return {
				paidById,
				name: bundle.payer?.name ?? sample?.paidByName ?? '—',
				bundle
			};
		});
	});

	const inSubScreen = $derived(view.sub !== null);

	const appBar = $derived.by(() => {
		if (
			(view.sub?.type === 'pay-activity' && payActivity && payEvent) ||
			(view.sub?.type === 'pay-person' && payPersonBundle && payEvent)
		) {
			return {
				title: payEvent.title,
				subtitle: 'Receipt to screenshot & share',
				back: true
			};
		}
		if (view.sub?.type === 'pay-event' && payEvent) {
			return {
				title: payEvent.title,
				subtitle:
					view.payReceiptMode === 'person'
						? 'Pick who paid to settle'
						: 'Pick an expense to settle',
				back: true
			};
		}
		if (detailEvent) {
			return {
				title: detailEvent.title,
				subtitle: "Who's in, and who owes",
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

	const settledEventIds = $derived.by(() => {
		const ids = new Set<string>();
		for (const ev of events) {
			if (isEventSettled(ev, activitiesFor(ev.id))) ids.add(ev.id);
		}
		return ids;
	});

	const visibleEvents = $derived(
		view.hideDone ? events.filter((ev) => !settledEventIds.has(ev.id)) : events
	);

	const visibleActivitiesFlat = $derived.by(() => {
		const list = allActivitiesFlat();
		if (!view.hideDone) return list;
		return list.filter((a) => !settledEventIds.has(a.eventId));
	});

	function hiddenListHint(fallback: string): string {
		if (view.hideDone && settledEventIds.size > 0) {
			const n = settledEventIds.size;
			return `${n} settled trip${n === 1 ? '' : 's'} hidden.`;
		}
		return fallback;
	}

	function eventById(id: string): Event | null {
		return events.find((e) => e.id === id) ?? null;
	}

	function activitiesFor(eventId: string): Activity[] {
		return sortNewestFirst(activities.filter((a) => a.eventId === eventId));
	}

	/** Activities newest-first with event title (mirrors getAllActivities + join). */
	function allActivitiesFlat() {
		return sortNewestFirst(activities).map((a) => ({
			...a,
			eventTitle: eventById(a.eventId)?.title ?? ''
		}));
	}

	const editingActivity = $derived.by(() => {
		const sheet = view.sheet;
		if (sheet?.type !== 'activity' || !sheet.id) return null;
		return activities.find((a) => a.id === sheet.id) ?? null;
	});

	/**
	 * Drop sub-screens / edit sheets that point at deleted/missing records.
	 * New-event and About sheets stay as-is; activity sheets with a missing id close.
	 */
	function sanitizeView(v: ViewState, evs: Event[], acts: Activity[]): ViewState {
		const next: ViewState = { ...v };
		const sub = next.sub;

		if (sub?.type === 'detail') {
			if (!evs.some((e) => e.id === sub.id)) next.sub = null;
		} else if (sub?.type === 'pay-event') {
			if (!evs.some((e) => e.id === sub.id)) next.sub = null;
		} else if (sub?.type === 'pay-activity') {
			const { eventId, activityId } = sub;
			const hasEvent = evs.some((e) => e.id === eventId);
			const hasAct = acts.some((a) => a.id === activityId && a.eventId === eventId);
			if (!hasEvent || !hasAct) next.sub = null;
		} else if (sub?.type === 'pay-person') {
			const hasEvent = evs.some((e) => e.id === sub.eventId);
			const hasActs = acts.some(
				(a) => a.eventId === sub.eventId && a.paidById === sub.paidById
			);
			if (!hasEvent || !hasActs) next.sub = null;
		}

		const sheet = next.sheet;
		if (sheet?.type === 'activity' && sheet.id && !acts.some((a) => a.id === sheet.id)) {
			next.sheet = null;
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
		if (sub.type === 'pay-activity' || sub.type === 'pay-person') {
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

	function openPayPerson(eventId: string, paidById: string) {
		patchView({
			sub: { type: 'pay-person', eventId, paidById },
			menu: false
		});
	}

	function setPayReceiptMode(mode: PayReceiptMode) {
		patchView({ payReceiptMode: mode });
	}

	function closeSheet() {
		patchView({ sheet: null });
	}

	function openNewEventSheet() {
		patchView({ sheet: { type: 'new-event' }, menu: false });
	}

	/** Open create (`id` null) or edit activity sheet; `eventId` presets the event select. */
	function openActivitySheet(id: string | null = null, eventId: string | null = null) {
		patchView({ sheet: { type: 'activity', id, eventId }, menu: false });
	}

	function openAboutSheet() {
		patchView({ sheet: { type: 'about' }, menu: false });
	}

	function handleTheme(id: ThemeId) {
		theme = id;
		applyTheme(id);
		saveTheme(id);
	}

	function focusParticipantInput() {
		document.getElementById('pax-name')?.focus();
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
			spent: totals.total,
			settled: isEventSettled(ev, acts)
		};
	}

	function toggleHideDone() {
		patchView({ hideDone: !view.hideDone });
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

	function handleDuplicateParticipant(name: string) {
		showToast(`${name} is already on this trip. Try a nickname.`);
	}

	async function handleRemoveParticipant(eventId: string, participantId: string) {
		const ok = await removeParticipant(eventId, participantId);
		if (!ok) return;
		await refreshFromStore();
	}

	async function handleDeleteEvent(eventId: string) {
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
		if (!settled) {
			showToast('Marked unpaid');
			return;
		}
		const ev = eventById(updated.eventId);
		const acts = activitiesFor(updated.eventId);
		if (ev && isEventSettled(ev, acts)) {
			showToast(`All settled — ${ev.title} is square 🤗`);
		} else {
			showToast('Marked as settled');
		}
	}

	async function handleCopyReceipt() {
		if (!payEvent) return;
		const ok = payPersonId
			? await copyPayerSummary(payEvent.activities, payPersonId, payEvent)
			: payActivity
				? await copyActivitySummary(payActivity, payEvent)
				: false;
		showToast(ok ? 'Copied — paste it in the chat' : "Couldn't copy — screenshot the receipt instead");
	}

	async function handleTogglePayerSettled(settled: boolean) {
		if (!payPersonId || !payEvent) return;
		const changed = await setActivitiesSettledByPayer(payEvent.id, payPersonId, settled);
		if (!changed && settled) return;
		await refreshFromStore();
		if (!settled) {
			showToast('Marked unpaid');
			return;
		}
		const ev = eventById(payEvent.id);
		const acts = activitiesFor(payEvent.id);
		if (ev && isEventSettled(ev, acts)) {
			showToast(`All settled — ${ev.title} is square 🤗`);
		} else {
			showToast('Marked as settled');
		}
	}

	async function handleSaveEvent(input: CreateEventInput) {
		const created = await createEvent(input);
		const store = await loadStore();
		events = store.events;
		activities = store.activities;
		patchView({
			tab: 'events',
			sub: { type: 'detail', id: created.id },
			sheet: null,
			menu: false
		});
		await tick();
		focusParticipantInput();
		showToast('Event created');
	}

	async function handleSaveActivity(input: CreateActivityInput) {
		const sheet = view.sheet;
		if (sheet?.type !== 'activity') return;

		const saved = sheet.id
			? await updateActivity(sheet.id, input)
			: await createActivity(input);
		if (!saved) {
			showToast('Fill all fields');
			return;
		}

		const editing = Boolean(sheet.id);
		patchView({ sheet: null });
		await refreshFromStore();
		showToast(editing ? 'Activity updated' : 'Activity added');
	}

	async function handleDeleteActivity(id: string) {
		const ok = await deleteActivity(id);
		if (!ok) return;
		patchView({ sheet: null });
		await refreshFromStore();
		showToast('Activity deleted');
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
		{#snippet brand()}{/snippet}
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
				title="Can't save trips yet"
				description={loadError ||
					"Beezy couldn't save on this phone. Turn off private browsing if it's on, or free up some space, then try again."}
			/>
		{:else if detailEvent}
			<EventDetail
				event={detailEvent}
				onaddparticipant={(name: string) => handleAddParticipant(detailEvent.id, name)}
				onduplicate={handleDuplicateParticipant}
				onremoveparticipant={(id: string) => handleRemoveParticipant(detailEvent.id, id)}
				onaddexpense={() => openActivitySheet(null, detailEvent.id)}
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
				{:else}
					<Button
						variant="yellow"
						block
						onclick={() => handleToggleSettled(payActivity.id, true)}
					>
						<Icon name="check" />
						Settle this expense
					</Button>
				{/if}
				<Button variant="ghost" block onclick={handleCopyReceipt}>
					<Icon name="copy" />
					Copy receipt text
				</Button>
			</div>
		{:else if payPersonBundle && payPersonId && payEvent && view.sub?.type === 'pay-person'}
			<PayerReceipt
				eventTitle={payEvent.title}
				paidById={payPersonId}
				activities={payEvent.activities}
				participants={payEvent.participants}
			/>
			<div class="receipt-actions">
				{#if payPersonBundle.settled}
					<Button variant="secondary" block onclick={() => handleTogglePayerSettled(false)}>
						Mark unpaid
					</Button>
				{:else}
					<Button variant="yellow" block onclick={() => handleTogglePayerSettled(true)}>
						<Icon name="check" />
						Settle these expenses
					</Button>
				{/if}
				<Button variant="ghost" block onclick={handleCopyReceipt}>
					<Icon name="copy" />
					Copy receipt text
				</Button>
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

			{#if payEvent.activities.length > 0}
				<ReceiptModeToggle mode={view.payReceiptMode} onchange={setPayReceiptMode} />
			{/if}

			{#if allSettled}
				<HintCard emoji="✅">
					Everyone's square on <strong>{payEvent.title}</strong>.
					{view.payReceiptMode === 'person'
						? 'Tap who paid to reopen their receipt, or mark one unpaid.'
						: 'Tap any expense to reopen its receipt, or mark one unpaid.'}
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
			{:else if view.payReceiptMode === 'person'}
				{#each payPayers as payer (payer.paidById)}
					{@const bundle = payer.bundle}
					{@const each = bundle.n > 0 ? peso(bundle.share) : '—'}
					{@const totalCount = bundle.activities.length}
					{@const openCount = bundle.activities.filter((a) => !a.settled).length}
					{@const countLabel =
						totalCount === 1 ? '1 expense' : `${totalCount} expenses`}
					<ActivityRow
						name={payer.name}
						price={bundle.total}
						paidByName={payer.name}
						createdAt={bundle.activities[0]?.createdAt ?? ''}
						variant="payment"
						showPaidBy={false}
						settled={bundle.settled}
						oweLabel={bundle.others.length
							? `${bundle.others.length} owe ${each} each`
							: 'solo expense'}
						statusLabel={bundle.settled
							? `${countLabel} · settled`
							: openCount < totalCount
								? `${openCount} of ${totalCount} still open · tap to settle →`
								: `${countLabel} · tap to settle →`}
						onclick={() => openPayPerson(payEvent.id, payer.paidById)}
					/>
				{/each}
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
						emoji=""
						title="Welcome to Beezy"
						description="Track shared expenses, split them fairly, and settle up in seconds — even with no signal."
					>
						{#snippet actions()}
							<Button variant="yellow" onclick={openNewEventSheet}>
								<Icon name="plus" />
								Create your first event
							</Button>
						{/snippet}
					</EmptyState>
				{:else}
					<ScreenHead
						title="Your trips"
						description={hiddenListHint('Pick a trip to add friends or settle up.')}
					>
						{#snippet actions()}
							{@render hideDoneToggle()}
						{/snippet}
					</ScreenHead>
					{#if visibleEvents.length === 0}
						<EmptyState
							emoji="✅"
							title="Settled trips are hidden"
							description="Turn Show done back on to see trips that are already square."
						>
							{#snippet actions()}
								<Button variant="yellow" onclick={toggleHideDone}>Show done</Button>
							{/snippet}
						</EmptyState>
					{:else}
						{#each visibleEvents as ev (ev.id)}
							<EventCard {...eventCardProps(ev)} onclick={() => openEvent(ev.id)} />
						{/each}
					{/if}
				{/if}
			{:else if view.tab === 'activities'}
				{#if events.length === 0}
					<EmptyState
						emoji="📋"
						title="No activities yet"
						description="Create an event first — activities belong to a trip."
					>
						{#snippet actions()}
							<Button variant="yellow" onclick={() => setTab('events')}>Go to Events</Button>
						{/snippet}
					</EmptyState>
				{:else if activities.length === 0}
					<EmptyState
						emoji="📋"
						title="Log your first expense"
						description="Who paid, for what, and how much. Beezy tracks the rest."
					>
						{#snippet actions()}
							<Button variant="yellow" onclick={() => openActivitySheet()}>
								<Icon name="plus" />
								Add activity
							</Button>
						{/snippet}
					</EmptyState>
				{:else}
					<ScreenHead
						title="Activities"
						description={hiddenListHint('Every expense, who paid, and when. Tap to edit.')}
					>
						{#snippet actions()}
							{@render hideDoneToggle()}
						{/snippet}
					</ScreenHead>
					{#if visibleActivitiesFlat.length === 0}
						<EmptyState
							emoji="✅"
							title="Settled trips are hidden"
							description="Turn Show done back on to see expenses from trips that are already square."
						>
							{#snippet actions()}
								<Button variant="yellow" onclick={toggleHideDone}>Show done</Button>
							{/snippet}
						</EmptyState>
					{:else}
						{#each visibleActivitiesFlat as act (act.id)}
							<ActivityRow
								name={act.name}
								price={act.price}
								paidByName={act.paidByName}
								createdAt={act.createdAt}
								updatedAt={act.updatedAt}
								eventTitle={act.eventTitle}
								settled={act.settled}
								onclick={() => openActivitySheet(act.id, act.eventId)}
							/>
						{/each}
					{/if}
				{/if}
			{:else}
				<ScreenHead
					title={tabLabels.payment}
					description={hiddenListHint(
						'Pick a trip to generate a receipt everyone can screenshot and share.'
					)}
				>
					{#snippet actions()}
						{@render hideDoneToggle()}
					{/snippet}
				</ScreenHead>
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
				{:else if visibleEvents.length === 0}
					<EmptyState
						emoji="✅"
						title="Settled trips are hidden"
						description="Turn Show done back on to settle or reopen receipts for square trips."
					>
						{#snippet actions()}
							<Button variant="yellow" onclick={toggleHideDone}>Show done</Button>
						{/snippet}
					</EmptyState>
				{:else}
					{#each visibleEvents as ev (ev.id)}
						<PayEventCard {...payCardProps(ev)} onclick={() => openPayEvent(ev.id)} />
					{/each}
				{/if}
			{/if}
		{/if}
	</Screen>

	<Fab
		aria-label="Add"
		hidden={!fabVisible || loadStatus !== 'ready'}
		onclick={() => (view.tab === 'events' ? openNewEventSheet() : openActivitySheet())}
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
		<MenuItem label="About Beezy" onclick={openAboutSheet}>
			{#snippet icon()}<Icon name="info" />{/snippet}
		</MenuItem>
		<div class="menu-sep"></div>
		<ThemePicker value={theme} onchange={handleTheme} />
	</MenuPopover>

	{#if view.sheet?.type === 'new-event'}
		<NewEventSheet onclose={closeSheet} onsave={handleSaveEvent} oninvalid={showToast} />
	{:else if view.sheet?.type === 'activity' && (!view.sheet.id || editingActivity)}
		<ActivitySheet
			events={events}
			activity={editingActivity}
			presetEventId={view.sheet.eventId}
			onclose={closeSheet}
			onsave={handleSaveActivity}
			ondelete={handleDeleteActivity}
			oninvalid={showToast}
		/>
	{:else if view.sheet?.type === 'about'}
		<AboutSheet onclose={closeSheet} />
	{/if}

	<Toast message={toastMessage} open={toastOpen} />
</AppShell>

{#snippet hideDoneToggle()}
	{#if settledEventIds.size > 0}
		<Button variant="ghost" size="sm" onclick={toggleHideDone} aria-pressed={view.hideDone}>
			{view.hideDone ? 'Show done' : 'Hide done'}
		</Button>
	{/if}
{/snippet}

<style>
	.load-status {
		margin: 24px 0;
		color: var(--muted);
		font-size: var(--text-sm);
		text-align: center;
	}
</style>
