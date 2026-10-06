// Shop browsing state shared by the server (parsing) and the page (links and chips).
export type SortOrder = 'newest' | 'price-asc' | 'price-desc';

export type BrowseFilters = {
	category?: string;
	query?: string;
	sizes?: string[];
	minPrice?: number;
	maxPrice?: number;
	availableOnly?: boolean;
	sort?: SortOrder;
	chestMin?: number;
	chestMax?: number;
	waistMin?: number;
	waistMax?: number;
};

/** The query string for a set of filters; the category lives in the path, not here. */
export function browseQuery(filters: BrowseFilters, page = 1) {
	const pairs: [string, string | number | undefined][] = [
		['q', filters.query],
		...(filters.sizes ?? []).map((size): [string, string] => ['size', size]),
		['min_price', filters.minPrice],
		['max_price', filters.maxPrice],
		['chest_min', filters.chestMin],
		['chest_max', filters.chestMax],
		['waist_min', filters.waistMin],
		['waist_max', filters.waistMax],
		['available', filters.availableOnly ? 1 : undefined],
		['sort', filters.sort === 'newest' ? undefined : filters.sort],
		['page', page > 1 ? page : undefined]
	];
	const query = pairs
		.filter((pair): pair is [string, string | number] => pair[1] !== undefined && pair[1] !== '')
		.map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
		.join('&');
	return query ? `?${query}` : '';
}

/** How many narrowing choices are on; search and sort order are not filters. */
export function activeFilterCount(filters: BrowseFilters) {
	return (
		(filters.sizes?.length ?? 0) +
		[
			filters.minPrice,
			filters.maxPrice,
			filters.chestMin,
			filters.chestMax,
			filters.waistMin,
			filters.waistMax,
			filters.availableOnly
		].filter(Boolean).length
	);
}
