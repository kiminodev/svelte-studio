import { peso } from '$lib/kkb/format';

export interface Participant {
	id: string;
	name: string;
}

/** Minimal activity fields needed for settlement math. */
export interface ActivityLike {
	price: number;
	paidById: string;
	settled?: boolean;
}

export interface TallyRow {
	id: string;
	name: string;
	paid: number;
	share: number;
	balance: number;
}

export interface TallyResult {
	total: number;
	n: number;
	share: number;
	rows: TallyRow[];
}

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
): TallyResult & { activities: ActivityLike[] } {
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
