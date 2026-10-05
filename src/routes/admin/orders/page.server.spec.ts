import { env } from 'cloudflare:workers';
import { afterEach, expect, it, vi } from 'vitest';
import { database } from '../../../lib/server/db/client';
import { reserveCheckout } from '../../../lib/server/reservation/reserve';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const event = (url: string, setHeaders = vi.fn()) =>
	({ request: new Request(url), setHeaders }) as unknown as Parameters<typeof load>[0];

it('lists orders only for staff, uncached', async () => {
	await expect(load(event('https://dathrift.shop/admin/orders'))).rejects.toMatchObject({
		status: 403
	});
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	await reserveCheckout(
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
	const data = (await load(event('http://127.0.0.1:5173/admin/orders', setHeaders))) as {
		orders: { status: string; total_bdt: number }[];
	};
	expect(data.orders).toHaveLength(1);
	expect(data.orders[0]).toMatchObject({ status: 'pending_payment', total_bdt: 930 });
	expect(setHeaders).toHaveBeenCalledWith({ 'Cache-Control': 'no-store' });
});
