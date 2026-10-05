import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { GET } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

it('returns 503 rather than an empty catalog item when D1 is not bound', async () => {
	const response = await GET({
		params: { slug: 'test-only-top' }
	} as Parameters<typeof GET>[0]);

	expect(response.status).toBe(503);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
});

it('maps a hidden draft to 404 and a published sold item to a safe no-store response', async () => {
	const sold = {
		id: 'product-1',
		slug: 'sold-piece',
		name: 'Test-only sold piece',
		category: 'tops',
		price_bdt: 1200,
		stock_state: 'sold'
	};
	(env as { DB?: unknown }).DB = {
		prepare: () => ({
			bind: (slug: string) => ({ first: async () => (slug === 'sold-piece' ? sold : null) })
		})
	};
	const request = (slug: string) => ({ params: { slug } }) as unknown as Parameters<typeof GET>[0];

	expect((await GET(request('draft-piece'))).status).toBe(404);
	const response = await GET(request('sold-piece'));
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual(sold);
});
