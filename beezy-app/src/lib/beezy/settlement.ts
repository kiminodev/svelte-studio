import type {
	ActivityBreakdown,
	ActivityLike,
	EventTallyResult,
	Participant,
	TallyResult
} from '$lib/beezy/types';
import { peso } from '$lib/beezy/format';

export type { ActivityBreakdown, ActivityLike, EventTallyResult, Participant, TallyResult };

/** Event slice required by settlement helpers (participants only). */
export interface SettlementEvent {
	participants: Participant[];
}

/**
 * Equal-split tally for a list of activities against an event's participants.
 *
 * Rules:
 * - share = total price ÷ participant count (0 when n = 0)
 * - balance = amount paid − share (positive = is owed money)
 *
 * Payments from unknown payer IDs are ignored.
 */
export function tally(acts: ActivityLike[], participants: Participant[]): TallyResult {
	const total = acts.reduce((sum, a) => sum + Number(a.price || 0), 0);
	const n = participants.length;
	const share = n > 0 ? total / n : 0;
	const paidBy: Record<string, number> = {};
	for (const p of participants) {
		paidBy[p.id] = 0;
	}
	for (const a of acts) {
		if (paidBy[a.paidById] != null) {
			paidBy[a.paidById] += Number(a.price || 0);
		}
	}
	const rows = participants.map((p) => {
		const paid = paidBy[p.id] ?? 0;
		return { id: p.id, name: p.name, paid, share, balance: paid - share };
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
 * Per-expense breakdown: payer, equal share, and members who owe the payer.
 */
export function calcActivity(a: ActivityLike, ev: SettlementEvent): ActivityBreakdown {
	const total = Number(a.price || 0);
	const n = ev.participants.length;
	const share = n > 0 ? total / n : 0;
	const payer = ev.participants.find((p) => p.id === a.paidById) ?? null;
	const others = ev.participants.filter((p) => p.id !== a.paidById);
	return { total, n, share, payer, others };
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
	if (!activities.length) return `${participantCount} pax · no expenses yet`;
	if (allSettled) {
		return `All settled · ${peso(totalSpent)} spent · ${participantCount} pax`;
	}
	return `${settledCount}/${activities.length} settled · ${peso(totalSpent)} spent · ${participantCount} pax`;
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

/** Human-readable outstanding status for a participant row subtitle. */
export function balanceStatus(balance: number): string {
	if (Math.abs(balance) < 0.5) return 'settled up';
	if (balance > 0) return `is owed ${peso(balance)}`;
	return `owes ${peso(-balance)}`;
}
