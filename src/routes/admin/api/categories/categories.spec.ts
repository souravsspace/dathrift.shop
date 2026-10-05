import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../lib/server/testing/local-d1';
import { GET, POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const local = 'http://127.0.0.1:5173/admin/api/categories';
const post = (body: unknown, origin = 'http://127.0.0.1:5173', url = local) =>
	POST({
		request: new Request(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Origin: origin },
			body: JSON.stringify(body)
		})
	} as Parameters<typeof POST>[0]);

it('lists categories to staff only, without caching', async () => {
	const publicGet = await GET({
		request: new Request('https://dathrift.shop/admin/api/categories')
	} as Parameters<typeof GET>[0]);
	expect(publicGet.status).toBe(403);
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await GET({ request: new Request(local) } as Parameters<typeof GET>[0]);
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(await response.json()).toContainEqual({
		slug: 'bottoms',
		name: 'Bottoms',
		measurement_set: 'bottom'
	});
});

it('lets staff add a category and explains duplicates and bad input', async () => {
	expect(
		(await post({ name: 'Bags', measurement_set: 'none' }, 'https://evil.example')).status
	).toBe(403);
	(env as { DB?: unknown }).DB = localD1().db;
	const created = await post({ name: 'Bags', measurement_set: 'none' });
	expect(created.status).toBe(201);
	expect(await created.json()).toEqual({ slug: 'bags', name: 'Bags', measurement_set: 'none' });
	const duplicate = await post({ name: 'bags', measurement_set: 'none' });
	expect([duplicate.status, await duplicate.text()]).toEqual([409, 'Category exists']);
	const invalid = await post({ name: 'Shoes', measurement_set: 'feet' });
	expect([invalid.status, await invalid.text()]).toEqual([400, 'Invalid category']);
});
