import { describe, expect, test } from 'bun:test';
import { isThemeId, themeAccent, THEME_IDS } from '$lib/beezy/theme';

describe('theme', () => {
	test('accepts the four palettes and rejects anything else', () => {
		expect(THEME_IDS).toEqual(['pink', 'yellow', 'blue', 'purple']);
		expect(isThemeId('pink')).toBe(true);
		expect(isThemeId('yellow')).toBe(true);
		expect(isThemeId('blue')).toBe(true);
		expect(isThemeId('purple')).toBe(true);
		expect(isThemeId('red')).toBe(false);
		expect(isThemeId('')).toBe(false);
		expect(isThemeId(null)).toBe(false);
	});

	test('maps each palette to its accent swatch', () => {
		expect(themeAccent('yellow')).toBe('#ffd21e');
		expect(themeAccent('pink')).toBe('#f4b8cc');
		expect(themeAccent('blue')).toBe('#b5d4ea');
		expect(themeAccent('purple')).toBe('#d2c4ea');
	});
});
