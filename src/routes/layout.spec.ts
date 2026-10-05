import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('does not render starter demo links in the storefront shell', () => {
	const layout = readFileSync('src/routes/+layout.svelte', 'utf8');
	expect(layout).not.toContain('DemoLinks');
});
