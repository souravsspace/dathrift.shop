import { expect, it } from 'vitest';
import { localD1 } from '../testing/local-d1';
import { reserveCheckout } from '../reservation/reserve';
import { attachPayment, closeUnpaidOrder, holdForReview, settleVerifiedPayment } from './lifecycle';

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'Test building',
	district: 'test-dhaka',
	area: 'test-central'
};

const stock = (sqlite: ReturnType<typeof localD1>['sqlite'], id: string) =>
	sqlite.prepare('SELECT state, reserved_order_id FROM inventory WHERE product_id = ?').get(id);
const status = (sqlite: ReturnType<typeof localD1>['sqlite'], id: string) =>
	(sqlite.prepare('SELECT status FROM orders WHERE id = ?').get(id) as { status: string }).status;

it('sells every held unit once after verified payment and ignores repeated confirmation', async () => {
	const { db, sqlite } = localD1();
	const order = await reserveCheckout(db, ['test-shirt', 'test-dress'], address, true);
	expect(stock(sqlite, 'test-shirt')).toEqual({ state: 'reserved', reserved_order_id: order.id });
	await expect(attachPayment(db, order.id, 'mock', 'pay-wrong', 1)).rejects.toThrow();
	await attachPayment(db, order.id, 'mock', 'pay-1', order.total_bdt);
	expect(await settleVerifiedPayment(db, 'pay-1', 'trx-1')).toBe('paid');
	expect(status(sqlite, order.id)).toBe('paid');
	expect(stock(sqlite, 'test-dress')).toMatchObject({ state: 'sold' });
	expect(await settleVerifiedPayment(db, 'pay-1', 'trx-1')).toBe('paid');
	expect(
		sqlite.prepare("SELECT count(*) AS n FROM payments WHERE status = 'completed'").get()
	).toEqual({
		n: 1
	});
	await expect(closeUnpaidOrder(db, order.id, 'cancelled')).resolves.toBe(false);
	expect(stock(sqlite, 'test-shirt')).toMatchObject({ state: 'sold' });
	sqlite.close();
});

it('releases only its own holds, and sends a late success to review without selling twice', async () => {
	const { db, sqlite } = localD1();
	const first = await reserveCheckout(db, ['test-shirt'], address, true);
	await attachPayment(db, first.id, 'mock', 'pay-late', first.total_bdt);
	expect(await closeUnpaidOrder(db, first.id, 'expired')).toBe(true);
	expect(stock(sqlite, 'test-shirt')).toEqual({ state: 'available', reserved_order_id: null });
	const second = await reserveCheckout(db, ['test-shirt'], address, true);
	expect(await settleVerifiedPayment(db, 'pay-late', 'trx-late')).toBe('payment_review');
	expect(status(sqlite, first.id)).toBe('payment_review');
	expect(stock(sqlite, 'test-shirt')).toEqual({ state: 'reserved', reserved_order_id: second.id });
	await closeUnpaidOrder(db, first.id, 'cancelled', 'owner@example.com');
	expect(stock(sqlite, 'test-shirt')).toEqual({ state: 'reserved', reserved_order_id: second.id });
	sqlite.close();
});

it('keeps ambiguous payments held until a verified result, and rejects invalid transitions', async () => {
	const { db, sqlite } = localD1();
	const order = await reserveCheckout(db, ['test-dress'], address, true);
	await attachPayment(db, order.id, 'mock', 'pay-unknown', order.total_bdt);
	expect(await holdForReview(db, order.id)).toBe(true);
	expect(await closeUnpaidOrder(db, order.id, 'expired')).toBe(false);
	expect(stock(sqlite, 'test-dress')).toMatchObject({ state: 'reserved' });
	expect(await settleVerifiedPayment(db, 'pay-unknown', 'trx-2')).toBe('paid');
	expect(() =>
		sqlite.exec(`UPDATE orders SET status = 'cancelled' WHERE id = '${order.id}'`)
	).toThrow('Invalid order transition');
	expect(
		sqlite.prepare('SELECT action FROM order_events WHERE order_id = ? ORDER BY id').all(order.id)
	).toEqual([{ action: 'payment_review' }, { action: 'paid' }]);
	sqlite.close();
});
