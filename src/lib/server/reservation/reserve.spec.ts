import { expect, it } from 'vitest';
import { localD1 } from '../testing/local-d1';
import { reserveCheckout } from './reserve';

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'Test building',
	district: 'test-dhaka',
	area: 'test-central'
};

it('reserves two distinct available pieces with immutable D1 prices and one delivery fee', async () => {
	const { db: d1, sqlite: db } = localD1();
	const order = await reserveCheckout(d1, ['test-shirt', 'test-dress'], address, true);
	expect(order).toMatchObject({
		subtotal_bdt: 2300,
		shipping_bdt: 80,
		total_bdt: 2380,
		status: 'pending_payment'
	});
	expect(
		db
			.prepare(
				'SELECT product_id, price_bdt FROM order_items WHERE order_id = ? ORDER BY product_id'
			)
			.all(order.id)
	).toEqual([
		{ product_id: 'test-dress', price_bdt: 1450 },
		{ product_id: 'test-shirt', price_bdt: 850 }
	]);
	expect(db.prepare("SELECT state FROM inventory WHERE product_id = 'test-shirt'").get()).toEqual({
		state: 'reserved'
	});
	await expect(reserveCheckout(d1, ['test-shirt'], address, true)).rejects.toThrow();
	expect(db.prepare('SELECT count(*) AS n FROM orders').get()).toEqual({ n: 1 });
	db.close();
});

it('rolls back all items and the order when any one-off unit is unavailable', async () => {
	const { db: d1, sqlite: db } = localD1();
	await expect(reserveCheckout(d1, ['test-dress', 'test-sold'], address, true)).rejects.toThrow();
	expect(db.prepare("SELECT state FROM inventory WHERE product_id = 'test-dress'").get()).toEqual({
		state: 'available'
	});
	expect(db.prepare('SELECT count(*) AS n FROM orders').get()).toEqual({ n: 0 });
	db.close();
});

it('returns the same held order when one checkout submission is retried', async () => {
	const { db: d1, sqlite: db } = localD1();
	const key = 'c0ffee00-0000-4000-8000-000000000001';
	const first = await reserveCheckout(d1, ['test-dress'], address, true, key);
	const retry = await reserveCheckout(d1, ['test-dress'], address, true, key);
	expect(retry).toEqual(first);
	expect(db.prepare('SELECT count(*) AS n FROM orders').get()).toEqual({ n: 1 });
	await expect(
		reserveCheckout(d1, ['test-dress'], address, true, 'c0ffee00-0000-4000-8000-000000000002')
	).rejects.toThrow();
	db.close();
});
