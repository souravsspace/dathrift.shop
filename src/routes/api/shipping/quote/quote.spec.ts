import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../lib/server/testing/local-d1';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const address = {
	name: 'Test Buyer',
	phone: '01712345678',
	line1: 'Test building',
	district: 'test-dhaka',
	area: 'test-central',
	claimed_zone: 'outside'
};
function event(origin = 'http://127.0.0.1:5173') {
	return {
		request: new Request('http://127.0.0.1:5173/api/shipping/quote', {
			method: 'POST',
			headers: { Origin: origin, 'Content-Type': 'application/json' },
			body: JSON.stringify(address)
		})
	} as Parameters<typeof POST>[0];
}

it('returns a server-owned local preview charge and denies cross-origin requests', async () => {
	expect((await POST(event('https://evil.example'))).status).toBe(403);
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await POST(event());
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({ phone: address.phone, fee_bdt: 80, preview_only: true });
});
