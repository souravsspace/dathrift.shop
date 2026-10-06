import { env } from 'cloudflare:workers';
import { error, redirect } from '@sveltejs/kit';
import { listPublicProducts, publicFacets } from '../lib/server/catalog/public-catalog';
import { homeHero } from '../lib/server/catalog/feature';
import { databaseFrom } from '../lib/server/db/client';
import type { PageServerLoad } from './$types';

// Browsing used to live on the home page; old filter links now open the shop with the same query.
const BROWSE_KEYS = ['q', 'category', 'size', 'min_price', 'max_price', 'available', 'sort'];

export const load: PageServerLoad = async ({ url }) => {
	if (BROWSE_KEYS.some((key) => url.searchParams.has(key))) redirect(308, `/shop${url.search}`);
	const db = databaseFrom(env);
	if (!db) error(503, 'Catalog unavailable');
	try {
		const [products, facets, hero] = await Promise.all([
			listPublicProducts(db, {}, { limit: 8 }),
			publicFacets(db),
			homeHero(db)
		]);
		return { products, facets, hero };
	} catch {
		error(503, 'Catalog unavailable');
	}
};
