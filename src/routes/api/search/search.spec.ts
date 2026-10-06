import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { GET } from './+server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const search = (query: string) =>
	GET({
		url: new URL(`http://127.0.0.1:5173/api/search${query}`)
	} as Parameters<typeof GET>[0]);

it('returns 503 when the catalog database is not bound', async () => {
	const response = await search('?q=olive');
	expect(response.status).toBe(503);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
});

it('suggests published pieces as the shopper types, with only listing fields', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const response = await search('?q=olive');
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		total: 1,
		items: [
			{
				slug: 'test-olive-cotton-shirt',
				name: 'TEST ONLY — Olive cotton shirt',
				category_name: 'Tops',
				price_bdt: 850,
				size_label: 'L',
				stock_state: 'available',
				photo_key: 'test-only/olive-shirt.webp',
				photo_alt: 'Generated test-only olive shirt visual'
			}
		]
	});
	expect(await (await search('?q=skirt')).json()).toEqual({ total: 0, items: [] });
	expect(await (await search('?q=%20')).json()).toEqual({ total: 0, items: [] });
});
