import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../../../lib/server/testing/local-d1';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

const event = (query = '', category?: string) =>
	({
		params: { category },
		url: new URL(`http://127.0.0.1:5173/shop${category ? `/${category}` : ''}${query}`)
	}) as unknown as Parameters<typeof load>[0];

it('fails closed when the product database is unavailable', async () => {
	await expect(load(event())).rejects.toMatchObject({ status: 503 });
});

it('lists every published piece with a total and the filter facets', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const data = (await load(event())) as {
		products: { slug: string }[];
		total: number;
		page: number;
		filtered: boolean;
		facets: { sizes: string[]; price: { min: number; max: number } };
	};
	expect(data.products.map((product) => product.slug).sort()).toEqual([
		'test-cream-midi-dress',
		'test-olive-cotton-shirt',
		'test-sold-denim-jacket'
	]);
	expect(data).toMatchObject({ total: 3, page: 1, filtered: false });
	expect(data.facets.price).toEqual({ min: 850, max: 1750 });
});

it('searches, sorts and filters server-side and marks the page as a variant', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const data = (await load(event('?q=test&sort=price-desc&available=1'))) as {
		products: { price_bdt: number }[];
		total: number;
		filtered: boolean;
	};
	expect(data.products.map((product) => product.price_bdt)).toEqual([1450, 850]);
	expect(data).toMatchObject({ total: 2, filtered: true });
});

it('sends a category chosen by query string to its own page, keeping the other filters', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	await expect(load(event('?category=tops&size=L'))).rejects.toMatchObject({
		status: 308,
		location: '/shop/tops?size=L'
	});
});

it('renders real category pages and 404s unknown or empty categories', async () => {
	await expect(load(event('', 'tops'))).rejects.toMatchObject({ status: 503 });
	(env as { DB?: unknown }).DB = localD1().db;
	expect(await load(event('', 'tops'))).toMatchObject({
		category: 'tops',
		categoryName: 'Tops',
		filtered: false,
		products: [{ slug: 'test-olive-cotton-shirt' }]
	});
	expect(await load(event('?available=1', 'outerwear'))).toMatchObject({
		filtered: true,
		products: []
	});
	await expect(load(event('', 'bottoms'))).rejects.toMatchObject({ status: 404 });
	await expect(load(event('', 'shoes'))).rejects.toMatchObject({ status: 404 });
});
