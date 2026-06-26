import type { TabId, ViewState } from '$lib/beezy/types';

/**
 * sessionStorage key for UI navigation state.
 * Not legacy `kkb.view.v1` — app data lives in IndexedDB (`beezy` database).
 */
export const VIEW_STORAGE_KEY = 'beezy.view.v1' as const;

const VALID_TABS: ReadonlySet<TabId> = new Set(['events', 'activities', 'payment']);

/** Default navigation state on first visit or when sessionStorage is unavailable. */
export function defaultViewState(): ViewState {
	return { tab: 'events', sub: null, sheet: null, menu: false };
}

/**
 * Restore view state from sessionStorage.
 *
 * **Storage choice:** `sessionStorage` (not `localStorage`) so the active tab,
 * sub-screen, sheet, and menu survive a page refresh within the same browser tab,
 * but reset when the tab is closed. Trip data remains in IndexedDB regardless.
 */
export function loadView(): ViewState {
	if (typeof sessionStorage === 'undefined') {
		return defaultViewState();
	}

	try {
		const raw = sessionStorage.getItem(VIEW_STORAGE_KEY);
		if (!raw) return defaultViewState();
		return normalizeViewState(JSON.parse(raw));
	} catch {
		return defaultViewState();
	}
}

/**
 * Persist view state to sessionStorage.
 * Silently no-ops when storage is unavailable (SSR, private browsing, quota).
 */
export function saveView(view: ViewState): void {
	if (typeof sessionStorage === 'undefined') return;

	try {
		sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view));
	} catch {
		// View remains in memory only for this page lifetime.
	}
}

/** Coerce parsed JSON into a valid {@link ViewState}, falling back field-by-field. */
function normalizeViewState(value: unknown): ViewState {
	const defaults = defaultViewState();
	if (!value || typeof value !== 'object') return defaults;

	const v = value as Partial<ViewState>;
	const tab = VALID_TABS.has(v.tab as TabId) ? (v.tab as TabId) : defaults.tab;

	return {
		tab,
		sub: v.sub ?? null,
		sheet: v.sheet ?? null,
		menu: Boolean(v.menu)
	};
}
