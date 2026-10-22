import { describe, expect, test } from 'bun:test';
import { bundleReceiptDateLabel, receiptDateLabel } from '$lib/beezy/format';

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
	test('uses the earliest created time and the latest edit', () => {
		const label = bundleReceiptDateLabel([
			{
				createdAt: '2026-10-22T04:05:00.000Z',
				updatedAt: '2026-10-22T04:05:00.000Z'
			},
			{
				createdAt: '2026-10-22T04:20:00.000Z',
				updatedAt: '2026-10-22T06:00:00.000Z'
			}
		]);
		expect(label).toContain('edited');
	});

	test('is empty when there are no expenses', () => {
		expect(bundleReceiptDateLabel([])).toBe('');
	});
});
