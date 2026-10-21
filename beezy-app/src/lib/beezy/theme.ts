/** localStorage key for the user's accent color. Survives tab close (unlike view state). */
export const THEME_STORAGE_KEY = 'beezy.theme.v1' as const;

export const THEME_IDS = ['pink', 'yellow', 'blue', 'purple'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeOption {
	id: ThemeId;
	label: string;
	/** Accent hex used by the picker swatch and `theme-color` meta. */
	swatch: string;
}

/** Menu order: pastel pink, current yellow, pastel blue, pastel purple. */
export const THEMES: readonly ThemeOption[] = [
	{ id: 'pink', label: 'Pastel pink', swatch: '#f4b8cc' },
	{ id: 'yellow', label: 'Yellow', swatch: '#ffd21e' },
	{ id: 'blue', label: 'Pastel blue', swatch: '#b5d4ea' },
	{ id: 'purple', label: 'Pastel purple', swatch: '#d2c4ea' }
];

export const DEFAULT_THEME: ThemeId = 'yellow';

const ACCENT_BY_ID: Record<ThemeId, string> = {
	pink: '#f4b8cc',
	yellow: '#ffd21e',
	blue: '#b5d4ea',
	purple: '#d2c4ea'
};

/** True when `value` is one of the four selectable palettes. */
export function isThemeId(value: unknown): value is ThemeId {
	return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

/** Accent hex for a palette — used to keep the browser chrome in sync. */
export function themeAccent(id: ThemeId): string {
	return ACCENT_BY_ID[id];
}

/** Restore the last chosen palette, or yellow on first visit / missing storage. */
export function loadTheme(): ThemeId {
	if (typeof localStorage === 'undefined') return DEFAULT_THEME;

	try {
		const raw = localStorage.getItem(THEME_STORAGE_KEY);
		return isThemeId(raw) ? raw : DEFAULT_THEME;
	} catch {
		return DEFAULT_THEME;
	}
}

/** Persist the palette. Silently no-ops when storage is unavailable. */
export function saveTheme(id: ThemeId): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(THEME_STORAGE_KEY, id);
	} catch {
		// Preference stays in memory for this page lifetime.
	}
}

/**
 * Apply a palette to the document (`data-theme` + theme-color meta).
 * Safe to call from the browser only; no-ops during SSR.
 */
export function applyTheme(id: ThemeId): void {
	if (typeof document === 'undefined') return;

	document.documentElement.dataset.theme = id;
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute('content', themeAccent(id));
}
