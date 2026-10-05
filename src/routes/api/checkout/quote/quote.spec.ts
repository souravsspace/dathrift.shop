import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const body = {
	ids: ['test-shirt'],
	address: {
		name: 'Test Buyer',
		phone: '01712345678',
		line1: 'Test building',
		district: 'test-dhaka',
		area: 'test-central'
	}
};
const event = (origin = 'http://127.0.0.1:5173') =>
	({
		request: new Request('http://127.0.0.1:5173/api/checkout/quote', {
			method: 'POST',
			headers: { Origin: origin, 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
	}) as Parameters<typeof POST>[0];

it('returns current item and one preview shipping fee without creating an order', async () => {
	expect((await POST(event('https://evil.example'))).status).toBe(403);
	(env as { DB?: unknown }).DB = {
		prepare: (sql: string) => ({
			bind: () => ({
				first: async () =>
					sql.includes('delivery_areas')
						? { fee_bdt: 80, preview_only: 1 }
						: {
								slug: 'test-shirt',
								name: 'TEST ONLY Shirt',
								price_bdt: 850,
								publication_state: 'published',
								stock_state: 'available'
							}
			})
		})
	};
	const response = await POST(event());
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toMatchObject({
		subtotal_bdt: 850,
		shipping_bdt: 80,
		total_bdt: 930,
		preview_only: true
	});
});
