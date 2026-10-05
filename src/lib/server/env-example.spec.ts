import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('documents every staff Access input without committing its value', () => {
	const example = readFileSync('.env.example', 'utf8');
	for (const key of ['STAFF_HOST', 'STAFF_EMAILS', 'ACCESS_TEAM_DOMAIN', 'ACCESS_AUD']) {
		expect(example).toMatch(new RegExp(`^${key}=$`, 'm'));
	}
});

it('documents payment inputs blank, sandbox-only, and never with a value', () => {
	const example = readFileSync('.env.example', 'utf8');
	for (const key of [
		'OWNER_EMAIL',
		'PAYMENT_PROVIDER',
		'BKASH_BASE_URL',
		'BKASH_USERNAME',
		'BKASH_PASSWORD',
		'BKASH_APP_KEY',
		'BKASH_APP_SECRET'
	]) {
		expect(example).toMatch(new RegExp(`^${key}=$`, 'm'));
	}
	expect(example).toContain('https://tokenized.sandbox.bka.sh');
	expect(example.match(/^[A-Z_]+=.+$/gm)).toBeNull();
});
