import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { POST } from './+server';

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
const event = (body: unknown, origin = 'http://127.0.0.1:5173') =>
	({
		url: new URL('http://127.0.0.1:5173/api/checkout'),
		request: new Request('http://127.0.0.1:5173/api/checkout', {
			method: 'POST',
			headers: { Origin: origin, 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
	}) as Parameters<typeof POST>[0];

it('holds every piece once and hands back one payment page and a private status link', async () => {
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	const body = {
		ids: ['test-shirt', 'test-dress'],
		address,
		checkout_key: 'c0ffee00-0000-4000-8000-0000000000aa'
	};
	expect((await POST(event(body, 'https://evil.example'))).status).toBe(403);
	const response = await POST(event(body));
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	const started = (await response.json()) as { redirect_url: string; status_url: string };
	expect(started.redirect_url).toMatch(/^\/checkout\/test-wallet\?paymentId=TEST[0-9a-f]+$/);
	expect(started.status_url).toMatch(/^\/orders\/[0-9a-f-]{36}$/);
	expect(
		local.sqlite.prepare("SELECT count(*) AS n FROM inventory WHERE state = 'reserved'").get()
	).toEqual({ n: 2 });
	expect(await (await POST(event(body))).json()).toEqual(started);
	expect(local.sqlite.prepare('SELECT count(*) AS n FROM payments').get()).toEqual({ n: 1 });
});

it('explains unavailable pieces and unsupported areas without holding stock', async () => {
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	expect((await POST(event({ ids: ['test-shirt', 'test-sold'], address }))).status).toBe(409);
	expect(
		(await POST(event({ ids: ['test-shirt'], address: { ...address, area: 'elsewhere' } }))).status
	).toBe(422);
	expect((await POST(event({ ids: [], address }))).status).toBe(400);
	expect(local.sqlite.prepare('SELECT count(*) AS n FROM orders').get()).toEqual({ n: 0 });
	expect(
		local.sqlite.prepare("SELECT state FROM inventory WHERE product_id = 'test-shirt'").get()
	).toEqual({ state: 'available' });
});
