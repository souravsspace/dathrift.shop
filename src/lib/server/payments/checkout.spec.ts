import { expect, it, vi } from 'vitest';
import { localD1 } from '../testing/local-d1';
import { reserveCheckout } from '../reservation/reserve';
import { expireStaleOrders, startPayment, verifyPayment } from './checkout';
import { invoiceForOrder, type PaymentProvider, type ProviderPayment } from './provider';

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'Test building',
	district: 'test-dhaka',
	area: 'test-central'
};

function setup(ids = ['test-shirt', 'test-dress']) {
	const local = localD1();
	return { ...local, order: () => reserveCheckout(local.db, ids, address, true) };
}

function provider(result: Partial<ProviderPayment> | Error, created = 'pay-1') {
	const respond = async (paymentId: string) => {
		if (result instanceof Error) throw result;
		return {
			paymentId,
			trxId: 'trx-1',
			status: 'completed',
			amountBdt: 2380,
			currency: 'BDT',
			invoice: '',
			...result
		} as ProviderPayment;
	};
	return {
		name: 'mock',
		create: vi.fn(async () => ({ paymentId: created, redirectUrl: `https://wallet.test/${created}` })),
		execute: vi.fn(respond),
		query: vi.fn(respond)
	} satisfies PaymentProvider;
}

const state = (sqlite: ReturnType<typeof localD1>['sqlite'], sql: string) =>
	sqlite.prepare(sql).get();

it('creates one payment for the server total and releases holds when creation fails', async () => {
	const { db, sqlite, order } = setup();
	const held = await order();
	const wallet = provider({});
	const started = await startPayment(db, wallet, held, 'https://shop.test/checkout/callback');
	expect(started.redirectUrl).toBe('https://wallet.test/pay-1');
	expect(wallet.create).toHaveBeenCalledWith({
		amountBdt: 2380,
		invoice: invoiceForOrder(held.id),
		callbackUrl: 'https://shop.test/checkout/callback',
		payerReference: '01712345678'
	});
	expect(await startPayment(db, wallet, held, 'https://shop.test/checkout/callback')).toEqual(
		started
	);
	expect(wallet.create).toHaveBeenCalledTimes(1);

	const failed = setup(['test-shirt']);
	const failedOrder = await failed.order();
	const broken = provider({});
	broken.create.mockRejectedValueOnce(new Error('timeout'));
	await expect(startPayment(failed.db, broken, failedOrder, 'https://shop.test/cb')).rejects.toThrow(
		'Payment unavailable'
	);
	expect(state(failed.sqlite, "SELECT state FROM inventory WHERE product_id = 'test-shirt'")).toEqual(
		{ state: 'available' }
	);
	expect(state(failed.sqlite, 'SELECT status FROM orders')).toEqual({ status: 'cancelled' });
});

it('marks paid only from a matching provider result, never from the redirect hint', async () => {
	const { db, sqlite, order } = setup();
	const held = await order();
	const wallet = provider({ invoice: invoiceForOrder(held.id) });
	await startPayment(db, wallet, held, 'https://shop.test/cb');
	expect(await verifyPayment(db, wallet, 'pay-1', 'success')).toBe('paid');
	expect(await verifyPayment(db, wallet, 'pay-1', 'success')).toBe('paid');
	expect(wallet.execute).toHaveBeenCalledTimes(1);
	expect(state(sqlite, "SELECT state FROM inventory WHERE product_id = 'test-dress'")).toEqual({
		state: 'sold'
	});

	const declined = setup(['test-shirt']);
	const declinedOrder = await declined.order();
	const failing = provider({ status: 'failed', trxId: null, amountBdt: 930 });
	await startPayment(declined.db, failing, declinedOrder, 'https://shop.test/cb');
	expect(await verifyPayment(declined.db, failing, 'pay-1', 'success')).toBe('cancelled');
	expect(
		state(declined.sqlite, "SELECT state FROM inventory WHERE product_id = 'test-shirt'")
	).toEqual({ state: 'available' });
});

it('holds mismatched or unreachable payments for owner review', async () => {
	const mismatch = setup(['test-shirt']);
	const mismatchOrder = await mismatch.order();
	const wrongAmount = provider({ amountBdt: 1, invoice: invoiceForOrder(mismatchOrder.id) });
	await startPayment(mismatch.db, wrongAmount, mismatchOrder, 'https://shop.test/cb');
	expect(await verifyPayment(mismatch.db, wrongAmount, 'pay-1', 'success')).toBe('payment_review');
	expect(
		state(mismatch.sqlite, "SELECT state FROM inventory WHERE product_id = 'test-shirt'")
	).toEqual({ state: 'reserved' });

	const offline = setup(['test-dress']);
	const offlineOrder = await offline.order();
	const down = provider(new Error('network'));
	await startPayment(offline.db, down, offlineOrder, 'https://shop.test/cb');
	expect(await verifyPayment(offline.db, down, 'pay-1', 'success')).toBe('payment_review');
	expect(down.query).toHaveBeenCalled();
	expect(
		state(offline.sqlite, "SELECT state FROM inventory WHERE product_id = 'test-dress'")
	).toEqual({ state: 'reserved' });
});

it('expires abandoned holds only after the provider confirms no completed payment', async () => {
	const { db, sqlite, order } = setup(['test-shirt']);
	const held = await order();
	const abandoned = provider({ status: 'initiated', trxId: null, amountBdt: 930 });
	await startPayment(db, abandoned, held, 'https://shop.test/cb');
	expect(await expireStaleOrders(db, abandoned)).toBe(0);
	sqlite.exec(`UPDATE orders SET expires_at = datetime('now', '-1 minute')`);
	expect(await verifyPayment(db, abandoned, 'pay-1', 'success')).toBe('pending_payment');
	expect(abandoned.execute).not.toHaveBeenCalled();
	expect(await expireStaleOrders(db, abandoned)).toBe(1);
	expect(state(sqlite, 'SELECT status FROM orders')).toEqual({ status: 'expired' });
	expect(state(sqlite, "SELECT state FROM inventory WHERE product_id = 'test-shirt'")).toEqual({
		state: 'available'
	});

	const late = setup(['test-dress']);
	const lateOrder = await late.order();
	const completed = provider({ amountBdt: 1530, invoice: invoiceForOrder(lateOrder.id) });
	await startPayment(late.db, completed, lateOrder, 'https://shop.test/cb');
	late.sqlite.exec(`UPDATE orders SET expires_at = datetime('now', '-1 minute')`);
	expect(await expireStaleOrders(late.db, completed)).toBe(0);
	expect(state(late.sqlite, 'SELECT status FROM orders')).toEqual({ status: 'paid' });
});
