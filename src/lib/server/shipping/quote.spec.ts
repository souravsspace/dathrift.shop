import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { quoteShipping } from './quote';

it('uses the maintained area record, not a buyer-claimed cheap zone', async () => {
	const db = new DatabaseSync(':memory:');
	for (const file of readdirSync('db/migrations').sort())
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	db.exec(readFileSync('db/seed/local.sql', 'utf8'));
	const d1 = {
		prepare: (sql: string) => ({
			bind: (...args: string[]) => ({ first: async () => db.prepare(sql).get(...args) ?? null })
		})
	};
	const address = {
		name: 'Test Buyer',
		phone: '01712345678',
		line1: 'Test building',
		district: 'test-dhaka',
		area: 'test-central'
	};
	expect(await quoteShipping(d1, { ...address, claimed_zone: 'outside' })).toEqual({
		phone: '01712345678',
		fee_bdt: 80,
		preview_only: true
	});
	await expect(quoteShipping(d1, { ...address, district: 'unapproved' })).rejects.toThrow(
		'Unsupported area'
	);
	await expect(quoteShipping(d1, { ...address, phone: '123' })).rejects.toThrow('Invalid address');
	db.close();
});
