import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../../../../lib/server/testing/local-d1';
import { POST } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const local = 'http://127.0.0.1:5173';
const request = (id: string, body: unknown, url = local, origin: string | undefined = local) =>
	({
		params: { id },
		request: new Request(`${url}/admin/api/products/${id}/feature`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
			body: JSON.stringify(body)
		})
	}) as Parameters<typeof POST>[0];

it('denies public and cross-origin feature writes', async () => {
	expect(
		(
			await POST(
				request('test-dress', { featured: true }, 'https://dathrift.shop', 'https://dathrift.shop')
			)
		).status
	).toBe(403);
	expect(
		(await POST(request('test-dress', { featured: true }, local, 'https://evil.example'))).status
	).toBe(403);
});

it('features an available published piece and clears it again', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const featured = await POST(request('test-shirt', { featured: true }));
	expect(featured.status).toBe(200);
	expect(featured.headers.get('Cache-Control')).toBe('no-store');
	expect(await featured.json()).toEqual({ id: 'test-shirt', featured: true });
	expect(await (await POST(request('test-shirt', { featured: false }))).json()).toEqual({
		featured: false
	});
});

it('rejects drafts, sold pieces and malformed bodies', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	expect((await POST(request('test-draft', { featured: true }))).status).toBe(409);
	expect((await POST(request('test-sold', { featured: true }))).status).toBe(409);
	expect((await POST(request('test-dress', { featured: 'yes' }))).status).toBe(400);
});
