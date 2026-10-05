import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('documents every staff Access input without committing its value', () => {
	const example = readFileSync('.env.example', 'utf8');
	for (const key of ['STAFF_HOST', 'STAFF_EMAILS', 'ACCESS_TEAM_DOMAIN', 'ACCESS_AUD']) {
		expect(example).toMatch(new RegExp(`^${key}=$`, 'm'));
	}
});
