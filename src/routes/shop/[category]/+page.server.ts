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
	let category;
	let products;
	try {
		facets = await publicFacets(db);
		category = facets.categories.find((value) => value.slug === params.category);
		products = category
			? await listPublicProducts(db, { ...filters, category: category.slug })
			: null;
	} catch {
		error(503, 'Catalog unavailable');
	}
	// Categories without published stock stay 404 so no empty pages are indexed.
	if (!products || !category) error(404, 'Category not found');
	return {
		category: category.slug,
		categoryName: category.name,
		products,
		facets,
		filters: { ...filters, category: category.slug },
		filtered: active
	};
};
