import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { GET, PATCH } from './+server';

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

const event = (url: string, method = 'GET', origin?: string) =>
	({
		params: { id: 'test-draft' },
		request: new Request(url, {
			method,
			headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': 'application/json' },
			...(method === 'PATCH' ? { body: JSON.stringify(details) } : {})
		})
	}) as Parameters<typeof GET>[0] & Parameters<typeof PATCH>[0];

it('keeps product detail reads private, including a local draft', async () => {
	expect((await GET(event('https://dathrift.shop/admin/api/products/test-draft'))).status).toBe(
		403
	);
	(env as { DB?: unknown }).DB = {
		prepare: () => ({
			bind: () => ({
				first: async () => ({ id: 'test-draft', publication_state: 'draft' }),
				all: async () => ({ results: [] })
			})
		})
	};
	const response = await GET(event('http://127.0.0.1:5173/admin/api/products/test-draft'));
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toEqual({
		id: 'test-draft',
		publication_state: 'draft',
		photos: []
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
	(env as { DB?: unknown }).DB = {
		prepare: () => ({ bind: () => ({ run: async () => ({ meta: { changes: 1 } }) }) })
	};
	const response = await PATCH(
		event('http://127.0.0.1:5173/admin/api/products/test-draft', 'PATCH', 'http://127.0.0.1:5173')
	);
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({ id: 'test-draft', publication_state: 'draft' });
});
