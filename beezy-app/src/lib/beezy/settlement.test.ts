import { describe, expect, test } from 'bun:test';
import { peso } from '$lib/beezy/format';
import {
	balanceVariant,
	calcActivity,
	calcEvent,
	calcOutstanding,
	calcPayerBundle,
	canRemoveParticipant,
	isEventSettled,
	listPayerIds,
	listPayerSplitBundles,
	normalizeSplitWithIds,
	participantNameTaken,
	payEventSummary,
	splitBetweenLabel,
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

/** Compact activity fixture — settlement reads price, paidById, settled, splitWithIds. */
function act(
	price: number,
	paidById: string,
	settled = false,
	splitWithIds?: string[]
): ActivityLike {
	return { price, paidById, settled, ...(splitWithIds ? { splitWithIds } : {}) };
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

describe('calcPayerBundle / listPayerIds', () => {
	test('sums every expense one person paid and splits the total equally', () => {
		const acts = [act(8000, 'p1'), act(2000, 'p1'), act(3600, 'p2')];
		const result = calcPayerBundle(acts, 'p1', ev);
		expect(result.total).toBe(10000);
		expect(result.n).toBe(4);
		expect(result.share).toBe(2500);
		expect(result.activities).toHaveLength(2);
		expect(result.payer).toEqual(pax[0]);
		expect(result.others.map((p) => p.id)).toEqual(['p2', 'p3', 'p4']);
		expect(result.settled).toBe(false);
	});

	test('settled only when every expense they paid is settled', () => {
		expect(calcPayerBundle([act(1, 'p1', true), act(1, 'p1', false)], 'p1', ev).settled).toBe(
			false
		);
		expect(calcPayerBundle([act(1, 'p1', true), act(2, 'p1', true)], 'p1', ev).settled).toBe(true);
	});

	test('totals unsettled expenses only and still lists settled ones', () => {
		const acts = [act(8000, 'p1', true), act(2000, 'p1', false), act(3600, 'p2')];
		const result = calcPayerBundle(acts, 'p1', ev);
		expect(result.activities).toHaveLength(2);
		expect(result.total).toBe(2000);
		expect(result.share).toBe(500);
		expect(result.settled).toBe(false);
	});

	test('listPayerIds keeps first-seen order', () => {
		expect(listPayerIds([act(1, 'p2'), act(1, 'p1'), act(1, 'p2'), act(1, 'p4')])).toEqual([
			'p2',
			'p1',
			'p4'
		]);
	});
});

describe('participantNameTaken', () => {
	test('matches the same name ignoring case and extra spaces', () => {
		expect(participantNameTaken(pax, 'mika')).toBe(true);
		expect(participantNameTaken(pax, '  Mika  ')).toBe(true);
		expect(participantNameTaken(pax, 'Mika G')).toBe(false);
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

describe('custom split groups', () => {
	test('tally only charges people on each expense split', () => {
		const result = tally([act(100, 'p1', false, ['p1', 'p2'])], pax);
		expect(result.total).toBe(100);
		expect(result.share).toBe(25);
		expect(result.rows).toEqual([
			{ id: 'p1', name: 'Mika', paid: 100, share: 50, balance: 50 },
			{ id: 'p2', name: 'Jomar', paid: 0, share: 50, balance: -50 },
			{ id: 'p3', name: 'Andrea', paid: 0, share: 0, balance: 0 },
			{ id: 'p4', name: 'Paolo', paid: 0, share: 0, balance: 0 }
		]);
	});

	test('calcActivity names only the chosen friends as owing', () => {
		const result = calcActivity(act(90, 'p1', false, ['p1', 'p2', 'p3']), ev);
		expect(result.n).toBe(3);
		expect(result.share).toBe(30);
		expect(result.splitEveryone).toBe(false);
		expect(result.others.map((p) => p.id)).toEqual(['p2', 'p3']);
		expect(result.collectTotal).toBe(60);
		expect(splitBetweenLabel(result)).toBe('Mika, Jomar, Andrea');
	});

	test('missing splitWithIds still means everyone', () => {
		const result = calcActivity(act(8000, 'p1'), ev);
		expect(result.splitEveryone).toBe(true);
		expect(result.n).toBe(4);
		expect(splitBetweenLabel(result)).toBe('Everyone · 4 people');
	});

	test('stored ids that left the event drop, and the payer stays on the split', () => {
		const result = calcActivity(act(80, 'p1', false, ['ghost']), ev);
		expect(result.splitEveryone).toBe(false);
		expect(result.n).toBe(1);
		expect(result.splitters.map((p) => p.id)).toEqual(['p1']);
	});

	test('unknown payer and unknown split ids fall back to everyone', () => {
		const result = calcActivity(act(80, 'ghost', false, ['nope']), ev);
		expect(result.splitEveryone).toBe(true);
		expect(result.n).toBe(4);
	});

	test('calcPayerBundle keeps a uniform custom split across expenses', () => {
		const acts = [
			act(100, 'p1', false, ['p1', 'p2']),
			act(50, 'p1', false, ['p1', 'p2'])
		];
		const result = calcPayerBundle(acts, 'p1', ev);
		expect(result.splitMixed).toBeFalsy();
		expect(result.n).toBe(2);
		expect(result.share).toBe(75);
		expect(result.collectTotal).toBe(75);
		expect(result.others.map((p) => p.id)).toEqual(['p2']);
		expect(splitBetweenLabel(result)).toBe('Mika, Jomar');
	});

	test('calcPayerBundle marks mixed splits and sums collect totals', () => {
		const acts = [
			act(100, 'p1', false, ['p1', 'p2']),
			act(80, 'p1')
		];
		const result = calcPayerBundle(acts, 'p1', ev);
		expect(result.splitMixed).toBe(true);
		expect(result.collectTotal).toBe(50 + 60);
		expect(splitBetweenLabel(result)).toBe('Varies by expense');
	});
});

describe('listPayerSplitBundles', () => {
	test('puts everyone-split expenses on one receipt, ahead of friend groups', () => {
		const acts = [
			act(100, 'p1', false, ['p1', 'p2']),
			act(80, 'p1'),
			act(40, 'p1')
		];
		const groups = listPayerSplitBundles(acts, 'p1', ev);
		expect(groups).toHaveLength(2);
		expect(groups[0].bundle.splitEveryone).toBe(true);
		expect(groups[0].bundle.activities).toHaveLength(2);
		expect(groups[0].bundle.total).toBe(120);
		expect(splitBetweenLabel(groups[0].bundle)).toBe('Everyone · 4 people');
		expect(groups[1].bundle.splitEveryone).toBe(false);
		expect(groups[1].bundle.activities).toHaveLength(1);
		expect(splitBetweenLabel(groups[1].bundle)).toBe('Mika, Jomar');
	});

	test('gives each unique friend-split set its own receipt', () => {
		const acts = [
			act(90, 'p1', false, ['p1', 'p2']),
			act(60, 'p1', false, ['p1', 'p3']),
			act(30, 'p1', false, ['p1', 'p2'])
		];
		const groups = listPayerSplitBundles(acts, 'p1', ev);
		expect(groups).toHaveLength(2);
		expect(groups[0].bundle.total).toBe(120);
		expect(splitBetweenLabel(groups[0].bundle)).toBe('Mika, Jomar');
		expect(groups[1].bundle.total).toBe(60);
		expect(splitBetweenLabel(groups[1].bundle)).toBe('Mika, Andrea');
	});

	test('returns one receipt when every expense uses the same split', () => {
		const acts = [act(50, 'p1'), act(25, 'p1')];
		const groups = listPayerSplitBundles(acts, 'p1', ev);
		expect(groups).toHaveLength(1);
		expect(groups[0].bundle.splitEveryone).toBe(true);
		expect(groups[0].bundle.total).toBe(75);
	});
});

describe('normalizeSplitWithIds', () => {
	test('omits the field when everyone is selected', () => {
		expect(normalizeSplitWithIds(['p1', 'p2', 'p3', 'p4'], pax, 'p1')).toBeUndefined();
		expect(normalizeSplitWithIds(undefined, pax, 'p1')).toBeUndefined();
		expect(normalizeSplitWithIds([], pax, 'p1')).toBeUndefined();
	});

	test('keeps a subset and always includes the payer', () => {
		expect(normalizeSplitWithIds(['p2'], pax, 'p1')).toEqual(['p1', 'p2']);
	});
});

describe('balanceVariant', () => {
	test('treats |balance| ≤ 0.5 as settled (zero)', () => {
		expect(balanceVariant(0)).toBe('zero');
		expect(balanceVariant(0.5)).toBe('zero');
		expect(balanceVariant(-0.5)).toBe('zero');
	});

	test('positive above 0.5 is owed', () => {
		expect(balanceVariant(0.51)).toBe('pos');
		expect(balanceVariant(1200)).toBe('pos');
	});

	test('negative below -0.5 owes', () => {
		expect(balanceVariant(-0.51)).toBe('neg');
		expect(balanceVariant(-800)).toBe('neg');
	});
});
