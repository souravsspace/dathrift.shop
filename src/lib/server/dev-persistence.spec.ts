import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('uses the same persisted local D1 state as db:local:setup', () => {
	const viteConfig = readFileSync('vite.config.ts', 'utf8');
	expect(viteConfig).toContain('platformProxy: { persist: true, remoteBindings: false }');
});
