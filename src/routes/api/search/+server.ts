import { env } from 'cloudflare:workers';
import {
	browseFiltersFrom,
	countPublicProducts,
	listPublicProducts
} from '../../../lib/server/catalog/public-catalog';
import { databaseFrom } from '../../../lib/server/db/client';
import type { RequestHandler } from './$types';

const noStore = { 'Cache-Control': 'no-store' };

// Quick suggestions for the search sheet; the full results live on /shop?q=.
export const GET: RequestHandler = async ({ url }) => {
	const db = databaseFrom(env);
	if (!db) return unavailable();
	const { query } = browseFiltersFrom(
		new URLSearchParams({ q: url.searchParams.get('q') ?? '' })
	).filters;
	if (!query) return Response.json({ total: 0, items: [] }, { headers: noStore });
	try {
		const [items, total] = await Promise.all([
			listPublicProducts(db, { query }, { limit: 6 }),
			countPublicProducts(db, { query })
		]);
		return Response.json(
			{
				total,
				items: items.map((item) => ({
					slug: item.slug,
					name: item.name,
					category_name: item.category_name,
					price_bdt: item.price_bdt,
					size_label: item.size_label,
					stock_state: item.stock_state,
					photo_key: item.photo_key,
					photo_alt: item.photo_alt
				}))
			},
			{ headers: noStore }
		);
	} catch {
		return unavailable();
	}
};

function unavailable(): Response {
	return new Response('Catalog unavailable', { status: 503, headers: noStore });
}
