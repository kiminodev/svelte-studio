import { describe, expect, test } from 'bun:test';
import { normalizeGcashInput, parseGcash } from '$lib/beezy/gcash';

describe('normalizeGcashInput', () => {
	test('keeps digits and drops spaces, dashes, and letters', () => {
		expect(normalizeGcashInput('0917-123-4567')).toBe('09171234567');
		expect(normalizeGcashInput('0917 123 4567 extra')).toBe('09171234567');
	});

	test('caps at 11 digits', () => {
		expect(normalizeGcashInput('0917123456789')).toBe('09171234567');
	});
});

describe('parseGcash', () => {
	test('blank is optional', () => {
		expect(parseGcash('')).toEqual({ ok: true, value: undefined });
		expect(parseGcash('   ')).toEqual({ ok: true, value: undefined });
	});

	test('accepts exactly 11 digits', () => {
		expect(parseGcash('09171234567')).toEqual({ ok: true, value: '09171234567' });
		expect(parseGcash('0917-123-4567')).toEqual({ ok: true, value: '09171234567' });
	});

	test('rejects partial or over-long numbers', () => {
		expect(parseGcash('0917123456')).toEqual({ ok: false });
		expect(parseGcash('091712345678')).toEqual({ ok: false });
		expect(parseGcash('abc')).toEqual({ ok: false });
	});
});
