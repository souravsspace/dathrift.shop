import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('uses the same persisted local D1 state as db:local:setup unless an isolated state is chosen', () => {
	const viteConfig = readFileSync('vite.config.ts', 'utf8');
	expect(viteConfig).toContain('remoteBindings: false');
	expect(viteConfig).toContain(
		'persist: process.env.DATHRIFT_STATE_DIR ? { path: `${process.env.DATHRIFT_STATE_DIR}/v3` } : true'
	);
});
