import { expect, it } from 'vitest';
import { addCartId, readCartIds, removeCartId } from './browser-cart';

function storage() {
	const values = new Map<string, string>();
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value)
	};
}

it('stores only distinct product IDs without a client price or quantity', () => {
	const local = storage();
	expect(addCartId(local, 'test-shirt')).toEqual(['test-shirt']);
	expect(addCartId(local, 'test-shirt')).toEqual(['test-shirt']);
	expect(addCartId(local, 'test-dress')).toEqual(['test-shirt', 'test-dress']);
	expect(readCartIds(local)).toEqual(['test-shirt', 'test-dress']);
	expect(local.getItem('dathrift-cart')).toBe('["test-shirt","test-dress"]');
	expect(() => addCartId(local, '../unsafe')).toThrow();
});

it('removes one product without changing the remaining order', () => {
	const local = storage();
	addCartId(local, 'test-shirt');
	addCartId(local, 'test-dress');
	expect(removeCartId(local, 'test-shirt')).toEqual(['test-dress']);
	expect(readCartIds(local)).toEqual(['test-dress']);
});

it('ignores malformed browser state rather than trusting it', () => {
	const local = storage();
	local.setItem('dathrift-cart', '[{"id":"test-shirt","price_bdt":1}]');
	expect(readCartIds(local)).toEqual([]);
});
