import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { listPublicProducts } from '../lib/server/catalog/public-catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const db = (env as { DB?: Parameters<typeof listPublicProducts>[0] }).DB;
	if (!db) error(503, 'Catalog unavailable');
	try {
		return { products: await listPublicProducts(db) };
	} catch {
		error(503, 'Catalog unavailable');
	}
};
