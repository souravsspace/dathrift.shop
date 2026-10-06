import { expect, it } from 'vitest';
import { reserveCheckout } from '../reservation/reserve';
import { localDatabase } from '../testing/local-d1';
import {
	confirmManualPayment,
	expireManualHolds,
	manualBkashFrom,
	manualPaymentFor,
	rejectManualPayment,
	startManualPayment,
	submitManualPayment
} from './manual';

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'Test building',
	district: 'test-dhaka',
	area: 'test-central'
};

async function heldOrder() {
	const local = localDatabase();
	const order = await reserveCheckout(local.db, ['test-shirt', 'test-dress'], address, true);
	await startManualPayment(local.db, order.id, '01849584594');
	return { ...local, order };
}

const stock = (sqlite: ReturnType<typeof localDatabase>['sqlite']) =>
	sqlite
		.prepare(
			"SELECT product_id, state FROM inventory WHERE product_id IN ('test-shirt', 'test-dress') ORDER BY product_id"
		)
		.all();

it('turns manual bKash on only with a valid personal mobile number', () => {
	expect(
		manualBkashFrom({ BKASH_MANUAL_PAYMENT: 'on', BKASH_MANUAL_NUMBER: '+880 1849-584594' })
	).toEqual({ payTo: '01849584594' });
	expect(manualBkashFrom({ BKASH_MANUAL_PAYMENT: 'off', BKASH_MANUAL_NUMBER: '01849584594' })).toBe(
		null
	);
	expect(manualBkashFrom({ BKASH_MANUAL_NUMBER: '01849584594' })).toBeNull();
	expect(manualBkashFrom({ BKASH_MANUAL_PAYMENT: 'on', BKASH_MANUAL_NUMBER: '0255667788' })).toBe(
		null
	);
});

it('holds the pieces for 30 minutes while the buyer sends money', async () => {
	const { db, sqlite, order } = await heldOrder();
	const row = sqlite
		.prepare(
			'SELECT (julianday(expires_at) - julianday(created_at)) * 1440 AS minutes FROM orders WHERE id = ?'
		)
		.get(order.id) as { minutes: number };
	expect(Math.round(row.minutes)).toBe(30);
	await startManualPayment(db, order.id, '01849584594');
	expect(await manualPaymentFor(db, order.id)).toMatchObject({
		pay_to: '01849584594',
		plan: null,
		submitted_at: null
	});
	expect(stock(sqlite)).toEqual([
		{ product_id: 'test-dress', state: 'reserved' },
		{ product_id: 'test-shirt', state: 'reserved' }
	]);
});

it('records the proof, keeps the pieces held and asks staff to check it', async () => {
	const { db, sqlite, order } = await heldOrder();
	expect(
		await submitManualPayment(db, order.status_token, {
			plan: 'delivery',
			trx_id: '8N7A6D5C4B',
			sender_number: null
		})
	).toBe('payment_review');
	expect(await manualPaymentFor(db, order.id)).toMatchObject({
		plan: 'delivery',
		amount_bdt: 80,
		trx_id: '8N7A6D5C4B',
		sender_number: null
	});
	expect(stock(sqlite)).toEqual([
		{ product_id: 'test-dress', state: 'reserved' },
		{ product_id: 'test-shirt', state: 'reserved' }
	]);
	await expect(
		submitManualPayment(db, order.status_token, {
			plan: 'full',
			trx_id: null,
			sender_number: '01812345678'
		})
	).rejects.toThrow('Order not waiting for payment');
});

it('refuses a transaction ID another order already used', async () => {
	const { db: fresh } = localDatabase();
	const first = await reserveCheckout(fresh, ['test-shirt'], address, true);
	const second = await reserveCheckout(fresh, ['test-dress'], address, true);
	await startManualPayment(fresh, first.id, '01849584594');
	await startManualPayment(fresh, second.id, '01849584594');
	await submitManualPayment(fresh, first.status_token, {
		plan: 'full',
		trx_id: 'BFT7K2LM9P',
		sender_number: null
	});
	await expect(
		submitManualPayment(fresh, second.status_token, {
			plan: 'full',
			trx_id: 'BFT7K2LM9P',
			sender_number: null
		})
	).rejects.toThrow('Transaction ID already used');
});

it('lets staff confirm a payment: the order is paid and the pieces are sold', async () => {
	const { db, sqlite, order } = await heldOrder();
	await expect(confirmManualPayment(db, order.id, 'owner@example.com')).rejects.toThrow(
		'Nothing to confirm'
	);
	await submitManualPayment(db, order.status_token, {
		plan: 'full',
		trx_id: '8N7A6D5C4B',
		sender_number: null
	});
	await confirmManualPayment(db, order.id, 'mod@example.com');
	expect(sqlite.prepare('SELECT status FROM orders WHERE id = ?').get(order.id)).toEqual({
		status: 'paid'
	});
	expect(stock(sqlite)).toEqual([
		{ product_id: 'test-dress', state: 'sold' },
		{ product_id: 'test-shirt', state: 'sold' }
	]);
	expect(await manualPaymentFor(db, order.id)).toMatchObject({ reviewed_by: 'mod@example.com' });
	expect(
		sqlite
			.prepare(
				"SELECT actor FROM order_events WHERE order_id = ? AND action = 'manual_payment_confirmed'"
			)
			.get(order.id)
	).toEqual({ actor: 'mod@example.com' });
});

it('lets staff reject a payment they cannot find: the order closes and the pieces return', async () => {
	const { db, sqlite, order } = await heldOrder();
	await submitManualPayment(db, order.status_token, {
		plan: 'full',
		trx_id: null,
		sender_number: '01812345678'
	});
	await rejectManualPayment(db, order.id, 'owner@example.com');
	expect(sqlite.prepare('SELECT status FROM orders WHERE id = ?').get(order.id)).toEqual({
		status: 'cancelled'
	});
	expect(stock(sqlite)).toEqual([
		{ product_id: 'test-dress', state: 'available' },
		{ product_id: 'test-shirt', state: 'available' }
	]);
});

it('releases a hold nobody paid for once its 30 minutes are up', async () => {
	const { db, sqlite, order } = await heldOrder();
	sqlite.exec(
		`UPDATE orders SET expires_at = datetime('now', '-1 minute') WHERE id = '${order.id}'`
	);
	await expect(
		submitManualPayment(db, order.status_token, {
			plan: 'full',
			trx_id: '8N7A6D5C4B',
			sender_number: null
		})
	).rejects.toThrow('Hold expired');
	expect(sqlite.prepare('SELECT status FROM orders WHERE id = ?').get(order.id)).toEqual({
		status: 'expired'
	});
	const again = await heldOrder();
	again.sqlite.exec(
		`UPDATE orders SET expires_at = datetime('now', '-1 minute') WHERE id = '${again.order.id}'`
	);
	expect(await expireManualHolds(again.db)).toBe(1);
	expect(stock(again.sqlite)).toEqual([
		{ product_id: 'test-dress', state: 'available' },
		{ product_id: 'test-shirt', state: 'available' }
	]);
});
