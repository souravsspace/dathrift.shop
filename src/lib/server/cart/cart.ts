export function normalizeCartIds(input: unknown): string[] {
	if (!Array.isArray(input)) throw new Error('Invalid cart');
	const ids = new Set<string>();
	for (const item of input) {
		if (typeof item !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(item)) {
			throw new Error('Invalid cart item');
		}
		ids.add(item);
	}
	return [...ids];
}
