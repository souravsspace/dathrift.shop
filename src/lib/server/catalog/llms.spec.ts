import { expect, it } from 'vitest';
import { localDatabase } from '../testing/local-d1';
import { llmsTxt } from './llms';

it('briefs AI assistants on the shop, its rules and the pieces for sale', async () => {
	const { db, sqlite } = localDatabase();
	sqlite.exec(`INSERT INTO products (id, slug, name, category, brand, size_label, price_bdt,
		measurements_json, publication_state)
		VALUES ('real-1', 'linen-shirt', 'Linen shirt', 'tops', 'Uniqlo', 'M', 900,
		        '{"chest_in":40,"length_in":28.5}', 'published'),
		       ('real-2', 'wool-coat', 'Wool coat', 'outerwear', NULL, NULL, 2500, NULL, 'published');
		INSERT INTO inventory (product_id, state) VALUES ('real-1', 'available'), ('real-2', 'sold');`);
	const text = await llmsTxt(db, { manualBkash: true });
	expect(text.startsWith('# daThriftShop\n\n> Online thrift shop in Bangladesh')).toBe(true);
	expect(text).toContain('bKash Send Money');
	expect(text).toContain('৳75 to ৳135');
	expect(text).toContain('- [Tops](https://dathrift.shop/shop/tops)');
	expect(text).toContain(
		'- [Linen shirt](https://dathrift.shop/products/linen-shirt): Uniqlo tops, size M, chest 40 in, length 28.5 in, ৳900'
	);
	// Sold pieces and TEST ONLY fixtures are not offered for sale.
	expect(text).not.toContain('wool-coat');
	expect(text).not.toContain('test-');
	expect(await llmsTxt(db, { manualBkash: false })).not.toContain('Send Money');
});
