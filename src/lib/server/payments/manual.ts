import { and, eq, isNotNull, isNull, lte, notExists, sql } from 'drizzle-orm';
import { isMobile, normalizePhone } from '../../checkout/address';
import type { ManualProof } from '../../checkout/manual-proof';
import type { Database } from '../db/client';
import { databaseErrorText } from '../db/errors';
import { manualPayments, orderEvents, orders, payments } from '../db/schema';
import { closeUnpaidOrder, type OrderStatus } from '../orders/lifecycle';

// Until the shop has bKash merchant API access, buyers pay by bKash Send Money to the shop's
// personal number and give the transaction ID or the number they paid from; staff confirm the
// payment in the bKash app. Turned on with BKASH_MANUAL_PAYMENT=on and BKASH_MANUAL_NUMBER.
export const MANUAL_HOLD_MINUTES = 30;

export function manualBkashFrom(bindings: object): { payTo: string } | null {
	const env = bindings as Record<string, unknown>;
	if (env.BKASH_MANUAL_PAYMENT !== 'on' || typeof env.BKASH_MANUAL_NUMBER !== 'string') return null;
	const payTo = normalizePhone(env.BKASH_MANUAL_NUMBER);
	return isMobile(payTo) ? { payTo } : null;
}

/** Records where the buyer should send money and holds the pieces for 30 minutes. */
export async function startManualPayment(db: Database, orderId: string, payTo: string) {
	await db.batch([
		db
			.update(orders)
			.set({ expiresAt: sql`datetime(${orders.createdAt}, ${`+${MANUAL_HOLD_MINUTES} minutes`})` })
			.where(and(eq(orders.id, orderId), eq(orders.status, 'pending_payment'))),
		db.insert(manualPayments).values({ orderId, payTo }).onConflictDoNothing()
	]);
}

export async function manualPaymentFor(db: Database, orderId: string) {
	const row = await db
		.select({
			pay_to: manualPayments.payTo,
			plan: manualPayments.plan,
			amount_bdt: manualPayments.amountBdt,
			trx_id: manualPayments.trxId,
			sender_number: manualPayments.senderNumber,
			submitted_at: manualPayments.submittedAt,
			reviewed_by: manualPayments.reviewedBy,
			reviewed_at: manualPayments.reviewedAt
		})
		.from(manualPayments)
		.where(eq(manualPayments.orderId, orderId))
		.get();
	return row ?? null;
}

/**
 * The buyer says they have sent the money. The order moves to payment review, so its pieces stay
 * held (shown as sold out) until staff confirm or reject the payment.
 */
export async function submitManualPayment(
	db: Database,
	statusToken: string,
	proof: ManualProof
): Promise<OrderStatus> {
	const order = await db
		.select({
			id: orders.id,
			status: orders.status,
			shipping: orders.shippingBdt,
			total: orders.totalBdt,
			expired: sql<number>`${orders.expiresAt} <= datetime('now')`
		})
		.from(orders)
		.innerJoin(manualPayments, eq(manualPayments.orderId, orders.id))
		.where(eq(orders.statusToken, statusToken))
		.get();
	if (!order || order.status !== 'pending_payment')
		throw new Error('Order not waiting for payment');
	if (order.expired) {
		await closeUnpaidOrder(db, order.id, 'expired');
		throw new Error('Hold expired');
	}
	const amount = proof.plan === 'delivery' ? order.shipping : order.total;
	try {
		await db.batch([
			db
				.update(manualPayments)
				.set({
					plan: proof.plan,
					amountBdt: amount,
					trxId: proof.trx_id,
					senderNumber: proof.sender_number,
					submittedAt: sql`CURRENT_TIMESTAMP`
				})
				.where(and(eq(manualPayments.orderId, order.id), isNull(manualPayments.submittedAt))),
			db
				.update(orders)
				.set({ status: 'payment_review' })
				.where(and(eq(orders.id, order.id), eq(orders.status, 'pending_payment'))),
			db.insert(orderEvents).values({
				orderId: order.id,
				actor: 'buyer',
				action: 'manual_payment_sent',
				note: [
					proof.trx_id && `TxID ${proof.trx_id}`,
					proof.sender_number && `from ${proof.sender_number}`
				]
					.filter(Boolean)
					.join(', ')
			})
		]);
	} catch (error) {
		if (databaseErrorText(error).includes('manual_payments.trx_id'))
			throw new Error('Transaction ID already used', { cause: error });
		throw error;
	}
	return 'payment_review';
}

/** Staff found the money in the bKash app: the order is paid and its pieces are sold. */
export async function confirmManualPayment(db: Database, orderId: string, actor: string) {
	const submitted = and(
		eq(manualPayments.orderId, orderId),
		isNotNull(manualPayments.submittedAt),
		isNull(manualPayments.reviewedAt)
	);
	const waiting = await db
		.select({ status: orders.status })
		.from(manualPayments)
		.innerJoin(orders, eq(orders.id, manualPayments.orderId))
		.where(and(submitted, eq(orders.status, 'payment_review')))
		.get();
	if (!waiting) throw new Error('Nothing to confirm');
	await db.batch([
		db
			.update(manualPayments)
			.set({ reviewedBy: actor, reviewedAt: sql`CURRENT_TIMESTAMP` })
			.where(submitted),
		db
			.update(orders)
			.set({ status: 'paid' })
			.where(and(eq(orders.id, orderId), eq(orders.status, 'payment_review'))),
		db.insert(orderEvents).values({ orderId, actor, action: 'manual_payment_confirmed' })
	]);
}

/** Staff could not find the money: the order closes and its pieces go back on sale. */
export async function rejectManualPayment(db: Database, orderId: string, actor: string) {
	const closed = await closeUnpaidOrder(db, orderId, 'cancelled', actor);
	if (!closed) throw new Error('Nothing to reject');
	await db.batch([
		db
			.update(manualPayments)
			.set({ reviewedBy: actor, reviewedAt: sql`CURRENT_TIMESTAMP` })
			.where(eq(manualPayments.orderId, orderId)),
		db.insert(orderEvents).values({ orderId, actor, action: 'manual_payment_rejected' })
	]);
}

/** Closes unpaid holds whose time is up; there is no provider to ask for a manual payment. */
export async function expireManualHolds(db: Database, limit = 20) {
	const stale = await db
		.select({ id: orders.id })
		.from(orders)
		.where(
			and(
				eq(orders.status, 'pending_payment'),
				lte(orders.expiresAt, sql`datetime('now')`),
				notExists(
					db
						.select({ id: payments.paymentId })
						.from(payments)
						.where(eq(payments.orderId, orders.id))
				)
			)
		)
		.limit(limit);
	let expired = 0;
	for (const row of stale) if (await closeUnpaidOrder(db, row.id, 'expired')) expired++;
	return expired;
}
