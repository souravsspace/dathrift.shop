import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

function event(url: string, origin?: string) {
	return {
		params: { id: 'test-shirt' },
		request: new Request(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
			body: JSON.stringify({ reason: 'Sold in person' })
		})
	} as Parameters<typeof POST>[0];
}

it('blocks public and cross-origin external-sale writes', async () => {
	expect(
		(
			await POST(
				event(
					'https://dathrift.shop/admin/api/products/test-shirt/external-sale',
					'https://dathrift.shop'
				)
			)
		).status
	).toBe(403);
	expect(
		(
			await POST(
				event(
					'http://127.0.0.1:5173/admin/api/products/test-shirt/external-sale',
					'https://evil.example'
				)
			)
		).status
	).toBe(403);
});

it('audits a local staff sale through the database', async () => {
	let values: string[] = [];
	(env as { DB?: unknown }).DB = {
		prepare: () => ({
			bind: (...args: string[]) => {
				values = args;
				return { run: async () => ({ meta: { changes: 1 } }) };
			}
		})
	};
	const response = await POST(
		event(
			'http://127.0.0.1:5173/admin/api/products/test-shirt/external-sale',
			'http://127.0.0.1:5173'
		)
	);
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({ product_id: 'test-shirt', state: 'sold' });
	expect(values.slice(1)).toEqual(['test-shirt', 'local-preview', 'Sold in person']);
});
