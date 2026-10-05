import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { repriceCart } from './pricing';

it('uses current D1 prices and withholds a checkout subtotal when a line is sold', async () => {
	const db = new DatabaseSync(':memory:');
	for (const file of readdirSync('db/migrations').sort()) {
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	}
	db.exec(`
		INSERT INTO products (id, slug, name, category, price_bdt, publication_state)
		VALUES ('product-1', 'available', 'Available test-only top', 'tops', 1500, 'published'),
		       ('product-2', 'sold', 'Sold test-only top', 'tops', 900, 'published');
		INSERT INTO inventory (product_id, state)
		VALUES ('product-1', 'available'), ('product-2', 'sold');
	`);
	const d1 = {
		prepare: (sql: string) => ({
			bind: (id: string) => ({ first: async () => db.prepare(sql).get(id) ?? null })
		})
	};

	expect(await repriceCart(['product-1'], d1)).toEqual({
		items: [
			{ id: 'product-1', slug: 'available', name: 'Available test-only top', price_bdt: 1500 }
		],
		unavailable: [],
		subtotal_bdt: 1500
	});
	expect(await repriceCart(['product-1', 'product-2'], d1)).toEqual({
		items: [
			{ id: 'product-1', slug: 'available', name: 'Available test-only top', price_bdt: 1500 }
		],
		unavailable: ['product-2'],
		subtotal_bdt: null
	});
	db.close();
});
