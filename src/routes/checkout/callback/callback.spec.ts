import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { decideTestPayment } from '../../../lib/server/payments/test-wallet';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { POST as startCheckout } from '../../api/checkout/+server';
import { GET } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

async function checkout(ids: string[]) {
	const response = await startCheckout({
		url: new URL('http://127.0.0.1:5173/api/checkout'),
		request: new Request('http://127.0.0.1:5173/api/checkout', {
			method: 'POST',
			headers: { Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ids,
				address: {
					name: 'Test Buyer',
					phone: '01712345678',
					line1: 'Test building',
					district: 'test-dhaka',
					area: 'test-central'
				}
			})
		})
	} as Parameters<typeof startCheckout>[0]);
	const started = (await response.json()) as { redirect_url: string; status_url: string };
	return {
		...started,
		paymentId: new URL(started.redirect_url, 'http://x').searchParams.get('paymentId')!
	};
}

const callback = (query: string) =>
	GET({
		url: new URL(`http://127.0.0.1:5173/checkout/callback?${query}`)
	} as Parameters<typeof GET>[0]);

const redirectOf = async (promise: Promise<Response>) =>
	promise.then(
		(response) => ({ status: response.status, location: response.headers.get('Location') }),
		(thrown: { status: number; location: string }) => ({
			status: thrown.status,
			location: thrown.location
		})
	);

it('sells pieces only after the provider confirms an approved payment', async () => {
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	const order = await checkout(['test-shirt', 'test-dress']);
	decideTestPayment(order.paymentId, 'approved');
	expect(await redirectOf(callback(`paymentID=${order.paymentId}&status=success`))).toEqual({
		status: 303,
		location: order.status_url
	});
	expect(local.sqlite.prepare('SELECT status FROM orders').get()).toEqual({ status: 'paid' });
	expect(
		local.sqlite.prepare("SELECT count(*) AS n FROM inventory WHERE state = 'sold'").get()
	).toEqual({ n: 3 });
});

it('ignores a forged success redirect and releases the unpaid hold', async () => {
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	const order = await checkout(['test-shirt']);
	expect(await redirectOf(callback(`paymentID=${order.paymentId}&status=success`))).toEqual({
		status: 303,
		location: order.status_url
	});
	expect(local.sqlite.prepare('SELECT status FROM orders').get()).toEqual({ status: 'cancelled' });
	expect(
		local.sqlite.prepare("SELECT state FROM inventory WHERE product_id = 'test-shirt'").get()
	).toEqual({ state: 'available' });
	expect((await redirectOf(callback('paymentID=TESTunknown&status=success'))).status).toBe(404);
	expect((await redirectOf(callback('paymentID=<bad>&status=success'))).status).toBe(400);
});
