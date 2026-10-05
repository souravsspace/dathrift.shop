import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../../../lib/server/testing/local-d1';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const event = (url: string, slug: string, origin?: string) =>
	({
		params: { id: 'test-shirt' },
		request: new Request(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
			body: JSON.stringify({ slug })
		})
	}) as Parameters<typeof POST>[0];

const local = 'http://127.0.0.1:5173/admin/api/products/test-shirt/slug';

it('lets staff correct a live slug, keeping the old URL redirected', async () => {
	expect(
		(
			await POST(
				event(
					'https://dathrift.shop/admin/api/products/test-shirt/slug',
					'x',
					'https://dathrift.shop'
				)
			)
		).status
	).toBe(403);
	expect((await POST(event(local, 'x', 'https://evil.example'))).status).toBe(403);
	const d1 = localD1();
	(env as { DB?: unknown }).DB = d1.db;
	expect((await POST(event(local, 'Bad Slug', 'http://127.0.0.1:5173'))).status).toBe(400);
	const response = await POST(event(local, 'test-olive-shirt', 'http://127.0.0.1:5173'));
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({ id: 'test-shirt', slug: 'test-olive-shirt' });
	expect(d1.sqlite.prepare('SELECT old_slug FROM slug_redirects').get()).toEqual({
		old_slug: 'test-olive-cotton-shirt'
	});
	expect((await POST(event(local, 'test-cream-midi-dress', 'http://127.0.0.1:5173'))).status).toBe(
		409
	);
});
