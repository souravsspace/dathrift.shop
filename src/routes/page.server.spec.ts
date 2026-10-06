import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../lib/server/testing/local-d1';
import { load } from './+page.server';

const event = (query = '') =>
	({ url: new URL(`http://127.0.0.1:5173/${query}`) }) as Parameters<typeof load>[0];

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

it('fails closed when the product database is unavailable', async () => {
	await expect(load(event())).rejects.toMatchObject({ status: 503 });
});

it('loads only the server-selected catalog rows for storefront rendering', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const { products } = (await load(event())) as {
		products: { slug: string; stock_state: string }[];
	};
	expect(products).toContainEqual(
		expect.objectContaining({ slug: 'test-olive-cotton-shirt', stock_state: 'available' })
	);
	expect(products.map((product) => product.slug)).not.toContain('test-unpublished-skirt');
});

it('sends old home-page filter links to the shop with the same query', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	await expect(load(event('?category=tops&available=1'))).rejects.toMatchObject({
		status: 308,
		location: '/shop?category=tops&available=1'
	});
});

it('shows the newest pieces and every category with its count and cover', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const data = (await load(event())) as {
		products: unknown[];
		facets: { categories: { slug: string; count: number; photo_key: string | null }[] };
	};
	expect(data.products.length).toBeLessThanOrEqual(8);
	expect(data.facets.categories).toContainEqual(
		expect.objectContaining({
			slug: 'outerwear',
			count: 1,
			photo_key: 'test-only/denim-jacket.webp'
		})
	);
});

it('loads the owner-featured hero piece for the home page', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const { hero } = (await load(event())) as { hero: { slug: string; featured: boolean } | null };
	expect(hero).toMatchObject({ slug: 'test-cream-midi-dress', featured: true });
});
