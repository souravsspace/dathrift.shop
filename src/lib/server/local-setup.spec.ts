import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('provides one explicitly local-only database setup command', () => {
	const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
	const command = packageJson.scripts['db:local:setup'];
	expect(command).toContain('d1 migrations apply DB --local -c wrangler.jsonc');
	expect(command).toContain('d1 execute DB --local -c wrangler.jsonc --file db/seed/local.sql');
	for (const file of ['olive-shirt', 'cream-dress', 'denim-jacket']) {
		expect(command).toContain(
			`r2 object put dathrift-local-products/test-only/${file}.webp --local`
		);
	}
	expect(command).not.toMatch(/--remote|wrangler deploy/);
});
