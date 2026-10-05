import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { quoteCheckout } from './quote';

it('rechecks two one-off pieces and charges delivery once using server prices', async () => {
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
	expect(await quoteCheckout(['test-shirt', 'test-dress'], address, d1)).toMatchObject({
		subtotal_bdt: 2300,
		shipping_bdt: 80,
		total_bdt: 2380,
		preview_only: true
	});
	db.exec("UPDATE inventory SET state = 'sold' WHERE product_id = 'test-shirt'");
	await expect(quoteCheckout(['test-shirt', 'test-dress'], address, d1)).rejects.toThrow(
		'Cart unavailable'
	);
	db.close();
});
