import { env } from 'cloudflare:workers';
import { error, fail } from '@sveltejs/kit';
import { databaseFrom } from '../../../../lib/server/db/client';
import { getStaffOrder, recordFulfillment } from '../../../../lib/server/orders/admin';
import { closeUnpaidOrder } from '../../../../lib/server/orders/lifecycle';
import { verifyPayment } from '../../../../lib/server/payments/checkout';
import { paymentProviderFor } from '../../../../lib/server/payments/select';
import { isOwnerActor, staffActorForRequest } from '../../../../lib/server/staff-auth';
import type { Actions, PageServerLoad } from './$types';

async function staff(request: Request) {
	const actor = await staffActorForRequest(request, env, import.meta.env.DEV);
	if (!actor) error(403, 'Staff access required');
	const db = databaseFrom(env);
	if (!db) error(503, 'Orders unavailable');
	return { actor, db, isOwner: isOwnerActor(actor, env, import.meta.env.DEV) };
}

export const load: PageServerLoad = async ({ request, params, setHeaders }) => {
	const { db, isOwner } = await staff(request);
	setHeaders({ 'Cache-Control': 'no-store' });
	let order;
	try {
		order = await getStaffOrder(db, params.id);
	} catch {
		error(503, 'Orders unavailable');
	}
	if (!order) error(404, 'Order not found');
	return { order, is_owner: isOwner };
};

export const actions: Actions = {
	fulfillment: async ({ request, params }) => {
		const { actor, db } = await staff(request);
		const form = await request.formData();
		try {
			await recordFulfillment(db, params.id, actor, {
				state: String(form.get('state') ?? ''),
				courier: String(form.get('courier') ?? ''),
				tracking_code: String(form.get('tracking_code') ?? '')
			});
			return { message: 'Fulfillment updated.' };
		} catch (failure) {
			const message = failure instanceof Error ? failure.message : '';
			if (message === 'Invalid fulfillment')
				return fail(400, { error: 'Choose a state; dispatch needs a tracking code.' });
			if (message === 'Order not paid' || message === 'Invalid fulfillment transition')
				return fail(409, { error: 'Fulfillment can only move forward on a paid order.' });
			return fail(503, { error: 'Orders unavailable.' });
		}
	},

	// Owner-only: ask the provider again; only its verified answer can settle the order.
	recheck: async ({ request, params }) => {
		const { db, isOwner } = await staff(request);
		if (!isOwner) return fail(403, { error: 'Only the owner can resolve payments.' });
		const provider = paymentProviderFor(env, db, import.meta.env.DEV);
		const order = await getStaffOrder(db, params.id);
		if (!order?.payment || !provider) return fail(409, { error: 'No provider payment to check.' });
		try {
			const status = await verifyPayment(db, provider, order.payment.payment_id, null);
			return { message: `Provider check complete. Order is now ${status}.` };
		} catch {
			return fail(503, { error: 'Provider check failed; the order is unchanged.' });
		}
	},

	// Owner-only: after confirming in bKash records that no charge stands (or it was refunded).
	close: async ({ request, params }) => {
		const { actor, db, isOwner } = await staff(request);
		if (!isOwner) return fail(403, { error: 'Only the owner can resolve payments.' });
		const form = await request.formData();
		if (form.get('confirm') !== 'checked-provider')
			return fail(400, { error: 'Confirm you checked bKash records first.' });
		const closed = await closeUnpaidOrder(db, params.id, 'cancelled', actor);
		if (!closed) return fail(409, { error: 'Only a pending or held order can be closed.' });
		return { message: 'Order closed and pieces released.' };
	}
};
