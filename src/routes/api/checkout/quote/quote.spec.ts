import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../lib/server/testing/local-d1';
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
	(env as { DB?: unknown }).DB = localD1().db;
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
