import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { orderEvents, orders, payments } from '../db/schema';

export type OrderStatus = (typeof orders.status.enumValues)[number];

export async function attachPayment(
	db: Database,
	orderId: string,
	provider: 'bkash' | 'mock',
	paymentId: string,
	amountBdt: number,
	redirectUrl: string | null = null
) {
	await db.insert(payments).values({ paymentId, orderId, provider, amountBdt, redirectUrl });
}

async function orderStatus(db: Database, orderId: string) {
	const row = await db
		.select({ status: orders.status })
		.from(orders)
		.where(eq(orders.id, orderId))
		.get();
	if (!row) throw new Error('Unknown order');
	return row.status;
}

// Call only after the provider has verified a completed payment for this exact payment ID.
export async function settleVerifiedPayment(
	db: Database,
	paymentId: string,
	trxId: string
): Promise<OrderStatus> {
	const payment = await db
		.select({ orderId: payments.orderId })
		.from(payments)
		.where(eq(payments.paymentId, paymentId))
		.get();
	if (!payment) throw new Error('Unknown payment');
	const { orderId } = payment;
	const completePayment = () =>
		db
			.update(payments)
			.set({ status: 'completed', trxId, updatedAt: sql`CURRENT_TIMESTAMP` })
			.where(
				and(
					eq(payments.paymentId, paymentId),
					or(isNull(payments.trxId), eq(payments.trxId, trxId))
				)
			);
	const moveOrder = (to: OrderStatus, from: OrderStatus[]) =>
		db
			.update(orders)
			.set({ status: to })
			.where(and(eq(orders.id, orderId), inArray(orders.status, from)));
	const toReview = () =>
		db.batch([
			completePayment(),
			moveOrder('payment_review', ['pending_payment', 'expired', 'cancelled'])
		]);

	const current = await orderStatus(db, orderId);
	if (current === 'pending_payment' || current === 'payment_review') {
		try {
			await db.batch([completePayment(), moveOrder('paid', ['pending_payment', 'payment_review'])]);
		} catch (error) {
			if (!(error instanceof Error) || !errorText(error).includes('Units not held')) throw error;
			await toReview();
		}
	} else if (current !== 'paid') {
		await toReview();
	}
	return orderStatus(db, orderId);
}

// Drizzle wraps driver errors; the trigger message may sit on the cause.
const errorText = (error: Error): string =>
	`${error.message} ${error.cause instanceof Error ? errorText(error.cause) : ''}`;

// Releases held units. Without an actor only an unpaid pending order closes; the owner may
// also close a payment review after checking provider records.
export async function closeUnpaidOrder(
	db: Database,
	orderId: string,
	to: 'cancelled' | 'expired',
	actor?: string
): Promise<boolean> {
	const from: OrderStatus[] = actor ? ['pending_payment', 'payment_review'] : ['pending_payment'];
	const closedNow = sql`EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.id} = ${orderId} AND ${orders.status} = ${to})`;
	const close = db
		.update(orders)
		.set({ status: to })
		.where(and(eq(orders.id, orderId), inArray(orders.status, from)));
	const cancelPayment = db
		.update(payments)
		.set({ status: 'cancelled', updatedAt: sql`CURRENT_TIMESTAMP` })
		.where(and(eq(payments.orderId, orderId), eq(payments.status, 'created'), closedNow));
	const [closed] = await db.batch([close, cancelPayment]);
	if (actor && closed.meta.changes > 0)
		await db.insert(orderEvents).values({ orderId, actor, action: 'closed_by_staff' });
	return closed.meta.changes > 0;
}

export async function holdForReview(db: Database, orderId: string): Promise<boolean> {
	const result = await db
		.update(orders)
		.set({ status: 'payment_review' })
		.where(and(eq(orders.id, orderId), eq(orders.status, 'pending_payment')));
	return result.meta.changes > 0;
}
