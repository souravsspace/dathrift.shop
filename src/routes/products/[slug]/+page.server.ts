import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { getPublicProductDetail } from '../../../lib/server/catalog/public-detail';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const db = (env as { DB?: Parameters<typeof getPublicProductDetail>[0] }).DB;
	if (!db) error(503, 'Catalog unavailable');
	let product;
	try {
		product = await getPublicProductDetail(db, params.slug);
	} catch {
		error(503, 'Catalog unavailable');
	}
	if (!product) error(404, 'Product not found');
	setHeaders?.({ 'Cache-Control': 'no-store' });
	return { product };
};
