import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../../lib/server/testing/local-d1';
import { DELETE, GET, PATCH } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const details = {
	name: 'TEST ONLY — Reworked skirt',
	category: 'bottoms',
	price_bdt: 875,
	brand: null,
	description: 'Local fixture',
	condition_notes: 'Small hem mark',
	size_label: 'M',
	measurements_json: '{"waist_cm":78,"inseam_cm":70}',
	fit_note: 'Relaxed leg'
};

const event = (url: string, method = 'GET', origin?: string, body: object = details) =>
	({
		params: { id: new URL(url).pathname.split('/').pop() },
		request: new Request(url, {
			method,
			headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': 'application/json' },
			...(method === 'PATCH' ? { body: JSON.stringify(body) } : {})
		})
	}) as Parameters<typeof GET>[0] & Parameters<typeof PATCH>[0] & Parameters<typeof DELETE>[0];

const local = 'http://127.0.0.1:5173';

it('keeps product detail reads private, including a local draft', async () => {
	expect((await GET(event('https://dathrift.shop/admin/api/products/test-draft'))).status).toBe(
		403
	);
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await GET(event('http://127.0.0.1:5173/admin/api/products/test-draft'));
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toMatchObject({
		id: 'test-draft',
		publication_state: 'draft',
		photos: [{ position: 1, r2_key: 'test-only/unpublished-skirt.svg' }]
	});
});

it('denies cross-origin and public draft edits, then accepts local guarded edit', async () => {
	expect(
		(
			await PATCH(
				event(
					'https://dathrift.shop/admin/api/products/test-draft',
					'PATCH',
					'https://dathrift.shop'
				)
			)
		).status
	).toBe(403);
	expect(
		(
			await PATCH(
				event(
					'http://127.0.0.1:5173/admin/api/products/test-draft',
					'PATCH',
					'https://evil.example'
				)
			)
		).status
	).toBe(403);
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await PATCH(
		event('http://127.0.0.1:5173/admin/api/products/test-draft', 'PATCH', 'http://127.0.0.1:5173')
	);
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({ id: 'test-draft', publication_state: 'draft' });
});

it('edits a live piece only while it stays complete and is not held in checkout', async () => {
	const { db, sqlite } = localD1();
	(env as { DB?: unknown }).DB = db;
	const shirt = {
		...details,
		name: 'TEST ONLY — Olive shirt',
		category: 'tops',
		measurements_json: '{"chest_in":41.5,"length_in":28.5}'
	};
	const patch = (body: object) =>
		PATCH(event(`${local}/admin/api/products/test-shirt`, 'PATCH', local, body));
	const saved = await patch(shirt);
	expect(saved.status).toBe(200);
	expect(await saved.json()).toEqual({ id: 'test-shirt', publication_state: 'published' });
	expect((await patch({ ...shirt, fit_note: null })).status).toBe(200);
	expect((await patch({ ...shirt, measurements_json: null })).status).toBe(422);
	sqlite.exec("UPDATE inventory SET state = 'reserved' WHERE product_id = 'test-shirt'");
	expect((await patch(shirt)).status).toBe(409);
});

it('deletes a never-sold piece and archives a sold one, for staff only', async () => {
	const removed: string[] = [];
	(env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES = {
		delete: async (key: string) => void removed.push(key)
	};
	expect(
		(
			await DELETE(
				event(
					'https://dathrift.shop/admin/api/products/test-draft',
					'DELETE',
					'https://dathrift.shop'
				)
			)
		).status
	).toBe(403);
	expect(
		(
			await DELETE(
				event(`${local}/admin/api/products/test-draft`, 'DELETE', 'https://evil.example')
			)
		).status
	).toBe(403);
	(env as { DB?: unknown }).DB = localD1().db;
	const deleted = await DELETE(event(`${local}/admin/api/products/test-draft`, 'DELETE', local));
	expect(deleted.status).toBe(200);
	expect(await deleted.json()).toEqual({ outcome: 'deleted' });
	expect(removed).toEqual(['test-only/unpublished-skirt.svg']);
	const archived = await DELETE(event(`${local}/admin/api/products/test-sold`, 'DELETE', local));
	expect(await archived.json()).toEqual({ outcome: 'archived' });
	expect(
		(await DELETE(event(`${local}/admin/api/products/test-sold`, 'DELETE', local))).status
	).toBe(404);
	delete (env as { PRODUCT_IMAGES?: unknown }).PRODUCT_IMAGES;
});
