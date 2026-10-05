import { env } from 'cloudflare:workers';
import { afterEach, expect, it } from 'vitest';
import { localD1 } from '../lib/server/testing/local-d1';
import { load } from './+page.server';

afterEach(() => {
	delete (env as { DB?: unknown }).DB;
});

it('fails closed when the product database is unavailable', async () => {
	await expect(load({} as Parameters<typeof load>[0])).rejects.toMatchObject({ status: 503 });
});

it('loads only the server-selected catalog rows for storefront rendering', async () => {
	(env as { DB?: unknown }).DB = localD1().db;
	const { products } = (await load({} as Parameters<typeof load>[0])) as {
		products: { slug: string; stock_state: string }[];
	};
	expect(products).toContainEqual(
		expect.objectContaining({ slug: 'test-olive-cotton-shirt', stock_state: 'available' })
	);
	expect(products.map((product) => product.slug)).not.toContain('test-unpublished-skirt');
});
