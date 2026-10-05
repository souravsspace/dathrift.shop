import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { getPublicProduct } from './public-catalog';

it('hides drafts but keeps sold published products readable without private fields', async () => {
	const db = new DatabaseSync(':memory:');
	for (const file of readdirSync('db/migrations').sort()) {
		db.exec(readFileSync(`db/migrations/${file}`, 'utf8'));
	}
	db.exec(`
		INSERT INTO products (id, slug, name, category, price_bdt, publication_state)
		VALUES ('draft-1', 'draft', 'Private draft', 'tops', 900, 'draft'),
		       ('sold-1', 'sold', 'Published sold piece', 'dresses', 1400, 'published');
		INSERT INTO inventory (product_id, state)
		VALUES ('draft-1', 'available'), ('sold-1', 'sold');
	`);

	const d1 = {
		prepare: (sql: string) => ({
			bind: (slug: string) => ({ first: async () => db.prepare(sql).get(slug) ?? null })
		})
	};
	expect(await getPublicProduct(d1, 'draft')).toBeNull();
	expect(await getPublicProduct(d1, 'sold')).toEqual({
		id: 'sold-1',
		slug: 'sold',
		name: 'Published sold piece',
		category: 'dresses',
		price_bdt: 1400,
		stock_state: 'sold'
	});

	db.close();
});
