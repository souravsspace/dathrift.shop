import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const event = (category: string, query = '') =>
	({
		params: { category },
		url: new URL(`http://127.0.0.1:5173/shop/${category}${query}`)
	}) as unknown as Parameters<typeof load>[0];

it('renders real category pages and 404s unknown or empty categories', async () => {
	await expect(load(event('tops'))).rejects.toMatchObject({ status: 503 });
	(env as { DB?: unknown }).DB = localD1().db;
	expect(await load(event('tops'))).toMatchObject({
		category: 'tops',
		filtered: false,
		products: [{ slug: 'test-olive-cotton-shirt' }]
	});
	expect(await load(event('outerwear', '?available=1'))).toMatchObject({
		filtered: true,
		products: []
	});
	await expect(load(event('bottoms'))).rejects.toMatchObject({ status: 404 });
	await expect(load(event('shoes'))).rejects.toMatchObject({ status: 404 });
});
