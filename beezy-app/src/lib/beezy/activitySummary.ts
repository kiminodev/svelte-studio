import { bundleReceiptDateLabel, fmtDateTime, peso, sortNewestFirst } from '$lib/beezy/format';
import {
	calcActivity,
	calcPayerBundle,
	type ActivityLike,
	type SettlementEvent
} from '$lib/beezy/settlement';

/** Activity fields required to render a plain-text receipt summary. */
export interface ActivitySummaryInput extends ActivityLike {
	name: string;
	createdAt: string;
}

/** Event fields required for the summary header and split math. */
export interface ActivitySummaryEvent extends SettlementEvent {
	title: string;
}

/**
 * Plain-text receipt for copy-to-clipboard (no DOM or clipboard APIs).
 * Layout matches mockup `copyActivitySummary()`; branding uses Beezy.
 */
export function formatActivitySummary(
	activity: ActivitySummaryInput,
	event: ActivitySummaryEvent,
	_activities?: ActivityLike[]
): string {
	const ac = calcActivity(activity, event);
	const payerName = ac.payer ? ac.payer.name : '—';
	const lines: string[] = [];

	lines.push('Beezy — ' + event.title);
	lines.push(activity.name);
	lines.push(fmtDateTime(activity.createdAt));
	lines.push('----------------------------------');
	lines.push('Paid by:      ' + payerName);
	if (ac.payer?.gcash) lines.push('Send to:      ' + ac.payer.gcash);
	lines.push('Total:        ' + peso(ac.total));
	lines.push('Split between ' + ac.n + (ac.n === 1 ? ' person' : ' people'));
	lines.push('Each pays:    ' + (ac.n ? peso(ac.share) : '—'));

	if (ac.others.length) {
		lines.push('----------------------------------');
		lines.push(payerName + ' collects:');
		for (const p of ac.others) {
			lines.push('  ' + p.name.padEnd(10) + ' ' + peso(ac.share));
		}
		lines.push('  ' + 'TOTAL'.padEnd(10) + ' ' + peso(ac.others.length * ac.share));
	}

	lines.push('----------------------------------');
	lines.push(activity.settled ? '✔ Settled' : 'Tap Settle in Beezy when paid');
	lines.push('Made with Beezy · saved on this phone');

	return lines.join('\n');
}

/**
 * Copy plain text to the clipboard.
 *
 * Tries `document.execCommand('copy')` first so it runs in the same turn as a
 * user gesture (older browsers). If that fails, uses `navigator.clipboard.writeText`.
 *
 * @returns whether the write succeeded
 */
export async function copyText(text: string): Promise<boolean> {
	if (fallbackCopy(text)) return true;

	if (typeof window !== 'undefined') {
		window.focus();
	}

	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			return false;
		}
	}
	return false;
}

/**
 * Format an activity receipt and copy it (mockup `copyActivitySummary()`).
 *
 * @returns whether the clipboard write succeeded
 */
export async function copyActivitySummary(
	activity: ActivitySummaryInput,
	event: ActivitySummaryEvent
): Promise<boolean> {
	return copyText(formatActivitySummary(activity, event));
}

/** Named expense fields required to list a Who-paid receipt. */
export interface PayerSummaryActivity extends ActivitySummaryInput {
	id?: string;
	updatedAt?: string;
}

/**
 * Plain-text combined receipt: every expense one person covered, split equally.
 */
export function formatPayerSummary(
	activities: PayerSummaryActivity[],
	paidById: string,
	event: ActivitySummaryEvent
): string {
	const bundle = calcPayerBundle(activities, paidById, event);
	const payerName = bundle.payer?.name ?? '—';
	const openCount = bundle.activities.filter((a) => !a.settled).length;
	const n = bundle.activities.length;
	const countLabel = bundle.settled
		? `${n === 1 ? '1 expense' : `${n} expenses`} · all settled`
		: openCount < n
			? `${openCount} of ${n} still open`
			: n === 1
				? '1 expense'
				: `${n} expenses`;
	const items = sortNewestFirst(bundle.activities);
	const lines: string[] = [];

	lines.push('Beezy — ' + event.title);
	lines.push(payerName + "'s expenses");
	const dateLabel = bundleReceiptDateLabel(items);
	if (dateLabel) lines.push(dateLabel);
	lines.push(countLabel);
	lines.push('----------------------------------');
	lines.push('Paid by:      ' + payerName);
	if (bundle.payer?.gcash) lines.push('Send to:      ' + bundle.payer.gcash);
	lines.push('Split between ' + bundle.n + (bundle.n === 1 ? ' person' : ' people'));
	for (const item of items) {
		const mark = item.settled ? '  settled' : '';
		lines.push('  ' + item.name.padEnd(14) + ' ' + peso(item.price) + mark);
	}
	lines.push((openCount < n ? 'Still open:   ' : 'Total:        ') + peso(bundle.total));
	lines.push('Each pays:    ' + (bundle.n ? peso(bundle.share) : '—'));

	if (bundle.others.length) {
		lines.push('----------------------------------');
		lines.push(payerName + ' collects:');
		for (const p of bundle.others) {
			lines.push('  ' + p.name.padEnd(10) + ' ' + peso(bundle.share));
		}
		lines.push('  ' + 'TOTAL'.padEnd(10) + ' ' + peso(bundle.others.length * bundle.share));
	}

	lines.push('----------------------------------');
	lines.push(bundle.settled ? '✔ Settled' : 'Tap Settle in Beezy when paid');
	lines.push('Made with Beezy · saved on this phone');

	return lines.join('\n');
}

/** Format a Who-paid receipt and copy it. */
export async function copyPayerSummary(
	activities: PayerSummaryActivity[],
	paidById: string,
	event: ActivitySummaryEvent
): Promise<boolean> {
	return copyText(formatPayerSummary(activities, paidById, event));
}

function fallbackCopy(text: string): boolean {
	if (typeof document === 'undefined') return false;

	const ta = document.createElement('textarea');
	ta.value = text;
	ta.setAttribute('readonly', '');
	ta.style.position = 'fixed';
	ta.style.top = '0';
	ta.style.left = '0';
	ta.style.width = '1px';
	ta.style.height = '1px';
	ta.style.opacity = '0';
	document.body.appendChild(ta);
	ta.focus();
	ta.select();
	ta.setSelectionRange(0, text.length);

	try {
		return document.execCommand('copy');
	} catch {
		return false;
	} finally {
		document.body.removeChild(ta);
	}
}
