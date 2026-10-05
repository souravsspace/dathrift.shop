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
