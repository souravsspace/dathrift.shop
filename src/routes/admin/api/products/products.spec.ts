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
	const { items, total } = (await response.json()) as {
		items: { id: string; publication_state: string }[];
		total: number;
	};
	expect(total).toBe(4);
	expect(items).toContainEqual(
		expect.objectContaining({ id: 'test-draft', publication_state: 'draft' })
	);
	const live = await GET({
		request: new Request('http://127.0.0.1:5173/admin/api/products?status=live&q=olive&page=1')
	} as Parameters<typeof GET>[0]);
	expect(((await live.json()) as { items: { id: string }[] }).items.map((row) => row.id)).toEqual([
		'test-shirt'
	]);
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

it('says when a draft slug is taken or its category does not exist', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const post = (body: object) =>
		POST({
			request: new Request('http://127.0.0.1:5173/admin/api/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:5173' },
				body: JSON.stringify({ ...input, ...body })
			})
		} as Parameters<typeof POST>[0]);
	const taken = await post({ slug: 'test-olive-cotton-shirt' });
	expect([taken.status, await taken.text()]).toEqual([409, 'Slug unavailable']);
	const unknown = await post({ category: 'sarees' });
	expect([unknown.status, await unknown.text()]).toEqual([400, 'Unknown category']);
});
