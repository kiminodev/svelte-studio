import type {
	ActivityBreakdown,
	ActivityLike,
	EventTallyResult,
	Participant,
	PayerBundleResult,
	TallyResult
} from '$lib/beezy/types';
import { peso } from '$lib/beezy/format';

export type {
	ActivityBreakdown,
	ActivityLike,
	EventTallyResult,
	Participant,
	PayerBundleResult,
	TallyResult
};

/** Event slice required by settlement helpers (participants only). */
export interface SettlementEvent {
	participants: Participant[];
}

/**
 * People this expense is split among.
 *
 * Missing or empty `splitWithIds` means everyone on the event. Ids that no
 * longer belong to the event are dropped. The payer is always included when
 * they are still a participant. If nothing valid remains, fall back to everyone
 * so older receipts still add up.
 */
export function resolveSplitters(a: ActivityLike, participants: Participant[]): Participant[] {
	const stored = a.splitWithIds;
	if (!stored?.length) return participants;

	const wanted = new Set(stored);
	if (a.paidById) wanted.add(a.paidById);

	const chosen = participants.filter((p) => wanted.has(p.id));
	return chosen.length ? chosen : participants;
}

/** True when this expense is split with every current participant. */
export function isSplitEveryone(a: ActivityLike, participants: Participant[]): boolean {
	if (!a.splitWithIds?.length) return true;
	return resolveSplitters(a, participants).length === participants.length;
}

/**
 * Persist split ids only when they are a proper subset of the event.
 * Always includes the payer. Missing, empty, or "everyone" → `undefined`.
 */
export function normalizeSplitWithIds(
	ids: string[] | undefined,
	participants: Participant[],
	paidById: string
): string[] | undefined {
	if (!ids?.length || !participants.length) return undefined;

	const allowed = new Set(participants.map((p) => p.id));
	const unique = new Set(ids.filter((id) => allowed.has(id)));
	if (allowed.has(paidById)) unique.add(paidById);
	if (unique.size === 0 || unique.size >= participants.length) return undefined;

	return participants.filter((p) => unique.has(p.id)).map((p) => p.id);
}

/** Stable key for comparing two expenses' split groups. */
export function splitKey(a: ActivityLike, participants: Participant[]): string {
	return resolveSplitters(a, participants)
		.map((p) => p.id)
		.sort()
		.join(',');
}

/**
 * Receipt / copy label for who an expense (or Who-paid bundle) is split with.
 */
export function splitBetweenLabel(
	breakdown: Pick<ActivityBreakdown, 'n' | 'splitEveryone' | 'splitMixed' | 'splitters'>
): string {
	if (breakdown.splitMixed) return 'Varies by expense';
	if (breakdown.splitEveryone) {
		return breakdown.n === 1 ? 'Everyone · 1 person' : `Everyone · ${breakdown.n} people`;
	}
	const names = breakdown.splitters.map((p) => p.name).filter(Boolean);
	return names.length ? names.join(', ') : '—';
}

/**
 * Equal-split tally for a list of activities against an event's participants.
 *
 * Rules:
 * - each expense is split equally among its split group (everyone by default)
 * - `result.share` is still total ÷ participant count (trip-wide average)
 * - each row's `share` is that person's sum of per-expense shares
 * - balance = amount paid − that person's share (positive = is owed money)
 *
 * Payments from unknown payer IDs are ignored.
 */
export function tally(acts: ActivityLike[], participants: Participant[]): TallyResult {
	const total = acts.reduce((sum, a) => sum + Number(a.price || 0), 0);
	const n = participants.length;
	const share = n > 0 ? total / n : 0;
	const paidBy: Record<string, number> = {};
	const shares: Record<string, number> = {};
	for (const p of participants) {
		paidBy[p.id] = 0;
		shares[p.id] = 0;
	}
	for (const a of acts) {
		const price = Number(a.price || 0);
		if (paidBy[a.paidById] != null) {
			paidBy[a.paidById] += price;
		}
		const splitters = resolveSplitters(a, participants);
		const count = splitters.length;
		const piece = count > 0 ? price / count : 0;
		for (const p of splitters) {
			shares[p.id] += piece;
		}
	}
	const rows = participants.map((p) => {
		const paid = paidBy[p.id] ?? 0;
		const personShare = shares[p.id] ?? 0;
		return { id: p.id, name: p.name, paid, share: personShare, balance: paid - personShare };
	});
	return { total, n, share, rows };
}

/**
 * Full trip picture — every expense, regardless of settlement status.
 * Matches mockup `calcEvent(ev)` when activities are passed explicitly.
 */
export function calcEvent(ev: SettlementEvent, activities: ActivityLike[]): EventTallyResult {
	return { ...tally(activities, ev.participants), activities };
}

/**
 * Outstanding balances using unsettled expenses only.
 * Returns the unsettled activity list alongside tally totals.
 */
export function calcOutstanding(ev: SettlementEvent, activities: ActivityLike[]): EventTallyResult {
	const unsettled = activities.filter((a) => !a.settled);
	return { ...tally(unsettled, ev.participants), activities: unsettled };
}

/**
 * Per-expense breakdown: payer, equal share among the split group, and members
 * who owe the payer.
 */
export function calcActivity(a: ActivityLike, ev: SettlementEvent): ActivityBreakdown {
	const total = Number(a.price || 0);
	const splitters = resolveSplitters(a, ev.participants);
	const n = splitters.length;
	const share = n > 0 ? total / n : 0;
	const payer = ev.participants.find((p) => p.id === a.paidById) ?? null;
	const others = splitters.filter((p) => p.id !== a.paidById);
	return {
		total,
		n,
		share,
		payer,
		others,
		splitters,
		splitEveryone: isSplitEveryone(a, ev.participants),
		collectTotal: others.length * share
	};
}

function emptyBundle<T extends ActivityLike>(
	items: T[],
	paidById: string,
	ev: SettlementEvent,
	settled: boolean
): PayerBundleResult<T> {
	const payer = ev.participants.find((p) => p.id === paidById) ?? null;
	const others = ev.participants.filter((p) => p.id !== paidById);
	return {
		total: 0,
		n: ev.participants.length,
		share: 0,
		payer,
		others,
		splitters: ev.participants,
		splitEveryone: true,
		collectTotal: 0,
		activities: items,
		settled
	};
}

/**
 * Combine every expense one person paid.
 * Lists all of them; `total` / `share` use unsettled expenses only so already-paid
 * items stay visible but do not inflate what friends still owe.
 *
 * When outstanding expenses use the same split group, `share` is the combined
 * equal split. When they differ, `splitMixed` is set and `collectTotal` is the
 * sum of each expense's remaining share instead.
 */
export function calcPayerBundle<T extends ActivityLike>(
	activities: T[],
	paidById: string,
	ev: SettlementEvent
): PayerBundleResult<T> {
	const items = activities.filter((a) => a.paidById === paidById);
	const outstanding = items.filter((a) => !a.settled);
	const total = outstanding.reduce((sum, a) => sum + Number(a.price || 0), 0);
	const payer = ev.participants.find((p) => p.id === paidById) ?? null;
	const settled = items.length > 0 && outstanding.length === 0;
	const source = outstanding.length ? outstanding : items;

	if (!source.length) {
		return emptyBundle(items, paidById, ev, settled);
	}

	const keys = source.map((a) => splitKey(a, ev.participants));
	const splitMixed = keys.some((k) => k !== keys[0]);

	if (splitMixed) {
		const breakdowns = outstanding.map((a) => calcActivity(a, ev));
		const collectTotal = breakdowns.reduce((sum, b) => sum + b.collectTotal, 0);
		const otherIds = new Set(breakdowns.flatMap((b) => b.others.map((p) => p.id)));
		const splitterIds = new Set(breakdowns.flatMap((b) => b.splitters.map((p) => p.id)));
		return {
			total,
			n: 0,
			share: 0,
			payer,
			others: ev.participants.filter((p) => otherIds.has(p.id)),
			splitters: ev.participants.filter((p) => splitterIds.has(p.id)),
			splitEveryone: false,
			splitMixed: true,
			collectTotal,
			activities: items,
			settled
		};
	}

	const first = calcActivity(source[0], ev);
	const n = first.n;
	const share = n > 0 ? total / n : 0;
	return {
		total,
		n,
		share,
		payer,
		others: first.others,
		splitters: first.splitters,
		splitEveryone: first.splitEveryone,
		collectTotal: first.others.length * share,
		activities: items,
		settled
	};
}

/** One Who-paid receipt: expenses that share the same split group. */
export interface PayerSplitBundle<T extends ActivityLike = ActivityLike> {
	key: string;
	bundle: PayerBundleResult<T>;
}

/**
 * Who-paid receipts for one person.
 *
 * Everyone-split expenses share a single receipt. Each unique friend-split
 * set (same people on the split) gets its own receipt so mixed trips can
 * settle and share one group at a time.
 *
 * Everyone-split comes first; other groups follow first-seen expense order.
 */
export function listPayerSplitBundles<T extends ActivityLike>(
	activities: T[],
	paidById: string,
	ev: SettlementEvent
): PayerSplitBundle<T>[] {
	const items = activities.filter((a) => a.paidById === paidById);
	if (!items.length) return [];

	const groups = new Map<string, T[]>();
	const order: string[] = [];
	let everyoneKey: string | null = null;

	for (const item of items) {
		const key = splitKey(item, ev.participants);
		if (!groups.has(key)) {
			groups.set(key, []);
			order.push(key);
			if (isSplitEveryone(item, ev.participants)) everyoneKey = key;
		}
		groups.get(key)?.push(item);
	}

	const sortedKeys = everyoneKey
		? [everyoneKey, ...order.filter((key) => key !== everyoneKey)]
		: order;

	return sortedKeys.map((key) => ({
		key,
		bundle: calcPayerBundle(groups.get(key) ?? [], paidById, ev)
	}));
}

/** First-seen payer ids, in the order their expenses appear. */
export function listPayerIds(activities: ActivityLike[]): string[] {
	const seen = new Set<string>();
	const ids: string[] = [];
	for (const activity of activities) {
		if (seen.has(activity.paidById)) continue;
		seen.add(activity.paidById);
		ids.push(activity.paidById);
	}
	return ids;
}

/** True when this trip already has someone with the same name (case-insensitive). */
export function participantNameTaken(participants: Participant[], name: string): boolean {
	const needle = name.trim().toLowerCase();
	if (!needle) return false;
	return participants.some((p) => p.name.trim().toLowerCase() === needle);
}

/**
 * True when the event has at least one activity and every one is marked settled.
 */
export function isEventSettled(_ev: SettlementEvent, activities: ActivityLike[]): boolean {
	return activities.length > 0 && activities.every((a) => a.settled);
}

/** Summary line for PayEventCard. */
export function payEventSummary(
	activities: ActivityLike[],
	participantCount: number,
	totalSpent: number
): string {
	const settledCount = activities.filter((a) => a.settled).length;
	const allSettled = activities.length > 0 && activities.every((a) => a.settled);
	const people = participantCount === 1 ? '1 person' : `${participantCount} people`;
	if (!activities.length) return `${people} · no expenses yet`;
	if (allSettled) {
		return `All settled · ${peso(totalSpent)} spent · ${people}`;
	}
	return `${settledCount}/${activities.length} settled · ${peso(totalSpent)} spent · ${people}`;
}

/** Participant can be removed only if they have not paid for any expense. */
export function canRemoveParticipant(participantId: string, activities: ActivityLike[]): boolean {
	return !activities.some((a) => a.paidById === participantId);
}

export type BalanceVariant = 'pos' | 'neg' | 'zero';

/** CSS class suffix for `.bal.{variant}`. */
export function balanceVariant(balance: number): BalanceVariant {
	if (balance > 0.5) return 'pos';
	if (balance < -0.5) return 'neg';
	return 'zero';
}

