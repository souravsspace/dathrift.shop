import { env } from 'cloudflare:workers';
import { afterEach, expect, it, vi } from 'vitest';
import { database } from '../../../../lib/server/db/client';
import { attachPayment, holdForReview } from '../../../../lib/server/orders/lifecycle';
import { decideTestPayment, testWallet } from '../../../../lib/server/payments/test-wallet';
import { reserveCheckout } from '../../../../lib/server/reservation/reserve';
import { localD1 } from '../../../../lib/server/testing/local-d1';
import { actions, load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'Test building',
	district: 'test-dhaka',
	area: 'test-central'
};

async function reviewOrder(executed: boolean) {
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	const db = database(local.db as never);
	const order = await reserveCheckout(db, ['test-shirt'], address, true);
	const payment = await testWallet.create({
		amountBdt: order.total_bdt,
		invoice: order.id.replace(/-/g, ''),
		callbackUrl: '/checkout/callback',
		payerReference: address.phone
	});
	await attachPayment(db, order.id, 'mock', payment.paymentId, order.total_bdt);
	if (executed) {
		decideTestPayment(payment.paymentId, 'approved');
		await testWallet.execute(payment.paymentId);
	}
	await holdForReview(db, order.id);
	return { local, order };
}

const event = (id: string, url = `http://127.0.0.1:5173/admin/orders/${id}`, form?: FormData) =>
	({
		params: { id },
		url: new URL(url),
		request: new Request(url, form ? { method: 'POST', body: form } : {}),
		setHeaders: vi.fn()
	}) as unknown as Parameters<typeof load>[0] & Parameters<typeof actions.recheck>[0];

const form = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

it('shows staff the order detail and owner controls, never to the public', async () => {
	const { order } = await reviewOrder(false);
	await expect(
		load(event(order.id, `https://dathrift.shop/admin/orders/${order.id}`))
	).rejects.toMatchObject({ status: 403 });
	expect(await load(event(order.id))).toMatchObject({
		is_owner: true,
		order: { id: order.id, status: 'payment_review', address: { phone: '01712345678' } }
	});
	await expect(load(event('missing'))).rejects.toMatchObject({ status: 404 });
});

it('settles a held review only from a provider-verified completed payment', async () => {
	const { local, order } = await reviewOrder(true);
	expect(await actions.recheck(event(order.id, undefined, form({})))).toMatchObject({
		message: 'Provider check complete. Order is now paid.'
	});
	expect(local.sqlite.prepare('SELECT status FROM orders').get()).toEqual({ status: 'paid' });
	expect(
		await actions.fulfillment(
			event(order.id, undefined, form({ state: 'dispatched', courier: 'Steadfast' }))
		)
	).toMatchObject({ status: 400 });
	expect(
		await actions.fulfillment(
			event(order.id, undefined, form({ state: 'preparing', courier: '', tracking_code: '' }))
		)
	).toMatchObject({ message: 'Fulfillment updated.' });
});

it('lets the owner close an unpaid review after checking, releasing its holds', async () => {
	const { local, order } = await reviewOrder(false);
	expect(await actions.recheck(event(order.id, undefined, form({})))).toMatchObject({
		message: 'Provider check complete. Order is now payment_review.'
	});
	expect(await actions.close(event(order.id, undefined, form({})))).toMatchObject({ status: 400 });
	expect(
		await actions.close(event(order.id, undefined, form({ confirm: 'checked-provider' })))
	).toMatchObject({ message: 'Order closed and pieces released.' });
	expect(
		local.sqlite.prepare("SELECT state FROM inventory WHERE product_id = 'test-shirt'").get()
	).toEqual({ state: 'available' });
});

async function manualOrder() {
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	const db = database(local.db as never);
	const order = await reserveCheckout(db, ['test-shirt'], address, true);
	const manual = await import('../../../../lib/server/payments/manual');
	await manual.startManualPayment(db, order.id, '01849584594');
	await manual.submitManualPayment(db, order.status_token, {
		plan: 'full',
		trx_id: '8N7A6D5C4B',
		sender_number: null
	});
	return { local, order };
}

it('lets staff confirm a manual bKash payment only after ticking that they found it', async () => {
	const { local, order } = await manualOrder();
	const url = `http://127.0.0.1:5173/admin/orders/${order.id}?/confirmManual`;
	expect(await actions.confirmManual(event(order.id, url, form({})))).toMatchObject({
		status: 400
	});
	expect(
		await actions.confirmManual(event(order.id, url, form({ confirm: 'found-in-bkash' })))
	).toEqual({ message: 'Payment confirmed. The order is paid and its pieces are sold.' });
	expect(local.sqlite.prepare('SELECT status FROM orders WHERE id = ?').get(order.id)).toEqual({
		status: 'paid'
	});
	expect(
		local.sqlite.prepare("SELECT state FROM inventory WHERE product_id = 'test-shirt'").get()
	).toEqual({ state: 'sold' });
	const loaded = (await load(event(order.id))) as { order: { manual: { trx_id: string } } };
	expect(loaded.order.manual.trx_id).toBe('8N7A6D5C4B');
});

it('lets staff reject a manual bKash payment they could not find, releasing the piece', async () => {
	const { local, order } = await manualOrder();
	const url = `http://127.0.0.1:5173/admin/orders/${order.id}?/rejectManual`;
	expect(
		await actions.rejectManual(event(order.id, url, form({ confirm: 'not-in-bkash' })))
	).toEqual({ message: 'Order closed and pieces released.' });
	expect(
		local.sqlite.prepare("SELECT state FROM inventory WHERE product_id = 'test-shirt'").get()
	).toEqual({ state: 'available' });
	expect(
		await actions.rejectManual(event(order.id, url, form({ confirm: 'not-in-bkash' })))
	).toMatchObject({ status: 409 });
});
