import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
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
	(env as { DB?: unknown }).DB = {
		prepare: () => ({
			bind: () => ({
				first: async () => ({
					name: 'TEST ONLY',
					category: 'tops',
					price_bdt: 100,
					description: 'Local',
					condition_notes: 'Good',
					size_label: 'S',
					measurements_json: '{"chest_cm":90,"length_cm":60}',
					fit_note: 'Regular'
				}),
				all: async () => ({
					results: [{ r2_key: 'test-only/top.webp', alt_text: 'TEST ONLY top' }]
				}),
				run: async () => ({ meta: { changes: 1 } })
			})
		})
	};
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
