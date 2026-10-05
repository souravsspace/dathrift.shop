import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../lib/server/testing/local-d1';
import { GET, POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

it('keeps draft listing staff-only and returns local preview rows without public caching', async () => {
	expect(
		(
			await GET({ request: new Request('https://dathrift.shop/admin/api/products') } as Parameters<
				typeof GET
			>[0])
		).status
	).toBe(403);
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await GET({
		request: new Request('http://127.0.0.1:5173/admin/api/products')
	} as Parameters<typeof GET>[0]);
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	const rows = (await response.json()) as { id: string; publication_state: string }[];
	expect(rows).toHaveLength(4);
	expect(rows).toContainEqual(
		expect.objectContaining({ id: 'test-draft', publication_state: 'draft' })
	);
});

const input = {
	slug: 'test-new-top',
	name: 'TEST ONLY — New top',
	category: 'tops',
	price_bdt: 900
};
const event = (url: string, origin?: string) =>
	({
		request: new Request(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
			body: JSON.stringify(input)
		})
	}) as Parameters<typeof POST>[0];

it('denies public, cross-origin and missing-Origin staff writes', async () => {
	expect(
		(await POST(event('https://dathrift.shop/admin/api/products', 'https://dathrift.shop'))).status
	).toBe(403);
	expect(
		(await POST(event('http://127.0.0.1:5173/admin/api/products', 'https://evil.example'))).status
	).toBe(403);
	expect((await POST(event('http://127.0.0.1:5173/admin/api/products'))).status).toBe(403);
});

it('allows only local preview draft creation with D1 bound', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await POST(
		event('http://127.0.0.1:5173/admin/api/products', 'http://127.0.0.1:5173')
	);
	expect(response.status).toBe(201);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toMatchObject({ slug: input.slug, publication_state: 'draft' });
});
