import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../lib/server/db/client';
import { error, redirect } from '@sveltejs/kit';
import { currentSlugFor, getPublicProductDetail } from '../../../lib/server/catalog/public-detail';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Catalog unavailable');
	let product;
	let moved = null;
	try {
		product = await getPublicProductDetail(db, params.slug);
		if (!product) moved = await currentSlugFor(db, params.slug);
	} catch {
		error(503, 'Catalog unavailable');
	}
	if (moved) redirect(308, `/products/${moved}`);
	if (!product) error(404, 'Product not found');
	setHeaders?.({ 'Cache-Control': 'no-store' });
	return { product };
};
