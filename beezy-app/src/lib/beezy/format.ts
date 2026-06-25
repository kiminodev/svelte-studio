/** Whole-peso formatter shared by {@link peso} and {@link pesoSigned}. */
const pesoFmt = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });

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
