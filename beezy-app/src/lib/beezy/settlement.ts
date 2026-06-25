import type {
	ActivityBreakdown,
	ActivityLike,
	EventTallyResult,
	Participant,
	TallyResult
} from '$lib/beezy/types';
import { peso } from '$lib/beezy/format';

export type { ActivityBreakdown, ActivityLike, EventTallyResult, Participant, TallyResult };

/** Equal-split tally for a list of activities against participants. */
export function tally(acts: ActivityLike[], participants: Participant[]): TallyResult {
	const total = acts.reduce((sum, a) => sum + Number(a.price || 0), 0);
	const n = participants.length;
	const share = n > 0 ? total / n : 0;
	const paidBy: Record<string, number> = {};
	participants.forEach((p) => {
		paidBy[p.id] = 0;
	});
	acts.forEach((a) => {
		if (paidBy[a.paidById] != null) {
			paidBy[a.paidById] += Number(a.price || 0);
		}
	});
	const rows = participants.map((p) => {
		const paid = paidBy[p.id] ?? 0;
		return { id: p.id, name: p.name, paid, share, balance: paid - share };
	});
	return { total, n, share, rows };
}

/** Full trip totals — every expense, regardless of settlement. */
export function calcEvent(
	participants: Participant[],
	activities: ActivityLike[]
): EventTallyResult {
	return { ...tally(activities, participants), activities };
}

/** Outstanding balances using unsettled expenses only. */
export function calcOutstanding(
	participants: Participant[],
	activities: ActivityLike[]
): TallyResult {
	const unsettled = activities.filter((a) => !a.settled);
	return tally(unsettled, participants);
}

/** True when every activity is marked settled (and at least one exists). */
export function isEventSettled(activities: ActivityLike[]): boolean {
	return activities.length > 0 && activities.every((a) => a.settled);
}

/** Summary line for PayEventCard. */
export function payEventSummary(
	activities: ActivityLike[],
	participantCount: number,
	totalSpent: number
): string {
	const settledCount = activities.filter((a) => a.settled).length;
	const allSettled = isEventSettled(activities);
	if (!activities.length) return `${participantCount} pax · no expenses yet`;
	if (allSettled) {
		return `All settled · ${peso(totalSpent)} spent · ${participantCount} pax`;
	}
	return `${settledCount}/${activities.length} settled · ${peso(totalSpent)} spent · ${participantCount} pax`;
}

/** Per-expense breakdown: who paid and what each other member owes. */
export function calcActivity(activity: ActivityLike, participants: Participant[]): ActivityBreakdown {
	const total = Number(activity.price || 0);
	const n = participants.length;
	const share = n > 0 ? total / n : 0;
	const payer = participants.find((p) => p.id === activity.paidById) ?? null;
	const others = participants.filter((p) => p.id !== activity.paidById);
	return { total, n, share, payer, others };
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
