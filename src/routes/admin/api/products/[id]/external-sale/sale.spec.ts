import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../../../lib/server/testing/local-d1';
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
	const local = localD1();
	(env as { DB?: unknown }).DB = local.db;
	const response = await POST(
		event(
			'http://127.0.0.1:5173/admin/api/products/test-shirt/external-sale',
			'http://127.0.0.1:5173'
		)
	);
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({ product_id: 'test-shirt', state: 'sold' });
	expect(
		local.sqlite
			.prepare("SELECT actor_email, reason FROM external_sales WHERE product_id = 'test-shirt'")
			.get()
	).toEqual({ actor_email: 'local-preview', reason: 'Sold in person' });
});
