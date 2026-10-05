import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import {
	browseFiltersFrom,
	listPublicProducts,
	publicFacets
} from '../lib/server/catalog/public-catalog';
import { homeHero } from '../lib/server/catalog/feature';
import { databaseFrom } from '../lib/server/db/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Catalog unavailable');
	const { filters, active } = browseFiltersFrom(url.searchParams);
	try {
		const [products, facets, hero] = await Promise.all([
			listPublicProducts(db, filters),
			publicFacets(db),
			homeHero(db)
		]);
		return { products, facets, hero, filters, filtered: active };
	} catch {
		error(503, 'Catalog unavailable');
	}
};
