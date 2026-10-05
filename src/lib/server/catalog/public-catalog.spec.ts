import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { getPublicProduct, listPublicProducts } from './public-catalog';

it('hides drafts but keeps sold published products readable without private fields', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: false });
	db.exec(`
		INSERT INTO products (id, slug, name, category, price_bdt, publication_state)
		VALUES ('draft-1', 'draft', 'Private draft', 'tops', 900, 'draft'),
		       ('sold-1', 'sold', 'Published sold piece', 'dresses', 1400, 'published');
		INSERT INTO inventory (product_id, state)
		VALUES ('draft-1', 'available'), ('sold-1', 'sold');
	`);

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

it('lists only published stock with first-photo metadata and durable sold state', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
	const items = await listPublicProducts(d1);
	expect(items).toHaveLength(3);
	expect(items.map((item) => item.slug).sort()).toEqual([
		'test-cream-midi-dress',
		'test-olive-cotton-shirt',
		'test-sold-denim-jacket'
	]);
	expect(items.find((item) => item.slug === 'test-sold-denim-jacket')).toMatchObject({
		stock_state: 'sold',
		photo_key: 'test-only/denim-jacket.webp',
		photo_alt: 'Generated test-only denim jacket visual'
	});
	expect(items.every((item) => !('measurements_json' in item))).toBe(true);
	db.close();
});
