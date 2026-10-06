import { env } from 'cloudflare:workers';
import { afterEach, expect, it, vi } from 'vitest';
import { localD1 } from '../../../../../../lib/server/testing/local-d1';
import { DELETE, POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
	delete (env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES;
});

const bytes = new Uint8Array([82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 32]);
function event(url: string, origin?: string) {
	const body = new FormData();
	body.set('photo', new File([bytes], 'test.webp', { type: 'image/webp' }));
	body.set('position', '2');
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

it('saves a local photo without a description using private R2 and D1 metadata', async () => {
	const put = vi.fn(async () => ({}));
	(env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES = { put, delete: async () => undefined };
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await POST(
		event('http://127.0.0.1:5173/admin/api/products/test-draft/photos', 'http://127.0.0.1:5173')
	);
	expect(response.status).toBe(201);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toMatchObject({ position: 2, alt_text: '' });
	expect(put).toHaveBeenCalledOnce();
});

const removal = (url: string, origin: string, r2Key: string) =>
	({
		params: { id: new URL(url).pathname.split('/')[4] },
		request: new Request(url, {
			method: 'DELETE',
			headers: { Origin: origin, 'Content-Type': 'application/json' },
			body: JSON.stringify({ r2_key: r2Key })
		})
	}) as Parameters<typeof DELETE>[0];

it('removes a photo for staff and keeps the last one on a live piece', async () => {
	const remove = vi.fn(async () => undefined);
	(env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES = { put: async () => ({}), delete: remove };
	const local = 'http://127.0.0.1:5173';
	expect(
		(
			await DELETE(
				removal(
					'https://dathrift.shop/admin/api/products/test-draft/photos',
					'https://dathrift.shop',
					'test-only/unpublished-skirt.svg'
				)
			)
		).status
	).toBe(403);
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await DELETE(
		removal(
			`${local}/admin/api/products/test-draft/photos`,
			local,
			'test-only/unpublished-skirt.svg'
		)
	);
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual([]);
	expect(remove).toHaveBeenCalledWith('test-only/unpublished-skirt.svg');
	expect(
		(
			await DELETE(
				removal(
					`${local}/admin/api/products/test-shirt/photos`,
					local,
					'test-only/olive-shirt.webp'
				)
			)
		).status
	).toBe(409);
	expect(
		(await DELETE(removal(`${local}/admin/api/products/test-shirt/photos`, local, 'nope.webp')))
			.status
	).toBe(404);
});
