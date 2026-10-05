import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { databaseFrom } from '../../lib/server/db/client';
import { paymentProviderFor } from '../../lib/server/payments/select';
import { listDeliveryAreas } from '../../lib/server/shipping/quote';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Checkout unavailable');
	setHeaders({ 'Cache-Control': 'no-store' });
	try {
		return {
			checkout_enabled: paymentProviderFor(env, db, import.meta.env.DEV) !== null,
			areas: await listDeliveryAreas(db, import.meta.env.DEV)
		};
	} catch {
		error(503, 'Checkout unavailable');
	}
};
