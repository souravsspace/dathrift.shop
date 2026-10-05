import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../lib/server/testing/local-d1';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const event = (body: unknown) =>
	({
		request: new Request('https://dathrift.shop/api/cart/quote', {
			method: 'POST',
			body: JSON.stringify(body)
		})
	}) as Parameters<typeof POST>[0];

it('rejects client prices and fails closed without D1', async () => {
	expect((await POST(event({ ids: [{ id: 'test-shirt', price_bdt: 1 }] }))).status).toBe(400);
	expect((await POST(event({ ids: ['test-shirt'] }))).status).toBe(503);
});

it('returns server repricing and unavailable lines without a checkout total', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await POST(event({ ids: ['test-shirt', 'test-sold'] }));
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({
		items: [
			{
				id: 'test-shirt',
				slug: 'test-olive-cotton-shirt',
				name: 'TEST ONLY — Olive cotton shirt',
				price_bdt: 850,
				size_label: 'L',
				photo_key: 'test-only/olive-shirt.webp',
				photo_alt: 'Generated test-only olive shirt visual'
			}
		],
		unavailable: ['test-sold'],
		subtotal_bdt: null
	});
});
