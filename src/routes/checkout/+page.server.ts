import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { databaseFrom } from '../../lib/server/db/client';
import { checkoutModeFor } from '../../lib/server/payments/select';
import { listDeliveryAreas } from '../../lib/server/shipping/quote';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Checkout unavailable');
	setHeaders({ 'Cache-Control': 'no-store' });
	try {
		const mode = checkoutModeFor(env, db, import.meta.env.DEV);
		return {
			checkout_enabled: mode !== null,
			// Manual bKash: the order page takes the payment; gateway: bKash's own page does.
			manual_payment: mode?.kind === 'manual',
			areas: await listDeliveryAreas(db, import.meta.env.DEV)
		};
	} catch {
		error(503, 'Checkout unavailable');
	}
};
