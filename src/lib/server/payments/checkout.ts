import { and, asc, eq, lte, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { orders, payments } from '../db/schema';
import {
	attachPayment,
	closeUnpaidOrder,
	holdForReview,
	settleVerifiedPayment,
	type OrderStatus
} from '../orders/lifecycle';
import type { ReservedOrder } from '../reservation/reserve';
import { invoiceForOrder, type PaymentProvider, type ProviderPayment } from './provider';

export type CallbackHint = 'success' | 'failure' | 'cancel' | null;

// Network calls happen outside D1 transactions; only verified provider results change stock.
export async function startPayment(
	db: Database,
	provider: PaymentProvider,
	order: Pick<ReservedOrder, 'id' | 'total_bdt'>,
	callbackUrl: string
) {
	const existing = await db
		.select({
			redirectUrl: payments.redirectUrl,
			status: payments.status,
			orderStatus: orders.status
		})
		.from(payments)
		.innerJoin(orders, eq(orders.id, payments.orderId))
		.where(eq(payments.orderId, order.id))
		.get();
	if (existing) {
		if (
			existing.status !== 'created' ||
			existing.orderStatus !== 'pending_payment' ||
			!existing.redirectUrl
		)
			throw new Error('Payment unavailable');
		return { redirectUrl: existing.redirectUrl };
	}
	const row = await db
		.select({ phone: sql<string>`json_extract(${orders.addressJson}, '$.phone')` })
		.from(orders)
		.where(and(eq(orders.id, order.id), eq(orders.status, 'pending_payment')))
		.get();
	if (!row) throw new Error('Payment unavailable');
	const { phone } = row;
	try {
		const created = await provider.create({
			amountBdt: order.total_bdt,
			invoice: invoiceForOrder(order.id),
			callbackUrl,
			payerReference: phone
		});
		await attachPayment(
			db,
			order.id,
			provider.name,
			created.paymentId,
			order.total_bdt,
			created.redirectUrl
		);
		return { redirectUrl: created.redirectUrl };
	} catch {
		// The buyer never received a payment page, so no charge can exist for this order.
		await closeUnpaidOrder(db, order.id, 'cancelled');
		throw new Error('Payment unavailable');
	}
}

function matches(
	result: ProviderPayment,
	payment: { paymentId: string; amountBdt: number },
	orderId: string
) {
	return (
		result.paymentId === payment.paymentId &&
		result.amountBdt === payment.amountBdt &&
		result.currency === 'BDT' &&
		result.invoice === invoiceForOrder(orderId) &&
		typeof result.trxId === 'string' &&
		result.trxId.length > 0
	);
}

export async function verifyPayment(
	db: Database,
	provider: PaymentProvider,
	paymentId: string,
	hint: CallbackHint
): Promise<OrderStatus> {
	const payment = await db
		.select({
			paymentId: payments.paymentId,
			orderId: payments.orderId,
			amountBdt: payments.amountBdt,
			status: orders.status,
			expired: sql<number>`${orders.expiresAt} <= datetime('now')`
		})
		.from(payments)
		.innerJoin(orders, eq(orders.id, payments.orderId))
		.where(eq(payments.paymentId, paymentId))
		.get();
	if (!payment) throw new Error('Unknown payment');
	const { orderId, status } = payment;
	if (status === 'paid') return status;

	const executable = hint === 'success' && status === 'pending_payment' && !payment.expired;
	let executed = false;
	let result: ProviderPayment;
	try {
		if (executable) {
			executed = true;
			result = await provider.execute(paymentId);
		} else result = await provider.query(paymentId);
	} catch {
		try {
			result = await provider.query(paymentId);
		} catch {
			await holdForReview(db, orderId);
			return currentStatus(db, orderId);
		}
	}

	if (result.status === 'completed') {
		if (matches(result, payment, orderId))
			return settleVerifiedPayment(db, paymentId, result.trxId as string);
		await holdForReview(db, orderId);
	} else if (result.status === 'failed' || result.status === 'cancelled') {
		await closeUnpaidOrder(db, orderId, 'cancelled');
	} else if (result.status === 'initiated' && result.paymentId === paymentId) {
		// An unexecuted payment cannot charge the buyer, and a tried payment ID cannot run again.
		if (executed || hint === 'failure' || hint === 'cancel')
			await closeUnpaidOrder(db, orderId, 'cancelled');
		else if (hint === null && payment.expired) await closeUnpaidOrder(db, orderId, 'expired');
	} else {
		await holdForReview(db, orderId);
	}
	return currentStatus(db, orderId);
}

async function currentStatus(db: Database, orderId: string): Promise<OrderStatus> {
	const row = await db
		.select({ status: orders.status })
		.from(orders)
		.where(eq(orders.id, orderId))
		.get();
	if (!row) throw new Error('Unknown order');
	return row.status;
}

export async function expireStaleOrders(db: Database, provider: PaymentProvider, limit = 20) {
	const stale = await db
		.select({ id: orders.id, paymentId: payments.paymentId })
		.from(orders)
		.leftJoin(payments, eq(payments.orderId, orders.id))
		.where(and(eq(orders.status, 'pending_payment'), lte(orders.expiresAt, sql`datetime('now')`)))
		.orderBy(asc(orders.expiresAt))
		.limit(limit);
	let expired = 0;
	for (const row of stale) {
		const status = row.paymentId
			? await verifyPayment(db, provider, row.paymentId, null)
			: (await closeUnpaidOrder(db, row.id, 'expired'))
				? 'expired'
				: null;
		if (status === 'expired') expired++;
	}
	return expired;
}
