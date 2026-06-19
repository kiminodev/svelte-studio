const pesoFmt = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });

/** Format a number as Philippine peso (e.g. 24000 → "₱24,000"). */
export function peso(n: number): string {
	const rounded = Math.round(n);
	return '₱' + pesoFmt.format(Math.abs(rounded));
}

/** Short date for lists (e.g. "Jun 5"). */
export function fmtDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** Date and time for receipts (e.g. "Jun 6 · 2:00 PM"). */
export function fmtDateTime(iso: string): string {
	const d = new Date(iso);
	return (
		d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
		' · ' +
		d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
	);
}

/** Signed peso for balance display (e.g. +₱1,200 or −₱800). */
export function pesoSigned(n: number): string {
	const rounded = Math.round(n);
	const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
	return sign + '₱' + pesoFmt.format(Math.abs(rounded));
}
