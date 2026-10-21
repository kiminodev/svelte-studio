import { describe, expect, test } from 'bun:test';
import { peso } from '$lib/beezy/format';
import {
	balanceStatus,
	balanceVariant,
	calcActivity,
	calcEvent,
	calcOutstanding,
	canRemoveParticipant,
	isEventSettled,
	payEventSummary,
	tally
} from '$lib/beezy/settlement';
import type { ActivityLike, Participant } from '$lib/beezy/types';

const pax: Participant[] = [
	{ id: 'p1', name: 'Mika' },
	{ id: 'p2', name: 'Jomar' },
	{ id: 'p3', name: 'Andrea' },
	{ id: 'p4', name: 'Paolo' }
];

const ev = { participants: pax };

/** Compact activity fixture — settlement only reads price, paidById, settled. */
function act(price: number, paidById: string, settled = false): ActivityLike {
	return { price, paidById, settled };
}

/** Boracay seed totals: ₱23,000 across 4 pax. */
const boracay: ActivityLike[] = [
	act(8000, 'p1'),
	act(3600, 'p2'),
	act(1200, 'p4'),
	act(2400, 'p3'),
	act(5000, 'p1'),
	act(2800, 'p2')
];

describe('tally', () => {
	test('equal-splits Boracay seed numbers', () => {
		const result = tally(boracay, pax);
		expect(result.total).toBe(23000);
		expect(result.n).toBe(4);
		expect(result.share).toBe(5750);
		expect(result.rows).toEqual([
			{ id: 'p1', name: 'Mika', paid: 13000, share: 5750, balance: 7250 },
			{ id: 'p2', name: 'Jomar', paid: 6400, share: 5750, balance: 650 },
			{ id: 'p3', name: 'Andrea', paid: 2400, share: 5750, balance: -3350 },
			{ id: 'p4', name: 'Paolo', paid: 1200, share: 5750, balance: -4550 }
		]);
	});

	test('empty activities still lists participants at zero', () => {
		const result = tally([], pax);
		expect(result).toEqual({
			total: 0,
			n: 4,
			share: 0,
			rows: pax.map((p) => ({ id: p.id, name: p.name, paid: 0, share: 0, balance: 0 }))
		});
	});

	test('zero participants yields share 0 and empty rows', () => {
		const result = tally(boracay, []);
		expect(result.total).toBe(23000);
		expect(result.n).toBe(0);
		expect(result.share).toBe(0);
		expect(result.rows).toEqual([]);
	});

	test('unknown payer ids are not credited, but still count in total', () => {
		const result = tally([act(1000, 'p1'), act(400, 'ghost')], pax);
		expect(result.total).toBe(1400);
		expect(result.share).toBe(350);
		expect(result.rows.find((r) => r.id === 'p1')?.paid).toBe(1000);
		expect(result.rows.every((r) => r.id !== 'ghost')).toBe(true);
	});

	test('missing or falsy price counts as 0', () => {
		const result = tally(
			[{ paidById: 'p1' } as ActivityLike, act(0, 'p2'), act(200, 'p3')],
			pax
		);
		expect(result.total).toBe(200);
		expect(result.rows.find((r) => r.id === 'p1')?.paid).toBe(0);
	});
});

describe('calcEvent / calcOutstanding', () => {
	const mixed: ActivityLike[] = [act(8000, 'p1', true), act(3600, 'p2', false)];

	test('calcEvent tallies every expense regardless of settled', () => {
		const result = calcEvent(ev, mixed);
		expect(result.total).toBe(11600);
		expect(result.activities).toEqual(mixed);
	});

	test('calcOutstanding tallies unsettled expenses only', () => {
		const result = calcOutstanding(ev, mixed);
		expect(result.total).toBe(3600);
		expect(result.share).toBe(900);
		expect(result.activities).toEqual([mixed[1]]);
		expect(result.rows.find((r) => r.id === 'p1')?.paid).toBe(0);
		expect(result.rows.find((r) => r.id === 'p2')?.paid).toBe(3600);
	});
});

describe('calcActivity', () => {
	test('splits one expense equally and names who owes the payer', () => {
		const result = calcActivity(act(8000, 'p1'), ev);
		expect(result.total).toBe(8000);
		expect(result.n).toBe(4);
		expect(result.share).toBe(2000);
		expect(result.payer).toEqual(pax[0]);
		expect(result.others.map((p) => p.id)).toEqual(['p2', 'p3', 'p4']);
	});

	test('solo expense has no split partners', () => {
		const solo = { participants: [pax[0]] };
		const result = calcActivity(act(8000, 'p1'), solo);
		expect(result.n).toBe(1);
		expect(result.share).toBe(8000);
		expect(result.others).toEqual([]);
	});

	test('unknown payer is null and everyone is in others', () => {
		const result = calcActivity(act(1000, 'ghost'), ev);
		expect(result.payer).toBeNull();
		expect(result.others).toEqual(pax);
	});
});

describe('isEventSettled', () => {
	test('false when there are no activities', () => {
		expect(isEventSettled(ev, [])).toBe(false);
	});

	test('false until every activity is settled', () => {
		expect(isEventSettled(ev, [act(1, 'p1', true), act(1, 'p2', false)])).toBe(false);
	});

	test('true when there is at least one activity and all are settled', () => {
		expect(isEventSettled(ev, [act(1, 'p1', true), act(1, 'p2', true)])).toBe(true);
	});
});

describe('canRemoveParticipant', () => {
	test('true when they have not paid for any expense', () => {
		expect(canRemoveParticipant('p3', [act(8000, 'p1'), act(3600, 'p2')])).toBe(true);
	});

	test('false when they paid for any expense, even if settled', () => {
		expect(canRemoveParticipant('p1', [act(8000, 'p1', true)])).toBe(false);
	});

	test('true when the activity list is empty', () => {
		expect(canRemoveParticipant('p1', [])).toBe(true);
	});
});

describe('payEventSummary', () => {
	test('no expenses', () => {
		expect(payEventSummary([], 4, 0)).toBe('4 people · no expenses yet');
	});

	test('partially settled', () => {
		const acts = [act(100, 'p1', true), act(100, 'p2', false), act(100, 'p3', false)];
		expect(payEventSummary(acts, 4, 300)).toBe(
			`1/3 settled · ${peso(300)} spent · 4 people`
		);
	});

	test('all settled', () => {
		const acts = [act(100, 'p1', true), act(200, 'p2', true)];
		expect(payEventSummary(acts, 4, 300)).toBe(
			`All settled · ${peso(300)} spent · 4 people`
		);
	});
});

describe('balanceVariant / balanceStatus', () => {
	test('treats |balance| ≤ 0.5 as settled (zero)', () => {
		expect(balanceVariant(0)).toBe('zero');
		expect(balanceVariant(0.5)).toBe('zero');
		expect(balanceVariant(-0.5)).toBe('zero');
		expect(balanceStatus(0)).toBe('settled up');
		expect(balanceStatus(0.49)).toBe('settled up');
	});

	test('positive above 0.5 is owed', () => {
		expect(balanceVariant(0.51)).toBe('pos');
		expect(balanceStatus(1200)).toBe(`is owed ${peso(1200)}`);
	});

	test('negative below -0.5 owes', () => {
		expect(balanceVariant(-0.51)).toBe('neg');
		expect(balanceStatus(-800)).toBe(`owes ${peso(800)}`);
	});
});
