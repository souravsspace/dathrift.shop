import {
	attachPayment,
	closeUnpaidOrder,
	holdForReview,
	settleVerifiedPayment,
	type OrderDb,
	type OrderStatus
} from '../orders/lifecycle';
import type { ReservedOrder } from '../reservation/reserve';
import { invoiceForOrder, type PaymentProvider, type ProviderPayment } from './provider';

type PaymentDb = OrderDb & {
	prepare(sql: string): {
		bind(...values: (string | number | null)[]): {
			first(): Promise<Record<string, unknown> | null>;
			run(): Promise<{ meta: { changes: number } }>;
			all(): Promise<{ results: Record<string, unknown>[] }>;
		};
	};
};

export type CallbackHint = 'success' | 'failure' | 'cancel' | null;

// Network calls happen outside D1 transactions; only verified provider results change stock.
export async function startPayment(
	db: PaymentDb,
	provider: PaymentProvider,
	order: Pick<ReservedOrder, 'id' | 'total_bdt'>,
	callbackUrl: string
) {
	const existing = await db
		.prepare(
			`SELECT p.redirect_url, p.status, o.status AS order_status FROM payments AS p
			 JOIN orders AS o ON o.id = p.order_id WHERE p.order_id = ?`
		)
		.bind(order.id)
		.first();
	if (existing) {
		if (
			existing.status !== 'created' ||
			existing.order_status !== 'pending_payment' ||
			typeof existing.redirect_url !== 'string'
		)
			throw new Error('Payment unavailable');
		return { redirectUrl: existing.redirect_url };
	}
	const row = await db
		.prepare(`SELECT address_json FROM orders WHERE id = ? AND status = 'pending_payment'`)
		.bind(order.id)
		.first();
	if (!row) throw new Error('Payment unavailable');
	const { phone } = JSON.parse(row.address_json as string) as { phone: string };
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

function matches(result: ProviderPayment, payment: Record<string, unknown>, orderId: string) {
	return (
		result.paymentId === payment.payment_id &&
		result.amountBdt === payment.amount_bdt &&
		result.currency === 'BDT' &&
		result.invoice === invoiceForOrder(orderId) &&
		typeof result.trxId === 'string' &&
		result.trxId.length > 0
	);
}

export async function verifyPayment(
	db: PaymentDb,
	provider: PaymentProvider,
	paymentId: string,
	hint: CallbackHint
): Promise<OrderStatus> {
	const payment = await db
		.prepare(
			`SELECT p.payment_id, p.order_id, p.amount_bdt, o.status,
			        o.expires_at <= datetime('now') AS expired
			 FROM payments AS p JOIN orders AS o ON o.id = p.order_id
			 WHERE p.payment_id = ?`
		)
		.bind(paymentId)
		.first();
	if (!payment) throw new Error('Unknown payment');
	const orderId = payment.order_id as string;
	const status = payment.status as OrderStatus;
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

async function currentStatus(db: PaymentDb, orderId: string) {
	const row = await db.prepare('SELECT status FROM orders WHERE id = ?').bind(orderId).first();
	return row?.status as OrderStatus;
}

export async function expireStaleOrders(db: PaymentDb, provider: PaymentProvider, limit = 20) {
	const { results } = await db
		.prepare(
			`SELECT o.id, p.payment_id FROM orders AS o
			 LEFT JOIN payments AS p ON p.order_id = o.id
			 WHERE o.status = 'pending_payment' AND o.expires_at <= datetime('now')
			 ORDER BY o.expires_at LIMIT ?`
		)
		.bind(limit)
		.all();
	let expired = 0;
	for (const row of results) {
		const status = row.payment_id
			? await verifyPayment(db, provider, row.payment_id as string, null)
			: (await closeUnpaidOrder(db, row.id as string, 'expired'))
				? 'expired'
				: null;
		if (status === 'expired') expired++;
	}
	return expired;
}
