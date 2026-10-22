/** GCash mobile numbers in the PH are exactly 11 digits. */
export const GCASH_LENGTH = 11;

/** Strip everything that is not a digit. */
export function digitsOnly(value: string): string {
	return value.replace(/\D/g, '');
}

/** Digits only, capped at 11 — used while typing so special characters never stick. */
export function normalizeGcashInput(value: string): string {
	return digitsOnly(value).slice(0, GCASH_LENGTH);
}

export type GcashParse =
	| { ok: true; value?: string }
	| { ok: false };

/**
 * Optional GCash field: blank is fine; anything typed must be exactly 11 digits.
 */
export function parseGcash(value: string): GcashParse {
	const trimmed = value.trim();
	if (!trimmed) return { ok: true, value: undefined };
	const digits = digitsOnly(trimmed);
	if (digits.length === GCASH_LENGTH) return { ok: true, value: digits };
	return { ok: false };
}

/** Receipt label for a payer's GCash number, e.g. "Nico's gcash". */
export function gcashReceiptLabel(name: string): string {
	return `${name}'s gcash`;
}
