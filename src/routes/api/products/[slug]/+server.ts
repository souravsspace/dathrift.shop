import { getPublicProduct } from '../../../../lib/server/catalog/public-catalog';
import type { RequestHandler } from './$types';

type CatalogDb = Parameters<typeof getPublicProduct>[0];

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = (platform as { env?: { DB?: CatalogDb } } | undefined)?.env?.DB;
	if (!db) return unavailable();
	try {
		const product = await getPublicProduct(db, params.slug);
		if (!product) return new Response('Not found', { status: 404, headers: noStore });
		return Response.json(product, { headers: noStore });
	} catch {
		return unavailable();
	}
};

const noStore = { 'Cache-Control': 'no-store' };

function unavailable(): Response {
	return new Response('Catalog unavailable', { status: 503, headers: noStore });
}
