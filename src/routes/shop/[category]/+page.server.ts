import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import {
	browseFiltersFrom,
	listPublicProducts,
	publicFacets
} from '../../../lib/server/catalog/public-catalog';
import { databaseFrom } from '../../../lib/server/db/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Catalog unavailable');
	const { filters, active } = browseFiltersFrom(url.searchParams);
	let facets;
	let products;
	try {
		facets = await publicFacets(db);
		const category = facets.categories.find((value) => value === params.category);
		products = category ? await listPublicProducts(db, { ...filters, category }) : null;
	} catch {
		error(503, 'Catalog unavailable');
	}
	// Categories without published stock stay 404 so no empty pages are indexed.
	if (!products) error(404, 'Category not found');
	const category = params.category as (typeof facets.categories)[number];
	return { category, products, facets, filters: { ...filters, category }, filtered: active };
};
