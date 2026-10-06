import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { databaseFrom } from '../../../lib/server/db/client';
import { orderForStatusToken } from '../../../lib/server/orders/status';
import { expireStaleOrders } from '../../../lib/server/payments/checkout';
import { paymentProviderFor } from '../../../lib/server/payments/select';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Order status unavailable');
	setHeaders({ 'Cache-Control': 'no-store' });
	let order;
	try {
		order = await orderForStatusToken(db, params.token);
		const provider = paymentProviderFor(env, db, import.meta.env.DEV);
		if (order?.status === 'pending_payment' && provider) {
			await expireStaleOrders(db, provider);
			order = await orderForStatusToken(db, params.token);
		}
	} catch {
		error(503, 'Order status unavailable');
	}
	if (!order) error(404, 'Order not found');
	return { order, token: params.token };
};
