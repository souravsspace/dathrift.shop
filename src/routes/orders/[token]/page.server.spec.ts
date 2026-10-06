import { env } from 'cloudflare:workers';
import { afterEach, expect, it, vi } from 'vitest';
import { database } from '../../../lib/server/db/client';
import { reserveCheckout } from '../../../lib/server/reservation/reserve';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const event = (token: string, setHeaders = vi.fn()) =>
	({ params: { token }, setHeaders }) as unknown as Parameters<typeof load>[0];

it('shows a private, uncached order summary only to its status link', async () => {
	await expect(load(event(crypto.randomUUID()))).rejects.toMatchObject({ status: 503 });
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	const order = await reserveCheckout(
		database(local.db as never),
		['test-shirt'],
		{
			name: 'Test Buyer',
			phone: '01712345678',
			line1: 'Test building',
			district: 'test-dhaka',
			area: 'test-central'
		},
		true
	);
	const setHeaders = vi.fn();
	expect(await load(event(order.status_token, setHeaders))).toMatchObject({
		order: { status: 'pending_payment', total_bdt: 930, phone_hint: '••••••••678' }
	});
	expect(setHeaders).toHaveBeenCalledWith({ 'Cache-Control': 'no-store' });
	await expect(load(event(crypto.randomUUID()))).rejects.toMatchObject({ status: 404 });
});

it('takes the manual bKash proof from the order page and holds the order for staff', async () => {
	const { actions } = await import('./+page.server');
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	const db = database(local.db as never);
	const order = await reserveCheckout(
		db,
		['test-shirt'],
		{
			name: 'Test Buyer',
			phone: '01712345678',
			line1: 'Test building',
			district: 'test-dhaka',
			area: 'test-central'
		},
		true
	);
	const { startManualPayment } = await import('../../../lib/server/payments/manual');
	await startManualPayment(db, order.id, '01849584594');
	const post = (fields: Record<string, string>) =>
		actions.pay({
			params: { token: order.status_token },
			request: new Request('http://127.0.0.1/orders/x?/pay', {
				method: 'POST',
				body: new URLSearchParams(fields)
			})
		} as unknown as Parameters<typeof actions.pay>[0]);
	expect(await post({ plan: 'full', trx_id: 'x', sender_number: '' })).toMatchObject({
		status: 400,
		data: { errors: { trx_id: expect.stringContaining('8 to 12') } }
	});
	expect(await post({ plan: 'full', trx_id: '8n7a6d5c4b', sender_number: '' })).toEqual({
		sent: true
	});
	expect(local.sqlite.prepare('SELECT status FROM orders WHERE id = ?').get(order.id)).toEqual({
		status: 'payment_review'
	});
	expect(await load(event(order.status_token))).toMatchObject({
		order: { status: 'payment_review', manual: { trx_id: '8N7A6D5C4B', plan: 'full' } }
	});
});
