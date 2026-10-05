import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { repriceCart } from './pricing';

it('uses current D1 prices and withholds a checkout subtotal when a line is sold', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: false });
	db.exec(`
		INSERT INTO products (id, slug, name, category, price_bdt, publication_state)
		VALUES ('product-1', 'available', 'Available test-only top', 'tops', 1500, 'published'),
		       ('product-2', 'sold', 'Sold test-only top', 'tops', 900, 'published');
		INSERT INTO inventory (product_id, state)
		VALUES ('product-1', 'available'), ('product-2', 'sold');
	`);

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
