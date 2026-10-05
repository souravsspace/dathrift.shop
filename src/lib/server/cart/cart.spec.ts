import { expect, it } from 'vitest';
import { normalizeCartIds } from './cart';

it('keeps distinct product IDs only and never accepts client price or quantity', () => {
	expect(normalizeCartIds(['product-1', 'product-1', 'product-2'])).toEqual([
		'product-1',
		'product-2'
	]);
	expect(() => normalizeCartIds([{ id: 'product-1', quantity: 2, price_bdt: 1 }])).toThrow(
		'Invalid cart item'
	);
});
