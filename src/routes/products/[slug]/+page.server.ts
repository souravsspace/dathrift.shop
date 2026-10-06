import { env } from 'cloudflare:workers';
import { databaseFrom } from '../../../lib/server/db/client';
import { error, redirect } from '@sveltejs/kit';
import { listPublicProducts } from '../../../lib/server/catalog/public-catalog';
import { currentSlugFor, getPublicProductDetail } from '../../../lib/server/catalog/public-detail';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Catalog unavailable');
	let product: Awaited<ReturnType<typeof getPublicProductDetail>> = null;
	let moved = null;
	let related: Awaited<ReturnType<typeof listPublicProducts>> = [];
	try {
		product = await getPublicProductDetail(db, params.slug);
		if (!product) moved = await currentSlugFor(db, params.slug);
		// A few more available pieces from the same rail, for when this one is not right.
		else
			related = (
				await listPublicProducts(
					db,
					{ category: product.category, availableOnly: true },
					{ limit: 5 }
				)
			)
				.filter((item) => item.id !== product?.id)
				.slice(0, 4);
	} catch {
		error(503, 'Catalog unavailable');
	}
	if (moved) redirect(308, `/products/${moved}`);
	if (!product) error(404, 'Product not found');
	setHeaders?.({ 'Cache-Control': 'no-store' });
	return { product, related };
};
