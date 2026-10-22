/** Whole-peso formatter shared by {@link peso} and {@link pesoSigned}. */
const pesoFmt = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });

/** Cap typed amounts so the field stays readable (₱9,999,999,999). */
export const AMOUNT_MAX_DIGITS = 10;

/**
 * Keep digits only, drop leading zeros (except a lone 0), and cap length.
 * Used while typing so commas and letters never stick.
 */
export function normalizeAmountDigits(value: string): string {
	const digits = value.replace(/\D/g, '').slice(0, AMOUNT_MAX_DIGITS);
	return digits.replace(/^0+(?=\d)/, '');
}

/**
 * Group a typed amount with thousands separators, e.g. "5000" → "5,000".
 * Empty input stays empty so the placeholder can show.
 */
export function formatAmountInput(value: string | number): string {
	const raw = typeof value === 'number' ? String(Math.round(Math.abs(value))) : value;
	const digits = normalizeAmountDigits(raw);
	if (!digits) return '';
	return pesoFmt.format(Number(digits));
}

/**
 * Parse a typed amount that may include grouping commas.
 * Empty or non-numeric input returns NaN.
 */
export function parseAmount(value: string | number): number {
	if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
	const digits = normalizeAmountDigits(value);
	if (!digits) return NaN;
	return Number(digits);
}

/**
 * Format a number as Philippine peso (absolute value, no sign).
 * Rounds to the nearest whole peso before formatting.
 *
 * @example peso(24000) // "₱24,000"
 * @example peso(-800)  // "₱800"
 */
export function peso(n: number): string {
	const rounded = Math.round(n);
	return '₱' + pesoFmt.format(Math.abs(rounded));
}

/**
 * Format a balance with an explicit sign prefix for display in balance columns.
 * Uses Unicode minus (−), not ASCII hyphen, to match the mockup.
 *
 * @example pesoSigned(1200)  // "+₱1,200"
 * @example pesoSigned(-800)  // "−₱800"
 * @example pesoSigned(0)     // "₱0"
 */
export function pesoSigned(n: number): string {
	const rounded = Math.round(n);
	const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
	return sign + '₱' + pesoFmt.format(Math.abs(rounded));
}

/**
 * Short date for lists and cards (month + day, no year).
 *
 * @example fmtDate('2026-06-05T20:00:00') // "Jun 5"
 */
export function fmtDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/**
 * Date and time for receipts and copy-to-clipboard summaries.
 * Date and time are separated by a middle dot (·).
 *
 * @example fmtDateTime('2026-06-07T08:30:00') // "Jun 7 · 8:30 AM" (locale-dependent)
 */
export function fmtDateTime(iso: string): string {
	const d = new Date(iso);
	return (
		d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
		' · ' +
		d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
	);
}

/**
 * Receipt header timestamp, matching the Each-expense receipt.
 * Appends ` · edited {datetime}` when the record changed after it was created.
 */
export function receiptDateLabel(createdAt: string, updatedAt?: string): string {
	if (updatedAt && updatedAt !== createdAt) {
		return `${fmtDateTime(createdAt)} · edited ${fmtDateTime(updatedAt)}`;
	}
	return fmtDateTime(createdAt);
}

type DatedItem = { createdAt: string; updatedAt?: string };

/** Newest `createdAt` first — Payment lists and activity feeds. */
export function sortNewestFirst<T extends { createdAt: string }>(items: readonly T[]): T[] {
	return items
		.slice()
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Who-paid receipt timestamp: first expense logged, plus the latest edit
 * across that person's expenses (same "created · edited" pattern).
 * Order of `items` does not matter.
 */
export function bundleReceiptDateLabel(items: readonly DatedItem[]): string {
	if (items.length === 0) return '';
	let createdAt = items[0].createdAt;
	let updatedAt: string | undefined;
	for (const item of items) {
		if (item.createdAt < createdAt) createdAt = item.createdAt;
		if (item.updatedAt && item.updatedAt !== item.createdAt) {
			if (!updatedAt || item.updatedAt > updatedAt) updatedAt = item.updatedAt;
		}
	}
	return receiptDateLabel(createdAt, updatedAt);
}
