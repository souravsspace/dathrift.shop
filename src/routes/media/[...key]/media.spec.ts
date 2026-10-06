import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { GET } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
	delete (env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES;
});

const event = (key: string, origin = 'https://dathrift.shop') =>
	({ params: { key }, request: new Request(`${origin}/media/${key}`) }) as Parameters<
		typeof GET
	>[0];

const storedImage = {
	get: async () => ({
		body: new Blob(['picture']).stream(),
		httpMetadata: { contentType: 'image/webp' }
	})
};

it('never reveals an unpublished photo and fails closed without storage', async () => {
	expect((await GET(event('pieces/private.webp'))).status).toBe(503);
	(env as { DB?: unknown }).DB = localD1().db;
	(env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES = { get: async () => null };
	expect((await GET(event('pieces/private.webp'))).status).toBe(404);
});

it('streams only a referenced published image with no sniffing or public cache', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	(env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES = {
		get: async () => ({
			body: new Blob(['picture']).stream(),
			httpMetadata: { contentType: 'image/webp' }
		})
	};
	const response = await GET(event('test-only/olive-shirt.webp'));
	expect(response.status).toBe(200);
	expect(response.headers.get('Content-Type')).toBe('image/webp');
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
	expect(await response.text()).toBe('picture');
});

it('shows staff the photos of their unpublished pieces, never the public', async () => {
	const { db, sqlite } = localD1();
	sqlite.exec(
		"INSERT INTO product_photos (product_id, position, r2_key, alt_text) VALUES ('test-draft', 2, 'products/test-draft/back.webp', 'TEST ONLY back')"
	);
	(env as { DB?: unknown }).DB = db;
	(env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES = storedImage;
	expect((await GET(event('products/test-draft/back.webp'))).status).toBe(404);
	const staff = await GET(event('products/test-draft/back.webp', 'http://127.0.0.1:5173'));
	expect(staff.status).toBe(200);
	expect(staff.headers.get('Cache-Control')).toBe('no-store');
	expect((await GET(event('products/unknown/file.webp', 'http://127.0.0.1:5173'))).status).toBe(
		404
	);
});
