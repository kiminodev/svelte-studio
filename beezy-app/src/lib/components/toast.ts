/** Default toast visibility duration (ms), matching beezy-mockup.html. */
export const TOAST_DURATION_MS = 1900;

let hideTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Shows a transient toast message. Clears any pending hide from a previous call.
 * Pair with `<Toast message={...} open={...} />` in the app shell.
 */
export function scheduleToastHide(
	setOpen: (open: boolean) => void,
	duration = TOAST_DURATION_MS
): void {
	clearTimeout(hideTimer);
	hideTimer = setTimeout(() => setOpen(false), duration);
}
