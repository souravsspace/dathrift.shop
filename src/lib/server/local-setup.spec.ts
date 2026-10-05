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
		expect(command).toContain(`--file db/seed/assets/${file}.webp`);
	}
	expect(command).not.toContain('static/test-only');
	expect(command).not.toMatch(/--remote|wrangler deploy/);
});

it('seeds browser journey tests into a throwaway local state only', () => {
	const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
	const command: string = packageJson.scripts['db:e2e:setup'];
	expect(command.startsWith('rm -rf .wrangler/e2e && ')).toBe(true);
	expect(command.match(/--persist-to \.wrangler\/e2e/g)).toHaveLength(5);
	expect(command).toContain('--file db/seed/local.sql');
	expect(command).not.toMatch(/--remote|wrangler deploy|rm -rf \.wrangler(?!\/e2e)/);
	const playwright = readFileSync('playwright.config.ts', 'utf8');
	expect(playwright).toContain('DATHRIFT_STATE_DIR=.wrangler/e2e');
});
