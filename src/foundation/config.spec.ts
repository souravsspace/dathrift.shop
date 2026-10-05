import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps the foundation proof Worker private until Access protects its URL', () => {
	const config = JSON.parse(readFileSync('wrangler.foundation.jsonc', 'utf8'));

	expect(config.workers_dev).toBe(false);
	expect(config.preview_urls).toBe(false);
});
