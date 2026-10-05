import { localDatabase } from '../testing/local-d1';
import { expect, it } from 'vitest';
import { quoteCheckout } from './quote';

it('rechecks two one-off pieces and charges delivery once using server prices', async () => {
	const { db: d1, sqlite: db } = localDatabase({ seed: true });
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
