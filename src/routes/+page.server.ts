import { env } from 'cloudflare:workers';
import { databaseFrom } from '../lib/server/db/client';
import { error } from '@sveltejs/kit';
import { listPublicProducts } from '../lib/server/catalog/public-catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Catalog unavailable');
	try {
		return { products: await listPublicProducts(db) };
	} catch {
		error(503, 'Catalog unavailable');
	}
};
