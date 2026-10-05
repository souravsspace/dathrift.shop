import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../../../lib/server/testing/local-d1';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const request = (url: string, state: string, origin?: string) =>
	({
		params: { id: 'test-draft' },
		request: new Request(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
			body: JSON.stringify({ state })
		})
	}) as Parameters<typeof POST>[0];

it('denies public and cross-origin publication writes', async () => {
	expect(
		(
			await POST(
				request(
					'https://dathrift.shop/admin/api/products/test-draft/publication',
					'published',
					'https://dathrift.shop'
				)
			)
		).status
	).toBe(403);
	expect(
		(
			await POST(
				request(
					'http://127.0.0.1:5173/admin/api/products/test-draft/publication',
					'published',
					'https://evil.example'
				)
			)
		).status
	).toBe(403);
});

it('publishes a complete local draft with no-cache response', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await POST(
		request(
			'http://127.0.0.1:5173/admin/api/products/test-draft/publication',
			'published',
			'http://127.0.0.1:5173'
		)
	);
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({ id: 'test-draft', publication_state: 'published' });
});
