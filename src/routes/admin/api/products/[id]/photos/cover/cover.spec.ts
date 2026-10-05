import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../../../../lib/server/testing/local-d1';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const post = (id: string, r2_key: string, origin = 'http://127.0.0.1:5173') =>
	POST({
		params: { id },
		request: new Request(`http://127.0.0.1:5173/admin/api/products/${id}/photos/cover`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Origin: origin },
			body: JSON.stringify({ r2_key })
		})
	} as Parameters<typeof POST>[0]);

it('lets staff choose which photo the shop shows first', async () => {
	expect((await post('test-dress', 'x', 'https://evil.example')).status).toBe(403);
	const d1 = localD1();
	(env as { DB?: unknown }).DB = d1.db;
	d1.sqlite.exec(`INSERT INTO product_photos (product_id, position, r2_key, alt_text)
		VALUES ('test-dress', 2, 'test-only/dress-back.webp', 'TEST ONLY back')`);
	const response = await post('test-dress', 'test-only/dress-back.webp');
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(((await response.json()) as { r2_key: string }[]).map((photo) => photo.r2_key)).toEqual([
		'test-only/dress-back.webp',
		'test-only/cream-dress.webp'
	]);
	expect((await post('test-dress', 'test-only/missing.webp')).status).toBe(404);
});
