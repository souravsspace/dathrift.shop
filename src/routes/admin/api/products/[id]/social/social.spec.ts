import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../../../lib/server/testing/local-d1';
import { DELETE, GET, PUT } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const local = 'http://127.0.0.1:5173';
const request = (
	id: string,
	method: string,
	body?: unknown,
	url = local,
	origin: string | undefined = local
) =>
	({
		params: { id },
		request: new Request(`${url}/admin/api/products/${id}/social`, {
			method,
			headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
			body: body === undefined ? undefined : JSON.stringify(body)
		})
	}) as Parameters<typeof PUT>[0];

it('denies public and cross-origin caption access', async () => {
	const caption = { format: 'ig-square', caption: 'Hi', basis: '' };
	expect(
		(await GET(request('test-shirt', 'GET', undefined, 'https://dathrift.shop', undefined))).status
	).toBe(403);
	expect(
		(await PUT(request('test-shirt', 'PUT', caption, local, 'https://evil.example'))).status
	).toBe(403);
	expect(
		(await DELETE(request('test-shirt', 'DELETE', caption, local, 'https://evil.example'))).status
	).toBe(403);
});

it('saves, lists and resets a staff caption', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const saved = await PUT(
		request('test-shirt', 'PUT', { format: 'fb-square', caption: 'Olive shirt', basis: 'g' })
	);
	expect(saved.status).toBe(200);
	expect(saved.headers.get('Cache-Control')).toBe('no-store');
	expect(await saved.json()).toMatchObject({ format: 'fb-square', caption: 'Olive shirt' });
	const listed = await GET(request('test-shirt', 'GET'));
	expect(await listed.json()).toMatchObject([{ format: 'fb-square', caption: 'Olive shirt' }]);
	const reset = await DELETE(request('test-shirt', 'DELETE', { format: 'fb-square' }));
	expect(await reset.json()).toEqual({ format: 'fb-square' });
	expect(await (await GET(request('test-shirt', 'GET'))).json()).toEqual([]);
});

it('rejects bad captions and unknown pieces', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	expect(
		(await PUT(request('test-shirt', 'PUT', { format: 'snap', caption: 'x', basis: '' }))).status
	).toBe(400);
	expect(
		(await PUT(request('missing-piece', 'PUT', { format: 'ig-square', caption: 'x', basis: '' })))
			.status
	).toBe(404);
	expect((await PUT(request('test-shirt', 'PUT', 'text'))).status).toBe(400);
});
