/** Generate a short unique string id (mockup-compatible). */
export function uid(): string {
	return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}
