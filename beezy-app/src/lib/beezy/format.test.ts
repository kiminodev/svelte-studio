import { describe, expect, test } from 'bun:test';
import {
	bundleReceiptDateLabel,
	formatAmountInput,
	parseAmount,
	receiptDateLabel,
	sortNewestFirst
} from '$lib/beezy/format';

describe('receiptDateLabel', () => {
	test('is just the created datetime when never edited', () => {
		const created = '2026-10-22T04:05:00.000Z';
		expect(receiptDateLabel(created, created)).not.toContain('edited');
		expect(receiptDateLabel(created)).not.toContain('edited');
	});

	test('appends edited datetime when updatedAt differs', () => {
		const label = receiptDateLabel('2026-10-22T04:05:00.000Z', '2026-10-22T05:10:00.000Z');
		expect(label).toContain('edited');
	});
});

describe('bundleReceiptDateLabel', () => {
	test('uses the earliest created time and the latest edit, regardless of order', () => {
		const items = [
			{
				createdAt: '2026-10-22T04:20:00.000Z',
				updatedAt: '2026-10-22T06:00:00.000Z'
			},
			{
				createdAt: '2026-10-22T04:05:00.000Z',
				updatedAt: '2026-10-22T04:05:00.000Z'
			}
		];
		const newestFirst = bundleReceiptDateLabel(items);
		const oldestFirst = bundleReceiptDateLabel([...items].reverse());
		expect(newestFirst).toBe(oldestFirst);
		expect(newestFirst).toContain('edited');
	});

	test('is empty when there are no expenses', () => {
		expect(bundleReceiptDateLabel([])).toBe('');
	});
});

describe('formatAmountInput / parseAmount', () => {
	test('groups thousands with commas while typing', () => {
		expect(formatAmountInput('')).toBe('');
		expect(formatAmountInput('5')).toBe('5');
		expect(formatAmountInput('5000')).toBe('5,000');
		expect(formatAmountInput('50000')).toBe('50,000');
		expect(formatAmountInput('100000')).toBe('100,000');
		expect(formatAmountInput(1500)).toBe('1,500');
	});

	test('strips junk and leading zeros', () => {
		expect(formatAmountInput('5,000')).toBe('5,000');
		expect(formatAmountInput('05,000')).toBe('5,000');
		expect(formatAmountInput('abc')).toBe('');
	});

	test('parses grouped or raw amounts', () => {
		expect(parseAmount('5,000')).toBe(5000);
		expect(parseAmount(5000)).toBe(5000);
		expect(parseAmount('')).toBeNaN();
	});
});

describe('sortNewestFirst', () => {
	test('puts the latest createdAt first', () => {
		const sorted = sortNewestFirst([
			{ createdAt: '2026-10-22T04:05:00.000Z', name: 'Dinner' },
			{ createdAt: '2026-10-22T05:00:00.000Z', name: 'Taxi' }
		]);
		expect(sorted.map((item) => item.name)).toEqual(['Taxi', 'Dinner']);
	});
});
