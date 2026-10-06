import { env } from 'cloudflare:workers';
import { error, redirect } from '@sveltejs/kit';
import { loadBrowsePage } from '../../../lib/server/catalog/browse-page';
import { databaseFrom } from '../../../lib/server/db/client';
import type { PageServerLoad } from './$types';

// One route serves /shop and /shop/<category>, so switching category keeps the page mounted and
// only swaps the pieces.
export const load: PageServerLoad = async ({ params, url }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Catalog unavailable');
	// A category chosen by query string has its own page.
	const chosen = url.searchParams.get('category');
	if (!params.category && chosen && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(chosen)) {
		const rest = url.search
			.slice(1)
			.split('&')
			.filter((pair) => pair && !pair.startsWith('category='))
			.join('&');
		redirect(308, `/shop/${chosen}${rest ? `?${rest}` : ''}`);
	}
	let browse;
	try {
		browse = await loadBrowsePage(db, url, params.category);
	} catch {
		error(503, 'Catalog unavailable');
	}
	// Categories without published stock stay 404 so no empty pages are indexed.
	if (!browse) error(404, 'Category not found');
	const { category, ...rest } = browse;
	return { ...rest, category: category?.slug ?? null, categoryName: category?.name ?? null };
};
