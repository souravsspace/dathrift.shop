import { env } from 'cloudflare:workers';
import { error, fail } from '@sveltejs/kit';
import { manualProofSchema } from '../../../lib/checkout/manual-proof';
import { databaseFrom } from '../../../lib/server/db/client';
import { orderForStatusToken } from '../../../lib/server/orders/status';
import { expireStaleOrders } from '../../../lib/server/payments/checkout';
import { expireManualHolds, submitManualPayment } from '../../../lib/server/payments/manual';
import { paymentProviderFor } from '../../../lib/server/payments/select';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const db = databaseFrom(env);
	if (!db) error(503, 'Order status unavailable');
	setHeaders({ 'Cache-Control': 'no-store' });
	let order;
	try {
		order = await orderForStatusToken(db, params.token);
		if (order?.status === 'pending_payment') {
			const provider = paymentProviderFor(env, db, import.meta.env.DEV);
			if (order.manual) await expireManualHolds(db);
			else if (provider) await expireStaleOrders(db, provider);
			order = await orderForStatusToken(db, params.token);
		}
	} catch {
		error(503, 'Order status unavailable');
	}
	if (!order) error(404, 'Order not found');
	return { order, token: params.token };
};

export const actions: Actions = {
	// Manual bKash: the buyer reports the money they sent; staff confirm it before the order is paid.
	pay: async ({ request, params }) => {
		const db = databaseFrom(env);
		if (!db) return fail(503, { error: 'Payment could not be recorded. Please try again.' });
		const form = await request.formData();
		const proof = manualProofSchema.safeParse({
			plan: String(form.get('plan') ?? ''),
			trx_id: String(form.get('trx_id') ?? ''),
			sender_number: String(form.get('sender_number') ?? '')
		});
		if (!proof.success) {
			const errors: Record<string, string> = {};
			for (const issue of proof.error.issues) errors[String(issue.path[0])] ??= issue.message;
			return fail(400, { errors });
		}
		try {
			await submitManualPayment(db, params.token, proof.data);
			return { sent: true };
		} catch (failure) {
			const message = failure instanceof Error ? failure.message : '';
			if (message === 'Transaction ID already used')
				return fail(409, {
					errors: { trx_id: 'This transaction ID is already on another order. Check it again.' }
				});
			if (message === 'Hold expired')
				return fail(409, {
					error: 'Time ran out and the pieces were released. If you already paid, contact the shop.'
				});
			if (message === 'Order not waiting for payment')
				return fail(409, { error: 'This order is not waiting for a payment.' });
			return fail(503, { error: 'Payment could not be recorded. Please try again.' });
		}
	}
};
