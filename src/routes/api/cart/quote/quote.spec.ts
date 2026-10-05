import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
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
	(env as { DB?: unknown }).DB = {
		prepare: () => ({
			bind: (id: string) => ({
				first: async () =>
					id === 'test-shirt'
						? { price_bdt: 850, publication_state: 'published', stock_state: 'available' }
						: { price_bdt: 1750, publication_state: 'published', stock_state: 'sold' }
			})
		})
	};
	const response = await POST(event({ ids: ['test-shirt', 'test-sold'] }));
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({
		items: [{ id: 'test-shirt', price_bdt: 850 }],
		unavailable: ['test-sold'],
		subtotal_bdt: null
	});
});
