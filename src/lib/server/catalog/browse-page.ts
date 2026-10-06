import type { Database } from '../db/client';
import {
	BROWSE_PAGE_SIZE,
	browseFiltersFrom,
	browsePageFrom,
	countPublicProducts,
	listPublicProducts,
	publicFacets
} from './public-catalog';

/**
 * Everything a shop page shows: the matching pieces (pages accumulate, so "Show more" keeps what
 * is already on screen), their total, and the facets the filter panel offers. Returns null for a
 * category that has no published pieces, so it can 404.
 */
export async function loadBrowsePage(db: Database, url: URL, categorySlug?: string) {
	const { filters, active } = browseFiltersFrom(url.searchParams);
	const page = browsePageFrom(url.searchParams);
	const facets = await publicFacets(db);
	const category = categorySlug
		? facets.categories.find((item) => item.slug === categorySlug)
		: undefined;
	if (categorySlug && !category) return null;
	if (category) filters.category = category.slug;
	else delete filters.category;
	const [products, total] = await Promise.all([
		listPublicProducts(db, filters, { limit: page * BROWSE_PAGE_SIZE }),
		countPublicProducts(db, filters)
	]);
	return { products, total, page, facets, filters, filtered: active, category: category ?? null };
}
