import { env } from 'cloudflare:workers';
import { afterEach, expect, it, vi } from 'vitest';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
	delete (env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES;
});

const bytes = new Uint8Array([82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 32]);
function event(url: string, origin?: string) {
	const body = new FormData();
	body.set('photo', new File([bytes], 'test.webp', { type: 'image/webp' }));
	body.set('alt_text', 'TEST ONLY olive shirt');
	body.set('position', '1');
	return {
		params: { id: 'test-draft' },
		request: new Request(url, {
			method: 'POST',
			headers: origin ? { Origin: origin } : {},
			body
		})
	} as Parameters<typeof POST>[0];
}

it('denies public and cross-origin photo upload', async () => {
	expect(
		(
			await POST(
				event('https://dathrift.shop/admin/api/products/test-draft/photos', 'https://dathrift.shop')
			)
		).status
	).toBe(403);
	expect(
		(
			await POST(
				event('http://127.0.0.1:5173/admin/api/products/test-draft/photos', 'https://evil.example')
			)
		).status
	).toBe(403);
});

it('saves a local photo using private R2 and D1 metadata', async () => {
	const put = vi.fn(async () => ({}));
	(env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES = { put, delete: async () => undefined };
	(env as { DB?: unknown }).DB = {
		prepare: () => ({ bind: () => ({ run: async () => ({ meta: { changes: 1 } }) }) })
	};
	const response = await POST(
		event('http://127.0.0.1:5173/admin/api/products/test-draft/photos', 'http://127.0.0.1:5173')
	);
	expect(response.status).toBe(201);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toMatchObject({ position: 1, alt_text: 'TEST ONLY olive shirt' });
	expect(put).toHaveBeenCalledOnce();
});
