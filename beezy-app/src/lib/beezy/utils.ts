/** Two-letter initials from a display name (e.g. "Mika Santos" → "MS"). */
export function initials(name: string): string {
	const parts = String(name || '?').trim().split(/\s+/);
	const first = parts[0]?.[0] ?? '?';
	const second = parts[1]?.[0] ?? '';
	return (first + second).toUpperCase();
}

/** Stable avatar palette index (0–5) from a name string. */
export function avatarIndex(name: string): number {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
	}
	return hash % 6;
}
